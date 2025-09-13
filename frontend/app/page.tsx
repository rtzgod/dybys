'use client';

import { useEffect, useState } from 'react';
import { TrackCard } from '@/components/TrackCard';
import { Button } from '@/components/ui/button';
import { Music, TrendingUp, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';

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
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in real app this would fetch from API
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
      }
    ];

    setTracks(mockTracks);
    setLoading(false);
  }, []);

  const handleInvest = (trackId: string) => {
    // This would open the investment modal
    console.log('Invest in track:', trackId);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Tokenize Your Music,
              <br />
              <span className="text-primary">Unlock Your Future</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Artists tokenize their tracks, investors fund the next big hits. 
              Join the decentralized music revolution on Solana.
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
                {tracks.length}
              </div>
              <div className="text-sm text-muted-foreground">Tracks Available</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                <Users className="w-8 h-8 mx-auto mb-2" />
                50+
              </div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold text-primary">
                <DollarSign className="w-8 h-8 mx-auto mb-2" />
                $25k
              </div>
              <div className="text-sm text-muted-foreground">Total Raised</div>
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tracks.slice(0, 6).map((track) => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onInvest={handleInvest}
                />
              ))}
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
