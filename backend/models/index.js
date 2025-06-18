import User from './User.js';
import Ticket from './Ticket.js';
import Message from './Message.js';

// Ассоциации
// User -> Ticket (User has many Tickets)
User.hasMany(Ticket, { 
  foreignKey: 'userId',
  as: 'tickets'
});

// Ticket -> User (Ticket belongs to User)
Ticket.belongsTo(User, { 
  foreignKey: 'userId',
  as: 'user'
});

// User -> Message (User has many Messages as author)
User.hasMany(Message, { 
  foreignKey: 'authorId',
  as: 'messages'
});

// Message -> User (Message belongs to User as author)
Message.belongsTo(User, { 
  foreignKey: 'authorId',
  as: 'author'
});

// Ticket -> Message (Ticket has many Messages)
Ticket.hasMany(Message, { 
  foreignKey: 'ticketId',
  as: 'messages'
});

// Message -> Ticket (Message belongs to Ticket)
Message.belongsTo(Ticket, { 
  foreignKey: 'ticketId',
  as: 'ticket'
});

// Ticket -> User (Ticket belongs to Expert)
Ticket.belongsTo(User, { 
  foreignKey: 'expertId',
  as: 'Expert'
});

// User -> Ticket (Expert has many assigned tickets)
User.hasMany(Ticket, {
  foreignKey: 'expertId',
  as: 'assignedTickets'
});

export {
  User,
  Ticket,
  Message
};
