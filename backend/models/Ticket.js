import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Ticket = sequelize.define('Ticket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  tid: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Terminal ID'
  },
  contactName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  contactPhone: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('new', 'in_progress', 'resolved', 'closed'),
    defaultValue: 'new'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  expertId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'Users',
      key: 'id'
    }
  }
}, {
  timestamps: true
});

export default Ticket;
