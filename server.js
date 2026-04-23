const express = require('express');
const path = require('path');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const passport = require('./config/passport');
const sequelize = require('./config/database');
const models = require('./models'); // Ensure all models and associations are loaded
const authRoutes = require('./routes/auth');
require('dotenv').config();

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('dist')); // Serve Vite build
app.use(express.static('public')); // Serve legacy public if needed

// Session Setup
app.use(session({
    store: new SQLiteStore({ db: 'sessions.sqlite', dir: '.' }),
    secret: process.env.SESSION_SECRET || 'your_secret_key', // In production, use env var
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 7 * 24 * 60 * 60 * 1000 } // 1 week
}));

// Passport Setup
app.use(passport.initialize());
app.use(passport.session());

// Database Sync
sequelize.sync().then(() => {
    console.log('Database synced');
}).catch(err => {
    console.error('Database sync error:', err);
});

// Protected Route Middleware
const isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login.html');
};

// Routes
app.use('/auth', authRoutes);
app.use('/api/team', isAuthenticated, require('./routes/team'));
app.use('/api/locations', isAuthenticated, require('./routes/locations'));
app.use('/api/credits', isAuthenticated, require('./routes/credits'));
app.use('/api/styles', isAuthenticated, require('./routes/styles'));
app.use('/api/furniture', isAuthenticated, require('./routes/furniture'));
app.use('/api/projects', isAuthenticated, require('./routes/projects'));

// Catch-all route to serve the SPA
app.get('*', (req, res) => {
    // If it's an API or Auth route that fell through, don't serve index.html
    if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
        return res.status(404).json({ message: 'Not Found' });
    }
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
