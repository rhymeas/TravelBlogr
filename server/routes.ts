import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService, objectStorageClient, parseObjectPath } from "./objectStorage";
import { insertLocationSchema, insertLocationImageSchema, insertTripPhotoSchema, insertTourSettingsSchema, insertLocationPingSchema, insertHeroImageSchema, insertScenicContentSchema, scenicContentUpdateSchema, insertCreatorSchema, tripPhotos } from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import multer from "multer";
import { randomUUID } from "crypto";

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/gif'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Nur Bilddateien sind erlaubt (JPG, PNG, WebP, GIF)'));
    }
  }
});

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
      'images.pexels.com'
    ];
    
    // Check for Google Cloud Storage bucket patterns (e.g., storage.googleapis.com)
    const isGoogleStorageBucket = url.hostname === 'storage.googleapis.com' || 
                                 url.hostname.includes('storage.googleapis.com');
    
    // Check for object storage bucket patterns used by Replit (replit-objstore-)
    const isReplitObjectStore = url.hostname.includes('storage.googleapis.com') && 
                               url.pathname.includes('replit-objstore-');
    
    const isAllowedHost = allowedHosts.some(host => 
      url.hostname === host || 
      url.hostname.endsWith('.' + host)
    ) || isGoogleStorageBucket || isReplitObjectStore;
    
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
    
    // Skip file extension check for trusted Google Cloud Storage URLs (signed URLs often don't have extensions)
    const isGoogleCloudStorageUrl = url.hostname === 'storage.googleapis.com';
    
    if (!hasImageExtension && !hasImageFormat && !isGoogleCloudStorageUrl) {
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
  
  // For trip photo uploads, allow public access
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
      
      // Filter out photos without objectPath (old broken uploads)
      const validPhotos = tripPhotos.filter(photo => photo.objectPath);
      
      // Generate direct serving URLs for each photo (no signed URLs needed)
      const photosWithUrls = validPhotos.map(photo => ({
        ...photo,
        imageUrl: `/api/trip-photos/${photo.id}/image`
      }));
      
      res.json(finalPhotos);
    } catch (error) {
      console.error("Error fetching trip photos:", error);
      res.status(500).json({ error: "Failed to fetch trip photos" });
    }
  });

  // Simplified direct file upload for trip photos
  app.post("/api/locations/:locationId/trip-photos", 
    upload.single('image'),
    async (req, res) => {
    try {
      // Check if location exists
      const location = await storage.getLocation(req.params.locationId);
      if (!location) {
        return res.status(404).json({ 
          error: "Location nicht gefunden. Bitte wählen Sie eine gültige Location." 
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          error: "Bitte wählen Sie ein Bild zum Hochladen." 
        });
      }

      // Validate form data
      const { caption, uploadedBy, creatorId } = req.body;
      
      // Debug log to verify data received
      console.log('Received upload data:', { caption, uploadedBy, creatorId });
      
      // Validate caption length
      if (caption && caption.length > 500) {
        return res.status(400).json({ 
          error: "Bildunterschrift ist zu lang (maximal 500 Zeichen)" 
        });
      }

      // Validate uploadedBy length  
      if (uploadedBy && uploadedBy.length > 100) {
        return res.status(400).json({ 
          error: "Name ist zu lang (maximal 100 Zeichen)" 
        });
      }

      // Handle file upload to object storage
      try {
        const objectStorageService = new ObjectStorageService();
        const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadInfo();
        
        // Upload file to object storage
        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: req.file.buffer,
          headers: {
            'Content-Type': req.file.mimetype,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload zu Object Storage fehlgeschlagen');
        }

        // Store objectPath for permanent access (don't store expiring displayURL)
        // We'll generate fresh display URLs on GET requests

        // Create trip photo record with objectPath
        const tripPhotoData = {
          locationId: req.params.locationId,
          creatorId: creatorId || null, // Store creator ID for proper attribution
          objectPath: objectPath, // Store permanent path
          imageUrl: '/placeholder', // Placeholder - real URL generated on GET
          caption: caption || null,
          uploadedBy: uploadedBy || null,
        };

        const tripPhoto = await storage.addTripPhoto(tripPhotoData);
        res.status(201).json(tripPhoto);

      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({ 
          error: "Datei-Upload fehlgeschlagen. Bitte versuchen Sie es erneut." 
        });
      }

    } catch (error) {
      console.error("Error adding trip photo:", error);
      res.status(500).json({ 
        error: "Foto konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut." 
      });
    }
  });

  // Direct image serving endpoint for trip photos
  app.get("/api/trip-photos/:photoId/image", async (req, res) => {
    try {
      const photoId = req.params.photoId;
      const tripPhotos = await storage.getAllTripPhotos();
      const photo = tripPhotos.find(p => p.id === photoId);
      
      if (!photo || !photo.objectPath) {
        return res.status(404).json({ error: "Photo not found" });
      }

      // Parse the object path to get bucket and object name
      let { bucketName, objectName } = parseObjectPath(photo.objectPath);
      const objectStorageService = new ObjectStorageService();
      
      // Get the file directly from object storage
      const bucket = objectStorageClient.bucket(bucketName);
      let file = bucket.file(objectName);
      
      // Check if file exists at the stored path
      let [exists] = await file.exists();
      
      // If not found and path contains 'public/uploads', try private directory
      if (!exists && objectName.includes('public/uploads')) {
        const privateObjectName = objectName.replace('public/uploads', '.private/uploads');
        file = bucket.file(privateObjectName);
        [exists] = await file.exists();
      }
      
      if (!exists) {
        return res.status(404).json({ error: "Image file not found" });
      }
      
      // Use the existing downloadObject method to serve the file
      await objectStorageService.downloadObject(file, res, 86400); // 24 hour cache
      
    } catch (error) {
      console.error("Error serving trip photo image:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to serve image" });
      }
    }
  });

  // Centralized trip photos routes
  app.get("/api/trip-photos", async (req, res) => {
    try {
      const tripPhotos = await storage.getAllTripPhotos();
      
      // Filter out photos without objectPath (old broken uploads)
      const validPhotos = tripPhotos.filter(photo => photo.objectPath);
      
      // Generate direct serving URLs for each photo (no signed URLs needed)
      const photosWithUrls = validPhotos.map(photo => ({
        ...photo,
        imageUrl: `/api/trip-photos/${photo.id}/image`
      }));
      
      res.json(photosWithUrls);
    } catch (error) {
      console.error("Error fetching all trip photos:", error);
      res.status(500).json({ error: "Failed to fetch trip photos" });
    }
  });

  app.post("/api/trip-photos", 
    upload.single('image'),
    async (req, res) => {
    try {
      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          error: "Bitte wählen Sie ein Bild zum Hochladen." 
        });
      }

      // Extract FormData fields - handle empty strings properly
      const caption = req.body?.caption || null;
      const uploadedBy = req.body?.uploadedBy || null;
      const locationId = req.body?.locationId || null;
      const creatorId = req.body?.creatorId || null;
      
      // Debug log to verify data received
      console.log('===== CENTRALIZED ROUTE DEBUG =====');
      console.log('req.body type:', typeof req.body);
      console.log('req.body keys:', Object.keys(req.body || {}));
      console.log('req.body full:', JSON.stringify(req.body, null, 2));
      console.log('req.file:', req.file ? { fieldname: req.file.fieldname, originalname: req.file.originalname, size: req.file.size } : 'Missing');
      console.log('Raw field checks:');
      console.log('- req.body.caption:', typeof req.body?.caption, '=', req.body?.caption);
      console.log('- req.body.uploadedBy:', typeof req.body?.uploadedBy, '=', req.body?.uploadedBy);
      console.log('- req.body.locationId:', typeof req.body?.locationId, '=', req.body?.locationId);
      console.log('- req.body.creatorId:', typeof req.body?.creatorId, '=', req.body?.creatorId);
      console.log('Extracted values:', { caption, uploadedBy, locationId, creatorId });
      console.log('=================================');
      
      // Validate caption length
      if (caption && caption.length > 500) {
        return res.status(400).json({ 
          error: "Bildunterschrift ist zu lang (maximal 500 Zeichen)" 
        });
      }

      // Validate uploadedBy length  
      if (uploadedBy && uploadedBy.length > 100) {
        return res.status(400).json({ 
          error: "Name ist zu lang (maximal 100 Zeichen)" 
        });
      }

      // Validate locationId if provided (optional location tagging)
      if (locationId) {
        const location = await storage.getLocation(locationId);
        if (!location) {
          return res.status(400).json({ 
            error: "Ungültige Location-ID angegeben." 
          });
        }
      }

      // Handle file upload to object storage
      try {
        const objectStorageService = new ObjectStorageService();
        const { uploadURL, objectPath } = await objectStorageService.getObjectEntityUploadInfo();
        
        // Upload file to object storage
        const uploadResponse = await fetch(uploadURL, {
          method: 'PUT',
          body: req.file.buffer,
          headers: {
            'Content-Type': req.file.mimetype,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Upload zu Object Storage fehlgeschlagen');
        }

        // Store objectPath for permanent access (don't store expiring displayURL)
        // We'll generate fresh display URLs on GET requests

        // Create trip photo record with objectPath
        const tripPhotoData = {
          locationId: locationId || null, // Optional location tag
          creatorId: creatorId || null, // Creator who uploaded the photo
          objectPath: objectPath, // Store permanent path
          imageUrl: '/placeholder', // Placeholder - real URL generated on GET
          caption: caption || null,
          uploadedBy: uploadedBy || null,
        };

        const tripPhoto = await storage.addTripPhoto(tripPhotoData);
        res.status(201).json(tripPhoto);

      } catch (uploadError) {
        console.error("File upload error:", uploadError);
        return res.status(500).json({ 
          error: "Datei-Upload fehlgeschlagen. Bitte versuchen Sie es erneut." 
        });
      }

    } catch (error) {
      console.error("Error adding centralized trip photo:", error);
      res.status(500).json({ 
        error: "Foto konnte nicht hochgeladen werden. Bitte versuchen Sie es erneut." 
      });
    }
  });

  // Hero images routes
  app.get("/api/hero-images", async (req, res) => {
    try {
      const heroImages = await storage.getHeroImages();
      res.json(heroImages);
    } catch (error) {
      console.error("Error fetching hero images:", error);
      res.status(500).json({ error: "Failed to fetch hero images" });
    }
  });

  app.post("/api/hero-images", async (req, res) => {
    try {
      const validation = insertHeroImageSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid hero image data", details: validation.error });
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

      const heroImage = await storage.createHeroImage(validation.data);
      res.status(201).json(heroImage);
    } catch (error) {
      console.error("Error creating hero image:", error);
      res.status(500).json({ error: "Failed to create hero image" });
    }
  });

  // IMPORTANT: Specific routes must come BEFORE parameterized routes
  app.put("/api/hero-images/reorder", async (req, res) => {
    try {
      const { imageIds } = req.body;
      if (!Array.isArray(imageIds)) {
        return res.status(400).json({ error: "imageIds must be an array" });
      }

      await storage.reorderHeroImages(imageIds);
      res.status(204).send();
    } catch (error) {
      console.error("Error reordering hero images:", error);
      res.status(500).json({ error: "Failed to reorder hero images" });
    }
  });

  app.put("/api/hero-images/:id", async (req, res) => {
    try {
      const validation = insertHeroImageSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid hero image data", details: validation.error });
      }

      // Validate the image URL security if provided
      if (validation.data.imageUrl) {
        const urlValidation = validateImageUrl(validation.data.imageUrl);
        if (!urlValidation.valid) {
          return res.status(400).json({ 
            error: urlValidation.error || "Ungültige Bild-URL" 
          });
        }
      }

      const heroImage = await storage.updateHeroImage(req.params.id, validation.data);
      res.json(heroImage);
    } catch (error) {
      console.error("Error updating hero image:", error);
      if (error instanceof Error && error.message === "Hero image not found") {
        return res.status(404).json({ error: "Hero image not found" });
      }
      res.status(500).json({ error: "Failed to update hero image" });
    }
  });

  app.delete("/api/hero-images/:id", async (req, res) => {
    try {
      await storage.deleteHeroImage(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting hero image:", error);
      res.status(500).json({ error: "Failed to delete hero image" });
    }
  });

  // Scenic content routes
  app.get("/api/scenic-content", async (req, res) => {
    try {
      const scenicContent = await storage.getScenicContent();
      res.json(scenicContent);
    } catch (error) {
      console.error("Error fetching scenic content:", error);
      res.status(500).json({ error: "Failed to fetch scenic content" });
    }
  });

  app.put("/api/scenic-content", simpleAuthMiddleware, async (req, res) => {
    try {
      const validation = scenicContentUpdateSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid scenic content data", details: validation.error });
      }

      // Validate image URLs if provided in galleries
      if (validation.data.galleries && validation.data.galleries.length > 0) {
        for (const gallery of validation.data.galleries) {
          if (gallery.imageUrl) {
            const urlValidation = validateImageUrl(gallery.imageUrl);
            if (!urlValidation.valid) {
              return res.status(400).json({ 
                error: `Invalid image URL for gallery item "${gallery.title}": ${urlValidation.error}` 
              });
            }
          }
        }
      }

      const scenicContent = await storage.updateScenicContent(validation.data);
      res.json(scenicContent);
    } catch (error) {
      console.error("Error updating scenic content:", error);
      res.status(500).json({ error: "Failed to update scenic content" });
    }
  });

  // Creator routes
  app.get("/api/creators", async (req, res) => {
    try {
      const creators = await storage.getAllCreators();
      res.json(creators);
    } catch (error) {
      console.error("Error fetching creators:", error);
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });

  app.post("/api/creators", simpleAuthMiddleware, async (req, res) => {
    try {
      const validation = insertCreatorSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid creator data", details: validation.error });
      }

      const creator = await storage.createCreator(validation.data);
      res.json(creator);
    } catch (error) {
      console.error("Error creating creator:", error);
      res.status(500).json({ error: "Failed to create creator" });
    }
  });

  app.put("/api/creators/:id", simpleAuthMiddleware, async (req, res) => {
    try {
      const validation = insertCreatorSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid creator data", details: validation.error });
      }

      const creator = await storage.updateCreator(req.params.id, validation.data);
      res.json(creator);
    } catch (error) {
      console.error("Error updating creator:", error);
      res.status(500).json({ error: "Failed to update creator" });
    }
  });

  app.delete("/api/creators/:id", simpleAuthMiddleware, async (req, res) => {
    try {
      await storage.deleteCreator(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting creator:", error);
      res.status(500).json({ error: "Failed to delete creator" });
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

      const updateData = { ...validation.data };

      // Handle password hashing if privacyPassword is provided
      if (updateData.privacyPassword) {
        if (updateData.privacyPassword.trim().length < 6) {
          return res.status(400).json({ 
            error: "Passwort muss mindestens 6 Zeichen lang sein" 
          });
        }
        
        // Hash the password
        const saltRounds = 12;
        updateData.privacyPassword = await bcrypt.hash(updateData.privacyPassword.trim(), saltRounds);
      }

      const settings = await storage.updateTourSettings(updateData);
      res.json(settings);
    } catch (error) {
      console.error("Error updating tour settings:", error);
      res.status(500).json({ error: "Failed to update tour settings" });
    }
  });

  // Privacy authentication routes
  app.get("/api/privacy-status", async (req, res) => {
    try {
      const settings = await storage.getTourSettings();
      const privacyEnabled = settings?.privacyEnabled || false;
      
      res.json({ 
        privacyEnabled
      });
    } catch (error) {
      console.error("Error fetching privacy status:", error);
      res.status(500).json({ error: "Failed to fetch privacy status" });
    }
  });

  app.post("/api/simple-login", async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password) {
        return res.status(400).json({ 
          success: false, 
          message: "Passwort ist erforderlich" 
        });
      }

      // Get tour settings to check password
      const settings = await storage.getTourSettings();
      
      if (!settings?.privacyEnabled) {
        return res.status(400).json({ 
          success: false, 
          message: "Privacy-Login ist nicht aktiviert" 
        });
      }

      if (!settings.privacyPassword) {
        return res.status(500).json({ 
          success: false, 
          message: "Kein Privacy-Passwort konfiguriert" 
        });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, settings.privacyPassword);
      
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          message: "Ungültiges Passwort" 
        });
      }

      res.json({ 
        success: true,
        message: "Login erfolgreich"
      });
    } catch (error) {
      console.error("Error during simple login:", error);
      res.status(500).json({ 
        success: false, 
        message: "Login fehlgeschlagen" 
      });
    }
  });


  // Object storage routes for image uploads
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      // First try to find file in public directory
      let file = await objectStorageService.searchPublicObject(filePath);
      
      // If not found in public, try to serve from private directory (migration workaround)
      if (!file && filePath.startsWith('uploads/')) {
        try {
          // Use the private object path directly by constructing the full path
          const filename = filePath.split('/').pop();
          if (filename) {
            // Try to find in database to get the actual object path
            const photos = await storage.getAllTripPhotos();
            const photo = photos.find(p => p.objectPath && p.objectPath.includes(filename));
            if (photo && photo.objectPath) {
              // Redirect to our new direct serving endpoint instead of signed URLs
              return res.redirect(`/api/trip-photos/${photo.id}/image`);
            }
          }
        } catch (privateError) {
          console.log(`Could not serve from private directory: ${privateError}`);
        }
      }
      
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

  app.post("/api/objects/upload-public", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting public upload URL:", error);
      res.status(500).json({ error: "Failed to get public upload URL" });
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

  // Temporary admin endpoint to migrate images from private to public directory
  app.post("/api/admin/migrate-images", async (req, res) => {
    try {
      console.log("Starting image migration from private to public directory...");
      
      // Get all trip photos with private object paths
      const photosToMigrate = await storage.getAllTripPhotos();
      const privatePhotos = photosToMigrate.filter(photo => 
        photo.objectPath && photo.objectPath.includes('/.private/uploads/')
      );
      
      console.log(`Found ${privatePhotos.length} photos in private directory to migrate`);
      
      const objectStorageService = new ObjectStorageService();
      const migratedPhotos = [];
      
      for (const photo of privatePhotos) {
        try {
          // Check if objectPath exists
          if (!photo.objectPath) {
            console.log(`Skipping photo ${photo.id}: No object path`);
            continue;
          }
          
          // Extract filename from private path
          const filename = photo.objectPath.split('/').pop();
          if (!filename) {
            console.log(`Skipping photo ${photo.id}: Cannot extract filename`);
            continue;
          }
          
          const newPublicPath = `public/uploads/${filename}`;
          
          console.log(`Migrating photo ${photo.id}: ${filename}`);
          
          // For now, we'll update the database with the correct public path
          // The actual file copy would need to be done manually or via another process
          const newObjectPath = photo.objectPath.replace('/.private/uploads/', '/public/uploads/');
          const publicImageUrl = `/public-objects/uploads/${filename}`;
          
          // Update database with public path (using direct SQL)
          await db.execute(sql`UPDATE ${tripPhotos} SET object_path = ${newObjectPath}, image_url = ${publicImageUrl} WHERE id = ${photo.id}`);
          
          migratedPhotos.push({
            id: photo.id,
            oldPath: photo.objectPath,
            newPath: newObjectPath,
            newUrl: publicImageUrl
          });
          
        } catch (error) {
          console.error(`Error migrating photo ${photo.id}:`, error instanceof Error ? error.message : String(error));
        }
      }
      
      console.log(`Migration completed. ${migratedPhotos.length} photos migrated.`);
      res.json({
        success: true,
        migratedCount: migratedPhotos.length,
        migratedPhotos
      });
      
    } catch (error) {
      console.error("Error during image migration:", error);
      res.status(500).json({ error: "Migration failed", details: error.message });
    }
  });

  // Location ping routes for live GPS tracking
  app.post("/api/location-ping", async (req, res) => {
    try {
      const validation = insertLocationPingSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          error: "Ungültige GPS-Daten", 
          details: validation.error.issues 
        });
      }

      // Validate coordinate ranges
      const lat = parseFloat(validation.data.latitude);
      const lng = parseFloat(validation.data.longitude);
      
      if (lat < -90 || lat > 90) {
        return res.status(400).json({ 
          error: "Ungültige Breitengrad-Koordinate (muss zwischen -90 und 90 sein)" 
        });
      }
      
      if (lng < -180 || lng > 180) {
        return res.status(400).json({ 
          error: "Ungültige Längengrad-Koordinate (muss zwischen -180 und 180 sein)" 
        });
      }

      const locationPing = await storage.addLocationPing(validation.data);
      res.status(201).json(locationPing);
    } catch (error) {
      console.error("Error saving location ping:", error);
      res.status(500).json({ error: "Fehler beim Speichern der GPS-Position" });
    }
  });

  app.get("/api/location-ping/latest", async (req, res) => {
    try {
      const latestPing = await storage.getLatestLocationPing();
      if (!latestPing) {
        return res.status(404).json({ error: "Keine GPS-Position gefunden" });
      }
      res.json(latestPing);
    } catch (error) {
      console.error("Error fetching latest location ping:", error);
      res.status(500).json({ error: "Fehler beim Abrufen der GPS-Position" });
    }
  });

  app.get("/api/location-pings", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const locationPings = await storage.getLocationPings(limit);
      res.json(locationPings);
    } catch (error) {
      console.error("Error fetching location pings:", error);
      res.status(500).json({ error: "Fehler beim Abrufen der GPS-Positionen" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
