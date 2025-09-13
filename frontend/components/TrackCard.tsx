'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Play, TrendingUp, User } from 'lucide-react';
import { useState } from 'react';

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
  tokensSold?: number;
  investments?: any[];
}

interface TrackCardProps {
  track: Track;
  onInvest?: (trackId: string) => void;
  showInvestButton?: boolean;
}

export function TrackCard({ track, onInvest, showInvestButton = true }: TrackCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const tokensSold = track.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const totalSupply = track.totalSupply || 0;
  const progressPercentage = totalSupply > 0 ? (tokensSold / totalSupply) * 100 : 0;
  const totalRaised = track.investments?.reduce((sum, inv) => sum + inv.totalPaid, 0) || 0;

  const handlePlay = () => {
    // In a real app, this would play the audio
    setIsPlaying(!isPlaying);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{track.title}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {track.artist.email}
            </CardDescription>
          </div>
          <Badge variant={track.isTokenized ? "default" : "secondary"}>
            {track.isTokenized ? "Tokenized" : "Not Tokenized"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Audio Player Placeholder */}
        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
          <Button
            size="sm"
            variant="ghost"
            onClick={handlePlay}
            className="w-8 h-8 p-0"
          >
            <Play className={`w-4 h-4 ${isPlaying ? 'animate-pulse' : ''}`} />
          </Button>
          <div className="flex-1">
            <div className="text-sm font-medium">{track.title}</div>
            <div className="text-xs text-muted-foreground">
              Click to {isPlaying ? 'pause' : 'play'}
            </div>
          </div>
        </div>

        {track.isTokenized && (
          <>
            {/* Investment Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tokens Sold</span>
                <span className="font-medium">
                  {tokensSold.toLocaleString()} / {totalSupply.toLocaleString()}
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progressPercentage.toFixed(1)}% funded</span>
                <span>${totalRaised.toFixed(2)} raised</span>
              </div>
            </div>

            {/* Investment Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground">Price per Token</div>
                <div className="font-semibold">{track.pricePerToken} SOL</div>
              </div>
              <div>
                <div className="text-muted-foreground">Investors</div>
                <div className="font-semibold">
                  {new Set(track.investments?.map(inv => inv.investorId)).size || 0}
                </div>
              </div>
            </div>

            {/* Investment Button */}
            {showInvestButton && onInvest && (
              <Button 
                onClick={() => onInvest(track.id)}
                className="w-full"
                disabled={tokensSold >= totalSupply}
              >
                {tokensSold >= totalSupply ? (
                  'Fully Funded'
                ) : (
                  <>
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Invest in Track
                  </>
                )}
              </Button>
            )}
          </>
        )}

        {!track.isTokenized && (
          <div className="text-center py-4 text-muted-foreground">
            <TrendingUp className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <div className="text-sm">Not available for investment yet</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}