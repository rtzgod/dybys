import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/tracks';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Middleware to verify JWT token
const authenticateToken = (req: any, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Get all tracks
router.get('/', async (req, res) => {
  try {
    const tracks = await prisma.track.findMany({
      include: {
        artist: {
          select: {
            id: true,
            walletAddress: true,
            email: true
          }
        },
        investments: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({ tracks });
  } catch (error) {
    console.error('Get tracks error:', error);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// Get single track
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const track = await prisma.track.findUnique({
      where: { id },
      include: {
        artist: {
          select: {
            id: true,
            walletAddress: true,
            email: true
          }
        },
        investments: {
          include: {
            investor: {
              select: {
                id: true,
                walletAddress: true
              }
            }
          }
        }
      }
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    res.json({ track });
  } catch (error) {
    console.error('Get track error:', error);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// Upload track (artists only)
router.post('/upload', authenticateToken, upload.single('audioFile'), [
  body('title').isLength({ min: 1 }).withMessage('Title is required'),
  body('metadata').optional().isJSON().withMessage('Metadata must be valid JSON')
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (req.user.role !== 'ARTIST') {
      return res.status(403).json({ error: 'Only artists can upload tracks' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const { title, metadata } = req.body;
    const fileUrl = `/uploads/tracks/${req.file.filename}`;

    const track = await prisma.track.create({
      data: {
        title,
        artistId: req.user.userId,
        fileUrl,
        metadata: metadata ? JSON.parse(metadata) : null
      }
    });

    res.status(201).json({
      message: 'Track uploaded successfully',
      track
    });
  } catch (error) {
    console.error('Upload track error:', error);
    res.status(500).json({ error: 'Failed to upload track' });
  }
});

// Tokenize track
router.post('/:id/tokenize', authenticateToken, [
  body('totalSupply').isInt({ min: 1 }).withMessage('Total supply must be a positive integer'),
  body('pricePerToken').isFloat({ min: 0.001 }).withMessage('Price per token must be positive'),
  body('royaltyPercentage').optional().isInt({ min: 0, max: 10000 }).withMessage('Royalty percentage must be between 0 and 10000 basis points')
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { totalSupply, pricePerToken, royaltyPercentage = 1000 } = req.body;

    // Find track and verify ownership
    const track = await prisma.track.findUnique({
      where: { id },
      include: { artist: true }
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (track.artistId !== req.user.userId) {
      return res.status(403).json({ error: 'Only track owner can tokenize' });
    }

    if (track.isTokenized) {
      return res.status(400).json({ error: 'Track is already tokenized' });
    }

    // Update track with tokenization parameters
    const updatedTrack = await prisma.track.update({
      where: { id },
      data: {
        totalSupply,
        pricePerToken,
        royaltyPercentage,
        // Note: tokenMint will be set after Solana transaction
        // isTokenized will be set to true after successful blockchain transaction
      }
    });

    res.json({
      message: 'Track prepared for tokenization',
      track: updatedTrack,
      instruction: 'Complete the tokenization process on the blockchain'
    });
  } catch (error) {
    console.error('Tokenize track error:', error);
    res.status(500).json({ error: 'Failed to tokenize track' });
  }
});

// Update track tokenization status (called after successful blockchain transaction)
router.put('/:id/tokenization-complete', authenticateToken, [
  body('tokenMint').isLength({ min: 32 }).withMessage('Valid token mint address required')
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { tokenMint } = req.body;

    const track = await prisma.track.findUnique({
      where: { id }
    });

    if (!track || track.artistId !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updatedTrack = await prisma.track.update({
      where: { id },
      data: {
        tokenMint,
        isTokenized: true
      }
    });

    res.json({
      message: 'Track tokenization completed',
      track: updatedTrack
    });
  } catch (error) {
    console.error('Complete tokenization error:', error);
    res.status(500).json({ error: 'Failed to complete tokenization' });
  }
});

export default router;