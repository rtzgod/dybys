import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

// Register user
router.post('/register', [
  body('walletAddress').isLength({ min: 32 }).withMessage('Valid wallet address required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('role').isIn(['ARTIST', 'INVESTOR']).withMessage('Role must be ARTIST or INVESTOR')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { walletAddress, email, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { walletAddress },
          { email }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await prisma.user.create({
      data: {
        walletAddress,
        email,
        role
      }
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login user
router.post('/login', [
  body('walletAddress').isLength({ min: 32 }).withMessage('Valid wallet address required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { walletAddress } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { walletAddress }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, walletAddress: user.walletAddress, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get user profile
router.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        tracks: true,
        investments: {
          include: {
            track: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        email: user.email,
        role: user.role,
        tracks: user.tracks,
        investments: user.investments
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;