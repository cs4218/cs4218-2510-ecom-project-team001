import { renderHook, waitFor } from "@testing-library/react";
import axios from "axios";
import useCategory from "../hooks/useCategory";
import app from "../../../server.js";
import { connectToTestDb, resetTestDb, disconnectFromTestDb } from "../../../tests/utils/db.js";
import categoryModel from "../../../models/categoryModel.js";

// This test tests the integration between useCategory hook and categoryController
jest.setTimeout(25000);

let server;
const TEST_PORT = 8082;

beforeAll(async () => {
  await connectToTestDb("jest-category-hook-int");
  
  server = app.listen(TEST_PORT);
  
  axios.defaults.baseURL = `http://localhost:${TEST_PORT}`;
});

afterAll(async () => {
  await disconnectFromTestDb();
  // Stop the server
  await new Promise((resolve) => server.close(resolve));
});

beforeEach(async () => {
  await resetTestDb();
});

describe("useCategory Hook - Integration Tests", () => {
  test("should fetch and return categories when they exist", async () => {
    const testCategories = [
      { name: "Electronics", slug: "electronics" },
      { name: "Clothing", slug: "clothing" },
      { name: "Books", slug: "books" }
    ];
    await categoryModel.insertMany(testCategories);

    const { result } = renderHook(() => useCategory());

    await waitFor(() => {
      expect(result.current).toHaveLength(3);
    });

    expect(result.current[0].name).toBe("Electronics");
    expect(result.current[0].slug).toBe("electronics");
    expect(result.current[1].name).toBe("Clothing");
    expect(result.current[1].slug).toBe("clothing");
    expect(result.current[2].name).toBe("Books");
    expect(result.current[2].slug).toBe("books");
  });
});