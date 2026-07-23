require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');

const register = async () => {
  try {
    await connectDB();
    const exists = await User.findOne({ username: 'sathwik' });
    if (exists) {
      console.log('User "sathwik" already exists in the database.');
    } else {
      await User.create({
        username: 'sathwik',
        password: 'sathwik@123'
      });
      console.log('User "sathwik" registered successfully.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Failed to register user:', err.message);
    process.exit(1);
  }
};

register();
