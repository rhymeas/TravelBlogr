import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { insertLocationSchema, insertLocationImageSchema, insertTripPhotoSchema, insertTourSettingsSchema } from "@shared/schema";
import { z } from "zod";

// Rate limiting storage for IP tracking
const rateLimitStorage = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10; // max 10 requests per minute

// Security middleware for trip photo uploads
function rateLimitMiddleware(req: any, res: any, next: any) {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  // Clean expired entries
  const expiredIPs: string[] = [];
  rateLimitStorage.forEach((data, ip) => {
    if (now > data.resetTime) {
      expiredIPs.push(ip);
    }
  });
  expiredIPs.forEach(ip => rateLimitStorage.delete(ip));
  
  // Check current IP
  const current = rateLimitStorage.get(clientIP);
  if (!current) {
    rateLimitStorage.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return res.status(429).json({
      error: "Zu viele Anfragen. Bitte warten Sie eine Minute bevor Sie erneut versuchen."
    });
  }
  
  current.count++;
  next();
}

// Validate image URL security
function validateImageUrl(imageUrl: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(imageUrl);
    
    // Only allow HTTPS URLs
    if (url.protocol !== 'https:') {
      return { valid: false, error: "Nur HTTPS URLs sind erlaubt" };
    }
    
    // Allow specific trusted hostnames
    const allowedHosts = [
      'storage.googleapis.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'cdn.pixabay.com',
      'images.pexels.com',
      // Add Google Cloud Storage bucket hostname pattern
      'repl-default-bucket'
    ];
    
    const isAllowedHost = allowedHosts.some(host => 
      url.hostname === host || 
      url.hostname.endsWith('.' + host) ||
      url.hostname.includes(host) // For bucket names in GCS
    );
    
    if (!isAllowedHost) {
      return { valid: false, error: "Bild-Host ist nicht erlaubt" };
    }
    
    // Check for image file extensions or query parameters that indicate images
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasImageExtension = imageExtensions.some(ext => 
      url.pathname.toLowerCase().includes(ext)
    );
    
    // For some services like Unsplash, check query parameters
    const hasImageFormat = url.searchParams.get('fm') || url.pathname.includes('photo');
    
    if (!hasImageExtension && !hasImageFormat) {
      return { valid: false, error: "Nur Bilddateien sind erlaubt (jpg, png, webp, gif)" };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: "Ungültige URL" };
  }
}

