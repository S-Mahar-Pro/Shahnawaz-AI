const express = require('express');
const router = express.Router();
const { isAuthenticated, isNotAuthenticated } = require('../middleware/auth');
const { getPlanColor, getPlanFeatures } = require('../utils/helpers');
const User = require('../models/User');
const Chat = require('../models/Chat');

// Landing Page
router.get('/', (req, res) => {
    try {
        res.render('index', { title: 'S FUTURE AI - Enterprise AI Platform' });
    } catch (error) {
        console.error('Landing page error:', error.message);
        res.status(500).send('Failed to load page');
    }
});

// Dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        const recentChats = await Chat.find({ user: user._id })
            .sort({ timestamp: -1 })
            .limit(10);
        
        res.render('dashboard', {
            title: 'Dashboard',
            user,
            planColor: getPlanColor(user.plan),
            features: getPlanFeatures(user.plan),
            recentChats
        });
    } catch (error) {
        console.error('Dashboard error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load dashboard.' });
    }
});

// Chat Page
router.get('/chat', isAuthenticated, (req, res) => {
    try {
        res.render('chat', { title: 'AI Chat' });
    } catch (error) {
        console.error('Chat page error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load chat.' });
    }
});

// Tools Hub
router.get('/tools', isAuthenticated, (req, res) => {
    try {
        res.render('tools', { title: 'AI Tools' });
    } catch (error) {
        console.error('Tools page error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load tools.' });
    }
});

// Vault
router.get('/vault', isAuthenticated, (req, res) => {
    try {
        res.render('vault', { title: 'Diamond Vault' });
    } catch (error) {
        console.error('Vault page error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load vault.' });
    }
});

// Upgrade Page
router.get('/upgrade', isAuthenticated, (req, res) => {
    try {
        res.render('upgrade', { title: 'Upgrade Plan' });
    } catch (error) {
        console.error('Upgrade page error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load upgrade page.' });
    }
});

// Profile
router.get('/profile', isAuthenticated, async (req, res) => {
    try {
        const user = await User.findById(req.session.user.id);
        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }
        res.render('profile', { title: 'Profile', user });
    } catch (error) {
        console.error('Profile error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load profile.' });
    }
});

module.exports = router;