const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { FurnitureCategory, Furniture, FurnitureImage } = require('../models');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../private/uploads/furniture');
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
    return res.status(403).json({ message: 'Access denied. Only main users can manage furniture.' });
};

// --- Category Routes ---

router.get('/categories', async (req, res) => {
    try {
        const categories = await FurnitureCategory.findAll({
            where: { userId: req.user.parentId ? req.user.parentId : req.user.id },
            include: [{
                model: Furniture,
                as: 'furnitures',
                include: [{ model: FurnitureImage, as: 'images' }]
            }],
            order: [
                ['name', 'ASC'],
                [{ model: Furniture, as: 'furnitures' }, 'name', 'ASC']
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
        const category = await FurnitureCategory.create({ name, userId: req.user.parentId ? req.user.parentId : req.user.id });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/categories/:id', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        const category = await FurnitureCategory.findOne({ where: { id: req.params.id, userId: req.user.id } });
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
        const category = await FurnitureCategory.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [{
                model: Furniture,
                as: 'furnitures',
                include: [{ model: FurnitureImage, as: 'images' }]
            }]
        });
        if (!category) return res.status(404).json({ message: 'Not found' });

        // Delete all images associated with this category from disk
        const furnitures = category.furnitures || [];
        for (const furniture of furnitures) {
            const images = furniture.images || [];
            for (const img of images) {
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

// --- Furniture Routes ---

router.post('/add', isMainUser, async (req, res) => {
    try {
        const { name, furnitureCategoryId } = req.body;
        const category = await FurnitureCategory.findOne({ where: { id: furnitureCategoryId, userId: req.user.id } });
        if (!category) return res.status(404).json({ message: 'Category not found' });

        const furniture = await Furniture.create({ name, furnitureCategoryId });
        res.json(furniture);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', isMainUser, async (req, res) => {
    try {
        const { name } = req.body;
        const furniture = await Furniture.findByPk(req.params.id, {
            include: [{ model: FurnitureCategory, as: 'category', where: { userId: req.user.id } }]
        });
        if (!furniture) return res.status(404).json({ message: 'Not found' });

        furniture.name = name;
        await furniture.save();
        res.json(furniture);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', isMainUser, async (req, res) => {
    try {
        const furniture = await Furniture.findByPk(req.params.id, {
            include: [
                { model: FurnitureCategory, as: 'category', where: { userId: req.user.id } },
                { model: FurnitureImage, as: 'images' }
            ]
        });
        if (!furniture) return res.status(404).json({ message: 'Not found' });

        // Delete images from disk
        const images = furniture.images || [];
        for (const img of images) {
            const filePath = path.join(uploadDir, img.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await furniture.destroy();
        res.json({ message: 'Furniture and images deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Image Routes ---

router.post('/images', isMainUser, upload.single('image'), async (req, res) => {
    try {
        const { furnitureId } = req.body;
        const furniture = await Furniture.findByPk(furnitureId, {
            include: [{ model: FurnitureCategory, as: 'category', where: { userId: req.user.id } }]
        });
        if (!furniture) {
            // Cleanup uploaded file if furniture not found
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(404).json({ message: 'Furniture not found' });
        }

        // Check if furniture already has 9 images
        const count = await FurnitureImage.count({ where: { furnitureId } });
        if (count >= 9) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ message: 'Maximum 9 images allowed per furniture' });
        }

        const image = await FurnitureImage.create({
            filename: req.file.filename,
            furnitureId
        });
        res.json(image);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/images/:id', isMainUser, async (req, res) => {
    try {
        const image = await FurnitureImage.findByPk(req.params.id, {
            include: [{
                model: Furniture,
                as: 'furniture',
                include: [{ model: FurnitureCategory, as: 'category', where: { userId: req.user.id } }]
            }]
        });
        if (!image || !image.furniture || !image.furniture.category) return res.status(404).json({ message: 'Not found' });

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
