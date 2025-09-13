'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Play, TrendingUp, User, Pause } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { toast } from 'sonner';
import { audioManager } from '@/lib/audioManager';

interface Track {
  id: string;
  title: string;
  artist: {
    email: string;
    walletAddress: string;
    displayName?: string;
    firstName?: string;
    lastName?: string;
  };
  fileUrl: string;
  audioFile?: File;
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
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>('');
  const [audioError, setAudioError] = useState<string>('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const { connected, publicKey } = useWallet();

  const tokensSold = track.investments?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const totalSupply = track.totalSupply || 0;
  const progressPercentage = totalSupply > 0 ? (tokensSold / totalSupply) * 100 : 0;
  const totalRaised = track.investments?.reduce((sum, inv) => sum + inv.totalPaid, 0) || 0;
  
  // Check if the current user is the artist of this track
  const isOwnTrack = Boolean(connected && publicKey && track.artist.walletAddress === publicKey.toString());

  // Create fresh audio URL when component mounts or track changes
  useEffect(() => {
    setAudioError('');
    
    if (track.audioFile) {
      // Create fresh URL from stored File object
      const url = URL.createObjectURL(track.audioFile);
      setAudioUrl(url);
      
      // Cleanup previous URL
      return () => {
        URL.revokeObjectURL(url);
      };
    } else if (track.fileUrl) {
      // Fallback to stored URL
      setAudioUrl(track.fileUrl);
    } else {
      setAudioError('Audio file not available');
    }
  }, [track.audioFile, track.fileUrl, track.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setAudioError('');
    };

    const handleError = () => {
      console.error('Audio loading error:', audio.error);
      setAudioError('Failed to load audio file');
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
    };
  }, [audioUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        audioManager.stopCurrent();
      }
    };
  }, []);

  const handlePlay = () => {
    const audio = audioRef.current;
    if (!audio || audioError) {
      toast.error('Audio preview not available', {
        description: audioError || 'Audio file not found'
      });
      return;
    }

    if (isPlaying) {
      audioManager.pause();
      setIsPlaying(false);
    } else {
      // Ensure audio source is set
      if (!audio.src && audioUrl) {
        audio.src = audioUrl;
      }
      
      audioManager.play(audio, setIsPlaying).then(() => {
        setIsPlaying(true);
        setAudioError('');
      }).catch((error) => {
        console.error('Audio play failed:', error);
        let errorMessage = 'Audio preview not available';
        let description = 'Failed to play audio file';
        
        if (error.name === 'NotSupportedError') {
          description = 'Audio format not supported';
        } else if (error.name === 'NotAllowedError') {
          description = 'Audio blocked by browser - please interact with page first';
        } else if (error.name === 'AbortError') {
          description = 'Audio loading was interrupted';
        }
        
        toast.error(errorMessage, { description });
        setAudioError(description);
        setIsPlaying(false);
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = Number(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{track.title}</CardTitle>
            <CardDescription className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {track.artist.displayName || 
               `${track.artist.firstName || ''} ${track.artist.lastName || ''}`.trim() ||
               track.artist.email}
            </CardDescription>
          </div>
          <Badge variant={track.isTokenized ? "default" : "secondary"}>
            {track.isTokenized ? "Tokenized" : "Not Tokenized"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Audio Player */}
        <div className="space-y-3 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={handlePlay}
              className="w-8 h-8 p-0"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </Button>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between text-xs">
                <span className={`font-medium ${audioError ? 'text-red-600' : ''}`}>
                  🎵 Audio Preview {audioError ? '(Error)' : ''}
                </span>
                <span className="text-muted-foreground">
                  {audioError ? 'N/A' : `${formatTime(currentTime)} / ${formatTime(duration)}`}
                </span>
              </div>
              <div className="relative">
                <Progress 
                  value={duration > 0 ? (currentTime / duration) * 100 : 0} 
                  className="h-2"
                />
                {duration > 0 && (
                  <input
                    type="range"
                    min={0}
                    max={duration}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                    className="absolute inset-0 w-full h-2 bg-transparent appearance-none cursor-pointer opacity-0 hover:opacity-100"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          {...(audioUrl && { src: audioUrl })}
          preload="metadata"
        />
        
        {/* Show audio error if any */}
        {audioError && (
          <div className="text-center py-2 text-red-600 text-sm">
            <span>⚠️ {audioError}</span>
          </div>
        )}

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
                disabled={tokensSold >= totalSupply || isOwnTrack}
              >
                {isOwnTrack ? (
                  'Your Track'
                ) : tokensSold >= totalSupply ? (
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