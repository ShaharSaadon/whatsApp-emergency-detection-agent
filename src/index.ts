import { connectDatabase } from './utils/database';
import { initWhatsAppClient } from './services/whatsAppService';
import logger from './utils/logger';

/**
 * Main application startup function
 */
async function startApp(): Promise<void> {
  try {
    console.log('\n🤖 Starting WhatsApp Emergency Detection Agent...\n');
    logger.info('Application starting up');

    // Connect to database
    console.log('Connecting to database...');
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Initialize WhatsApp client
    console.log('\nInitializing WhatsApp client...');
    console.log('A browser window will open to connect to WhatsApp Web');
    console.log('Please wait for the QR code to appear in the terminal...\n');

    const whatsAppClient = initWhatsAppClient();

    // Start WhatsApp client
    console.log('Starting WhatsApp client...');
    await whatsAppClient.initialize();

    // The client will handle events through its event listeners

    logger.info('✅ Application successfully started');
    console.log('\nThe application is now running and monitoring WhatsApp messages');
    console.log('Press Ctrl+C to stop the application\n');
  } catch (error) {
    logger.error('❌ Failed to start application:', error);
    console.error('\n❌ Application failed to start:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', reason);
  console.error('\n❌ Unhandled Promise Rejection:', reason);
  // Don't exit the process as the app should be resilient
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('\n❌ Uncaught Exception:', error);
  // Exit with error in case of uncaught exception
  process.exit(1);
});

// Exit handler
process.on('SIGINT', () => {
  logger.info('Application shutdown requested');
  console.log('\n👋 Shutting down application...');
  console.log('Closing connections and cleaning up...');
  setTimeout(() => {
    console.log('✅ Application has been shut down');
    process.exit(0);
  }, 1000);
});

// Start the application
startApp().catch((error) => {
  logger.error('Error during startup:', error);
  console.error('\n❌ Error during startup:', error);
  process.exit(1);
});
