import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

import { SkillAutocomplete } from "./skill-autocomplete";

describe("SkillAutocomplete", () => {
  it("renders input with placeholder", () => {
    render(<SkillAutocomplete value={[]} onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search skills…")).toBeInTheDocument();
  });

  it("shows placeholder when max skills reached", () => {
    render(
      <SkillAutocomplete value={["Electrical", "Plumbing"]} onChange={vi.fn()} maxSkills={2} />
    );
    expect(screen.getByPlaceholderText("Max 2 skills")).toBeInTheDocument();
  });

  it("disables input when max skills reached", () => {
    render(
      <SkillAutocomplete value={["Electrical", "Plumbing"]} onChange={vi.fn()} maxSkills={2} />
    );
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("shows suggestions when typing", () => {
    render(<SkillAutocomplete value={[]} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Electr" } });
    expect(screen.getByText("Electrical")).toBeInTheDocument();
  });

  it("adds a skill when suggestion is clicked", () => {
    const onChange = vi.fn();
    render(<SkillAutocomplete value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Electr" } });
    fireEvent.click(screen.getByText("Electrical"));
    expect(onChange).toHaveBeenCalledWith(["Electrical"]);
  });

  it("shows selected skills as chips", () => {
    render(<SkillAutocomplete value={["Electrical", "Plumbing"]} onChange={vi.fn()} />);
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    expect(screen.getByText("Plumbing")).toBeInTheDocument();
  });

  it("removes a skill when chip X is clicked", () => {
    const onChange = vi.fn();
    render(<SkillAutocomplete value={["Electrical", "Plumbing"]} onChange={onChange} />);
    const chips = screen.getAllByRole("button").filter((b) => b.querySelector("svg"));
    // The chip remove buttons are inline; click the first one
    const removeButtons = screen.getAllByRole("button").filter((b) => {
      const parent = b.closest("span");
      return parent && parent.textContent?.includes("Electrical");
    });
    fireEvent.click(removeButtons[0]);
    expect(onChange).toHaveBeenCalledWith(["Plumbing"]);
  });

  it("prevents adding duplicate skills", () => {
    const onChange = vi.fn();
    render(<SkillAutocomplete value={["Electrical"]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "electrical" } });
    // Even if suggestion appears, clicking should not add duplicate
    const suggestion = screen.queryByText("Electrical");
    if (suggestion) {
      fireEvent.click(suggestion);
    }
    expect(onChange).not.toHaveBeenCalled();
  });

  it("shows custom option when no exact match", () => {
    render(<SkillAutocomplete value={[]} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "CustomSkill" } });
    const customSkillSpan = screen.getByText("CustomSkill");
    const button = customSkillSpan.closest("button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("Add");
  });

  it("adds custom skill via button click", () => {
    const onChange = vi.fn();
    render(<SkillAutocomplete value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "CustomSkill" } });
    const addButton = screen.getAllByRole("button").find((b) => b.querySelector("svg"));
    if (addButton) fireEvent.click(addButton);
    expect(onChange).toHaveBeenCalledWith(["CustomSkill"]);
  });

  it("navigates suggestions with ArrowDown and selects with Enter", () => {
    const onChange = vi.fn();
    render(<SkillAutocomplete value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Electrical" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["Electrical"]);
  });

  it("closes dropdown with Escape", () => {
    render(<SkillAutocomplete value={[]} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Electr" } });
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByText("Electrical")).not.toBeInTheDocument();
  });

  it("closes dropdown when clicking outside", () => {
    render(<SkillAutocomplete value={[]} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Electr" } });
    expect(screen.getByText("Electrical")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByText("Electrical")).not.toBeInTheDocument();
  });

  it("shows max skills warning", () => {
    render(<SkillAutocomplete value={["A", "B", "C"]} onChange={vi.fn()} maxSkills={3} />);
    expect(screen.getByText("Maximum 3 skills allowed.")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<SkillAutocomplete value={[]} onChange={vi.fn()} className="my-autocomplete" />);
    const wrapper = screen.getByRole("textbox").closest("div.relative")?.parentElement;
    expect(wrapper).toHaveClass("my-autocomplete");
  });

  it("does not show suggestions for empty query", () => {
    render(<SkillAutocomplete value={[]} onChange={vi.fn()} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "" } });
    expect(screen.queryByText("Electrical")).not.toBeInTheDocument();
  });

  it("adds skill on Enter when dropdown is closed", () => {
    const onChange = vi.fn();
    render(<SkillAutocomplete value={[]} onChange={onChange} />);
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "CustomSkill" } });
    fireEvent.keyDown(input, { key: "Escape" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith(["CustomSkill"]);
  });
});
