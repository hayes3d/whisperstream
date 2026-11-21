import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HoverTooltip } from "../HoverTooltip";

afterEach(cleanup);

describe("HoverTooltip", () => {
  it("shows the frost-glass bubble on hover", async () => {
    const user = userEvent.setup();
    render(
      <HoverTooltip content="Helpful detail">
        <span>Trigger</span>
      </HoverTooltip>,
    );

    expect(screen.queryByRole("tooltip")).toBeNull();
    await user.hover(screen.getByText("Trigger"));

    const bubble = await screen.findByRole("tooltip");
    expect(bubble).toHaveTextContent("Helpful detail");
    // Glacier overlay styling lives on the shadcn TooltipContent classes.
    expect(bubble.className).toContain("--surface-overlay");
    expect(bubble.className).toContain("--border-emphasis");
  });

  it("applies the caller's width class and stable bubble id", async () => {
    const user = userEvent.setup();
    render(
      <HoverTooltip
        content="Profile: Code"
        width="w-64"
        bubbleId="transcript-provenance-42"
      >
        <span>Enhanced</span>
      </HoverTooltip>,
    );

    await user.hover(screen.getByText("Enhanced"));
    const bubble = await screen.findByRole("tooltip");
    expect(bubble.className).toContain("w-64");
    expect(bubble.id).toBe("transcript-provenance-42");
  });

  it("maps explicit placement to Radix side/align", async () => {
    const user = userEvent.setup();
    render(
      <HoverTooltip content="Above" side="top">
        <span>Trigger</span>
      </HoverTooltip>,
    );

    await user.hover(screen.getByText("Trigger"));
    const bubble = await screen.findByRole("tooltip");
    expect(bubble.getAttribute("data-side")).toBe("top");
    expect(bubble.getAttribute("data-align")).toBe("center");
  });

  it("renders only the trigger when content is null", () => {
    render(
      <HoverTooltip content={null} bubbleId="unused-tooltip">
        <span>Trigger only</span>
      </HoverTooltip>,
    );

    expect(screen.getByText("Trigger only")).toBeTruthy();
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(document.getElementById("unused-tooltip")).toBeNull();
  });
});
