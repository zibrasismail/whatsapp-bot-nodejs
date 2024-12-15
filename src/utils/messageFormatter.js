export const formatMessages = (messages) => {
    return messages.map(msg => ({
        role: msg.role,
        content: msg.content
    })).reverse();
};
