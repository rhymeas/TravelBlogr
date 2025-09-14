import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Plus, Edit, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "@/components/ObjectUploader";
import AdminLocationForm from "@/components/AdminLocationForm";
import type { Location, TourSettings } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

export default function AdminPanel() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showLocationForm, setShowLocationForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: locations, isLoading: locationsLoading } = useQuery<Location[]>({
    queryKey: ["/api/locations"],
  });

  const { data: tourSettings, isLoading: settingsLoading } = useQuery<TourSettings>({
    queryKey: ["/api/tour-settings"],
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

  const handleGetUploadParameters = async () => {
    const response = await fetch("/api/objects/upload", { method: "POST" });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleImageUploadComplete = async (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful.length > 0 && selectedLocation) {
      const uploadedFile = result.successful[0];
      try {
        await apiRequest("PUT", "/api/location-images", {
          imageURL: uploadedFile.uploadURL,
          locationId: selectedLocation.id,
          caption: `Bild für ${selectedLocation.name}`,
          isMain: false,
        });
        
        queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
        toast({
          title: "Erfolg",
          description: "Bild wurde erfolgreich hochgeladen",
        });
      } catch (error) {
        toast({
          title: "Fehler",
          description: "Fehler beim Speichern des Bildes",
          variant: "destructive",
        });
      }
    }
  };

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

            {/* Locations Management */}
            <Card data-testid="locations-management-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Orte verwalten</CardTitle>
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
            {/* Image Upload */}
            <Card data-testid="image-upload-card">
              <CardHeader>
                <CardTitle>Bilder verwalten</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="location-select">Ort auswählen</Label>
                  <Select onValueChange={(value) => {
                    const location = locations?.find(l => l.id === value);
                    setSelectedLocation(location || null);
                  }}>
                    <SelectTrigger data-testid="select-location">
                      <SelectValue placeholder="Ort auswählen..." />
                    </SelectTrigger>
                    <SelectContent>
                      {locations?.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedLocation && (
                  <ObjectUploader
                    maxNumberOfFiles={5}
                    maxFileSize={10485760}
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleImageUploadComplete}
                    buttonClassName="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bilder hochladen
                  </ObjectUploader>
                )}
              </CardContent>
            </Card>

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
