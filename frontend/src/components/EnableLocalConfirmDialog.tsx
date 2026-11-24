import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------- Dialog shell ----------
   Card + backdrop come from the shared shadcn Dialog (components/ui/dialog).
   Per LOCKED Decision 4-A the dialog is minimal: headline + body +
   Cancel/Continue pills, no decorative top-center icon. */
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

interface EnableLocalConfirmDialogProps {
  /** When false, the component renders nothing. Mirrors LowRamDialog. */
  open: boolean;
  /** Primary action (gradient pill, right side): user accepts the
   *  on-device trade-off. Parent kicks off the existing download chain. */
  onContinue: () => void;
  /** Secondary action (glass pill, left side) AND Esc / backdrop click:
   *  user backs out. Toggle stays off, no download fires. */
  onCancel: () => void;
}

export function EnableLocalConfirmDialog({
  open,
  onContinue,
  onCancel,
}: EnableLocalConfirmDialogProps) {
  // Esc / backdrop dismissal come from Radix Dialog. Enter is intentionally
  // NOT bound — the user must read the RAM/delay note before keyboard-
  // confirming. Radix focuses the first tabbable (Cancel) on open, which is
  // the guided-to-read focus target per Task 2.1.
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-[420px]">
        <DialogTitle className="font-display text-[18px] font-normal text-slate text-center mb-3">
          Enable enhancement
        </DialogTitle>

        <DialogDescription className="text-[13px] text-steel mb-6 leading-relaxed text-center">
          Cleanup uses a local AI model, so it needs extra memory and adds
          a brief delay to each transcription.
        </DialogDescription>

        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-md text-[13px] font-medium text-slate cursor-pointer transition-all duration-200"
            style={glassPillStyle}
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="px-5 py-2 rounded-md text-[13px] font-medium text-white cursor-pointer transition-all duration-200"
            style={gradientPillStyle}
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
