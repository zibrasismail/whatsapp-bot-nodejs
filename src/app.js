import dotenv from 'dotenv';
import { syncDatabase } from './models/index.js';
import whatsappService from './services/whatsapp.service.js';
import { handleIncomingMessage } from './controllers/message.controller.js';

// Load environment variables
dotenv.config();

// Check environment variables
if (!process.env.GITHUB_TOKEN || !process.env.DATABASE_URL) {
    console.error('ERROR: Required environment variables are not set in .env file');
    process.exit(1);
}

const initialize = async () => {
    try {
        // Sync database
        await syncDatabase();
        
        // Initialize WhatsApp client
        await whatsappService.initialize();
        
        // Get the client instance
        const client = whatsappService.getClient();
        
        // Set up message handler
        client.on('message_create', handleIncomingMessage);
        
        console.log('WhatsApp bot initialized successfully!');
    } catch (error) {
        console.error('Error initializing application:', error);
        process.exit(1);
    }
};

initialize();
