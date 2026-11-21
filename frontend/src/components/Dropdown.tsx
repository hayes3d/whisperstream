import {
  useState,
  useEffect,
  useId,
  useRef,
  Fragment,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { motion } from "framer-motion";
import { Select as SelectPrimitive } from "radix-ui";
import { Badge, type BadgeTone } from "./Badge";

/**
 * Shared frost-glass dropdown, rebuilt on the Radix Select primitives that
 * shadcn/ui's Select wraps (shadcn migration). The public `DropdownOption` /
 * `DropdownProps` API is unchanged, and the trigger/row markup is carried
 * over verbatim via `asChild`, so call sites and most tests are untouched.
 *
 * What Radix now owns (was ~400 lines of hand-rolled logic):
 * - Portal + popper positioning with collision flipping and height clamping
 *   (replaces the manual measure/flip/clamp layout effect).
 * - Keyboard navigation: arrows, Home/End, typeahead, Enter/Space selection,
 *   Escape close, focus restore to the trigger.
 * - Outside-click / scroll dismissal via the dismissable layer.
 *
 * Compatibility shims (documented in SHADCN-MIGRATION.md):
 * - The trigger keeps `role="button"` (overriding Radix's combobox role) so
 *   existing `getByRole("button")` queries and call-site tests keep working.
 * - `onClick` handlers on the trigger/rows act only for `event.detail === 0`
 *   (synthetic/keyboard clicks): real pointer interaction is handled by
 *   Radix's pointerdown/pointerup, so nothing double-fires, while
 *   `fireEvent.click` in jsdom still opens/selects.
 * - Radix Select values are strings, so option values round-trip through
 *   `String(value)`; options in one dropdown must stringify uniquely.
 */
export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  /** Optional supporting text rendered below the primary label in both the
   *  collapsed trigger and the option row. It remains inside the option's
   *  accessible content and is omitted cleanly for legacy one-line callers. */
  description?: string;
  /** Optional visible and semantic group heading. Contiguous options with the
   *  same label are wrapped in one labelled `role="group"` while keyboard
   *  navigation continues to follow the original flat option order. */
  groupLabel?: string;
  /** Prevent this individual option from being selected. Disabled rows remain
   *  visible for state/context but expose both native and ARIA semantics. */
  disabled?: boolean;
  /** Optional trailing chip rendered via the shared `Badge` primitive. */
  badge?: { label: string; tone?: BadgeTone };
  /** Keep tradeoff chips inside the open menu. */
  badgeInOptionsOnly?: boolean;
  /** Optional trailing chips for options that carry more than one descriptor. */
  badges?: { label: string; tone?: BadgeTone }[];
  /** Optional trailing, non-interactive state glyph. */
  adornment?: ReactNode;
  /** Optional LEADING adornment rendered BEFORE the label. */
  leadingAdornment?: ReactNode;
  /** When true, a thin `--divider` hairline is rendered in the panel BEFORE
   *  this option's row (never on the collapsed trigger). */
  dividerBefore?: boolean;
  /** Screen-reader-only sentence associated with this option row through
   *  `aria-describedby`. */
  accessibleDescription?: string;
  /** Render `description` only in the open panel, never on the collapsed
   *  trigger (and leave it out of the trigger's accessible name). */
  descriptionInOptionsOnly?: boolean;
  /** Rich panel-only replacement for `description`. */
  descriptionContent?: ReactNode;
  /** Replaces `adornment` on the collapsed trigger only. */
  triggerAdornment?: ReactNode;
  /** Render `badge`/`badges` inline after the label on the row's first line. */
  badgeInline?: boolean;
  /** Still render `renderOptionAction` when this option is disabled. */
  actionWhenDisabled?: boolean;
}

