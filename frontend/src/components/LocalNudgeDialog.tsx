import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------------------------------------------------------------------------
   First-visit local-cleanup nudge (Feature #2). A one-time, in-page frost-glass
   modal (NOT a Tauri popup window) shown the first time a user opens the
   Enhancement tab while on a cloud provider and without having run the GPU
   benchmark, offering to check whether their computer can run on-device
   cleanup. CTA opens the BenchmarkFlow at "intro".

   Card + backdrop come from the shared shadcn Dialog. Mounted conditionally by
   the parent, so `open` is always true here.
--------------------------------------------------------------------------- */
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

interface LocalNudgeDialogProps {
  /** Dismiss without checking. Persists `enhancement_local_nudge_seen` + closes. */
  onDismiss: () => void;
  /** Persists seen + opens BenchmarkFlow at "intro". */
  onCheck: () => void;
  loading?: boolean;
  unavailable?: boolean;
}

export function LocalNudgeDialog({ onDismiss, onCheck, loading = false, unavailable = false }: LocalNudgeDialogProps) {
  // Esc / backdrop dismissal come from Radix Dialog; Enter is intentionally NOT
  // bound (read-first, like the intro). Radix focuses the first tabbable
  // ("Not now") on open.
  return (
    <Dialog open onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="w-[420px]">
        <DialogTitle className="font-display text-[18px] font-normal text-slate text-center mb-3">
          Try cleanup on your device
        </DialogTitle>

        <DialogDescription className="text-[13px] text-steel mb-6 leading-relaxed text-center">
          Your computer may be able to clean up dictation on its own, with nothing
          leaving it. Want to check?
        </DialogDescription>

        {unavailable && (
          <p role="status" className="text-[13px] text-steel mb-4 text-center">
            The model list is unavailable. Try again to check your hardware.
          </p>
        )}
        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={onDismiss}
            className="px-5 py-2 rounded-full text-[13px] font-medium text-slate cursor-pointer transition-all duration-200"
            style={glassPillStyle}
          >
            Not now
          </button>
          <button
            onClick={onCheck}
            disabled={loading}
            className="px-5 py-2 rounded-full text-[13px] font-medium text-white cursor-pointer transition-all duration-200"
            style={gradientPillStyle}
          >
            {loading ? "Loading models…" : unavailable ? "Try again" : "Check my hardware"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
