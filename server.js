require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Validate env
if (!process.env.MONGODB_URI) {
    console.error('❌ FATAL: MONGODB_URI missing');
    process.exit(1);
}

// Security + Middleware (same as before)
app.use(helmet({ contentSecurityPolicy: { directives: { /* ... same as before */ } } }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/api/', limiter);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// ==================== DB CONNECTION ====================
const connectDB = async () => {
    try {
        console.log("🔍 Trying to connect...");
        await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 15000,
            socketTimeoutMS: 60000,
            authSource: "admin",
            retryWrites: true,
            w: "majority"
        });
        console.log('✅ MongoDB Atlas Connected Successfully');
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.error('Full Error:', err);
        process.exit(1);
    }
};

connectDB();

mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB Runtime Error:', err.message);
});

// ==================== SESSION (Temporary without MongoStore) ====================
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000
    }
}));

// Routes + other code same rakh do
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.path = req.path;
    next();
});

app.use('/', require('./src/routes/auth'));
app.use('/', require('./src/routes/main'));
app.use('/api/chat', require('./src/routes/chat'));
app.use('/api/tools', require('./src/routes/tools'));
app.use('/api/files', require('./src/routes/files'));
app.use('/admin', require('./src/routes/admin'));

app.get('/health', (req, res) => res.json({ status: 'OK' }));

app.use((req, res) => res.status(404).send('Page Not Found'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 S FUTURE AI running on port ${PORT}`);
    console.log(`📍 Environment: production`);
});
