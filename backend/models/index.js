import User from './User.js';
import Ticket from './Ticket.js';
import Message from './Message.js';

// Ассоциации
User.hasMany(Ticket, { foreignKey: 'userId' });
Ticket.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Message, { foreignKey: 'authorId' });
Message.belongsTo(User, { foreignKey: 'authorId' });

Ticket.hasMany(Message, { foreignKey: 'ticketId' });
Message.belongsTo(Ticket, { foreignKey: 'ticketId' });

Ticket.belongsTo(User, { 
  as: 'Expert', 
  foreignKey: 'expertId'
});

export {
  User,
  Ticket,
  Message
};
