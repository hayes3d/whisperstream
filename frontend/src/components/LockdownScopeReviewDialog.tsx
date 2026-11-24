import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { LOCKDOWN_ACK_VERSION } from "./LockdownSetupModal";

const glassPillStyle: React.CSSProperties = {
  background: "var(--surface-control)",
  border: "1px solid var(--border-hairline-steel)",
  boxShadow: "inset 0 1px 0 var(--rim-specular)",
};

const gradientPillStyle: React.CSSProperties = {
  background: "var(--accent-fill)",
  boxShadow: "var(--shadow-pearl)",
};

export function needsLockdownScopeReview(
  enabled: boolean,
  acknowledgedVersion: string | null,
): boolean {
  return (
    enabled &&
    acknowledgedVersion !== null &&
    acknowledgedVersion !== LOCKDOWN_ACK_VERSION
  );
}

interface LockdownScopeReviewDialogProps {
  open: boolean;
  onContinue: () => Promise<void>;
  onTurnOff: () => void;
  /** Whether an administrator machine policy forces Lockdown Mode on. A managed
   *  install never sees an offer to turn Lockdown off, so the required review
   *  becomes Continue-only. */
  managed?: boolean;
}

/** One-time review for an older acknowledgment version. This deliberately
 * reviews only the shortened approved scope statement. It never routes an
 * existing Lockdown user back through password setup. */
export function LockdownScopeReviewDialog({
  open,
  onContinue,
  onTurnOff,
  managed = false,
}: LockdownScopeReviewDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const primaryRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) setSubmitting(false);
  }, [open]);

  const handleContinue = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onContinue();
    } catch {
      // Keep the required review open when persistence fails. The next click
      // retries the same versioned acknowledgment without changing state.
    } finally {
      setSubmitting(false);
    }
  };

  // This review is REQUIRED: Escape and backdrop click never dismiss it (the
  // original swallowed Escape and had no backdrop handler), so there is no
  // onOpenChange. Radix supplies the Tab trap; focus lands on Continue.
  return (
    <Dialog open={open}>
      <DialogContent
        className="w-[420px]"
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          primaryRef.current?.focus();
        }}
        // The authority sentence is part of what this review says, so it joins
        // the accessible description instead of being announced only if the
        // user happens to read past the focused Continue button.
        aria-describedby={
          managed
            ? "lockdown-scope-review-description lockdown-scope-review-managed"
            : "lockdown-scope-review-description"
        }
      >
        <DialogTitle className="text-center mb-3">Review Lockdown Mode</DialogTitle>
        <DialogDescription
          id="lockdown-scope-review-description"
          className={`text-[13px] text-steel leading-relaxed text-center ${
            // The authority line belongs to this paragraph, not to the action
            // row, so close the gap between them and keep the full 24px break
            // before the buttons.
            managed ? "mb-2" : "mb-6"
          }`}
        >
          Lockdown applies to Whisperstream transcription, cleanup, and saved
          history. Safe diagnostic logs stay local unless you export and share
          them.
        </DialogDescription>

        {managed && (
          <p
            id="lockdown-scope-review-managed"
            className="text-[12px] text-steel mb-6 leading-relaxed text-center"
          >
            Your organization requires Lockdown Mode on this device.
          </p>
        )}

        <div className="flex items-center justify-center gap-2.5">
          {!managed && (
            <button
              onClick={onTurnOff}
              className="px-5 py-2 rounded-md text-[13px] font-medium text-slate cursor-pointer transition-all duration-200"
              style={glassPillStyle}
            >
              Turn off Lockdown Mode
            </button>
          )}
          <button
            ref={primaryRef}
            disabled={submitting}
            onClick={() => void handleContinue()}
            className="px-5 py-2 rounded-md text-[13px] font-medium text-white cursor-pointer transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            style={gradientPillStyle}
          >
            Continue
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LockdownScopeReviewDialog;
