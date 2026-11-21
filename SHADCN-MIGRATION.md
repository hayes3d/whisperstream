# shadcn/ui migration — `experiment/shadcn-ui`

Fork-only experiment: migrate the hand-rolled UI components in
`frontend/src/components` to shadcn/ui primitives while keeping the Glacier
design language and every component's public props. Upstream
(lanreal-io/whisperstream) accepts no PRs; this branch is an evaluation.

## Scaffolding

- `frontend/components.json` — shadcn CLI config (Tailwind 4, CSS variables,
  `@/` aliases). The CLI's generated `import { cn } from "cn"` was wrong
  (it installed an unrelated `cn` npm package); replaced with a standard
  `src/lib/utils.ts` (`clsx` + `tailwind-merge`).
- `@/*` path alias added to `tsconfig.json`, `vite.config.ts`,
  `vitest.config.ts`.
- New deps: `radix-ui` (monolith), `clsx`, `tailwind-merge`, `lucide-react`,
  `class-variance-authority`; dev: `@testing-library/user-event`.
- **Token bridge** in `src/styles/globals.css`: shadcn's token contract
  (`--background`, `--primary`, `--ring`, `--radius`, …) is defined as
  `var()` references onto the Glacier tokens, so shadcn components re-theme
  automatically through the existing `[data-theme]` blocks. `--radius` tracks
  `--radius-input` (12px): shadcn `rounded-lg` = the app's field radius.
  Geometry grammar unchanged: pills stay `rounded-full`, row cards
  `--radius-row` (18px), cards `--radius-card` (28px).
- jsdom stubs for Radix (pointer capture, `scrollIntoView`) in
  `src/test/setup.ts`.

## Swapped

| Component | Now built on | Public API |
|---|---|---|
| `Toggle.tsx` | shadcn `Switch` (Radix) | unchanged (`checked/onChange/disabled/ariaLabel/ariaDescribedBy`) |
| `HoverTooltip.tsx` | shadcn `Tooltip` (Radix) | unchanged (all 7 props accepted) |
| `Dropdown.tsx` | Radix `Select` primitives (the layer shadcn's Select wraps) | unchanged (`DropdownOption` + all 19 props) |
| `CustomPromptDialog.tsx` | shadcn `Dialog` (Radix) | unchanged (`open/initialPrompt/onSave/onCancel`) |
| `EnableLocalConfirmDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `LowRamDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `LocalNudgeDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `EnhancementRecoveryDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `TranscriptConfirmDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `VoiceModelMemoryDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `DeleteSttModelDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `DeleteUnusedSttModelsDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `LockdownScopeReviewDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `MultilingualLanguageSwitchDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `DownloadDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `LowDiskSpaceDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `DataLeavesDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `PrivacyModal.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `ReportBugDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `StartFreshDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `SlowModelConsentDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `LockdownManageDialog.tsx` | shadcn `Dialog` (Radix) | unchanged |
| `AnchoredPopover.tsx` | shadcn `Popover` (Radix, virtual anchor) | unchanged |
| `SettingsPopover.tsx` | shadcn `Popover` (Radix) | unchanged |

All shadcn `ui/*` files are re-skinned to Glacier (switch = 48×26
accent-fill pill; tooltip = frost-glass overlay bubble; dialog =
`--surface-modal` card over the `--backdrop-strong` 40px-blur scrim, no
default close button). Radix portals everything to `document.body`, which
retires the manual `createPortal` + stacking-context workarounds in the
swapped components.

## Remains (hand-rolled)

- ~7 other dialogs/modals (`AddAppModal`, `HudConfigModal`,
  `ProfileEditorModal`, `LockdownSetupModal`, the Delete*/Recovery*/
  Download* family, …) — same swap recipe as `CustomPromptDialog`.
- `CustomCheckbox` → Checkbox; `RangeInput`/`SliderField` → Slider;
  `Badge`, `PrimaryButton`/`SecondaryButton` → Badge/Button variants.
- Onboarding/spotlight/HUD surfaces untouched.

## API compromises & findings

