import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import path from 'path';
import { fileURLToPath } from 'url';

// Get the absolute path to the project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '../../');

// Set absolute path for auth data
const AUTH_PATH = path.join(PROJECT_ROOT, '.wwebjs_auth');

const clientConfig = {
    authStrategy: new LocalAuth({
        dataPath: AUTH_PATH,
        clientId: 'whatsapp-bot'
    }),
    puppeteer: {
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ],
        headless: true
    },
    qrMaxRetries: 3,
    restartOnAuthFail: true,
    takeoverOnConflict: true,
    takeoverTimeoutMs: 10000
};

export default clientConfig;
