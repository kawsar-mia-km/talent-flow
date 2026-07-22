import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import FieldError, { inputErrorClass } from "../FieldError";

describe("FieldError", () => {
  it("renders nothing when there is no message", () => {
    const { container } = render(<FieldError message="" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the message with role=alert so screen readers announce it", () => {
    render(<FieldError id="email-error" message="Enter a valid email address." />);
    const el = screen.getByRole("alert");
    expect(el).toHaveTextContent("Enter a valid email address.");
    expect(el).toHaveAttribute("id", "email-error");
  });
});

describe("inputErrorClass", () => {
  it("returns an empty string when there's no error", () => {
    expect(inputErrorClass(false)).toBe("");
  });

  it("returns error-styling classes when there is an error", () => {
    expect(inputErrorClass(true)).toContain("border-rose-400");
  });
});