interface DropdownProps<T extends string | number> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  /** Screen-reader label for the trigger. The current selection is appended
   *  automatically. */
  ariaLabel?: string;
  /** Associate the trigger with its setting's explanatory text. */
  ariaDescribedBy?: string;
  /** Tailwind classes controlling the trigger button width/shape. */
  triggerClassName?: string;
  /** Panel width in px. Defaults to the measured trigger width. */
  panelWidth?: number;
  /** Opt-in override for the group heading's COLOR class only. */
  groupHeadingClassName?: string;
  /** Opt-in override for the `dividerBefore` hairline color. */
  dividerColor?: string;
  /** Optional override for the collapsed trigger's RESTING border color. */
  triggerBorderColor?: string;
  /** Optional control shown inside the closed trigger's right edge. */
  triggerAccessory?: ReactNode;
  /** Optional additional cap (px) on the panel's height, applied on top of
   *  Radix's space-to-the-viewport-edge clamp. */
  panelMaxHeight?: number;
  /** Shown on the trigger when `value` matches no option. */
  placeholder?: string;
  /** When true, the trigger is non-interactive and dimmed. */
  disabled?: boolean;
  /** Opt-in per-row action rendered OUTSIDE the option button. */
  renderOptionAction?: (opt: DropdownOption<T>) => ReactNode;
  /** Opt-in: let Tab move from an option INTO that row's action instead of
   *  closing the panel. */
  optionActionsFocusable?: boolean;
  /** Panel overflow behavior. Default `"auto"` clips + scrolls internally. */
  panelOverflow?: "auto" | "visible";
  /** Opt-in text filter rendered inside the open panel. */
  searchable?: boolean;
  /** Placeholder for the opt-in panel filter. */
  searchPlaceholder?: string;
  /** Opt-in programmatic open. */
  openRequest?: number;
}

type IndexedOption<T extends string | number> = {
  option: DropdownOption<T>;
  index: number;
};

type OptionRun<T extends string | number> = {
  groupLabel?: string;
  entries: IndexedOption<T>[];
};

const GAP = 8; // px between trigger and panel
const TYPEAHEAD_RESET_MS = 500;
const MARGIN = 8; // px breathing room from the viewport edge

function coalesceOptionRuns<T extends string | number>(
  options: DropdownOption<T>[],
): OptionRun<T>[] {
  const runs: OptionRun<T>[] = [];
  options.forEach((option, index) => {
    const previous = runs[runs.length - 1];
    if (previous && previous.groupLabel === option.groupLabel) {
      previous.entries.push({ option, index });
      return;
    }
    runs.push({ groupLabel: option.groupLabel, entries: [{ option, index }] });
  });
  return runs;
}

