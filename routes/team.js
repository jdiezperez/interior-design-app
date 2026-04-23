const express = require('express');
const router = express.Router();
const { User, Location } = require('../models');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const { Op } = require('sequelize');

// Middleware to check if user is a main user
const isMainUser = (req, res, next) => {
    if (req.user && req.user.role === 'main_user') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Only main users can manage teams.' });
};

// Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || 'your-email@gmail.com',
        pass: process.env.EMAIL_PASS || 'your-password'
    }
});

const sendEmail = async (to, subject, text) => {
    try {
        if (!process.env.EMAIL_USER) {
            console.log(`[SIMULATED EMAIL] To: ${to}, Subject: ${subject}, Body: ${text}`);
            return;
        }
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text
        });
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// --- Unified Data Fetching ---

router.get('/data', isMainUser, async (req, res) => {
    try {
        const locations = await Location.findAll({
            where: { userId: req.user.id },
            include: [{
                model: User,
                as: 'members',
                attributes: ['id', 'name', 'email', 'locationId', 'role', 'credits'],
                order: [['name', 'ASC']]
            }],
            order: [['name', 'ASC']]
        });

        // Also fetch members without locations
        const unassignedMembers = await User.findAll({
            where: {
                parentId: req.user.id,
                locationId: null
            },
            attributes: ['id', 'name', 'email', 'locationId', 'role', 'credits'],
            order: [['name', 'ASC']]
        });

        res.json({ locations, unassignedMembers });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Location Routes ---

router.post('/locations/add', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        // Check uniqueness per user
        const exists = await Location.findOne({ where: { name, userId: req.user.id } });
        if (exists) return res.status(400).json({ message: 'Location name must be unique' });

        const location = await Location.create({ name, userId: req.user.id });
        res.json(location);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/locations/:id', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        const location = await Location.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!location) return res.status(404).json({ message: 'Location not found' });

        const exists = await Location.findOne({
            where: {
                name,
                userId: req.user.id,
                id: { [Op.ne]: req.params.id }
            }
        });
        if (exists) return res.status(400).json({ message: 'Location name must be unique' });

        location.name = name;
        await location.save();
        res.json(location);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/locations/:id', isMainUser, async (req, res) => {
    try {
        const location = await Location.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!location) return res.status(404).json({ message: 'Location not found' });

        // Find or create "No Location"
        let [noLoc] = await Location.findOrCreate({
            where: { name: 'No Location', userId: req.user.id }
        });

        // Reassign members
        await User.update(
            { locationId: noLoc.id },
            { where: { locationId: req.params.id, parentId: req.user.id } }
        );

        await location.destroy();
        res.json({ message: 'Location deleted, members moved to "No Location"' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Team Member Routes ---

router.post('/members/add', isMainUser, async (req, res) => {
    try {
        const { name, email, locationId, password } = req.body;

        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) return res.status(400).json({ message: 'Email already registered' });

        const newUser = await User.create({
            name, email, password, locationId,
            role: 'team_member',
            parentId: req.user.id
        });

        await sendEmail(email, 'Welcome to the Team',
            `Hello ${name},\n\nYou have been added to the team.\n\nCredentials:\nEmail: ${email}\nPassword: ${password}\n\nPlease login at: ${process.env.APP_URL || 'http://localhost:3000'}`);

        res.json(newUser);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/members/:id', isMainUser, async (req, res) => {
    try {
        const { name, locationId, password } = req.body;
        const member = await User.findOne({ where: { id: req.params.id, parentId: req.user.id } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        member.name = name || member.name;
        member.locationId = locationId || member.locationId;
        if (password) member.password = password;

        await member.save();

        await sendEmail(member.email, 'Account Updated',
            `Hello ${member.name},\n\nYour account details have been updated.\n\nNew Credentials (if changed):\nEmail: ${member.email}\nPassword: ${password || 'Unchanged'}`);

        res.json(member);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/members/:id', isMainUser, async (req, res) => {
    try {
        const member = await User.findOne({ where: { id: req.params.id, parentId: req.user.id } });
        if (!member) return res.status(404).json({ message: 'Member not found' });

        // TODO: Delete projects and images when they exist
        await member.destroy();
        res.json({ message: 'Member removed' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Credits ---

router.post('/credits/transfer', isMainUser, async (req, res) => {
    try {
        const { targetUserId, amount } = req.body;
        const parsedAmount = parseFloat(amount);

        if (isNaN(parsedAmount) || parsedAmount === 0) {
            return res.status(400).json({ message: 'Invalid amount' });
        }

        const mainUser = await User.findByPk(req.user.id);
        const member = await User.findOne({
            where: { id: targetUserId, parentId: req.user.id }
        });

        if (!member) return res.status(404).json({ message: 'Member not found' });

        // If amount > 0, main user gives to member
        // If amount < 0, member gives back to main user

        if (parsedAmount > 0 && mainUser.credits < parsedAmount) {
            return res.status(400).json({ message: 'Insufficient credits' });
        }
        if (parsedAmount < 0 && member.credits < Math.abs(parsedAmount)) {
            return res.status(400).json({ message: 'Member has insufficient credits' });
        }

        mainUser.credits -= parsedAmount;
        member.credits += parsedAmount;

        await mainUser.save();
        await member.save();

        res.json({ message: 'Credits transferred', mainUserCredits: mainUser.credits, memberCredits: member.credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/credits/distribute', isMainUser, async (req, res) => {
    try {
        const mainUser = await User.findByPk(req.user.id);
        const members = await User.findAll({ where: { parentId: req.user.id } });

        const totalPeople = members.length + 1;
        const totalCredits = Math.floor(mainUser.credits);

        const baseShare = Math.floor(totalCredits / totalPeople);
        const remainder = totalCredits % totalPeople;

        // Distribute to members
        for (const member of members) {
            member.credits = (member.credits || 0) + baseShare;
            await member.save();
        }

        // Main User gets base share + remainder
        mainUser.credits = (mainUser.credits - totalCredits) + (baseShare + remainder);
        await mainUser.save();

        res.json({ message: 'Credits distributed', baseShare, remainder });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
