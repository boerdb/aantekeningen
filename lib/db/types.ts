export type NoteStatus = "draft" | "processing" | "ready" | "error";

export type NoteRow = {
  id: string;
  title: string;
  content_text: string;
  ocr_raw: string | null;
  ocr_provider: string | null;
  status: NoteStatus;
  error_message: string | null;
  photo_path: string | null;
  pdf_path: string | null;
  docx_path: string | null;
  created_at: Date;
  updated_at: Date;
};

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
