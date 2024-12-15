import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

export const User = sequelize.define('User', {
    userId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'user_id'
    },
    phoneNumber: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        field: 'phone_number'
    },
    messageCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        field: 'message_count'
    }
}, {
    tableName: 'users',
    underscored: true,
    timestamps: true
});

export const Message = sequelize.define('Message', {
    messageId: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        field: 'message_id'
    },
    phoneNumber: {
        type: DataTypes.STRING,
        allowNull: false,
        field: 'phone_number'
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('user', 'assistant'),
        allowNull: false
    },
    sessionId: {
        type: DataTypes.STRING,
        allowNull: true,
        field: 'session_id'
    },
    messageInfo: {
        type: DataTypes.JSONB,
        allowNull: true,
        field: 'message_info'
    }
}, {
    tableName: 'messages',
    underscored: true,
    timestamps: true
});

// Relationships
User.hasMany(Message, {
    foreignKey: 'user_id',
    onDelete: 'CASCADE'
});
Message.belongsTo(User, {
    foreignKey: 'user_id'
});

export const syncDatabase = async () => {
    try {
        // Force sync in development (this will drop tables if they exist)
        await sequelize.sync({ force: true });
        console.log('Database synchronized successfully');
    } catch (error) {
        console.error('Error synchronizing database:', error);
        throw error;
    }
};
