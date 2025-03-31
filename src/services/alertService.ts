import { Client, Message } from 'whatsapp-web.js';
import { env } from '../config';
import logger from '../utils/logger';
import { AlertNotification } from '../types';
import { EmergencyCategory } from '../models/flaggedMessage';

/**
 * Format an alert message for sending to admin
 */
function formatAlertMessage(alert: AlertNotification): string {
  // Get category label for display
  const categoryLabels: Record<EmergencyCategory, string> = {
    [EmergencyCategory.MENTAL_HEALTH]: '🧠 Mental Health',
    [EmergencyCategory.MEDICAL]: '🚑 Medical',
    [EmergencyCategory.CONFLICT]: '⚠️ Conflict/Aggression',
    [EmergencyCategory.OTHER]: '🔔 Other Emergency',
  };

  // Format the confidence score as a percentage
  const confidenceFormatted = Math.round(alert.confidenceScore * 100);

  // Build the alert message
  let alertMessage = `🚨 *EMERGENCY ALERT* 🚨\n\n`;
  alertMessage += `*Category:* ${categoryLabels[alert.emergencyCategory]}\n`;
  alertMessage += `*Confidence:* ${confidenceFormatted}%\n`;
  alertMessage += `*Group:* ${alert.groupId}\n`;
  alertMessage += `*Time:* ${alert.timestamp.toLocaleString()}\n\n`;
  alertMessage += `*Message:*\n${alert.messageText}\n\n`;

  // Add context messages if available
  if (alert.contextMessages && alert.contextMessages.length > 0) {
    alertMessage += `*Recent Context:*\n${alert.contextMessages.join('\n')}\n\n`;
  }

  alertMessage += `_This is an automated alert from the WhatsApp Emergency Detection system._`;

  return alertMessage;
}

/**
 * Send an alert notification to the admin
 */
export async function sendAlertToAdmin(
  client: Client,
  notification: AlertNotification,
): Promise<boolean> {
  try {
    const formattedMessage = formatAlertMessage(notification);

    // Send the message to the admin
    await client.sendMessage(env.ADMIN_PHONE_NUMBER, formattedMessage);

    logger.info('Alert sent to admin', {
      category: notification.emergencyCategory,
      groupId: notification.groupId,
    });

    return true;
  } catch (error) {
    logger.error('Failed to send alert to admin', error);
    return false;
  }
}
