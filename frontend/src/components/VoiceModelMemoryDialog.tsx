import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SpeechStatus } from "../lib/api/speech";
import { MemoryRingIcon } from "./LowRamDialog";

interface VoiceModelMemoryDialogProps {
  open: boolean;
  tier: Extract<
    SpeechStatus["kokoro_memory_tier"],
    "caution" | "blocked" | "unknown"
  >;
  memory: SpeechStatus["memory"];
  onContinue: () => void;
  onUseLowerMemory: () => void;
  onDismiss: () => void;
}

function formatGigabytes(megabytes: number): string {
  return (megabytes / 1024).toLocaleString(undefined, {
    maximumFractionDigits: 1,
  });
}

export function VoiceModelMemoryDialog({
  open,
  tier,
  memory,
  onContinue,
  onUseLowerMemory,
  onDismiss,
}: VoiceModelMemoryDialogProps) {
  const blocked = tier === "blocked";

  const hasMemory =
    memory.total_mb !== null && memory.available_mb !== null;
  const memorySentence = hasMemory
    ? `This PC has ${formatGigabytes(memory.total_mb!)} GB of RAM, with ${formatGigabytes(memory.available_mb!)} GB currently available.`
    : "Whisperstream couldn't check this PC's available memory.";
  const blockedGuidance =
    memory.total_mb !== null && memory.total_mb < 8 * 1024
      ? "There is not enough total memory for Kokoro to run reliably. Use the lower-memory model instead."
      : "Kokoro does not have enough memory available right now. Close other apps and try again, or use the lower-memory model.";
  const body = blocked
    ? `${memorySentence} ${blockedGuidance}`
    : `${memorySentence} Kokoro may slow other apps or make speech stutter.`;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogContent className="w-[420px]">
        <MemoryRingIcon />

        <DialogTitle className="font-display text-[18px] font-normal text-slate text-center mb-2">
          {blocked
            ? "Not enough memory for Kokoro"
            : "Kokoro may use too much memory"}
        </DialogTitle>

        <DialogDescription className="text-[13px] text-steel mb-6 leading-relaxed text-center">
          {body}
        </DialogDescription>

        <div className="flex items-center justify-center gap-2.5">
          <button
            onClick={blocked ? onDismiss : onContinue}
            className="px-5 py-2 rounded-full text-[13px] font-medium text-slate cursor-pointer transition-all duration-200"
            style={{
              background: "var(--surface-modal)",
              border: "1px solid var(--border-emphasis)",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / calc(0.9 * var(--rim-scale)))",
            }}
          >
            {blocked ? "Cancel" : "Continue anyway"}
          </button>
          <button
            onClick={onUseLowerMemory}
            className="px-5 py-2 rounded-full text-[13px] font-medium text-white cursor-pointer transition-all duration-200"
            style={{
              background: "var(--accent-fill)",
              boxShadow: "var(--shadow-pearl)",
            }}
          >
            Use lower memory
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
