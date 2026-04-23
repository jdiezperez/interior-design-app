const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { StyleCategory, Style, StyleImage } = require('../models');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../private/uploads/styles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Middleware to check if user is a main user
const isMainUser = (req, res, next) => {
    if (req.user && req.user.role === 'main_user') {
        return next();
    }
    return res.status(403).json({ message: 'Access denied. Only main users can manage styles.' });
};

// --- Category Routes ---

router.get('/categories', async (req, res) => {
    try {
        const categories = await StyleCategory.findAll({
            where: { userId: req.user.parentId ? req.user.parentId : req.user.id },
            include: [{
                model: Style,
                include: [StyleImage]
            }],
            order: [
                ['name', 'ASC'],
                [Style, 'name', 'ASC']
            ]
        });
        res.json(categories);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/categories/add', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });
        const category = await StyleCategory.create({ name, userId: req.user.parentId ? req.user.parentId : req.user.id });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/categories/:id', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        const category = await StyleCategory.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!category) return res.status(404).json({ message: 'Not found' });
        category.name = name;
        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/categories/:id', isMainUser, async (req, res) => {
    try {
        const category = await StyleCategory.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [{ model: Style, include: [StyleImage] }]
        });
        if (!category) return res.status(404).json({ message: 'Not found' });

        // Delete all images associated with this category from disk
        for (const style of category.Styles) {
            for (const img of style.StyleImages) {
                const filePath = path.join(uploadDir, img.filename);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
        }

        await category.destroy();
        res.json({ message: 'Category and all related content deleted' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Style Routes ---

router.post('/add', isMainUser, async (req, res) => {
    try {
        const { name, styleCategoryId } = req.body;
        const category = await StyleCategory.findOne({ where: { id: styleCategoryId, userId: req.user.id } });
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const style = await Style.create({ name, styleCategoryId });
        res.json(style);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        const style = await Style.findByPk(req.params.id, {
            include: [{ model: StyleCategory, where: { userId: req.user.id } }]
        });
        if (!style) return res.status(404).json({ message: 'Not found' });

        style.name = name;
        await style.save();
        res.json(style);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', isMainUser, async (req, res) => {
    try {
        const style = await Style.findByPk(req.params.id, {
            include: [
                { model: StyleCategory, where: { userId: req.user.id } },
                StyleImage
            ]
        });
        if (!style) return res.status(404).json({ message: 'Not found' });

        // Delete images from disk
        for (const img of style.StyleImages) {
            const filePath = path.join(uploadDir, img.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await style.destroy();
        res.json({ message: 'Style and images deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Image Routes ---

router.post('/images', isMainUser, upload.single('image'), async (req, res) => {
    try {
        const { styleId } = req.body;
        const style = await Style.findByPk(styleId, {
            include: [{ model: StyleCategory, where: { userId: req.user.id } }]
        });
        if (!style) {
            // Cleanup uploaded file if style not found
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Style not found' });
        }

        // Check if style already has 9 images
        const count = await StyleImage.count({ where: { styleId } });
        if (count >= 9) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Maximum 9 images allowed per style' });
        }

        const image = await StyleImage.create({
            filename: req.file.filename,
            styleId
        });
        res.json(image);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/images/:id', isMainUser, async (req, res) => {
    try {
        const image = await StyleImage.findByPk(req.params.id, {
            include: [{
                model: Style,
                include: [{ model: StyleCategory, where: { userId: req.user.id } }]
            }]
        });
        if (!image || !image.Style.StyleCategory) return res.status(404).json({ message: 'Not found' });

        const filePath = path.join(uploadDir, image.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await image.destroy();
        res.json({ message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Secure image serving
router.get('/image/:filename', (req, res) => {
    // If we're here, isAuthenticated middleware from server.js already passed
    const filePath = path.join(uploadDir, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).send('Not found');

    // Check if the user owns this image (optional but recommended)
    // For simplicity, we trust the isAuthenticated middleware for now
    res.sendFile(filePath);
});

module.exports = router;
