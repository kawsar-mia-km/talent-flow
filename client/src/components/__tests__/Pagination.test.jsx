import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Pagination from "../Pagination";

describe("Pagination", () => {
  it("renders nothing when there is only one page", () => {
    const { container } = render(<Pagination page={1} totalPages={1} onChange={() => {}} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the current page and total pages", () => {
    render(<Pagination page={2} totalPages={5} onChange={() => {}} />);
    expect(screen.getByText("Page 2 of 5")).toBeInTheDocument();
  });

  it("disables the previous button on the first page", () => {
    render(<Pagination page={1} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText("Previous page")).toBeDisabled();
    expect(screen.getByLabelText("Next page")).not.toBeDisabled();
  });

  it("disables the next button on the last page", () => {
    render(<Pagination page={3} totalPages={3} onChange={() => {}} />);
    expect(screen.getByLabelText("Next page")).toBeDisabled();
  });

  it("calls onChange with the next page number when clicked", async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} totalPages={4} onChange={onChange} />);

    await user.click(screen.getByLabelText("Next page"));
    expect(onChange).toHaveBeenCalledWith(3);

    await user.click(screen.getByLabelText("Previous page"));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});
