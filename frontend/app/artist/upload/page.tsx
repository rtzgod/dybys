'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Upload, Music, Coins, Play, Pause, DollarSign, Users, X, AlertCircle } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import useAppStore from '@/lib/store';
import { toast } from 'sonner';

interface TrackFormData {
  title: string;
  description: string;
  genre: string;
  audioFile: File | null;
  totalSupply: string;
  pricePerToken: string;
  royaltyPercentage: string;
}

interface ValidationErrors {
  title?: string;
  description?: string;
  genre?: string;
  audioFile?: string;
  totalSupply?: string;
  pricePerToken?: string;
  royaltyPercentage?: string;
}

export default function ArtistUploadPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [isUploading, setIsUploading] = useState(false);
  const [isTokenizing, setIsTokenizing] = useState(false);
  const [uploadedTrack, setUploadedTrack] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [formData, setFormData] = useState<TrackFormData>({
    title: '',
    description: '',
    genre: '',
    audioFile: null,
    totalSupply: '1000',
    pricePerToken: '0.01',
    royaltyPercentage: '1000', // 10% in basis points
  });
  
  const { connected, publicKey } = useWallet();
  const { addTrack, updateTrack, setCurrentUser, currentUser } = useAppStore();

  const handleInputChange = (field: keyof TrackFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const validateUploadForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Track title is required';
    } else if (formData.title.length > 100) {
      errors.title = 'Track title must be less than 100 characters';
    }
    
    if (!formData.audioFile) {
      errors.audioFile = 'Audio file is required';
    } else {
      const fileSizeMB = formData.audioFile.size / (1024 * 1024);
      if (fileSizeMB > 50) {
        errors.audioFile = 'File size must be less than 50MB';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateTokenizeForm = (): boolean => {
    const errors: ValidationErrors = {};
    
    const totalSupply = parseInt(formData.totalSupply);
    if (isNaN(totalSupply) || totalSupply < 100) {
      errors.totalSupply = 'Total supply must be at least 100 tokens';
    } else if (totalSupply > 1000000) {
      errors.totalSupply = 'Total supply cannot exceed 1,000,000 tokens';
    }
    
    const pricePerToken = parseFloat(formData.pricePerToken);
    if (isNaN(pricePerToken) || pricePerToken < 0.001) {
      errors.pricePerToken = 'Price per token must be at least 0.001 SOL';
    } else if (pricePerToken > 10) {
      errors.pricePerToken = 'Price per token cannot exceed 10 SOL';
    }
    
    const royalty = parseInt(formData.royaltyPercentage);
    if (isNaN(royalty) || royalty < 100) { // 1%
      errors.royaltyPercentage = 'Royalty percentage must be at least 1%';
    } else if (royalty > 5000) { // 50%
      errors.royaltyPercentage = 'Royalty percentage cannot exceed 50%';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('audio/')) {
        setValidationErrors(prev => ({
          ...prev,
          audioFile: 'Please select an audio file (MP3, WAV, FLAC, etc.)'
        }));
        toast.error('Please select an audio file');
        return;
      }
      
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > 50) {
        setValidationErrors(prev => ({
          ...prev,
          audioFile: 'File size must be less than 50MB'
        }));
        toast.error('File size must be less than 50MB');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        audioFile: file
      }));
      
      // Clear any existing audio file errors
      if (validationErrors.audioFile) {
        setValidationErrors(prev => ({
          ...prev,
          audioFile: undefined
        }));
      }
    }
  };

  const handleUploadTrack = async () => {
    if (!connected) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!validateUploadForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsUploading(true);

    try {
      // Create file URL (in real app, upload to IPFS/cloud storage)
      // For now, use the browser's object URL for the uploaded file
      const fileUrl = URL.createObjectURL(formData.audioFile!);
      
      // Add track to store
      const trackId = addTrack({
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        artist: {
          email: currentUser?.email || `artist@${publicKey?.toString().slice(0, 8)}.com`,
          walletAddress: publicKey?.toString() || '',
          displayName: currentUser?.displayName,
          firstName: currentUser?.firstName,
          lastName: currentUser?.lastName
        },
        fileUrl,
        audioFile: formData.audioFile || undefined,
        isTokenized: false
      });

      // Set uploaded track for tokenization step
      const newTrack = {
        id: trackId,
        title: formData.title,
        description: formData.description,
        genre: formData.genre,
        fileUrl,
        isTokenized: false
      };

      setUploadedTrack(newTrack);
      toast.success('Track uploaded successfully!', {
        description: 'You can now proceed to tokenize your track.'
      });
      setActiveTab('tokenize');

    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleTokenizeTrack = async () => {
    if (!uploadedTrack || !connected) return;

    if (!validateTokenizeForm()) {
      toast.error('Please fix the validation errors');
      return;
    }

    setIsTokenizing(true);

    try {
      // Show loading toast
      const loadingToast = toast.loading('Creating tokens...', {
        description: 'Deploying your track token contract on Solana blockchain.'
      });

      // Simulate blockchain transaction
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Dismiss loading toast
      toast.dismiss(loadingToast);

      // Update track in store with tokenization parameters
      updateTrack(uploadedTrack.id, {
        isTokenized: true,
        totalSupply: parseInt(formData.totalSupply),
        pricePerToken: parseFloat(formData.pricePerToken),
        royaltyPercentage: parseInt(formData.royaltyPercentage),
        tokenMint: `${uploadedTrack.id}-mint-${Date.now()}` // Mock token mint
      });

      toast.success(`"${formData.title}" has been tokenized successfully!`, {
        description: `${formData.totalSupply} tokens created at ${formData.pricePerToken} SOL each. Your track is now available for investment.`
      });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        genre: '',
        audioFile: null,
        totalSupply: '1000',
        pricePerToken: '0.01',
        royaltyPercentage: '1000',
      });
      setUploadedTrack(null);
      setValidationErrors({});
      setActiveTab('upload');

    } catch (error) {
      console.error('Tokenization failed:', error);
      toast.error('Tokenization failed. Please try again.');
    } finally {
      setIsTokenizing(false);
    }
  };

  const handleCancelUpload = () => {
    setFormData({
      title: '',
      description: '',
      genre: '',
      audioFile: null,
      totalSupply: '1000',
      pricePerToken: '0.01',
      royaltyPercentage: '1000',
    });
    setValidationErrors({});
    toast.info('Upload cancelled');
  };

  const handleCancelTokenization = () => {
    setFormData(prev => ({
      ...prev,
      totalSupply: '1000',
      pricePerToken: '0.01',
      royaltyPercentage: '1000',
    }));
    setValidationErrors({});
    setActiveTab('upload');
    toast.info('Tokenization cancelled');
  };

  const handleStartOver = () => {
    setFormData({
      title: '',
      description: '',
      genre: '',
      audioFile: null,
      totalSupply: '1000',
      pricePerToken: '0.01',
      royaltyPercentage: '1000',
    });
    setUploadedTrack(null);
    setValidationErrors({});
    setActiveTab('upload');
    toast.info('Starting over with new track');
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <Music className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to upload and tokenize your music tracks.
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
        <h1 className="text-3xl font-bold mb-2">Upload & Tokenize Music</h1>
        <p className="text-muted-foreground">
          Share your music with the world and create investment opportunities
        </p>
      </div>

      {/* Process Steps */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-4">
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            activeTab === 'upload' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Upload className="h-4 w-4" />
            <span className="text-sm font-medium">1. Upload</span>
          </div>
          <div className="w-8 h-0.5 bg-muted" />
          <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
            activeTab === 'tokenize' ? 'bg-primary text-primary-foreground' : 'bg-muted'
          }`}>
            <Coins className="h-4 w-4" />
            <span className="text-sm font-medium">2. Tokenize</span>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-2xl mx-auto">
        <TabsContent value="upload">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your Track
              </CardTitle>
              <CardDescription>
                Upload your music file and provide track information
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* File Upload */}
              <div className="space-y-2">
                <Label htmlFor="audio-file">Audio File *</Label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${
                  validationErrors.audioFile ? 'border-red-300 bg-red-50' : 'border-muted-foreground/25'
                }`}>
                  <input
                    id="audio-file"
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="audio-file"
                    className="cursor-pointer flex flex-col items-center space-y-2"
                  >
                    <Upload className="h-8 w-8 text-muted-foreground" />
                    <div className="text-sm">
                      {formData.audioFile ? (
                        <span className="text-primary font-medium">{formData.audioFile.name}</span>
                      ) : (
                        <>
                          <span className="text-muted-foreground">Click to upload audio file</span>
                          <br />
                          <span className="text-xs text-muted-foreground">MP3, WAV, FLAC supported • Max 50MB</span>
                        </>
                      )}
                    </div>
                  </label>
                </div>
                {validationErrors.audioFile && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{validationErrors.audioFile}</span>
                  </div>
                )}
              </div>

              {/* Track Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Track Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter track title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className={validationErrors.title ? 'border-red-300 focus:border-red-500' : ''}
                    maxLength={100}
                  />
                  {validationErrors.title && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationErrors.title}</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="genre">Genre</Label>
                  <Input
                    id="genre"
                    placeholder="e.g., Electronic, Pop, Hip-Hop"
                    value={formData.genre}
                    onChange={(e) => handleInputChange('genre', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Tell people about your track..."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>

            <CardFooter className="flex space-x-3">
              <Button 
                variant="outline"
                onClick={handleCancelUpload}
                disabled={isUploading}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button 
                onClick={handleUploadTrack}
                disabled={isUploading || !formData.title.trim() || !formData.audioFile}
                className="flex-1"
              >
                {isUploading ? 'Uploading...' : 'Upload Track'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="tokenize">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Tokenize Your Track
              </CardTitle>
              <CardDescription>
                Set tokenization parameters to create investment opportunities
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Track Preview */}
              {uploadedTrack && (
                <div className="bg-muted/30 p-4 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                      <Music className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{uploadedTrack.title}</h3>
                      <p className="text-sm text-muted-foreground">Ready for tokenization</p>
                    </div>
                    <Badge variant="secondary">Uploaded</Badge>
                  </div>
                </div>
              )}

              {/* Tokenization Parameters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="totalSupply">Total Token Supply *</Label>
                  <Input
                    id="totalSupply"
                    type="number"
                    placeholder="1000"
                    value={formData.totalSupply}
                    onChange={(e) => handleInputChange('totalSupply', e.target.value)}
                    className={validationErrors.totalSupply ? 'border-red-300 focus:border-red-500' : ''}
                    min="100"
                    max="1000000"
                  />
                  <p className="text-xs text-muted-foreground">
                    Total number of tokens to create (100 - 1,000,000)
                  </p>
                  {validationErrors.totalSupply && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationErrors.totalSupply}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pricePerToken">Price per Token (SOL) *</Label>
                  <Input
                    id="pricePerToken"
                    type="number"
                    step="0.001"
                    placeholder="0.01"
                    value={formData.pricePerToken}
                    onChange={(e) => handleInputChange('pricePerToken', e.target.value)}
                    className={validationErrors.pricePerToken ? 'border-red-300 focus:border-red-500' : ''}
                    min="0.001"
                    max="10"
                  />
                  <p className="text-xs text-muted-foreground">
                    SOL price for each token (0.001 - 10 SOL)
                  </p>
                  {validationErrors.pricePerToken && (
                    <div className="flex items-center space-x-2 text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{validationErrors.pricePerToken}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="royaltyPercentage">Token Holder Royalty Share (%) *</Label>
                <Input
                  id="royaltyPercentage"
                  type="number"
                  placeholder="10"
                  value={(parseInt(formData.royaltyPercentage) / 100).toString()}
                  onChange={(e) => handleInputChange('royaltyPercentage', (parseFloat(e.target.value || '0') * 100).toString())}
                  className={validationErrors.royaltyPercentage ? 'border-red-300 focus:border-red-500' : ''}
                  min="1"
                  max="50"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  Percentage of future royalties shared with token holders (1% - 50%)
                </p>
                {validationErrors.royaltyPercentage && (
                  <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{validationErrors.royaltyPercentage}</span>
                  </div>
                )}
              </div>

              {/* Projection */}
              <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                <h4 className="font-medium">Tokenization Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Raise Potential</div>
                    <div className="font-semibold">
                      {(parseInt(formData.totalSupply || '0') * parseFloat(formData.pricePerToken || '0')).toFixed(2)} SOL
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Your Royalty Share</div>
                    <div className="font-semibold">
                      {(100 - parseInt(formData.royaltyPercentage || '0') / 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex space-x-3">
              <Button
                variant="outline"
                onClick={handleCancelTokenization}
                disabled={isTokenizing}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleStartOver}
                disabled={isTokenizing}
                className="flex-1"
              >
                Start Over
              </Button>
              <Button
                onClick={handleTokenizeTrack}
                disabled={isTokenizing || !uploadedTrack}
                className="flex-1"
              >
                {isTokenizing ? 'Creating Tokens...' : 'Tokenize Track'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <div className="max-w-2xl mx-auto mt-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-3">
              <Upload className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">1. Upload Your Track</h4>
                <p className="text-sm text-muted-foreground">
                  Upload your audio file and provide track information
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Coins className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">2. Set Token Parameters</h4>
                <p className="text-sm text-muted-foreground">
                  Define how many tokens to create and their price
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <DollarSign className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">3. Share Royalties</h4>
                <p className="text-sm text-muted-foreground">
                  Token holders receive a percentage of future royalties
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}