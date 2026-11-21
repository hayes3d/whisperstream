import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsPopover } from "../SettingsPopover";

afterEach(cleanup);

function renderPopover() {
  const onClearAll = vi.fn();
  render(
    <SettingsPopover
      historyEnabled
      onHistoryChange={vi.fn()}
      saveAudio
      onSaveAudioChange={vi.fn()}
      retentionDays={7}
      onRetentionChange={vi.fn()}
      onClearAll={onClearAll}
    />,
  );
  return { onClearAll };
}

const gear = () => screen.getByRole("button", { name: "Transcript settings", hidden: true });

describe("SettingsPopover (Radix Popover)", () => {
  it("opens from the gear, exposes its menu, and toggles closed on a second press", async () => {
    renderPopover();
    expect(screen.queryByRole("menu")).toBeNull();
    fireEvent.click(gear());
    expect(await screen.findByRole("menu", { name: "Transcript settings" })).toBeInTheDocument();
    expect(gear()).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(gear());
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("closes on Escape and on an outside press", async () => {
    renderPopover();
    fireEvent.click(gear());
    await screen.findByRole("menu");
    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());

    fireEvent.click(gear());
    await screen.findByRole("menu");
    await userEvent.setup({ pointerEventsCheck: 0 }).click(document.body);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });

  it("closes after Delete all transcripts and calls the handler", async () => {
    const { onClearAll } = renderPopover();
    fireEvent.click(gear());
    fireEvent.click(await screen.findByRole("button", { name: "Delete all transcripts" }));
    expect(onClearAll).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
  });
});
