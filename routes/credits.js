const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Middleware to check if user is a main user
const isMainUser = (req, res, next) => {
    if (req.user && req.user.role === 'main_user') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Only main users can access credits management.' });
};

// Get current user's credits
router.get('/', isMainUser, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: ['id', 'name', 'email', 'credits']
        });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ credits: user.credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Purchase credits (simulated payment)
router.post('/purchase', isMainUser, async (req, res) => {
    try {
        const { amount } = req.body;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount. Please enter a positive number.' });
        }

        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Add credits to user's account
        user.credits += parsedAmount;
        await user.save();

        res.json({
            message: 'Credits purchased successfully!',
            credits: user.credits
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
