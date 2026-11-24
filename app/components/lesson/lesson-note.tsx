import { useState } from "react";
import { Link, useFetcher } from "react-router";
import { NotebookPen } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Textarea } from "~/components/ui/textarea";
import { cn, formatRelativeTime } from "~/lib/utils";
import {
  describeNoteEditor,
  type NoteEditorState,
  type NoteEditorStatus,
} from "~/modules/lesson-note";

export function LessonNote({
  note,
}: {
  note: { body: string; updatedAt: string } | null;
}) {
  const fetcher = useFetcher<{ ok: boolean; error?: string }>();
  const [draft, setDraft] = useState(note?.body ?? "");
  const editor = describeNoteEditor({
    draft,
    saved: note,
    saving: fetcher.state !== "idle",
    error: fetcher.data?.error,
  });
  const overLimit = editor.status.kind === "too-long";

  return (
    <Card className="mb-8 gap-4">
      <LessonNoteHeader />
      <CardContent>
        <fetcher.Form method="post" className="space-y-3">
          <input type="hidden" name="intent" value="save-note" />
          <Textarea
            name="body"
            aria-label="Your note on this lesson"
            aria-invalid={overLimit || editor.status.kind === "error"}
            aria-describedby="lesson-note-status lesson-note-count"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Key ideas, questions, code to try later..."
            className="min-h-32 resize-y"
          />
          <LessonNoteFooter editor={editor} />
        </fetcher.Form>
      </CardContent>
    </Card>
  );
}

function LessonNoteHeader() {
  return (
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <NotebookPen className="size-4 text-muted-foreground" />
        <h2>Your note on this lesson</h2>
      </CardTitle>
      <CardDescription>
        Only you can see it. Find all your notes on your{" "}
        <Link to="/saved" className="underline underline-offset-2">
          Saved page
        </Link>
        .
      </CardDescription>
    </CardHeader>
  );
}

function LessonNoteFooter({ editor }: { editor: NoteEditorState }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="submit" size="sm" disabled={!editor.canSave}>
        {editor.status.kind === "saving" ? "Saving..." : "Save note"}
      </Button>
      <NoteStatus status={editor.status} />
      <span
        id="lesson-note-count"
        className={cn(
          "ml-auto text-xs tabular-nums",
          editor.status.kind === "too-long"
            ? "text-red-600"
            : "text-muted-foreground"
        )}
      >
        {editor.length.toLocaleString("en")} /{" "}
        {editor.maxLength.toLocaleString("en")}
      </span>
    </div>
  );
}

function noteStatusText(status: NoteEditorStatus): string {
  switch (status.kind) {
    case "saving":
      return "Saving your note...";
    case "error":
      return status.message;
    case "too-long":
      return `${status.over.toLocaleString("en")} characters over the limit`;
    case "unsaved":
      return "Unsaved changes";
    case "cleared":
      return "A note can't be empty, so your saved note is kept";
    case "saved":
      return `Saved · last edited ${formatRelativeTime(status.updatedAt)}`;
    case "empty":
      return "Not saved yet";
  }
}

function NoteStatus({ status }: { status: NoteEditorStatus }) {
  const isProblem = status.kind === "error" || status.kind === "too-long";

  return (
    <span
      id="lesson-note-status"
      role={isProblem ? "alert" : "status"}
      suppressHydrationWarning
      className={cn(
        "text-xs",
        isProblem ? "text-red-600" : "text-muted-foreground"
      )}
    >
      {noteStatusText(status)}
    </span>
  );
}
