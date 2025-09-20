import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean, uniqueIndex } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Locations table for storing tour destinations
export const locations = pgTable("locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  description: text("description").notNull(),
  accommodation: text("accommodation"),
  accommodationWebsite: text("accommodation_website"),
  accommodationImageUrl: text("accommodation_image_url"),
  accommodationPrice: integer("accommodation_price"),
  accommodationCurrency: text("accommodation_currency").default("CAD"),
  accommodationInclusiveServices: jsonb("accommodation_inclusive_services").$type<string[]>().default([]),
  accommodationAmenities: jsonb("accommodation_amenities").$type<string[]>().default([]),
  accommodationCheckinTime: text("accommodation_checkin_time"),
  accommodationCheckoutTime: text("accommodation_checkout_time"),
  distance: integer("distance"), // km from previous location
  imageUrl: text("image_url"),
  mapImageUrl: text("map_image_url"), // Map screenshot/snippet for location
  coordinates: jsonb("coordinates").$type<{ lat: number; lng: number }>(),
  activities: jsonb("activities").$type<string[]>().default([]),
  restaurants: jsonb("restaurants").$type<RestaurantData[]>().default([]),
  experiences: jsonb("experiences").$type<string[]>().default([]),
  highlights: jsonb("highlights").$type<string[]>().default([]),
  funFacts: jsonb("fun_facts").$type<string[]>().default([]),
  routeHighlights: jsonb("route_highlights").$type<string[]>().default([]), // Along the way stops and attractions
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Images table for location galleries
export const locationImages = pgTable("location_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  isMain: boolean("is_main").default(false),
  objectPath: text("object_path"), // for object storage
  createdAt: timestamp("created_at").defaultNow(),
});

// Creators for tracking who uploads content
export const creators = pgTable("creators", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Trip photos for centralized live feed during tour
export const tripPhotos = pgTable("trip_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id), // optional location tag
  creatorId: varchar("creator_id").references(() => creators.id, { onDelete: "set null" }), // who uploaded this photo
  imageUrl: text("image_url").notNull(), // Required - for images and video thumbnails
  caption: text("caption"),
  objectPath: text("object_path"), // for object storage
  mediaType: text("media_type").notNull().default("image"), // 'image' or 'video'
  videoUrl: text("video_url"), // for video posts
  thumbnailUrl: text("thumbnail_url"), // video thumbnail (also stored in imageUrl for compatibility)
  deleteTokenHash: text("delete_token_hash"), // hashed delete token for secure deletion
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: text("uploaded_by"), // deprecated - kept for backward compatibility
  likesCount: integer("likes_count").default(0), // denormalized likes count for performance
});

// Likes for trip photos
export const tripPhotoLikes = pgTable("trip_photo_likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tripPhotoId: varchar("trip_photo_id").references(() => tripPhotos.id, { onDelete: "cascade" }).notNull(),
  creatorId: varchar("creator_id").references(() => creators.id, { onDelete: "cascade" }), // optional: track who liked
  userIdentifier: text("user_identifier"), // fallback for anonymous likes (IP, session, etc.)
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => ({
  // Prevent duplicate likes from same user on same photo
  uniqueLike: uniqueIndex("unique_trip_photo_like").on(table.tripPhotoId, table.creatorId, table.userIdentifier),
}));

