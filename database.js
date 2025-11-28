const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://noradmin:noradmin123@qanhomhoctap.c0pzduh.mongodb.net/?appName=qanhomhoctap');
        console.log(`MongoDB Connected: ${conn.connection.host}`);

        // Initialize default admin
        await initAdmin();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const initAdmin = async () => {
    try {
        const adminExists = await User.findOne({ username: 'admin' });
        if (!adminExists) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('admin123', salt);

            await User.create({
                username: 'admin',
                password: hashedPassword,
                role: 'admin'
            });
            console.log('Default admin account created.');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

module.exports = connectDB;
