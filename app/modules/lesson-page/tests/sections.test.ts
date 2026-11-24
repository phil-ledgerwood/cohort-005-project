import { describe, it, expect } from "vitest";
import { lessonSections } from "../sections";

const everything = {
  hasVideo: true,
  hasContent: true,
  hasQuiz: true,
  signedIn: true,
  enrolled: true,
};

describe("lessonSections", () => {
  it("puts the Note after the lesson's material and before moving on", () => {
    expect(lessonSections(everything)).toEqual([
      "video",
      "content",
      "quiz",
      "note",
      "completion",
      "discussion",
      "navigation",
    ]);
  });

  it("shows no Note to someone who is not signed in", () => {
    expect(lessonSections({ ...everything, signedIn: false })).toEqual([
      "video",
      "content",
      "discussion",
      "navigation",
    ]);
  });

  it("shows the Note but not the quiz or completion to a signed-in visitor who is not enrolled", () => {
    expect(lessonSections({ ...everything, enrolled: false })).toEqual([
      "video",
      "content",
      "note",
      "discussion",
      "navigation",
    ]);
  });

  it("leaves out the video, content and quiz when the lesson has none", () => {
    expect(
      lessonSections({
        ...everything,
        hasVideo: false,
        hasContent: true,
        hasQuiz: false,
      })
    ).toEqual(["content", "note", "completion", "discussion", "navigation"]);
  });

  it("shows the empty state in place of content when there is neither video nor content", () => {
    expect(
      lessonSections({ ...everything, hasVideo: false, hasContent: false })
    ).toEqual([
      "empty",
      "quiz",
      "note",
      "completion",
      "discussion",
      "navigation",
    ]);
  });

  it("shows no empty state for a video lesson without written content", () => {
    expect(lessonSections({ ...everything, hasContent: false })).toEqual([
      "video",
      "quiz",
      "note",
      "completion",
      "discussion",
      "navigation",
    ]);
  });
});
