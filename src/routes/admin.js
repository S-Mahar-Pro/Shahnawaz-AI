const express = require('express');
const router = express.Router();
const { isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Chat = require('../models/Chat');
const File = require('../models/File');

router.use(isAdmin);

// Admin Dashboard
router.get('/', async (req, res) => {
    try {
        const stats = {
            totalUsers: await User.countDocuments().catch(() => 0),
            totalChats: await Chat.countDocuments().catch(() => 0),
            totalFiles: await File.countDocuments().catch(() => 0),
            freeUsers: await User.countDocuments({ plan: 'free' }).catch(() => 0),
            goldUsers: await User.countDocuments({ plan: 'gold' }).catch(() => 0),
            diamondUsers: await User.countDocuments({ plan: 'diamond' }).catch(() => 0)
        };
        
        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .catch(() => []);
        
        res.render('admin/dashboard', { 
            title: 'Admin Panel', 
            stats, 
            recentUsers,
            admin: req.session.user 
        });
    } catch (error) {
        console.error('Admin dashboard error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load admin dashboard.' });
    }
});

// Users Management
router.get('/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.render('admin/users', { title: 'User Management', users });
    } catch (error) {
        console.error('Users page error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load users.' });
    }
});

// Update Plan
router.post('/users/:id/plan', async (req, res) => {
    try {
        const { plan } = req.body;
        if (!['free', 'gold', 'diamond'].includes(plan)) {
            return res.status(400).json({ error: 'Invalid plan' });
        }
        const user = await User.findByIdAndUpdate(req.params.id, { plan }, { new: true });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, message: 'Plan updated successfully' });
    } catch (error) {
        console.error('Plan update error:', error.message);
        res.status(500).json({ error: 'Failed to update plan.' });
    }
});

// Toggle User Status
router.post('/users/:id/toggle', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        user.isActive = !user.isActive;
        await user.save();
        res.json({ success: true, isActive: user.isActive, message: user.isActive ? 'User activated' : 'User suspended' });
    } catch (error) {
        console.error('User toggle error:', error.message);
        res.status(500).json({ error: 'Failed to toggle user status.' });
    }
});

// System Stats API
router.get('/api/stats', async (req, res) => {
    try {
        const dailyStats = await Chat.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: -1 } },
            { $limit: 7 }
        ]).catch(() => []);
        
        res.json({ success: true, dailyStats });
    } catch (error) {
        console.error('Stats API error:', error.message);
        res.status(500).json({ error: 'Failed to load statistics.' });
    }
});

module.exports = router;