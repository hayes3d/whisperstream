import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { PrimaryButton } from "../PrimaryButton";

afterEach(cleanup);

describe("PrimaryButton (stock shadcn default)", () => {
  it("is a solid primary rounded-md button with a flat shadow, no glow", () => {
    render(<PrimaryButton>Continue</PrimaryButton>);
    const button = screen.getByRole("button", { name: "Continue" });

    expect(button.className).toContain("rounded-md");
    expect(button.style.background).toBe("var(--accent-fill)");
    expect(button.style.boxShadow).toBe("var(--shadow-glass-sm)");

    fireEvent.mouseEnter(button);
    expect(button.style.boxShadow).not.toContain("--color-frost");
  });

  it("dims to half opacity when disabled", () => {
    render(<PrimaryButton disabled>Continue</PrimaryButton>);
    expect(screen.getByRole("button", { name: "Continue" }).style.opacity).toBe("0.5");
  });
});
