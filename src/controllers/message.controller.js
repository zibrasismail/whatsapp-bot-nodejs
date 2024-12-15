import { Message, User } from '../models/index.js';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';

// Rate limiting configuration
const rateLimits = {
    requestsPerDay: 45, // Keep buffer below the 50 limit
    requestCounts: new Map(),
    lastReset: new Date()
};

const openai = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN,
    defaultHeaders: {
        'Content-Type': 'application/json'
    },
    timeout: 30000,
    maxRetries: 3
});

// Function to check and update rate limits
function checkRateLimit(userId) {
    const now = new Date();
    const today = now.toDateString();

    // Reset counts if it's a new day
    if (rateLimits.lastReset.toDateString() !== today) {
        rateLimits.requestCounts.clear();
        rateLimits.lastReset = now;
    }

    // Get current count for user
    const userCount = rateLimits.requestCounts.get(userId) || 0;

    // Check if user has exceeded limit
    if (userCount >= rateLimits.requestsPerDay) {
        const secondsUntilReset = Math.ceil(
            (new Date(rateLimits.lastReset.getTime() + 24 * 60 * 60 * 1000) - now) / 1000
        );
        throw new Error(`Daily message limit reached. Please try again in ${Math.ceil(secondsUntilReset / 3600)} hours.`);
    }

    // Update count
    rateLimits.requestCounts.set(userId, userCount + 1);
    return true;
}

async function getConversationContext(phoneNumber) {
    try {
        const messages = await Message.findAll({
            where: { phoneNumber: phoneNumber },
            order: [['createdAt', 'DESC']],
            limit: 5
        });

        return messages.reverse().map(msg => ({
            role: msg.role,
            content: msg.content
        }));
    } catch (error) {
        console.error('Error getting conversation context:', error);
        return [];
    }
}

async function handleIncomingMessage(msg) {
    try {
        // Ignore messages from the bot itself
        if (msg.fromMe) {
            console.log('Ignoring bot\'s own message');
            return;
        }

        // Ignore broadcast messages
        if (msg.from === 'status@broadcast') {
            console.log('Ignoring broadcast message');
            return;
        }

        // Check if message is from a group
        if (msg.from.endsWith('@g.us')) {
            console.log('Ignoring group message');
            return;
        }

        // Ignore empty messages or media messages
        if (!msg.body || msg.hasMedia) {
            console.log('Ignoring empty or media message');
            return;
        }

        const phoneNumber = msg.from;
        const content = msg.body;
        const sessionId = uuidv4();

        // Get or create user
        const [user] = await User.findOrCreate({
            where: { phoneNumber: phoneNumber },
            defaults: { messageCount: 0 }
        });

        // Check rate limit before processing
        try {
            checkRateLimit(user.userId);
        } catch (rateLimitError) {
            await msg.reply(rateLimitError.message);
            return;
        }

        // Save user message
        await Message.create({
            phoneNumber: phoneNumber,
            content: content,
            role: 'user',
            sessionId: sessionId,
            messageInfo: {
                fromMe: msg._data.id.fromMe,
                remote: msg._data.id.remote,
                id: msg._data.id.id,
                serialized: msg._data.id._serialized
            },
            userId: user.userId
        });

        // Increment message count
        await user.increment('messageCount');

        // Get conversation context
        const context = await getConversationContext(phoneNumber);

        // Prepare messages for GPT
        const messages = [
            { 
                role: "system", 
                content: "You are a helpful and friendly WhatsApp assistant. Keep your responses concise and natural, as if chatting with a friend. Remember previous context of the conversation." 
            },
            ...context,
            { role: "user", content }
        ];

        try {
            // Show typing indicator
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            // Get AI response
            const completion = await openai.chat.completions.create({
                messages,
                model: "gpt-4o",
                temperature: 0.7,
                max_tokens: 150,
                top_p: 1
            });

            if (!completion?.choices?.[0]?.message?.content) {
                throw new Error('Invalid response from OpenAI');
            }

            const aiResponse = completion.choices[0].message.content;

            // Send and save AI response
            await msg.reply(aiResponse);
            await Message.create({
                phoneNumber: phoneNumber,
                content: aiResponse,
                role: 'assistant',
                sessionId: sessionId,
                messageInfo: {
                    fromMe: true,
                    remote: phoneNumber,
                    id: aiResponse,
                    serialized: sessionId
                },
                userId: user.userId
            });

        } catch (apiError) {
            console.error('OpenAI API Error:', apiError);
            let errorMessage = 'Sorry, I encountered an error. ';

            if (apiError.status === 429) {
                const retryAfter = apiError.headers?.['retry-after'] || 86400;
                const hoursToWait = Math.ceil(retryAfter / 3600);
                errorMessage += `API rate limit reached. Please try again in ${hoursToWait} hours.`;
                
                // Reset user's count to prevent further attempts
                rateLimits.requestCounts.set(phoneNumber, rateLimits.requestsPerDay);
            } else {
                errorMessage += 'Please try again later.';
            }

            await msg.reply(errorMessage);
        }

    } catch (error) {
        console.error('Error handling message:', error);
        try {
            await msg.reply('Sorry, I encountered an error processing your message. Please try again later.');
        } catch (replyError) {
            console.error('Error sending error reply:', replyError);
        }
    }
}

export { handleIncomingMessage };
