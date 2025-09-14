import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Upload, Lock, Eye, EyeOff, Hotel, UtensilsCrossed, AlertCircle, Star } from "lucide-react";
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
import type { Location, TourSettings, HeroImage } from "@shared/schema";

export default function AdminPanel() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [privacyPassword, setPrivacyPassword] = useState("");
  const [editingHeroImage, setEditingHeroImage] = useState<HeroImage | null>(null);
  const [heroImageForm, setHeroImageForm] = useState({ title: "", description: "", imageUrl: "" });
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


  if (locationsLoading || settingsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="admin-loading">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" data-testid="admin-panel">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-8" data-testid="admin-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-primary-foreground/10" data-testid="admin-back-button">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück zur Tour
              </Button>
            </Link>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Admin Panel</h1>
          <p className="text-primary-foreground/90 mt-2">Verwalte deine Tour-Inhalte</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Tour Settings */}
          <div className="lg:col-span-2 space-y-8">
            <Card data-testid="tour-settings-card">
              <CardHeader>
                <CardTitle>Tour-Einstellungen</CardTitle>
              </CardHeader>
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
            </Card>

            {/* Hero Images Management */}
            <Card data-testid="hero-images-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Hero-Bilder verwalten
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Verwalte die Slideshow-Bilder auf der Startseite
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add New Hero Image Form */}
                <div className="border rounded-lg p-4 space-y-4 bg-muted/50">
                  <h4 className="font-medium">Neues Hero-Bild hinzufügen</h4>
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
            </Card>

            {/* Privacy Settings */}
            <Card data-testid="privacy-settings-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Privacy-Einstellungen
                </CardTitle>
              </CardHeader>
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
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    Status: {tourSettings?.privacyEnabled ? "🔒 Privacy aktiviert" : "🔓 Öffentlich zugänglich"}
                  </p>
                  {tourSettings?.privacyEnabled && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Session-Timeout: {Math.floor((tourSettings?.sessionTimeout || 10080) / 1440)} Tag(e)
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* GPS Settings */}
            <Card data-testid="gps-settings-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🚗</span>
                  GPS Live-Tracking Einstellungen
                </CardTitle>
              </CardHeader>
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
                <div className="bg-muted p-3 rounded-lg">
                  <p className="text-sm font-medium">
                    Status: {tourSettings?.gpsActivatedByAdmin ? "🚗 GPS Live-Tracking aktiv" : "⏸️ GPS manuell aktivierbar"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {tourSettings?.gpsActivatedByAdmin 
                      ? "Das Live-Auto wird automatisch auf der Timeline angezeigt" 
                      : "Besucher können GPS-Tracking manuell aktivieren"
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* QUICK ACCESS - RESTAURANT & ACCOMMODATION MANAGEMENT */}
            <Card className="border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20 dark:border-orange-800" data-testid="restaurant-accommodation-quick-access">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-orange-800 dark:text-orange-200 flex items-center gap-2">
                  <Hotel className="w-6 h-6" />
                  <UtensilsCrossed className="w-6 h-6" />
                  Restaurant & Unterkunft Management
                </CardTitle>
                <p className="text-orange-700 dark:text-orange-300 text-sm">
                  Hier können Sie für jeden Ort Restaurants und Unterkünfte verwalten.
                </p>
              </CardHeader>
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
                                      {hasRestaurants ? `${location.restaurants.length} Restaurant(s) ✓` : 'Keine Restaurants'}
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
            </Card>

            {/* Locations Management */}
            <Card data-testid="locations-management-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5" />
                  Orte verwalten
                </CardTitle>
                <Button
                  onClick={() => {
                    setSelectedLocation(null);
                    setShowLocationForm(true);
                  }}
                  data-testid="button-add-location"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Ort hinzufügen
                </Button>
              </CardHeader>
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
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Image Upload */}
            <Card className="border-2 border-primary/20 bg-primary/5" data-testid="quick-image-upload">
              <CardHeader>
                <CardTitle className="flex items-center text-primary">
                  <Upload className="w-5 h-5 mr-2" />
                  📸 Bilder verwalten
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location-select">Ort auswählen</Label>
                    <Select onValueChange={(value) => {
                      const location = locations?.find(l => l.id === value);
                      setSelectedLocation(location || null);
                    }}>
                      <SelectTrigger data-testid="select-location">
                        <SelectValue placeholder="Ort für Bilderverwaltung auswählen..." />
                      </SelectTrigger>
                      <SelectContent className="z-50 max-h-60 overflow-auto" position="popper">
                        {locations?.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {!selectedLocation && (
                    <div className="bg-muted/50 rounded-lg p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        👆 Wähle einen Ort aus, um Bilder hochzuladen und zu verwalten
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
              
            {selectedLocation && (
              <ImageGallery 
                locationId={selectedLocation.id} 
                isAdmin={true}
                className="mt-4"
              />
            )}

            {/* Quick Actions */}
            <Card data-testid="quick-actions-card">
              <CardHeader>
                <CardTitle>Schnellaktionen</CardTitle>
              </CardHeader>
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
