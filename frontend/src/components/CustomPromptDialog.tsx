import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { getBuiltinPrompt } from "../lib/api/enhancement";
import { errorType } from "../lib/logCapture";

/* ---------- Dialog shell ----------
   The frost-glass card + backdrop now come from the shared shadcn Dialog
   (components/ui/dialog.tsx), which portals to document.body so the card
   never gets trapped under a backdrop-blur stacking context. Per LOCKED
   Decision 5-B the card is 520px wide with a max-height of 480px and the
   footer pairs a left-aligned "Reset to default" link with right-aligned
   Cancel / Save pills. */
const glassPillStyle = {
  background: "var(--surface-modal)",
  border: "1px solid var(--border-hairline-steel)",
  boxShadow: "inset 0 1px 0 rgb(255 255 255 / calc(0.9 * var(--rim-scale)))",
};

const gradientPillStyle = {
  background: "var(--accent-fill)",
  boxShadow:
    "var(--shadow-pearl)",
};

interface CustomPromptDialogProps {
  /** When false, the component renders nothing. Mirrors LowRamDialog. */
  open: boolean;
  /** Seed value for the textarea. The draft state is re-seeded from
   *  this prop every time `open` flips to true so reopening the dialog
   *  picks up the latest stored prompt rather than a stale draft. */
  initialPrompt: string;
  /** Primary action (gradient pill, right side): user accepts the
   *  edited prompt. Parent persists to config. */
  onSave: (prompt: string) => void;
  /** Secondary action (glass pill) AND Esc / backdrop click: user
   *  discards the draft and closes the dialog. */
  onCancel: () => void;
}

export function CustomPromptDialog({
  open,
  initialPrompt,
  onSave,
  onCancel,
}: CustomPromptDialogProps) {
  // Local draft state. Seeded from `initialPrompt` each time the dialog
  // opens (not on every prop change) so the user's in-progress edits
  // are preserved across re-renders while open.
  const [draft, setDraft] = useState(initialPrompt);

  useEffect(() => {
    if (open) setDraft(initialPrompt);
  }, [open, initialPrompt]);

  // Esc and backdrop-click dismissal come from Radix Dialog; Enter is
  // intentionally NOT bound — a textarea owns Enter for newlines; the Save
  // pill is the explicit commit path.
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      {/* Glass card — 520px wide per LOCKED Decision 5-B. max-h-[480px]
          caps card height so the resize-y textarea grows up to 280px
          without escaping the 700x500 Tauri main window. */}
      <DialogContent className="w-[520px] max-h-[480px]">
        <DialogTitle className="mb-1">Custom prompt</DialogTitle>

        <DialogDescription className="mb-4">
          Used to rewrite every transcription longer than three words.
        </DialogDescription>

        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="e.g., Clean up this transcription. Fix grammar. Keep the original meaning."
          className="w-full min-h-[140px] max-h-[280px] resize-y rounded-2xl px-4 py-3 text-[13px] text-slate font-body placeholder:text-steel outline-none transition-all duration-300"
          style={{
            background: "var(--surface-control)",
            border: "1px solid var(--border-hairline)",
          }}
          onFocus={(e) => {
            // Mirror Enhancement.tsx inline-textarea recipe (lines
            // 903-910): brighten the border to frost and lift the
            // background one step on focus.
            e.currentTarget.style.borderColor = "var(--border-accent)";
            e.currentTarget.style.background = "var(--surface-hover)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hairline)";
            e.currentTarget.style.background = "var(--surface-control)";
          }}
        />

        {/* Footer: Reset link pinned left, Cancel/Save pair pinned
            right — the "one auxiliary link, one primary pair" pattern
            from DataLeavesDialog. */}
        <div className="flex items-center justify-between gap-2.5 mt-5">
          <button
            type="button"
            onClick={async () => {
              try {
                const { prompt } = await getBuiltinPrompt("chat");
                setDraft(prompt);
              } catch (err) {
                console.warn(
                  `[CustomPromptDialog] builtin prompt fetch failed error_type=${errorType(err)}`,
                );
              }
            }}
            className="text-xs text-steel hover:text-frost-deep transition-colors cursor-pointer"
          >
            Reset to default
          </button>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2 rounded-md text-[13px] font-medium text-slate cursor-pointer transition-all duration-200"
              style={glassPillStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onSave(draft)}
              className="px-5 py-2 rounded-md text-[13px] font-medium text-white cursor-pointer transition-all duration-200"
              style={gradientPillStyle}
            >
              Save
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
