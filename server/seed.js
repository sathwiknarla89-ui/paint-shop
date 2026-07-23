require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Product = require('./models/Product');
const Customer = require('./models/Customer');
const Invoice = require('./models/Invoice');

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    console.log('Clearing database collections...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Customer.deleteMany({});
    await Invoice.deleteMany({});

    console.log('Seeding admin user...');
    // The User model schema pre-save hook will automatically hash this password
    const adminUser = await User.create({
      username: 'admin',
      password: 'admin123',
    });
    console.log(`Admin user created: username: "admin", password: "admin123"`);

    console.log('Seeding sathwik user...');
    const sathwikUser = await User.create({
      username: 'sathwik',
      password: 'sathwik@123',
    });
    console.log(`Sathwik user created: username: "sathwik", password: "sathwik@123"`);


    console.log('Database seeding successfully finished!');
    process.exit(0);
  } catch (error) {
    console.error(`Database seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedData();
