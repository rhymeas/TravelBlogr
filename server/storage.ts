import { 
  Location, 
  InsertLocation, 
  LocationImage, 
  InsertLocationImage, 
  TripPhoto,
  InsertTripPhoto,
  TourSettings, 
  InsertTourSettings,
  RestaurantData 
} from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // Location operations
  getLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  getLocationBySlug(slug: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location>;
  deleteLocation(id: string): Promise<void>;

  // Location images
  getLocationImages(locationId: string): Promise<LocationImage[]>;
  addLocationImage(image: InsertLocationImage): Promise<LocationImage>;
  deleteLocationImage(id: string): Promise<void>;
  setMainImage(locationId: string, imageId: string): Promise<void>;

  // Trip photos
  getTripPhotos(locationId: string): Promise<TripPhoto[]>;
  addTripPhoto(tripPhoto: InsertTripPhoto): Promise<TripPhoto>;

  // Tour settings
  getTourSettings(): Promise<TourSettings | undefined>;
  updateTourSettings(settings: Partial<InsertTourSettings>): Promise<TourSettings>;
}

export class MemStorage implements IStorage {
  private locations: Map<string, Location>;
  private locationImages: Map<string, LocationImage>;
  private tripPhotos: Map<string, TripPhoto>;
  private tourSettings: TourSettings | undefined;

