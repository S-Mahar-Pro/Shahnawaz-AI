const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    fileType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    path: { type: String, required: true },
    isEncrypted: { type: Boolean, default: true },
    uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('File', fileSchema);