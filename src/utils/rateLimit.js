import { Message } from '../models/index.js';
import { Op } from 'sequelize';

const DAILY_MESSAGE_LIMIT = 45;

export const checkRateLimit = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const messageCount = await Message.count({
        where: {
            user_id: userId,
            createdAt: {
                [Op.gte]: today
            }
        }
    });

    return messageCount < DAILY_MESSAGE_LIMIT;
};
