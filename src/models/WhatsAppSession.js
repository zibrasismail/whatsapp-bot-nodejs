import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WhatsAppSession = sequelize.define('WhatsAppSession', {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: 'default'
    },
    sessionData: {
        type: DataTypes.JSON,
        allowNull: true
    }
}, {
    tableName: 'whatsapp_sessions',
    timestamps: true
});

export default WhatsAppSession;
