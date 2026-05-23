"use strict";
let __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const sharp_1 = __importDefault(require("sharp"));
const router = (0, express_1.Router)();
// POST /api/process-image
// Accepts JSON { width?: number, height?: number, color?: string }
// Returns a tiny generated PNG (base64) to demonstrate image processing.
router.post('/process-image', async (req, res) => {
    const width = Number(req.body.width) || 320;
    const height = Number(req.body.height) || 180;
    const color = req.body.color || '#0077cc';
    const maxDimension = 4096;
    const maxPixels = 4096 * 4096;
    if (!Number.isInteger(width) ||
        !Number.isInteger(height) ||
        width <= 0 ||
        height <= 0 ||
        width > maxDimension ||
        height > maxDimension ||
        width * height > maxPixels) {
        return res.status(400).json({ error: 'Image dimensions must be positive integers up to 4096px and 16MP total.' });
    }
    try {
        const img = await (0, sharp_1.default)({
            create: {
                width,
                height,
                channels: 4,
                background: color,
            },
        })
            .png()
            .toBuffer();
        return res.json({ ok: true, width, height, data: img.toString('base64') });
    }
    catch (err) {
        console.error('[process-image] error:', err);
        return res.status(500).json({ error: 'PROCESSING_FAILED' });
    }
});
exports.default = router;
