import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import CategoryForm from "./CategoryForm";
import userEvent from "@testing-library/user-event";

describe("CategoryForm", () => {
  test("setValue called when ChangeEvent fired (input entered)", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const setValue = jest.fn();
    render(
      <CategoryForm handleSubmit={handleSubmit} value="" setValue={setValue} />
    );
    const input = screen.getByPlaceholderText(/Enter new category/i);
    fireEvent.change(input, { target: { value: "Books" } });
    expect(setValue).toHaveBeenCalledWith("Books");
  });

  test("submits the form and calls handleSubmit once", () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
    const setValue = jest.fn();
    render(
      <CategoryForm
        handleSubmit={handleSubmit}
        value="Stationery"
        setValue={setValue}
      />
    );
    const button = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(button);
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  test("does not allow input beyond maxLength (50)", async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault());
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
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      userEvent.type(input, overlong);
    });

    expect(input.value.length).toBe(50);
    expect(input.value).toBe("a".repeat(50));
  });
});
