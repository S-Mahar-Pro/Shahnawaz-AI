const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const { chatWithGemini } = require('../utils/gemini');
const Chat = require('../models/Chat');
const User = require('../models/User');

// Send Message
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
        
        // Save user message
        await Chat.create({ user: userId, role: 'user', content: message });

        // Get chat history for context
        const history = await Chat.find({ user: userId })
            .sort({ timestamp: -1 })
            .limit(20);

        // Call Gemini
        const reply = await chatWithGemini(message, history.reverse());

        // Save AI response
        await Chat.create({ user: userId, role: 'model', content: reply });

        // Update usage
        user.messagesUsed += 1;
        await user.save();

        res.json({ success: true, reply, plan: user.plan });
    } catch (error) {
        console.error('Chat API error:', error.message);
        res.status(500).json({ error: 'Failed to process message. Please try again.' });
    }
});

// Get History
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

// Clear History
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