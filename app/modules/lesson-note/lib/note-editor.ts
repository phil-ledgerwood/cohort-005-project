import { MAX_NOTE_LENGTH } from "~/lib/notes";

export type NoteEditorInput = {
  /** What is in the textarea now. */
  draft: string;
  /** The saved Note, or null when the Student has not written one. */
  saved: { body: string; updatedAt: string } | null;
  saving: boolean;
  /** The error from the last save attempt, if it failed. */
  error?: string;
};

export type NoteEditorStatus =
  | { kind: "saving" }
  | { kind: "error"; message: string }
  | { kind: "too-long"; over: number }
  | { kind: "unsaved" }
  | { kind: "saved"; updatedAt: string }
  | { kind: "empty" };

export type NoteEditorState = {
  status: NoteEditorStatus;
  length: number;
  maxLength: number;
  canSave: boolean;
};

// The server trims before it stores, so a trailing newline is not a change.
function measure(draft: string) {
  return draft.trim();
}

export function describeNoteEditor(input: NoteEditorInput): NoteEditorState {
  const body = measure(input.draft);
  const length = body.length;
  const changed = body !== (input.saved?.body ?? "");
  const tooLong = length > MAX_NOTE_LENGTH;
  const canSave = !input.saving && changed && length > 0 && !tooLong;

  return {
    status: statusOf(input, { length, changed, tooLong }),
    length,
    maxLength: MAX_NOTE_LENGTH,
    canSave,
  };
}

function statusOf(
  input: NoteEditorInput,
  draft: { length: number; changed: boolean; tooLong: boolean }
): NoteEditorStatus {
  if (input.saving) return { kind: "saving" };
  if (draft.tooLong) {
    return { kind: "too-long", over: draft.length - MAX_NOTE_LENGTH };
  }
  if (input.error) return { kind: "error", message: input.error };
  if (draft.changed) return { kind: "unsaved" };
  if (input.saved) return { kind: "saved", updatedAt: input.saved.updatedAt };
  return { kind: "empty" };
}
