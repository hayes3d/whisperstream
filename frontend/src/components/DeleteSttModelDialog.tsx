import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * Targeted speech-model deletion confirm.
 *
 * Built on the shared shadcn Dialog (card + backdrop + Esc/backdrop dismissal
 * from Radix); Esc and backdrop are ignored while `busy`. The destructive primary follows `TranscriptConfirmDialog`, the
 * app's canonical delete confirm.
 *
 * Copy is locked. The
 * safe action is `Keep model` rather than a bare Cancel, and it owns mount
 * focus, so a stray Enter can never delete. Enter is deliberately not bound to
 * the destructive action.
 *
 * Deletion itself is guarded on the backend (configured and loaded artifacts
 * are refused) and in the picker (no trash on the active model), so this only
 * ever opens for a removable one.
 */

const glassPillStyle = {
  background: "var(--surface-modal)",
  border: "1px solid var(--border-hairline-steel)",
  boxShadow: "inset 0 1px 0 rgb(255 255 255 / calc(0.9 * var(--rim-scale)))",
};

/* Destructive primary — rose, never the frost gradient. `color-mix` keeps it
   correct in both themes (Light --color-rose #C48B8B, Dark #D9A0A0). */
const destructivePillStyle = {
  background: "color-mix(in srgb, var(--color-rose) 18%, transparent)",
  border: "1px solid color-mix(in srgb, var(--color-rose) 45%, transparent)",
  color: "color-mix(in srgb, var(--color-rose) 70%, #3A1515)",
};

interface DeleteSttModelDialogProps {
  open: boolean;
  /** User-facing model name (`NVIDIA Parakeet` / `Qwen3 ASR`). */
  modelName: string;
  /** True while the delete request is in flight. */
  busy?: boolean;
  onConfirm: () => void;
  /** `Keep model`, Escape, and backdrop click all land here. */
  onCancel: () => void;
}

export function DeleteSttModelDialog({
  open,
  modelName,
  busy = false,
  onConfirm,
  onCancel,
}: DeleteSttModelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !busy && onCancel()}>
      <DialogContent className="w-[420px]" aria-modal="true">
        <DialogTitle className="mb-3 text-center font-display text-[18px] font-normal text-slate">
          Delete {modelName}?
        </DialogTitle>

        <DialogDescription className="mb-6 text-center text-[13px] leading-relaxed text-steel">
          This deletes the downloaded model from this device. You can download
          it again anytime.
        </DialogDescription>

        <div className="flex items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="cursor-pointer rounded-md px-5 py-2 text-[13px] font-medium text-slate transition-all duration-200 disabled:cursor-default disabled:opacity-60"
            style={glassPillStyle}
          >
            Keep model
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="cursor-pointer rounded-md px-5 py-2 text-[13px] font-medium transition-all duration-200 disabled:cursor-default disabled:opacity-60"
            style={destructivePillStyle}
          >
            Delete model
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
