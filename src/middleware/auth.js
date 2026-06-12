const isAuthenticated = (req, res, next) => {
    try {
        if (req.session && req.session.user) {
            return next();
        }
        req.session.returnTo = req.originalUrl;
        if (req.xhr || req.headers.accept?.includes('json')) {
            return res.status(401).json({ error: 'Please login to access this resource.' });
        }
        res.redirect('/login');
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        res.redirect('/login');
    }
};

const isNotAuthenticated = (req, res, next) => {
    try {
        if (!req.session.user) return next();
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Auth middleware error:', error.message);
        next();
    }
};

const isAdmin = (req, res, next) => {
    try {
        if (req.session.user && req.session.user.role === 'admin') {
            return next();
        }
        res.status(403).render('error', { title: 'Access Denied', message: 'Admin access required.' });
    } catch (error) {
        console.error('Admin middleware error:', error.message);
        res.status(403).send('Access Denied');
    }
};

const checkPlan = (plans) => {
    return (req, res, next) => {
        try {
            if (!req.session.user) return res.redirect('/login');
            if (plans.includes(req.session.user.plan) || req.session.user.role === 'admin') {
                return next();
            }
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(403).json({ error: 'This feature requires a higher plan. Please upgrade.' });
            }
            res.redirect('/upgrade');
        } catch (error) {
            console.error('Plan check error:', error.message);
            res.redirect('/upgrade');
        }
    };
};

module.exports = { isAuthenticated, isNotAuthenticated, isAdmin, checkPlan };