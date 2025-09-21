import { 
  Location, 
  InsertLocation, 
  LocationImage, 
  InsertLocationImage, 
  Creator,
  InsertCreator,
  TripPhoto,
  InsertTripPhoto,
  GroupedTripPhoto,
  TourSettings, 
  InsertTourSettings,
  LocationPing,
  InsertLocationPing,
  HeroImage,
  InsertHeroImage,
  ScenicContent,
  InsertScenicContent,
  ScenicGalleryItem,
  RestaurantData,
  locations,
  locationImages,
  creators,
  tripPhotos,
  tripPhotoLikes,
  tourSettings,
  locationPings,
  heroImages,
  scenicContent
} from "@shared/schema";
import { randomUUID, createHash } from "crypto";
import { db } from "./db";
import { eq, desc, and, isNull, lt, sql } from "drizzle-orm";

// Shared location data for both MemStorage and DatabaseStorage 
const INITIAL_LOCATIONS: InsertLocation[] = [
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
      "Kunst- und Kulturzentrum Penticton Art Gallery – Kleine Galerie mit regionaler Kunst",
      "Kettle Valley Railway Trail (kurzer Abschnitt) – Ruhiger Spaziergang mit Seeblick, leicht begehbar",
      "Okanagan Falls langer pier",
      "Picknick im Kentucky-Alleyne Provincial Park – Malerische Seenlandschaft, gut erreichbar mit dem Auto",
      "Abbotsford Farm-Tour – Käse, Honig und Obststände, gemütlich mit dem Auto erreichbar",
      "We-Drive Kelowna Wine Tours (https://www.sagebrushtours.ca/wine-tours/naramata-wine-tour)",
      "Besuch von Sunrise Lavendelfarmen – Entspanntes Spazieren, herrlicher Duft",
      "Bootsfahrt auf dem Okanagan Lake – Ruhige Ausflugsmöglichkeiten, auch mit Sitzgelegenheit",
      "Summerhill Pyramid Winery – Weinkellerei mit Restaurant und toller Aussicht",
      "Historic O'Keefe Ranch – Historische Ranch mit gemütlicher Führung",
      "Planet Bee Honey Farm – Spannende Honigverkostung und Bienenführung"
    ],
    restaurants: [
      { name: "Elm", description: "Für Abends", websiteUrl: "https://eatatelma.com" } as RestaurantData,
      { name: "The Bench Market", description: "Beliebter All-Day Breakfast/Brunch" } as RestaurantData,
      { name: "Kin & Folk", description: "Frühstück & Abends" } as RestaurantData,
      { name: "Naramata Restaurants", description: "All great restaurants in Naramata area" } as RestaurantData,
      { name: "EATology", description: "Local dining" } as RestaurantData,
      { name: "Diner On Six", description: "Local diner" } as RestaurantData,
      { name: "Intermezzo Restaurant", description: "Fine dining option" } as RestaurantData,
      { name: "Bean To Cup Coffee House", description: "Breakfast coffee spot" } as RestaurantData
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
      "Polson Park – Ruhige Parkanlage für einen entspannten Spaziergang"
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
      "Golden Skybridge (nur Plattform-Besuch) – Beeindruckender Ausblick ohne Abenteuer-Teil",
      "Kicking Horse Pedestrian Bridge – Kurzer Spaziergang zur längsten freitragenden Holzbrücke Kanadas",
      "Yoho National Park Stopps – Emerald Lake und Natural Bridge, beide nah am Parkplatz",
      "Blue River Wildlife Bootssafari – Bequeme Sitzboote, um Tiere vom Wasser aus zu beobachten",
      "Besuch des Cedar House Restaurants & Chalets – Bekannt für ruhige Atmosphäre und Gourmetküche",
      "Revelstoke Railway Museum – Gemütlicher Museumsbesuch ohne große Wege"
    ],
    restaurants: [
      { name: "Big Bend Cafe", description: "Local cafe in Golden area" } as RestaurantData,
      { name: "Whitetooth Bistro", description: "Local bistro" } as RestaurantData,
      { name: "Bluebird Cafe", description: "Charming local cafe option" } as RestaurantData,
      { name: "Wandering Fern Cafe", description: "Alternative cafe option" } as RestaurantData,
      { name: "The Wolf's Den", description: "Local restaurant" } as RestaurantData
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
      "Pyramid Lake und Pyramid Island – Ruhige See-Insel mit Bank zum Ausruhen",
      "Jasper Yellowhead Museum – Regionale Geschichte, kleines Museum",
      "Abendliche Sternenbeobachtung – Jasper ist offizielles Dark Sky Preserve, perfekt zum Sterneschauen",
      "Icefields Parkway Fahrt – Eine der schönsten Panoramastraßen der Welt",
      "Bootsfahrt auf dem Maligne Lake zur Spirit Island – Ruhig, mit fantastischer Aussicht",
      "Columbia Icefield Besucherzentrum – Gletscherblick ohne anstrengende Wanderung",
      "Maligne Lake – größter natürlicher See",
      "Johnson Lake – Instagram-würdiger Ort"
    ],
    restaurants: [
      { name: "Bear's Paw Bakery", description: "Local bakery with fresh baked goods" } as RestaurantData,
      { name: "The Raven Bistro", description: "Gourmet-Küche mit lokalen Zutaten" } as RestaurantData,
      { name: "Harvest Food & Drink", description: "Local dining establishment" } as RestaurantData,
      { name: "Terra Restaurant", description: "Fine dining option" } as RestaurantData
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
      "Helmcken Falls Aussichtspunkt – Spektakulärer Wasserfall, leicht erreichbar",
      "Moul Falls & Sylvia Falls – Kürzere Spaziergänge mit schöner Natur"
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
      "Seton Lake Viewpoint – Eindrucksvoller Bergsee mit Parkmöglichkeiten direkt am Aussichtspunkt",
      "Besuch des Lillooet Museum & Archive – Kleines Heimatmuseum mit lokaler Geschichte",
      "Weinprobe bei Fort Berens Estate Winery – Ruhige Weindegustation mit Bergpanorama",
      "Duffey Lake Lookout – Atemberaubender Aussichtspunkt direkt an der Straße",
      "Spaziergang durch den Ort – Kleine Kaffepause und Erkundung lokaler Geschichte"
    ],
    restaurants: [
      { name: "Painted Turtle Restaurant", description: "Local restaurant in Lillooet" } as RestaurantData,
      { name: "Hop 'N' Hog Tap & Smokehouse", description: "Tap house and smokehouse" } as RestaurantData,
      { name: "Lillooet's Cookhouse Restaurant", description: "Local cookhouse style restaurant" } as RestaurantData,
      { name: "The Kitchen at Fort Berens", description: "Restaurant at Fort Berens Estate Winery" } as RestaurantData
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
      "Gibsons Public Market – Gemütlicher Markt mit kleinen Cafés und Kunstständen",
      "Porpoise Bay Provincial Park – Ruhiger Strandpark mit Sitzgelegenheiten",
      "Besuch eines Künstlerstudios – Sunshine Coast ist bekannt für kreative Handwerkskunst",
      "Fährfahrt zur Sunshine Coast – Entspannende Überfahrt mit Aussicht",
      "Künstlerdörfer und kleine Cafés – Gemütliche Besuche ohne große Strecken"
    ],
    restaurants: [
      { name: "The Pink House Bistro", description: "Charming bistro on Sunshine Coast" } as RestaurantData,
      { name: "Laughing Oyster Restaurant", description: "Restaurant with ocean views" } as RestaurantData
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
  getAllTripPhotos(): Promise<TripPhoto[]>;
  listTripPhotos(params: { locationId?: string; limit?: number; cursor?: string }): Promise<{ items: TripPhoto[]; nextCursor?: string }>;
  listTripPhotosGrouped(params: { locationId?: string; limit?: number; cursor?: string }): Promise<{ items: GroupedTripPhoto[]; nextCursor?: string }>;
  addTripPhoto(tripPhoto: InsertTripPhoto): Promise<TripPhoto>;
  createTripPhotoMedia(tripPhoto: InsertTripPhoto & { deleteToken: string }): Promise<TripPhoto & { deleteToken: string }>;
  toggleTripPhotoLike(photoId: string, userKey: string): Promise<{ liked: boolean; likesCount: number }>;
  updateTripPhotoCaption(photoId: string, caption: string): Promise<TripPhoto>;
  deleteTripPhoto(photoId: string, deleteToken?: string): Promise<void>;
  cleanupBrokenTripPhotos(): Promise<number>; // Returns number of photos removed

  // Tour settings
  getTourSettings(): Promise<TourSettings | undefined>;
  updateTourSettings(settings: Partial<InsertTourSettings>): Promise<TourSettings>;

  // Location pings for live GPS tracking
  addLocationPing(ping: InsertLocationPing): Promise<LocationPing>;
  getLatestLocationPing(): Promise<LocationPing | undefined>;
  getLocationPings(limit?: number): Promise<LocationPing[]>;

  // Hero images for homepage slideshow
  getHeroImages(): Promise<HeroImage[]>;
  createHeroImage(heroImage: InsertHeroImage): Promise<HeroImage>;
  updateHeroImage(id: string, heroImage: Partial<InsertHeroImage>): Promise<HeroImage>;
  deleteHeroImage(id: string): Promise<void>;
  reorderHeroImages(imageIds: string[]): Promise<void>;

  // Scenic content for "Spektakuläre Landschaften erwarten uns" section
  getScenicContent(): Promise<ScenicContent | undefined>;
  updateScenicContent(data: Partial<InsertScenicContent>): Promise<ScenicContent>;

  // Creator operations
  getAllCreators(): Promise<Creator[]>;
  createCreator(creator: InsertCreator): Promise<Creator>;
  updateCreator(id: string, creator: Partial<InsertCreator>): Promise<Creator>;
  deleteCreator(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private locations: Map<string, Location>;
  private locationImages: Map<string, LocationImage>;
  private tripPhotos: Map<string, TripPhoto>;
  private tripPhotoLikes: Map<string, { photoId: string; userKey: string; liked: boolean }>;
  private locationPings: Map<string, LocationPing>;
  private heroImages: Map<string, HeroImage>;
  private tourSettings: TourSettings | undefined;
  private scenicContent: ScenicContent | undefined;
  private creators: Map<string, Creator>;

  constructor() {
    this.locations = new Map();
    this.locationImages = new Map();
    this.tripPhotos = new Map();
    this.tripPhotoLikes = new Map();
    this.locationPings = new Map();
    this.heroImages = new Map();
    this.creators = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Initialize default creators
    const defaultCreators = ["Rimas", "Susanne", "Ursula", "Helmut"];
    defaultCreators.forEach(name => {
      const id = randomUUID();
      const creator: Creator = {
        id,
        name,
        createdAt: new Date(),
      };
      this.creators.set(id, creator);
    });

    // Use shared location data
    const initialLocations = INITIAL_LOCATIONS;

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
        accommodationInclusiveServices: (location as any).accommodationInclusiveServices || null,
        accommodationAmenities: (location as any).accommodationAmenities || null,
        accommodationCheckinTime: (location as any).accommodationCheckinTime || null,
        accommodationCheckoutTime: (location as any).accommodationCheckoutTime || null,
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
      gpsActivatedByAdmin: false,
      gpsUpdateInterval: 30, // GPS update interval in seconds
      updatedAt: new Date(),
    };

    // Initialize hero images with the existing hardcoded images
    const defaultHeroImages: InsertHeroImage[] = [
      {
        imageUrl: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        title: "Penticton Wine Country",
        description: "Naramata Bench Weinberge über dem Okanagan Lake",
        sortOrder: 0
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        title: "Jasper National Park",
        description: "Maligne Lake mit der berühmten Spirit Island",
        sortOrder: 1
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        title: "Golden Rocky Mountains",
        description: "Kicking Horse River zwischen majestätischen Gipfeln",
        sortOrder: 2
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        title: "Vernon - Kalamalka Lake",
        description: "Das türkisfarbene Juwel des Okanagan Valley",
        sortOrder: 3
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        title: "Wells Gray Provincial Park",
        description: "Helmcken Falls - 141 Meter spektakulärer Wasserfall",
        sortOrder: 4
      },
      {
        imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
        title: "Sunshine Coast",
        description: "Powell River & Desolation Sound Marine Park",
        sortOrder: 5
      }
    ];

    // Create hero images
    defaultHeroImages.forEach(heroImageData => {
      const id = randomUUID();
      const heroImage: HeroImage = {
        id,
        title: heroImageData.title,
        description: heroImageData.description,
        imageUrl: heroImageData.imageUrl,
        sortOrder: heroImageData.sortOrder ?? 0, // Use default if undefined
        objectPath: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.heroImages.set(id, heroImage);
    });

    // Initialize scenic content with default data from hardcoded values
    this.scenicContent = {
      id: randomUUID(),
      title: "Spektakuläre Landschaften erwarten uns",
      subtitle: "Von den türkisfarbenen Seen des Okanagan-Tals bis zu den majestätischen Gipfeln der Rocky Mountains - jeder Ort ist ein Fotomotiv",
      galleries: [
        {
          id: randomUUID(),
          title: "Penticton Wine Country",
          description: "Okanagan Valley mit über 170 Weingütern",
          imageUrl: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
          linkUrl: "/location/penticton" as string,
          isLarge: true,
          order: 1
        },
        {
          id: randomUUID(),
          title: "Maligne Lake",
          description: "Spirit Island",
          imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
          linkUrl: "" as string,
          isLarge: false,
          order: 2
        },
        {
          id: randomUUID(),
          title: "Golden Rockies",
          description: "Kicking Horse River",
          imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
          linkUrl: "/location/golden" as string,
          isLarge: false,
          order: 3
        },
        {
          id: randomUUID(),
          title: "Kalamalka Lake",
          description: "Türkisfarbenes Juwel",
          imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
          linkUrl: "/location/vernon" as string,
          isLarge: false,
          order: 4
        },
        {
          id: randomUUID(),
          title: "Sunshine Coast",
          description: "Desolation Sound",
          imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
          linkUrl: "" as string,
          isLarge: false,
          order: 5
        },
        {
          id: randomUUID(),
          title: "Wells Gray Falls",
          description: "Helmcken Falls",
          imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
          linkUrl: "" as string,
          isLarge: false,
          order: 6
        }
      ] as ScenicGalleryItem[],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
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
      accommodationInclusiveServices: location.accommodationInclusiveServices ? [...location.accommodationInclusiveServices] : null,
      accommodationAmenities: location.accommodationAmenities ? [...location.accommodationAmenities] : null,
      accommodationCheckinTime: location.accommodationCheckinTime || null,
      accommodationCheckoutTime: location.accommodationCheckoutTime || null,
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
      // Handle new accommodation fields
      accommodationInclusiveServices: location.accommodationInclusiveServices !== undefined ? (location.accommodationInclusiveServices ? [...location.accommodationInclusiveServices] : null) : existing.accommodationInclusiveServices,
      accommodationAmenities: location.accommodationAmenities !== undefined ? (location.accommodationAmenities ? [...location.accommodationAmenities] : null) : existing.accommodationAmenities,
      accommodationCheckinTime: location.accommodationCheckinTime !== undefined ? location.accommodationCheckinTime : existing.accommodationCheckinTime,
      accommodationCheckoutTime: location.accommodationCheckoutTime !== undefined ? location.accommodationCheckoutTime : existing.accommodationCheckoutTime,
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
        // Within same location, sort by takenAt (EXIF) then uploadedAt
        const dateA = a.takenAt || a.uploadedAt || new Date(0);
        const dateB = b.takenAt || b.uploadedAt || new Date(0);
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
  }

  async getAllTripPhotos(): Promise<TripPhoto[]> {
    return Array.from(this.tripPhotos.values())
      .sort((a, b) => {
        // Get location start dates for tour ordering
        const locationA = Array.from(this.locations.values()).find(loc => loc.id === a.locationId);
        const locationB = Array.from(this.locations.values()).find(loc => loc.id === b.locationId);
        
        const startDateA = locationA?.startDate ? new Date(locationA.startDate) : new Date(0);
        const startDateB = locationB?.startDate ? new Date(locationB.startDate) : new Date(0);
        
        // First sort by location tour order (later locations on top)
        const locationOrder = startDateB.getTime() - startDateA.getTime();
        if (locationOrder !== 0) return locationOrder;
        
        // Within same location, sort by takenAt (EXIF) then uploadedAt
        const dateA = a.takenAt || a.uploadedAt || new Date(0);
        const dateB = b.takenAt || b.uploadedAt || new Date(0);
        return new Date(dateB).getTime() - new Date(dateA).getTime(); // Most recent first
      });
  }

  async addTripPhoto(tripPhoto: InsertTripPhoto): Promise<TripPhoto> {
    const id = randomUUID();
    const newTripPhoto: TripPhoto = {
      id,
      imageUrl: tripPhoto.imageUrl,
      locationId: tripPhoto.locationId || null, // Explicit null handling
      creatorId: tripPhoto.creatorId || null, // Explicit null handling
      caption: tripPhoto.caption || null,
      objectPath: tripPhoto.objectPath || null,
      mediaType: tripPhoto.mediaType || 'image',
      videoUrl: tripPhoto.videoUrl || null,
      thumbnailUrl: tripPhoto.thumbnailUrl || null,
      deleteTokenHash: null,
      uploadedBy: tripPhoto.uploadedBy || null,
      uploadedAt: new Date(),
      likesCount: 0,
      groupId: tripPhoto.groupId || null,
      takenAt: tripPhoto.takenAt || null,
    };
    this.tripPhotos.set(id, newTripPhoto);
    return newTripPhoto;
  }

  async listTripPhotos(params: { locationId?: string; limit?: number; cursor?: string }): Promise<{ items: TripPhoto[]; nextCursor?: string }> {
    const { locationId, limit = 10, cursor } = params;
    
    let photos = Array.from(this.tripPhotos.values());
    
    // Filter by location if specified
    if (locationId) {
      photos = photos.filter(photo => photo.locationId === locationId);
    }
    
    // Sort by location tour order (startDate), then by takenAt/uploadedAt within location
    photos.sort((a, b) => {
      // Get location start dates for tour ordering
      const locationA = Array.from(this.locations.values()).find(loc => loc.id === a.locationId);
      const locationB = Array.from(this.locations.values()).find(loc => loc.id === b.locationId);
      
      const startDateA = locationA?.startDate ? new Date(locationA.startDate) : new Date(0);
      const startDateB = locationB?.startDate ? new Date(locationB.startDate) : new Date(0);
      
      // First sort by location tour order (later locations on top)
      const locationOrder = startDateB.getTime() - startDateA.getTime();
      if (locationOrder !== 0) return locationOrder;
      
      // Within same location, sort by takenAt (EXIF) then uploadedAt
      const dateA = a.takenAt || a.uploadedAt || new Date(0);
      const dateB = b.takenAt || b.uploadedAt || new Date(0);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
    
    // Apply cursor pagination
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split('_');
      const cursorTimestamp = parseInt(cursorDate);
      photos = photos.filter(photo => {
        const photoTimestamp = photo.uploadedAt ? new Date(photo.uploadedAt).getTime() : 0;
        return photoTimestamp < cursorTimestamp || (photoTimestamp === cursorTimestamp && photo.id < cursorId);
      });
    }
    
    // Apply limit and get next cursor
    const items = photos.slice(0, limit);
    const nextCursor = items.length === limit && photos.length > limit 
      ? `${items[items.length - 1].uploadedAt ? new Date(items[items.length - 1].uploadedAt!).getTime() : 0}_${items[items.length - 1].id}`
      : undefined;
    
    return { items, nextCursor };
  }

  async listTripPhotosGrouped(params: { locationId?: string; limit?: number; cursor?: string }): Promise<{ items: GroupedTripPhoto[]; nextCursor?: string }> {
    const { locationId, limit = 10, cursor } = params;
    
    let photos = Array.from(this.tripPhotos.values());
    
    // Filter by location if specified
    if (locationId) {
      photos = photos.filter(photo => photo.locationId === locationId);
    }
    
    // Group photos by groupId (fallback to individual id for backward compatibility)
    const groups = new Map<string, TripPhoto[]>();
    photos.forEach(photo => {
      const groupKey = photo.groupId || photo.id;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(photo);
    });
    
    // Transform groups into GroupedTripPhoto format
    const groupedPhotos: GroupedTripPhoto[] = Array.from(groups.entries()).map(([groupId, groupPhotos]) => {
      // Sort photos within group by takenAt (fallback to uploadedAt)
      const sortedPhotos = groupPhotos.sort((a, b) => {
        const dateA = a.takenAt || a.uploadedAt || new Date(0);
        const dateB = b.takenAt || b.uploadedAt || new Date(0);
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
      
      // Use the first photo for group metadata
      const firstPhoto = sortedPhotos[0];
      const earliestTakenAt = sortedPhotos.find(p => p.takenAt)?.takenAt || firstPhoto.uploadedAt || new Date();
      
      return {
        id: groupId,
        caption: firstPhoto.caption,
        locationId: firstPhoto.locationId,
        creatorId: firstPhoto.creatorId,
        uploadedAt: firstPhoto.uploadedAt || new Date(),
        groupTakenAt: earliestTakenAt,
        media: sortedPhotos.map(photo => ({
          id: photo.id,
          mediaType: photo.mediaType || 'image',
          imageUrl: photo.imageUrl,
          videoUrl: photo.videoUrl,
          thumbnailUrl: photo.thumbnailUrl,
          takenAt: photo.takenAt,
          likesCount: photo.likesCount || 0,
        }))
      };
    });
    
    // Sort groups by groupTakenAt desc (most recent first)
    groupedPhotos.sort((a, b) => {
      return new Date(b.groupTakenAt).getTime() - new Date(a.groupTakenAt).getTime();
    });
    
    // Apply cursor pagination
    let filteredGroups = groupedPhotos;
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split('_');
      const cursorTimestamp = parseInt(cursorDate);
      filteredGroups = groupedPhotos.filter(group => {
        const groupTimestamp = new Date(group.groupTakenAt).getTime();
        return groupTimestamp < cursorTimestamp || (groupTimestamp === cursorTimestamp && group.id < cursorId);
      });
    }
    
    // Apply limit and get next cursor
    const items = filteredGroups.slice(0, limit);
    const nextCursor = items.length === limit && filteredGroups.length > limit 
      ? `${new Date(items[items.length - 1].groupTakenAt).getTime()}_${items[items.length - 1].id}`
      : undefined;
    
    return { items, nextCursor };
  }

  async createTripPhotoMedia(tripPhoto: InsertTripPhoto & { deleteToken: string }): Promise<TripPhoto & { deleteToken: string }> {
    const id = randomUUID();
    const deleteTokenHash = createHash('sha256').update(tripPhoto.deleteToken).digest('hex');
    
    const newTripPhoto: TripPhoto = {
      id,
      imageUrl: tripPhoto.imageUrl,
      locationId: tripPhoto.locationId || null,
      creatorId: tripPhoto.creatorId || null,
      caption: tripPhoto.caption || null,
      objectPath: tripPhoto.objectPath || null,
      mediaType: tripPhoto.mediaType || 'image',
      videoUrl: tripPhoto.videoUrl || null,
      thumbnailUrl: tripPhoto.thumbnailUrl || null,
      deleteTokenHash,
      uploadedBy: tripPhoto.uploadedBy || null,
      uploadedAt: new Date(),
      likesCount: 0,
      groupId: tripPhoto.groupId || null,
      takenAt: tripPhoto.takenAt || null,
    };
    
    this.tripPhotos.set(id, newTripPhoto);
    return { ...newTripPhoto, deleteToken: tripPhoto.deleteToken };
  }

  async toggleTripPhotoLike(photoId: string, userKey: string): Promise<{ liked: boolean; likesCount: number }> {
    const photo = this.tripPhotos.get(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }
    
    const likeKey = `${photoId}_${userKey}`;
    const existingLike = this.tripPhotoLikes.get(likeKey);
    
    let liked: boolean;
    let likesCount = photo.likesCount || 0;
    
    if (existingLike?.liked) {
      // Unlike
      this.tripPhotoLikes.set(likeKey, { photoId, userKey, liked: false });
      likesCount = Math.max(0, likesCount - 1);
      liked = false;
    } else {
      // Like
      this.tripPhotoLikes.set(likeKey, { photoId, userKey, liked: true });
      likesCount += 1;
      liked = true;
    }
    
    // Update photo likes count
    const updatedPhoto = { ...photo, likesCount };
    this.tripPhotos.set(photoId, updatedPhoto);
    
    return { liked, likesCount };
  }

  async updateTripPhotoCaption(photoId: string, caption: string): Promise<TripPhoto> {
    const photo = this.tripPhotos.get(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }

    // Update the caption
    const updatedPhoto = {
      ...photo,
      caption: caption || null, // Set to null if caption is empty
    };

    this.tripPhotos.set(photoId, updatedPhoto);
    return updatedPhoto;
  }

  async deleteTripPhoto(photoId: string, deleteToken?: string): Promise<void> {
    const photo = this.tripPhotos.get(photoId);
    if (!photo) {
      throw new Error('Photo not found');
    }
    
    // Verify delete token if provided
    if (deleteToken && photo.deleteTokenHash) {
      const providedHash = createHash('sha256').update(deleteToken).digest('hex');
      if (providedHash !== photo.deleteTokenHash) {
        throw new Error('Invalid delete token');
      }
    }
    
    // Delete the photo
    this.tripPhotos.delete(photoId);
    
    // Clean up likes for this photo
    const likesToRemove: string[] = [];
    const likeEntries = Array.from(this.tripPhotoLikes.entries());
    for (const [key, like] of likeEntries) {
      if (like.photoId === photoId) {
        likesToRemove.push(key);
      }
    }
    likesToRemove.forEach(key => this.tripPhotoLikes.delete(key));
  }

  async cleanupBrokenTripPhotos(): Promise<number> {
    // Remove photos without objectPath (old broken uploads)
    const photosToRemove: string[] = [];
    
    // Use Array.from to avoid MapIterator issues
    const photoEntries = Array.from(this.tripPhotos.entries());
    for (const [id, photo] of photoEntries) {
      if (!photo.objectPath) {
        photosToRemove.push(id);
      }
    }
    
    // Remove the broken photos
    photosToRemove.forEach(id => this.tripPhotos.delete(id));
    
    console.log(`Cleaned up ${photosToRemove.length} broken trip photos without objectPath`);
    return photosToRemove.length;
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

  async addLocationPing(ping: InsertLocationPing): Promise<LocationPing> {
    const id = randomUUID();
    const newLocationPing: LocationPing = {
      ...ping,
      id,
      deviceId: ping.deviceId || null,
      accuracy: ping.accuracy || null,
      timestamp: ping.timestamp || new Date(),
      createdAt: new Date(),
    };
    this.locationPings.set(id, newLocationPing);
    return newLocationPing;
  }

  async getLatestLocationPing(): Promise<LocationPing | undefined> {
    const pings = Array.from(this.locationPings.values())
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
    return pings[0];
  }

  async getLocationPings(limit?: number): Promise<LocationPing[]> {
    const pings = Array.from(this.locationPings.values())
      .sort((a, b) => {
        const dateA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
        const dateB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
        return dateB - dateA;
      });
    
    if (limit) {
      return pings.slice(0, limit);
    }
    return pings;
  }

  async getHeroImages(): Promise<HeroImage[]> {
    return Array.from(this.heroImages.values())
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createHeroImage(heroImage: InsertHeroImage): Promise<HeroImage> {
    const id = randomUUID();
    const newHeroImage: HeroImage = {
      id,
      title: heroImage.title,
      description: heroImage.description,
      imageUrl: heroImage.imageUrl,
      sortOrder: heroImage.sortOrder ?? 0, // Use default if undefined
      objectPath: heroImage.objectPath || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.heroImages.set(id, newHeroImage);
    return newHeroImage;
  }

  async updateHeroImage(id: string, heroImage: Partial<InsertHeroImage>): Promise<HeroImage> {
    const existing = this.heroImages.get(id);
    if (!existing) {
      throw new Error("Hero image not found");
    }
    
    const updated: HeroImage = {
      ...existing,
      ...heroImage,
      updatedAt: new Date(),
    };
    this.heroImages.set(id, updated);
    return updated;
  }

  async deleteHeroImage(id: string): Promise<void> {
    this.heroImages.delete(id);
  }

  async reorderHeroImages(imageIds: string[]): Promise<void> {
    imageIds.forEach((imageId, index) => {
      const image = this.heroImages.get(imageId);
      if (image) {
        this.heroImages.set(imageId, {
          ...image,
          sortOrder: index,
          updatedAt: new Date(),
        });
      }
    });
  }

  // Scenic content methods
  async getScenicContent(): Promise<ScenicContent | undefined> {
    return this.scenicContent;
  }

  async updateScenicContent(data: Partial<InsertScenicContent>): Promise<ScenicContent> {
    if (this.scenicContent) {
      this.scenicContent = {
        ...this.scenicContent,
        ...data,
        galleries: data.galleries ? (data.galleries as ScenicGalleryItem[]) : this.scenicContent.galleries, // Ensure proper array type
        updatedAt: new Date(),
      };
    } else {
      const id = randomUUID();
      this.scenicContent = {
        id,
        title: data.title || 'Default Title',
        subtitle: data.subtitle || 'Default Subtitle',
        galleries: data.galleries ? (data.galleries as ScenicGalleryItem[]) : [],
        isActive: data.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    // This will never be undefined because we set it above
    return this.scenicContent!;
  }

  // Creator methods
  async getAllCreators(): Promise<Creator[]> {
    return Array.from(this.creators.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    const id = randomUUID();
    const newCreator: Creator = {
      ...creator,
      id,
      createdAt: new Date(),
    };
    this.creators.set(id, newCreator);
    return newCreator;
  }

  async updateCreator(id: string, creator: Partial<InsertCreator>): Promise<Creator> {
    const existing = this.creators.get(id);
    if (!existing) {
      throw new Error("Creator not found");
    }
    
    const updated: Creator = {
      ...existing,
      ...creator,
    };
    this.creators.set(id, updated);
    return updated;
  }

  async deleteCreator(id: string): Promise<void> {
    this.creators.delete(id);
  }
}

// Database Storage implementation using PostgreSQL
export class DatabaseStorage implements IStorage {
  private initialized = false;

  constructor() {
    this.ensureInitialized();
  }

  private async ensureInitialized() {
    if (this.initialized) return;
    await this.initializeDatabase();
    this.initialized = true;
  }

  private async migrateRestaurantData() {
    try {
      console.log("Starting restaurant data migration...");
      
      // Get all existing locations from database
      const allLocations = await db.select().from(locations);
      
      let migratedCount = 0;
      
      // Create a map of slug -> restaurant data from INITIAL_LOCATIONS for quick lookup
      const restaurantDataBySlug = new Map<string, RestaurantData[]>();
      INITIAL_LOCATIONS.forEach(initialLocation => {
        if (initialLocation.restaurants && initialLocation.restaurants.length > 0) {
          restaurantDataBySlug.set(initialLocation.slug, initialLocation.restaurants as RestaurantData[]);
        }
      });
      
      // Update each location's restaurant data if it exists in INITIAL_LOCATIONS
      for (const location of allLocations) {
        const correctRestaurantData = restaurantDataBySlug.get(location.slug);
        
        if (correctRestaurantData) {
          console.log(`Migrating restaurant data for location: ${location.name} (${location.slug})`);
          
          await db.update(locations)
            .set({ 
              restaurants: correctRestaurantData,
              updatedAt: new Date() // Force cache invalidation
            })
            .where(eq(locations.id, location.id));
          
          migratedCount++;
          console.log(`  ✓ Updated ${correctRestaurantData.length} restaurants for ${location.name}`);
        }
      }
      
      console.log(`Restaurant data migration completed. Updated ${migratedCount} locations.`);
    } catch (error) {
      console.error("Error during restaurant data migration:", error);
      throw error;
    }
  }

  private async initializeDatabase() {
    try {
      // Check if we have any data in the database
      const existingLocations = await db.select().from(locations).limit(1);
      const existingCreators = await db.select().from(creators).limit(1);
      
      // Only initialize if database is empty
      if (existingLocations.length === 0) {
        console.log("Initializing database with default data...");
        
        // Initialize default creators first
        const defaultCreators = ["Rimas", "Susanne", "Ursula", "Helmut"];
        for (const name of defaultCreators) {
          await db.insert(creators).values({ name });
        }

        // Use shared location data
        const initialLocations = INITIAL_LOCATIONS;

        // Insert all locations
        await db.insert(locations).values(initialLocations as any);

        // Initialize tour settings
        await db.insert(tourSettings).values({
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
          sessionTimeout: 10080,
          gpsActivatedByAdmin: false,
        });

        // Initialize hero images
        const defaultHeroImages = [
          {
            imageUrl: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
            title: "Penticton Wine Country",
            description: "Naramata Bench Weinberge über dem Okanagan Lake",
            sortOrder: 0
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
            title: "Jasper National Park",
            description: "Maligne Lake mit der berühmten Spirit Island",
            sortOrder: 1
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
            title: "Golden Rocky Mountains",
            description: "Kicking Horse River zwischen majestätischen Gipfeln",
            sortOrder: 2
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
            title: "Vernon - Kalamalka Lake",
            description: "Das türkisfarbene Juwel des Okanagan Valley",
            sortOrder: 3
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
            title: "Wells Gray Provincial Park",
            description: "Helmcken Falls - 141 Meter spektakulärer Wasserfall",
            sortOrder: 4
          },
          {
            imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080",
            title: "Sunshine Coast",
            description: "Powell River & Desolation Sound Marine Park",
            sortOrder: 5
          }
        ];

        for (const heroImage of defaultHeroImages) {
          await db.insert(heroImages).values(heroImage);
        }

        // Initialize scenic content
        await db.insert(scenicContent).values({
          title: "Spektakuläre Landschaften erwarten uns",
          subtitle: "Von den türkisfarbenen Seen des Okanagan-Tals bis zu den majestätischen Gipfeln der Rocky Mountains - jeder Ort ist ein Fotomotiv",
          galleries: [
            {
              id: randomUUID(),
              title: "Penticton Wine Country",
              description: "Okanagan Valley mit über 170 Weingütern",
              imageUrl: "https://images.unsplash.com/photo-1528190336454-13cd56b45b5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&h=800",
              linkUrl: "/location/penticton",
              isLarge: true,
              order: 1
            },
            {
              id: randomUUID(),
              title: "Maligne Lake",
              description: "Spirit Island",
              imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
              linkUrl: "",
              isLarge: false,
              order: 2
            },
            {
              id: randomUUID(),
              title: "Golden Rockies",
              description: "Kicking Horse River",
              imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
              linkUrl: "/location/golden",
              isLarge: false,
              order: 3
            },
            {
              id: randomUUID(),
              title: "Kalamalka Lake",
              description: "Türkisfarbenes Juwel",
              imageUrl: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
              linkUrl: "/location/vernon",
              isLarge: false,
              order: 4
            },
            {
              id: randomUUID(),
              title: "Sunshine Coast",
              description: "Desolation Sound",
              imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
              linkUrl: "",
              isLarge: false,
              order: 5
            },
            {
              id: randomUUID(),
              title: "Wells Gray Falls",
              description: "Helmcken Falls",
              imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&h=400",
              linkUrl: "",
              isLarge: false,
              order: 6
            }
          ] as ScenicGalleryItem[],
          isActive: true,
        });

        console.log("Database initialized with default data");
      } else {
        console.log("Database already has data, skipping initialization");
      }

      // Run restaurant data migration (idempotent - safe to run multiple times)
      await this.migrateRestaurantData();
      
    } catch (error) {
      console.error("Error initializing database:", error);
      throw error;
    }
  }

  // Location operations
  async getLocations(): Promise<Location[]> {
    await this.ensureInitialized();
    const results = await db.select().from(locations);
    return results.sort((a, b) => 
      new Date(a.startDate.split('.').reverse().join('-')).getTime() - 
      new Date(b.startDate.split('.').reverse().join('-')).getTime()
    );
  }

  async getLocation(id: string): Promise<Location | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
    return result[0];
  }

  async getLocationBySlug(slug: string): Promise<Location | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(locations).where(eq(locations.slug, slug)).limit(1);
    return result[0];
  }

  async createLocation(location: InsertLocation): Promise<Location> {
    await this.ensureInitialized();
    const result = await db.insert(locations).values([location as any]).returning();
    return result[0];
  }

  async updateLocation(id: string, location: Partial<InsertLocation>): Promise<Location> {
    await this.ensureInitialized();
    const updateData = { ...location, updatedAt: new Date() } as any;
    const result = await db.update(locations)
      .set(updateData)
      .where(eq(locations.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Location not found");
    }
    return result[0];
  }

  async deleteLocation(id: string): Promise<void> {
    await this.ensureInitialized();
    // Delete related images first
    await db.delete(locationImages).where(eq(locationImages.locationId, id));
    // Delete location
    await db.delete(locations).where(eq(locations.id, id));
  }

  // Location images
  async getLocationImages(locationId: string): Promise<LocationImage[]> {
    await this.ensureInitialized();
    const result = await db.select().from(locationImages)
      .where(eq(locationImages.locationId, locationId));
    return result.sort((a, b) => (b.isMain ? 1 : 0) - (a.isMain ? 1 : 0));
  }

  async addLocationImage(image: InsertLocationImage): Promise<LocationImage> {
    await this.ensureInitialized();
    const result = await db.insert(locationImages).values(image).returning();
    return result[0];
  }

  async deleteLocationImage(id: string): Promise<void> {
    await this.ensureInitialized();
    await db.delete(locationImages).where(eq(locationImages.id, id));
  }

  async setMainImage(locationId: string, imageId: string): Promise<void> {
    await this.ensureInitialized();
    // Set all images for location to not main
    await db.update(locationImages)
      .set({ isMain: false })
      .where(eq(locationImages.locationId, locationId));
    
    // Set specified image as main
    await db.update(locationImages)
      .set({ isMain: true })
      .where(eq(locationImages.id, imageId));
  }

  // Trip photos
  async getTripPhotos(locationId: string): Promise<TripPhoto[]> {
    await this.ensureInitialized();
    const result = await db.select().from(tripPhotos)
      .where(eq(tripPhotos.locationId, locationId))
      .orderBy(desc(tripPhotos.uploadedAt));
    return result;
  }

  async getAllTripPhotos(): Promise<TripPhoto[]> {
    await this.ensureInitialized();
    const result = await db.select().from(tripPhotos)
      .orderBy(desc(tripPhotos.uploadedAt));
    return result;
  }

  async addTripPhoto(tripPhoto: InsertTripPhoto): Promise<TripPhoto> {
    await this.ensureInitialized();
    const result = await db.insert(tripPhotos).values(tripPhoto).returning();
    return result[0];
  }

  async listTripPhotos(params: { locationId?: string; limit?: number; cursor?: string }): Promise<{ items: TripPhoto[]; nextCursor?: string }> {
    await this.ensureInitialized();
    
    const { locationId, limit = 10, cursor } = params;
    
    let query = db.select().from(tripPhotos);
    
    // Filter by location if specified
    if (locationId) {
      query = query.where(eq(tripPhotos.locationId, locationId)) as any;
    }
    
    // Apply cursor pagination
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split('_');
      const cursorTimestamp = new Date(parseInt(cursorDate));
      query = query.where(
        sql`(${tripPhotos.uploadedAt} < ${cursorTimestamp} OR (${tripPhotos.uploadedAt} = ${cursorTimestamp} AND ${tripPhotos.id} < ${cursorId}))`
      ) as any;
    }
    
    // Order by location tour order (startDate) descending, then by takenAt/uploadedAt, then by ID
    const resultWithLocation = await query
      .leftJoin(locations, eq(tripPhotos.locationId, locations.id))
      .orderBy(
        sql`COALESCE(${locations.startDate}, '1900-01-01') DESC`,
        sql`COALESCE(${tripPhotos.takenAt}, ${tripPhotos.uploadedAt}) DESC`, 
        desc(tripPhotos.id)
      )
      .limit(limit + 1); // Get one extra to determine if there's a next page
    
    // Extract trip photos from joined result
    const result = resultWithLocation.map(row => row.trip_photos);
    
    // Check if there are more items
    const hasMore = result.length > limit;
    const items = hasMore ? result.slice(0, limit) : result;
    
    const nextCursor = hasMore && items.length > 0
      ? `${items[items.length - 1].uploadedAt!.getTime()}_${items[items.length - 1].id}`
      : undefined;
    
    return { items, nextCursor };
  }

  async listTripPhotosGrouped(params: { locationId?: string; limit?: number; cursor?: string }): Promise<{ items: GroupedTripPhoto[]; nextCursor?: string }> {
    await this.ensureInitialized();
    
    const { locationId, limit = 10, cursor } = params;
    
    // Get all photos
    let query = db.select().from(tripPhotos);
    
    // Filter by location if specified
    if (locationId) {
      query = query.where(eq(tripPhotos.locationId, locationId)) as any;
    }
    
    const allPhotos = await query.orderBy(desc(tripPhotos.uploadedAt));
    
    // Group photos by groupId (fallback to individual id for backward compatibility)
    const groups = new Map<string, TripPhoto[]>();
    allPhotos.forEach(photo => {
      const groupKey = photo.groupId || photo.id;
      if (!groups.has(groupKey)) {
        groups.set(groupKey, []);
      }
      groups.get(groupKey)!.push(photo);
    });
    
    // Transform groups into GroupedTripPhoto format
    const groupedPhotos: GroupedTripPhoto[] = Array.from(groups.entries()).map(([groupId, groupPhotos]) => {
      // Sort photos within group by takenAt (fallback to uploadedAt)
      const sortedPhotos = groupPhotos.sort((a, b) => {
        const dateA = a.takenAt || a.uploadedAt || new Date(0);
        const dateB = b.takenAt || b.uploadedAt || new Date(0);
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
      
      // Use the first photo for group metadata
      const firstPhoto = sortedPhotos[0];
      const earliestTakenAt = sortedPhotos.find(p => p.takenAt)?.takenAt || firstPhoto.uploadedAt || new Date();
      
      return {
        id: groupId,
        caption: firstPhoto.caption,
        locationId: firstPhoto.locationId,
        creatorId: firstPhoto.creatorId,
        uploadedAt: firstPhoto.uploadedAt || new Date(),
        groupTakenAt: earliestTakenAt,
        media: sortedPhotos.map(photo => ({
          id: photo.id,
          mediaType: photo.mediaType || 'image',
          imageUrl: photo.imageUrl,
          videoUrl: photo.videoUrl,
          thumbnailUrl: photo.thumbnailUrl,
          takenAt: photo.takenAt,
          likesCount: photo.likesCount || 0,
        }))
      };
    });
    
    // Sort groups by groupTakenAt desc (most recent first)
    groupedPhotos.sort((a, b) => {
      return new Date(b.groupTakenAt).getTime() - new Date(a.groupTakenAt).getTime();
    });
    
    // Apply cursor pagination
    let filteredGroups = groupedPhotos;
    if (cursor) {
      const [cursorDate, cursorId] = cursor.split('_');
      const cursorTimestamp = parseInt(cursorDate);
      filteredGroups = groupedPhotos.filter(group => {
        const groupTimestamp = new Date(group.groupTakenAt).getTime();
        return groupTimestamp < cursorTimestamp || (groupTimestamp === cursorTimestamp && group.id < cursorId);
      });
    }
    
    // Apply limit and get next cursor
    const items = filteredGroups.slice(0, limit);
    const nextCursor = items.length === limit && filteredGroups.length > limit 
      ? `${new Date(items[items.length - 1].groupTakenAt).getTime()}_${items[items.length - 1].id}`
      : undefined;
    
    return { items, nextCursor };
  }

  async createTripPhotoMedia(tripPhoto: InsertTripPhoto & { deleteToken: string }): Promise<TripPhoto & { deleteToken: string }> {
    await this.ensureInitialized();
    
    const deleteTokenHash = createHash('sha256').update(tripPhoto.deleteToken).digest('hex');
    
    const photoToInsert = {
      ...tripPhoto,
      deleteTokenHash,
      mediaType: tripPhoto.mediaType || 'image',
      likesCount: 0,
    };
    
    const result = await db.insert(tripPhotos).values(photoToInsert).returning();
    return { ...result[0], deleteToken: tripPhoto.deleteToken };
  }

  async toggleTripPhotoLike(photoId: string, userKey: string): Promise<{ liked: boolean; likesCount: number }> {
    await this.ensureInitialized();
    
    // Check if like already exists
    const existingLike = await db.select().from(tripPhotoLikes)
      .where(and(
        eq(tripPhotoLikes.tripPhotoId, photoId),
        eq(tripPhotoLikes.userIdentifier, userKey)
      ))
      .limit(1);
    
    let liked: boolean;
    
    if (existingLike.length > 0) {
      // Remove like
      await db.delete(tripPhotoLikes)
        .where(and(
          eq(tripPhotoLikes.tripPhotoId, photoId),
          eq(tripPhotoLikes.userIdentifier, userKey)
        ));
      
      // Decrement likes count
      await db.update(tripPhotos)
        .set({ likesCount: sql`GREATEST(0, ${tripPhotos.likesCount} - 1)` })
        .where(eq(tripPhotos.id, photoId));
      
      liked = false;
    } else {
      // Add like
      await db.insert(tripPhotoLikes).values({
        tripPhotoId: photoId,
        userIdentifier: userKey,
        creatorId: null, // For anonymous likes
      });
      
      // Increment likes count
      await db.update(tripPhotos)
        .set({ likesCount: sql`${tripPhotos.likesCount} + 1` })
        .where(eq(tripPhotos.id, photoId));
      
      liked = true;
    }
    
    // Get updated likes count
    const updatedPhoto = await db.select({ likesCount: tripPhotos.likesCount })
      .from(tripPhotos)
      .where(eq(tripPhotos.id, photoId))
      .limit(1);
    
    return { liked, likesCount: updatedPhoto[0]?.likesCount || 0 };
  }

  async updateTripPhotoCaption(photoId: string, caption: string): Promise<TripPhoto> {
    await this.ensureInitialized();
    
    // Update the caption in the database
    const result = await db.update(tripPhotos)
      .set({ caption: caption || null })
      .where(eq(tripPhotos.id, photoId))
      .returning();
    
    if (result.length === 0) {
      throw new Error('Photo not found');
    }
    
    return result[0];
  }

  async deleteTripPhoto(photoId: string, deleteToken?: string): Promise<void> {
    await this.ensureInitialized();
    
    // Get photo to verify delete token if provided
    if (deleteToken) {
      const photo = await db.select({ deleteTokenHash: tripPhotos.deleteTokenHash })
        .from(tripPhotos)
        .where(eq(tripPhotos.id, photoId))
        .limit(1);
      
      if (photo.length === 0) {
        throw new Error('Photo not found');
      }
      
      if (photo[0].deleteTokenHash) {
        const providedHash = createHash('sha256').update(deleteToken).digest('hex');
        if (providedHash !== photo[0].deleteTokenHash) {
          throw new Error('Invalid delete token');
        }
      }
    }
    
    // Delete associated likes first
    await db.delete(tripPhotoLikes)
      .where(eq(tripPhotoLikes.tripPhotoId, photoId));
    
    // Delete the photo
    await db.delete(tripPhotos)
      .where(eq(tripPhotos.id, photoId));
  }

  async cleanupBrokenTripPhotos(): Promise<number> {
    await this.ensureInitialized();
    const result = await db.delete(tripPhotos)
      .where(isNull(tripPhotos.objectPath))
      .returning();
    
    console.log(`Cleaned up ${result.length} broken trip photos without objectPath`);
    return result.length;
  }

  // Tour settings
  async getTourSettings(): Promise<TourSettings | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(tourSettings).limit(1);
    return result[0];
  }

  async updateTourSettings(settings: Partial<InsertTourSettings>): Promise<TourSettings> {
    await this.ensureInitialized();
    
    // Check if settings exist
    const existing = await db.select().from(tourSettings).limit(1);
    
    if (existing.length === 0) {
      // Create new settings
      const result = await db.insert(tourSettings).values([settings as any]).returning();
      return result[0];
    } else {
      // Update existing settings
      const result = await db.update(tourSettings)
        .set({ ...settings, updatedAt: new Date() })
        .where(eq(tourSettings.id, existing[0].id))
        .returning();
      return result[0];
    }
  }

  // Location pings for live GPS tracking
  async addLocationPing(ping: InsertLocationPing): Promise<LocationPing> {
    await this.ensureInitialized();
    const result = await db.insert(locationPings).values(ping).returning();
    return result[0];
  }

  async getLatestLocationPing(): Promise<LocationPing | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(locationPings)
      .orderBy(desc(locationPings.timestamp))
      .limit(1);
    return result[0];
  }

  async getLocationPings(limit?: number): Promise<LocationPing[]> {
    await this.ensureInitialized();
    const query = db.select().from(locationPings).orderBy(desc(locationPings.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  // Hero images for homepage slideshow
  async getHeroImages(): Promise<HeroImage[]> {
    await this.ensureInitialized();
    const result = await db.select().from(heroImages)
      .orderBy(heroImages.sortOrder);
    return result;
  }

  async createHeroImage(heroImage: InsertHeroImage): Promise<HeroImage> {
    await this.ensureInitialized();
    const result = await db.insert(heroImages).values(heroImage).returning();
    return result[0];
  }

  async updateHeroImage(id: string, heroImage: Partial<InsertHeroImage>): Promise<HeroImage> {
    await this.ensureInitialized();
    const result = await db.update(heroImages)
      .set({ ...heroImage, updatedAt: new Date() })
      .where(eq(heroImages.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Hero image not found");
    }
    return result[0];
  }

  async deleteHeroImage(id: string): Promise<void> {
    await this.ensureInitialized();
    await db.delete(heroImages).where(eq(heroImages.id, id));
  }

  async reorderHeroImages(imageIds: string[]): Promise<void> {
    await this.ensureInitialized();
    for (let i = 0; i < imageIds.length; i++) {
      await db.update(heroImages)
        .set({ sortOrder: i, updatedAt: new Date() })
        .where(eq(heroImages.id, imageIds[i]));
    }
  }

  // Scenic content for "Spektakuläre Landschaften erwarten uns" section
  async getScenicContent(): Promise<ScenicContent | undefined> {
    await this.ensureInitialized();
    const result = await db.select().from(scenicContent)
      .where(eq(scenicContent.isActive, true))
      .limit(1);
    return result[0];
  }

  async updateScenicContent(data: Partial<InsertScenicContent>): Promise<ScenicContent> {
    await this.ensureInitialized();
    
    // Check if content exists
    const existing = await db.select().from(scenicContent).limit(1);
    
    if (existing.length === 0) {
      // Create new content
      const result = await db.insert(scenicContent).values([{
        title: data.title || 'Default Title',
        subtitle: data.subtitle || 'Default Subtitle',
        galleries: data.galleries || [],
        isActive: data.isActive ?? true,
      } as any]).returning();
      return result[0];
    } else {
      // Update existing content
      const updateData = { ...data, updatedAt: new Date() } as any;
      const result = await db.update(scenicContent)
        .set(updateData)
        .where(eq(scenicContent.id, existing[0].id))
        .returning();
      return result[0];
    }
  }

  // Creator operations
  async getAllCreators(): Promise<Creator[]> {
    await this.ensureInitialized();
    const result = await db.select().from(creators);
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }

  async createCreator(creator: InsertCreator): Promise<Creator> {
    await this.ensureInitialized();
    const result = await db.insert(creators).values(creator).returning();
    return result[0];
  }

  async updateCreator(id: string, creator: Partial<InsertCreator>): Promise<Creator> {
    await this.ensureInitialized();
    const result = await db.update(creators)
      .set(creator)
      .where(eq(creators.id, id))
      .returning();
    
    if (!result[0]) {
      throw new Error("Creator not found");
    }
    return result[0];
  }

  async deleteCreator(id: string): Promise<void> {
    await this.ensureInitialized();
    await db.delete(creators).where(eq(creators.id, id));
  }
}

export const storage = new DatabaseStorage();
