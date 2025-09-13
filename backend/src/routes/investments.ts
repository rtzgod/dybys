import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';

const router = express.Router();
const prisma = new PrismaClient();

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

// Buy tokens (record investment after blockchain transaction)
router.post('/buy', authenticateToken, [
  body('trackId').isUUID().withMessage('Valid track ID required'),
  body('amount').isInt({ min: 1 }).withMessage('Amount must be a positive integer'),
  body('purchasePrice').isFloat({ min: 0.001 }).withMessage('Purchase price must be positive'),
  body('transactionSignature').isLength({ min: 64 }).withMessage('Valid transaction signature required')
], async (req: any, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { trackId, amount, purchasePrice, transactionSignature } = req.body;

    // Verify track exists and is tokenized
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      include: { artist: true }
    });

    if (!track) {
      return res.status(404).json({ error: 'Track not found' });
    }

    if (!track.isTokenized) {
      return res.status(400).json({ error: 'Track is not tokenized yet' });
    }

    // Check if investor has sufficient funds (this should be validated on blockchain)
    const totalCost = amount * purchasePrice;

    // Record the investment
    const investment = await prisma.investment.create({
      data: {
        investorId: req.user.userId,
        trackId,
        amount,
        purchasePrice,
        totalPaid: totalCost
      }
    });

    res.status(201).json({
      message: 'Investment recorded successfully',
      investment: {
        ...investment,
        track: {
          id: track.id,
          title: track.title,
          artist: track.artist.email
        },
        transactionSignature
      }
    });
  } catch (error) {
    console.error('Buy tokens error:', error);
    res.status(500).json({ error: 'Failed to record investment' });
  }
});

// Get investor portfolio
router.get('/portfolio', authenticateToken, async (req: any, res) => {
  try {
    const investments = await prisma.investment.findMany({
      where: {
        investorId: req.user.userId
      },
      include: {
        track: {
          include: {
            artist: {
              select: {
                id: true,
                email: true,
                walletAddress: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate portfolio summary
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalPaid, 0);
    const totalTokens = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const uniqueTracks = new Set(investments.map(inv => inv.trackId)).size;

    res.json({
      portfolio: {
        totalInvested,
        totalTokens,
        uniqueTracks,
        investments
      }
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

// Get investments for a specific track
router.get('/track/:trackId', async (req, res) => {
  try {
    const { trackId } = req.params;

    const investments = await prisma.investment.findMany({
      where: { trackId },
      include: {
        investor: {
          select: {
            id: true,
            walletAddress: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Calculate investment summary for this track
    const totalRaised = investments.reduce((sum, inv) => sum + inv.totalPaid, 0);
    const totalTokensSold = investments.reduce((sum, inv) => sum + inv.amount, 0);
    const uniqueInvestors = new Set(investments.map(inv => inv.investorId)).size;

    res.json({
      trackInvestments: {
        totalRaised,
        totalTokensSold,
        uniqueInvestors,
        investments
      }
    });
  } catch (error) {
    console.error('Get track investments error:', error);
    res.status(500).json({ error: 'Failed to fetch track investments' });
  }
});

// Get royalty history (placeholder for future implementation)
router.get('/royalties', authenticateToken, async (req: any, res) => {
  try {
    // This would be implemented when royalty distribution is added
    // For now, return empty array
    res.json({
      royalties: [],
      totalEarned: 0,
      message: 'Royalty distribution coming soon'
    });
  } catch (error) {
    console.error('Get royalties error:', error);
    res.status(500).json({ error: 'Failed to fetch royalties' });
  }
});

// Get investment statistics for artists
router.get('/artist-stats', authenticateToken, async (req: any, res) => {
  try {
    if (req.user.role !== 'ARTIST') {
      return res.status(403).json({ error: 'Only artists can view these stats' });
    }

    // Get all tracks by this artist with their investments
    const tracks = await prisma.track.findMany({
      where: {
        artistId: req.user.userId
      },
      include: {
        investments: true
      }
    });

    const stats = tracks.map(track => {
      const totalRaised = track.investments.reduce((sum, inv) => sum + inv.totalPaid, 0);
      const totalTokensSold = track.investments.reduce((sum, inv) => sum + inv.amount, 0);
      const uniqueInvestors = new Set(track.investments.map(inv => inv.investorId)).size;

      return {
        track: {
          id: track.id,
          title: track.title,
          isTokenized: track.isTokenized,
          totalSupply: track.totalSupply,
          pricePerToken: track.pricePerToken
        },
        stats: {
          totalRaised,
          totalTokensSold,
          uniqueInvestors,
          percentageSold: track.totalSupply ? (totalTokensSold / track.totalSupply) * 100 : 0
        }
      };
    });

    const overallStats = {
      totalTracks: tracks.length,
      tokenizedTracks: tracks.filter(t => t.isTokenized).length,
      totalRaised: stats.reduce((sum, s) => sum + s.stats.totalRaised, 0),
      totalTokensSold: stats.reduce((sum, s) => sum + s.stats.totalTokensSold, 0)
    };

    res.json({
      overallStats,
      trackStats: stats
    });
  } catch (error) {
    console.error('Get artist stats error:', error);
    res.status(500).json({ error: 'Failed to fetch artist statistics' });
  }
});

export default router;