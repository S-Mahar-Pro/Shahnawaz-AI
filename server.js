require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Validate Env Variables
if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI is missing');
    process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ FATAL: GEMINI_API_KEY is missing');
    process.exit(1);
}
if (!process.env.SESSION_SECRET) {
    console.error('❌ FATAL: SESSION_SECRET is missing');
    process.exit(1);
}

// Security & Middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "blob:"],
            connectSrc: ["'self'", "https://generativelanguage.googleapis.com"]
        }
    }
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
});
app.use('/api/', limiter);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// ==================== DATABASE ====================
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 60000,
            authSource: "admin",
            retryWrites: true,
            w: "majority"
        });
        console.log('✅ MongoDB Atlas Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

connectDB();

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Runtime Error:', err.message);
});

// ==================== SESSION ====================
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60,
        mongoOptions: { authSource: "admin" }
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
}));

// User in views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;
    next();
});

// ==================== ROUTES ====================
app.use('/', require('./src/routes/auth'));
app.use('/', require('./src/routes/main'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/tools', require('./src/routes/tools'));
app.use('/api/files', require('./src/routes/files'));
app.use('/admin', require('./src/routes/admin'));

// ==================== HEALTH CHECK (Railway ke liye zaroori) ====================
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        mongo: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected' 
    });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Global Error:', err.stack);
    res.status(500).send('Internal Server Error');
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 S FUTURE AI running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'production'}`);
});
