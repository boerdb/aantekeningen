import { NoteEditor } from "@/components/notes/NoteEditor";

type Props = { params: Promise<{ id: string }> };

export default async function NotePage({ params }: Props) {
  const { id } = await params;
  return <NoteEditor noteId={id} />;
}
