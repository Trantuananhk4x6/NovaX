import { pgTable, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk User ID
  email: text("email").notNull(),
  plan: text("plan").default("free"), // 'free' or 'pro'
  credits: integer("credits").default(100000), // Default 100k characters
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const customVoices = pgTable("custom_voices", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  modelPath: text("model_path"),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const generationHistory = pgTable("generation_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).notNull(),
  text: text("text").notNull(),
  audioUrl: text("audio_url").notNull(),
  voiceId: text("voice_id").notNull(),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
