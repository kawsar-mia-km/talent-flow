import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ToastStack from "../Toast";

describe("ToastStack", () => {
  it("renders nothing when there are no toasts", () => {
    const { container } = render(<ToastStack toasts={[]} onDismiss={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("announces a success toast politely via role=status", () => {
    render(<ToastStack toasts={[{ id: 1, message: "Saved successfully" }]} onDismiss={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent("Saved successfully");
  });

  it("announces an error toast assertively via role=alert", () => {
    render(<ToastStack toasts={[{ id: 1, message: "Something failed", variant: "error" }]} onDismiss={() => {}} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Something failed");
  });

  it("calls onDismiss with the toast id when the dismiss button is clicked", async () => {
    const onDismiss = vi.fn();
    const user = userEvent.setup();
    render(<ToastStack toasts={[{ id: 42, message: "Hello" }]} onDismiss={onDismiss} />);

    await user.click(screen.getByLabelText("Dismiss"));
    expect(onDismiss).toHaveBeenCalledWith(42);
  });
});
