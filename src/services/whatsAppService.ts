import { Client, LocalAuth, MessageTypes, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';
import { monitoredGroupIds } from '../config';
import logger from '../utils/logger';
import { classifyMessage } from './classificationService';
import { sendAlertToAdmin } from './alertService';
import { FlaggedMessage, EmergencyCategory } from '../models/flaggedMessage';
import { WhatsAppMessage, MessageContext, AlertNotification } from '../types';

// Maximum number of previous messages to store for context
const MAX_CONTEXT_MESSAGES = 5;

// Store recent messages per group for context
const recentMessagesCache: Record<string, WhatsAppMessage[]> = {};

/**
 * Initialize the WhatsApp client
 */
export function initWhatsAppClient(): Client {
  logger.info('Starting WhatsApp client initialization...');

  // Create session directory if it doesn't exist
  const sessionDir = './whatsapp-session';
  if (!fs.existsSync(sessionDir)) {
    fs.mkdirSync(sessionDir, { recursive: true });
    logger.info(`Created session directory at ${sessionDir}`);
  }

  // Create a new WhatsApp client with local authentication
  const client = new Client({
    authStrategy: new LocalAuth({
      dataPath: sessionDir,
    }),
    puppeteer: {
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
      ],
      defaultViewport: null,
    },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  });

  // Handle QR code generation
  client.on('qr', (qr) => {
    logger.info('New QR code received. Scan with your phone to authenticate');
    console.log('\nScan the QR code below with your WhatsApp app:\n');
    qrcode.generate(qr, { small: true });
    console.log('\nWaiting for you to scan with WhatsApp...\n');
  });

  // Handle loading screen events
  client.on('loading_screen', (percent, message) => {
    logger.info(`WhatsApp loading: ${percent}% - ${message}`);
  });

  // Handle authentication
  client.on('authenticated', () => {
    logger.info('WhatsApp client authenticated successfully');
  });

  // Handle authentication failures
  client.on('auth_failure', (error) => {
    logger.error('WhatsApp authentication failed', error);
    console.log('\nAuthentication failed. Please try again with a new QR code.\n');
  });

  // Handle ready state
  client.on('ready', () => {
    logger.info('WhatsApp client is ready and connected');
    console.log('\nWhatsApp client is now connected and ready to monitor messages!\n');
  });

  // Handle disconnects
  client.on('disconnected', (reason) => {
    logger.warn('WhatsApp client disconnected', { reason });
    console.log(`\nDisconnected from WhatsApp: ${reason}\n`);

    // Try to reconnect when the client is disconnected
    logger.info('Attempting to reconnect WhatsApp client...');
    setTimeout(() => {
      client.initialize().catch((error) => {
        logger.error('Failed to reconnect WhatsApp client', error);
      });
    }, 5000); // Wait 5 seconds before reconnecting
  });

  // Handle messages
  client.on('message', async (message: Message) => {
    try {
      await processIncomingMessage(client, message);
    } catch (error) {
      logger.error('Error processing message', error);
    }
  });

  // Handle any initialization errors
  client.on('change_state', (state) => {
    logger.info(`WhatsApp connection state changed to: ${state}`);
  });

  return client;
}

/**
 * Convert whatsapp-web.js Message to internal WhatsAppMessage format
 */
function convertMessage(message: Message): WhatsAppMessage {
  return {
    id: message.id._serialized,
    body: message.body,
    from: message.from,
    to: message.to,
    timestamp: message.timestamp,
    type: message.type,
    hasMedia: message.hasMedia,
    author: message.author, // Author is the sender's ID in group chats
  };
}

/**
 * Process an incoming message
 */
async function processIncomingMessage(client: Client, message: Message): Promise<void> {
  // Only process text messages
  if (message.type !== MessageTypes.TEXT) {
    return;
  }

  // Skip messages from the admin (to avoid processing our own alerts)
  if (message.from === client.info.wid._serialized) {
    return;
  }

  // Check if the message is from a monitored group
  const groupId = message.from;
  if (!monitoredGroupIds.includes(groupId)) {
    // Not a monitored group, skip processing
    return;
  }

  // Convert to internal format
  const whatsAppMessage = convertMessage(message);

  // Update recent messages cache for this group
  if (!recentMessagesCache[groupId]) {
    recentMessagesCache[groupId] = [];
  }

  // Add to cache and limit size
  recentMessagesCache[groupId].push(whatsAppMessage);
  if (recentMessagesCache[groupId].length > MAX_CONTEXT_MESSAGES) {
    recentMessagesCache[groupId].shift();
  }

  // Get previous messages for context (excluding this message)
  const previousMessages = [...recentMessagesCache[groupId]].slice(0, -1);

  // Create message context
  const messageContext: MessageContext = {
    message: whatsAppMessage,
    previousMessages,
    groupId,
  };

  // Classify the message
  logger.debug('Classifying message', { messageId: whatsAppMessage.id });
  const classificationResult = await classifyMessage(messageContext);

  // If classified as emergency and confidence exceeds threshold, create alert
  if (classificationResult.isEmergency && classificationResult.emergencyCategory) {
    logger.info('Emergency detected', {
      category: classificationResult.emergencyCategory,
      confidence: classificationResult.confidenceScore,
      messageId: whatsAppMessage.id,
    });

    // Create a flagged message record
    const flaggedMessage = new FlaggedMessage({
      messageId: whatsAppMessage.id,
      groupId,
      senderId: whatsAppMessage.author || whatsAppMessage.from,
      messageText: whatsAppMessage.body,
      timestamp: new Date(whatsAppMessage.timestamp * 1000),
      emergencyCategory: classificationResult.emergencyCategory,
      confidenceScore: classificationResult.confidenceScore,
      contextMessages: previousMessages.map((m) => `${m.author || m.from}: ${m.body}`),
      processed: true,
    });

    // Save the flagged message
    await flaggedMessage.save();

    // Prepare notification for admin
    const notification: AlertNotification = {
      messageText: whatsAppMessage.body,
      emergencyCategory: classificationResult.emergencyCategory as EmergencyCategory,
      confidenceScore: classificationResult.confidenceScore,
      groupId,
      senderId: whatsAppMessage.author || whatsAppMessage.from,
      timestamp: new Date(whatsAppMessage.timestamp * 1000),
      contextMessages: previousMessages.map((m) => `${m.author || m.from}: ${m.body}`),
    };

    // Send the alert to admin
    const alertSent = await sendAlertToAdmin(client, notification);

    // Update the notification status
    if (alertSent) {
      flaggedMessage.notificationSent = true;
      await flaggedMessage.save();
    }
  }
}
