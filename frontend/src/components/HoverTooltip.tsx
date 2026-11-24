import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * HoverTooltip — the app's on-brand frost-glass hover bubble, now a thin
 * adapter over shadcn/Radix Tooltip. The public props are unchanged from the
 * hand-rolled version so all 20+ call sites compile as-is.
 *
 * Mapping notes (shadcn migration):
 * - Explicit sides map to Radix side/align pairs; `auto` relies on Radix's
 *   built-in collision detection (avoidCollisions), which replaces the old
 *   manual measure-and-flip logic.
 * - The bubble is portaled by Radix, so it can never be trapped under a
 *   stacking context the way the old absolutely-positioned sibling could.
 * - `focusVisibleClassName` is accepted but unused: Radix opens the tooltip
 *   on trigger focus natively, which is what that prop simulated.
 * - `bubbleId` is applied to the tooltip content. Radix mounts content only
 *   while open, so an `aria-describedby` pointing at it resolves only during
 *   hover/focus (API compromise, documented in SHADCN-MIGRATION.md).
 */
interface HoverTooltipProps {
  /** Bubble contents. When null/undefined/"" only the trigger renders. */
  content: ReactNode;
  /** The hover target. */
  children: ReactNode;
  /** Which edge the bubble anchors to. Default bottom-right. */
  side?: "bottom-right" | "bottom-left" | "top-right" | "top" | "auto";
  /** Tailwind width class for the bubble. Default `w-56`. */
  width?: string;
  /** Extra classes on the wrapper (e.g. layout tweaks at the call site). */
  className?: string;
  /** Stable ID for callers that connect the bubble with aria-describedby. */
  bubbleId?: string;
  /** Legacy opt-in focus visibility class. Radix shows the bubble on focus
   *  natively, so this is accepted for API compatibility and ignored. */
  focusVisibleClassName?: string;
}

const SIDE_MAP: Record<
  NonNullable<HoverTooltipProps["side"]>,
  { side: "top" | "bottom"; align: "start" | "center" | "end" }
> = {
  "bottom-right": { side: "bottom", align: "end" },
  "bottom-left": { side: "bottom", align: "start" },
  "top-right": { side: "top", align: "end" },
  top: { side: "top", align: "center" },
  auto: { side: "bottom", align: "start" },
};

export function HoverTooltip({
  content,
  children,
  side = "bottom-right",
  width = "w-56",
  className = "",
  bubbleId,
}: HoverTooltipProps) {
  const hasContent =
    content !== null && content !== undefined && content !== "";

  const wrapper = (
    <span className={`relative inline-flex items-center ${className}`}>
      {children}
    </span>
  );

  const placement = SIDE_MAP[side];

  return (
    // ponytail: per-instance provider keeps 20+ call sites untouched; hoist
    // one app-level TooltipProvider if instance count ever matters.
    // The tree is identical with or without content (only TooltipContent is
    // conditional) so a hint that goes null (e.g. a gate opening) does not
    // remount the trigger and drop focus from the wrapped control.
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{wrapper}</TooltipTrigger>
        {hasContent && (
          <TooltipContent
            id={bubbleId}
            side={placement.side}
            align={placement.align}
            sideOffset={8}
            className={width}
          >
            {content}
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
