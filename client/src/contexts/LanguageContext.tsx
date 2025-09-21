import { createContext, useContext, useState, ReactNode } from 'react';

type Language = 'de' | 'en';

interface Translations {
  [key: string]: {
    de: string;
    en: string;
  };
}

const translations: Translations = {
  // Header and Navigation
  'liveFeed': { de: 'Live Feed', en: 'Live Feed' },
  'homepage': { de: 'Startseite', en: 'Home' },
  'navItinerary': { de: 'Reiseverlauf', en: 'Itinerary' },
  'navEdit': { de: 'Editieren', en: 'Edit' },
  'language': { de: 'Sprache', en: 'Language' },
  
  // Home Page Stats
  'travelDays': { de: 'Reisetage', en: 'Travel Days' },
  'destinations': { de: 'Reiseziele', en: 'Destinations' },
  'kilometers': { de: 'Kilometer', en: 'Kilometers' },
  'memories': { de: 'Erinnerungen', en: 'Memories' },
  
  // Home Page Sections
  'ourItinerary': { de: 'Unser Reiseverlauf', en: 'Our Itinerary' },
  'itineraryDescription': { 
    de: 'Eine sorgfältig geplante Reise durch die schönsten Regionen Westkanadas', 
    en: 'A carefully planned journey through the most beautiful regions of Western Canada' 
  },
  'spectacularLandscapes': { de: 'Spektakuläre Landschaften erwarten uns', en: 'Spectacular Landscapes Await Us' },
  'landscapeDescription': { 
    de: 'Von den türkisfarbenen Seen des Okanagan-Tals bis zu den majestätischen Gipfeln der Rocky Mountains - jeder Ort ist ein Fotomotiv', 
    en: 'From the turquoise lakes of the Okanagan Valley to the majestic peaks of the Rocky Mountains - every place is a photo opportunity' 
  },
  'unforgettableJourney': { de: 'Eine unvergessliche Reise durch Westkanada', en: 'An unforgettable journey through Western Canada' },
  
  // Admin Forms
  'name': { de: 'Name', en: 'Name' },
  'slug': { de: 'URL-Slug', en: 'URL Slug' },
  'startDate': { de: 'Start-Datum', en: 'Start Date' },
  'endDate': { de: 'End-Datum', en: 'End Date' },
  'description': { de: 'Beschreibung', en: 'Description' },
  'distance': { de: 'Entfernung', en: 'Distance' },
  'save': { de: 'Speichern', en: 'Save' },
  'cancel': { de: 'Abbrechen', en: 'Cancel' },
  'edit': { de: 'Bearbeiten', en: 'Edit' },
  'delete': { de: 'Löschen', en: 'Delete' },
  
  // Location Details
  'locationAndMap': { de: 'Lage & Karte', en: 'Location & Map' },
  'about': { de: 'Über', en: 'About' },
  'activities': { de: 'Aktivitäten', en: 'Activities' },
  'restaurants': { de: 'Restaurants', en: 'Restaurants' },
  'culinary': { de: 'Kulinarik', en: 'Culinary' },
  'accommodation': { de: 'Unterkunft', en: 'Accommodation' },
  'amenities': { de: 'Ausstattung & Annehmlichkeiten', en: 'Amenities & Services' },
  'checkInTime': { de: 'Check-in Zeit', en: 'Check-in Time' },
  'checkOutTime': { de: 'Check-out Zeit', en: 'Check-out Time' },
  'includedServices': { de: 'Inklusive Leistungen', en: 'Included Services' },
  'highlights': { de: 'Highlights', en: 'Highlights' },
  'experiences': { de: 'Erlebnisse', en: 'Experiences' },
  'funFacts': { de: 'Wissenswertes & Fun Facts', en: 'Fun Facts & Trivia' },
  'didYouKnow': { de: 'Wussten Sie schon?', en: 'Did You Know?' },
  
  // Restaurant Management
  'addRestaurant': { de: 'Restaurant hinzufügen', en: 'Add Restaurant' },
  'noRestaurantsAdded': { de: 'Noch keine Restaurants hinzugefügt', en: 'No restaurants added yet' },
  'clickToAddRestaurant': { de: 'Klicken Sie auf "Restaurant hinzufügen" um zu starten', en: 'Click "Add Restaurant" to get started' },
  'restaurantName': { de: 'Restaurant Name', en: 'Restaurant Name' },
  'cuisine': { de: 'Küchenstil', en: 'Cuisine Style' },
  'websiteUrl': { de: 'Website URL', en: 'Website URL' },
  'accommodationWebsite': { de: 'Unterkunft Website', en: 'Accommodation Website' },
  'accommodationImage': { de: 'Unterkunft Bild', en: 'Accommodation Image' },
  'websiteLinkAdded': { de: 'Website-Link hinzugefügt', en: 'Website link added' },
  
  // Form Placeholders
  'experienceDescription': { de: 'Erlebnis beschreiben...', en: 'Describe experience...' },
  'highlight': { de: 'Highlight...', en: 'Highlight...' },
  'interestingFact': { de: 'Interessante Tatsache oder Fun Fact...', en: 'Interesting fact or fun fact...' },
  
  // Live Feed
  'shareNewPost': { de: 'Neuen Beitrag teilen', en: 'Share New Post' },
  'photo': { de: 'Foto', en: 'Photo' },
  'video': { de: 'Video', en: 'Video' },
  'imageUrl': { de: 'Bild-URL', en: 'Image URL' },
  'caption': { de: 'Bildunterschrift', en: 'Caption' },
  'upload': { de: 'Hochladen', en: 'Upload' },
  'selectFile': { de: 'Datei auswählen', en: 'Select File' },
  'liveTracking': { de: 'Live-Tracking', en: 'Live Tracking' },
  
  // Admin Panel
  'managePersons': { de: 'Personen verwalten', en: 'Manage People' },
  'manageLocation': { de: 'Ort verwalten', en: 'Manage Location' },
  'title': { de: 'Titel', en: 'Title' },
  'passwordRequired': { de: 'Passwort erforderlich', en: 'Password Required' },
  'password': { de: 'Passwort', en: 'Password' },
  'login': { de: 'Anmelden', en: 'Login' },
  
  // Navigation
  'next': { de: 'Nächste', en: 'Next' },
  'back': { de: 'Zurück', en: 'Back' },
  'morePages': { de: 'Mehr Seiten', en: 'More Pages' },
  
  // Date and Time
  'day': { de: 'Tag', en: 'Day' },
  'date': { de: 'Datum', en: 'Date' },
  'itinerary': { de: 'Reiseverlauf', en: 'Itinerary' },
  
  // 404 Page
  'pageNotFound': { de: '404 Seite nicht gefunden', en: '404 Page Not Found' },
  'pageNotFoundDescription': { de: 'Haben Sie vergessen, die Seite zum Router hinzuzufügen?', en: 'Did you forget to add the page to the router?' },
  
  // Media Upload
  'galleryImages': { de: 'Bilder-Galerie', en: 'Image Gallery' },
  
  // Error Messages (keeping some original German for multer)
  'onlyImageFilesAllowed': { de: 'Nur Bilddateien sind erlaubt (JPG, PNG, WebP, GIF)', en: 'Only image files are allowed (JPG, PNG, WebP, GIF)' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('de'); // German as default

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Translation missing for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}