import categoryModel from "../models/categoryModel.js";
import slugify from "slugify";
import {
  createCategoryController,
  updateCategoryController,
  deleteCategoryController,
  categoryController,
  singleCategoryController,
} from "./categoryController.js";

const RANDOM_OBJECT_ID = "64b2f7f9e3a9d1a2b5c12345";

// Set up mocks
jest.mock("../models/categoryModel.js", () => {
  const constructor = jest.fn();
  constructor.findOne = jest.fn();
  constructor.find = jest.fn();
  constructor.findByIdAndUpdate = jest.fn();
  constructor.findByIdAndDelete = jest.fn();
  return { __esModule: true, default: constructor };
});

jest.mock("slugify", () => ({
  __esModule: true,
  default: (s) => String(s).toLowerCase(),
}));

const mockedRes = {
  status: jest.fn(),
  send: jest.fn(),
};

// Set up state
beforeEach(() => {
  jest.clearAllMocks();
});

beforeAll(() => {
  mockedRes.status.mockReturnValue(mockedRes);
  mockedRes.send.mockReturnValue(mockedRes);
});

describe("categoryController", () => {
  describe("createCategoryController", () => {
    // Note: HTTP status codes are obviously wrong, but because this is a unit test, we don't want
    // to introduce integration bug. TODO: consult on this
    test("returns 401 unauthorized when name is missing", async () => {
      // Arrange
      const req = { body: { named: "some wrong prop" } };

      // Act
      await createCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findOne).not.toHaveBeenCalled();
      expect(mockedRes.status).toHaveBeenCalledWith(401);
      expect(mockedRes.send).toHaveBeenCalledWith({
        message: "Name is required",
      });
    });

    test("creates category and returns 201 with category in response", async () => {
      // Arrange
      categoryModel.findOne.mockResolvedValue(null);

      // Mock constructor to return an object with save()
      categoryModel.mockImplementation(({ name, slug }) => ({
        save: jest
          .fn()
          .mockResolvedValue({ _id: RANDOM_OBJECT_ID, name, slug }),
      }));
      const reqBody = { name: "Stationery" };
      const req = { body: reqBody };

      // Act
      await createCategoryController(req, mockedRes);

      // Assert - communication-based testing
      expect(slugify).toBeDefined();
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        name: reqBody.name,
      });
      expect(mockedRes.status).toHaveBeenCalledWith(201);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "new category created",
          category: expect.objectContaining({
            name: "Stationery",
            slug: "stationery",
          }),
        })
      );
    });

    test("returns 409 Conflict when category already exists", async () => {
      // Arrange
      categoryModel.findOne.mockResolvedValue({
        _id: RANDOM_OBJECT_ID,
        name: "Books",
      });

      const req = { body: { name: "Books" } };

      // Act
      await createCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Books" });
      expect(mockedRes.status).toHaveBeenCalledWith(409);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Category Already Exists",
        })
      );
    });

    test("on create error, return a internal server error (code 500) response with error", async () => {
      // Arrange
      categoryModel.findOne.mockRejectedValue(new Error("db down"));
      const req = { body: { name: "Gadgets" } };

      // Act
      await expect(
        createCategoryController(req, mockedRes)
      ).resolves.not.toThrow();

      // Assert - status(500) is invoked before building the invalid response object throws
      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Gadgets" });
      expect(mockedRes.status).toHaveBeenCalledWith(500);
      // send called with error object as part of response
      expect(mockedRes.send).toHaveBeenCalled();
    });

    test("on submit duplicate category, return a conflict response (code 409)", async () => {
      // Arrange
      categoryModel.findOne.mockResolvedValue({ name: "Books" });
      const req = { body: { name: "Books" } };

      // Act
      await createCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Books" });
      expect(mockedRes.status).toHaveBeenCalledWith(409);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Category Already Exists",
        })
      );
    });
  });

  describe("updateCategoryController", () => {
    test("updates and returns 200 with success, message and category props", async () => {
      // Arrange
      const mockedFindByIdAndUpdate = categoryModel.findByIdAndUpdate;
      mockedFindByIdAndUpdate.mockResolvedValue({
        _id: RANDOM_OBJECT_ID,
        name: "Pineapple",
        slug: "pineapple",
      });

      const req = {
        params: { id: RANDOM_OBJECT_ID },
        body: { name: "Pineapple" },
      };

      // Act
      await updateCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        RANDOM_OBJECT_ID,
        { name: "Pineapple", slug: "pineapple" },
        { new: true }
      );
      expect(mockedRes.status).toHaveBeenCalledWith(200);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Category Updated Successfully",
          category: expect.objectContaining({
            name: "Pineapple",
            slug: "pineapple",
          }),
          success: true,
        })
      );
    });

    test("on update error, return a internal server error (code 500) response with error", async () => {
      // Arrange
      categoryModel.findByIdAndUpdate.mockRejectedValue(new Error("db down"));
      const req = { params: { id: RANDOM_OBJECT_ID }, body: { name: "Books" } };

      // Act
      await updateCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        RANDOM_OBJECT_ID,
        { name: "Books", slug: "books" },
        { new: true }
      );
      expect(mockedRes.status).toHaveBeenCalledWith(500);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while updating category",
        })
      );
    });
  });

  describe("deleteCategoryController", () => {
    test("deletes and returns 200 with success and message props", async () => {
      // Arrange
      categoryModel.findByIdAndDelete.mockResolvedValue({ acknowledged: true });
      const req = { params: { id: RANDOM_OBJECT_ID } };

      // Act
      await deleteCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(
        RANDOM_OBJECT_ID
      );
      expect(mockedRes.status).toHaveBeenCalledWith(200);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Category Deleted Successfully",
        })
      );
    });

    test("on delete error, return a internal server error (code 500) response with error", async () => {
      // Arrange
      categoryModel.findByIdAndDelete.mockRejectedValue(new Error("db down"));
      const req = { params: { id: RANDOM_OBJECT_ID } };

      // Act
      await deleteCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(
        RANDOM_OBJECT_ID
      );
      expect(mockedRes.status).toHaveBeenCalledWith(500);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "error while deleting category",
        })
      );
    });
  });

  describe("categoryController", () => {
    test("queries list of categories from db and returns a 200 ok response with list of categories", async () => {
      // Arrange
      categoryModel.find.mockResolvedValue([{ _id: "1" }, { _id: "2" }]);
      const req = {};

      // Act
      await categoryController(req, mockedRes);

      // Assert
      expect(categoryModel.find).toHaveBeenCalled();
      expect(mockedRes.status).toHaveBeenCalledWith(200);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "All Categories List",
          category: expect.any(Array),
        })
      );
    });

    test("on list error, return a internal server error (code 500) response with error", async () => {
      // Arrange
      categoryModel.find.mockRejectedValue(new Error("db down"));
      const req = {};

      // Act
      await categoryController(req, mockedRes);

      // Assert
      expect(categoryModel.find).toHaveBeenCalled();
      expect(mockedRes.status).toHaveBeenCalledWith(500);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting all categories",
        })
      );
    });
  });

  describe("singleCategoryController", () => {
    test("query a single category and returns a 200 ok response with a single category", async () => {
      // Arrange
      categoryModel.findOne.mockResolvedValue({
        _id: RANDOM_OBJECT_ID,
        slug: "x",
      });

      const req = { params: { slug: "x" } };

      // Act
      await singleCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "x" });
      expect(mockedRes.status).toHaveBeenCalledWith(200);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Get Single Category Successfully",
        })
      );
    });

    test("on error, return a internal server error (code 500) response with error", async () => {
      // Arrange
      categoryModel.findOne.mockRejectedValue(new Error("db down"));
      const req = { params: { slug: "x" } };

      // Act
      await singleCategoryController(req, mockedRes);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "x" });
      expect(mockedRes.status).toHaveBeenCalledWith(500);
      expect(mockedRes.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While getting Single Category",
        })
      );
    });
  });
});
