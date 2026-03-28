// ============================================================
// PlantNet Route — plant identification via image upload
// POST /api/plantnet    (multipart/form-data, field: "image")
// ============================================================
import { Router } from 'express';
import fetch from 'node-fetch';
import FormData from 'form-data';
import multer from 'multer';

const router = Router();
const API_KEY = process.env.PLANTNET_API_KEY;
const PLANTNET_URL = 'https://my-api.plantnet.org/v2/identify/all';

// Store upload in memory (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are accepted'));
    }
    cb(null, true);
  },
});

router.post('/', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided (field name: image)' });
  }

  const organ = req.body.organ || 'leaf';

  try {
    const formData = new FormData();
    formData.append('images', req.file.buffer, {
      filename: req.file.originalname,
      contentType: req.file.mimetype,
    });
    formData.append('organs', organ);

    const response = await fetch(`${PLANTNET_URL}?api-key=${process.env.PLANTNET_API_KEY}&lang=en&include-related-images=false`, {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`PlantNet error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('[PlantNet Route]', err.message);
    res.status(502).json({ error: err.message });
  }
});

export default router;
