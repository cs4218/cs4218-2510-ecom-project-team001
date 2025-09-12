import {
  getProductController,
  getSingleProductController,
  productPhotoController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
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
import orderModel from '../models/orderModel.js';
import fs from 'fs';
import slugify from 'slugify';
import braintree from 'braintree';


describe("Product Controller Tests", () => {
  let req, res, mockProduct, mockCategory;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();


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


  describe("getProductController", () => {
    test("should get all products successfully", async () => {
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

      await getProductController(req, res);

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
      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        countTotal: mockProducts.slice(0, 12).length,
        message: "All Products",
        products: mockProducts.slice(0, 12),
      });

    });
      

    test("should handle database errors", async () => {
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

      await getProductController(req, res);

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
      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      await getSingleProductController(req, res);

      expect(productModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        message: "Single Product Fetched",
        product: mockProduct,
      });
    });

    test("should handle missing product data", async () => {
      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null),
        }),
      });

      await getSingleProductController(req, res);

      expect(productModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Product not found",
      });
    });

    test("should handle database errors", async () => {
      const error = new Error("Database error");
      productModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          populate: jest.fn().mockRejectedValue(error),
        }),
      });

      await getSingleProductController(req, res);

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
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProduct),
      });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(res.set).toHaveBeenCalledWith("Content-type", mockProduct.photo.contentType);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(mockProduct.photo.data);
    });

    test("should handle missing photo data", async () => {
      const productWithoutPhoto = { ...mockProduct, photo: { data: null } };
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(productWithoutPhoto),
      });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Photo not found",
      });
    });

    test("should handle missing product", async () => {
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith(req.params.pid);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Photo not found",
      });
    });

    test("should handle database errors", async () => {
      const error = new Error("Database error");
      productModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await productPhotoController(req, res);

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
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

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
      req.body.checked = [];
      req.body.radio = [];
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        products: mockProducts,
      });
    });

    test("should handle invalid filters", async () => {
      req.body.checked = "invalid-category";
      req.body.radio = (100, 500);
      const error = new Error("Invalid filter");
      productModel.find = jest.fn().mockRejectedValue(error);

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while filtering products",
        error,
      });
    });

    test("should handle database errors", async () => {
      const error = new Error("Database error");
      productModel.find = jest.fn().mockRejectedValue(error);

      await productFiltersController(req, res);
      //TODO: check if 400 is ok
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while filtering products",
        error,
      });
    });
  });

  describe("productCountController", () => {
    test("should return product count successfully", async () => {
      const mockCount = 25;
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: jest.fn().mockResolvedValue(mockCount),
      });

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        total: mockCount,
      });
    });

    test("should handle database errors", async () => {
      const error = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: jest.fn().mockRejectedValue(error),
      })

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in product count",
        error,
      });
    });
  });

  describe("productListController", () => {
    test("should return paginated products successfully with default page number", async () => {
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

      await productListController(req, res);

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

      await productListController(req, res);

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

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in per page control",
        error,
      });
    });
  });

  describe("searchProductController", () => {
    test("should search products successfully", async () => {
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(mockProducts),
      });

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: req.params.keyword, $options: "i" } },
          { description: { $regex: req.params.keyword, $options: "i" } },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    test("should handle missing keyword", async () => {
      req.params.keyword = undefined;
      const error = new Error("Missing keyword");
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in Search Product API",
        error,
      });
    });

    test("should handle database errors", async () => {
      const error = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockRejectedValue(error),
      });

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error in Search Product API",
        error,
      });
    });
  });

  describe("relatedProductController", () => {
    test("should return related products successfully", async () => {
      const mockProducts = [mockProduct];
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockResolvedValue(mockProducts),
          }),
        }),
      });

      await relatedProductController(req, res);

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

    test("should handle database error", async () => {
      const error = new Error("Database error");
      productModel.find = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockRejectedValue(error),
          }),
        }),
      });

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting related products",
        error,
      });
    });
  });

  describe("productCategoryController", () => {
    test("should return products by category successfully", async () => {
      const mockProducts = [mockProduct];
      categoryModel.findOne = jest.fn().mockResolvedValue(mockCategory);
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProducts),
      });

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(productModel.find).toHaveBeenCalledWith({ category: mockCategory });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith({
        success: true,
        category: mockCategory,
        products: mockProducts,
      });
    });

    test("should handle missing category data", async () => {
      const error = new Error("Database error");
      categoryModel.findOne = jest.fn().mockResolvedValue(null);
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error),
      });

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(productModel.find).toHaveBeenCalledWith({ category: null });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting products",
        error,
      });
    });

    test("should handle database errors", async () => {
      const error = new Error("Database error");
      categoryModel.findOne = jest.fn().mockRejectedValue(error);
      productModel.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(error),
      });

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: req.params.slug });
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith({
        success: false,
        message: "Error while getting products",
        error,
      });
    });
  });
});