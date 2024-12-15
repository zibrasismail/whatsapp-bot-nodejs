import pkg from 'whatsapp-web.js';
const { Client } = pkg;
import qrcode from 'qrcode-terminal';
import clientConfig from '../config/whatsapp.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');
const AUTH_PATH = path.join(PROJECT_ROOT, '.wwebjs_auth');

class WhatsAppService {
    constructor() {
        this.client = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.ensureAuthDirectory();
    }

    ensureAuthDirectory() {
        try {
            // Create auth directory if it doesn't exist
            if (!fs.existsSync(AUTH_PATH)) {
                fs.mkdirSync(AUTH_PATH, { recursive: true });
                console.log('Created auth directory:', AUTH_PATH);
            }

            // Clean up session directory if it exists
            const sessionPath = path.join(AUTH_PATH, 'session');
            if (fs.existsSync(sessionPath)) {
                const debugLogPath = path.join(sessionPath, 'Default', 'chrome_debug.log');
                if (fs.existsSync(debugLogPath)) {
                    try {
                        fs.unlinkSync(debugLogPath);
                        console.log('Cleaned up debug log file');
                    } catch (error) {
                        console.warn('Warning: Could not clean up debug log file:', error.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error managing auth directory:', error);
        }
    }

    async initialize() {
        try {
            if (this.client) {
                await this.client.destroy();
                this.client = null;
            }

            // Check if auth data exists
            const authExists = fs.existsSync(path.join(AUTH_PATH, 'session'));
            if (authExists) {
                console.log('Found existing auth data');
            } else {
                console.log('No existing auth data found, will need to scan QR code');
            }

            this.client = new Client(clientConfig);
            this.setupEventHandlers();
            await this.client.initialize();
            return this.client;
        } catch (error) {
            console.error('Error initializing WhatsApp service:', error);
            this.handleReconnection();
            throw error;
        }
    }

    handleReconnection() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
            
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
            }
            
            this.reconnectTimeout = setTimeout(() => {
                this.initialize().catch(console.error);
            }, 5000);
        } else {
            console.error('Max reconnection attempts reached. Please restart the application.');
            process.exit(1);
        }
    }

    setupEventHandlers() {
        this.client.on('qr', (qr) => {
            console.log('QR Code received (scan this code with WhatsApp):');
            qrcode.generate(qr, { small: true });
        });

        this.client.on('ready', () => {
            console.log('WhatsApp client is ready!');
            this.reconnectAttempts = 0;
        });

        this.client.on('authenticated', () => {
            console.log('WhatsApp client is authenticated!');
            this.reconnectAttempts = 0;
        });

        this.client.on('auth_failure', (msg) => {
            console.error('WhatsApp authentication failed:', msg);
            // Clean up auth directory on auth failure
            try {
                const sessionPath = path.join(AUTH_PATH, 'session');
                if (fs.existsSync(sessionPath)) {
                    fs.rmSync(sessionPath, { recursive: true, force: true });
                    console.log('Cleaned up invalid auth data');
                }
            } catch (error) {
                console.warn('Warning: Could not clean up auth directory:', error.message);
            }
            this.handleReconnection();
        });

        this.client.on('disconnected', (reason) => {
            console.log('WhatsApp Web disconnected:', reason);
            if (reason !== 'NAVIGATION') {
                this.handleReconnection();
            }
        });

        this.client.on('change_state', (state) => {
            console.log('WhatsApp connection state:', state);
        });

        this.client.on('loading_screen', (percent, message) => {
            console.log('Loading:', percent, '%', message);
        });
    }

    getClient() {
        return this.client;
    }
}

export default new WhatsAppService();
