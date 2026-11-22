import type { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";

// The app's filled action button — single source of truth for the primary CTA
// recipe that used to be copy-pasted across the onboarding footer
// (ContinueButton) and the retired Pro tab.
//
// Deep Frost treatment: the old recipe was a pale frost gradient
// (#A3C6E8 -> #7EAED4) with white text, which is ~1.7-2.3:1 contrast (fails
// WCAG AA) so it read faint and almost disabled. We deepen the blue to
// #4A7BA8 -> #2F5E86 (white ~6.4:1, passes AA), keeping the cool brand family.
//
// Disabled is a STRUCTURAL state (flat, desaturated, no glow) rather than an
// opacity dim of the enabled surface, so an enabled button can never read as
// disabled. Hover/press change only the shadow (no positional lift), so the
// button gives feedback without jumping.
//
// Stock shadcn default Button: solid primary, primary-foreground text,
// shadow-xs, rounded-md. Disabled is the stock 50% opacity of the same fill.
const deepFrost = {
  textClass: "text-[var(--accent-fill-fg)] font-medium",
  idle: {
    background: "var(--accent-fill)",
    boxShadow: "var(--shadow-glass-sm)",
    border: "1px solid transparent",
  },
  hoverShadow: "var(--shadow-glass-sm)",
  pressShadow: "none",
  disabled: {
    background: "var(--accent-fill)",
    color: "var(--accent-fill-fg)",
    boxShadow: "none",
    border: "1px solid transparent",
    opacity: 0.5,
  },
};

// framer-motion's `motion.button` redefines the drag and animation-start
// handlers with its own (incompatible) signatures, so spreading the raw DOM
// versions onto it is a type error. Omit them from the props we accept — no
// call site passes these DOM handlers (they pass onClick / disabled / aria-*).
interface PrimaryButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "className" | "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"
  > {
  fullWidth?: boolean;
  loading?: boolean;
  // Onboarding's "delight moment" entrance (opacity/scale) for the Finish
  // button once the first transcription lands.
  animated?: boolean;
  className?: string;
  children: ReactNode;
}

export function PrimaryButton({
  fullWidth = false,
  loading = false,
  animated = false,
  disabled = false,
  className = "",
  children,
  ...rest
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.button
      {...rest}
      disabled={isDisabled}
      initial={false}
      animate={
        animated
          ? { opacity: isDisabled ? 0.4 : 1, scale: isDisabled ? 0.96 : 1 }
          : undefined
      }
      transition={{ duration: 0.22, ease: [0.2, 0, 0, 1] }}
      className={[
        "relative rounded-md transition-all duration-200 hover:opacity-90",
        isDisabled ? "cursor-not-allowed" : `cursor-pointer ${deepFrost.textClass}`,
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      style={
        isDisabled
          ? {
              background: deepFrost.disabled.background,
              color: deepFrost.disabled.color,
              boxShadow: deepFrost.disabled.boxShadow,
              border: deepFrost.disabled.border,
              opacity: deepFrost.disabled.opacity,
            }
          : { background: deepFrost.idle.background, boxShadow: deepFrost.idle.boxShadow, border: deepFrost.idle.border }
      }
      onMouseEnter={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.boxShadow = deepFrost.hoverShadow;
      }}
      onMouseLeave={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.boxShadow = deepFrost.idle.boxShadow;
      }}
      onMouseDown={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.boxShadow = deepFrost.pressShadow;
      }}
      onMouseUp={(e) => {
        if (isDisabled) return;
        e.currentTarget.style.boxShadow = deepFrost.hoverShadow;
      }}
    >
      {children}
    </motion.button>
  );
}
