const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    plan: { type: String, enum: ['free', 'gold', 'diamond'], default: 'free' },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    messagesUsed: { type: Number, default: 0 },
    filesUploaded: { type: Number, default: 0 },
    storageUsed: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now },
    lastLogin: { type: Date }
});

userSchema.pre('save', async function(next) {
    try {
        if (!this.isModified('password')) return next();
        this.password = await bcrypt.hash(this.password, 12);
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        console.error('Password comparison error:', error.message);
        return false;
    }
};

module.exports = mongoose.model('User', userSchema);