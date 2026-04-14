export interface Question {
  id: number;
  lectureId: number;
  authorName: string;
  content: string;
  passwordHash: string;
  status: "new" | "ai_answered" | "instructor_answered" | null;
  isImportant: boolean | null;
  aiAnswer: string | null;
  instructorAnswer: string | null;
  createdAt: Date | string | null;
  updatedAt: Date | string | null;
}

export interface Lecture {
  id: number;
  title: string;
  transcript: string | null;
  createdAt: Date | string | null;
}

export interface Insight {
  id: number;
  lectureId: number;
  content: string;
  sourceQuestionIds: string;
  createdAt: Date | string | null;
}
