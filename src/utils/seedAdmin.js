require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI not found in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        
        const existing = await User.findOne({ username: 'shahnawaz6965' });
        if (existing) {
            console.log('✅ Admin already exists');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Admin credentials - these are set here for seeding only
        // In production, consider changing password after first login
        const admin = new User({
            username: 'shahnawaz6965',
            email: 'admin@sfutureai.com',
            password: 'Mahar@69$',
            role: 'admin',
            plan: 'diamond'
        });

        await admin.save();
        console.log('✅ Admin created successfully!');
        console.log('   Username: shahnawaz6965');
        console.log('   Password: Mahar@69$');
        console.log('   Role: Admin + Diamond Plan');
        
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        process.exit(1);
    }
};

seedAdmin();