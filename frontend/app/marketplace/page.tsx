'use client';

import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import useAppStore from '@/lib/store';

// Simple toast replacement
const toast = {
  success: (message: string) => alert(`Success: ${message}`),
  error: (message: string) => alert(`Error: ${message}`)
};

interface Track {
  id: string;
  title: string;
  artist: {
    email: string;
    walletAddress: string;
  };
  fileUrl: string;
  isTokenized: boolean;
  totalSupply?: number;
  pricePerToken?: number;
  investments?: Array<{
    investorId: string;
    amount: number;
    totalPaid: number;
  }>;
}

export default function MarketplacePage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [investAmount, setInvestAmount] = useState('');
  const [isInvesting, setIsInvesting] = useState(false);
  const { connected, publicKey } = useWallet();
  const { tracks: storeTracks, addInvestment } = useAppStore();

  useEffect(() => {
    // Use tracks from store instead of fetching mock data
    setTracks(storeTracks);
    setLoading(false);
  }, [storeTracks]);

  const fetchTracks = async () => {
    try {
      // In a real app, this would fetch from your API
      // For now, using mock data
      const mockTracks: Track[] = [
        {
          id: '1',
          title: 'Digital Dreams',
          artist: {
            email: 'artist1@example.com',
            walletAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
          },
          fileUrl: '/audio/track1.mp3',
          isTokenized: true,
          totalSupply: 1000,
          pricePerToken: 0.1,
          investments: [
            { investorId: 'inv1', amount: 100, totalPaid: 10 },
            { investorId: 'inv2', amount: 150, totalPaid: 15 }
          ]
        },
        {
          id: '2',
          title: 'Neon Nights',
          artist: {
            email: 'artist2@example.com',
            walletAddress: '8VfDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
          },
          fileUrl: '/audio/track2.mp3',
          isTokenized: true,
          totalSupply: 500,
          pricePerToken: 0.2,
          investments: [
            { investorId: 'inv3', amount: 50, totalPaid: 10 }
          ]
        },
        {
          id: '3',
          title: 'Cosmic Journey',
          artist: {
            email: 'artist3@example.com',
            walletAddress: '7UeDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
          },
          fileUrl: '/audio/track3.mp3',
          isTokenized: true,
          totalSupply: 2000,
          pricePerToken: 0.05,
          investments: []
        },
        {
          id: '4',
          title: 'Urban Pulse',
          artist: {
            email: 'artist4@example.com',
            walletAddress: '6TdDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'
          },
          fileUrl: '/audio/track4.mp3',
          isTokenized: false,
          totalSupply: undefined,
          pricePerToken: undefined,
          investments: []
        }
      ];

      setTracks(mockTracks);
    } catch (error) {
      console.error('Failed to fetch tracks:', error);
      toast.error('Failed to load tracks');
    } finally {
      setLoading(false);
    }
  };

  const handleInvest = (trackId: string) => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      setSelectedTrack(track);
    }
  };

  const processInvestment = async () => {
    if (!selectedTrack || !investAmount || !publicKey) return;

    setIsInvesting(true);
    
    try {
      const amount = parseInt(investAmount);
      const totalCost = amount * (selectedTrack.pricePerToken || 0);

      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Add investment to store
      addInvestment({
        investorId: publicKey.toString(),
        trackId: selectedTrack.id,
        amount,
        totalPaid: totalCost
      });

      toast.success(`Successfully invested ${totalCost.toFixed(3)} SOL in ${selectedTrack.title}!`);
      setSelectedTrack(null);
      setInvestAmount('');
      
    } catch (error) {
      console.error('Investment failed:', error);
      toast.error('Investment failed. Please try again.');
    } finally {
      setIsInvesting(false);
    }
  };

  const filteredTracks = tracks.filter(track =>
    track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.artist.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tokenizedTracks = filteredTracks.filter(track => track.isTokenized);
  const availableForTokenization = filteredTracks.filter(track => !track.isTokenized);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Music Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and invest in tokenized music tracks
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tracks or artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" className="sm:w-auto">
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="text-center p-6 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-primary">{tokenizedTracks.length}</div>
          <div className="text-sm text-muted-foreground">Tokenized Tracks</div>
        </div>
        <div className="text-center p-6 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {tokenizedTracks.reduce((sum, track) => {
              const invested = track.investments?.reduce((s, inv) => s + inv.totalPaid, 0) || 0;
              return sum + invested;
            }, 0).toFixed(1)} SOL
          </div>
          <div className="text-sm text-muted-foreground">Total Invested</div>
        </div>
        <div className="text-center p-6 bg-muted/30 rounded-lg">
          <div className="text-2xl font-bold text-primary">
            {tokenizedTracks.reduce((sum, track) => {
              const uniqueInvestors = new Set(track.investments?.map(inv => inv.investorId)).size;
              return sum + uniqueInvestors;
            }, 0)}
          </div>
          <div className="text-sm text-muted-foreground">Active Investors</div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading tracks...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tokenized Tracks */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Available for Investment</h2>
                <p className="text-muted-foreground">Tokenized tracks ready for funding</p>
              </div>
              <Badge variant="secondary">{tokenizedTracks.length} tracks</Badge>
            </div>

            {tokenizedTracks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tokenizedTracks.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    onInvest={handleInvest}
                    showInvestButton={true}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-muted/30 rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No tokenized tracks yet</h3>
                <p className="text-muted-foreground">Check back soon for new investment opportunities!</p>
              </div>
            )}
          </section>

          {/* Coming Soon */}
          {availableForTokenization.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Coming Soon</h2>
                  <p className="text-muted-foreground">Tracks preparing for tokenization</p>
                </div>
                <Badge variant="outline">{availableForTokenization.length} tracks</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableForTokenization.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    showInvestButton={false}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Investment Dialog */}
      <Dialog open={!!selectedTrack} onOpenChange={() => setSelectedTrack(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invest in {selectedTrack?.title}</DialogTitle>
            <DialogDescription>
              Purchase tokens to support this track and earn royalties
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrack && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Price per Token</div>
                    <div className="font-semibold">{selectedTrack.pricePerToken} SOL</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Available Tokens</div>
                    <div className="font-semibold">
                      {(selectedTrack.totalSupply || 0) - (selectedTrack.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invest-amount">Number of Tokens</Label>
                <Input
                  id="invest-amount"
                  type="number"
                  placeholder="Enter amount..."
                  value={investAmount}
                  onChange={(e) => setInvestAmount(e.target.value)}
                  min="1"
                  max={(selectedTrack.totalSupply || 0) - (selectedTrack.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0)}
                />
                {investAmount && (
                  <p className="text-sm text-muted-foreground">
                    Total cost: {(parseInt(investAmount) * (selectedTrack.pricePerToken || 0)).toFixed(3)} SOL
                  </p>
                )}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTrack(null)}>
              Cancel
            </Button>
            <Button 
              onClick={processInvestment}
              disabled={!investAmount || isInvesting || !connected}
            >
              {isInvesting ? 'Processing...' : 'Invest Now'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}