import bcrypt from 'bcryptjs';
import sequelize from '../config/db.js';
import User from '../models/User.js';

const initDatabase = async () => {
  try {
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Database synchronized');

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await User.create({
      email: 'admin@example.com',
      password: hashedPassword,
      fullName: 'Admin User',
      phone: '+1234567890',
      role: 'admin'
    });

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 10);
    await User.create({
      email: 'user@example.com',
      password: userPassword,
      fullName: 'Regular User',
      phone: '+1987654321',
      role: 'user'
    });

    console.log('Test users created:');
    console.log('Admin: admin@example.com / admin123');
    console.log('User: user@example.com / user123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

initDatabase();