1. **Dropdown ≠ Select, structurally.** The hand-rolled Dropdown is a custom
   listbox with an embedded search field, focusable per-row actions and a
   synchronous keyboard contract. Radix Select fights all three:
   - Radix defers arrow/typeahead focus moves through `setTimeout`, so the
     app's (tested) synchronous keyboard behavior broke. The old keyboard
     handler was restored on the option rows (`stopPropagation` keeps Radix
     out). Radix still owns portal, popper positioning and dismissal.
   - The search field only works because its keydown stops propagation
     before Radix's typeahead sees it. shadcn's own answer for a searchable
     picker is the Combobox (Popover + cmdk), not Select.
   - The trigger keeps `role="button"` (overriding Radix's `combobox`) so
     dozens of call-site tests and queries keep matching. Semantically
     combobox is more correct; flip it later if the suite is migrated.
   - Trigger/row `onClick` handlers only act on `event.detail === 0`
     (keyboard/synthetic clicks); real pointer flows go through Radix's
     pointerdown/pointerup. This keeps jsdom `fireEvent.click` tests working
     without double-firing in a real browser.
   - Radix Select values are strings: option values round-trip through
     `String(value)`, so options in one dropdown must stringify uniquely
     (held for all current call sites).
   - While a Select is open, Radix `aria-hidden`s the rest of the page;
     one test now queries the trigger with `{ hidden: true }`.
2. **HoverTooltip**: Radix mounts the bubble only while open, so an
   `aria-describedby` pointing at `bubbleId` resolves only during
   hover/focus (previously the bubble was always in the DOM).
   `focusVisibleClassName` is accepted but ignored — Radix opens on trigger
   focus natively. `side="auto"` now uses Radix collision detection instead
   of the manual measure-and-flip.
3. **Toggle**: mount-animation test (framer-motion `initial={false}`) was
   replaced by behavior tests; framer-motion is no longer used by Toggle.
4. **Per-instance `TooltipProvider`** inside HoverTooltip keeps 20+ call
   sites untouched; hoist one app-level provider if instance count matters.

5. **Dialog batch 2 (8 dialogs)**: manual Escape/backdrop handlers and
   focus-the-safe-button effects were removed. Radix handles Esc (listening
   on `document`, so tests dispatch `keyDown(document, …)` not `window`),
   focus trap, restore-focus, and focuses the first tabbable on open, which
   is the safe button in every one of these.
   - `LocalNudgeDialog` and `EnhancementRecoveryDialog` have no `open` prop
     (parents mount them conditionally), so they render `<Dialog open …>`;
     public props are unchanged.
   - `DeleteSttModelDialog` / `DeleteUnusedSttModelsDialog` ignore Esc and
     backdrop while `busy` (gated in `onOpenChange`) and pass
     `aria-modal="true"` explicitly because Radix omits it and their tests
     assert it.
   - `VoiceModelMemoryDialog` used `z-[60]`; shadcn content/overlay are
     `z-50`. It portals to `document.body` last, so it still stacks on top
     of the non-portaled z-50 shells; revisit if it is ever opened over
     another Radix dialog.
   - Radix `aria-hidden`s the page behind an open dialog, so the Enhancement
     page test default now sets `enhancement_local_nudge_seen: true` (the
     nudge otherwise opens in unrelated tests); the two nudge tests set false
     explicitly.
   - Not touched: `MemoryRingIcon` export (still used by VoiceModelMemoryDialog).
6. **HoverTooltip tree is now stable** (follow-up fix): it used to return the
   bare wrapper when `content` was empty, so a hint going null (e.g. a gate
   opening on RecoveryGateButton / LockdownSetup Continue) remounted the
   trigger and dropped focus from the wrapped control. Only `TooltipContent`
   is conditional now; props unchanged.
7. **Known a11y compromise, not fixed**: `aria-describedby` that points at a
   HoverTooltip bubble resolves only while the trigger is hovered/focused. It
   works when the described control is itself the trigger (RecoveryGateButton),
   but not for the Transcripts header, whose provenance bubble hangs off the
   (non-focusable) version chip, and `focusVisibleClassName` (show-on-header-
   focus) is ignored. A persistent visually-hidden mirror of the bubble text
   would restore it; left as a decision.
8. **Test setup**: the Radix jsdom stubs in `src/test/setup.ts` are guarded on
   `typeof Element` (node-environment suites crashed with "Element is not
   defined").
9. **Dropdown double-fire** (follow-up fix): a keyboard/synthetic click on an
   option ran both the row handler and Radix's own item click, so `onChange`
   fired twice for a changed value (visible as two speech-status refreshes in
   HudConfigModal). The row click handler now only handles re-selecting the
   current value (Radix does not report that); changed values go through
   `onValueChange` alone. Props unchanged.

## Batch 3 (10 dialogs + 2 popovers): findings

**ui/* API additions** (both additive, defaults unchanged)
- `DialogContent` / `DialogOverlay` take `backdrop?: "strong" | "soft"`
  (default `strong`). `soft` is the 8px `--backdrop-soft` scrim that only
  DownloadDialog uses; the two stay distinct.
- `DialogContent` now sets `aria-modal="true"` (Radix omits it; the app and its
  a11y tests expect it). The per-dialog copies from batch 2 are now redundant.
- New `ui/popover.tsx` (Popover/Trigger/Anchor/Content), Glacier-skinned
  (overlay surface, hairline border, glass shadow, 24px blur, `--radius-row`)
  using arbitrary-property classes so callers override each cleanly through
  tailwind-merge. Written by hand with the `@/lib/utils` import: the shadcn CLI
  was NOT run, so the bogus `cn` npm package was not installed
  (`"cn"` is absent from package.json).

**Dismissal parity (original behavior -> now)**

| Dialog | Esc | Scrim press | While busy |
|---|---|---|---|
| LockdownScopeReviewDialog | blocked (required review) | blocked | n/a; Continue self-disables while submitting. `onEscapeKeyDown`/`onInteractOutside` preventDefault, no onOpenChange |
| MultilingualLanguageSwitchDialog | dismiss | dismiss | n/a |
| DownloadDialog | cancel (no-op while cancelling) | cancel ONLY in error phase, never mid-download | handled in custom Esc/outside handlers, no onOpenChange |
| LowDiskSpaceDialog | dismiss | dismiss | n/a |
| DataLeavesDialog | cancel | cancel | n/a |
| PrivacyModal | cancel unless saving | cancel unless saving | blocked while saving |
| ReportBugDialog | close unless preparing | close unless preparing | blocked while preparing |
| StartFreshDialog | cancel unless deleting | cancel unless deleting | blocked while deleting |
| SlowModelConsentDialog | keep model unless measuring | keep model unless measuring | blocked while measuring |
| LockdownManageDialog | close | close | n/a |

**Focus**: LowDiskSpaceDialog, SlowModelConsentDialog, PrivacyModal and
LockdownScopeReviewDialog redirect Radix initial focus (`onOpenAutoFocus`) to
the safe/primary button they focused before; the rest rely on first-tabbable.
SlowModelConsentDialog and others no longer focus in an effect because the
Radix portal mounts the card one commit later than the old inline DOM.

**Nesting check**: none of the 10 render a child dialog. Callers open them
sequentially (LockdownManageDialog closes before the next Lockdown dialog
opens; DataLeaves -> PrivacyModal is close-then-open). LowDiskSpaceDialog is
also rendered inside the still hand-rolled OnboardingOverlay (excluded); it is a
portaled sibling there, so the overlay simply sits behind it, not inside it.
No skips were needed. LockdownManageDialog hosts a Radix Select (DurationSelect)
inside a Radix Dialog; covered only by jsdom tests, not visually checked.

**Popovers**
- `AnchoredPopover`: anchor passed as a Radix `virtualRef`; Radix does the
  positioning/flip/clamp. Dismissal and focus movement are disabled
  (`onInteractOutside`/`onEscapeKeyDown`/`onOpenAutoFocus` preventDefault)
  because the content owns outside-click. Radix still `preventDefault`s nothing
  extra, but its Escape listener marks the event default-prevented.
- `SettingsPopover`: Radix Trigger/Content (`align="end"`, `collisionPadding`
  8). Behavior changes: opening now moves focus into the menu and closing returns
  it to the gear (Radix default; previously focus stayed on the gear); the
  open/close animation is gone; scroll/resize still close it. No fight with the
  API, so no stop.
- Test setup changes: scrim presses are tested with `userEvent.click` (a bare
  `fireEvent.pointerDown` never reaches Radix in jsdom); Escape is dispatched on
  `document`; portaled content is queried via `document`, not `container`.

## Verification

- `npx tsc -b` clean.
- Dialog batch 2 + Radix-test follow-up: full `npx vitest run` is 2339/2339 after batch 3 (exit 0, read from the JSON reporter, not the rtk wrapper summary). The earlier "full suite green" was wrong: the wrapper hid failures from the tooltip/select swaps.
- Dev preview (`npm run dev`, port 1420) not exercised in this session —
  visual pass in the real app still recommended before building on this.
