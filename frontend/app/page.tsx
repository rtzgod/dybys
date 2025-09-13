'use client';

import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Music, TrendingUp, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import useAppStore from '@/lib/store';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';

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
  investments?: any[];
}

export default function Home() {
  const [loading, setLoading] = useState(true);
  const { connected } = useWallet();
  const { tracks, addInvestment } = useAppStore();

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleInvest = (trackId: string) => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }
    // Navigate to marketplace with the specific track
    window.location.href = `/marketplace?track=${trackId}`;
  };

  const tokenizedTracks = tracks.filter(track => track.isTokenized);
  const totalInvested = tracks.reduce((sum, track) => {
    const trackInvestments = track.investments?.reduce((s, inv) => s + inv.totalPaid, 0) || 0;
    return sum + trackInvestments;
  }, 0);
  const uniqueInvestors = new Set(tracks.flatMap(track => 
    track.investments?.map(inv => inv.investorId) || []
  )).size;

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Welcome to 
              <span className="text-primary"> dybys</span>
              <br />
              <span className="text-2xl md:text-4xl text-muted-foreground">Tokenize Your Music</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The decentralized music platform where artists tokenize tracks and investors fund the next big hits. 
              Built on Solana blockchain for transparent royalty sharing.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="px-8">
                <Link href="/artist/upload">
                  <Music className="w-5 h-5 mr-2" />
                  Upload Your Track
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="px-8">
                <Link href="/marketplace">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Explore Investments
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                <Music className="w-8 h-8 mx-auto mb-2" />
                {tokenizedTracks.length}
              </div>
              <div className="text-sm text-muted-foreground">Tokenized Tracks</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                <Users className="w-8 h-8 mx-auto mb-2" />
                {uniqueInvestors}
              </div>
              <div className="text-sm text-muted-foreground">Active Investors</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                <DollarSign className="w-8 h-8 mx-auto mb-2" />
                {totalInvested.toFixed(1)} SOL
              </div>
              <div className="text-sm text-muted-foreground">Total Invested</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tracks */}
      <section className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold">Featured Tracks</h2>
              <p className="text-muted-foreground mt-2">
                Discover the latest tokenized music investments
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/marketplace">View All</Link>
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading tracks...</p>
            </div>
          ) : tokenizedTracks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tokenizedTracks.slice(0, 6).map((track) => (
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
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tracks Available Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to upload and tokenize a track!
              </p>
              <Button asChild>
                <Link href="/artist/upload">Upload Your First Track</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-muted-foreground mt-2">
              Three simple steps to start tokenizing music
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Upload Your Track</h3>
              <p className="text-muted-foreground">
                Artists upload their music and set tokenization parameters
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Tokenize & List</h3>
              <p className="text-muted-foreground">
                Create tokens on Solana blockchain and list for investment
              </p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Earn & Share</h3>
              <p className="text-muted-foreground">
                Investors buy tokens, artists get funding, all share in royalties
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
