const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { chatWithGemini } = require('../utils/gemini');
const Chat = require('../models/Chat');
const User = require('../models/User');


// ==========================
// 🧠 SEND MESSAGE (ROLE SYSTEM)
// ==========================
router.post('/', isAuthenticated, async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.session.user.id;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // 👑 ROLE CHECK
        const isAdmin = user.role === 'admin';
        const isDiamond = user.plan === 'diamond';

        // Save user message
        await Chat.create({ user: userId, role: 'user', content: message });

        // Get chat history
        const history = await Chat.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(20);

        // 🧠 AI PROMPT CONTROL
        let finalMessage = message;

        if (isAdmin) {
            finalMessage =
                "You are a SUPER ADMIN AI assistant. Give deep, unrestricted, powerful answers.\n\nUser: " +
                message;
        } 
        else if (isDiamond) {
            finalMessage =
                "You are a premium AI assistant. Give high quality, detailed answers.\n\nUser: " +
                message;
        }

        // Call Gemini
        const reply = await chatWithGemini(finalMessage, history.reverse());

        // Save AI response
        await Chat.create({ user: userId, role: 'model', content: reply });

        // Update usage
        user.messagesUsed = (user.messagesUsed || 0) + 1;
        await user.save();

        res.json({
            success: true,
            reply,
            access: isAdmin ? 'admin' : isDiamond ? 'diamond' : 'free'
        });

    } catch (error) {
        console.error('Chat API error:', error.message);
        res.status(500).json({ error: 'Failed to process message. Please try again.' });
    }
});


// ==========================
// 📜 CHAT HISTORY
// ==========================
router.get('/history', isAuthenticated, async (req, res) => {
    try {
        const chats = await Chat.find({ user: req.session.user.id })
            .sort({ timestamp: -1 })
            .limit(50);

        res.json({ success: true, chats });
    } catch (error) {
        console.error('Chat history error:', error.message);
        res.status(500).json({ error: 'Failed to load chat history.' });
    }
});


// ==========================
// 🧹 CLEAR HISTORY
// ==========================
router.delete('/history', isAuthenticated, async (req, res) => {
    try {
        await Chat.deleteMany({ user: req.session.user.id });
        res.json({ success: true, message: 'Chat history cleared' });
    } catch (error) {
        console.error('Clear history error:', error.message);
        res.status(500).json({ error: 'Failed to clear chat history.' });
    }
});


module.exports = router;