// Tour settings for general configuration
export const tourSettings = pgTable("tour_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tourName: text("tour_name").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  totalDistance: integer("total_distance"),
  totalCost: integer("total_cost"),
  currency: text("currency").default("CAD"),
  heroImageUrl: text("hero_image_url"),
  description: text("description"),
  // Privacy settings
  privacyEnabled: boolean("privacy_enabled").default(false),
  privacyPassword: text("privacy_password"), // hashed password
  sessionTimeout: integer("session_timeout").default(10080), // default 7 days in minutes
  // GPS settings
  gpsActivatedByAdmin: boolean("gps_activated_by_admin").default(false),
  gpsUpdateInterval: integer("gps_update_interval").default(30), // GPS update interval in seconds
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Location pings for live GPS tracking
export const locationPings = pgTable("location_pings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  latitude: text("latitude").notNull(), // Store as text for precision
  longitude: text("longitude").notNull(), // Store as text for precision
  accuracy: integer("accuracy"), // GPS accuracy in meters
  deviceId: text("device_id"), // Optional device/session identifier
  timestamp: timestamp("timestamp").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Hero images for slideshow on homepage
export const heroImages = pgTable("hero_images", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  imageUrl: text("image_url").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  objectPath: text("object_path"), // for object storage
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Scenic content for "Spektakuläre Landschaften erwarten uns" section
export const scenicContent = pgTable("scenic_content", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  subtitle: text("subtitle").notNull(),
  galleries: jsonb("galleries").$type<ScenicGalleryItem[]>().notNull().default([]),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Restaurant data type
export interface RestaurantData {
  name: string;
  description: string;
  cuisine?: string;
  websiteUrl?: string;
  imageUrl?: string;
}

// Scenic gallery item type
export interface ScenicGalleryItem {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl?: string;
  isLarge: boolean; // For the 2x2 main card
  order: number;
}

// Scenic Gallery Item Validation Schema
export const scenicGalleryItemSchema = z.object({
  id: z.string().min(1, "Gallery-ID ist erforderlich"),
  title: z.string().min(1, "Titel ist erforderlich").max(100, "Titel ist zu lang (maximal 100 Zeichen)"),
  description: z.string().min(1, "Beschreibung ist erforderlich").max(500, "Beschreibung ist zu lang (maximal 500 Zeichen)"),
  imageUrl: z.string().url("Ungültige Bild-URL"),
  linkUrl: z.string().url("Ungültige Link-URL").optional().or(z.literal("")).or(z.null()),
  isLarge: z.boolean(),
  order: z.number().int().min(0, "Reihenfolge muss eine positive Zahl sein").max(10, "Reihenfolge zu hoch"),
});

// Scenic Content Update Schema with strict validation
export const scenicContentUpdateSchema = z.object({
  title: z.string().min(1, "Titel ist erforderlich").max(200, "Titel ist zu lang (maximal 200 Zeichen)"),
  subtitle: z.string().min(1, "Untertitel ist erforderlich").max(300, "Untertitel ist zu lang (maximal 300 Zeichen)"),
  galleries: z.array(scenicGalleryItemSchema)
    .length(6, "Genau 6 Galerie-Elemente sind erforderlich")
    .refine(
      (galleries) => galleries.filter(g => g.isLarge).length === 1,
      "Genau ein großes Galerie-Element ist erforderlich"
    )
    .refine(
      (galleries) => {
        const orders = galleries.map(g => g.order);
        return new Set(orders).size === orders.length;
      },
      "Alle Galerie-Elemente müssen eindeutige Reihenfolge-Nummern haben"
    ),
  isActive: z.boolean().optional(),
});

// Restaurant data validation schema
export const restaurantDataSchema = z.object({
  name: z.string().min(1, "Restaurant-Name ist erforderlich").max(100, "Name ist zu lang"),
  description: z.string().min(1, "Beschreibung ist erforderlich").max(500, "Beschreibung ist zu lang"),
  cuisine: z.string().max(50, "Küchen-Typ ist zu lang").optional(),
  websiteUrl: z.string().url("Ungültige Website-URL").optional().or(z.literal("")).or(z.null()),
  imageUrl: z.string().url("Ungültige Bild-URL").optional().or(z.literal("")).or(z.null()),
});

// Schema exports
export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLocationImageSchema = createInsertSchema(locationImages).omit({
  id: true,
  createdAt: true,
});

export const insertCreatorSchema = createInsertSchema(creators).omit({
  id: true,
  createdAt: true,
});

export const insertTripPhotoSchema = createInsertSchema(tripPhotos).omit({
  id: true,
  uploadedAt: true,
  likesCount: true, // Let server handle likes count
  deleteTokenHash: true, // Let server handle delete token
});

export const insertTourSettingsSchema = createInsertSchema(tourSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertLocationPingSchema = createInsertSchema(locationPings).omit({
  id: true,
  createdAt: true,
});

export const insertHeroImageSchema = createInsertSchema(heroImages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertScenicContentSchema = createInsertSchema(scenicContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTripPhotoLikeSchema = createInsertSchema(tripPhotoLikes).omit({
  id: true,
  createdAt: true,
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type LocationImage = typeof locationImages.$inferSelect;
export type InsertLocationImage = z.infer<typeof insertLocationImageSchema>;
export type Creator = typeof creators.$inferSelect;
export type InsertCreator = z.infer<typeof insertCreatorSchema>;
export type TripPhoto = typeof tripPhotos.$inferSelect;
export type InsertTripPhoto = z.infer<typeof insertTripPhotoSchema>;
export type TripPhotoLike = typeof tripPhotoLikes.$inferSelect;
export type InsertTripPhotoLike = z.infer<typeof insertTripPhotoLikeSchema>;
export type TourSettings = typeof tourSettings.$inferSelect;
export type InsertTourSettings = z.infer<typeof insertTourSettingsSchema>;
export type LocationPing = typeof locationPings.$inferSelect;
export type InsertLocationPing = z.infer<typeof insertLocationPingSchema>;
export type HeroImage = typeof heroImages.$inferSelect;
export type InsertHeroImage = z.infer<typeof insertHeroImageSchema>;
export type ScenicContent = typeof scenicContent.$inferSelect;
export type InsertScenicContent = z.infer<typeof insertScenicContentSchema>;
