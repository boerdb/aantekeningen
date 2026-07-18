export type NoteStatus = "draft" | "processing" | "ready" | "error";

export type NoteSummary = {
  id: string;
  title: string;
  status: NoteStatus;
  hasPhoto: boolean;
  hasPdf: boolean;
  hasDocx: boolean;
  createdAt: string;
  updatedAt: string;
  preview: string;
};

export type NoteDetail = NoteSummary & {
  contentText: string;
  ocrRaw: string | null;
  ocrProvider: string | null;
  errorMessage: string | null;
};
