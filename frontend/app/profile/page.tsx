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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  User, 
  Edit, 
  Save, 
  X, 
  Camera, 
  MapPin, 
  Globe, 
  Twitter, 
  Instagram, 
  Music, 
  Calendar,
  Shield,
  Settings,
  Star,
  TrendingUp
} from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import useAppStore from '@/lib/store';
import { toast } from 'sonner';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    displayName: '',
    email: '',
    bio: '',
    location: '',
    website: '',
    twitter: '',
    instagram: '',
    spotify: '',
    soundcloud: '',
    genres: '',
    yearsActive: '',
    recordLabel: '',
    investmentExperience: 'BEGINNER' as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED',
    riskTolerance: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH',
    profilePublic: true,
    emailNotifications: true,
  });

  const { connected, publicKey } = useWallet();
  const { currentUser, updateUserProfile } = useAppStore();

  useEffect(() => {
    // Update form data when currentUser changes (handled globally now)
    if (currentUser) {
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        website: currentUser.website || '',
        twitter: currentUser.socialMedia?.twitter || '',
        instagram: currentUser.socialMedia?.instagram || '',
        spotify: currentUser.socialMedia?.spotify || '',
        soundcloud: currentUser.socialMedia?.soundcloud || '',
        genres: currentUser.genres?.join(', ') || '',
        yearsActive: currentUser.yearsActive?.toString() || '',
        recordLabel: currentUser.recordLabel || '',
        investmentExperience: currentUser.investmentExperience || 'BEGINNER',
        riskTolerance: currentUser.riskTolerance || 'MEDIUM',
        profilePublic: currentUser.profilePublic !== false,
        emailNotifications: currentUser.emailNotifications !== false,
      });
    }
  }, [currentUser]);

  const handleSave = () => {
    if (!currentUser || !publicKey) return;

    const profileData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      displayName: formData.displayName,
      email: formData.email,
      bio: formData.bio,
      location: formData.location,
      website: formData.website,
      socialMedia: {
        twitter: formData.twitter,
        instagram: formData.instagram,
        spotify: formData.spotify,
        soundcloud: formData.soundcloud,
      },
      genres: formData.genres.split(',').map(g => g.trim()).filter(g => g),
      yearsActive: parseInt(formData.yearsActive) || undefined,
      recordLabel: formData.recordLabel,
      investmentExperience: formData.investmentExperience,
      riskTolerance: formData.riskTolerance,
      profilePublic: formData.profilePublic,
      emailNotifications: formData.emailNotifications,
    };

    updateUserProfile(publicKey.toString(), profileData);
    
    toast.success('Profile updated successfully!', {
      description: 'Your profile information has been saved.'
    });
    
    setIsEditing(false);
  };

  const handleCancel = () => {
    if (currentUser) {
      // Reset form to current user data
      setFormData({
        firstName: currentUser.firstName || '',
        lastName: currentUser.lastName || '',
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        bio: currentUser.bio || '',
        location: currentUser.location || '',
        website: currentUser.website || '',
        twitter: currentUser.socialMedia?.twitter || '',
        instagram: currentUser.socialMedia?.instagram || '',
        spotify: currentUser.socialMedia?.spotify || '',
        soundcloud: currentUser.socialMedia?.soundcloud || '',
        genres: currentUser.genres?.join(', ') || '',
        yearsActive: currentUser.yearsActive?.toString() || '',
        recordLabel: currentUser.recordLabel || '',
        investmentExperience: currentUser.investmentExperience || 'BEGINNER',
        riskTolerance: currentUser.riskTolerance || 'MEDIUM',
        profilePublic: currentUser.profilePublic !== false,
        emailNotifications: currentUser.emailNotifications !== false,
      });
    }
    setIsEditing(false);
  };

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-md mx-auto">
          <User className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted-foreground mb-6">
            Please connect your wallet to access your profile.
          </p>
          <Button size="lg" disabled>
            Connect Wallet Required
          </Button>
        </div>
      </div>
    );
  }

  const completeness = currentUser?.profileCompleteness || 0;
  const displayName = formData.displayName || formData.firstName || 'Anonymous User';

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Profile</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Profile
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Completeness */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5" />
            <span>Profile Completeness</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Complete your profile to get better recommendations</span>
              <span className="font-medium">{completeness}%</span>
            </div>
            <Progress value={completeness} className="h-2" />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList>
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          {currentUser?.role === 'ARTIST' && <TabsTrigger value="artist">Artist Info</TabsTrigger>}
          {currentUser?.role === 'INVESTOR' && <TabsTrigger value="investor">Investor Info</TabsTrigger>}
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Your personal information and public profile details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
                  {currentUser?.avatar ? (
                    <img 
                      src={currentUser.avatar} 
                      alt={displayName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                {isEditing && (
                  <Button variant="outline" onClick={() => setShowAvatarDialog(true)}>
                    <Camera className="h-4 w-4 mr-1" />
                    Change Avatar
                  </Button>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Enter your first name"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Enter your last name"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  placeholder="How you want to appear on the platform"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell people about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                  disabled={!isEditing}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="City, Country"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    placeholder="https://your-website.com"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media Links</CardTitle>
              <CardDescription>
                Connect your social media accounts to build your presence
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitter">Twitter/X</Label>
                  <div className="flex items-center space-x-2">
                    <Twitter className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="twitter"
                      placeholder="@username"
                      value={formData.twitter}
                      onChange={(e) => setFormData(prev => ({ ...prev, twitter: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram">Instagram</Label>
                  <div className="flex items-center space-x-2">
                    <Instagram className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="instagram"
                      placeholder="@username"
                      value={formData.instagram}
                      onChange={(e) => setFormData(prev => ({ ...prev, instagram: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spotify">Spotify</Label>
                  <div className="flex items-center space-x-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="spotify"
                      placeholder="Artist name or profile URL"
                      value={formData.spotify}
                      onChange={(e) => setFormData(prev => ({ ...prev, spotify: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="soundcloud">SoundCloud</Label>
                  <div className="flex items-center space-x-2">
                    <Music className="h-4 w-4 text-muted-foreground" />
                    <Input
                      id="soundcloud"
                      placeholder="Profile URL or username"
                      value={formData.soundcloud}
                      onChange={(e) => setFormData(prev => ({ ...prev, soundcloud: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {currentUser?.role === 'ARTIST' && (
          <TabsContent value="artist" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Artist Information</CardTitle>
                <CardDescription>
                  Details about your music career and style
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="genres">Genres</Label>
                  <Input
                    id="genres"
                    placeholder="Electronic, Hip-Hop, Pop (comma-separated)"
                    value={formData.genres}
                    onChange={(e) => setFormData(prev => ({ ...prev, genres: e.target.value }))}
                    disabled={!isEditing}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsActive">Years Active</Label>
                    <Input
                      id="yearsActive"
                      type="number"
                      placeholder="How many years making music?"
                      value={formData.yearsActive}
                      onChange={(e) => setFormData(prev => ({ ...prev, yearsActive: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="recordLabel">Record Label</Label>
                    <Input
                      id="recordLabel"
                      placeholder="Independent, or label name"
                      value={formData.recordLabel}
                      onChange={(e) => setFormData(prev => ({ ...prev, recordLabel: e.target.value }))}
                      disabled={!isEditing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {currentUser?.role === 'INVESTOR' && (
          <TabsContent value="investor" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Investment Profile</CardTitle>
                <CardDescription>
                  Your investment experience and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investmentExperience">Investment Experience</Label>
                    <Select
                      value={formData.investmentExperience}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        investmentExperience: value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
                      }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BEGINNER">Beginner</SelectItem>
                        <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                        <SelectItem value="ADVANCED">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                    <Select
                      value={formData.riskTolerance}
                      onValueChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        riskTolerance: value as 'LOW' | 'MEDIUM' | 'HIGH'
                      }))}
                      disabled={!isEditing}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="LOW">Low Risk</SelectItem>
                        <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                        <SelectItem value="HIGH">High Risk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Notifications</CardTitle>
              <CardDescription>
                Control your privacy settings and notification preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="profilePublic">Public Profile</Label>
                  <div className="text-sm text-muted-foreground">
                    Make your profile visible to other users
                  </div>
                </div>
                <Checkbox
                  id="profilePublic"
                  checked={formData.profilePublic}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, profilePublic: checked }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="emailNotifications">Email Notifications</Label>
                  <div className="text-sm text-muted-foreground">
                    Receive updates about your investments and royalties
                  </div>
                </div>
                <Checkbox
                  id="emailNotifications"
                  checked={formData.emailNotifications}
                  onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, emailNotifications: checked }))}
                  disabled={!isEditing}
                />
              </div>

              <div className="pt-4 border-t">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Account Information</div>
                  <div className="text-sm text-muted-foreground">
                    <div>Wallet: {publicKey?.toString().slice(0, 8)}...{publicKey?.toString().slice(-8)}</div>
                    <div>Role: {currentUser?.role}</div>
                    {currentUser?.joinDate && (
                      <div>Member since: {new Date(currentUser.joinDate).toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Avatar Upload Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Profile Picture</DialogTitle>
            <DialogDescription>
              Upload a new profile picture or choose from options
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center">
              <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                <User className="h-12 w-12 text-muted-foreground" />
              </div>
              <Button variant="outline">
                <Camera className="h-4 w-4 mr-1" />
                Upload Image
              </Button>
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Feature coming soon! Avatar upload will be available in the next update.
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAvatarDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}