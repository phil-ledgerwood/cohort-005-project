import type { lessons } from "~/db/schema";
import type { RenderedComment } from "~/lib/comments";
import type { FlatLesson } from "~/modules/lesson-page/course.server";
import type { DenialReason } from "~/modules/permissions/course-permissions.server";

// Stated here rather than read from the route's `+types`: components never
// depend on a route. The route passes its loader data in, so `typecheck` still
// fails if the two drift apart.

type CourseSummary = { id: number; title: string; slug: string };

type CurriculumModule = {
  id: number;
  title: string;
  lessons: Array<{ id: number; title: string }>;
};

type LessonQuiz = {
  id: number;
  title: string;
  passingScore: number;
  questions: Array<{
    id: number;
    questionText: string;
    questionType: string;
    position: number;
    options: Array<{ id: number; optionText: string }>;
  }>;
};

export type LockedLessonData = {
  view: "locked";
  course: CourseSummary;
  curriculum: CurriculumModule[];
  module: { id: number; title: string };
  lesson: { id: number; title: string };
  enrolled: boolean;
  lockedReason: DenialReason;
};

export type FullLessonData = {
  view: "full";
  course: CourseSummary;
  curriculum: CurriculumModule[];
  module: { id: number; title: string };
  lesson: typeof lessons.$inferSelect;
  contentHtml: string | null;
  lessonStatus: string | null;
  enrolled: boolean;
  currentUserId: number | null;
  prevLesson: FlatLesson | null;
  nextLesson: FlatLesson | null;
  quiz: LessonQuiz | null;
  bestAttempt: { score: number; passed: boolean } | null;
  lastWatchPosition: number;
  watchProgress: number;
  lessonProgressMap: Record<number, string>;
  comments: RenderedComment[];
  canModerate: boolean;
  instructorName: string;
  bookmarked: boolean;
  note: { body: string; updatedAt: string } | null;
};