  constructor() {
    this.locations = new Map();
    this.locationImages = new Map();
    this.tripPhotos = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize with actual tour data from PDF
    const initialLocations: InsertLocation[] = [
      {
        name: "Penticton",
        slug: "penticton",
        startDate: "20.09.2025",
        endDate: "22.09.2025",
        description: "Okanagan-Tal Weinreise mit geführten Weintouren, Weingut Burrowing Owl Estate Winery mit Restaurant und Picknick am See.",
        accommodation: "Penticton Beach House",
        accommodationPrice: 860,
        distance: 395,
        imageUrl: "https://plus.unsplash.com/premium_photo-1754211686859-913f71e422e1?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coordinates: { lat: 49.4949, lng: -119.5937 },
        activities: [
          "Weinverkostung im Burrowing Owl Estate Winery",
          "Geführte Weintour durch mehrere Weingüter", 
          "Picknick am Okanagan Lake in einem Provinzialpark",
          "Besuch Kentucky-Alleyne Provincial Park",
          "Promenade am Okanagan Lake"
        ],
        restaurants: [
          { name: "Summerhill Pyramid Winery Restaurant", description: "Weinkellerei mit Pyramide und Restaurant" } as RestaurantData,
          { name: "Burrowing Owl Estate Winery", description: "Weingut mit Restaurant und Weinproben" } as RestaurantData,
          { name: "Naramata Bench Weinstraße", description: "Verschiedene Weingüter entlang der Route" } as RestaurantData
        ],
        experiences: [
          "Leichte Riesling-Flights und Weinproben",
          "110 km lange wunderbare Strände am Okanagan Lake",
          "Geführte Weintouren mit professionellem Guide"
        ],
        highlights: ["Weingüter", "Okanagan Lake", "Weinproben"],
        routeHighlights: [
          "Cedar and Moss Coffee, Cultus Lake, Bridal Falls",
          "Abbotsford Selbstfahrer-Circle-Farm-Tour: Käse, Honig, Kürbisstand",
          "Abbotsford Mennonite Heritage Village",
          "Historische Montrose Street mit Weingütern und Brauereien",
          "Fahrt durch Manning Park durch Wein- und Obstanbaugebiete"
        ]
      },
      {
        name: "Vernon", 
        slug: "vernon",
        startDate: "22.09.2025",
        endDate: "23.09.2025",
        description: "Zwischenstopp am Swan Lake mit dem märchenhaften Castle at Swan Lake.",
        accommodation: "The Castle at Swan Lake",
        accommodationPrice: 371,
        distance: 120,
        imageUrl: "https://images.unsplash.com/photo-1755331039789-7e5680e26e8f?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coordinates: { lat: 50.2676, lng: -119.2721 },
        activities: [
          "Erkundung des Castle at Swan Lake",
          "Wanderung um den Swan Lake",
          "Besuch der Lavendelfarm mit Führung",
          "Weingutbesichtigungen mit geführten Touren",
          "Bootsverleih am Okanagan Lake (auch Hausboote verfügbar)",
          "Zugang zu 110 km langen wunderbaren Stränden am Okanagan Lake",
          "Geführte Weintouren mit professionellem Guide"
        ],
        restaurants: [
          { name: "Castle Restaurant", description: "Restaurant im Castle at Swan Lake" } as RestaurantData,
          { name: "Summerhill Pyramid Winery Restaurant", description: "Weinkellerei mit Pyramide und Restaurant - einzigartige architektonische Erfahrung" } as RestaurantData,
          { name: "Vernon Downtown Bistro", description: "Lokale Küche im Stadtzentrum" } as RestaurantData
        ],
        experiences: [
          "Romantischer Aufenthalt im Castle",
          "Malerische Seenlandschaft am Swan Lake",
          "Duftende Lavendelfelder mit geführten Farm-Touren",
          "Hausboot-Erlebnis auf dem Okanagan Lake",
          "Weinverkostungen in der einzigartigen Pyramiden-Weinkellerei",
          "Entspannung an 110 km langen Okanagan-Stränden"
        ],
        highlights: ["Swan Lake", "The Castle"],
        routeHighlights: [
          "Fahrt durch Wein- und Obstanbaugebiete nach Penticton",
          "Zwischenstopp in Kelowna mit Lavendelfarm und Weingütern"
        ]
      },
      {
        name: "Golden",
        slug: "golden", 
        startDate: "23.09.2025",
        endDate: "27.09.2025",
        description: "Rocky Mountains mit den berühmten Seen Lake Moraine und Lake Louise, Banff Gondel auf den Sulphur Mountain.",
        accommodation: "Chalet Ernest Feuz & Cedar House Restaurant",
        accommodationPrice: 1975,
        distance: 295,
        imageUrl: "https://images.unsplash.com/photo-1590100958871-a8d13c35ac33?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coordinates: { lat: 51.3003, lng: -116.9637 },
        activities: [
          "Morgenlicht am Lake Louise (früh besuchen um Menschenmassen zu entgehen)",
          "Johnston Canyon Catwalk",
          "Athabasca Falls",
          "Columbia Icefield Centre",
          "Peyto Lake Panoramadeck",
          "Gondelfahrt auf Sulphur Mountain",
          "Kaffee im Fairmont Chateau Lake Louise",
          "Banff Gondel auf den Sulphur Mountain",
          "Revelstoke Railway Museum",
          "Stopp am Columbia Icefield für eine Gletschertour"
        ],
        restaurants: [
          { name: "Fairmont Chateau Lake Louise", description: "Afternoon Tea mit spektakulärem Bergblick" } as RestaurantData,
          { name: "Cedar House Restaurant & Chalets", description: "Alpine Küche am Fluss mit Bergkulisse" } as RestaurantData,
          { name: "Banff Avenue Brewhouse", description: "Lokale Brauerei mit kanadischer Küche" } as RestaurantData
        ],
        experiences: [
          "Der Icefields Parkway - eine der schönsten Panoramastraßen der Welt",
          "Gletschertour am Columbia Icefield",
          "Morgenlicht-Fotografie am Lake Louise"
        ],
        highlights: ["Lake Louise", "Banff", "Columbia Icefield", "Gondel"],
        routeHighlights: [
          "Mittags Wildlife-Bootsafari im Blue River-Tal",
          "Sehr bequeme Sitzboote für Wildtier-Beobachtung (riversafari.com)",
          "Weiterfahrt durch spektakuläre Berglandschaft nach Jasper"
        ]
      },
      {
        name: "Jasper",
        slug: "jasper",
        startDate: "27.09.2025", 
        endDate: "29.09.2025",
        description: "Jasper Nationalpark mit Bootsfahrt auf dem Maligne Lake zur Spirit Island und Jasper SkyTram.",
        accommodation: "Deluxe Blockhütte",
        accommodationPrice: 2349,
        distance: 330,
        imageUrl: "https://images.unsplash.com/photo-1587381419916-78fc843a36f8?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coordinates: { lat: 52.8737, lng: -118.0814 },
        activities: [
          "Bootsfahrt auf dem Maligne Lake zur Spirit Island",
          "Fahrt mit dem Jasper SkyTram für Bergblicke",
          "Besuch der Athabasca Falls",
          "Maligne Canyon Wanderung",
          "Lake Agnes Tea House Trail",
          "Jasper Yellowhead Museum"
        ],
        restaurants: [
          { name: "Jasper Park Lodge", description: "Fine Dining mit Blick auf den Beauvert Lake" } as RestaurantData,
          { name: "The Raven Bistro", description: "Gourmet-Küche mit lokalen Zutaten" } as RestaurantData,
          { name: "Earls Jasper", description: "Moderne kanadische Küche in entspannter Atmosphäre" } as RestaurantData
        ],
        experiences: [
          "Spirit Island - eines der meistfotografierten Motive Kanadas",
          "Rogers-Pass-Centre und Meadow-in-the-Sky Drive",
          "Wildlife Viewing - Bären, Elche und Bergziegen"
        ],
        highlights: ["Maligne Lake", "SkyTram", "Spirit Island", "Wildlife"],
        routeHighlights: [
          "Rogers-Pass-Centre Besucherzentrum",
          "Eventuell Meadow-in-the-Sky Drive für Panoramablicke",
          "Icefields Parkway - eine der schönsten Panoramastraßen der Welt"
        ]
      },
      {
        name: "Clearwater",
        slug: "clearwater",
        startDate: "29.09.2025",
        endDate: "01.10.2025", 
        description: "Wells Gray Park mit spektakulären Wasserfällen - große Anzahl an Wasserfällen zum Entdecken.",
        accommodation: "Alpine Meadows",
        accommodationPrice: 731,
        distance: 360,
        imageUrl: "https://images.unsplash.com/photo-1625458647696-75b52c2e7483?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coordinates: { lat: 51.6428, lng: -120.0275 },
        activities: [
          "Helmcken Falls - spektakulärer Wasserfall",
          "Triple Decker Falls",
          "Third Canyon Falls", 
          "Moul Falls",
          "Sylvia and Godwin Falls",
          "Mittags Wildlife-Bootsafari im Blue River-Tal"
        ],
        restaurants: [
          { name: "Alpine Meadows Restaurant", description: "Hausgemachte Gerichte in rustikaler Atmosphäre" } as RestaurantData,
          { name: "Wells Gray Inn", description: "Traditionelle kanadische Küche" } as RestaurantData,
          { name: "Clearwater Country Inn", description: "Gemütliches Restaurant mit regionalen Spezialitäten" } as RestaurantData
        ],
        experiences: [
          "Rivers Safari - sehr bequeme Sitzboote für Wildlife-Beobachtung",
          "Wasserfälle-Fotografie in Wells Gray Park",
          "Begegnung mit der unberührten Wildnis"
        ],
        highlights: ["Helmcken Falls", "Wells Gray Park", "Wildlife Safari", "Wasserfälle"],
        routeHighlights: [
          "Helmcken Falls - spektakuläre Wasserfälle entlang der Route",
          "Triple Decker Falls, Third Canyon Falls",
          "Moul Falls, Sylvia und Godwin Falls",
          "Zwischenstopp zum Aufbrechen der langen Fahrt nach Kamloops"
        ]
      },
      {
        name: "Lillooet",
        slug: "lillooet", 
        startDate: "01.10.2025",
        endDate: "02.10.2025",
        description: "Historische Goldgräberstadt mit Stopps am Duffey Lake Lookout und Kaffeepause.",
        accommodation: "Reynolds Hotel", 
        accommodationPrice: 346,
        distance: 400,
        imageUrl: "https://images.unsplash.com/photo-1636569878287-48d4d61c0cb2?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coordinates: { lat: 50.6866, lng: -121.9346 },
        activities: [
          "Duffey Lake Lookout - spektakulärer Aussichtspunkt",
          "Lillooet Kaffeepause im Stadtzentrum", 
          "Historische Stadtführung"
        ],
        restaurants: [
          { name: "Reynolds Hotel Restaurant", description: "Historisches Hotel-Restaurant" } as RestaurantData,
          { name: "Duffey Lake Café", description: "Gemütliches Café mit lokalen Spezialitäten" } as RestaurantData,
          { name: "Lillooet Bakery", description: "Frisches Gebäck und Kaffee" } as RestaurantData
        ],
        experiences: [
          "Goldgräber-Geschichte erleben",
          "Malerische Berglandschaft am Duffey Lake",
          "Einblick in die First Nations Kultur"
        ],
        highlights: ["Duffey Lake", "Geschichte", "Fraser River"],
        routeHighlights: [
          "Duffey Lake Lookout - spektakulärer Aussichtspunkt",
          "Lillooet Kaffeepause im historischen Stadtzentrum",
          "Malerische Bergstraße durch das Fraser River Tal"
        ]
      },
      {
        name: "Sunshine Coast", 
        slug: "sunshine-coast",
        startDate: "02.10.2025",
        endDate: "06.10.2025",
        description: "Entspannter Abschluss an der Pazifikküste mit Beachfront Cottage ohne Hund.",
        accommodation: "Beachfront Cottage",
        accommodationPrice: 2147,
        distance: 230,
        imageUrl: "https://images.unsplash.com/photo-1602175439588-55b44e8a6719?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        coordinates: { lat: 49.6247, lng: -123.9707 },
        activities: [
          "Entspannung am Strand",
          "Spaziergänge entlang der Küste",
          "Meeresblick vom Cottage genießen",
          "Gibsons Landing erkunden"
        ],
        restaurants: [
          { name: "The Wharf Restaurant", description: "Meeresfrüchte-Restaurant direkt am Wasser" } as RestaurantData,
          { name: "Molly's Lane Café", description: "Gemütliches Café mit Aussicht auf den Pazifik" } as RestaurantData,
          { name: "Coast Restaurant", description: "Fine Dining mit Fokus auf lokale Meeresfrüchte" } as RestaurantData
        ],
        experiences: [
          "Sonnenuntergang über dem Pazifik",
          "Entspannung nach der intensiven Reise",
          "Abschied von der kanadischen Wildnis"
        ],
        highlights: ["Pazifik", "Strand", "Entspannung", "Cottage"],
        routeHighlights: [
          "Scenic Sea-to-Sky Highway entlang der Küste",
          "Übergang von den Bergen zur Pazifikküste",
          "Letzte spektakuläre Landschaftsabschnitte der Reise"
        ]
      }
    ];

    // Create locations
    initialLocations.forEach(location => {
      const id = randomUUID();
      const newLocation: Location = {
        ...location,
        id,
        accommodation: location.accommodation || null,
        accommodationWebsite: location.accommodationWebsite || null,
        accommodationImageUrl: (location as any).accommodationImageUrl || null,
        accommodationPrice: location.accommodationPrice || null,
        accommodationCurrency: location.accommodationCurrency || null,
        distance: location.distance || null,
        imageUrl: location.imageUrl || null,
        mapImageUrl: (location as any).mapImageUrl || null,
        coordinates: location.coordinates || null,
        activities: location.activities ? [...location.activities] : null,
        restaurants: location.restaurants ? [...location.restaurants] as RestaurantData[] : null,
        experiences: location.experiences ? [...location.experiences] : null,
        highlights: location.highlights ? [...location.highlights] : null,
        funFacts: location.funFacts ? [...location.funFacts] : null,
        routeHighlights: location.routeHighlights ? [...location.routeHighlights] : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.locations.set(id, newLocation);
    });

    // Initialize tour settings
    this.tourSettings = {
      id: randomUUID(),
      tourName: "Weinberg Tour 2025",
      startDate: "20.09.2025",
      endDate: "06.10.2025", 
      totalDistance: 2130,
      totalCost: 8779,
      currency: "CAD",
      heroImageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
      description: "Entdecke die atemberaubende Schönheit Kanadas - von den Weinbergen des Okanagan-Tals bis zu den majestätischen Rocky Mountains",
      privacyEnabled: false,
      privacyPassword: null,
      sessionTimeout: 10080, // 7 days in minutes
      updatedAt: new Date(),
    };
  }

  async getLocations(): Promise<Location[]> {
    return Array.from(this.locations.values()).sort((a, b) => 
      new Date(a.startDate.split('.').reverse().join('-')).getTime() - 
      new Date(b.startDate.split('.').reverse().join('-')).getTime()
    );
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    return Array.from(this.locations.values()).find(loc => loc.slug === slug);
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const newLocation: Location = {
      ...location,
      id,
      accommodation: location.accommodation || null,
      accommodationWebsite: location.accommodationWebsite || null,
      accommodationImageUrl: (location as any).accommodationImageUrl || null,
      accommodationPrice: location.accommodationPrice || null,
      accommodationCurrency: location.accommodationCurrency || null,
      distance: location.distance || null,
      imageUrl: location.imageUrl || null,
      mapImageUrl: (location as any).mapImageUrl || null,
      coordinates: location.coordinates || null,
      activities: location.activities ? [...location.activities] : null,
      restaurants: location.restaurants ? [...location.restaurants] as RestaurantData[] : null,
      experiences: location.experiences ? [...location.experiences] : null,
      highlights: location.highlights ? [...location.highlights] : null,
      funFacts: location.funFacts ? [...location.funFacts] : null,
      routeHighlights: location.routeHighlights ? [...location.routeHighlights] : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.locations.set(id, newLocation);
    return newLocation;
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location> {
    const existing = this.locations.get(id);
    if (!existing) {
      throw new Error("Location not found");
    }
    
    // Handle array updates properly to avoid type issues
    const updatedData = { ...location };
    delete updatedData.activities;
    delete updatedData.restaurants;
    delete updatedData.experiences;
    delete updatedData.highlights;
    delete updatedData.funFacts;
    delete updatedData.routeHighlights;
    
    const updated: Location = {
      ...existing,
      ...updatedData,
      // Ensure arrays are properly typed when updating
      activities: location.activities ? [...location.activities] : existing.activities,
      restaurants: location.restaurants ? [...location.restaurants] as RestaurantData[] : existing.restaurants,
      experiences: location.experiences ? [...location.experiences] : existing.experiences,
      highlights: location.highlights ? [...location.highlights] : existing.highlights,
      funFacts: location.funFacts ? [...location.funFacts] : existing.funFacts,
      routeHighlights: location.routeHighlights ? [...location.routeHighlights] : existing.routeHighlights,
      updatedAt: new Date(),
    };
    this.locations.set(id, updated);
    return updated;
  }

  async deleteLocation(id: string): Promise<void> {
    this.locations.delete(id);
    // Also delete related images
    const imagesToDelete = Array.from(this.locationImages.values())
      .filter(img => img.locationId === id);
    imagesToDelete.forEach(img => this.locationImages.delete(img.id));
  }

  async getLocationImages(locationId: string): Promise<LocationImage[]> {
    return Array.from(this.locationImages.values())
      .filter(img => img.locationId === locationId)
      .sort((a, b) => b.isMain ? 1 : -1);
  }

  async addLocationImage(image: InsertLocationImage): Promise<LocationImage> {
    const id = randomUUID();
    const newImage: LocationImage = {
      ...image,
      id,
      caption: image.caption || null,
      isMain: image.isMain || null,
      objectPath: image.objectPath || null,
      createdAt: new Date(),
    };
    this.locationImages.set(id, newImage);
    return newImage;
  }

  async deleteLocationImage(id: string): Promise<void> {
    this.locationImages.delete(id);
  }

  async setMainImage(locationId: string, imageId: string): Promise<void> {
    // Set all images for location to not main
    Array.from(this.locationImages.values())
      .filter(img => img.locationId === locationId)
      .forEach(img => {
        this.locationImages.set(img.id, { ...img, isMain: false });
      });
    
    // Set specified image as main
    const image = this.locationImages.get(imageId);
    if (image) {
      this.locationImages.set(imageId, { ...image, isMain: true });
    }
  }

  async getTripPhotos(locationId: string): Promise<TripPhoto[]> {
    return Array.from(this.tripPhotos.values())
      .filter(photo => photo.locationId === locationId)
      .sort((a, b) => {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      });
  }

  async addTripPhoto(tripPhoto: InsertTripPhoto): Promise<TripPhoto> {
    const id = randomUUID();
    const newTripPhoto: TripPhoto = {
      ...tripPhoto,
      id,
      caption: tripPhoto.caption || null,
      objectPath: tripPhoto.objectPath || null,
      uploadedBy: tripPhoto.uploadedBy || null,
      uploadedAt: new Date(),
    };
    this.tripPhotos.set(id, newTripPhoto);
    return newTripPhoto;
  }

  async getTourSettings(): Promise<TourSettings | undefined> {
    return this.tourSettings;
  }

  async updateTourSettings(settings: Partial<InsertTourSettings>): Promise<TourSettings> {
    if (!this.tourSettings) {
      const id = randomUUID();
      this.tourSettings = {
        ...settings,
        id,
        updatedAt: new Date(),
      } as TourSettings;
    } else {
      this.tourSettings = {
        ...this.tourSettings,
        ...settings,
        updatedAt: new Date(),
      };
    }
    return this.tourSettings;
  }
}

export const storage = new MemStorage();
