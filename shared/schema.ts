import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
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

// Trip photos for live feed during tour
export const tripPhotos = pgTable("trip_photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  locationId: varchar("location_id").references(() => locations.id).notNull(),
  imageUrl: text("image_url").notNull(),
  caption: text("caption"),
  objectPath: text("object_path"), // for object storage
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  uploadedBy: text("uploaded_by"), // optional field for user identification
});

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

// Restaurant data type
export interface RestaurantData {
  name: string;
  description: string;
  cuisine?: string;
  websiteUrl?: string;
  imageUrl?: string;
}

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

export const insertTripPhotoSchema = createInsertSchema(tripPhotos).omit({
  id: true,
  uploadedAt: true,
});

export const insertTourSettingsSchema = createInsertSchema(tourSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertLocationPingSchema = createInsertSchema(locationPings).omit({
  id: true,
  createdAt: true,
});

export type Location = typeof locations.$inferSelect;
export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type LocationImage = typeof locationImages.$inferSelect;
export type InsertLocationImage = z.infer<typeof insertLocationImageSchema>;
export type TripPhoto = typeof tripPhotos.$inferSelect;
export type InsertTripPhoto = z.infer<typeof insertTripPhotoSchema>;
export type TourSettings = typeof tourSettings.$inferSelect;
export type InsertTourSettings = z.infer<typeof insertTourSettingsSchema>;
export type LocationPing = typeof locationPings.$inferSelect;
export type InsertLocationPing = z.infer<typeof insertLocationPingSchema>;
