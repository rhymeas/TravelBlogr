import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Minus, Hotel, UtensilsCrossed, ExternalLink, Image, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ImageInput } from "@/components/ImageInput";
import type { Location, RestaurantData } from "@shared/schema";

interface AdminLocationFormProps {
  location?: Location | null;
  onClose: () => void;
}

// Helper function to convert DD.MM.YYYY to YYYY-MM-DDTHH:MM for datetime-local input
const convertToDateTimeLocal = (germanDate: string): string => {
  if (!germanDate) return "";
  
  // Handle DD.MM.YYYY format
  const parts = germanDate.split('.');
  if (parts.length === 3) {
    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T12:00`;
  }
  
  // If already in a different format, try to parse as Date
  const date = new Date(germanDate);
  if (!isNaN(date.getTime())) {
    return date.toISOString().slice(0, 16);
  }
  
  return "";
};

// Helper function to convert YYYY-MM-DDTHH:MM back to DD.MM.YYYY for storage
const convertToGermanDate = (dateTimeLocal: string): string => {
  if (!dateTimeLocal) return "";
  
  const date = new Date(dateTimeLocal);
  if (isNaN(date.getTime())) return "";
  
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}.${month}.${year}`;
};

export default function AdminLocationForm({ location, onClose }: AdminLocationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    startDate: "",
    endDate: "",
    description: "",
    accommodation: "",
    accommodationWebsite: "",
    accommodationImageUrl: "",
    accommodationInclusiveServices: [""],
    accommodationAmenities: [""],
    accommodationCheckinTime: "",
    accommodationCheckoutTime: "",
    distance: 0,
    imageUrl: "",
    mapImageUrl: "",
    activities: [""],
    restaurants: [{ name: "", description: "", cuisine: "", websiteUrl: "", imageUrl: "" }] as RestaurantData[],
    experiences: [""],
    highlights: [""],
    funFacts: [""],
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        slug: location.slug || "",
        startDate: convertToDateTimeLocal(location.startDate || ""),
        endDate: convertToDateTimeLocal(location.endDate || ""),
        description: location.description || "",
        accommodation: location.accommodation || "",
        accommodationWebsite: (location as any).accommodationWebsite || "",
        accommodationImageUrl: (location as any).accommodationImageUrl || "",
        accommodationInclusiveServices: (location as any).accommodationInclusiveServices?.length ? (location as any).accommodationInclusiveServices : [""],
        accommodationAmenities: (location as any).accommodationAmenities?.length ? (location as any).accommodationAmenities : [""],
        accommodationCheckinTime: (location as any).accommodationCheckinTime || "",
        accommodationCheckoutTime: (location as any).accommodationCheckoutTime || "",
        distance: location.distance || 0,
        imageUrl: location.imageUrl || "",
        mapImageUrl: (location as any).mapImageUrl || "",
        activities: location.activities?.length ? location.activities : [""],
        restaurants: location.restaurants?.length ? location.restaurants.map(r => ({
          name: r.name || "",
          description: r.description || "",
          cuisine: r.cuisine || "",
          websiteUrl: r.websiteUrl || "",
          imageUrl: r.imageUrl || ""
        })) : [{ name: "", description: "", cuisine: "", websiteUrl: "", imageUrl: "" }],
        experiences: location.experiences?.length ? location.experiences : [""],
        highlights: location.highlights?.length ? location.highlights : [""],
        funFacts: (location as any).funFacts?.length ? (location as any).funFacts : [""],
      });
    }
  }, [location]);

  const saveLocationMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        startDate: convertToGermanDate(data.startDate),
        endDate: convertToGermanDate(data.endDate),
        activities: data.activities.filter(a => a.trim()),
        restaurants: data.restaurants.filter(r => r.name.trim()),
        experiences: data.experiences.filter(e => e.trim()),
        highlights: data.highlights.filter(h => h.trim()),
        funFacts: data.funFacts.filter(f => f.trim()),
        accommodationInclusiveServices: data.accommodationInclusiveServices.filter(s => s.trim()),
        accommodationAmenities: data.accommodationAmenities.filter(a => a.trim()),
        coordinates: location?.coordinates || { lat: 0, lng: 0 },
      };

      if (location) {
        await apiRequest("PUT", `/api/locations/${location.id}`, payload);
      } else {
        await apiRequest("POST", "/api/locations", payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/locations"] });
      toast({
        title: "Erfolg",
        description: location ? "Ort wurde aktualisiert" : "Ort wurde erstellt",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Speichern: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveLocationMutation.mutate(formData);
  };

  const addArrayItem = (field: keyof typeof formData, defaultValue: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...(prev[field] as any[]), defaultValue]
    }));
  };

  const removeArrayItem = (field: keyof typeof formData, index: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  const updateArrayItem = (field: keyof typeof formData, index: number, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => i === index ? value : item)
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" data-testid="location-form-modal">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
          <CardTitle data-testid="form-title">
            {location ? `${location.name} bearbeiten` : "Neuen Ort hinzufügen"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="form-close-button">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto">
          <form onSubmit={handleSubmit} className="space-y-6 pb-20">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  data-testid="input-name"
                />
              </div>
              <div>
                <Label htmlFor="slug">URL-Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  required
                  data-testid="input-slug"
                />
              </div>
              <div>
                <Label htmlFor="start-date">Start-Datum</Label>
                <Input
                  id="start-date"
                  type="datetime-local"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                  data-testid="input-start-date"
                />
              </div>
              <div>
                <Label htmlFor="end-date">End-Datum</Label>
                <Input
                  id="end-date"
                  type="datetime-local"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                  data-testid="input-end-date"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                required
                data-testid="textarea-description"
              />
            </div>

            {/* Distance */}
            <div>
              <Label htmlFor="distance">Entfernung (km)</Label>
              <Input
                id="distance"
                type="number"
                value={formData.distance}
                onChange={(e) => setFormData(prev => ({ ...prev, distance: parseInt(e.target.value) || 0 }))}
                data-testid="input-distance"
              />
            </div>

            {/* Main Location Image */}
            <ImageInput
              label="Hauptbild des Orts"
              value={formData.imageUrl}
              onChange={(value) => setFormData(prev => ({ ...prev, imageUrl: value }))}
              placeholder="https://example.com/location-image.jpg"
              testId="location-main-image"
            />

            {/* Map Image */}
            <ImageInput
              label="Karten-Snippet (Screenshot)"
              value={formData.mapImageUrl}
              onChange={(value) => setFormData(prev => ({ ...prev, mapImageUrl: value }))}
              placeholder="https://example.com/map-screenshot.jpg"
              testId="location-map-image"
              usePublicUpload={true}
            />

            {/* Activities */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Aktivitäten</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('activities', '')}
                  data-testid="add-activity"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {formData.activities.map((activity, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={activity}
                    onChange={(e) => updateArrayItem('activities', index, e.target.value)}
                    placeholder="Aktivität beschreiben..."
                    data-testid={`activity-${index}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('activities', index)}
                    data-testid={`remove-activity-${index}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* ACCOMMODATION & RESTAURANTS MANAGEMENT - PROMINENT SECTION */}
            <Card data-testid="accommodation-restaurants-section">
              <CardHeader className="py-3">
                <CardTitle className="text-base font-medium">Unterkunft & Restaurants verwalten</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Hier können Sie die Unterkunft und Restaurants für {formData.name || 'diese Location'} hinzufügen und bearbeiten.
                </p>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* ACCOMMODATION SECTION */}
                <div className="border rounded p-3" data-testid="accommodation-management">
                  <h4 className="text-sm font-medium mb-3">Unterkunft</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="accommodation" className="text-sm">Unterkunft Name</Label>
                      <Input
                        id="accommodation"
                        value={formData.accommodation}
                        onChange={(e) => setFormData(prev => ({ ...prev, accommodation: e.target.value }))}
                        placeholder="z.B. Hotel Bellevue, Gasthof Zur Post..."
                        data-testid="input-accommodation"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="accommodation-website" className="text-sm">
                        Unterkunft Website
                      </Label>
                      <Input
                        id="accommodation-website"
                        type="url"
                        value={formData.accommodationWebsite}
                        onChange={(e) => setFormData(prev => ({ ...prev, accommodationWebsite: e.target.value }))}
                        placeholder="https://hotel-website.com"
                        data-testid="input-accommodation-website"
                      />
                      {formData.accommodationWebsite && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-green-600 dark:text-green-400">
                          <Check className="w-4 h-4" />
                          Website-Link hinzugefügt
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <Label className="text-sm">
                        Unterkunft Bild
                      </Label>
                      <ImageInput
                        label=""
                        value={formData.accommodationImageUrl}
                        onChange={(value) => setFormData(prev => ({ ...prev, accommodationImageUrl: value }))}
                        placeholder="https://example.com/hotel-image.jpg"
                        testId="accommodation-image"
                      />
                      {formData.accommodationImageUrl && (
                        <div className="mt-3 border border-border rounded-lg overflow-hidden">
                          <img 
                            src={formData.accommodationImageUrl} 
                            alt="Unterkunft Vorschau" 
                            className="w-full h-32 object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Check-in/Check-out Times */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="checkin-time" className="text-sm">Check-in Zeit</Label>
                        <Input
                          id="checkin-time"
                          value={formData.accommodationCheckinTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, accommodationCheckinTime: e.target.value }))}
                          placeholder="z.B. 15:00 Uhr"
                          data-testid="input-checkin-time"
                        />
                      </div>
                      <div>
                        <Label htmlFor="checkout-time" className="text-sm">Check-out Zeit</Label>
                        <Input
                          id="checkout-time"
                          value={formData.accommodationCheckoutTime}
                          onChange={(e) => setFormData(prev => ({ ...prev, accommodationCheckoutTime: e.target.value }))}
                          placeholder="z.B. 11:00 Uhr"
                          data-testid="input-checkout-time"
                        />
                      </div>
                    </div>
                    
                    {/* Inclusive Services */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm">Inklusive Leistungen</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('accommodationInclusiveServices', '')}
                          data-testid="add-inclusive-service"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {formData.accommodationInclusiveServices.map((service, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            value={service}
                            onChange={(e) => updateArrayItem('accommodationInclusiveServices', index, e.target.value)}
                            placeholder="z.B. Inkl. Frühstück, 2 Nächte Aufenthalt..."
                            data-testid={`inclusive-service-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem('accommodationInclusiveServices', index)}
                            data-testid={`remove-inclusive-service-${index}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                    
                    {/* Amenities */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm">Ausstattung & Annehmlichkeiten</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => addArrayItem('accommodationAmenities', '')}
                          data-testid="add-amenity"
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                      {formData.accommodationAmenities.map((amenity, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                          <Input
                            value={amenity}
                            onChange={(e) => updateArrayItem('accommodationAmenities', index, e.target.value)}
                            placeholder="z.B. Klimaanlage, Privates Bad, TV & Minibar..."
                            data-testid={`amenity-${index}`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeArrayItem('accommodationAmenities', index)}
                            data-testid={`remove-amenity-${index}`}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* RESTAURANTS SECTION */}
                <div className="border rounded p-3" data-testid="restaurants-management">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium">Restaurants</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addArrayItem('restaurants', { name: '', description: '', cuisine: '', websiteUrl: '', imageUrl: '' })}
                      data-testid="add-restaurant"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Restaurant hinzufügen
                    </Button>
                  </div>
                  
                  {formData.restaurants.length === 0 || (formData.restaurants.length === 1 && !formData.restaurants[0].name) ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <p className="text-sm">Noch keine Restaurants hinzugefügt</p>
                      <p className="text-xs">Klicken Sie auf "Restaurant hinzufügen" um zu starten</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {formData.restaurants.map((restaurant, index) => (
                        <Card key={index} className="border">
                          <CardHeader className="py-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-sm font-medium">
                                Restaurant #{index + 1}
                              </CardTitle>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeArrayItem('restaurants', index)}
                                className="hover:text-destructive"
                                data-testid={`remove-restaurant-${index}`}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm">Restaurant Name*</Label>
                                <Input
                                  value={restaurant.name}
                                  onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, name: e.target.value })}
                                  placeholder="z.B. Ristorante Mario, Café Central..."
                                  data-testid={`restaurant-name-${index}`}
                                />
                              </div>
                              <div>
                                <Label className="text-sm">Küchenstil</Label>
                                <Input
                                  value={restaurant.cuisine || ''}
                                  onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, cuisine: e.target.value })}
                                  placeholder="z.B. Italienisch, Lokal, International..."
                                  data-testid={`restaurant-cuisine-${index}`}
                                />
                              </div>
                            </div>
                            
                            <div>
                              <Label className="text-sm">Beschreibung</Label>
                              <Textarea
                                value={restaurant.description}
                                onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, description: e.target.value })}
                                placeholder="Kurze Beschreibung des Restaurants..."
                                rows={2}
                                data-testid={`restaurant-description-${index}`}
                              />
                            </div>
                            
                            <div>
                              <Label className="text-sm">
                                Website URL
                              </Label>
                              <Input
                                value={(restaurant as any).websiteUrl || ''}
                                onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, websiteUrl: e.target.value })}
                                placeholder="https://restaurant-website.com"
                                data-testid={`restaurant-website-${index}`}
                              />
                              {(restaurant as any).websiteUrl && (
                                <div className="flex items-center gap-2 mt-1 text-sm text-green-600 dark:text-green-400">
                                  <Check className="w-4 h-4" />
                                  Website-Link hinzugefügt
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <Label className="text-sm">
                                Restaurant Bild
                              </Label>
                              <ImageInput
                                label=""
                                value={(restaurant as any).imageUrl || ''}
                                onChange={(value) => updateArrayItem('restaurants', index, { ...restaurant, imageUrl: value })}
                                placeholder="https://example.com/restaurant-image.jpg"
                                testId={`restaurant-image-${index}`}
                              />
                              {(restaurant as any).imageUrl && (
                                <div className="mt-3 border border-border rounded-lg overflow-hidden">
                                  <img 
                                    src={(restaurant as any).imageUrl} 
                                    alt={`${restaurant.name} Vorschau`} 
                                    className="w-full h-32 object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Experiences */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Erlebnisse</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('experiences', '')}
                  data-testid="add-experience"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {formData.experiences.map((experience, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={experience}
                    onChange={(e) => updateArrayItem('experiences', index, e.target.value)}
                    placeholder="Erlebnis beschreiben..."
                    data-testid={`experience-${index}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('experiences', index)}
                    data-testid={`remove-experience-${index}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Highlights */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Highlights</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('highlights', '')}
                  data-testid="add-highlight"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={highlight}
                    onChange={(e) => updateArrayItem('highlights', index, e.target.value)}
                    placeholder="Highlight..."
                    data-testid={`highlight-${index}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('highlights', index)}
                    data-testid={`remove-highlight-${index}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Fun Facts */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Wissenswertes & Fun Facts</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('funFacts', '')}
                  data-testid="add-fun-fact"
                >
                  <Plus className="w-3 h-3" />
                </Button>
              </div>
              {formData.funFacts.map((funFact, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <Input
                    value={funFact}
                    onChange={(e) => updateArrayItem('funFacts', index, e.target.value)}
                    placeholder="Interessante Tatsache oder Fun Fact..."
                    data-testid={`fun-fact-${index}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeArrayItem('funFacts', index)}
                    data-testid={`remove-fun-fact-${index}`}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>

          </form>
        </CardContent>
        
        {/* Sticky Form Actions */}
        <div className="flex-shrink-0 border-t border-border bg-background p-4">
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose} data-testid="form-cancel">
              Abbrechen
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={saveLocationMutation.isPending}
              data-testid="form-submit"
            >
              {saveLocationMutation.isPending ? "Speichere..." : location ? "Aktualisieren" : "Erstellen"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
