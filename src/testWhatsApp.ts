import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import fs from 'fs';

console.log('WhatsApp Web Connection Test');
console.log('===========================');
console.log('This script will attempt to connect to WhatsApp Web and generate a QR code');
console.log('Scan the QR code with your phone to authenticate\n');

// Create session directory if it doesn't exist
const sessionDir = './whatsapp-session';
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log(`Created session directory at ${sessionDir}`);
}

// Basic client with minimal options
const client = new Client({
  authStrategy: new LocalAuth({
    dataPath: sessionDir,
  }),
  puppeteer: {
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  },
});

// Handle QR code generation
client.on('qr', (qr) => {
  console.log('QR code received. Scan with your phone:');
  qrcode.generate(qr, { small: true });
});

// Debug events
client.on('loading_screen', (percent, message) => {
  console.log(`Loading: ${percent}% - ${message}`);
});

client.on('authenticated', () => {
  console.log('AUTHENTICATED SUCCESSFULLY!');
});

client.on('auth_failure', (msg) => {
  console.error('AUTHENTICATION FAILURE', msg);
});

client.on('ready', () => {
  console.log('CLIENT IS READY!');
  console.log('You can now use the WhatsApp Emergency Detection Agent');
  console.log('Press Ctrl+C to exit this test');
});

client.on('disconnected', (reason) => {
  console.log('Client was disconnected', reason);
});

// Start the client
console.log('Initializing client...');
client.initialize().catch((err) => {
  console.error('Failed to initialize client:', err);
});
