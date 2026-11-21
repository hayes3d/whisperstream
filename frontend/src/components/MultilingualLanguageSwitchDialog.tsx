import { useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

// Language-change model guidance. One card, two variants, because both answer
// the same question at the same moment: the language you picked and the model
// you are running no longer agree.
//
//   keep-or-switch — Automatic, and the exact model already running also covers
//     the target language. Following the recommendation stays Automatic; keeping
//     the current model enters Manual pinned to that exact artifact.
//   incompatible   — Manual, and the pinned model cannot serve the target
//     language at all. There is nothing to keep, so the only forward action
//     leaves Manual and activates the recommended model.
//
// Copy is locked, and
// only user-facing model names appear here (Parakeet v2/v3 stays internal).
//
// SAME-FAMILY EXCEPTION. Both Parakeet artifacts share one user-facing name, so
// a Parakeet-to-Parakeet transition (multilingual Parakeet moving to English,
// or English-only Parakeet moving to French) would render the locked strings as
// "NVIDIA Parakeet supports English. For the best results, Whisperstream
// recommends NVIDIA Parakeet." and "Switch to NVIDIA Parakeet" while the model
// row already says NVIDIA Parakeet. The locked scope forbids the only wording
// that would fix that (exposing the English-only / multilingual qualifiers
// outside bulk deletion), so those cases drop the names entirely and speak
// about the current and recommended SETUP. The actions stay explicit and the
// routing behavior is identical in both presentations.
//
// Built on the shared shadcn Dialog (portaled to body, so it resolves against
// the viewport rather than <main>). Escape and backdrop click both dismiss.

const glassPillStyle = {
  background: "var(--surface-modal)",
  border: "1px solid var(--border-hairline-steel)",
  boxShadow: "inset 0 1px 0 rgb(255 255 255 / calc(0.9 * var(--rim-scale)))",
};

const gradientPillStyle = {
  background: "var(--accent-fill)",
  boxShadow: "var(--shadow-pearl)",
};

export type MultilingualLanguageSwitchVariant =
  | "keep-or-switch"
  | "incompatible";

interface MultilingualLanguageSwitchDialogProps {
  open: boolean;
  variant: MultilingualLanguageSwitchVariant;
  currentModelName: string;
  recommendedModelName: string;
  targetLanguageName: string;
  /** keep-or-switch only: keep the exact current model and enter Manual. */
  onKeepCurrentModel: () => void;
  /** Follow the recommendation for the target language. */
  onSwitchToRecommended: () => void;
  /** Abandon the language change (Escape, backdrop, and the incompatible
   *  variant's `Keep current language` action). */
  onDismiss: () => void;
}

export function MultilingualLanguageSwitchDialog({
  open,
  variant,
  currentModelName,
  recommendedModelName,
  targetLanguageName,
  onKeepCurrentModel,
  onSwitchToRecommended,
  onDismiss,
}: MultilingualLanguageSwitchDialogProps) {
  const safeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) safeButtonRef.current?.focus();
  }, [open, variant]);

  const incompatible = variant === "incompatible";
  // Both sides carry the same product name, so naming either one is noise at
  // best and reads as a model being recommended over itself at worst.
  const sameModelName = currentModelName === recommendedModelName;

  const heading = incompatible
    ? "A model change is needed"
    : "Keep your current speech model?";
  const description = incompatible
    ? sameModelName
      ? `Your current setup does not support ${targetLanguageName}. Whisperstream will switch to its recommended setup.`
      : `Your current model does not support ${targetLanguageName}. Whisperstream will switch to ${recommendedModelName}.`
    : sameModelName
      ? `Your current setup supports ${targetLanguageName}. For the best results, Whisperstream recommends a different setup.`
      : `${currentModelName} supports ${targetLanguageName}. For the best results, Whisperstream recommends ${recommendedModelName}.`;
  const safeLabel = incompatible
    ? "Keep current language"
    : sameModelName
      ? "Keep current setup"
      : `Keep ${currentModelName}`;
  const forwardLabel = sameModelName
    ? "Use recommended setup"
    : `Switch to ${recommendedModelName}`;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="w-[420px]">
        <DialogTitle className="mb-2 text-center">{heading}</DialogTitle>

        <DialogDescription className="mb-6 text-center text-[13px] leading-relaxed text-steel">
          {description}
        </DialogDescription>

        <div className="flex items-center justify-end gap-2.5">
          <button
            ref={safeButtonRef}
            type="button"
            onClick={incompatible ? onDismiss : onKeepCurrentModel}
            className="cursor-pointer rounded-full px-5 py-2 text-[13px] font-medium text-slate transition-all duration-200"
            style={glassPillStyle}
          >
            {safeLabel}
          </button>
          <button
            type="button"
            onClick={onSwitchToRecommended}
            className="cursor-pointer rounded-full px-5 py-2 text-[13px] font-medium text-white transition-all duration-200"
            style={gradientPillStyle}
          >
            {forwardLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
