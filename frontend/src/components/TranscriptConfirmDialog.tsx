import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------- Dialog shell ----------
   Card + backdrop come from the shared shadcn Dialog; Esc / backdrop-cancel
   and focus-first-button (Cancel) are Radix defaults. The ONE delta from
   EnableLocalConfirmDialog: the primary pill is the DESTRUCTIVE rose
   treatment (not the frost gradient), so "Delete" never reads like the
   benign "Continue". Used by the three transcripts confirms
   (retention-shrink, clear-all, per-card delete). */
const glassPillStyle = {
  background: "var(--surface-modal)",
  border: "1px solid var(--border-hairline-steel)",
  boxShadow: "inset 0 1px 0 rgb(255 255 255 / calc(0.9 * var(--rim-scale)))",
};

/* DESTRUCTIVE primary — rose, NOT the frost gradient (design.md LOCKED).
   color-mix() blends var(--color-rose) so dark theme brightens correctly
   (Light --color-rose = #C48B8B; Dark --color-rose = #D9A0A0). */
const destructivePillStyle = {
  background: "color-mix(in srgb, var(--color-rose) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--color-rose) 45%, transparent)",
  color: "color-mix(in srgb, var(--color-rose) 70%, #3A1515)",
};

interface TranscriptConfirmDialogProps {
  /** When false, the component renders nothing. Mirrors EnableLocalConfirmDialog. */
  open: boolean;
  /** Dialog headline (LOCKED copy from copy-review.md). */
  headline: string;
  /** One-line consequence body (LOCKED copy from copy-review.md). */
  body: string;
  /** Destructive verb on the rose primary pill (e.g. "Delete all", "Delete
   *  older", "Delete"). */
  confirmLabel: string;
  /** Primary action (rose pill, right side): user confirms the deletion. */
  onConfirm: () => void;
  /** Secondary action (glass pill, left side) AND Esc / backdrop click: user
   *  backs out. Nothing is deleted. */
  onCancel: () => void;
}

export function TranscriptConfirmDialog({
  open,
  headline,
  body,
  confirmLabel,
  onConfirm,
  onCancel,
}: TranscriptConfirmDialogProps) {
  // Enter is intentionally NOT bound — the user must read the consequence
  // before keyboard-confirming a destructive action. Radix focuses Cancel
  // (first tabbable) on open so a stray Enter does not delete.
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      <DialogContent className="w-[420px]">
        <DialogTitle className="font-display text-[18px] font-normal text-slate text-center mb-3">
          {headline}
        </DialogTitle>

        <DialogDescription className="text-[13px] text-steel mb-6 leading-relaxed text-center">
          {body}
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
            onClick={onConfirm}
            className="px-5 py-2 rounded-md text-[13px] font-medium cursor-pointer transition-all duration-200"
            style={destructivePillStyle}
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
