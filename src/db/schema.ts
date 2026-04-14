import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Lectures ────────────────────────────────────────────────────────────────
export const lectures = pgTable("lectures", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  transcript: text("transcript"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const lecturesRelations = relations(lectures, ({ many }) => ({
  questions: many(questions),
  insights: many(insights),
}));

// ── Questions ───────────────────────────────────────────────────────────────
export const questions = pgTable("questions", {
  id: serial("id").primaryKey(),
  lectureId: integer("lecture_id")
    .notNull()
    .references(() => lectures.id),
  authorName: text("author_name").notNull(),
  content: text("content").notNull(),
  passwordHash: text("password_hash").notNull(),
  status: text("status", {
    enum: ["new", "ai_answered", "instructor_answered"],
  }).default("new"),
  isImportant: boolean("is_important").default(false),
  aiAnswer: text("ai_answer"),
  instructorAnswer: text("instructor_answer"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const questionsRelations = relations(questions, ({ one }) => ({
  lecture: one(lectures, {
    fields: [questions.lectureId],
    references: [lectures.id],
  }),
}));

// ── Insights ────────────────────────────────────────────────────────────────
export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  lectureId: integer("lecture_id")
    .notNull()
    .references(() => lectures.id),
  content: text("content").notNull(),
  sourceQuestionIds: text("source_question_ids").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insightsRelations = relations(insights, ({ one }) => ({
  lecture: one(lectures, {
    fields: [insights.lectureId],
    references: [lectures.id],
  }),
}));

// ── Settings ────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  instructorPasswordHash: text("instructor_password_hash").notNull(),
  systemPrompt: text("system_prompt"),
});
