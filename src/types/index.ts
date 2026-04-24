export interface Question {
  id: number;
  lectureId: number;
  authorName: string;
  content: string;
  passwordHash: string;
  status: "pre_lecture" | "new" | "ai_answered" | "instructor_answered" | null;
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

export interface LectureAttachment {
  id: number;
  lectureId: number;
  fileName: string;
  fileUrl: string;
  blobPathname: string;
  fileSize: number;
  mimeType: string | null;
  createdAt: Date | string | null;
}

export interface Insight {
  id: number;
  lectureId: number;
  content: string;
  sourceQuestionIds: string;
  createdAt: Date | string | null;
}

export interface Seat {
  id: number;
  lectureId: number;
  row: number;
  col: number;
  studentName: string | null;
  handRaised: boolean | null;
  updatedAt: Date | string | null;
}

export interface Task {
  id: number;
  lectureId: number;
  title: string;
  description: string | null;
  sortOrder: number | null;
  createdAt: Date | string | null;
}

export interface TaskCompletion {
  id: number;
  taskId: number;
  seatId: number;
  completedAt: Date | string | null;
}

export interface SeatWithProgress extends Seat {
  completedTaskIds: number[];
}
