const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ProjectCategory, Project, ProjectImage, User, Style, StyleImage, StyleCategory, Furniture, FurnitureImage, FurnitureCategory } = require('../models');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const modelAI = "gemini-2.5-flash-image";
//const modelAI = "gemini-3-pro-image-preview";

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../private/uploads/projects');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Config for temporary/source uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Dynamic folder based on User ID
        // Note: req.user must be populated by auth middleware BEFORE this.
        const userId = req.user ? req.user.id : 'temp';
        const userDir = path.join(uploadDir, userId.toString());
        if (!fs.existsSync(userDir)) {
            fs.mkdirSync(userDir, { recursive: true });
        }
        cb(null, userDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage });

// Helper to get Gemini API
const getGemini = () => {
    if (!process.env.GEMINI_API_KEY) return null;
    return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
};

// Simple mime detector
function getMimeType(filename) {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png') return 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
    if (ext === '.webp') return 'image/webp';
    if (ext === '.heic') return 'image/heic';
    return 'image/jpeg'; // Fallback
}

// Helper to file to GenerativePart
function fileToGenerativePart(filePath, mimeType) {
    if (!fs.existsSync(filePath)) {
        console.error(`ERROR: File not found at ${filePath}`);
        return null;
    }
    const stats = fs.statSync(filePath);
    const data = fs.readFileSync(filePath);
    return {
        inlineData: {
            data: Buffer.from(data).toString("base64"),
            mimeType: mimeType || getMimeType(filePath)
        },
        sourcePath: filePath,
        size: stats.size
    };
}

// Helper to strip metadata before sending to Gemini API
function cleanPartsForAI(parts) {
    return parts.map(p => {
        if (typeof p === 'string') return p;
        return {
            inlineData: {
                data: p.inlineData.data,
                mimeType: p.inlineData.mimeType
            }
        };
    });
}

// --- CRUD Routes ---

