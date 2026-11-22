import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { HomeStatusHeader, type HomeStatusHeaderProps } from "../HomeStatusHeader";

afterEach(cleanup);

const base: HomeStatusHeaderProps = {
  connected: true,
  speechModelDownloaded: true,
  switchingToModel: null,
  downloadInFlight: false,
  speechModelName: "NVIDIA Parakeet",
  cleanupLabel: "Stream-1 Mini",
  pushToTalkShortcut: "ctrl+space",
  toggleShortcut: "ctrl+alt+space",
  stats: { words: "210", time: "3m", transcriptions: "24" },
};

const status = () => screen.getByRole("status").textContent;

describe("HomeStatusHeader", () => {
  it("says ready only when connected and the configured model is downloaded", () => {
    render(<HomeStatusHeader {...base} />);
    expect(status()).toBe("Ready to dictate");
  });

  it("never claims ready before the model inventory has loaded", () => {
    render(<HomeStatusHeader {...base} speechModelDownloaded={null} />);
    expect(status()).toBe("Checking your speech model…");
  });

  it("reports disconnects, switches and downloads ahead of readiness", () => {
    const { rerender } = render(<HomeStatusHeader {...base} connected={false} />);
    expect(status()).toBe("Connecting to Whisperstream…");
    rerender(<HomeStatusHeader {...base} switchingToModel="Cohere Transcribe" />);
    expect(status()).toBe("Switching to Cohere Transcribe…");
    rerender(<HomeStatusHeader {...base} downloadInFlight />);
    expect(status()).toBe("Downloading a speech model…");
    rerender(<HomeStatusHeader {...base} speechModelDownloaded={false} />);
    expect(status()).toBe("Choose a speech model to start dictating");
  });

  it("drops a missing shortcut clause and offers to set one when both are empty", () => {
    const onNavigate = vi.fn();
    const { rerender } = render(
      <HomeStatusHeader {...base} toggleShortcut="" onNavigate={onNavigate} />,
    );
    expect(screen.getByText(/to talk/)).toBeInTheDocument();
    expect(screen.queryByText(/to start and stop/)).toBeNull();

    rerender(
      <HomeStatusHeader {...base} pushToTalkShortcut="" toggleShortcut="" onNavigate={onNavigate} />,
    );
    expect(screen.getByText("No dictation shortcut is set.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Set a shortcut" }));
    expect(onNavigate).toHaveBeenCalledWith("controls");
  });

  it("links cleanup to Enhancement only when the host can navigate", () => {
    const { rerender } = render(<HomeStatusHeader {...base} />);
    expect(screen.queryByRole("button", { name: "Stream-1 Mini" })).toBeNull();

    const onNavigate = vi.fn();
    rerender(<HomeStatusHeader {...base} onNavigate={onNavigate} />);
    fireEvent.click(screen.getByRole("button", { name: "Stream-1 Mini" }));
    expect(onNavigate).toHaveBeenCalledWith("enhancement");
  });
});
