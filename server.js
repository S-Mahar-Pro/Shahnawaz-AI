require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Validate critical env vars
if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI is missing in .env file');
    process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
    console.error('❌ FATAL: GEMINI_API_KEY is missing in .env file');
    process.exit(1);
}
if (!process.env.SESSION_SECRET) {
    console.error('❌ FATAL: SESSION_SECRET is missing in .env file');
    process.exit(1);
}

// Security Middleware
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

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP. Please try again later.' }
});
app.use('/api/', limiter);

// Body Parsing
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// ==================== DATABASE CONNECTION ====================
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            authSource: "admin",
            retryWrites: true,
            w: "majority"
        });
        
        console.log('✅ MongoDB Atlas Connected');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

// Connect to Database
connectDB();

// Listen for runtime errors
mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Runtime Error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ MongoDB disconnected. Trying to reconnect...');
    connectDB();
});

// ==================== SESSION CONFIG ====================
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        ttl: 14 * 24 * 60 * 60,
        mongoOptions: {
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 45000,
            authSource: "admin"
        }
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
}));

// Make user available to all views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;
    next();
});

// Routes
app.use('/', require('./src/routes/auth'));
app.use('/', require('./src/routes/main'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/tools', require('./src/routes/tools'));
app.use('/api/files', require('./src/routes/files'));
app.use('/admin', require('./src/routes/admin'));

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', platform: 'S FUTURE AI', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).render('404', { title: 'Page Not Found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('❌ Global Error:', err.stack);
    if (req.xhr || req.headers.accept?.includes('json')) {
        return res.status(500).json({ error: 'Internal server error. Please try again.' });
    }
    res.status(500).render('error', { title: 'Error', message: 'Something went wrong! Please try again.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 S FUTURE AI running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
