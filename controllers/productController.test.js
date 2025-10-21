import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  realtedProductController,
  productCategoryController,
  braintreeTokenController,
  brainTreePaymentController,
  deleteProductController,
  updateProductController,
  createProductController,
} from "../controllers/productController.js";

// Mock all dependencies
jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("../models/orderModel.js");
jest.mock("fs");
jest.mock("slugify");
jest.mock("braintree", () => ({
  BraintreeGateway: jest.fn(() => {
    return {
      clientToken: {
        generate: jest.fn(),
      },
      transaction: {
        sale: jest.fn(),
      },
    };
  }),
  Environment: {
    Sandbox: "Sandbox",
  },
}));
const gatewayMock = braintree.BraintreeGateway.mock.results[0].value;
const makeRes = () => {
  const res = {};
  res.status = jest.fn(() => res);
  res.send = jest.fn(() => res);
  res.json = jest.fn(() => res);
  res.set = jest.fn(() => res);
  return res;
};

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import orderModel from "../models/orderModel.js";

// General structure generated with the help of AI
describe("Product Controller Tests", () => {
  let req, res, mockProduct, mockCategory, consoleSpy;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    // Mock request and response objects
    req = {
      fields: {
        name: "Test Product",
        description: "Test Description",
        price: 100,
        category: "category-id",
        quantity: 10,
        shipping: true,
      },
      files: {
        photo: {
          path: "/tmp/photo.jpg",
          type: "image/jpeg",
          size: 500000,
        },
      },
      params: {
        slug: "test-product",
        pid: "product-id",
        page: 1,
        keyword: "test",
        cid: "category-id",
      },
      body: {
        checked: ["category1", "category2"],
        radio: [100, 500],
        nonce: "payment-nonce",
        cart: [{ price: 100 }, { price: 200 }],
      },
      user: {
        _id: "user-id",
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
    };

    mockProduct = {
      _id: "product-id",
      name: "Test Product",
      description: "Test Description",
      price: 100,
      category: "category-id",
      quantity: 10,
      photo: {
        data: Buffer.from("fake-image-data"),
        contentType: "image/jpeg",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    mockCategory = {
      _id: "category-id",
      name: "Test Category",
      slug: "test-category",
    };

    // Setup default mocks
    slugify.mockReturnValue("test-product");
    fs.readFileSync.mockReturnValue(Buffer.from("fake-image-data"));
  });

  afterAll(() => {
    consoleSpy.mockRestore(); // restore original console.log
  });

  describe("getProductController", () => {
    test("should get all products successfully", async () => {
      // Arrange
      const mockProducts = [mockProduct, { ...mockProduct, _id: "product-2" }];

      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockProducts),
            }),
          }),
        }),
      });

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.length,
        message: "All Products",
        products: mockProducts,
      });
    });

    //TODO: to discuss whether 12 products is ok for its use case in admin/products
    test("should return 12 products when there's more than 12 products", async () => {
      // Arrange
      let mockProducts = [];

      mockProducts = Array.from({ length: 15 }, (_, i) => ({
        ...mockProduct,
        _id: `product-${i + 1}`,
      }));

      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockResolvedValue(mockProducts.slice(0, 12)),
            }),
          }),
        }),
      });

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.slice(0, 12).length,
        message: "All Products",
        products: mockProducts.slice(0, 12),
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockRejectedValue(error),
            }),
          }),
        }),
      });

      // Act
      await getProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in getting products",
        error: error.message,
      });
    });
  });

  describe("getSingleProductController", () => {
    test("should get single product successfully", async () => {
      // Arrange
      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(productModel.findOne).toHaveBeenCalledWith({
        slug: req.params.slug,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });
    });

    test("should handle missing product data", async () => {
      // Arrange
      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(productModel.findOne).toHaveBeenCalledWith({
        slug: req.params.slug,
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Product not found",
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(error),
        }),
      });

      // Act
      await getSingleProductController(req, res);

      // Assert
      expect(productModel.findOne).toHaveBeenCalledWith({
        slug: req.params.slug,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting single product",
        error,
      });
    });
  });

  describe("productPhotoController", () => {
    test("should return product photo successfully", async () => {
      // Arrange
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProduct),
      });

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(res.set).toHaveBeenCalledWith(
        "Content-type",
        mockProduct.photo.contentType
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
    });

    test("should handle missing photo data", async () => {
      // Arrange
      const productWithoutPhoto = { ...mockProduct, photo: { data: null } };
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(productWithoutPhoto),
      });

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Photo not found",
      });
    });

    test("should handle missing product", async () => {
      // Arrange
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Photo not found",
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      // Act
      await productPhotoController(req, res);

      // Assert
      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting photo",
        error,
      });
    });
  });

  describe("productFiltersController", () => {
    // Equivalence partitioning is used to divide the input filters into partitions
    // for test case generation
    test("should filter products successfully", async () => {
      // Arrange
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockResolvedValue(mockProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: req.body.checked,
        price: { $gte: req.body.radio[0], $lte: req.body.radio[1] },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    test("should handle empty filters", async () => {
      // Arrange
      req.body.checked = [];
      req.body.radio = [];
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockResolvedValue(mockProducts);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    test("should handle invalid price range where min > max", async () => {
      // Arrange
      req.body.checked = [];
      req.body.radio = [500, 100]; // Invalid: min > max
      const error = new Error("Invalid filter values");

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid filter values",
          error,
        })
      );
    });

    test("should handle negative price values", async () => {
      // Arrange
      req.body.checked = [];
      req.body.radio = [-100, 500];
      const error = new Error("Invalid filter values");

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid filter values",
          error,
        })
      );
    });

    test("should handle invalid price range but valid category", async () => {
      // Arrange
      req.body.radio = [-500, 100]; // Invalid: min > max
      const error = new Error("Invalid filter values");

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid filter values",
          error,
        })
      );
    });

    test("should handle valid price range but invalid category", async () => {
      // Arrange
      req.body.checked = "invalid category";
      const error = new Error("Invalid filter type");

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Invalid filter type",
          error,
        })
      );
    });

    test("should handle invalid filters", async () => {
      // Arrange
      req.body.checked = "invalid-category";
      req.body.radio = [1, 2, 3];
      const error = new Error("Invalid filter type");
      productModel.find = jest.fn().mockRejectedValue(error);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid filter type",
        error,
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      productModel.find = jest.fn().mockRejectedValue(error);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while filtering products",
        error,
      });
    });
  });

  describe("createProductController", () => {
    afterEach(() => {
      productModel.mockReset();
    });

    beforeEach(() => {
      const defaultDoc = {
        ...req.fields,
        slug: "test-product",
        photo: {},
        save: jest.fn().mockResolvedValue(true),
      };
      productModel.mockImplementation(() => defaultDoc);
    });

    // Technique: Decision Table Testing — conditions are presence of required fields; actions are
    // whether the order will be created. the respective error messages verifies validation and
    // returns 400 bad request with the specific error message when any field is missing, without
    // db calls.
    test.each([
      ["name", undefined, "Name is Required"],
      ["description", undefined, "Description is Required"],
      ["price", undefined, "Price is Required"],
      ["category", undefined, "Category is Required"],
      ["quantity", undefined, "Quantity is Required"],
      ["shipping", undefined, "Shipping is Required"],
      ["photo", undefined, "Photo is Required and should be less than 1mb"],
    ])(
      "returns 400 bad request when %s is missing",
      async (missingField, missingValue, expectedError) => {
        // Arrange
        const reqMissingField = {
          fields: { ...req.fields, [missingField]: missingValue },
          files: missingField === "photo" ? {} : req.files,
        };

        // Act
        await createProductController(reqMissingField, res);

        // Assert
        expect(productModel).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ error: expectedError });
      }
    );

    // Technique: Boundary Value Analysis — tests the photo size limit by providing a photo on
    // the 1MB boundary
    test("successfully uploads photo on 1MB boundary", async () => {
      // Arrange
      const reqWithBoundaryPhoto = {
        ...req,
        files: {
          photo: {
            path: "/tmp/photo.jpg",
            type: "image/jpeg",
            size: 1000000,
          },
        },
      };

      // Act
      await createProductController(reqWithBoundaryPhoto, res);

      // Assert - response 201 created
      expect(productModel).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Created Successfully",
        })
      );
    });

    // Technique: Boundary Value Analysis — tests the photo size limit by providing a photo just
    // below the 1MB boundary
    test("successfully uploads photo just below 1MB boundary", async () => {
      // Arrange
      const reqWithBoundaryPhoto = {
        ...req,
        files: {
          photo: {
            path: "/tmp/photo.jpg",
            type: "image/jpeg",
            size: 999999,
          },
        },
      };

      // Act
      await createProductController(reqWithBoundaryPhoto, res);

      // Assert - response 201 created
      expect(productModel).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/product created successfully/i),
        })
      );
    });

    // Technique: Boundary Value Analysis — tests the photo size limit by providing a photo just
    // above the 1MB boundary
    test("fails to upload photo just above 1MB boundary", async () => {
      // Arrange
      const reqWithBoundaryPhoto = {
        ...req,
        files: {
          photo: {
            path: "/tmp/photo.jpg",
            type: "image/jpeg",
            size: 1000001,
          },
        },
      };

      // Act
      await createProductController(reqWithBoundaryPhoto, res);

      // Assert - response 400 bad request
      expect(productModel).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: expect.stringMatching(
          /photo is required and should be less than 1mb/i
        ),
      });
    });

    // Technique: Combinatorial Testing — selection of some pairs of valid factor levels to ensure
    // that product is created correctly and persisted
    const imageBufferStub = Buffer.from("fake-image-data");

    beforeEach(() => {
      jest.clearAllMocks();
      fs.readFileSync = jest.fn().mockReturnValue(imageBufferStub);
    });

    test.each([
      [
        "shipping",
        { shipping: "0" },
        { photo: { path: "fake-path", size: 500, type: "image/jpeg" } },
      ],
      [
        "category",
        { category: "Books" },
        { photo: { path: "fake-path", size: 500, type: "image/jpeg" } },
      ],
      [
        "name",
        { name: "New Product" },
        { photo: { path: "fake-path", size: 500, type: "image/jpeg" } },
      ],
    ])(
      "creates product with varied %s + photo",
      async (_label, fieldOverride, fileOverride) => {
        // Arrange
        const saveMock = jest.fn().mockResolvedValue(true);
        const productDoc = {
          ...req.fields,
          ...fieldOverride,
          slug: slugify(fieldOverride.name ?? req.fields.name),
          photo: {},
          save: saveMock,
        };

        productModel.mockImplementation(() => productDoc);

        const newReq = {
          fields: { ...req.fields, ...fieldOverride },
          files: { ...req.files, ...fileOverride },
        };

        // Act
        await createProductController(newReq, res);

        // Assert
        expect(productModel).toHaveBeenCalledWith({
          ...newReq.fields,
          slug: slugify(newReq.fields?.name),
        });
        expect(fs.readFileSync).toHaveBeenCalledWith(newReq.files?.photo?.path);
        expect(productDoc.photo.data).toEqual(imageBufferStub);
        expect(saveMock).toHaveBeenCalled();

        // Response Assertions
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: expect.stringMatching(/product created successfully/i),
            products: productDoc,
          })
        );
      }
    );

    // Technique: Control Flow Testing — forces the catch block by surfacing a model save failure,
    // asserting the error log and the 500 failure payload execute.
    test("returns 500 when persistence throws", async () => {
      // Arrange
      const failingDoc = {
        ...req.fields,
        slug: "test-product",
        photo: {},
        save: jest.fn().mockRejectedValue(new Error("db down")),
      };
      productModel.mockImplementation(() => failingDoc);

      // Act
      await createProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in creating product",
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe("updateProductController", () => {
    const makeUpdatedDoc = (overrides = {}) => ({
      ...req.fields,
      slug: "test-product",
      photo: {},
      save: jest.fn().mockResolvedValue(true),
      ...overrides,
    });

    beforeEach(() => {
      productModel.findByIdAndUpdate = jest
        .fn()
        .mockResolvedValue(makeUpdatedDoc());
      fs.readFileSync.mockClear();
    });

    afterEach(() => {
      productModel.findByIdAndUpdate.mockReset();
    });

    // Technique: Decision Table Testing — conditions are presence of required fields; actions are
    // validation error responses. the test iterates through each required field, setting it to an
    // invalid value, and asserts that the controller responds with a 400 status and the appropriate
    // error message without calling the database update.
    test.each([
      ["name", "", "Name is Required"],
      ["description", "", "Description is Required"],
      ["price", "", "Price is Required"],
      ["category", "", "Category is Required"],
      ["quantity", "", "Quantity is Required"],
      ["shipping", undefined, "Shipping is Required"],
    ])(
      "returns 400 when %s is missing",
      async (missingField, missingValue, expectedError) => {
        // Arrange
        const reqMissingField = {
          ...req,
          fields: { ...req.fields, [missingField]: missingValue },
          files: missingField === "photo" ? {} : req.files,
        };

        // Act
        await updateProductController(reqMissingField, res);

        // Assert
        expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.send).toHaveBeenCalledWith({ error: expectedError });
      }
    );

    // Technique: Boundary Value Analysis — tests the photo size limit by providing a photo on
    // the 1MB boundary
    test("accepts a photo exactly at the 1MB limit", async () => {
      // Arrange
      const reqWithBoundaryPhoto = {
        ...req,
        files: {
          photo: {
            ...req.files.photo,
            size: 1000000,
          },
        },
      };
      const updatedDoc = makeUpdatedDoc();
      productModel.findByIdAndUpdate.mockResolvedValue(updatedDoc);

      // Act
      await updateProductController(reqWithBoundaryPhoto, res);

      // Assert
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        req.params.pid,
        { ...reqWithBoundaryPhoto.fields, slug: "test-product" },
        { new: true }
      );

      expect(updatedDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/product updated successfully/i),
          products: updatedDoc,
        })
      );
    });

    // Technique: Boundary Value Analysis — tests the photo size limit by providing a photo just
    // below the 1MB boundary
    test("accepts a photo just below the 1MB limit", async () => {
      // Arrange
      const reqWithBoundaryPhoto = {
        ...req,
        files: {
          photo: {
            ...req.files.photo,
            size: 999999,
          },
        },
      };
      const updatedDoc = makeUpdatedDoc();
      productModel.findByIdAndUpdate.mockResolvedValue(updatedDoc);

      // Act
      await updateProductController(reqWithBoundaryPhoto, res);

      // Assert
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        req.params?.pid,
        { ...reqWithBoundaryPhoto.fields, slug: "test-product" },
        { new: true }
      );

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/product updated successfully/i),
          products: updatedDoc,
        })
      );
    });

    // Technique: Boundary Value Analysis — tests the photo size limit by providing a photo just
    // above the 1MB boundary
    test("rejects a photo just above the 1MB limit", async () => {
      // Arrange
      const reqWithBoundaryPhoto = {
        ...req,
        files: {
          photo: {
            ...req.files.photo,
            size: 1000001,
          },
        },
      };

      // Act
      await updateProductController(reqWithBoundaryPhoto, res);

      // Assert
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        error: expect.stringMatching(
          /photo is required and should be less than 1mb/i
        ),
      });
    });

    // Technique: Combinatorial Testing — selection of some pairs of valid factor levels to ensure
    // that product is updated correctly and persisted
    test.each([
      [
        "shipping flag toggled",
        { shipping: "0" },
        {
          photo: {
            path: "/tmp/updated-photo-1.jpg",
            size: 750000,
            type: "image/png",
          },
        },
      ],
      [
        "name change",
        { name: "Updated Product" },
        {
          photo: {
            path: "/tmp/updated-photo-2.jpg",
            size: 800000,
            type: "image/jpeg",
          },
        },
      ],
      [
        "category swap",
        { category: "alt-category-id" },
        {
          photo: {
            path: "/tmp/updated-photo-3.jpg",
            size: 250000,
            type: "image/webp",
          },
        },
      ],
    ])(
      "updates product with %s",
      async (_label, fieldOverride, fileOverride) => {
        // Arrange
        const comboReq = {
          ...req,
          fields: { ...req.fields, ...fieldOverride },
          files: { ...req.files, ...fileOverride },
        };
        const updatedDoc = makeUpdatedDoc({
          ...comboReq.fields,
          photo: {},
        });
        productModel.findByIdAndUpdate.mockResolvedValue(updatedDoc);

        // Act
        await updateProductController(comboReq, res);

        // Assert
        expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
          req.params.pid,
          { ...comboReq.fields, slug: "test-product" },
          { new: true }
        );

        expect(updatedDoc.save).toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: expect.stringMatching(/product updated successfully/i),
            products: updatedDoc,
          })
        );
      }
    );

    // Technique: Control Flow Testing — triggers the catch path by forcing the model update to reject, verifying error propagation and logging.
    test("returns 500 when update operation fails", async () => {
      // Arrange
      const failure = new Error("db down");
      productModel.findByIdAndUpdate.mockRejectedValue(failure);

      // Act
      await updateProductController(req, res);

      // Assert
      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        req.params.pid,
        { ...req.fields, slug: "test-product" },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/error in updating product/i),
          error: failure,
        })
      );
    });
  });

  describe("deleteProductController", () => {
    beforeEach(() => {
      productModel.findByIdAndDelete = jest.fn();
    });

    // Technique: Equivalence Partitioning — selects a typical existing product id from the
    // existing product partition. Tests the happy-path delete scenario, returns 200 OK.
    test("deletes product and returns success payload", async () => {
      // Arrange
      const selectMock = jest.fn().mockResolvedValue({ acknowledged: true });
      productModel.findByIdAndDelete.mockReturnValue({ select: selectMock });

      // Act
      await deleteProductController(req, res);

      // Assert
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
        req.params.pid
      );
      expect(selectMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: expect.stringMatching(/product deleted successfully/i),
      });
    });

    // Technique: Control Flow Testing — forces the catch clause by making the model reject,
    // verifying 500 Internal Server Error HTTP response.
    test("returns 500 when deletion throws", async () => {
      // Arrange
      const errorStub = new Error("db down");
      const selectMock = jest.fn().mockRejectedValue(errorStub);
      productModel.findByIdAndDelete.mockReturnValue({ select: selectMock });

      // Act
      await deleteProductController(req, res);

      // Assert
      expect(selectMock).toHaveBeenCalled();
      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
        req.params.pid
      );
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: expect.stringMatching(/error while deleting product/i),
        error: errorStub,
      });
    });
  });

  describe("productCountController", () => {
    test("should return product count successfully", async () => {
      // Arrange
      const mockCount = 25;
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: jest.fn().mockResolvedValue(mockCount),
      });

      // Act
      await productCountController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: mockCount,
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: jest.fn().mockRejectedValue(error),
      });

      // Act
      await productCountController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in product count",
        error,
      });
    });
  });

  describe("productListController", () => {
    // Boundary Value Analysis for page numbers
    // Boundary value: page number 1
    test("should return paginated products successfully with default page number 1", async () => {
      // Arrange
      req.params.page = undefined;

      const mockProducts = [mockProduct];
      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
      };

      mockQuery.sort.mockResolvedValue(mockProducts);
      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.skip).toHaveBeenCalledWith(0); // (page-1)*perPage
      expect(mockQuery.limit).toHaveBeenCalledWith(6);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    // Above boundary value: page number 2
    test("should return paginated products successfully with custom page number", async () => {
      // Arrange
      req.params.page = 2;
      const mockProducts = [mockProduct, { ...mockProduct, _id: "product-2" }];

      const mockQuery = {
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
      };

      mockQuery.sort.mockResolvedValue(mockProducts);

      productModel.find.mockReturnValue(mockQuery);

      // Act
      await productListController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({});
      expect(mockQuery.select).toHaveBeenCalledWith("-photo");
      expect(mockQuery.skip).toHaveBeenCalledWith((2 - 1) * 6); // (page-1)*perPage
      expect(mockQuery.limit).toHaveBeenCalledWith(6);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    // Below boundary value: page number 0
    test("should return 400 with page number 0", async () => {
      // Arrange
      req.params.page = 0;
      const error = new Error("Page number should be greater than 0");

      // Act
      await productListController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Page number should be greater than 0",
        error,
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");

      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              sort: jest.fn().mockRejectedValue(error),
            }),
          }),
        }),
      });

      // Act
      await productListController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in per page control",
        error,
      });
    });
  });

  describe("searchProductController", () => {
    test("should search products successfully", async () => {
      // Arrange
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProducts),
      });

      // Act
      await searchProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: req.params.keyword, $options: "i" } },
          { description: { $regex: req.params.keyword, $options: "i" } },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    test("should handle missing keyword", async () => {
      // Arrange
      req.params.keyword = undefined;
      const error = new Error("Keyword is required");
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Keyword is required",
        error,
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      // Act
      await searchProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in Search Product API",
        error,
      });
    });
  });

  describe("realtedProductController", () => {
    // Equivalence partitioning on cid and pid
    test("should return related products successfully", async () => {
      // Arrange
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      // Act
      await realtedProductController(req, res);

      // Assert
      expect(productModel.find).toHaveBeenCalledWith({
        category: req.params.cid,
        _id: { $ne: req.params.pid },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    test("should handle missing category id", async () => {
      // Arrange
      req.params.pid = undefined;
      const error = new Error("Product id and category id are required");

      // Act
      await realtedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: error,
        message: "Product id and category id are required",
      });
    });

    test("should handle missing product id", async () => {
      // Arrange
      req.params.cid = undefined;
      const error = new Error("Product id and category id are required");

      // Act
      await realtedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: error,
        message: "Product id and category id are required",
      });
    });

    test("should handle missing category id and product id", async () => {
      // Arrange
      req.params.cid = undefined;
      req.params.pid = undefined;
      const error = new Error("Product id and category id are required");

      // Act
      await realtedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        error: error,
        message: "Product id and category id are required",
      });
    });

    test("should handle database error", async () => {
      // Arrange
      const error = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(error),
          }),
        }),
      });

      // Act
      await realtedProductController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting related products",
        error,
      });
    });
  });

  describe("productCategoryController", () => {
    test("should return products by category successfully", async () => {
      // Arrange
      const mockProducts = [mockProduct];
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProducts),
      });

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: req.params.slug,
      });
      expect(productModel.find).toHaveBeenCalledWith({
        category: mockCategory,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
        products: mockProducts,
      });
    });

    test("should return 400 when category slug is missing", async () => {
      // Arrange
      req.params.slug = undefined;
      const error = new Error("Category slug is required");

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category slug is required",
        error,
      });
    });

    test("should return 404 when category doesn't exist", async () => {
      // Arrange
      req.params.slug = "nonexistent-category";
      const error = new Error("Category not found");
      categoryModel.findOne.mockResolvedValue(null);

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: req.params.slug,
      });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Category not found",
        error,
      });
    });

    test("should handle database errors", async () => {
      // Arrange
      const error = new Error("Database error");
      categoryModel.findOne = jest.fn().mockRejectedValue(error);
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error),
      });

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: req.params.slug,
      });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting products",
        error,
      });
    });
  });

  describe("braintreeTokenController", () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test("should return token successfully", async () => {
      // Arrange
      const req = {};
      const res = makeRes();
      const fakeResponse = { clientToken: "abc123" };
      gatewayMock.clientToken.generate.mockImplementationOnce((_, callback) =>
        callback(null, fakeResponse)
      );

      // Act
      await braintreeTokenController(req, res);

      // Assert
      expect(gatewayMock.clientToken.generate).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith(fakeResponse);
    });

    test("should return 500 on error", async () => {
      // Arrange
      const req = {};
      const res = makeRes();
      const error = new Error("Error getting token");
      gatewayMock.clientToken.generate.mockImplementationOnce((_, callback) =>
        callback(error, null)
      );

      // Act
      await braintreeTokenController(req, res);

      // Assert
      expect(gatewayMock.clientToken.generate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(error);
    });

    test("should log error on console", async () => {
      // Arrange
      const req = {};
      const res = makeRes();
      const error = new Error("Error getting token");
      gatewayMock.clientToken.generate.mockImplementation((_, _callback) => {
        throw error;
      });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementationOnce(() => {});

      // Act
      await braintreeTokenController(req, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(error);
      consoleSpy.mockRestore();
    });
  });

  describe("brainTreePaymentController", () => {
    let request;
    let mockProduct = {
      _id: "product-id",
      name: "Test Product",
      description: "Test Description",
      price: 100,
      category: "category-id",
      quantity: 10,
      photo: {
        data: Buffer.from("fake-image-data"),
        contentType: "image/jpeg",
      },
      save: jest.fn().mockResolvedValue(true),
    };

    beforeEach(() => {
      jest.clearAllMocks();
      request = {
        body: {
          nonce: "fake-nonce",
          cart: [mockProduct],
        },
        user: { _id: "user-id" },
      };
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    test("should make payment successfully and create new order", async () => {
      // Arrange
      const res = makeRes();
      gatewayMock.transaction.sale.mockImplementation((_, callback) =>
        callback(null, { success: true })
      );
      orderModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
      }));

      // Act
      await brainTreePaymentController(request, res);

      // Assert
      expect(gatewayMock.transaction.sale).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ ok: true });
      expect(orderModel).toHaveBeenCalledTimes(1);
      expect(orderModel).toHaveBeenCalledWith({
        products: request.body.cart,
        payment: { success: true },
        buyer: request.user._id,
      });
    });

    test("should calculate total correctly", async () => {
      // Arrange
      const mockCart = [
        { _id: "prod1", price: 100, name: "Product 1" },
        { _id: "prod2", price: 200, name: "Product 2" },
      ];
      request.body.cart = mockCart;
      const res = makeRes();
      gatewayMock.transaction.sale.mockImplementation((_, callback) =>
        callback(null, { success: true })
      );
      orderModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
      }));

      // Act
      await brainTreePaymentController(request, res);

      // Assert
      const transactionTotal =
        gatewayMock.transaction.sale.mock.calls[0][0].amount;
      expect(transactionTotal).toBe(300);
      expect(res.json).toHaveBeenCalledWith({ ok: true });
    });

    test("should return error and not create order on empty cart", async () => {
      // Arrange
      request.body.cart = [];
      const res = makeRes();
      gatewayMock.transaction.sale.mockImplementation((_, callback) =>
        callback(null, { success: true })
      );
      orderModel.mockImplementation(() => ({
        save: jest.fn().mockResolvedValue(true),
      }));

      // Act
      await brainTreePaymentController(request, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith("Cart is empty");
      expect(orderModel).not.toHaveBeenCalled();
      expect(gatewayMock.transaction.sale).not.toHaveBeenCalled();
    });

    test("should return 500 on error", async () => {
      // Arrange
      const res = makeRes();
      const error = new Error("Payment failed");
      gatewayMock.transaction.sale.mockImplementation((_, callback) =>
        callback(error, null)
      );

      // Act
      await brainTreePaymentController(request, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(error);
      expect(orderModel).not.toHaveBeenCalled();
    });

    test("should log error on console", async () => {
      // Arrange
      const res = makeRes();
      const error = new Error("Payment failed");
      gatewayMock.transaction.sale.mockImplementation(() => {
        throw error;
      });
      const consoleSpy = jest
        .spyOn(console, "log")
        .mockImplementation(() => {});

      // Act
      await brainTreePaymentController(request, res);

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(error);
      expect(orderModel).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});
