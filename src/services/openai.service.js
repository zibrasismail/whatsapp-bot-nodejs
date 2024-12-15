import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
    baseURL: "https://models.inference.ai.azure.com",
    apiKey: process.env.GITHUB_TOKEN,
    defaultQuery: { "api-version": "2023-03-15-preview" },
    defaultHeaders: { "api-key": process.env.GITHUB_TOKEN }
});

export const generateResponse = async (messages) => {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: messages,
            temperature: 1,
            max_tokens: 4096,
            top_p: 1
        });
        return completion.choices[0].message.content;
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw error;
    }
};

export default openai;
