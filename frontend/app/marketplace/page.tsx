'use client';

import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Search, Filter, TrendingUp } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import useAppStore from '@/lib/store';
import { toast } from 'sonner';

interface Track {
  id: string;
  title: string;
  description?: string;
  genre?: string;
  artist: {
    email: string;
    walletAddress: string;
  };
  fileUrl: string;
  isTokenized: boolean;
  totalSupply?: number;
  pricePerToken?: number;
  createdAt: string;
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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<string>('all');
  const [priceRange, setPriceRange] = useState([0, 1]);
  const [sortBy, setSortBy] = useState<string>('newest');
  const { connected, publicKey } = useWallet();
  const { tracks: storeTracks, addInvestment } = useAppStore();

  useEffect(() => {
    // Use tracks from store instead of fetching mock data
    setTracks(storeTracks);
    setLoading(false);
  }, [storeTracks]);


  const handleInvest = (trackId: string) => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      // Check if user is trying to invest in their own track
      if (publicKey && track.artist.walletAddress === publicKey.toString()) {
        toast.error('You cannot invest in your own track');
        return;
      }
      
      setSelectedTrack(track);
    }
  };

  const processInvestment = async () => {
    if (!selectedTrack || !investAmount || !publicKey) return;

    // Double-check that user is not investing in their own track
    if (selectedTrack.artist.walletAddress === publicKey.toString()) {
      toast.error('You cannot invest in your own track');
      setSelectedTrack(null);
      return;
    }

    setIsInvesting(true);
    
    try {
      const amount = parseInt(investAmount);
      const totalCost = amount * (selectedTrack.pricePerToken || 0);

      // Show loading toast
      const loadingToast = toast.loading('Processing investment...', {
        description: 'Please wait while we process your transaction on the Solana blockchain.'
      });

      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Add investment to store
      addInvestment({
        investorId: publicKey.toString(),
        trackId: selectedTrack.id,
        amount,
        totalPaid: totalCost
      });

      toast.success(`Successfully invested ${totalCost.toFixed(3)} SOL in "${selectedTrack.title}"!`, {
        description: `You now own ${amount} tokens and will receive royalty distributions.`
      });
      setSelectedTrack(null);
      setInvestAmount('');
      
    } catch (error) {
      console.error('Investment failed:', error);
      toast.error('Investment failed. Please try again.');
    } finally {
      setIsInvesting(false);
    }
  };

  // Get unique genres for filter options
  const availableGenres = Array.from(new Set(tracks.map(track => track.genre).filter(Boolean))) as string[];

  // Apply filters
  const filteredTracks = tracks.filter(track => {
    // Search filter
    const matchesSearch = track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         track.artist.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (track.genre && track.genre.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Genre filter
    const matchesGenre = selectedGenre === 'all' || track.genre === selectedGenre;
    
    // Price range filter
    const matchesPrice = !track.pricePerToken || 
                        (track.pricePerToken >= priceRange[0] && track.pricePerToken <= priceRange[1]);
    
    return matchesSearch && matchesGenre && matchesPrice;
  });

  // Sort tracks
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'price-low':
        return (a.pricePerToken || 0) - (b.pricePerToken || 0);
      case 'price-high':
        return (b.pricePerToken || 0) - (a.pricePerToken || 0);
      case 'title':
        return a.title.localeCompare(b.title);
      default:
        return 0;
    }
  });

  const tokenizedTracks = sortedTracks.filter(track => track.isTokenized);
  const availableForTokenization = sortedTracks.filter(track => !track.isTokenized);

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
        <Dialog open={showFilters} onOpenChange={setShowFilters}>
          <DialogTrigger asChild>
            <Button variant="outline" className="sm:w-auto">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {(selectedGenre !== 'all' || sortBy !== 'newest') && (
                <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                  {[selectedGenre !== 'all' ? 1 : 0, sortBy !== 'newest' ? 1 : 0].reduce((a, b) => a + b)}
                </Badge>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Filter Tracks</DialogTitle>
              <DialogDescription>
                Refine your search with genre, price, and sorting options
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Genre Filter */}
              <div className="space-y-2">
                <Label htmlFor="genre-select">Genre</Label>
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select genre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genres</SelectItem>
                    {availableGenres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <Label>Price Range (SOL)</Label>
                <div className="px-3">
                  <Slider
                    value={priceRange}
                    onValueChange={setPriceRange}
                    max={1}
                    min={0}
                    step={0.01}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground mt-1">
                    <span>{priceRange[0].toFixed(2)} SOL</span>
                    <span>{priceRange[1].toFixed(2)} SOL</span>
                  </div>
                </div>
              </div>

              {/* Sort By */}
              <div className="space-y-2">
                <Label htmlFor="sort-select">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="title">Title (A-Z)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedGenre('all');
                  setPriceRange([0, 1]);
                  setSortBy('newest');
                }}
              >
                Clear All
              </Button>
              <Button onClick={() => setShowFilters(false)}>
                Apply Filters
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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