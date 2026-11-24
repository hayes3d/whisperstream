import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(cleanup);

import { Toggle } from "./Toggle";

describe("Toggle", () => {
  it("renders the current state and keeps the switch role/name contract", () => {
    render(<Toggle checked onChange={vi.fn()} ariaLabel="Example setting" />);

    const toggle = screen.getByRole("switch", { name: "Example setting" });
    expect(toggle).toBeEnabled();
    expect(toggle).toHaveAttribute("aria-checked", "true");
  });

  it("reports the flipped value on click", () => {
    const onChange = vi.fn();
    render(<Toggle checked onChange={onChange} ariaLabel="Example setting" />);

    fireEvent.click(screen.getByRole("switch", { name: "Example setting" }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it("is non-interactive when disabled", () => {
    const onChange = vi.fn();
    render(
      <Toggle
        checked={false}
        onChange={onChange}
        disabled
        ariaLabel="Example setting"
      />,
    );

    const toggle = screen.getByRole("switch", { name: "Example setting" });
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
