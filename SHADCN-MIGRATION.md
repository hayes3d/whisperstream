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

All shadcn `ui/*` files are re-skinned to Glacier (switch = 48×26
accent-fill pill; tooltip = frost-glass overlay bubble; dialog =
`--surface-modal` card over the `--backdrop-strong` 40px-blur scrim, no
default close button). Radix portals everything to `document.body`, which
retires the manual `createPortal` + stacking-context workarounds in the
swapped components.

## Remains (hand-rolled)

- ~25 other dialogs/modals (`AddAppModal`, `HudConfigModal`,
  `ProfileEditorModal`, `LockdownSetupModal`, the Delete*/Recovery*/
  Download* family, …) — same swap recipe as `CustomPromptDialog`.
- `AnchoredPopover`, `SettingsPopover` → shadcn Popover.
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

## Verification

- `npx tsc -b` clean.
- Full `npx vitest run` green (Dropdown suite 33/33, Toggle 3/3,
  HoverTooltip 4/4 after adaptation to Radix semantics).
- Dev preview (`npm run dev`, port 1420) not exercised in this session —
  visual pass in the real app still recommended before building on this.
