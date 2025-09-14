import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Upload, Lock, Eye, EyeOff, Hotel, UtensilsCrossed, AlertCircle, Star, ChevronDown, ChevronUp, Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImageGallery } from "@/components/ImageGallery";
import { ImageInput } from "@/components/ImageInput";
import AdminLocationForm from "@/components/AdminLocationForm";
import Header from "@/components/Header";
import type { Location, TourSettings, HeroImage, ScenicContent, ScenicGalleryItem, Creator } from "@shared/schema";

export default function AdminPanel() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [privacyPassword, setPrivacyPassword] = useState("");
  const [editingHeroImage, setEditingHeroImage] = useState<HeroImage | null>(null);
  const [heroImageForm, setHeroImageForm] = useState({ title: "", description: "", imageUrl: "" });
  
  // Bulk upload state
  const [bulkUploadMode, setBulkUploadMode] = useState(false);
  const [bulkImageUrls, setBulkImageUrls] = useState<string[]>([]);
  const [bulkUploadDefaults, setBulkUploadDefaults] = useState({
    titlePrefix: "Hero Bild",
    description: "Automatisch hochgeladenes Hero-Bild"
  });
  
  // Scenic content state
  const [scenicTitle, setScenicTitle] = useState("");
  const [scenicSubtitle, setScenicSubtitle] = useState("");
  const [galleries, setGalleries] = useState<ScenicGalleryItem[]>([]);
  
  // Creator management state
  const [creatorName, setCreatorName] = useState("");
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  const [editingCreatorName, setEditingCreatorName] = useState("");
  
  // Collapsible sections state - all collapsed by default for cleaner admin interface
  const [collapsedSections, setCollapsedSections] = useState({
    tourSettings: true,
    heroImages: true,
    privacySettings: true,
    gpsSettings: true,
    restaurantAccommodation: true,
    locationsManagement: true,
    imageManagement: true,
    scenicLandscapes: true,
    quickActions: true,
    creatorManagement: true,
  });

  const toggleSection = (section: keyof typeof collapsedSections) => {
    setCollapsedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Smooth scroll to section function
  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-testid="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      });
    }
  };

  // Combined navigation function - toggles section and scrolls to it
  const navigateToSection = (section: keyof typeof collapsedSections, sectionId: string) => {
    if (collapsedSections[section]) {
      toggleSection(section);
    }
    // Small delay to ensure section is expanded before scrolling
    setTimeout(() => scrollToSection(sectionId), 100);
  };
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: tourSettings, isLoading: settingsLoading } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
  });

  const { data: heroImages, isLoading: heroImagesLoading } = useQuery<HeroImage[]>({
    queryKey: ["/api/hero-images"],
  });

  const { data: scenicContent, isLoading: scenicContentLoading } = useQuery<ScenicContent>({
    queryKey: ["/api/scenic-content"],
  });

  const { data: creators, isLoading: creatorsLoading } = useQuery<Creator[]>({
    queryKey: ["/api/creators"],
  });

  // Initialize scenic content form when data is loaded
  useEffect(() => {
    if (scenicContent) {
      setScenicTitle(scenicContent.title || "");
      setScenicSubtitle(scenicContent.subtitle || "");
      setGalleries(scenicContent.galleries || []);
    }
  }, [scenicContent]);

  const updateTourSettingsMutation = useMutation({
    mutationFn: async (data: Partial<TourSettings>) => {
      await apiRequest("PUT", "/api/tour-settings", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tour-settings"] });
      toast({
        title: "Erfolg",
        description: "Tour-Einstellungen wurden aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Einstellungen: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updatePrivacySettingsMutation = useMutation({
    mutationFn: async (data: { privacyEnabled?: boolean; privacyPassword?: string; sessionTimeout?: number }) => {
      // If password is provided, hash it on the server side
      const payload: any = {};
      
      if (data.privacyEnabled !== undefined) {
        payload.privacyEnabled = data.privacyEnabled;
      }
      
      if (data.privacyPassword !== undefined) {
        // Password will be hashed on the server
        payload.privacyPassword = data.privacyPassword;
      }
      
      if (data.sessionTimeout !== undefined) {
        payload.sessionTimeout = data.sessionTimeout;
      }
      
      await apiRequest("PUT", "/api/tour-settings", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tour-settings"] });
      toast({
        title: "Erfolg",
        description: "Privacy-Einstellungen wurden aktualisiert",
      });
      setPrivacyPassword(""); // Clear password field after save
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Privacy-Einstellungen: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (locationId: string) => {
      await apiRequest("DELETE", `/api/locations/${locationId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Erfolg",
        description: "Ort wurde gelöscht",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Orts: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Hero Images mutations
  const createHeroImageMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; imageUrl: string; sortOrder: number }) => {
      await apiRequest("POST", "/api/hero-images", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      setHeroImageForm({ title: "", description: "", imageUrl: "" });
      toast({
        title: "Erfolg",
        description: "Hero-Bild wurde hinzugefügt",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Hinzufügen des Hero-Bilds: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Scenic content mutation
  const updateScenicContentMutation = useMutation({
    mutationFn: async (data: { title?: string; subtitle?: string; galleries?: ScenicGalleryItem[] }) => {
      await apiRequest("PUT", "/api/scenic-content", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scenic-content"] });
      toast({
        title: "Erfolg",
        description: "Spektakuläre Landschaften wurden aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Landschaften: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateHeroImageMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ title: string; description: string; imageUrl: string }> }) => {
      await apiRequest("PUT", `/api/hero-images/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      setEditingHeroImage(null);
      setHeroImageForm({ title: "", description: "", imageUrl: "" });
      toast({
        title: "Erfolg",
        description: "Hero-Bild wurde aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren des Hero-Bilds: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteHeroImageMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/hero-images/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      toast({
        title: "Erfolg",
        description: "Hero-Bild wurde gelöscht",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen des Hero-Bilds: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Bulk creation mutation
  const createBulkHeroImagesMutation = useMutation({
    mutationFn: async (imageUrls: string[]) => {
      const currentSortOrder = heroImages?.length || 0;
      const promises = imageUrls.map((url, index) => 
        apiRequest("POST", "/api/hero-images", {
          title: `${bulkUploadDefaults.titlePrefix} ${currentSortOrder + index + 1}`,
          description: bulkUploadDefaults.description,
          imageUrl: url,
          sortOrder: currentSortOrder + index
        })
      );
      await Promise.all(promises);
    },
    onSuccess: (_, imageUrls) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hero-images"] });
      setBulkImageUrls([]);
      setBulkUploadMode(false);
      toast({
        title: "Erfolg",
        description: `${imageUrls.length} Hero-Bilder wurden erfolgreich hinzugefügt`,
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Hinzufügen der Hero-Bilder: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Creator mutations
  const createCreatorMutation = useMutation({
    mutationFn: async (name: string) => {
      await apiRequest("POST", "/api/creators", { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creators"] });
      setCreatorName("");
      toast({
        title: "Erfolg",
        description: "Person wurde hinzugefügt",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Hinzufügen der Person: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateCreatorMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      await apiRequest("PUT", `/api/creators/${id}`, { name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creators"] });
      setEditingCreator(null);
      setEditingCreatorName("");
      toast({
        title: "Erfolg",
        description: "Person wurde aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Person: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteCreatorMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/creators/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/creators"] });
      toast({
        title: "Erfolg",
        description: "Person wurde gelöscht",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Löschen der Person: ${error.message}`,
        variant: "destructive",
      });
    },
  });


  if (locationsLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-loading">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-panel">
      <Header />
      {/* Admin Header */}
      <div className="border-b py-4" data-testid="admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Verwalte deine Tour-Inhalte</p>
        </div>
      </div>

      {/* Main Layout with Sidebar */}
      <div className="flex min-h-screen">
        {/* Left Sidebar Navigation */}
        <div className="w-56 border-r sticky top-0 h-screen overflow-y-auto" data-testid="admin-sidebar">
          <div className="p-3">
            <h3 className="font-medium text-sm text-muted-foreground mb-3 uppercase">Navigation</h3>
            <nav className="space-y-1">
              <button 
                onClick={() => navigateToSection('tourSettings', 'tour-settings-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.tourSettings ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-tour-settings"
              >
                Tour-Einstellungen
              </button>
              <button 
                onClick={() => navigateToSection('heroImages', 'hero-images-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.heroImages ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-hero-images"
              >
                Hero-Bilder
              </button>
              <button 
                onClick={() => navigateToSection('scenicLandscapes', 'scenic-landscapes-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.scenicLandscapes ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-scenic-landscapes"
              >
                Landschaften
              </button>
              <button 
                onClick={() => navigateToSection('privacySettings', 'privacy-settings-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.privacySettings ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-privacy-settings"
              >
                Privacy
              </button>
              <button 
                onClick={() => navigateToSection('gpsSettings', 'gps-settings-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.gpsSettings ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-gps-settings"
              >
                GPS Tracking
              </button>
              <button 
                onClick={() => navigateToSection('restaurantAccommodation', 'restaurant-accommodation-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.restaurantAccommodation ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-restaurant-accommodation"
              >
                Restaurants & Hotels
              </button>
              <button 
                onClick={() => navigateToSection('creatorManagement', 'creator-management-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.creatorManagement ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-creator-management"
              >
                Personen
              </button>
              <button 
                onClick={() => navigateToSection('locationsManagement', 'locations-management-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.locationsManagement ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-locations-management"
              >
                Orte
              </button>
              <button 
                onClick={() => navigateToSection('imageManagement', 'image-management-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.imageManagement ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-image-management"
              >
                Bilder
              </button>
              <button 
                onClick={() => navigateToSection('quickActions', 'quick-actions-card')}
                className={`w-full text-left px-3 py-1.5 rounded text-sm hover:bg-muted ${!collapsedSections.quickActions ? 'bg-muted font-medium' : ''}`}
                data-testid="nav-quick-actions"
              >
                Schnellaktionen
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 max-w-5xl mx-auto px-4 py-6">
          <div className="space-y-4">
            <Card data-testid="tour-settings-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('tourSettings')}
                data-testid="tour-settings-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Tour-Einstellungen</CardTitle>
                  {collapsedSections.tourSettings ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.tourSettings && (
                <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="tour-name">Tour-Name</Label>
                  <Input
                    id="tour-name"
                    defaultValue={tourSettings?.tourName}
                    onBlur={(e) => {
                      updateTourSettingsMutation.mutate({ tourName: e.target.value });
                    }}
                    data-testid="input-tour-name"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="start-date">Start-Datum</Label>
                    <Input
                      id="start-date"
                      defaultValue={tourSettings?.startDate}
                      onBlur={(e) => {
                        updateTourSettingsMutation.mutate({ startDate: e.target.value });
                      }}
                      data-testid="input-start-date"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End-Datum</Label>
                    <Input
                      id="end-date"
                      defaultValue={tourSettings?.endDate}
                      onBlur={(e) => {
                        updateTourSettingsMutation.mutate({ endDate: e.target.value });
                      }}
                      data-testid="input-end-date"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="total-distance">Gesamt-Distanz (km)</Label>
                    <Input
                      id="total-distance"
                      type="number"
                      defaultValue={tourSettings?.totalDistance || ""}
                      onBlur={(e) => {
                        updateTourSettingsMutation.mutate({ totalDistance: parseInt(e.target.value) || 0 });
                      }}
                      data-testid="input-total-distance"
                    />
                  </div>
                  <div>
                    <Label htmlFor="total-cost">Gesamt-Kosten</Label>
                    <Input
                      id="total-cost"
                      type="number"
                      defaultValue={tourSettings?.totalCost || ""}
                      onBlur={(e) => {
                        updateTourSettingsMutation.mutate({ totalCost: parseInt(e.target.value) || 0 });
                      }}
                      data-testid="input-total-cost"
                    />
                  </div>
                </div>
                <ImageInput
                  label="Hero-Bild der Tour"
                  value={tourSettings?.heroImageUrl || ""}
                  onChange={(value) => {
                    updateTourSettingsMutation.mutate({ heroImageUrl: value });
                  }}
                  placeholder="https://example.com/hero-image.jpg"
                  testId="tour-hero-image"
                />
                <div>
                  <Label htmlFor="description">Beschreibung</Label>
                  <Textarea
                    id="description"
                    defaultValue={tourSettings?.description || ""}
                    onBlur={(e) => {
                      updateTourSettingsMutation.mutate({ description: e.target.value });
                    }}
                    data-testid="textarea-description"
                  />
                </div>
                </CardContent>
              )}
            </Card>

            {/* Hero Images Management */}
            <Card data-testid="hero-images-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('heroImages')}
                data-testid="hero-images-header"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Hero-Bilder verwalten</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Verwalte die Slideshow-Bilder auf der Startseite
                    </p>
                  </div>
                  {collapsedSections.heroImages ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.heroImages && (
                <CardContent className="space-y-6">
                {/* Upload Mode Toggle */}
                <div className="border rounded p-3 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Hero-Bilder hinzufügen</h4>
                    <div className="flex items-center gap-3">
                      <Label htmlFor="bulk-upload-toggle" className="text-sm cursor-pointer">
                        {bulkUploadMode ? "Mehrere Bilder" : "Einzelnes Bild"}
                      </Label>
                      <Switch
                        id="bulk-upload-toggle"
                        checked={bulkUploadMode}
                        onCheckedChange={(checked) => {
                          setBulkUploadMode(checked);
                          if (checked) {
                            // Reset single image form when switching to bulk
                            setEditingHeroImage(null);
                            setHeroImageForm({ title: "", description: "", imageUrl: "" });
                          } else {
                            // Reset bulk form when switching to single
                            setBulkImageUrls([]);
                          }
                        }}
                        data-testid="toggle-bulk-upload"
                      />
                    </div>
                  </div>

                  {!bulkUploadMode ? (
                    /* Single Image Upload Form */
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hero-title">Titel</Label>
                          <Input
                            id="hero-title"
                            value={heroImageForm.title}
                            onChange={(e) => setHeroImageForm(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="z.B. Penticton Wine Country"
                            data-testid="input-hero-title"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hero-description">Beschreibung</Label>
                          <Input
                            id="hero-description"
                            value={heroImageForm.description}
                            onChange={(e) => setHeroImageForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="z.B. Naramata Bench Weinberge über dem Okanagan Lake"
                            data-testid="input-hero-description"
                          />
                        </div>
                      </div>
                      <ImageInput
                        label="Bild-URL"
                        value={heroImageForm.imageUrl}
                        onChange={(value) => setHeroImageForm(prev => ({ ...prev, imageUrl: value }))}
                        placeholder="https://example.com/image.jpg"
                        testId="hero-image-url"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (editingHeroImage) {
                              updateHeroImageMutation.mutate({
                                id: editingHeroImage.id,
                                data: heroImageForm
                              });
                            } else {
                              createHeroImageMutation.mutate({
                                ...heroImageForm,
                                sortOrder: (heroImages?.length || 0)
                              });
                            }
                          }}
                          disabled={!heroImageForm.title || !heroImageForm.description || !heroImageForm.imageUrl || createHeroImageMutation.isPending || updateHeroImageMutation.isPending}
                          data-testid="button-save-hero-image"
                        >
                          {createHeroImageMutation.isPending || updateHeroImageMutation.isPending 
                            ? "Speichern..." 
                            : editingHeroImage 
                              ? "Änderungen speichern" 
                              : "Hero-Bild hinzufügen"
                          }
                        </Button>
                        {editingHeroImage && (
                          <Button
                            variant="outline"
                            onClick={() => {
                              setEditingHeroImage(null);
                              setHeroImageForm({ title: "", description: "", imageUrl: "" });
                            }}
                            data-testid="button-cancel-edit"
                          >
                            Abbrechen
                          </Button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Bulk Upload Form */
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="bulk-title-prefix">Titel-Präfix</Label>
                          <Input
                            id="bulk-title-prefix"
                            value={bulkUploadDefaults.titlePrefix}
                            onChange={(e) => setBulkUploadDefaults(prev => ({ ...prev, titlePrefix: e.target.value }))}
                            placeholder="z.B. Hero Bild"
                            data-testid="input-bulk-title-prefix"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Automatisch nummeriert: "Hero Bild 1", "Hero Bild 2", etc.
                          </p>
                        </div>
                        <div>
                          <Label htmlFor="bulk-description">Standard-Beschreibung</Label>
                          <Input
                            id="bulk-description"
                            value={bulkUploadDefaults.description}
                            onChange={(e) => setBulkUploadDefaults(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="z.B. Automatisch hochgeladenes Hero-Bild"
                            data-testid="input-bulk-description"
                          />
                        </div>
                      </div>
                      
                      <ImageInput
                        label="Mehrere Bilder hochladen"
                        value=""
                        onChange={() => {}} // Not used in bulk mode
                        allowMultiple={true}
                        onMultipleChange={(urls) => setBulkImageUrls(urls)}
                        placeholder="Mehrere Bilder auswählen..."
                        testId="bulk-hero-images"
                      />

                      {bulkImageUrls.length > 0 && (
                        <div className="space-y-3">
                          <h5 className="text-sm font-medium">Vorschau ({bulkImageUrls.length} Bilder)</h5>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {bulkImageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`Bulk upload ${index + 1}`}
                                  className="w-full h-24 object-cover rounded border"
                                  data-testid={`bulk-preview-${index}`}
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                  <p className="text-white text-xs text-center">
                                    {bulkUploadDefaults.titlePrefix} {(heroImages?.length || 0) + index + 1}
                                  </p>
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => {
                                    setBulkImageUrls(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  data-testid={`button-remove-bulk-${index}`}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (bulkImageUrls.length > 0) {
                              createBulkHeroImagesMutation.mutate(bulkImageUrls);
                            }
                          }}
                          disabled={bulkImageUrls.length === 0 || !bulkUploadDefaults.titlePrefix || !bulkUploadDefaults.description || createBulkHeroImagesMutation.isPending}
                          data-testid="button-save-bulk-hero-images"
                        >
                          {createBulkHeroImagesMutation.isPending 
                            ? `Speichern (${bulkImageUrls.length})...` 
                            : `${bulkImageUrls.length} Hero-Bilder hinzufügen`
                          }
                        </Button>
                        {bulkImageUrls.length > 0 && (
                          <Button
                            variant="outline"
                            onClick={() => setBulkImageUrls([])}
                            data-testid="button-clear-bulk-images"
                          >
                            Alle entfernen
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Hero Images List */}
                <div className="space-y-4">
                  <h4 className="font-medium">Aktuelle Hero-Bilder ({heroImages?.length || 0})</h4>
                  {heroImagesLoading ? (
                    <div className="flex items-center justify-center py-8" data-testid="hero-images-loading">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : heroImages && heroImages.length > 0 ? (
                    <div className="space-y-3">
                      {heroImages.map((image) => (
                        <div key={image.id} className="flex items-center gap-4 p-4 border rounded-lg" data-testid={`hero-image-${image.id}`}>
                          <img 
                            src={image.imageUrl} 
                            alt={image.title}
                            className="w-20 h-16 object-cover rounded"
                            onError={(e) => {
                              e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA4MCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yNCAyNEg1NlY0MEgyNFYyNFoiIGZpbGw9IiNEMUQ1REIiLz4KPC9zdmc+';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium truncate">{image.title}</h5>
                            <p className="text-sm text-muted-foreground truncate">{image.description}</p>
                            <p className="text-xs text-muted-foreground">Reihenfolge: {image.sortOrder + 1}</p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingHeroImage(image);
                                setHeroImageForm({
                                  title: image.title,
                                  description: image.description,
                                  imageUrl: image.imageUrl
                                });
                              }}
                              data-testid={`button-edit-hero-${image.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (confirm("Hero-Bild wirklich löschen?")) {
                                  deleteHeroImageMutation.mutate(image.id);
                                }
                              }}
                              disabled={deleteHeroImageMutation.isPending}
                              data-testid={`button-delete-hero-${image.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground" data-testid="no-hero-images">
                      <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Noch keine Hero-Bilder vorhanden</p>
                      <p className="text-sm">Füge das erste Hero-Bild für die Startseiten-Slideshow hinzu</p>
                    </div>
                  )}
                </div>
                </CardContent>
              )}
            </Card>

            {/* Scenic Landscapes Management */}
            <Card data-testid="scenic-landscapes-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('scenicLandscapes')}
                data-testid="scenic-landscapes-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Spektakuläre Landschaften verwalten</CardTitle>
                  {collapsedSections.scenicLandscapes ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.scenicLandscapes && (
                <CardContent className="space-y-6">
                  {scenicContentLoading ? (
                    <div className="text-center py-4 text-muted-foreground">
                      Landschaften werden geladen...
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Title & Subtitle editing */}
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="scenic-title" className="flex justify-between">
                            <span>Titel</span>
                            <span className={`text-sm ${scenicTitle.length > 200 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {scenicTitle.length}/200
                            </span>
                          </Label>
                          <Input
                            id="scenic-title"
                            value={scenicTitle}
                            onChange={(e) => {
                              if (e.target.value.length <= 200) {
                                setScenicTitle(e.target.value);
                              } else {
                                toast({
                                  title: "Fehler",
                                  description: "Titel ist zu lang (maximal 200 Zeichen)",
                                  variant: "destructive",
                                });
                              }
                            }}
                            placeholder="Spektakuläre Landschaften erwarten uns"
                            data-testid="input-scenic-title"
                            className={scenicTitle.length > 200 ? 'border-destructive' : ''}
                          />
                        </div>
                        <div>
                          <Label htmlFor="scenic-subtitle" className="flex justify-between">
                            <span>Untertitel</span>
                            <span className={`text-sm ${scenicSubtitle.length > 300 ? 'text-destructive' : 'text-muted-foreground'}`}>
                              {scenicSubtitle.length}/300
                            </span>
                          </Label>
                          <Textarea
                            id="scenic-subtitle"
                            value={scenicSubtitle}
                            onChange={(e) => {
                              if (e.target.value.length <= 300) {
                                setScenicSubtitle(e.target.value);
                              } else {
                                toast({
                                  title: "Fehler",
                                  description: "Untertitel ist zu lang (maximal 300 Zeichen)",
                                  variant: "destructive",
                                });
                              }
                            }}
                            placeholder="Von den türkisfarbenen Seen des Okanagan-Tals bis zu den majestätischen Gipfeln der Rocky Mountains - jeder Ort ist ein Fotomotiv"
                            rows={3}
                            data-testid="textarea-scenic-subtitle"
                            className={scenicSubtitle.length > 300 ? 'border-destructive' : ''}
                          />
                        </div>
                      </div>

                      {/* Gallery Items */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <span>📸</span>
                          Galerie-Bilder (6 Stück)
                        </h4>
                        {galleries?.map((gallery, index) => (
                          <Card key={gallery.id} className="border-l-4 border-l-primary/20">
                            <CardContent className="p-4">
                              <div className="grid gap-4">
                                <div className="flex items-center justify-between">
                                  <Label className="font-semibold">
                                    Bild {index + 1} {gallery.isLarge && "(Groß - 2x2)"}
                                  </Label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={gallery.isLarge}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          // Ensure only one large image
                                          const updatedGalleries = galleries.map(g => 
                                            g.id === gallery.id ? { ...g, isLarge: true } : { ...g, isLarge: false }
                                          );
                                          setGalleries(updatedGalleries);
                                        } else {
                                          // Don't allow unchecking if it's the only large image
                                          const largeCount = galleries.filter(g => g.isLarge).length;
                                          if (largeCount <= 1) {
                                            toast({
                                              title: "Fehler",
                                              description: "Mindestens ein großes Bild ist erforderlich",
                                              variant: "destructive",
                                            });
                                            return;
                                          }
                                          const updatedGalleries = galleries.map(g => 
                                            g.id === gallery.id ? { ...g, isLarge: false } : g
                                          );
                                          setGalleries(updatedGalleries);
                                        }
                                      }}
                                      data-testid={`checkbox-large-${index}`}
                                    />
                                    <Label className="text-sm">Großes Bild</Label>
                                  </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <Label htmlFor={`gallery-title-${index}`}>Titel</Label>
                                    <Input
                                      id={`gallery-title-${index}`}
                                      placeholder="z.B. Penticton Wine Country"
                                      value={gallery.title}
                                      onChange={(e) => {
                                        const updatedGalleries = galleries.map(g => 
                                          g.id === gallery.id ? { ...g, title: e.target.value } : g
                                        );
                                        setGalleries(updatedGalleries);
                                      }}
                                      data-testid={`input-gallery-title-${index}`}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor={`gallery-description-${index}`}>Beschreibung</Label>
                                    <Input
                                      id={`gallery-description-${index}`}
                                      placeholder="z.B. Okanagan Valley mit über 170 Weingütern"
                                      value={gallery.description}
                                      onChange={(e) => {
                                        const updatedGalleries = galleries.map(g => 
                                          g.id === gallery.id ? { ...g, description: e.target.value } : g
                                        );
                                        setGalleries(updatedGalleries);
                                      }}
                                      data-testid={`input-gallery-description-${index}`}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <Label htmlFor={`gallery-imageurl-${index}`}>Bild URL</Label>
                                  <Input
                                    id={`gallery-imageurl-${index}`}
                                    placeholder="https://images.unsplash.com/..."
                                    value={gallery.imageUrl}
                                    onChange={(e) => {
                                      const updatedGalleries = galleries.map(g => 
                                        g.id === gallery.id ? { ...g, imageUrl: e.target.value } : g
                                      );
                                      setGalleries(updatedGalleries);
                                    }}
                                    data-testid={`input-gallery-imageurl-${index}`}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`gallery-linkurl-${index}`}>Link URL (optional)</Label>
                                  <Input
                                    id={`gallery-linkurl-${index}`}
                                    placeholder="/location/penticton oder externe URL"
                                    value={gallery.linkUrl || ""}
                                    onChange={(e) => {
                                      const updatedGalleries = galleries.map(g => 
                                        g.id === gallery.id ? { ...g, linkUrl: e.target.value } : g
                                      );
                                      setGalleries(updatedGalleries);
                                    }}
                                    data-testid={`input-gallery-linkurl-${index}`}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={() => {
                          updateScenicContentMutation.mutate({
                            title: scenicTitle,
                            subtitle: scenicSubtitle,
                            galleries: galleries,
                          });
                        }}
                        disabled={updateScenicContentMutation.isPending}
                        className="w-full"
                        data-testid="button-update-scenic-content"
                      >
                        {updateScenicContentMutation.isPending ? "Aktualisiere..." : "🏞️ Landschaften aktualisieren"}
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Restaurant & Accommodation Management */}
            <Card data-testid="restaurant-accommodation-card" className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800">
              <CardHeader 
                className="cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-950/40 transition-colors"
                onClick={() => toggleSection('restaurantAccommodation')}
                data-testid="restaurant-accommodation-header"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                      <Hotel className="w-6 h-6" />
                      🏨🍽️ Restaurant & Unterkunft verwalten
                    </CardTitle>
                    <p className="text-orange-700 dark:text-orange-300 text-sm">
                      Verwalte Restaurants und Unterkünfte für jeden Ort deiner Tour-Route.
                    </p>
                  </div>
                  {collapsedSections.restaurantAccommodation ? 
                    <ChevronDown className="w-4 h-4 text-orange-800 dark:text-orange-200" /> : 
                    <ChevronUp className="w-4 h-4 text-orange-800 dark:text-orange-200" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.restaurantAccommodation && (
                <CardContent>
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-blue-800 dark:text-blue-200 mb-2">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">So funktioniert's:</span>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm">
                    Klicken Sie auf "Bearbeiten" bei einem Ort unten, um Restaurants und Unterkünfte hinzuzufügen.
                    Im Bearbeitungsfenster finden Sie prominent die Restaurant & Unterkunft-Verwaltung.
                  </p>
                </div>
                
                {locations && locations.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">Quick-Access zu Orten:</h4>
                    <div className="grid gap-3">
                      {locations.map((location) => {
                        const hasRestaurants = location.restaurants && location.restaurants.length > 0;
                        const hasAccommodation = location.accommodation && location.accommodation.trim() !== '';
                        
                        return (
                          <div key={location.id} className="bg-white dark:bg-gray-800 border border-orange-200 dark:border-orange-700 rounded-lg p-4" data-testid={`quick-access-location-${location.slug}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-gray-100">{location.name}</h3>
                                <div className="flex items-center gap-4 mt-2 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Hotel className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className={`${hasAccommodation ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                      {hasAccommodation ? 'Unterkunft ✓' : 'Keine Unterkunft'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <UtensilsCrossed className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className={`${hasRestaurants ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                                      {hasRestaurants ? `${location.restaurants?.length || 0} Restaurant(s) ✓` : 'Keine Restaurants'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button
                                onClick={() => {
                                  setSelectedLocation(location);
                                  setShowLocationForm(true);
                                }}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                                size="sm"
                                data-testid={`quick-edit-${location.slug}`}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Restaurants & Unterkunft bearbeiten
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                </CardContent>
              )}
            </Card>

            {/* Privacy Settings */}
            <Card data-testid="privacy-settings-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('privacySettings')}
                data-testid="privacy-settings-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Privacy-Einstellungen</CardTitle>
                  {collapsedSections.privacySettings ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.privacySettings && (
                <CardContent className="space-y-6">
                {/* Privacy Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="privacy-enabled">Privacy-Login aktivieren</Label>
                    <p className="text-sm text-muted-foreground">
                      Wenn aktiviert, ist ein Passwort erforderlich, um die Tour zu sehen
                    </p>
                  </div>
                  <Switch
                    id="privacy-enabled"
                    checked={tourSettings?.privacyEnabled || false}
                    onCheckedChange={(checked) => {
                      updatePrivacySettingsMutation.mutate({ privacyEnabled: checked });
                    }}
                    data-testid="switch-privacy-enabled"
                  />
                </div>

                {/* Password Section - only show when privacy is enabled */}
                {tourSettings?.privacyEnabled && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="privacy-password">Privacy-Passwort</Label>
                      <div className="relative">
                        <Input
                          id="privacy-password"
                          type={showPassword ? "text" : "password"}
                          value={privacyPassword}
                          onChange={(e) => setPrivacyPassword(e.target.value)}
                          placeholder="Neues Passwort eingeben..."
                          className="pr-10"
                          data-testid="input-privacy-password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          data-testid="button-toggle-password-visibility"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            if (privacyPassword.trim()) {
                              updatePrivacySettingsMutation.mutate({ privacyPassword: privacyPassword.trim() });
                            }
                          }}
                          disabled={!privacyPassword.trim() || updatePrivacySettingsMutation.isPending}
                          size="sm"
                          data-testid="button-save-password"
                        >
                          {updatePrivacySettingsMutation.isPending ? "Speichern..." : "Passwort speichern"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setPrivacyPassword("")}
                          size="sm"
                          data-testid="button-clear-password"
                        >
                          Leeren
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Das Passwort wird sicher gehasht gespeichert. Leer lassen, um das aktuelle Passwort zu behalten.
                      </p>
                    </div>

                    {/* Session Timeout */}
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session-Timeout (Minuten)</Label>
                      <Select
                        value={(tourSettings?.sessionTimeout || 10080).toString()}
                        onValueChange={(value) => {
                          updatePrivacySettingsMutation.mutate({ sessionTimeout: parseInt(value) });
                        }}
                      >
                        <SelectTrigger data-testid="select-session-timeout">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="60">1 Stunde</SelectItem>
                          <SelectItem value="360">6 Stunden</SelectItem>
                          <SelectItem value="720">12 Stunden</SelectItem>
                          <SelectItem value="1440">1 Tag</SelectItem>
                          <SelectItem value="4320">3 Tage</SelectItem>
                          <SelectItem value="10080">7 Tage (Standard)</SelectItem>
                          <SelectItem value="20160">14 Tage</SelectItem>
                          <SelectItem value="43200">30 Tage</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Wie lange sollen Nutzer eingeloggt bleiben?
                      </p>
                    </div>
                  </>
                )}

                {/* Current Status */}
                <div className="bg-muted p-2 rounded">
                  <p className="text-sm">
                    Status: {tourSettings?.privacyEnabled ? "Privacy aktiviert" : "Öffentlich zugänglich"}
                  </p>
                  {tourSettings?.privacyEnabled && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Session-Timeout: {Math.floor((tourSettings?.sessionTimeout || 10080) / 1440)} Tag(e)
                    </p>
                  )}
                </div>
                </CardContent>
              )}
            </Card>

            {/* GPS Settings */}
            <Card data-testid="gps-settings-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('gpsSettings')}
                data-testid="gps-settings-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">GPS Live-Tracking Einstellungen</CardTitle>
                  {collapsedSections.gpsSettings ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.gpsSettings && (
                <CardContent className="space-y-6">
                {/* GPS Toggle */}
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="gps-activated">GPS Live-Tracking für alle aktivieren</Label>
                    <p className="text-sm text-muted-foreground">
                      Wenn aktiviert, läuft GPS automatisch für alle Besucher - keine GPS-Berechtigung erforderlich
                    </p>
                  </div>
                  <Switch
                    id="gps-activated"
                    checked={tourSettings?.gpsActivatedByAdmin || false}
                    onCheckedChange={(checked) => {
                      updateTourSettingsMutation.mutate({ gpsActivatedByAdmin: checked });
                    }}
                    data-testid="switch-gps-activated"
                  />
                </div>

                {/* GPS Status */}
                <div className="bg-muted p-2 rounded">
                  <p className="text-sm">
                    Status: {tourSettings?.gpsActivatedByAdmin ? "GPS Live-Tracking aktiv" : "GPS manuell aktivierbar"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tourSettings?.gpsActivatedByAdmin 
                      ? "Das Live-Auto wird automatisch auf der Timeline angezeigt" 
                      : "Besucher können GPS-Tracking manuell aktivieren"
                    }
                  </p>
                </div>
                </CardContent>
              )}
            </Card>

            {/* Creator Management */}
            <Card data-testid="creator-management-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('creatorManagement')}
                data-testid="creator-management-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Personen verwalten</CardTitle>
                  {collapsedSections.creatorManagement ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.creatorManagement && (
                <CardContent className="space-y-6">
                  {/* Add New Creator */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Neue Person hinzufügen</h3>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Name der Person"
                        value={creatorName}
                        onChange={(e) => setCreatorName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && creatorName.trim()) {
                            createCreatorMutation.mutate(creatorName.trim());
                          }
                        }}
                        data-testid="input-creator-name"
                      />
                      <Button
                        onClick={() => {
                          if (creatorName.trim()) {
                            createCreatorMutation.mutate(creatorName.trim());
                          }
                        }}
                        disabled={!creatorName.trim() || createCreatorMutation.isPending}
                        data-testid="button-add-creator"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Hinzufügen
                      </Button>
                    </div>
                  </div>

                  {/* List of Creators */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium">Vorhandene Personen</h3>
                    {creatorsLoading ? (
                      <div className="text-center py-4 text-muted-foreground">
                        Personen werden geladen...
                      </div>
                    ) : creators && creators.length > 0 ? (
                      <div className="space-y-2">
                        {creators.map((creator) => (
                          <div key={creator.id} className="flex items-center justify-between border p-2 rounded" data-testid={`creator-item-${creator.id}`}>
                            {editingCreator?.id === creator.id ? (
                              <div className="flex gap-2 flex-1">
                                <Input
                                  value={editingCreatorName}
                                  onChange={(e) => setEditingCreatorName(e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter' && editingCreatorName.trim()) {
                                      updateCreatorMutation.mutate({ id: creator.id, name: editingCreatorName.trim() });
                                    }
                                  }}
                                  data-testid={`input-edit-creator-${creator.id}`}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    if (editingCreatorName.trim()) {
                                      updateCreatorMutation.mutate({ id: creator.id, name: editingCreatorName.trim() });
                                    }
                                  }}
                                  disabled={!editingCreatorName.trim() || updateCreatorMutation.isPending}
                                  data-testid={`button-save-creator-${creator.id}`}
                                >
                                  Speichern
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingCreator(null);
                                    setEditingCreatorName("");
                                  }}
                                  data-testid={`button-cancel-edit-${creator.id}`}
                                >
                                  Abbrechen
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="font-medium">{creator.name}</span>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCreator(creator);
                                      setEditingCreatorName(creator.name);
                                    }}
                                    data-testid={`button-edit-creator-${creator.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => {
                                      if (confirm(`Möchten Sie "${creator.name}" wirklich löschen?`)) {
                                        deleteCreatorMutation.mutate(creator.id);
                                      }
                                    }}
                                    disabled={deleteCreatorMutation.isPending}
                                    data-testid={`button-delete-creator-${creator.id}`}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4 text-muted-foreground">
                        Keine Personen vorhanden. Fügen Sie oben eine neue Person hinzu.
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>


            {/* Image Management - Fixed and moved from sidebar */}
            <Card data-testid="image-management-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('imageManagement')}
                data-testid="image-management-header"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-medium">Bilder für Orte verwalten</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Lade Bilder hoch und verwalte die Bildergalerien für jeden Ort deiner Tour.
                    </p>
                  </div>
                  {collapsedSections.imageManagement ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.imageManagement && (
                <CardContent className="space-y-6">
                  {!selectedLocation ? (
                    <div className="space-y-6">
                      {/* Modern Header Section */}
                      <div className="text-center max-w-md mx-auto">
                        <h3 className="text-sm font-medium mb-2">
                          Ort für Bilderverwaltung auswählen
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Wählen Sie einen Ort aus, um dessen Bilder zu verwalten. Sie können Bilder hochladen, bearbeiten und als Hauptbild festlegen.
                        </p>
                      </div>
                      
                      {/* Location Grid */}
                      {locations && locations.length > 0 ? (
                        <div className="grid gap-4">
                          {locations.map((location) => (
                            <Card 
                              key={location.id} 
                              className="cursor-pointer hover:border-primary" 
                              onClick={() => setSelectedLocation(location)}
                              data-testid={`select-location-${location.slug}`}
                            >
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-sm">
                                      {location.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground">
                                      {location.startDate} - {location.endDate}
                                    </p>
                                    {location.description && (
                                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {location.description}
                                      </p>
                                    )}
                                  </div>
                                  <ArrowLeft className="w-4 h-4 rotate-180 text-muted-foreground" />
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="mx-auto w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                            <Star className="w-10 h-10 text-muted-foreground/50" />
                          </div>
                          <h4 className="font-medium text-foreground mb-2">Noch keine Orte vorhanden</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            Erstellen Sie zuerst einen Ort, um Bilder hochladen zu können
                          </p>
                          <Button 
                            variant="outline" 
                            onClick={() => navigateToSection('locationsManagement', 'locations-management-card')}
                            data-testid="button-create-location"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Ort erstellen
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Clean Location Header */}
                      <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/50 dark:to-blue-900/30 border-blue-200 dark:border-blue-700">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                                <Camera className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                                  {selectedLocation.name}
                                </h2>
                                <p className="text-blue-700 dark:text-blue-300 text-sm flex items-center gap-2">
                                  📅 {selectedLocation.startDate} - {selectedLocation.endDate}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => setSelectedLocation(null)}
                              size="default"
                              className="bg-white/80 hover:bg-white dark:bg-blue-900/50 dark:hover:bg-blue-900"
                              data-testid="button-back-to-location-list"
                            >
                              <ArrowLeft className="w-4 h-4 mr-2" />
                              Anderen Ort wählen
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                      
                      {/* Image Gallery */}
                      <ImageGallery 
                        locationId={selectedLocation.id} 
                        isAdmin={true}
                        className="shadow-sm"
                      />
                    </div>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Locations Management */}
            <Card data-testid="locations-management-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('locationsManagement')}
                data-testid="locations-management-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Orte verwalten</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent header toggle when clicking button
                        setSelectedLocation(null);
                        setShowLocationForm(true);
                      }}
                      data-testid="button-add-location"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Ort hinzufügen
                    </Button>
                    {collapsedSections.locationsManagement ? 
                      <ChevronDown className="w-4 h-4" /> : 
                      <ChevronUp className="w-4 h-4" />
                    }
                  </div>
                </div>
              </CardHeader>
              {!collapsedSections.locationsManagement && (
                <CardContent>
                <div className="space-y-4">
                  {locations?.map((location) => (
                    <div key={location.id} className="flex items-center justify-between p-4 border border-border rounded-lg" data-testid={`location-item-${location.slug}`}>
                      <div>
                        <h3 className="font-medium">{location.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {location.startDate} - {location.endDate}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedLocation(location);
                            setShowLocationForm(true);
                          }}
                          data-testid={`button-edit-${location.slug}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteLocationMutation.mutate(location.id)}
                          data-testid={`button-delete-${location.slug}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                </CardContent>
              )}
            </Card>

            {/* Privacy Settings */}
            <Card data-testid="privacy-settings-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('privacySettings')}
                data-testid="privacy-settings-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Privacy-Einstellungen</CardTitle>
                  {collapsedSections.privacySettings ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.privacySettings && (
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="privacy-enabled">Privacy-Schutz aktivieren</Label>
                      <p className="text-sm text-muted-foreground">
                        Aktiviert Passwort-Schutz für die gesamte Tour-Website
                      </p>
                    </div>
                    <Switch 
                      id="privacy-enabled"
                      checked={tourSettings?.privacyEnabled || false}
                      onCheckedChange={(checked) => {
                        updatePrivacySettingsMutation.mutate({ privacyEnabled: checked });
                      }}
                      data-testid="switch-privacy-enabled"
                    />
                  </div>
                  
                  {tourSettings?.privacyEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="privacy-password">Privacy-Passwort</Label>
                        <div className="flex">
                          <Input
                            id="privacy-password"
                            type={showPassword ? "text" : "password"}
                            value={privacyPassword}
                            onChange={(e) => setPrivacyPassword(e.target.value)}
                            placeholder="Neues Passwort eingeben"
                            data-testid="input-privacy-password"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="ml-2"
                            onClick={() => setShowPassword(!showPassword)}
                            data-testid="button-toggle-password-visibility"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="session-timeout">Session-Timeout (Minuten)</Label>
                        <Input
                          id="session-timeout"
                          type="number"
                          defaultValue={tourSettings?.sessionTimeout || 60}
                          onBlur={(e) => {
                            updatePrivacySettingsMutation.mutate({ sessionTimeout: parseInt(e.target.value) || 60 });
                          }}
                          data-testid="input-session-timeout"
                        />
                      </div>
                      
                      <Button
                        onClick={() => {
                          if (privacyPassword.trim()) {
                            updatePrivacySettingsMutation.mutate({ privacyPassword: privacyPassword });
                          }
                        }}
                        disabled={!privacyPassword.trim() || updatePrivacySettingsMutation.isPending}
                        data-testid="button-save-privacy-password"
                      >
                        {updatePrivacySettingsMutation.isPending ? "Speichern..." : "Passwort speichern"}
                      </Button>
                    </>
                  )}
                </CardContent>
              )}
            </Card>

            {/* GPS Settings */}
            <Card data-testid="gps-settings-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('gpsSettings')}
                data-testid="gps-settings-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">GPS Live-Tracking</CardTitle>
                  {collapsedSections.gpsSettings ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.gpsSettings && (
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="gps-enabled">Live GPS-Tracking aktivieren</Label>
                      <p className="text-sm text-muted-foreground">
                        Zeigt die aktuelle Position der Tour in Echtzeit an
                      </p>
                    </div>
                    <Switch 
                      id="gps-enabled"
                      checked={tourSettings?.gpsActivatedByAdmin || false}
                      onCheckedChange={(checked) => {
                        updateTourSettingsMutation.mutate({ gpsActivatedByAdmin: checked });
                      }}
                      data-testid="switch-gps-enabled"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gps-update-interval">Update-Intervall (Sekunden)</Label>
                    <Input
                      id="gps-update-interval"
                      type="number"
                      defaultValue={tourSettings?.gpsUpdateInterval || 30}
                      onBlur={(e) => {
                        updateTourSettingsMutation.mutate({ gpsUpdateInterval: parseInt(e.target.value) || 30 });
                      }}
                      data-testid="input-gps-update-interval"
                    />
                  </div>
                  
                  <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 mb-2">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-medium">GPS Live-Tracking Info:</span>
                    </div>
                    <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                      Das GPS-Tracking funktioniert nur, wenn Location-Services im Browser aktiviert sind. 
                      Die Position wird automatisch auf der Live-Feed Seite angezeigt.
                    </p>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Quick Actions */}
            <Card data-testid="quick-actions-card">
              <CardHeader 
                className="cursor-pointer py-3"
                onClick={() => toggleSection('quickActions')}
                data-testid="quick-actions-header"
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-medium">Schnellaktionen</CardTitle>
                  {collapsedSections.quickActions ? 
                    <ChevronDown className="w-4 h-4" /> : 
                    <ChevronUp className="w-4 h-4" />
                  }
                </div>
              </CardHeader>
              {!collapsedSections.quickActions && (
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start" data-testid="button-export">
                    📱 Daten exportieren
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => {
                      queryClient.invalidateQueries();
                      toast({
                        title: "Cache geleert",
                        description: "Alle Daten wurden neu geladen",
                      });
                    }}
                    data-testid="button-clear-cache"
                  >
                    🔄 Cache leeren
                  </Button>
                  <Button variant="outline" className="w-full justify-start" data-testid="button-statistics">
                    📊 Statistiken anzeigen
                  </Button>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Location Form Modal */}
      {showLocationForm && (
        <AdminLocationForm
          location={selectedLocation}
          onClose={() => {
            setShowLocationForm(false);
            setSelectedLocation(null);
          }}
        />
      )}
    </div>
  );
}
