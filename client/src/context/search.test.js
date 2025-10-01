import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSearch, SearchProvider } from "./search";

// chatgpt is used to aid in creation of the unit tests
const Consumer = () => {
  const [values, setValues] = useSearch();
  return (
    <div>
      <span data-testid="keyword">{values.keyword}</span>
      <span data-testid="results">{values.results.join(",")}</span>
      <button onClick={() => setValues({ keyword: "abc", results: ["x", "y"] })}>
        Update
      </button>
    </div>
  );
};

describe("SearchContext", () => {
  it("initializes with empty keyword and results", () => {
    render(
      <SearchProvider>
        <Consumer />
      </SearchProvider>
    );
    expect(screen.getByTestId("keyword").textContent).toBe("");
    expect(screen.getByTestId("results").textContent).toBe("");
  });

  it("updates keyword and results when setValues is called", async () => {
    render(
      <SearchProvider>
        <Consumer />
      </SearchProvider>
    );
    await userEvent.click(screen.getByRole("button", { name: /update/i }));
    expect(screen.getByTestId("keyword").textContent).toBe("abc");
    expect(screen.getByTestId("results").textContent).toBe("x,y");
  });
});
