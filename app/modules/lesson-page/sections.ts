export type LessonSection =
  | "video"
  | "content"
  | "empty"
  | "quiz"
  | "note"
  | "completion"
  | "discussion"
  | "navigation";

export type LessonSectionsInput = {
  hasVideo: boolean;
  hasContent: boolean;
  hasQuiz: boolean;
  signedIn: boolean;
  enrolled: boolean;
};

/**
 * The sections of a lesson the person can see, top to bottom.
 *
 * The Note comes after the lesson's material — video, content, quiz — so the
 * lesson itself leads the page. It sits above "Up next", which marks the
 * lesson complete and leaves the page, so a Student can save before moving on.
 */
export function lessonSections({
  hasVideo,
  hasContent,
  hasQuiz,
  signedIn,
  enrolled,
}: LessonSectionsInput): LessonSection[] {
  const sections: LessonSection[] = [];
  if (hasVideo) sections.push("video");
  if (hasContent) sections.push("content");
  if (!hasVideo && !hasContent) sections.push("empty");
  if (hasQuiz && enrolled && signedIn) sections.push("quiz");
  if (signedIn) sections.push("note");
  if (enrolled && signedIn) sections.push("completion");
  sections.push("discussion", "navigation");
  return sections;
}
