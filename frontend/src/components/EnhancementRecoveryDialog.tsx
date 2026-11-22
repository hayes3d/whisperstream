import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { PrimaryButton } from "./PrimaryButton";
import { SecondaryButton } from "./SecondaryButton";
import type { MissingEnhancementModel } from "../lib/api/enhancement";

// Mounted conditionally by EnhancementRecoveryHost, so `open` is always true.
// Radix supplies Esc/backdrop dismissal, the Tab focus trap, initial focus on
// the first button and focus restore on close.
export function EnhancementRecoveryDialog({ model, onDownload, onDismiss }: {
  model: MissingEnhancementModel;
  onDownload: () => void;
  onDismiss: () => void;
}) {
  return (
    <Dialog open onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="w-[420px]">
        <DialogTitle className="font-display text-[18px] font-normal text-slate text-center mb-3">
          Enhancement model is missing
        </DialogTitle>
        <DialogDescription className="text-[13px] text-steel text-center leading-relaxed mb-6">
          {model.label} could not be found on this device. Download it again to
          restore local enhancement. You can keep dictating without cleanup.
        </DialogDescription>
        <div className="flex justify-center gap-2.5">
          <SecondaryButton onClick={onDismiss} className="px-5 py-2 rounded-md text-[13px] text-slate">Not now</SecondaryButton>
          <PrimaryButton onClick={onDownload} className="px-5 py-2 rounded-md text-[13px]">Download again</PrimaryButton>
        </div>
      </DialogContent>
    </Dialog>
  );
}
