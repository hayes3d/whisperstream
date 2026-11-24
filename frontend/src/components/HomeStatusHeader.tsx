import type { ReactNode } from "react";
import { KeyChip } from "./onboarding/KeyChip";

/** Where a Home status link can send the user. Mirrors the Sidebar tab ids it
 *  needs, so Home does not import the Sidebar's full TabId union. */
export type HomeStatusTarget = "controls" | "enhancement";

export interface HomeStatusHeaderProps {
  /** Backend socket is up. */
  connected: boolean;
  /** null while the speech-model inventory has not loaded yet: the header
   *  must not claim "ready" before it knows. */
  speechModelDownloaded: boolean | null;
  /** Display name of the model being activated, while a switch runs. */
  switchingToModel?: string | null;
  /** A language/model download owns the recognizer. */
  downloadInFlight: boolean;
  /** "NVIDIA Parakeet" etc.; null when no model is configured. */
  speechModelName: string | null;
  /** "Off", "Stream-1 Mini", "OpenAI · gpt-4o-mini", ... */
  cleanupLabel: string;
  pushToTalkShortcut: string;
  toggleShortcut: string;
  /** Pre-formatted lifetime totals; null until the stats request lands. */
  stats: { words: string; time: string; transcriptions: string } | null;
  /** Links render only when the host can navigate (tests mount Home bare). */
  onNavigate?: (target: HomeStatusTarget) => void;
}

type Tone = "ready" | "busy" | "idle";

function statusFor(p: HomeStatusHeaderProps): { tone: Tone; text: string } {
  if (!p.connected) return { tone: "idle", text: "Connecting to Whisperstream…" };
  if (p.switchingToModel) return { tone: "busy", text: `Switching to ${p.switchingToModel}…` };
  if (p.downloadInFlight) return { tone: "busy", text: "Downloading a speech model…" };
  if (p.speechModelDownloaded === null) return { tone: "idle", text: "Checking your speech model…" };
  if (!p.speechModelDownloaded || !p.speechModelName) {
    return { tone: "busy", text: "Choose a speech model to start dictating" };
  }
  return { tone: "ready", text: "Ready to dictate" };
}

const DOT: Record<Tone, string> = {
  ready: "var(--color-mint)",
  busy: "var(--color-gold-deep)",
  idle: "var(--color-steel)",
};

function LinkButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-slate underline-offset-4 hover:underline cursor-pointer"
    >
      {children}
    </button>
  );
}

/**
 * Home's lead: answers "is dictation working, and how do I start?" before
 * any setting. Status first, then the shortcuts, then what is active, then
 * lifetime totals as one quiet line. Unboxed on purpose: the rows below are
 * the page's structure, so the header sits on the page, not in a card.
 */
export function HomeStatusHeader(props: HomeStatusHeaderProps) {
  const { tone, text } = statusFor(props);
  const { pushToTalkShortcut: ptt, toggleShortcut: toggle, onNavigate, stats } = props;

  return (
    <header className="ml-8 mr-5 mb-1 pb-5 border-b shrink-0">
      <h2 className="flex items-center gap-2.5 text-[18px] font-medium text-slate">
        <span
          aria-hidden="true"
          className="size-2 rounded-full shrink-0"
          style={{ background: DOT[tone] }}
        />
        <span role="status">{text}</span>
      </h2>

      <p className="mt-2 text-sm text-steel leading-7">
        {ptt || toggle ? (
          <>
            {ptt && (
              <>
                Hold <KeyChip keys={ptt} /> to talk
              </>
            )}
            {ptt && toggle && ", or press "}
            {!ptt && toggle && "Press "}
            {toggle && (
              <>
                <KeyChip keys={toggle} /> to start and stop
              </>
            )}
            .
          </>
        ) : (
          <>No dictation shortcut is set.</>
        )}
        {onNavigate && (
          <>
            {" "}
            <LinkButton onClick={() => onNavigate("controls")}>
              {ptt || toggle ? "Change" : "Set a shortcut"}
            </LinkButton>
          </>
        )}
      </p>

      {/* The speech model has its own row right below; only the cleanup
          setup, which lives on another page, is summarised here. */}
      <p className="mt-1 text-xs text-steel">
        Cleanup:{" "}
        {onNavigate ? (
          <LinkButton onClick={() => onNavigate("enhancement")}>{props.cleanupLabel}</LinkButton>
        ) : (
          <span className="text-slate">{props.cleanupLabel}</span>
        )}
      </p>

      <p className="mt-1 text-xs text-steel tabular-nums">
        <span>{stats?.words ?? "—"}</span> words
        <span aria-hidden="true"> · </span>
        <span>{stats?.time ?? "—"}</span> recorded
        <span aria-hidden="true"> · </span>
        <span>{stats?.transcriptions ?? "—"}</span> transcriptions
      </p>
    </header>
  );
}
