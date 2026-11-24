import { describe, it, expect } from "vitest";
import { describeNoteEditor } from "../index";
import { MAX_NOTE_LENGTH } from "~/lib/notes";

const saved = {
  body: "Generics keep the type",
  updatedAt: "2026-11-20T10:00:00.000Z",
};

describe("describeNoteEditor", () => {
  it("is empty, and cannot save, before the Student writes anything", () => {
    const state = describeNoteEditor({ draft: "", saved: null, saving: false });
    expect(state.status).toEqual({ kind: "empty" });
    expect(state.canSave).toBe(false);
    expect(state.length).toBe(0);
    expect(state.maxLength).toBe(MAX_NOTE_LENGTH);
  });

  it("treats whitespace alone as nothing to save", () => {
    const state = describeNoteEditor({
      draft: "  \n ",
      saved: null,
      saving: false,
    });
    expect(state.status).toEqual({ kind: "empty" });
    expect(state.canSave).toBe(false);
  });

  it("flags a new draft as unsaved and lets the Student save it", () => {
    const state = describeNoteEditor({
      draft: "First thought",
      saved: null,
      saving: false,
    });
    expect(state.status).toEqual({ kind: "unsaved" });
    expect(state.canSave).toBe(true);
    expect(state.length).toBe("First thought".length);
  });

  it("shows when the saved Note was last edited while the draft matches it", () => {
    const state = describeNoteEditor({
      draft: saved.body,
      saved,
      saving: false,
    });
    expect(state.status).toEqual({ kind: "saved", updatedAt: saved.updatedAt });
    expect(state.canSave).toBe(false);
  });

  it("ignores surrounding whitespace when comparing with the saved Note", () => {
    const state = describeNoteEditor({
      draft: `${saved.body}\n`,
      saved,
      saving: false,
    });
    expect(state.status.kind).toBe("saved");
    expect(state.length).toBe(saved.body.length);
  });

  it("flags an edit to the saved Note as unsaved", () => {
    const state = describeNoteEditor({
      draft: `${saved.body}!`,
      saved,
      saving: false,
    });
    expect(state.status).toEqual({ kind: "unsaved" });
    expect(state.canSave).toBe(true);
  });

  it("does not offer to save a cleared Note", () => {
    const state = describeNoteEditor({ draft: "", saved, saving: false });
    expect(state.status).toEqual({ kind: "unsaved" });
    expect(state.canSave).toBe(false);
  });

  it("says how far over the limit a draft is, and blocks saving it", () => {
    const draft = "a".repeat(MAX_NOTE_LENGTH + 3);
    const state = describeNoteEditor({
      draft,
      saved: null,
      saving: false,
      error: "x",
    });
    expect(state.status).toEqual({ kind: "too-long", over: 3 });
    expect(state.canSave).toBe(false);
  });

  it("allows a draft of exactly the limit", () => {
    const draft = "a".repeat(MAX_NOTE_LENGTH);
    const state = describeNoteEditor({ draft, saved: null, saving: false });
    expect(state.status).toEqual({ kind: "unsaved" });
    expect(state.canSave).toBe(true);
  });

  it("reports saving, and blocks a second save, while one is in flight", () => {
    const state = describeNoteEditor({
      draft: "Draft",
      saved: null,
      saving: true,
      error: "x",
    });
    expect(state.status).toEqual({ kind: "saving" });
    expect(state.canSave).toBe(false);
  });

  it("shows the error from a failed save", () => {
    const state = describeNoteEditor({
      draft: "Draft",
      saved: null,
      saving: false,
      error: "Nope",
    });
    expect(state.status).toEqual({ kind: "error", message: "Nope" });
    expect(state.canSave).toBe(true);
  });
});
