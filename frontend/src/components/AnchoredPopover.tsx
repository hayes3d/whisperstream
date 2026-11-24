/**
 * AnchoredPopover — a portal helper that lifts a floating menu OUT of any
 * `overflow-hidden` / clipping ancestor and pins it (position: fixed) to an
 * anchor element's bounding rect.
 *
 * Why this exists: the Connection card and the profile-editor rows use
 * `overflow-hidden` for their expand/collapse height animation. A menu rendered
 * as `position: absolute` inside those cards gets clipped at the card edge (the
 * provider dropdown's last option and the app-picker popover were cut off and
 * unclickable). Portalling the menu to `document.body` escapes the clip while a
 * fixed position keyed off the anchor's `getBoundingClientRect()` keeps it
 * visually attached to its trigger.
 *
 * Now a thin adapter over the shadcn/Radix Popover: the anchor element is
 * handed to Radix as a virtual anchor, and Radix owns the portal, the fixed
 * positioning, the flip-above-when-no-room and viewport-clamp collision logic,
 * and re-measuring on scroll / resize. It opens BELOW the anchor by default.
 * Click-outside / Escape close logic stays with the *content* (the existing
 * RunningAppPicker owns its own outside-click handler), so Radix dismissal is
 * disabled here and focus is never moved: this wrapper is purely about position
 * + escaping the clip.
 */
import type { RefObject, ReactNode } from "react";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";

type Align = "left" | "right";

// Keep the menu this far from the viewport edges when it would otherwise spill.
const VIEWPORT_MARGIN = 8;

export function AnchoredPopover({
  anchorRef,
  align = "left",
  gap = 8,
  width,
  children,
}: {
  /** The trigger element the popover anchors to. */
  anchorRef: RefObject<HTMLElement | null>;
  /** Which edge of the anchor the popover's same edge lines up with. */
  align?: Align;
  /** Vertical gap (px) between the anchor and the popover. */
  gap?: number;
  /** Optional fixed width (px). When set, the popover is sized to it rather
   *  than stretching to the anchor's width. */
  width?: number;
  children: ReactNode;
}) {
  return (
    // Mounted by the caller only while open, so `open` is always true; there
    // is deliberately no onOpenChange (dismissal belongs to the content).
    <Popover open>
      <PopoverAnchor virtualRef={anchorRef as RefObject<HTMLElement>} />
      <PopoverContent
        side="bottom"
        align={align === "right" ? "end" : "start"}
        sideOffset={gap}
        collisionPadding={VIEWPORT_MARGIN}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
        onInteractOutside={(event) => event.preventDefault()}
        // The children carry their own glass card, so drop the Glacier skin.
        className="z-[60] rounded-none p-0 [background:transparent] [border:0] [box-shadow:none] [backdrop-filter:none]"
        style={{ width: width ?? "var(--radix-popover-trigger-width)" }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
