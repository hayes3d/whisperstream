import { Switch } from "@/components/ui/switch";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** When true, the switch is non-interactive and dimmed. Used when a
   *  dependent setting has no effect (e.g. Save audio while history is off). */
  disabled?: boolean;
  /** Explicit accessible name for switches whose visual label is not
   *  programmatically associated with the button. */
  ariaLabel?: string;
  /** Id of an element (usually the row's own description) that supplies
   *  additional accessible context beyond `ariaLabel`. */
  ariaDescribedBy?: string;
}

/** Thin adapter over shadcn's Switch keeping the app's original Toggle API
 *  (checked/onChange/ariaLabel/ariaDescribedBy) so call sites are unchanged.
 *  Glacier styling lives in components/ui/switch.tsx. */
export function Toggle({
  checked,
  onChange,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
}: ToggleProps) {
  return (
    <Switch
      checked={checked}
      onCheckedChange={onChange}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
    />
  );
}
