'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TrendingUp, DollarSign, Music, Users, ArrowUpRight, ArrowDownRight, Eye, Edit, Save, X, Plus } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import useAppStore from '@/lib/store';
import { toast } from 'sonner';

interface Investment {
  id: string;
  trackId: string;
  trackTitle: string;
  artistEmail: string;
  tokensOwned: number;
  totalInvested: number;
  pricePerToken: number;
  currentValue: number;
  royaltiesEarned: number;
  investmentDate: string;
  track: {
    totalSupply: number;
    tokensSold: number;
    isActive: boolean;
  };
}

interface RoyaltyPayment {
  id: string;
  trackTitle: string;
  amount: number;
  date: string;
  transactionId: string;
}

interface PortfolioNote {
  investmentId: string;
  notes: string;
  investmentGoal: string;
  tags: string[];
  targetReturn: number;
  personalRating: number; // 1-5 stars
  lastUpdated: string;
}

export default function InvestorPortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [royaltyPayments, setRoyaltyPayments] = useState<RoyaltyPayment[]>([]);
  const [portfolioNotes, setPortfolioNotes] = useState<PortfolioNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvestment, setSelectedInvestment] = useState<Investment | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<PortfolioNote | null>(null);
  const [noteFormData, setNoteFormData] = useState({
    notes: '',
    investmentGoal: '',
    tags: '',
    targetReturn: '',
    personalRating: 3
  });
  
  const { connected, publicKey } = useWallet();
  const { tracks, getInvestmentsByInvestor, getInvestmentsByTrack, getRoyaltyPaymentsByInvestor } = useAppStore();

  useEffect(() => {
    if (connected) {
      fetchPortfolioData();
    }
  }, [connected]);

  const fetchPortfolioData = async () => {
    try {
      if (!publicKey) return;

      // Get investments from store
      const userInvestments = getInvestmentsByInvestor(publicKey.toString());
      
      // Transform store data to portfolio format
      const portfolioInvestments: Investment[] = userInvestments.map(investment => {
        const track = tracks.find(t => t.id === investment.trackId);
        if (!track) return null;

        const tokensOwned = investment.amount;
        const totalInvested = investment.totalPaid;
        const pricePerToken = track.pricePerToken || 0;
        
        // Calculate current value - tokens maintain their investment value until sold
        const currentValue = totalInvested; // No fake appreciation
        
        // Calculate total tokens sold for this track
        const allTrackInvestments = getInvestmentsByTrack(track.id);
        const tokensSold = allTrackInvestments.reduce((sum, inv) => sum + inv.amount, 0);

        // Calculate actual royalties earned from recorded payments
        const royaltyPayments = getRoyaltyPaymentsByInvestor(publicKey.toString()).filter(
          payment => payment.trackId === track.id
        );
        const royaltiesEarned = royaltyPayments.reduce((sum, payment) => sum + payment.amount, 0);

        return {
          id: investment.id,
          trackId: track.id,
          trackTitle: track.title,
          artistEmail: track.artist.email,
          tokensOwned,
          totalInvested,
          pricePerToken,
          currentValue,
          royaltiesEarned, // Real royalties from actual distributions
          investmentDate: investment.createdAt,
          track: {
            totalSupply: track.totalSupply || 0,
            tokensSold,
            isActive: track.isTokenized
          }
        };
      }).filter(Boolean) as Investment[];

      // Get real royalty payments for this investor
      const investorRoyaltyPayments = getRoyaltyPaymentsByInvestor(publicKey.toString()).map(payment => {
        const track = tracks.find(t => t.id === payment.trackId);
        return {
          id: payment.id,
          trackTitle: track?.title || 'Unknown Track',
          amount: payment.amount,
          date: payment.receivedAt.split('T')[0], // Format date
          transactionId: payment.transactionSignature
        };
      });

      setInvestments(portfolioInvestments);
      setRoyaltyPayments(investorRoyaltyPayments);
      
      // Load portfolio notes from localStorage
      loadPortfolioNotes();
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
      toast.error('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioNotes = () => {
    try {
      const savedNotes = localStorage.getItem(`portfolio-notes-${publicKey?.toString()}`);
      if (savedNotes) {
        setPortfolioNotes(JSON.parse(savedNotes));
      }
    } catch (error) {
      console.error('Failed to load portfolio notes:', error);
    }
  };

  const savePortfolioNotes = (notes: PortfolioNote[]) => {
    try {
      localStorage.setItem(`portfolio-notes-${publicKey?.toString()}`, JSON.stringify(notes));
      setPortfolioNotes(notes);
    } catch (error) {
      console.error('Failed to save portfolio notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handleAddNote = (investment: Investment) => {
    const existingNote = portfolioNotes.find(note => note.investmentId === investment.id);
    if (existingNote) {
      setEditingNote(existingNote);
      setNoteFormData({
        notes: existingNote.notes,
        investmentGoal: existingNote.investmentGoal,
        tags: existingNote.tags.join(', '),
        targetReturn: existingNote.targetReturn.toString(),
        personalRating: existingNote.personalRating
      });
    } else {
      setEditingNote(null);
      setNoteFormData({
        notes: '',
        investmentGoal: '',
        tags: '',
        targetReturn: '',
        personalRating: 3
      });
    }
    setSelectedInvestment(investment);
    setShowNotesDialog(true);
  };

  const handleSaveNote = () => {
    if (!selectedInvestment) return;

    const noteData: PortfolioNote = {
      investmentId: selectedInvestment.id,
      notes: noteFormData.notes,
      investmentGoal: noteFormData.investmentGoal,
      tags: noteFormData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      targetReturn: parseFloat(noteFormData.targetReturn) || 0,
      personalRating: noteFormData.personalRating,
      lastUpdated: new Date().toISOString()
    };

    const updatedNotes = editingNote 
      ? portfolioNotes.map(note => note.investmentId === selectedInvestment.id ? noteData : note)
      : [...portfolioNotes, noteData];

    savePortfolioNotes(updatedNotes);
    
    toast.success('Investment information saved!', {
      description: 'Your notes and goals have been updated.'
    });
    
    setShowNotesDialog(false);
    setEditingNote(null);
  };

  const getInvestmentNote = (investmentId: string) => {
    return portfolioNotes.find(note => note.investmentId === investmentId);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span 
        key={i} 
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };

  const calculatePortfolioStats = () => {
    const totalInvested = investments.reduce((sum, inv) => sum + inv.totalInvested, 0);
    const currentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0);
    const totalRoyalties = investments.reduce((sum, inv) => sum + inv.royaltiesEarned, 0);
    const totalGain = (currentValue - totalInvested) + totalRoyalties; // Capital gains + royalties
    const totalGainPercentage = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      totalRoyalties,
      totalGain,
      totalGainPercentage,
      activeInvestments: investments.filter(inv => inv.track.isActive).length,
      totalTokens: investments.reduce((sum, inv) => sum + inv.tokensOwned, 0)
    };
  };

  const stats = calculatePortfolioStats();

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <Users className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to view your investment portfolio.
          </p>
          <Button size="lg" disabled>
            Connect Wallet Required
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading your portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Investment Portfolio</h1>
        <p className="text-muted-foreground">
          Track your music investments and royalty earnings
        </p>
      </div>

      {/* Portfolio Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invested</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalInvested.toFixed(2)} SOL</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.currentValue.toFixed(2)} SOL</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Royalties Earned</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoyalties.toFixed(2)} SOL</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Gain/Loss</CardTitle>
            {stats.totalGain >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              stats.totalGain >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.totalGain >= 0 ? '+' : ''}{stats.totalGain.toFixed(2)} SOL
            </div>
            <p className={`text-xs ${
              stats.totalGainPercentage >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {stats.totalGainPercentage >= 0 ? '+' : ''}{stats.totalGainPercentage.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="investments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="investments">My Investments</TabsTrigger>
          <TabsTrigger value="royalties">Royalty History</TabsTrigger>
        </TabsList>

        <TabsContent value="investments" className="space-y-6">
          {investments.length > 0 ? (
            <div className="grid gap-6">
              {investments.map((investment) => (
                <Card key={investment.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">{investment.trackTitle}</CardTitle>
                        <CardDescription>by {investment.artistEmail}</CardDescription>
                      </div>
                      <Badge variant={investment.track.isActive ? "default" : "secondary"}>
                        {investment.track.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Investment Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Tokens Owned</div>
                        <div className="text-lg font-semibold">{investment.tokensOwned.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Amount Invested</div>
                        <div className="text-lg font-semibold">{investment.totalInvested.toFixed(2)} SOL</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Current Value</div>
                        <div className={`text-lg font-semibold ${
                          investment.currentValue >= investment.totalInvested ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {investment.currentValue.toFixed(2)} SOL
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Royalties Earned</div>
                        <div className="text-lg font-semibold text-green-600">
                          +{investment.royaltiesEarned.toFixed(2)} SOL
                        </div>
                      </div>
                    </div>

                    {/* Ownership Percentage */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Your Ownership</span>
                        <span className="font-medium">
                          {((investment.tokensOwned / investment.track.totalSupply) * 100).toFixed(2)}%
                        </span>
                      </div>
                      <Progress 
                        value={(investment.tokensOwned / investment.track.totalSupply) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Track Funding Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Track Funding Progress</span>
                        <span className="font-medium">
                          {investment.track.tokensSold.toLocaleString()} / {investment.track.totalSupply.toLocaleString()} tokens sold
                        </span>
                      </div>
                      <Progress 
                        value={(investment.track.tokensSold / investment.track.totalSupply) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Investment Notes Preview */}
                    {(() => {
                      const note = getInvestmentNote(investment.id);
                      return note && (
                        <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-blue-800">My Investment Info</span>
                            <div className="flex">{renderStars(note.personalRating)}</div>
                          </div>
                          {note.investmentGoal && (
                            <div className="text-sm text-blue-700 mb-1">
                              <strong>Goal:</strong> {note.investmentGoal}
                            </div>
                          )}
                          {note.targetReturn > 0 && (
                            <div className="text-sm text-blue-700 mb-1">
                              <strong>Target Return:</strong> {note.targetReturn}% 
                            </div>
                          )}
                          {note.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {note.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {note.notes && (
                            <div className="text-sm text-blue-700 mt-1">
                              <strong>Notes:</strong> {note.notes.length > 100 ? `${note.notes.substring(0, 100)}...` : note.notes}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    <div className="flex items-center justify-between pt-2">
                      <div className="text-xs text-muted-foreground">
                        Invested on {new Date(investment.investmentDate).toLocaleDateString()}
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleAddNote(investment)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          {getInvestmentNote(investment.id) ? 'Edit Info' : 'Add Info'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSelectedInvestment(investment);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Music className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Investments Yet</h3>
              <p className="text-muted-foreground mb-4">
                Start investing in tokenized music tracks to build your portfolio
              </p>
              <Button asChild>
                <a href="/marketplace">Explore Marketplace</a>
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="royalties" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Royalty Payment History</CardTitle>
              <CardDescription>
                Your earnings from music royalty distributions
              </CardDescription>
            </CardHeader>

            <CardContent>
              {royaltyPayments.length > 0 ? (
                <div className="space-y-4">
                  {royaltyPayments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <DollarSign className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="font-medium">{payment.trackTitle}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(payment.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          +{payment.amount.toFixed(3)} SOL
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {payment.transactionId.slice(0, 6)}...{payment.transactionId.slice(-4)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">No royalty payments yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Investment Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Investment Details</DialogTitle>
            <DialogDescription>
              Detailed information about your investment
            </DialogDescription>
          </DialogHeader>
          
          {selectedInvestment && (
            <div className="space-y-6">
              {/* Track Information */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                    <Music className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{selectedInvestment.trackTitle}</h3>
                    <p className="text-sm text-muted-foreground">by {selectedInvestment.artistEmail}</p>
                  </div>
                  <Badge variant={selectedInvestment.track.isActive ? "default" : "secondary"}>
                    {selectedInvestment.track.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {/* Investment Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-primary">{selectedInvestment.tokensOwned.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Tokens Owned</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold">{selectedInvestment.totalInvested.toFixed(2)} SOL</div>
                  <div className="text-sm text-muted-foreground">Total Invested</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className={`text-2xl font-bold ${
                    selectedInvestment.currentValue >= selectedInvestment.totalInvested ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedInvestment.currentValue.toFixed(2)} SOL
                  </div>
                  <div className="text-sm text-muted-foreground">Current Value</div>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    +{selectedInvestment.royaltiesEarned.toFixed(3)} SOL
                  </div>
                  <div className="text-sm text-muted-foreground">Royalties Earned</div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h4 className="font-semibold">Performance Metrics</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Your Ownership</span>
                      <span className="font-medium">
                        {((selectedInvestment.tokensOwned / selectedInvestment.track.totalSupply) * 100).toFixed(2)}%
                      </span>
                    </div>
                    <Progress 
                      value={(selectedInvestment.tokensOwned / selectedInvestment.track.totalSupply) * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Funding Progress</span>
                      <span className="font-medium">
                        {((selectedInvestment.track.tokensSold / selectedInvestment.track.totalSupply) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <Progress 
                      value={(selectedInvestment.track.tokensSold / selectedInvestment.track.totalSupply) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Investment Date</div>
                    <div className="font-medium">{new Date(selectedInvestment.investmentDate).toLocaleDateString()}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Price per Token</div>
                    <div className="font-medium">{selectedInvestment.pricePerToken.toFixed(3)} SOL</div>
                  </div>
                </div>

                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="text-sm text-muted-foreground mb-2">Total Return</div>
                  <div className={`text-xl font-bold ${
                    (selectedInvestment.currentValue + selectedInvestment.royaltiesEarned - selectedInvestment.totalInvested) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(selectedInvestment.currentValue + selectedInvestment.royaltiesEarned - selectedInvestment.totalInvested) >= 0 ? '+' : ''}
                    {(selectedInvestment.currentValue + selectedInvestment.royaltiesEarned - selectedInvestment.totalInvested).toFixed(3)} SOL
                  </div>
                  <div className={`text-sm ${
                    (selectedInvestment.currentValue + selectedInvestment.royaltiesEarned - selectedInvestment.totalInvested) >= 0 
                      ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(((selectedInvestment.currentValue + selectedInvestment.royaltiesEarned - selectedInvestment.totalInvested) / selectedInvestment.totalInvested) * 100).toFixed(1)}% return
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Investment Information Dialog */}
      <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingNote ? 'Edit Investment Information' : 'Add Investment Information'}
            </DialogTitle>
            <DialogDescription>
              Add personal notes, goals, and tracking information for your investment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {selectedInvestment && (
              <div className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Music className="h-5 w-5 text-primary" />
                  <div>
                    <h3 className="font-medium">{selectedInvestment.trackTitle}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedInvestment.tokensOwned} tokens • {selectedInvestment.totalInvested.toFixed(2)} SOL invested
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="investmentGoal">Investment Goal</Label>
                <Input
                  id="investmentGoal"
                  placeholder="e.g., Long-term hold, Quick profit, Support artist..."
                  value={noteFormData.investmentGoal}
                  onChange={(e) => setNoteFormData(prev => ({ ...prev, investmentGoal: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetReturn">Target Return (%)</Label>
                <Input
                  id="targetReturn"
                  type="number"
                  placeholder="e.g., 25"
                  value={noteFormData.targetReturn}
                  onChange={(e) => setNoteFormData(prev => ({ ...prev, targetReturn: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., high-risk, electronic, promising artist, long-term"
                value={noteFormData.tags}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, tags: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Add tags to categorize and organize your investments
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="personalRating">Personal Rating</Label>
              <div className="flex items-center space-x-2">
                {Array.from({ length: 5 }, (_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setNoteFormData(prev => ({ ...prev, personalRating: i + 1 }))}
                    className={`text-2xl ${
                      i < noteFormData.personalRating ? 'text-yellow-400' : 'text-gray-300'
                    } hover:text-yellow-400 transition-colors`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-muted-foreground ml-2">
                  ({noteFormData.personalRating}/5 stars)
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add your thoughts about this investment, reasons for investing, performance observations, etc."
                value={noteFormData.notes}
                onChange={(e) => setNoteFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowNotesDialog(false)}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button onClick={handleSaveNote}>
              <Save className="h-4 w-4 mr-1" />
              Save Information
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}