import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog.jsx";
import { Button } from "@/components/ui/button.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";
import { format } from "date-fns";
import { Notes } from "@/api/entities.js";
import { Loader2, Trash2 } from "lucide-react";

export default function NotepadModal({ isOpen, onClose, date, onSave }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [noteId, setNoteId] = useState(null);

  useEffect(() => {
    if (isOpen && date) {
      fetchNote();
    } else {
      setContent("");
      setNoteId(null);
    }
  }, [isOpen, date]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const existingNotes = await Notes.filter({ date: formattedDate });
      if (existingNotes && existingNotes.length > 0) {
        setContent(existingNotes[0].content);
        setNoteId(existingNotes[0].id);
      } else {
        setContent("");
        setNoteId(null);
      }
    } catch (error) {
      console.error("Failed to fetch note:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      if (noteId) {
        await Notes.update(noteId, { date: formattedDate, content });
      } else {
        await Notes.create({ date: formattedDate, content });
      }
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to save note:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!noteId) return;
    if (!confirm("Are you sure you want to delete this note?")) return;
    
    setSaving(true);
    try {
      await Notes.remove(noteId);
      onSave();
      onClose();
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle>Notes for {date ? format(date, "EEE, MMM d") : ""}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-sky-400" />
            </div>
          ) : (
            <Textarea
              placeholder="Write your notes here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-sky-500/50"
            />
          )}
        </div>

        <DialogFooter className="flex justify-between items-center">
          <div>
            {noteId && (
              <Button
                variant="destructive"
                size="icon"
                onClick={handleDelete}
                disabled={saving}
                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose} disabled={saving} className="text-gray-400 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving || !content.trim()} className="bg-sky-600 hover:bg-sky-700 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Note"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
