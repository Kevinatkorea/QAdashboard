import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  unique,
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
  seats: many(seats),
  tasks: many(tasks),
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
    enum: ["pre_lecture", "new", "ai_answered", "instructor_answered"],
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

// ── Seats ──────────────────────────────────────────────────────────────────
export const seats = pgTable(
  "seats",
  {
    id: serial("id").primaryKey(),
    lectureId: integer("lecture_id")
      .notNull()
      .references(() => lectures.id),
    row: integer("row").notNull(),
    col: integer("col").notNull(),
    studentName: text("student_name"),
    handRaised: boolean("hand_raised").default(false),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (t) => [unique().on(t.lectureId, t.row, t.col)]
);

export const seatsRelations = relations(seats, ({ one, many }) => ({
  lecture: one(lectures, {
    fields: [seats.lectureId],
    references: [lectures.id],
  }),
  taskCompletions: many(taskCompletions),
}));

// ── Tasks ──────────────────────────────────────────────────────────────────
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  lectureId: integer("lecture_id")
    .notNull()
    .references(() => lectures.id),
  title: text("title").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  lecture: one(lectures, {
    fields: [tasks.lectureId],
    references: [lectures.id],
  }),
  taskCompletions: many(taskCompletions),
}));

// ── Task Completions ───────────────────────────────────────────────────────
export const taskCompletions = pgTable(
  "task_completions",
  {
    id: serial("id").primaryKey(),
    taskId: integer("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    seatId: integer("seat_id")
      .notNull()
      .references(() => seats.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at").defaultNow(),
  },
  (t) => [unique().on(t.taskId, t.seatId)]
);

export const taskCompletionsRelations = relations(
  taskCompletions,
  ({ one }) => ({
    task: one(tasks, {
      fields: [taskCompletions.taskId],
      references: [tasks.id],
    }),
    seat: one(seats, {
      fields: [taskCompletions.seatId],
      references: [seats.id],
    }),
  })
);

// ── Settings ────────────────────────────────────────────────────────────────
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  instructorPasswordHash: text("instructor_password_hash").notNull(),
  systemPrompt: text("system_prompt"),
});
