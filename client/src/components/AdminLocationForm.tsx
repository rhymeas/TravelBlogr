import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Plus, Minus } from "lucide-react";
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

export default function AdminLocationForm({ location, onClose }: AdminLocationFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    startDate: "",
    endDate: "",
    description: "",
    accommodation: "",
    accommodationWebsite: "",
    distance: 0,
    imageUrl: "",
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
        startDate: location.startDate || "",
        endDate: location.endDate || "",
        description: location.description || "",
        accommodation: location.accommodation || "",
        accommodationWebsite: (location as any).accommodationWebsite || "",
        distance: location.distance || 0,
        imageUrl: location.imageUrl || "",
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
        activities: data.activities.filter(a => a.trim()),
        restaurants: data.restaurants.filter(r => r.name.trim()),
        experiences: data.experiences.filter(e => e.trim()),
        highlights: data.highlights.filter(h => h.trim()),
        funFacts: data.funFacts.filter(f => f.trim()),
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
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle data-testid="form-title">
            {location ? `${location.name} bearbeiten` : "Neuen Ort hinzufügen"}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} data-testid="form-close-button">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
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

            {/* Accommodation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="accommodation">Unterkunft</Label>
                <Input
                  id="accommodation"
                  value={formData.accommodation}
                  onChange={(e) => setFormData(prev => ({ ...prev, accommodation: e.target.value }))}
                  data-testid="input-accommodation"
                />
              </div>
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
            </div>

            {/* Accommodation Website */}
            <div>
              <Label htmlFor="accommodation-website">Unterkunft Website</Label>
              <Input
                id="accommodation-website"
                type="url"
                value={formData.accommodationWebsite}
                onChange={(e) => setFormData(prev => ({ ...prev, accommodationWebsite: e.target.value }))}
                placeholder="https://hotel-website.com"
                data-testid="input-accommodation-website"
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
                  <Plus className="w-4 h-4" />
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
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Restaurants */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Restaurants</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addArrayItem('restaurants', { name: '', description: '', cuisine: '' })}
                  data-testid="add-restaurant"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.restaurants.map((restaurant, index) => (
                <div key={index} className="border border-border rounded p-3 mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
                    <Input
                      value={restaurant.name}
                      onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, name: e.target.value })}
                      placeholder="Restaurant Name"
                      data-testid={`restaurant-name-${index}`}
                    />
                    <Input
                      value={restaurant.cuisine || ''}
                      onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, cuisine: e.target.value })}
                      placeholder="Küchenstil"
                      data-testid={`restaurant-cuisine-${index}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeArrayItem('restaurants', index)}
                      data-testid={`remove-restaurant-${index}`}
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="space-y-2">
                    <Input
                      value={restaurant.description}
                      onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, description: e.target.value })}
                      placeholder="Beschreibung"
                      data-testid={`restaurant-description-${index}`}
                    />
                    <Input
                      value={(restaurant as any).websiteUrl || ''}
                      onChange={(e) => updateArrayItem('restaurants', index, { ...restaurant, websiteUrl: e.target.value })}
                      placeholder="Website URL (z.B. https://restaurant.com)"
                      data-testid={`restaurant-website-${index}`}
                    />
                    <ImageInput
                      label="Restaurant Bild"
                      value={(restaurant as any).imageUrl || ''}
                      onChange={(value) => updateArrayItem('restaurants', index, { ...restaurant, imageUrl: value })}
                      placeholder="https://example.com/restaurant-image.jpg"
                      testId={`restaurant-image-${index}`}
                    />
                  </div>
                </div>
              ))}
            </div>

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
                  <Plus className="w-4 h-4" />
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
                    <Minus className="w-4 h-4" />
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
                  <Plus className="w-4 h-4" />
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
                    <Minus className="w-4 h-4" />
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
                  <Plus className="w-4 h-4" />
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
                    <Minus className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={onClose} data-testid="form-cancel">
                Abbrechen
              </Button>
              <Button 
                type="submit" 
                disabled={saveLocationMutation.isPending}
                data-testid="form-submit"
              >
                {saveLocationMutation.isPending ? "Speichere..." : location ? "Aktualisieren" : "Erstellen"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
