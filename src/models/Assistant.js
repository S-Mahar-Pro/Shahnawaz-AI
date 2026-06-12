const mongoose = require('mongoose');

const assistantSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    personality: { type: String, default: 'Helpful AI Assistant' },
    instructions: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assistant', assistantSchema);