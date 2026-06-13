const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { isNotAuthenticated, isAuthenticated } = require('../middleware/auth');

// Register Page
router.get('/register', isNotAuthenticated, (req, res) => {
    try {
        res.render('register', { title: 'Register', error: null });
    } catch (error) {
        console.error('Register page error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load registration page.' });
    }
});

// Register POST
router.post('/register', isNotAuthenticated, async (req, res) => {
    try {
        const { username, email, password, plan = 'free' } = req.body;
        
        if (!username || !email || !password) {
            return res.render('register', { title: 'Register', error: 'All fields are required' });
        }

        if (password.length < 6) {
            return res.render('register', { title: 'Register', error: 'Password must be at least 6 characters' });
        }

        const existing = await User.findOne({ $or: [{ username }, { email }] });
        if (existing) {
            return res.render('register', { title: 'Register', error: 'Username or email already exists' });
        }

        const user = new User({ username, email, password, plan });
        await user.save();

        req.session.user = {
            id: user._id,
            username: user.username,
            email: user.email,
            plan: user.plan,
            role: user.role
        };

        res.redirect('/dashboard');
    } catch (error) {
        console.error('Registration error:', error.message);
        res.render('register', { title: 'Register', error: 'Registration failed. Please try again.' });
    }
});

// Login Page
router.get('/login', isNotAuthenticated, (req, res) => {
    try {
        res.render('login', { title: 'Login', error: null });
    } catch (error) {
        console.error('Login page error:', error.message);
        res.status(500).render('error', { title: 'Error', message: 'Failed to load login page.' });
    }
});

// Login POST
router.post('/login', isNotAuthenticated, async (req, res) => {
    try {
        const { username, password } = req.body;
        
        if (!username || !password) {
            return res.render('login', { title: 'Login', error: 'Please enter username and password' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.render('login', { title: 'Login', error: 'Invalid username or password' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.render('login', { title: 'Login', error: 'Invalid username or password' });
        }

        if (!user.isActive) {
            return res.render('login', { title: 'Login', error: 'Account is suspended. Contact admin.' });
        }

        user.lastLogin = new Date();
        await user.save();

        req.session.user = {
    id: user._id,
    username: user.username,
    email: user.email,
    plan: user.plan,
    role: user.role
};

req.session.save((err) => {
    if (err) {
        console.error('Session save error:', err);
        return res.render('login', {
            title: 'Login',
            error: 'Login failed. Please try again.'
        });
    }

    if (user.role === 'admin') {
        return res.redirect('/admin');
    } else {
        return res.redirect('/dashboard');
    }
});
    } catch (error) {
        console.error('Login error:', error.message);
        res.render('login', { title: 'Login', error: 'Login failed. Please try again.' });
    }
});

// Logout
router.get('/logout', isAuthenticated, (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error('Session destroy error:', err.message);
            }
            res.redirect('/');
        });
    } catch (error) {
        console.error('Logout error:', error.message);
        res.redirect('/');
    }
});

module.exports = router;
