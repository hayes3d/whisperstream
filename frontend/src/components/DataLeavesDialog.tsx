import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

/* ---------- Provider display map ----------
   Duplicates a subset of PROVIDER_META[].label in PrivacyModal.tsx. Dialog B
   only needs the display name; pulling a shared util just for four entries
   would be over-engineering. If a fifth provider lands, both files update
   together — see dialog-design.md "Provider-name handling." */
const PROVIDER_DISPLAY: Record<string, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic",
  ollama: "Ollama",
  custom: "your custom endpoint",
};

/* ---------- Globe / network icon ----------
   Frost-deep stroke + frost aura. Signals "off-device, onto a network"
   without the alarm of a warning triangle. NOT a lock (PrivacyModal owns
   that glyph). NOT gold (this is informational, not a caution). */
function GlobeIcon() {
  return (
    <div className="relative w-12 h-12 mx-auto mb-4" aria-hidden="true" style={{ color: "var(--color-frost-deep)" }}>
      {/* Frost aura */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--halo-frost) 0%, transparent 70%)",
          transform: "scale(1.6)",
        }}
      />
      <svg
        viewBox="0 0 48 48"
        fill="none"
        className="relative w-full h-full"
      >
        {/* Globe outer circle */}
        <motion.circle
          cx="24"
          cy="24"
          r="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 400, damping: 25 }}
          style={{ transformOrigin: "24px 24px" }}
        />
        {/* Two latitude lines */}
        <motion.path
          d="M10 24c0 0 6-4 14-4s14 4 14 4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.18, duration: 0.4 }}
        />
        <motion.path
          d="M10 24c0 0 6 4 14 4s14-4 14-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.22, duration: 0.4 }}
        />
        {/* Central meridian */}
        <motion.path
          d="M24 10c0 0-4 6-4 14s4 14 4 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ delay: 0.26, duration: 0.4 }}
        />
        {/* Node mark — "off your device" signal */}
        <motion.circle
          cx="34"
          cy="16"
          r="2.25"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.5"
          initial={{ opacity: 0, scale: 0.4 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.34, type: "spring", stiffness: 600, damping: 24 }}
          style={{ transformOrigin: "34px 16px" }}
        />
      </svg>
    </div>
  );
}

interface DataLeavesDialogProps {
  /** When false, the component renders nothing (mirrors LowRamDialog +
   *  the existing PrivacyModal pattern). */
  open: boolean;
  /** Cloud-or-self-hosted provider the user just picked. The display name
   *  is interpolated into the provider-subhead via PROVIDER_DISPLAY. */
  provider: "gemini" | "openai" | "anthropic" | "ollama" | "custom";
  /** Hostname derived from the custom base URL (e.g. "openrouter.ai"). Only
   *  used when provider === "custom". When set, the subhead reads
   *  "Going to {customHost}"; when empty, falls back to PROVIDER_DISPLAY.custom. */
  customHost?: string;
  /** Primary action (gradient pill, right): close B, chain into PrivacyModal. */
  onContinue: () => void;
  /** Secondary action (glass pill, left): revert dropdown to the previous
   *  selection. Same path as Esc and backdrop click. */
  onCancel: () => void;
}

export function DataLeavesDialog({
  open,
  provider,
  customHost,
  onContinue,
  onCancel,
}: DataLeavesDialogProps) {
  const providerLabel =
    provider === "custom"
      ? (customHost || PROVIDER_DISPLAY.custom)
      : (PROVIDER_DISPLAY[provider] ?? provider);

  // Esc and backdrop click both cancel via Radix (reverts the dropdown): the
  // user picked a provider, the dialog asks "are you sure," so silent
  // dismissal must undo the pick. Enter is intentionally NOT bound — the user
  // must affirmatively click Continue. Radix focuses the first tabbable
  // (Cancel) on open: B is an interruption to a forward action, so the safer
  // default is "user reads first."
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onCancel()}>
      {/* Glass card — 440px wide, halfway between LowRamDialog (420) and
          PrivacyModal (460). Bullets benefit from a touch more horizontal
          room than Dialog A's single paragraph. */}
      <DialogContent className="w-[440px]">
        <GlobeIcon />

        <DialogTitle className="text-center mb-1">
          Review where your text goes
        </DialogTitle>
        <p className="text-[12px] text-steel/70 text-center mb-3">
          Going to {providerLabel}
        </p>

        <DialogDescription className="text-[13px] text-steel mb-4 leading-relaxed">
          Review the privacy notice before using this connection.
        </DialogDescription>

        <ul className="text-[12px] text-steel leading-relaxed space-y-1.5 pl-4 mb-5">
          <li className="list-disc marker:text-steel/50">
            Enhancement sends text and the selected profile&apos;s instructions.
          </li>
          <li className="list-disc marker:text-steel/50">
            Prompt tests send your sample and the instructions being tested.
          </li>
          <li className="list-disc marker:text-steel/50">
            The server may forward your text to other services.
          </li>
        </ul>

        {/* justify-end matches PrivacyModal. Continue is the natural forward
            path the user is already taking. */}
        <div className="flex items-center justify-end gap-2.5 mb-4">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-md text-[13px] font-medium text-slate cursor-pointer transition-all duration-200"
            style={{
              background: "var(--surface-modal)",
              border: "1px solid var(--border-emphasis)",
              boxShadow: "inset 0 1px 0 rgb(255 255 255 / calc(0.9 * var(--rim-scale)))",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onContinue}
            className="px-5 py-2 rounded-md text-[13px] font-medium text-white cursor-pointer transition-all duration-200"
            style={{
              background: "var(--accent-fill)",
              boxShadow: "var(--shadow-pearl)",
            }}
          >
            Continue
          </button>
        </div>

        <p className="text-[11px] text-steel/60 text-center leading-relaxed">
          Review the privacy notice before enabling this connection.
        </p>
      </DialogContent>
    </Dialog>
  );
}
