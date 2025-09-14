import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { ObjectStorageService } from "./objectStorage";
import { insertLocationSchema, insertLocationImageSchema, insertTripPhotoSchema, insertTourSettingsSchema } from "@shared/schema";
import { z } from "zod";

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

  app.post("/api/locations/:locationId/trip-photos", async (req, res) => {
    try {
      const tripPhotoData = { ...req.body, locationId: req.params.locationId };
      const validation = insertTripPhotoSchema.safeParse(tripPhotoData);
      if (!validation.success) {
        return res.status(400).json({ error: "Invalid trip photo data", details: validation.error });
      }

      const tripPhoto = await storage.addTripPhoto(validation.data);
      res.status(201).json(tripPhoto);
    } catch (error) {
      console.error("Error adding trip photo:", error);
      res.status(500).json({ error: "Failed to add trip photo" });
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
