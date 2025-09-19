import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CategoryForm from "./CategoryForm";
import userEvent from "@testing-library/user-event";

describe("CategoryForm", () => {
  let handleSubmit;

  beforeAll(() => {
    handleSubmit = jest.fn((e) => e?.preventDefault?.());
  });

  it("calls setValue when ChangeEvent fired (input entered)", () => {
    // Arrange
    const setValue = jest.fn();
    render(
      <CategoryForm handleSubmit={handleSubmit} value="" setValue={setValue} />
    );
    const input = screen.getByPlaceholderText(/Enter new category/i);

    // Act
    fireEvent.change(input, { target: { value: "Books" } });

    // Assert
    expect(setValue).toHaveBeenCalledWith("Books");
  });

  it("submits the form and calls handleSubmit once", () => {
    // Arrange
    const setValue = jest.fn();
    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value="Stationery"
        setValue={setValue}
      />
    );
    const button = screen.getByRole("button", { name: /submit/i });

    // Act
    fireEvent.click(button);

    // Assert
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not allow input beyond maxLength (50)", async () => {
    // Arrange
    const Wrapper = () => {
      const [val, setVal] = React.useState("");
      return (
        <CategoryForm
          handleSubmit={handleSubmit}
          value={val}
          setValue={setVal}
        />
      );
    };

    render(<Wrapper />);
    const input = screen.getByPlaceholderText(/Enter new category/i);

    // exceeds maxLength=50
    const overlong = "a".repeat(60);

    // Act

    // Self-note: Wrapping react state changes in test cases with act()
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      userEvent.type(input, overlong);
    });

    // Assert
    expect(input.value.length).toBe(50);
    expect(input.value).toBe("a".repeat(50));
  });
});
