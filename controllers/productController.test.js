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
} from '../controllers/productController.js';

// Mock all dependencies
jest.mock('../models/productModel.js');
jest.mock('../models/categoryModel.js');
jest.mock('../models/orderModel.js');
jest.mock('fs');
jest.mock('slugify');
jest.mock('braintree');

import productModel from '../models/productModel.js';
import categoryModel from '../models/categoryModel.js';
import fs from 'fs';
import slugify from 'slugify';

// General structure generated with the help of AI
describe("Product Controller Tests", () => {
  let req, res, mockProduct, mockCategory;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.spyOn(console, "log").mockImplementation(() => {});

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
    console.log.mockRestore(); // restore original console.log
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
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
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
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
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
      expect(productModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
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
      expect(res.set).toHaveBeenCalledWith("Content-type", mockProduct.photo.contentType);
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

    test("should handle invalid filters", async () => {
      // Arrange
      req.body.checked = "invalid-category";
      req.body.radio = (100, 500);
      const error = new Error("Invalid filter");
      productModel.find = jest.fn().mockRejectedValue(error);

      // Act
      await productFiltersController(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Invalid filter",
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
      })

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
    test("should return paginated products successfully with default page number", async () => {
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
      expect(mockQuery.select).toHaveBeenCalledWith('-photo');
      expect(mockQuery.skip).toHaveBeenCalledWith(0); // (page-1)*perPage
      expect(mockQuery.limit).toHaveBeenCalledWith(6);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

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
      expect(mockQuery.select).toHaveBeenCalledWith('-photo');
      expect(mockQuery.skip).toHaveBeenCalledWith((2 - 1) * 6); // (page-1)*perPage
      expect(mockQuery.limit).toHaveBeenCalledWith(6);
      expect(mockQuery.sort).toHaveBeenCalledWith({ createdAt: -1 });

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
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
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(productModel.find).toHaveBeenCalledWith({ category: mockCategory });
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

    test("should handle missing category data", async () => {
      // Arrange
      const error = new Error("Database error");
      categoryModel.findOne = jest.fn().mockResolvedValue(null);
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error),
      });

      // Act
      await productCategoryController(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(productModel.find).toHaveBeenCalledWith({ category: null });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting products",
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
      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting products",
        error,
      });
    });
  });
});