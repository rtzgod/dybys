'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, DollarSign, Coins, ExternalLink } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import { solanaService } from '@/lib/solana';
import { toast } from 'sonner';
import useAppStore from '@/lib/store';

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
  tokenMint?: string;
  pricePerToken?: number;
  totalSupply?: number;
  tokensSold?: number;
}

interface InvestmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
}

export function InvestmentDialog({ isOpen, onClose, track }: InvestmentDialogProps) {
  const [investmentAmount, setInvestmentAmount] = useState('10');
  const [isInvesting, setIsInvesting] = useState(false);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  
  const { connected, publicKey } = useWallet();
  const wallet = { publicKey, signTransaction: useWallet().signTransaction } as any;
  const { addInvestment } = useAppStore();

  const tokensToReceive = parseInt(investmentAmount) || 0;
  const totalCost = tokensToReceive * (track.pricePerToken || 0);
  const availableTokens = (track.totalSupply || 0) - (track.tokensSold || 0);

  // Load SOL balance when dialog opens
  useState(() => {
    if (connected && publicKey && isOpen) {
      solanaService.getBalance(publicKey).then(setSolBalance).catch(() => setSolBalance(0));
    }
  });

  const handleInvest = async () => {
    if (!connected || !publicKey || !track.tokenMint) {
      toast.error('Wallet not connected or track not tokenized');
      return;
    }

    if (tokensToReceive <= 0 || tokensToReceive > availableTokens) {
      toast.error('Invalid investment amount');
      return;
    }

    if (solBalance && totalCost > solBalance) {
      toast.error('Insufficient SOL balance', {
        description: `You need ${totalCost.toFixed(3)} SOL but only have ${solBalance.toFixed(3)} SOL`
      });
      return;
    }

    setIsInvesting(true);

    try {
      const loadingToast = toast.loading('Processing investment...', {
        description: 'Please confirm the transaction in your wallet.'
      });

      // Create investment transaction on blockchain
      const result = await solanaService.buyTokens(
        wallet,
        track.tokenMint,
        track.artist.walletAddress,
        tokensToReceive,
        track.pricePerToken || 0
      );

      toast.dismiss(loadingToast);

      // Add investment to local store
      addInvestment({
        investorId: publicKey.toString(),
        trackId: track.id,
        amount: tokensToReceive,
        totalPaid: result.totalCost,
        transactionSignature: result.signature
      });

      toast.success('Investment successful!', {
        description: `You purchased ${tokensToReceive} tokens for ${result.totalCost.toFixed(3)} SOL. Transaction: ${result.signature.slice(0, 8)}...`
      });

      onClose();
      setInvestmentAmount('10');
    } catch (error) {
      console.error('Investment failed:', error);
      
      let errorMessage = 'Investment failed. Please try again.';
      let description = '';
      
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction cancelled';
          description = 'You cancelled the transaction in your wallet.';
        } else if (error.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient funds';
          description = 'You don\'t have enough SOL to complete this investment.';
        } else {
          description = error.message;
        }
      }
      
      toast.error(errorMessage, { description });
    } finally {
      setIsInvesting(false);
    }
  };

  const artistDisplayName = track.artist.displayName || 
    `${track.artist.firstName || ''} ${track.artist.lastName || ''}`.trim() || 
    track.artist.email;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invest in "{track.title}"</DialogTitle>
          <DialogDescription>
            Purchase tokens to support this track and earn royalties
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Track Info */}
          <div className="bg-muted/30 p-4 rounded-lg">
            <h4 className="font-medium">{track.title}</h4>
            <p className="text-sm text-muted-foreground">by {artistDisplayName}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
              <div>
                <span className="text-muted-foreground">Price per Token</span>
                <div className="font-medium">{track.pricePerToken?.toFixed(3) || '0'} SOL</div>
              </div>
              <div>
                <span className="text-muted-foreground">Available Tokens</span>
                <div className="font-medium">{availableTokens.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* Investment Amount */}
          <div className="space-y-2">
            <Label htmlFor="investment-amount">Number of Tokens to Purchase</Label>
            <Input
              id="investment-amount"
              type="number"
              value={investmentAmount}
              onChange={(e) => setInvestmentAmount(e.target.value)}
              min="1"
              max={availableTokens}
              placeholder="Enter amount"
            />
            {tokensToReceive > availableTokens && (
              <div className="flex items-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>Amount exceeds available tokens</span>
              </div>
            )}
          </div>

          {/* Investment Summary */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-3">Investment Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Tokens to receive:</span>
                <span className="font-medium text-blue-900">{tokensToReceive.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Total cost:</span>
                <span className="font-medium text-blue-900">{totalCost.toFixed(3)} SOL</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Ownership percentage:</span>
                <span className="font-medium text-blue-900">
                  {track.totalSupply ? ((tokensToReceive / track.totalSupply) * 100).toFixed(2) : 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Wallet Balance */}
          {connected && solBalance !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your SOL balance:</span>
              <Badge variant={solBalance >= totalCost ? "default" : "destructive"}>
                {solBalance.toFixed(3)} SOL
              </Badge>
            </div>
          )}

          {/* Blockchain Info */}
          {track.tokenMint && (
            <div className="text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Coins className="h-3 w-3" />
                <span>Token Mint: {track.tokenMint.slice(0, 8)}...{track.tokenMint.slice(-8)}</span>
                <button className="text-blue-600 hover:text-blue-800">
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isInvesting}>
            Cancel
          </Button>
          <Button 
            onClick={handleInvest} 
            disabled={!connected || isInvesting || tokensToReceive <= 0 || tokensToReceive > availableTokens || !track.tokenMint}
          >
            {isInvesting ? 'Processing...' : (
              <>
                <DollarSign className="h-4 w-4 mr-1" />
                Invest {totalCost.toFixed(3)} SOL
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}