export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
  ariaDescribedBy,
  triggerClassName = "w-[140px]",
  panelWidth,
  groupHeadingClassName = "text-steel",
  dividerColor = "var(--divider)",
  triggerBorderColor = "var(--border-hairline-steel)",
  triggerAccessory,
  panelMaxHeight,
  placeholder,
  disabled = false,
  renderOptionAction,
  optionActionsFocusable = false,
  panelOverflow = "auto",
  searchable = false,
  searchPlaceholder = "Search options",
  openRequest,
}: DropdownProps<T>) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  // Max height clamped to the roomier side of the trigger (the old manual
  // layout math, kept because tests and callers rely on the exact clamp).
  const [panelMax, setPanelMax] = useState<number | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  // Set when the panel is closed by Tab, so focus is NOT yanked back to the
  // trigger (the old contract: Tab closes the list and moves on).
  const closedByTabRef = useRef(false);
  // True between a mousedown and mouseup on the trigger. See handlePanelBlur.
  const triggerPressedRef = useRef(false);
  const typeaheadRef = useRef({ query: "", lastKeyAt: 0 });
  const dropdownId = useId();

  const current = options.find((o) => o.value === value);
  const currentLabel = current?.label ?? placeholder ?? "";
  const triggerDescription = current?.descriptionInOptionsOnly
    ? undefined
    : current?.description;
  const normalizedSearch = searchQuery.trim().toLocaleLowerCase();
  const visibleOptions = normalizedSearch
    ? options.filter((option) =>
        [option.label, option.description, option.groupLabel, String(option.value)]
          .filter(Boolean)
          .some((field) => field!.toLocaleLowerCase().includes(normalizedSearch)),
      )
    : options;
  const optionRuns = coalesceOptionRuns(visibleOptions);

  const closeAndRestoreFocus = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const selectOption = (option: DropdownOption<T>) => {
    if (option.disabled) return;
    onChange(option.value);
    closeAndRestoreFocus();
  };

  // The live panel element. Radix's Content ref is not reliably populated
  // through `position="popper"` + portal in every environment, so the panel
  // carries a data attribute and is queried from the document.
  const getPanel = () =>
    contentRef.current ??
    document.querySelector<HTMLDivElement>(
      `[data-ws-dropdown="${CSS.escape(dropdownId)}"]`,
    );

  const focusFirstEnabledOption = () => {
    const first = getPanel()?.querySelector<HTMLButtonElement>(
      '[role="option"]:not([disabled])',
    );
    first?.focus();
  };

  // Deterministic keyboard navigation carried over from the hand-rolled
  // panel. Radix's own arrow/typeahead handling defers focus moves through
  // setTimeout, which breaks the app's synchronous keyboard contract (and
  // the tests encoding it), so the item handler below stops propagation and
  // keeps this logic local.
  const focusOption = (index: number) => {
    getPanel()
      ?.querySelectorAll<HTMLButtonElement>('[role="option"]')
      .item(index)
      ?.focus();
  };

  const enabledIndexes = () =>
    visibleOptions.flatMap((option, index) => (option.disabled ? [] : [index]));

  const moveFocus = (fromIndex: number, direction: 1 | -1) => {
    const enabled = enabledIndexes();
    if (enabled.length === 0) return;
    const currentPosition = enabled.indexOf(fromIndex);
    const nextPosition =
      currentPosition === -1
        ? direction === 1
          ? 0
          : enabled.length - 1
        : (currentPosition + direction + enabled.length) % enabled.length;
    focusOption(enabled[nextPosition]);
  };

  const focusEdge = (edge: "first" | "last") => {
    const enabled = enabledIndexes();
    if (enabled.length === 0) return;
    focusOption(edge === "first" ? enabled[0] : enabled[enabled.length - 1]);
  };

  const focusTypeaheadMatch = (fromIndex: number, key: string) => {
    const now = Date.now();
    const previous = typeaheadRef.current;
    const normalizedKey = key.toLocaleLowerCase();
    let query =
      now - previous.lastKeyAt > TYPEAHEAD_RESET_MS
        ? normalizedKey
        : `${previous.query}${normalizedKey}`;
    // Repeated single-character presses cycle through labels that share the
    // same initial instead of producing an impossible query such as "bbb".
    if (query.length > 1 && [...query].every((c) => c === query[0])) {
      query = normalizedKey;
    }
    typeaheadRef.current = { query, lastKeyAt: now };
    for (let offset = 1; offset <= visibleOptions.length; offset += 1) {
      const candidateIndex = (fromIndex + offset) % visibleOptions.length;
      const candidate = visibleOptions[candidateIndex];
      if (
        !candidate.disabled &&
        candidate.label.toLocaleLowerCase().startsWith(query)
      ) {
        focusOption(candidateIndex);
        return;
      }
    }
  };

  const handleOptionKeyDown = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    option: DropdownOption<T>,
    index: number,
  ) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        event.stopPropagation();
        moveFocus(index, 1);
        return;
      case "ArrowUp":
        event.preventDefault();
        event.stopPropagation();
        moveFocus(index, -1);
        return;
      case "Home":
        event.preventDefault();
        event.stopPropagation();
        focusEdge("first");
        return;
      case "End":
        event.preventDefault();
        event.stopPropagation();
        focusEdge("last");
        return;
      case "Enter":
      case " ":
      case "Spacebar":
        event.preventDefault();
        event.stopPropagation();
        selectOption(option);
        return;
      case "Escape":
        event.preventDefault();
        event.stopPropagation();
        closeAndRestoreFocus();
        return;
      case "Tab":
        // With row actions focusable, the next tab stop is this row's action,
        // which lives inside the panel; keep Radix from swallowing the key
        // and let the browser move focus. handlePanelBlur closes once focus
        // genuinely leaves.
        event.stopPropagation();
        if (optionActionsFocusable) return;
        closedByTabRef.current = true;
        setOpen(false);
        return;
      default:
        if (
          event.key.length === 1 &&
          !event.altKey &&
          !event.ctrlKey &&
          !event.metaKey
        ) {
          event.preventDefault();
          event.stopPropagation();
          focusTypeaheadMatch(index, event.key);
        }
    }
  };

  // If the dropdown becomes disabled while open, force it closed so a stale
  // portal panel can't linger over a dimmed trigger.
  useEffect(() => {
    if (disabled && open) setOpen(false);
  }, [disabled, open]);

  useEffect(() => {
    if (!open) {
      typeaheadRef.current = { query: "", lastKeyAt: 0 };
      if (searchQuery) setSearchQuery("");
    }
  }, [open, searchQuery]);

  useEffect(() => {
    if (!openRequest || disabled) return;
    triggerRef.current?.focus();
    setOpen(true);
    // Only a NEW request opens the panel; `disabled` changes must not.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openRequest]);

  // Deterministic entry focus (the old contract): the filter field for
  // searchable dropdowns, otherwise the selected enabled option, falling back
  // to the first enabled option. Radix mounts the panel a tick after `open`
  // flips, so this runs from the Content ref callback at panel mount, after
  // Radix's own focus work.
  const initPanelFocus = (panel: HTMLDivElement) => {
    if (searchable) {
      panel
        .querySelector<HTMLInputElement>('input[role="searchbox"]')
        ?.focus();
      return;
    }
    const enabled = panel.querySelectorAll<HTMLButtonElement>(
      '[role="option"]:not([disabled])',
    );
    if (!enabled.length) return;
    const selected = Array.from(enabled).find(
      (el) => el.getAttribute("aria-selected") === "true",
    );
    (selected ?? enabled[0]).focus();
  };

  // Clamp the panel height to the roomier side of the trigger, minus the gap,
  // optionally capped by the caller (exact math carried over from the
  // hand-rolled panel; Radix's own available-height var is not measurable in
  // jsdom and resolves slightly differently).
  useEffect(() => {
    if (!open) {
      setPanelMax(null);
      return;
    }
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const spaceBelow = window.innerHeight - r.bottom - MARGIN;
    const spaceAbove = r.top - MARGIN;
    const available = Math.max(spaceBelow, spaceAbove) - GAP;
    setPanelMax(
      Math.max(
        0,
        panelMaxHeight === undefined
          ? available
          : Math.min(available, panelMaxHeight),
      ),
    );
  }, [open, panelMaxHeight, options.length]);

  // Close on scroll outside the panel and on resize (the popper would track,
  // but the app's contract is that panels dismiss rather than chase).
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      const t = e.target;
      if (t instanceof Node && getPanel()?.contains(t)) return;
      setOpen(false);
    };
    const onResize = () => setOpen(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  // Only used with focusable panel innards (search field / row actions):
  // close once focus genuinely leaves the panel and trigger.
  const handlePanelBlur = (event: ReactFocusEvent<HTMLDivElement>) => {
    // WebKit does not focus a clicked button, so pressing the trigger blurs
    // the panel with no related target. Closing here would let the trigger's
    // click toggle the panel straight back open; leave the close to it.
    if (triggerPressedRef.current) return;
    const next = event.relatedTarget as Node | null;
    if (
      next &&
      (getPanel()?.contains(next) || triggerRef.current?.contains(next))
    ) {
      return;
    }
    setOpen(false);
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      // Let Radix's dismissable layer close and restore focus.
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      event.stopPropagation();
      focusFirstEnabledOption();
      return;
    }
    // Keep printable keys and edit keys out of Radix's item typeahead, which
    // would otherwise steal focus from the input on every keystroke.
    event.stopPropagation();
  };

  const trigger = (
    <SelectPrimitive.Trigger asChild>
      <button
        ref={triggerRef}
        type="button"
        // Compat: the hand-rolled trigger was a plain button with
        // aria-haspopup, and call-site tests query role "button".
        role="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-disabled={disabled || undefined}
        aria-describedby={ariaDescribedBy}
        aria-label={
          ariaLabel
            ? `${ariaLabel}: ${currentLabel}${triggerDescription ? `. ${triggerDescription}` : ""}`
            : undefined
        }
        onMouseDown={() => {
          triggerPressedRef.current = true;
          document.addEventListener(
            "mouseup",
            () => {
              triggerPressedRef.current = false;
            },
            { once: true },
          );
        }}
        onClick={(event) => {
          if (disabled) return;
          // preventDefault stops Radix's own composed click handler, which
          // would re-focus the trigger and re-open the panel; mouse opening
          // still flows through Radix's pointerdown.
          event.preventDefault();
          // Synthetic/keyboard clicks only; pointer flows are Radix's.
          if (event.detail === 0) setOpen((o) => !o);
        }}
        className={`${triggerClassName} px-3 py-1.5 rounded-[var(--radius-input)] text-[13px] text-left text-slate flex items-center justify-between transition-all duration-200 ${
          disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
        }`}
        style={{
          background: "var(--surface-control)",
          border: open
            ? "1px solid var(--border-accent)"
            : `1px solid ${triggerBorderColor}`,
        }}
      >
        <span className="flex flex-1 items-center gap-2 min-w-0">
          {current?.leadingAdornment}
          <span className="min-w-0 flex-1">
            <span
              className={`block ${triggerDescription ? "whitespace-normal leading-tight" : "truncate"}`}
              style={triggerDescription ? { overflowWrap: "anywhere" } : undefined}
            >
              {currentLabel}
            </span>
            {triggerDescription && (
              <span
                className="mt-0.5 block text-[11px] leading-4 font-normal text-steel whitespace-normal"
                style={{ overflowWrap: "anywhere" }}
              >
                {triggerDescription}
              </span>
            )}
          </span>
          {!current?.badgeInOptionsOnly && (current?.badge || (current?.badges?.length ?? 0) > 0) && (
            <span className="inline-flex items-center gap-1">
              {current?.badge && (
                <Badge label={current.badge.label} tone={current.badge.tone} size="sm" />
              )}
              {current?.badges?.map((b, i) => (
                <Badge key={i} label={b.label} tone={b.tone} size="sm" />
              ))}
            </span>
          )}
          {current?.triggerAdornment ?? current?.adornment}
        </span>
        {/* Room for `triggerAccessory`, which is overlaid here, before the
            chevron, from outside the button. */}
        {triggerAccessory && <span aria-hidden="true" className="w-5 shrink-0" />}
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="text-steel shrink-0 ml-2"
        >
          <path d="M3 4.5l3 3 3-3" />
        </motion.svg>
      </button>
    </SelectPrimitive.Trigger>
  );

  return (
    <SelectPrimitive.Root
      open={open}
      onOpenChange={setOpen}
      disabled={disabled}
      value={String(value)}
      onValueChange={(next) => {
        const option = options.find((o) => String(o.value) === next);
        if (option && !option.disabled) onChange(option.value);
      }}
    >
      {triggerAccessory ? (
        <span className="relative inline-flex">
          {trigger}
          <span className="absolute right-[34px] top-1/2 z-10 flex -translate-y-1/2 items-center">
            {triggerAccessory}
          </span>
        </span>
      ) : (
        trigger
      )}

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          ref={(node: HTMLDivElement | null) => {
            contentRef.current = node;
            if (node) initPanelFocus(node);
          }}
          data-ws-dropdown={dropdownId}
          position="popper"
          side="bottom"
          align="end"
          sideOffset={GAP}
          collisionPadding={MARGIN}
          aria-label={ariaLabel}
          onCloseAutoFocus={(event) => {
            // Radix would restore focus to whatever was focused BEFORE the
            // panel opened (often body); the app's contract is the trigger.
            // Tab-close instead moves on without restoring.
            event.preventDefault();
            if (closedByTabRef.current) {
              closedByTabRef.current = false;
              return;
            }
            triggerRef.current?.focus();
          }}
          onBlur={
            searchable || optionActionsFocusable ? handlePanelBlur : undefined
          }
          onKeyDownCapture={(event) => {
            if (event.key !== "Tab") return;
            if (optionActionsFocusable) {
              // Keep Radix from swallowing Tab so it can walk into a row's
              // action; handlePanelBlur closes once focus leaves the panel.
              event.stopPropagation();
              return;
            }
            // Shared contract: Tab off an option closes the list.
            closedByTabRef.current = true;
            setOpen(false);
          }}
          className={`z-50 rounded-[var(--radius-input)] ${
            searchable
              ? "flex flex-col overflow-hidden"
              : panelOverflow === "visible"
                ? "overflow-visible py-1.5"
                : "overflow-y-auto overscroll-contain py-1.5"
          }`}
          style={{
            width:
              panelWidth !== undefined
                ? panelWidth
                : "var(--radix-select-trigger-width)",
            maxHeight: panelMax ?? undefined,
            background: "var(--surface-overlay)",
            backdropFilter: "blur(24px)",
            border: "1px solid var(--border-hairline)",
            boxShadow: "var(--shadow-glass)",
          }}
        >
          {searchable && (
            <div className="shrink-0 border-b border-[var(--divider)] p-2">
              <div
                className="flex items-center gap-2 rounded-[var(--radius-input)] px-2.5"
                style={{
                  background: "var(--surface-control)",
                  border: "1px solid var(--border-hairline)",
                }}
              >
                <svg
                  aria-hidden="true"
                  width="13"
                  height="13"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="shrink-0 text-steel/60"
                >
                  <circle cx="7" cy="7" r="4.5" />
                  <path d="m10.5 10.5 3 3" strokeLinecap="round" />
                </svg>
                <input
                  ref={searchRef}
                  type="text"
                  role="searchbox"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  aria-label={`Filter ${ariaLabel ?? "options"}`}
                  placeholder={searchPlaceholder}
                  className="min-w-0 flex-1 bg-transparent py-2 text-[12px] text-slate outline-none placeholder:text-steel/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    aria-label="Clear search"
                    onClick={() => {
                      setSearchQuery("");
                      searchRef.current?.focus();
                    }}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[14px] text-steel/60 transition-colors hover:bg-[var(--surface-hover)] hover:text-slate"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          )}
          <div
            className={
              searchable
                ? "min-h-0 flex-1 overflow-y-auto overscroll-contain py-1.5"
                : "contents"
            }
          >
            {optionRuns.map((run, runIndex) => {
              const groupHeadingId = `${dropdownId}-group-${runIndex}`;
              const renderedOptions = run.entries.map(({ option: opt, index }) => {
                const isSelected = opt.value === value;
                const isDisabled = opt.disabled === true;
                const action =
                  isDisabled && !opt.actionWhenDisabled
                    ? null
                    : renderOptionAction?.(opt);
                const hasBadges = !!opt.badge || (opt.badges?.length ?? 0) > 0;
                const badgeChips = hasBadges ? (
                  <>
                    {opt.badge && (
                      <Badge label={opt.badge.label} tone={opt.badge.tone} size="sm" />
                    )}
                    {opt.badges?.map((b, i) => (
                      <Badge key={i} label={b.label} tone={b.tone} size="sm" />
                    ))}
                  </>
                ) : null;
                const descriptionId = opt.accessibleDescription
                  ? `${dropdownId}-desc-${index}`
                  : undefined;
                return (
                  <Fragment key={String(opt.value)}>
                    {opt.dividerBefore && (
                      <div
                        role="separator"
                        aria-hidden="true"
                        className="mx-3 my-1.5 h-px"
                        style={{ background: dividerColor }}
                      />
                    )}
                    <div className={action ? "group/row relative" : undefined}>
                      <SelectPrimitive.Item
                        value={String(opt.value)}
                        textValue={opt.label}
                        disabled={isDisabled}
                        asChild
                      >
                        <button
                          type="button"
                          aria-selected={isSelected}
                          aria-describedby={descriptionId}
                          aria-disabled={isDisabled || undefined}
                          disabled={isDisabled}
                          onClick={(event) => {
                            // Synthetic/keyboard clicks only; pointer and
                            // Enter/Space selection are Radix's.
                            if (event.detail === 0) selectOption(opt);
                          }}
                          onKeyDown={(event) =>
                            handleOptionKeyDown(event, opt, index)
                          }
                          className={`w-full ${action ? "pr-10" : ""} px-4 py-2 text-[13px] text-left flex items-center gap-2 transition-colors duration-100 outline-none ${
                            isDisabled
                              ? "text-steel/60 cursor-not-allowed"
                              : isSelected
                                ? "text-slate font-medium cursor-pointer"
                                : "text-steel hover:text-slate cursor-pointer data-[highlighted]:text-slate"
                          } data-[highlighted]:bg-[var(--surface-control)]`}
                          style={{
                            transition: "background 100ms",
                            ...(isSelected
                              ? {
                                  background: "var(--surface-raised)",
                                  borderLeft: "3px solid var(--border-accent)",
                                }
                              : {}),
                          }}
                        >
                          {opt.leadingAdornment}
                          <span className="min-w-0 flex-1">
                            <span
                              data-dropdown-option-label
                              className={`block whitespace-normal leading-tight ${
                                isSelected ? "font-medium" : ""
                              }`}
                              style={{ overflowWrap: "anywhere" }}
                            >
                              {opt.label}
                              {opt.badgeInline && badgeChips && (
                                <span className="ml-1.5 inline-flex items-center gap-1 align-[1px]">
                                  {badgeChips}
                                </span>
                              )}
                            </span>
                            {(opt.descriptionContent ?? opt.description) && (
                              <span
                                className={`mt-0.5 block text-[11px] leading-4 font-normal whitespace-normal ${
                                  isDisabled ? "text-steel/60" : "text-steel"
                                }`}
                                style={{ overflowWrap: "anywhere" }}
                              >
                                {opt.descriptionContent ?? opt.description}
                              </span>
                            )}
                          </span>
                          {!opt.badgeInline && badgeChips && (
                            <span className="inline-flex items-center gap-1">
                              {badgeChips}
                            </span>
                          )}
                          {opt.adornment && (
                            <span className="ml-auto shrink-0">{opt.adornment}</span>
                          )}
                        </button>
                      </SelectPrimitive.Item>
                      {descriptionId && (
                        // Outside the button so it stays a DESCRIPTION rather
                        // than joining the option's accessible name.
                        <span id={descriptionId} className="sr-only">
                          {opt.accessibleDescription}
                        </span>
                      )}
                      {action && (
                        <div
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {action}
                        </div>
                      )}
                    </div>
                  </Fragment>
                );
              });

              if (!run.groupLabel) {
                return (
                  <Fragment key={`ungrouped-${run.entries[0].index}`}>
                    {renderedOptions}
                  </Fragment>
                );
              }

              return (
                <div
                  key={`${run.groupLabel}-${run.entries[0].index}`}
                  role="group"
                  aria-labelledby={groupHeadingId}
                >
                  <div
                    id={groupHeadingId}
                    className={`px-4 pt-2 pb-1 text-[11px] font-medium uppercase tracking-[0.08em] ${groupHeadingClassName}`}
                  >
                    {run.groupLabel}
                  </div>
                  {renderedOptions}
                </div>
              );
            })}
            {visibleOptions.length === 0 && (
              <div className="px-4 py-5 text-center text-[12px] text-steel/60">
                No matching options
              </div>
            )}
          </div>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