// Simple auth validation for sensitive operations
function simpleAuthMiddleware(req: any, res: any, next: any) {
  const adminToken = req.headers['admin-token'];
  const authHeader = req.headers.authorization;
  
  // Allow requests with admin token
  if (adminToken === process.env.ADMIN_TOKEN && process.env.ADMIN_TOKEN) {
    return next();
  }
  
  // Allow requests with basic auth (for admin panel)
  if (authHeader && authHeader.startsWith('Basic ')) {
    // For now, allow any basic auth - in production, validate credentials
    return next();
  }
  
  // For trip photo uploads, allow public access but with rate limiting
  // In production, you might want to require some form of authentication
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Location routes
  app.get("/api/locations", async (req, res) => {
    try {
      const locations = await storage.getLocations();
      res.json(locations);
    } catch (error) {
      console.error("Error fetching locations:", error);
      res.status(500).json({ error: "Failed to fetch locations" });
    }
  });

  app.get("/api/locations/:slug", async (req, res) => {
    try {
      const location = await storage.getLocationBySlug(req.params.slug);
      if (!location) {
        return res.status(404).json({ error: "Location not found" });
      }
      res.json(location);
    } catch (error) {
      console.error("Error fetching location:", error);
      res.status(500).json({ error: "Failed to fetch location" });
    }
  });

  app.post("/api/locations", async (req, res) => {
    try {
      const validation = insertLocationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid location data", details: validation.error });
      }
      
      const location = await storage.createLocation(validation.data);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating location:", error);
      res.status(500).json({ error: "Failed to create location" });
    }
  });

  app.put("/api/locations/:id", async (req, res) => {
    try {
      const validation = insertLocationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid location data", details: validation.error });
      }

      const location = await storage.updateLocation(req.params.id, validation.data);
      res.json(location);
    } catch (error) {
      console.error("Error updating location:", error);
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.delete("/api/locations/:id", async (req, res) => {
    try {
      await storage.deleteLocation(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting location:", error);
      res.status(500).json({ error: "Failed to delete location" });
    }
  });

  // Location images routes
  app.get("/api/locations/:locationId/images", async (req, res) => {
    try {
      const images = await storage.getLocationImages(req.params.locationId);
      res.json(images);
    } catch (error) {
      console.error("Error fetching location images:", error);
      res.status(500).json({ error: "Failed to fetch images" });
    }
  });

  app.post("/api/locations/:locationId/images", async (req, res) => {
    try {
      const imageData = { ...req.body, locationId: req.params.locationId };
      const validation = insertLocationImageSchema.safeParse(imageData);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid image data", details: validation.error });
      }

      const image = await storage.addLocationImage(validation.data);
      res.status(201).json(image);
    } catch (error) {
      console.error("Error adding location image:", error);
      res.status(500).json({ error: "Failed to add image" });
    }
  });

  app.delete("/api/locations/:locationId/images/:imageId", async (req, res) => {
    try {
      await storage.deleteLocationImage(req.params.imageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting image:", error);
      res.status(500).json({ error: "Failed to delete image" });
    }
  });

  app.put("/api/locations/:locationId/images/:imageId/main", async (req, res) => {
    try {
      await storage.setMainImage(req.params.locationId, req.params.imageId);
      res.status(204).send();
    } catch (error) {
      console.error("Error setting main image:", error);
      res.status(500).json({ error: "Failed to set main image" });
    }
  });

  // Trip photos routes
  app.get("/api/locations/:locationId/trip-photos", async (req, res) => {
    try {
      const tripPhotos = await storage.getTripPhotos(req.params.locationId);
      res.json(tripPhotos);
    } catch (error) {
      console.error("Error fetching trip photos:", error);
      res.status(500).json({ error: "Failed to fetch trip photos" });
    }
  });

  app.post("/api/locations/:locationId/trip-photos", 
    rateLimitMiddleware, 
    simpleAuthMiddleware, 
    async (req, res) => {
    try {
      // First check if location exists
      const location = await storage.getLocation(req.params.locationId);
      if (!location) {
        return res.status(404).json({ 
          error: "Location nicht gefunden. Bitte wählen Sie eine gültige Location." 
        });
      }

      // Validate the basic schema first
      const tripPhotoData = { ...req.body, locationId: req.params.locationId };
      const validation = insertTripPhotoSchema.safeParse(tripPhotoData);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Ungültige Foto-Daten", 
          details: validation.error.errors.map(e => e.message).join(", ")
        });
      }

      // Validate the image URL security
      if (validation.data.imageUrl) {
        const urlValidation = validateImageUrl(validation.data.imageUrl);
        if (!urlValidation.valid) {
          return res.status(400).json({ 
            error: urlValidation.error || "Ungültige Bild-URL" 
          });
        }
      }

      // Additional validation for required fields
      if (!validation.data.imageUrl) {
        return res.status(400).json({ 
          error: "Bild-URL ist erforderlich" 
        });
      }

      // Validate caption length (prevent very long captions)
      if (validation.data.caption && validation.data.caption.length > 500) {
        return res.status(400).json({ 
          error: "Bildunterschrift ist zu lang (maximal 500 Zeichen)" 
        });
      }

      // Validate uploadedBy length if provided
      if (validation.data.uploadedBy && validation.data.uploadedBy.length > 100) {
        return res.status(400).json({ 
          error: "Name ist zu lang (maximal 100 Zeichen)" 
        });
      }

      const tripPhoto = await storage.addTripPhoto(validation.data);
      res.status(201).json(tripPhoto);
    } catch (error) {
      console.error("Error adding trip photo:", error);
      res.status(500).json({ 
        error: "Foto konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut." 
      });
    }
  });

  // Tour settings routes
  app.get("/api/tour-settings", async (req, res) => {
    try {
      const settings = await storage.getTourSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching tour settings:", error);
      res.status(500).json({ error: "Failed to fetch tour settings" });
    }
  });

  app.put("/api/tour-settings", async (req, res) => {
    try {
      const validation = insertTourSettingsSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid settings data", details: validation.error });
      }

      const settings = await storage.updateTourSettings(validation.data);
      res.json(settings);
    } catch (error) {
      console.error("Error updating tour settings:", error);
      res.status(500).json({ error: "Failed to update tour settings" });
    }
  });

  // Object storage routes for image uploads
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  app.post("/api/objects/normalize", async (req, res) => {
    if (!req.body.imageURL) {
      return res.status(400).json({ error: "imageURL is required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.imageURL);
      
      // For direct uploads, the image URL is already public-accessible
      // We return the original URL as publicURL since it's already accessible
      res.json({
        objectPath: objectPath,
        publicURL: req.body.imageURL
      });
    } catch (error) {
      console.error("Error normalizing object path:", error);
      res.status(500).json({ error: "Failed to normalize object path" });
    }
  });

  app.put("/api/location-images", async (req, res) => {
    if (!req.body.imageURL || !req.body.locationId) {
      return res.status(400).json({ error: "imageURL and locationId are required" });
    }

    try {
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(req.body.imageURL);

      // Add image to location
      const image = await storage.addLocationImage({
        locationId: req.body.locationId,
        imageUrl: req.body.imageURL,
        objectPath: objectPath,
        caption: req.body.caption || "",
        isMain: req.body.isMain || false,
      });

      res.status(200).json({
        objectPath: objectPath,
        image: image
      });
    } catch (error) {
      console.error("Error setting location image:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