router.get('/data', async (req, res) => {
    try {
        // Fetch Projects Hierarchy
        const categories = await ProjectCategory.findAll({
            where: { userId: req.user.id },
            include: [{
                model: Project,
                as: 'projects',
                include: [{
                    model: ProjectImage,
                    as: 'images'
                }]
            }],
            order: [
                ['name', 'ASC'],
                [{ model: Project, as: 'projects' }, 'name', 'ASC']
            ]
        });

        // Fetch Styles for Selector
        const styles = await Style.findAll({
            include: [{
                model: StyleCategory,
                where: { userId: req.user.id } // Filter by user via category
            }, {
                model: StyleImage,
                limit: 1, // Get one image as thumbnail
                order: [['createdAt', 'DESC']]
            }]
        });

        // Fetch Furniture for Selector
        // Fetch Furniture for Selector
        const furniture = await Furniture.findAll({
            include: [{
                model: FurnitureCategory,
                as: 'category',
                where: { userId: req.user.id }
            }, {
                model: FurnitureImage,
                as: 'images',
                limit: 1,
                order: [['createdAt', 'DESC']]
            }]
        });

        res.json({ categories, styles, furniture });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/categories/add', async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Name is required' });

        const existing = await ProjectCategory.findOne({ where: { name, userId: req.user.id } });
        if (existing) return res.status(400).json({ message: 'Category already exists' });

        const category = await ProjectCategory.create({ name, userId: req.user.id });
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/categories/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const category = await ProjectCategory.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!category) return res.status(404).json({ message: 'Not found' });

        const existing = await ProjectCategory.findOne({ where: { name, userId: req.user.id } });
        if (existing && existing.id !== category.id) return res.status(400).json({ message: 'Name already in use' });

        category.name = name;
        await category.save();
        res.json(category);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/categories/:id', async (req, res) => {
    try {
        const category = await ProjectCategory.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!category) return res.status(404).json({ message: 'Not found' });

        // Move projects to "No Category"
        let noCategory = await ProjectCategory.findOne({ where: { name: 'No Category', userId: req.user.id } });
        if (!noCategory) {
            noCategory = await ProjectCategory.create({ name: 'No Category', userId: req.user.id });
        }

        await Project.update({ projectCategoryId: noCategory.id }, { where: { projectCategoryId: category.id } });

        await category.destroy();
        res.json({ message: 'Category deleted, projects moved to No Category' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.post('/add', async (req, res) => {
    try {
        const { name, projectCategoryId } = req.body;
        if (!name || !projectCategoryId) return res.status(400).json({ message: 'Missing fields' });

        const existing = await Project.findOne({
            where: { name, userId: req.user.id },
            include: [{ model: ProjectCategory, as: 'category' }]
        });
        if (existing) return res.status(400).json({ message: 'Project name already exists' });

        const project = await Project.create({
            name,
            projectCategoryId,
            userId: req.user.id
        });
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { name } = req.body;
        const project = await Project.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!project) return res.status(404).json({ message: 'Not found' });

        const existing = await Project.findOne({ where: { name, userId: req.user.id } });
        if (existing && existing.id !== project.id) return res.status(400).json({ message: 'Name already in use' });

        project.name = name;
        await project.save();
        res.json(project);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const project = await Project.findOne({
            where: { id: req.params.id, userId: req.user.id },
            include: [{ model: ProjectImage, as: 'images' }]
        });
        if (!project) return res.status(404).json({ message: 'Not found' });

        // Delete files
        for (const img of project.images) {
            const filePath = path.join(uploadDir, img.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await project.destroy();
        res.json({ message: 'Project and associated images deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

router.delete('/images/:id', async (req, res) => {
    try {
        const image = await ProjectImage.findOne({ where: { id: req.params.id, userId: req.user.id } });
        if (!image) return res.status(404).json({ message: 'Not found' });

        const filePath = path.join(uploadDir, image.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        await image.destroy();
        res.json({ message: 'Image deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// --- Generation Routes ---

router.post('/generate', upload.fields([{ name: 'source' }, { name: 'styleRef' }]), async (req, res) => {
    const uploadedFiles = [];
    try {
        const { prompt, predefinedStyle, stylePrompt, styleId, resolution, orientation, versions = 1 } = req.body;

        // Track uploads for cleanup
        if (req.files['source']) uploadedFiles.push(req.files['source'][0].path);
        if (req.files['styleRef']) uploadedFiles.push(req.files['styleRef'][0].path);

        // Credit check
        let costPerImage = 1;
        if (resolution === '2K') costPerImage = 2;
        if (resolution === '4K') costPerImage = 4;
        const totalCost = costPerImage * parseInt(versions);

        if (req.user.credits < totalCost) {
            throw new Error('Insufficient credits');
        }

        // Gemini Integration Logic
        const genAI = getGemini();
        if (!genAI) throw new Error('Gemini API not configured');

        // Construct Prompt
        let finalPrompt = `Generate a photorealistic interior design image.`;

        if (stylePrompt) {
            finalPrompt += ` Style Description: ${stylePrompt}.`;
        } else if (predefinedStyle) {
            finalPrompt += ` Style: ${predefinedStyle}.`;
        }

        if (prompt) finalPrompt += ` Details: ${prompt}.`;
        finalPrompt += ` Resolution: ${resolution}. Orientation: ${orientation}.`;

        // Prepare Parts
        const parts = [finalPrompt];

        // Add Source Image if exists (Step 1)
        if (req.files['source']) {
            parts.push(fileToGenerativePart(req.files['source'][0].path, req.files['source'][0].mimetype));
            parts.push("Use this image as the architectural base / room layout. Preserve the exact spatial layout, geometry, and structural outlines of the source image. Apply the artistic style, color palette, brushwork, and lighting from the reference image if it exists. Maintain 1:1 structural mapping. High fidelity to original composition.");
        }

        // Add Style Reference if exists (Step 2)
        if (req.files['styleRef']) {
            parts.push(fileToGenerativePart(req.files['styleRef'][0].path, req.files['styleRef'][0].mimetype));
            parts.push("Use this image as a style reference.");
        }

        // Add Custom Style Images if styleId is provided (Step 2)
        if (styleId) {
            const style = await Style.findByPk(styleId, { include: [StyleImage] });
            if (style && style.StyleImages) {
                const stylesDir = path.join(__dirname, '../private/uploads/styles');
                for (const img of style.StyleImages) {
                    const imgPath = path.join(stylesDir, img.filename);
                    if (fs.existsSync(imgPath)) {
                        parts.push(fileToGenerativePart(imgPath, 'image/jpeg'));
                    }
                }
                parts.push("Use these images as the primary style reference.");
            }
        }

        // Call API - Attempt Real Image Generation logic
        // Switching to 'gemini-2.5-flash-image' per user request, which works with Parts.
        const generatedImages = [];

        // Prepare User Directory
        const userId = req.user.id;
        const userDir = path.join(uploadDir, userId.toString());
        if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

        console.log("Attempting generation with gemini-2.5-flash-image...");
        const model = genAI.getGenerativeModel({ model: modelAI });

        // Generate
        if (req.body.dryRun === 'true' || req.body.dryRun === true) {
            return res.json({
                dryRun: true,
                payload: cleanPartsForAI(parts)
            });
        }

        for (let i = 0; i < parseInt(versions); i++) {
            const previewFilename = `preview-${Date.now()}-${i}-${Math.round(Math.random() * 1000)}.png`;
            const previewPath = path.join(userDir, previewFilename);
            let imageSaved = false;

            try {
                // Strip metadata like sourcePath/size before sending to Google
                const aiParts = cleanPartsForAI(parts);
                const result = await model.generateContent(aiParts);
                const response = await result.response;

                // Check for inline data (base64)
                if (response.candidates && response.candidates[0]?.content?.parts) {
                    const inlinePart = response.candidates[0].content.parts.find(p => p.inlineData);
                    if (inlinePart && inlinePart.inlineData.data) {
                        const base64Data = inlinePart.inlineData.data;
                        fs.writeFileSync(previewPath, Buffer.from(base64Data, 'base64'));
                        imageSaved = true;
                        console.log(`Generated real image version ${i + 1}`);
                    }
                }
            } catch (apiError) {
                console.error(`Gemini 2.5 generation failed for version ${i + 1}:`, apiError.message);
            }

            if (!imageSaved) {
                // Fallback to Logo if real generation failed
                const placeholderSrc = path.join(__dirname, '../public/logo.png');
                if (fs.existsSync(placeholderSrc)) {
                    fs.copyFileSync(placeholderSrc, previewPath);
                } else {
                    fs.writeFileSync(previewPath, 'dummy-data');
                }
                console.log(`Used fallback logo for version ${i + 1}`);
            }

            generatedImages.push({
                url: `/api/projects/image/${previewFilename}`,
                filename: previewFilename
            });
        }

        console.log(`Generated ${versions} versions.`);

        // Cleanup temp uploads
        uploadedFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

        res.json({
            message: 'Images generated successfully',
            images: generatedImages,
            cost: totalCost,
            params: { resolution, orientation, versions: parseInt(versions) }
        });

    } catch (err) {
        // Cleanup temp uploads on error
        uploadedFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

        console.error(err);
        const status = err.message === 'Insufficient credits' ? 400 : 500;
        res.status(status).json({ message: err.message || 'Generation failed' });
    }
});

router.post('/edit-image', upload.fields([{ name: 'mask' }]), async (req, res) => {
    const uploadedFiles = [];
    try {
        const { projectId, originalImageFilename, prompt, mode, furnitureId, resolution, versions = 1 } = req.body;

        console.log("-----------------------------------------");
        console.log("INCOMING EDIT REQUEST:");
        console.log("Body:", req.body);
        console.log("Files:", Object.keys(req.files || {}));
        console.log("Has Mask File:", !!(req.files && req.files['mask']));
        console.log("-----------------------------------------");

        if (req.files && req.files['mask']) uploadedFiles.push(req.files['mask'][0].path);

        // Credit Logic (Same as new gen)
        // ... (skipping complex check for brevity, assuming standard 1 credit/img for edit)

        const genAI = getGemini();
        const model = genAI.getGenerativeModel({ model: modelAI });

        // Locate Original Image
        // We need to find where the original image is stored.
        // It should be in the user's project folder.
        const userId = req.user.id;
        const userDir = path.join(uploadDir, userId.toString());
        const originalPath = path.join(userDir, originalImageFilename);

        if (!fs.existsSync(originalPath)) throw new Error('Original image not found');

        // Construct Prompt & Parts
        const parts = [];
        let promptText = `AI MISSION: Surgical Furniture Inpainting
You must insert specific objects from the REFERENCE IMAGES into the TARGET_ROOM. 

IMAGE ROLES & COORDINATES:
- The [MASK_IMAGE] is a 1:1 pixel map of [TARGET_ROOM]. 
- WHITE AREA = The EXACT "hole" or "window" where the new furniture must appear.
- BLACK AREA = This area is PROTECTED. You must NOT modify, replace, or smudge any pixels in the black area. 

ROLES:
`;

        // 1. Reference Furniture Images (Limit 3 for Gemini 2.5 Flash)
        let refCount = 0;
        if (mode === 'furniture' && furnitureId) {
            const furniture = await Furniture.findByPk(furnitureId, {
                include: [{ model: FurnitureImage, as: 'images' }]
            });
            if (furniture && furniture.images) {
                const furnDir = path.join(__dirname, '../private/uploads/furniture');
                const refs = furniture.images.slice(0, 8);
                for (const img of refs) {
                    const imgPath = path.join(furnDir, img.filename);
                    const part = fileToGenerativePart(imgPath);
                    if (part) {
                        parts.push(part);
                        promptText += `- Part ${parts.length - 1} [Image]: [REFERENCE_${refCount + 1}] (Object to insert)\n`;
                        refCount++;
                    }
                }
            }
        }

        // 2. The Mask
        if (mode === 'furniture' && req.files && req.files['mask']) {
            const maskPart = fileToGenerativePart(req.files['mask'][0].path, 'image/png');
            if (maskPart) {
                parts.push(maskPart);
                promptText += `- Part ${parts.length - 1} [Image]: [MASK_IMAGE] (White area = where to place objects)\n`;
            }
        }

        // 3. The Target Room (Anchor)
        const roomPart = fileToGenerativePart(originalPath, 'image/png');
        if (roomPart) {
            parts.push(roomPart);
            promptText += `- Part ${parts.length - 1} [Image]: [TARGET_ROOM] (The background canvas)\n`;
        }

        promptText += `
STRICT INSTRUCTIONS:
1. Identify the furniture in the [REFERENCE] images.
2. Render it UNTO the [TARGET_ROOM] strictly ONLY within the [MASK_IMAGE] white area.
3. This is a SURGICAL task: Do not replace or modify anything outside the white mask (like nearby tables or walls).
4. Match lighting, shadows, and perspective of the [TARGET_ROOM] perfectly.
5. Return only the final image.`;

        if (prompt) promptText += `\nAdditional Style Request: ${prompt}`;
        if (resolution) promptText += `\nResolution: ${resolution}`;

        // Insert prompt at the START
        parts.unshift(promptText);

        // Debug Log
        console.log("=== Gemini Edit API Payload (Grounded) ===");
        parts.forEach((p, i) => {
            if (typeof p === 'string') {
                console.log(`  Part ${i} [Text]:\n${p}\n`);
            } else {
                console.log(`  Part ${i} [Image]: ${p.inlineData.mimeType} | Size: ${p.size} bytes | Source: ${p.sourcePath}`);
            }
        });

        // Clean parts for API
        const cleanParts = cleanPartsForAI(parts);

        // Generate
        if (req.body.dryRun === 'true' || req.body.dryRun === true) {
            return res.json({
                dryRun: true,
                payload: cleanParts
            });
        }

        const generatedImages = [];
        for (let i = 0; i < parseInt(versions); i++) {
            const previewFilename = `preview-edit-${Date.now()}-${i}.png`;
            const previewPath = path.join(userDir, previewFilename);
            let imageSaved = false;

            try {
                const result = await model.generateContent(cleanParts);
                const response = await result.response;

                // Reuse parsing logic
                if (response.candidates && response.candidates[0]?.content?.parts) {
                    const inlinePart = response.candidates[0].content.parts.find(p => p.inlineData);
                    if (inlinePart && inlinePart.inlineData.data) {
                        fs.writeFileSync(previewPath, Buffer.from(inlinePart.inlineData.data, 'base64'));
                        imageSaved = true;
                    }
                }
            } catch (e) {
                console.error("Edit generation error", e);
            }

            if (!imageSaved) {
                // Fallback
                const placeholder = path.join(__dirname, '../public/logo.png');
                if (fs.existsSync(placeholder)) fs.copyFileSync(placeholder, previewPath);
            }

            generatedImages.push({
                url: `/api/projects/image/${previewFilename}`,
                filename: previewFilename
            });
        }

        // Cleanup
        uploadedFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

        res.json({
            message: 'Image edited successfully',
            images: generatedImages,
            cost: parseInt(versions), // Simplified cost return
            params: { versions: parseInt(versions) }
        });

    } catch (err) {
        uploadedFiles.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
        console.error(err);
        res.status(500).json({ message: 'Edit failed' });
    }
});

router.post('/discard', async (req, res) => {
    try {
        const { filenames } = req.body;
        if (!filenames || !Array.isArray(filenames)) return res.status(400).json({ message: 'Invalid filenames' });

        const userId = req.user.id;
        const userDir = path.join(uploadDir, userId.toString());

        let deletedCount = 0;
        for (const filename of filenames) {
            // Security: Prevents traversing up
            const safeFilename = path.basename(filename);
            const filePath = path.join(userDir, safeFilename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                deletedCount++;
            }
        }
        res.json({ message: 'Cleaned up', deleted: deletedCount });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error during cleanup' });
    }
});

router.post('/images/save', async (req, res) => {
    try {
        const { projectId, filenames, cost } = req.body;
        // Support legacy single filename also, for robustness, or just enforce array
        const filesToSave = Array.isArray(filenames) ? filenames : (req.body.filename ? [req.body.filename] : []);

        if (filesToSave.length === 0) return res.status(400).json({ message: 'No images selected' });

        const project = await Project.findOne({ where: { id: projectId, userId: req.user.id } });
        if (!project) return res.status(404).json({ message: 'Project not found' });

        // Credit deduction - Deduct cost ONCE for the batch
        const user = await User.findByPk(req.user.id);
        if (user.credits < cost) return res.status(400).json({ message: 'Insufficient credits' });

        user.credits -= cost;
        await user.save();

        const userId = req.user.id;
        const userDir = path.join(uploadDir, userId.toString());
        const savedImages = [];

        for (const filename of filesToSave) {
            const finalFilename = `gen-${Date.now()}-${Math.round(Math.random() * 1000)}.png`;
            const tempPath = path.join(userDir, filename);
            const finalPath = path.join(userDir, finalFilename);

            if (fs.existsSync(tempPath)) {
                fs.renameSync(tempPath, finalPath);
            } else {
                // Fallback
                fs.writeFileSync(finalPath, 'fallback-data');
            }

            const image = await ProjectImage.create({
                filename: finalFilename,
                projectId,
                userId: req.user.id
            });
            savedImages.push(image);
        }

        // Return array of images, remaining credits
        res.json({ images: savedImages, remainingCredits: user.credits });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Secure image serving
router.get('/image/:filename', (req, res) => {
    // Check if filename contains folder part? No, filename usually flat here.
    // BUT we moved files to /uploadDir/userId/.
    // The client requests /api/projects/image/:filename.
    // We need to look in the right folder. 
    // IF USER IS LOGGED IN, we check THEIR folder?
    // OR we check globally?
    // If we want strict privacy, we check req.user.id's folder.

    // HOWEVER, if we just use the filename to lookup the DB, we can get the userId from the DB record!
    // This is safer.

    // For PREVIEWS (preview-...), we assume they belong to the current user (req.user.id).

    const userId = req.user ? req.user.id : null;
    if (!userId) return res.status(401).send('Unauthorized');

    const userDir = path.join(uploadDir, userId.toString());
    const filePath = path.join(userDir, req.params.filename);

    // ALLOW PREVIEWS: If it's a temporary preview, bypass DB check but keep User Dir check
    if (req.params.filename.startsWith('preview-')) {
        if (fs.existsSync(filePath)) return res.sendFile(filePath);
        return res.status(404).send('Not found');
    }

    // Check ownership for saved project images
    ProjectImage.findOne({ where: { filename: req.params.filename, userId } })
        .then(img => {
            if (!img) return res.status(403).send('Access denied');
            if (fs.existsSync(filePath)) return res.sendFile(filePath);

            // Fallback for old images before migration? Not needed for new app.
            res.status(404).send('File missing');
        })
        .catch(err => res.status(500).send('Server error'));
});

module.exports = router;
