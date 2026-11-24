import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { LocationAutocomplete } from "./location-autocomplete";

describe("LocationAutocomplete", () => {
  it("renders input with default placeholder", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("search_suburb...")).toBeInTheDocument();
  });

  it("renders input with custom placeholder", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} placeholder="Enter suburb" />);
    expect(screen.getByPlaceholderText("Enter suburb")).toBeInTheDocument();
  });

  it("shows suburb suggestions when typing", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Terrigal" } });
    expect(screen.getByText("Terrigal")).toBeInTheDocument();
    expect(screen.getByText("NSW 2260")).toBeInTheDocument();
  });

  it("calls onChange when a suburb is selected", () => {
    const onChange = vi.fn();
    render(<LocationAutocomplete value="" onChange={onChange} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Terrigal" } });
    const option = screen.getByRole("button", { name: /Terrigal/ });
    fireEvent.click(option);
    expect(onChange).toHaveBeenCalledWith("terrigal_2260", "Terrigal");
  });

  it("shows a saved suburb as a readable location instead of its database value", () => {
    render(<LocationAutocomplete value="noraville_2263" onChange={vi.fn()} />);
    expect(screen.getByRole("combobox")).toHaveValue("NORAVILLE, NSW, 2263");
    expect(screen.getByText("Saved suburb · search above to change it")).toBeInTheDocument();
    expect(screen.queryByText("noraville_2263")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Terrigal" } });
    expect(screen.getByText("Terrigal")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Terrigal")).not.toBeInTheDocument();
  });

  it("opens dropdown on focus when results exist", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Terrigal" } });
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Terrigal")).not.toBeInTheDocument();
    fireEvent.focus(input);
    expect(screen.getByText("Terrigal")).toBeInTheDocument();
  });

  it("does not show dropdown for empty query", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("shows multiple matching suburbs", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Gosford" } });
    expect(screen.getByText("Gosford")).toBeInTheDocument();
    expect(screen.getByText("North Gosford")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} className="my-location" />);
    const wrapper = screen.getByRole("combobox").closest("div.relative");
    expect(wrapper).toHaveClass("my-location");
  });

  it("updates query text to the selected full suburb", () => {
    render(<LocationAutocomplete value="" onChange={vi.fn()} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "Terrigal" } });
    const option = screen.getByRole("button", { name: /Terrigal/ });
    fireEvent.click(option);
    expect(input).toHaveValue("TERRIGAL, NSW, 2260");
  });
});
