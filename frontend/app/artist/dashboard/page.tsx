'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Music, DollarSign, Users, TrendingUp, Edit, Trash2, Play, Pause, Send } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import useAppStore from '@/lib/store';
import { solanaService } from '@/lib/solana';
import { toast } from 'sonner';

interface RoyaltyDistribution {
  id: string;
  trackId: string;
  amount: number;
  perTokenAmount: number;
  distributionDate: string;
  description: string;
  totalTokens: number;
  eligibleInvestors: number;
}

export default function ArtistDashboardPage() {
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showRoyaltyDialog, setShowRoyaltyDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [royaltyAmount, setRoyaltyAmount] = useState('');
  const [royaltyDescription, setRoyaltyDescription] = useState('');
  const [editFormData, setEditFormData] = useState({
    title: '',
    description: '',
    genre: '',
    pricePerToken: '',
  });

  const { connected, publicKey, signTransaction } = useWallet();
  const { tracks, updateTrack, deleteTrack, investments, getInvestmentsByTrack, addRoyaltyDistribution, getRoyaltyDistributionsByTrack, addRoyaltyPayment } = useAppStore();

  // Get artist's tracks
  const artistTracks = tracks.filter(track => 
    publicKey && track.artist.walletAddress === publicKey.toString()
  );

  // Calculate track statistics
  const getTrackStats = (track: any) => {
    const trackInvestments = getInvestmentsByTrack(track.id);
    const tokensSold = trackInvestments.reduce((sum, inv) => sum + inv.amount, 0);
    const totalRaised = trackInvestments.reduce((sum, inv) => sum + inv.totalPaid, 0);
    const uniqueInvestors = new Set(trackInvestments.map(inv => inv.investorId)).size;
    const fundingProgress = track.totalSupply > 0 ? (tokensSold / track.totalSupply) * 100 : 0;

    return {
      tokensSold,
      totalRaised,
      uniqueInvestors,
      fundingProgress,
      availableTokens: (track.totalSupply || 0) - tokensSold
    };
  };

  const handleEditTrack = (track: any) => {
    setSelectedTrack(track);
    setEditFormData({
      title: track.title,
      description: track.description || '',
      genre: track.genre || '',
      pricePerToken: track.pricePerToken?.toString() || '',
    });
    setShowEditDialog(true);
  };

  const handleUpdateTrack = () => {
    if (!selectedTrack) return;

    const updates: any = {
      title: editFormData.title,
      description: editFormData.description,
      genre: editFormData.genre,
    };

    // Only allow price changes for non-tokenized tracks
    if (!selectedTrack.isTokenized) {
      updates.pricePerToken = parseFloat(editFormData.pricePerToken) || selectedTrack.pricePerToken;
    }

    updateTrack(selectedTrack.id, updates);

    toast.success('Track updated successfully!', {
      description: 'Your track information has been updated.'
    });
    
    setShowEditDialog(false);
    setSelectedTrack(null);
  };

  const handleDistributeRoyalty = (track: any) => {
    setSelectedTrack(track);
    setRoyaltyAmount('');
    setRoyaltyDescription('');
    setShowRoyaltyDialog(true);
  };

  const processRoyaltyDistribution = async () => {
    if (!selectedTrack || !royaltyAmount || !selectedTrack.tokenMint) return;

    const amount = parseFloat(royaltyAmount);
    if (amount <= 0) {
      toast.error('Please enter a valid royalty amount');
      return;
    }

    if (!selectedTrack.isTokenized || !selectedTrack.tokenMint) {
      toast.error('This track is not tokenized yet');
      return;
    }

    try {
      // Show loading toast
      const loadingToast = toast.loading('Distributing royalties...', {
        description: 'Processing blockchain payments to all token holders.'
      });

      // Get investment data for this track to determine token holders
      const trackInvestments = getInvestmentsByTrack(selectedTrack.id);
      
      if (trackInvestments.length === 0) {
        throw new Error('No investments found for this track. Investors need to purchase tokens first.');
      }

      // Use the new proportional distribution function with investment data
      const wallet = { publicKey, signTransaction };
      const result = await solanaService.distributeRoyaltiesProportionally(
        wallet as any,
        selectedTrack.tokenMint,
        amount,
        royaltyDescription,
        trackInvestments.map(inv => ({
          investorId: inv.investorId,
          amount: inv.amount // number of tokens owned
        }))
      );

      toast.dismiss(loadingToast);

      // Calculate per-token amount from actual distribution
      const totalTokensDistributed = result.recipients.reduce((sum: number, r: any) => sum + r.tokens, 0);
      const perTokenAmount = totalTokensDistributed > 0 ? result.totalDistributed / totalTokensDistributed : 0;

      // Create royalty distribution record
      const distributionId = `royalty-${Date.now()}`;
      addRoyaltyDistribution({
        trackId: selectedTrack.id,
        artistId: publicKey!.toString(),
        totalAmount: result.totalDistributed,
        perTokenAmount,
        distributionDate: new Date().toISOString(),
        description: royaltyDescription || `Royalty distribution - ${result.recipients.length} recipients`,
        totalTokensEligible: totalTokensDistributed,
        uniqueInvestors: result.recipients.length
      });

      // Record individual royalty payments to each recipient
      result.recipients.forEach(recipient => {
        addRoyaltyPayment({
          investorId: recipient.wallet,
          trackId: selectedTrack.id,
          distributionId,
          amount: recipient.amount,
          tokens: recipient.tokens,
          transactionSignature: result.signature,
          receivedAt: new Date().toISOString()
        });
      });
      
      toast.success(`Royalty distributed successfully!`, {
        description: `${result.totalDistributed.toFixed(4)} SOL distributed to ${result.recipients.length} token holders (${perTokenAmount.toFixed(6)} SOL per token).`
      });

      setShowRoyaltyDialog(false);
      setSelectedTrack(null);
      setRoyaltyAmount('');
      setRoyaltyDescription('');
      
    } catch (error) {
      console.error('Royalty distribution failed:', error);
      let errorMessage = 'Failed to distribute royalties. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Insufficient SOL balance')) {
          errorMessage = error.message;
        } else if (error.message.includes('No token holders found')) {
          errorMessage = 'No token holders found for this track';
        } else if (error.message.includes('User rejected')) {
          errorMessage = 'Transaction cancelled by user';
        }
      }
      
      toast.error(errorMessage);
    }
  };

  const handleDeleteTrack = (track: any) => {
    setSelectedTrack(track);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTrack = () => {
    if (!selectedTrack) return;

    deleteTrack(selectedTrack.id);
    
    toast.success('Track deleted successfully!', {
      description: 'Your track has been removed from the platform.'
    });
    
    setShowDeleteDialog(false);
    setSelectedTrack(null);
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <Music className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to access your artist dashboard.
          </p>
          <Button size="lg" disabled>
            Connect Wallet Required
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Artist Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your tracks and distribute royalties to your investors
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{artistTracks.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tokenized Tracks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {artistTracks.filter(track => track.isTokenized).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {artistTracks.reduce((sum, track) => {
                const stats = getTrackStats(track);
                return sum + stats.totalRaised;
              }, 0).toFixed(2)} SOL
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Investors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(
                artistTracks.flatMap(track => 
                  getInvestmentsByTrack(track.id).map(inv => inv.investorId)
                )
              ).size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tracks Management */}
      <Tabs defaultValue="tracks" className="space-y-6">
        <TabsList>
          <TabsTrigger value="tracks">My Tracks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="tracks" className="space-y-6">
          {artistTracks.length > 0 ? (
            <div className="grid gap-6">
              {artistTracks.map((track) => {
                const stats = getTrackStats(track);
                return (
                  <Card key={track.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{track.title}</CardTitle>
                          <CardDescription>
                            {track.genre && `${track.genre} • `}
                            Created {new Date(track.createdAt).toLocaleDateString()}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant={track.isTokenized ? "default" : "secondary"}>
                            {track.isTokenized ? "Tokenized" : "Not Tokenized"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Track Stats */}
                      {track.isTokenized && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-sm text-muted-foreground">Tokens Sold</div>
                            <div className="text-lg font-semibold">
                              {stats.tokensSold.toLocaleString()} / {track.totalSupply?.toLocaleString()}
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Total Raised</div>
                            <div className="text-lg font-semibold">{stats.totalRaised.toFixed(2)} SOL</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Investors</div>
                            <div className="text-lg font-semibold">{stats.uniqueInvestors}</div>
                          </div>
                          <div>
                            <div className="text-sm text-muted-foreground">Price per Token</div>
                            <div className="text-lg font-semibold">{track.pricePerToken?.toFixed(3)} SOL</div>
                          </div>
                        </div>
                      )}

                      {/* Funding Progress */}
                      {track.isTokenized && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Funding Progress</span>
                            <span className="font-medium">{stats.fundingProgress.toFixed(1)}%</span>
                          </div>
                          <Progress value={stats.fundingProgress} className="h-2" />
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditTrack(track)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {!track.isTokenized && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTrack(track)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          )}
                          {track.isTokenized && stats.tokensSold > 0 && (
                            <Button
                              size="sm"
                              onClick={() => handleDistributeRoyalty(track)}
                            >
                              <Send className="h-4 w-4 mr-1" />
                              Distribute Royalty
                            </Button>
                          )}
                        </div>
                        {track.description && (
                          <p className="text-sm text-muted-foreground max-w-md truncate">
                            {track.description}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tracks Yet</h3>
              <p className="text-muted-foreground mb-4">
                Upload your first track to start building your music portfolio
              </p>
              <Button asChild>
                <a href="/artist/upload">Upload Your First Track</a>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Royalty Distribution History */}
          <Card>
            <CardHeader>
              <CardTitle>Royalty Distribution History</CardTitle>
              <CardDescription>
                Track of all royalty payments you've distributed
              </CardDescription>
            </CardHeader>
            <CardContent>
              {publicKey && (() => {
                const artistRoyalties = useAppStore.getState().getRoyaltyDistributionsByArtist(publicKey.toString());
                return artistRoyalties.length > 0 ? (
                  <div className="space-y-4">
                    {artistRoyalties.map((distribution) => {
                      const track = tracks.find(t => t.id === distribution.trackId);
                      return (
                        <div key={distribution.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <DollarSign className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <div className="font-medium">{track?.title || 'Unknown Track'}</div>
                              <div className="text-sm text-muted-foreground">
                                {new Date(distribution.distributionDate).toLocaleDateString()}
                                {distribution.description && ` • ${distribution.description}`}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-semibold text-green-600">
                              {distribution.totalAmount.toFixed(3)} SOL
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {distribution.uniqueInvestors} investors • {distribution.perTokenAmount.toFixed(6)} SOL/token
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">No royalty distributions yet</p>
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Performance Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Track performance metrics and revenue analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {artistTracks.filter(track => track.isTokenized).map((track) => {
                  const stats = getTrackStats(track);
                  const royalties = getRoyaltyDistributionsByTrack(track.id);
                  const totalRoyaltyDistributed = royalties.reduce((sum, r) => sum + r.totalAmount, 0);
                  
                  return (
                    <div key={track.id} className="p-4 border rounded-lg">
                      <h4 className="font-medium mb-2">{track.title}</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Funding:</span>
                          <span>{stats.fundingProgress.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Raised:</span>
                          <span>{stats.totalRaised.toFixed(2)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Royalties Paid:</span>
                          <span>{totalRoyaltyDistributed.toFixed(3)} SOL</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Investors:</span>
                          <span>{stats.uniqueInvestors}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {artistTracks.filter(track => track.isTokenized).length === 0 && (
                <p className="text-muted-foreground text-center py-8">
                  No tokenized tracks to analyze yet.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Track Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Track</DialogTitle>
            <DialogDescription>
              Update your track information and settings
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Track Title</Label>
              <Input
                id="edit-title"
                value={editFormData.title}
                onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-genre">Genre</Label>
                <Input
                  id="edit-genre"
                  value={editFormData.genre}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, genre: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price per Token (SOL)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.001"
                  value={editFormData.pricePerToken}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, pricePerToken: e.target.value }))}
                  disabled={selectedTrack?.isTokenized}
                />
                {selectedTrack?.isTokenized && (
                  <p className="text-xs text-muted-foreground">
                    Price cannot be changed after tokenization to protect investor interests
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateTrack}>
              Update Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Royalty Distribution Dialog */}
      <Dialog open={showRoyaltyDialog} onOpenChange={setShowRoyaltyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Distribute Royalty</DialogTitle>
            <DialogDescription>
              Send royalty payments to all token holders of "{selectedTrack?.title}"
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrack && (
            <div className="space-y-4">
              {/* Track Info */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Tokens Sold</div>
                    <div className="font-semibold">
                      {getTrackStats(selectedTrack).tokensSold.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Eligible Investors</div>
                    <div className="font-semibold">
                      {getTrackStats(selectedTrack).uniqueInvestors}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="royalty-amount">Total Royalty Amount (SOL)</Label>
                <Input
                  id="royalty-amount"
                  type="number"
                  step="0.001"
                  placeholder="0.000"
                  value={royaltyAmount}
                  onChange={(e) => setRoyaltyAmount(e.target.value)}
                />
                {royaltyAmount && (
                  <p className="text-sm text-muted-foreground">
                    Per token: {(parseFloat(royaltyAmount) / getTrackStats(selectedTrack).tokensSold).toFixed(6)} SOL
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="royalty-description">Description (Optional)</Label>
                <Textarea
                  id="royalty-description"
                  placeholder="Q1 2024 streaming royalties..."
                  value={royaltyDescription}
                  onChange={(e) => setRoyaltyDescription(e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoyaltyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={processRoyaltyDistribution}
              disabled={!royaltyAmount || parseFloat(royaltyAmount) <= 0}
            >
              <Send className="h-4 w-4 mr-1" />
              Distribute Royalty
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Track Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Track</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedTrack?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-destructive/10 p-4 rounded-lg border border-destructive/20">
            <div className="flex items-start space-x-3">
              <Trash2 className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h4 className="font-medium text-destructive">Warning</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  This will permanently remove the track and all associated data. 
                  Only non-tokenized tracks can be deleted.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTrack}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete Track
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}