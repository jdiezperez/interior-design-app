const express = require('express');
const router = express.Router();
const Location = require('../models/Location');

// Middleware to check if user is a main user
const isMainUser = (req, res, next) => {
    if (req.user && req.user.role === 'main_user') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Only main users can manage locations.' });
};

// Get all locations for current user
router.get('/', isMainUser, async (req, res) => {
    try {
        const locations = await Location.findAll({
            where: { userId: req.user.id }
        });
        res.json(locations);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a location
router.post('/add', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Location name is required' });
        }

        const newLocation = await Location.create({
            name,
            userId: req.user.id
        });

        res.json({ message: 'Location added successfully', location: newLocation });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update a location
router.put('/:id', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        const location = await Location.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        location.name = name;
        await location.save();

        res.json({ message: 'Location updated successfully', location });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete a location
router.delete('/:id', isMainUser, async (req, res) => {
    try {
        const location = await Location.findOne({
            where: {
                id: req.params.id,
                userId: req.user.id
            }
        });

        if (!location) {
            return res.status(404).json({ message: 'Location not found' });
        }

        await location.destroy();
        res.json({ message: 'Location removed successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
