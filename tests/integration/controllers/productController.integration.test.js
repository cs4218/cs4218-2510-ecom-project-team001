import request from "supertest";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../utils/db.js";
import JWT from "jsonwebtoken";
import slugify from "slugify";

import categoryModel from "../../../models/categoryModel.js";
import userModel from "../../../models/userModel.js";
import productModel from "../../../models/productModel.js";

import app from "../../../server.js";

jest.setTimeout(25000);

let authToken;
let gadgetCategory;
let tinyBuffer;

beforeAll(async () => {
  await connectToTestDb("jest-productrs-int");

  // For photo uploads
  tinyBuffer = Buffer.from("tiny");
});

afterAll(async () => {
  await disconnectFromTestDb();
});

beforeEach(async () => {
  await resetTestDb();

  const adminUser = await userModel.create({
    name: "Admin",
    email: "admin@test.com",
    password: "password",
    phone: "12345678",
    address: "National University of Singapore",
    answer: "blue",
    role: 1,
  });
  authToken = JWT.sign(
    { _id: adminUser._id },
    process.env.JWT_SECRET || "test-secret"
  );

  gadgetCategory = await categoryModel.create({
    name: "Gadgets",
    slug: "gadgets",
  });
});

describe("productController integration", () => {
  test("POST /create-product should create a product (201)", async () => {
    const res = await request(app)
      .post("/api/v1/product/create-product")
      .set("authorization", authToken)
      .field("name", "Test Product")
      .field("description", "A test product")
      .field("price", "199")
      .field("category", gadgetCategory._id.toString())
      .field("quantity", "5")
      .field("shipping", "1")
      .attach("photo", tinyBuffer, "tiny.png");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      message: "Product Created Successfully",
    });
    expect(res.body.products).toBeDefined();
    expect(res.body.products.name).toBe("Test Product");

    // Assert it exists in DB
    const doc = await productModel.findById(res.body.products._id);
    expect(doc).not.toBeNull();
    expect(doc.name).toBe("Test Product");
  });

  test("PUT /update-product/:pid should update product (201)", async () => {
    // Arrange: create a product directly in DB first
    const original = await productModel.create({
      name: "Original Product",
      slug: slugify("Original Product"),
      description: "Original description",
      price: 100,
      category: gadgetCategory._id,
      quantity: 2,
      shipping: true,
    });

    const res = await request(app)
      .put(`/api/v1/product/update-product/${original._id}`)
      .set("authorization", authToken)
      .field("name", "Updated Product")
      .field("description", "Updated description")
      .field("price", "249")
      .field("category", gadgetCategory._id.toString())
      .field("quantity", "8")
      .field("shipping", "1")
      .attach("photo", tinyBuffer, "tiny.png");

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      message: "Product Updated Successfully",
    });
    expect(res.body.products).toBeDefined();
    expect(res.body.products.name).toBe("Updated Product");

    const updated = await productModel.findById(original._id);
    expect(updated).not.toBeNull();
    expect(updated.name).toBe("Updated Product");
    expect(updated.price).toBe(249);
  });

  test("DELETE /delete-product/:pid should delete product (200)", async () => {
    // Arrange: create a product to delete
    const toDelete = await productModel.create({
      name: "Delete Me",
      slug: slugify("Delete Me"),
      description: "Temp",
      price: 50,
      category: gadgetCategory._id,
      quantity: 1,
      shipping: true,
    });

    const res = await request(app).delete(
      `/api/v1/product/delete-product/${toDelete._id}`
    );

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Product Deleted successfully",
    });

    const deleted = await productModel.findById(toDelete._id);
    expect(deleted).toBeNull();
  });
});

/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. components/SearchInput.js
2. controllers/productController.js (searchProductController)
3. /models/productModel.js
=====================================================

*/
describe("searchProductController integration", () => {
  test("GET /api/v1/product/search/:keyword should return matching products (200)", async () => {
    // Arrange: create sample products
    await productModel.create({
      name: "Wireless Mouse",
      slug: slugify("Wireless Mouse"),
      description: "A smooth and fast mouse for productivity",
      price: 39,
      category: gadgetCategory._id,
      quantity: 12,
      shipping: true,
    });

    await productModel.create({
      name: "Mechanical Keyboard",
      slug: slugify("Mechanical Keyboard"),
      description: "Tactile switches for better typing experience",
      price: 99,
      category: gadgetCategory._id,
      quantity: 8,
      shipping: false,
    });

    // Act: send relevant api request
    const res = await request(app).get("/api/v1/product/search/mouse");

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].name).toBe("Wireless Mouse");
    expect(res.body[0]).not.toHaveProperty("photo");
  });

  test("GET /api/v1/product/search/:keyword should return multiple products when more than one match (200)", async () => {
    // Arrange: create multiple products sharing the keyword "Mouse"
    await productModel.create({
      name: "Wireless Mouse",
      slug: slugify("Wireless Mouse"),
      description: "A smooth and fast mouse for productivity",
      price: 39,
      category: gadgetCategory._id,
      quantity: 12,
      shipping: true,
    });

    await productModel.create({
      name: "Gaming Mousepad",
      slug: slugify("Gaming Mousepad"),
      description: "A high-precision surface for mouse tracking",
      price: 15,
      category: gadgetCategory._id,
      quantity: 20,
      shipping: true,
    });

    await productModel.create({
      name: "Mechanical Keyboard",
      slug: slugify("Mechanical Keyboard"),
      description: "Tactile switches for better typing experience",
      price: 99,
      category: gadgetCategory._id,
      quantity: 8,
      shipping: false,
    });

    // Act: send relevant api request
    const res = await request(app).get("/api/v1/product/search/mouse");

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(2); // should find both "Wireless Mouse" and "Gaming Mousepad"
    const names = res.body.map((p) => p.name);
    expect(names).toEqual(
      expect.arrayContaining(["Wireless Mouse", "Gaming Mousepad"])
    );
  });

  test("GET /api/v1/product/search/:keyword should return empty array when no matches (200)", async () => {
    // Arrange: no relevant product

    // Act: send relevant api request
    const res = await request(app).get("/api/v1/product/search/camera");

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test("GET /api/v1/product/search/:keyword should return 404 when keyword missing", async () => {
    // Arrange: no keyword provided

    // Act: send relevant api request
    const res = await request(app).get("/api/v1/product/search/");

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(404);
  });

  test("GET /api/v1/product/search/:keyword should handle DB error gracefully (500)", async () => {
    // Arrange: simulate DB failure safely
    const spy = jest.spyOn(productModel, "find").mockReturnValue({
      select: () => Promise.reject("DB crashed"),
    });

    // Act: send relevant api request
    const res = await request(app).get("/api/v1/product/search/mouse");

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "Error in Search Product API",
    });

    spy.mockRestore();
  });
});

// Product Data Retrieval Integration between ProductDetails and getProductController
describe("GET /api/v1/product/get-product/:slug", () => {
  let testProduct;
  beforeEach(async () => {
    testProduct = await productModel.create({
      name: "Test Smartphone",
      slug: slugify("Test Smartphone"),
      description: "A test smartphone",
      price: 999,
      category: gadgetCategory._id,
      quantity: 10,
      shipping: true,
      photo: {
        data: tinyBuffer,
        contentType: "image/jpeg",
      },
    });
  });

  test("should fetch a single product by slug successfully", async () => {
    const res = await request(app)
      .get(`/api/v1/product/get-product/${testProduct.slug}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("Single Product Fetched");
    expect(res.body.product).toBeDefined();
    expect(res.body.product.name).toBe("Test Smartphone");
    expect(res.body.product.slug).toBe(testProduct.slug);
    expect(res.body.product.price).toBe(999);
    expect(res.body.product.photo).toBeUndefined(); // Photo should be excluded
    expect(res.body.product.category).toBeDefined();
    expect(res.body.product.category.name).toBe("Gadgets");
  });

  test("should return 404 when product with given slug does not exist", async () => {
    const res = await request(app)
      .get("/api/v1/product/get-product/non-existent-slug")
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Product not found");
  });
});

// Product Data Retrieval between ProductDetails and productPhotoController
describe("GET /api/v1/product/product-photo/:pid", () => {
  let testProduct;
  beforeEach(async () => {
    testProduct = await productModel.create({
      name: "Test Smartphone",
      slug: slugify("Test Smartphone"),
      description: "A test smartphone",
      price: 999,
      category: gadgetCategory._id,
      quantity: 10,
      shipping: true,
      photo: {
        data: tinyBuffer,
        contentType: "image/jpeg",
      },
    });
  });

  test("should fetch product photo successfully", async () => {
    const res = await request(app)
      .get(`/api/v1/product/product-photo/${testProduct._id}`)
      .expect(200);

    expect(res.headers["content-type"]).toBe("image/jpeg");
    expect(res.body).toEqual(tinyBuffer);
  });

  test("should return 404 when product does not exist", async () => {
    const fakeId = "507f1f77bcf86cd799439011"; // Valid ObjectId format
    const res = await request(app)
      .get(`/api/v1/product/product-photo/${fakeId}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Photo not found");
  });

  test("should return 404 when product exists but has no photo", async () => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const productWithoutPhoto = await productModel.create({
      name: "No Photo Product",
      slug: slugify("No Photo Product"),
      description: "Product without photo",
      price: 500,
      category: gadgetCategory._id,
      quantity: 5,
      shipping: false,
    });

    const res = await request(app)
      .get(`/api/v1/product/product-photo/${productWithoutPhoto._id}`)
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe("Photo not found");
  });

  test("should handle invalid product ID format", async () => {
    const res = await request(app)
      .get("/api/v1/product/product-photo/invalid-id")
      .expect(500);

    expect(res.body.success).toBe(false);
  });
});

// Related Products API Integration between ProductDetails and realtedProductController
describe("GET /api/v1/product/related-product/:pid/:cid - realtedProductController", () => {
  let relatedProduct1;
  let relatedProduct2;
  let relatedProduct3;
  let differentCategoryProduct;
  let electronicsCategory;
  let testProduct;

  beforeEach(async () => {
    // Create multiple products in the same category
    relatedProduct1 = await productModel.create({
      name: "Related Phone 1",
      slug: slugify("Related Phone 1"),
      description: "First related phone",
      price: 799,
      category: gadgetCategory._id,
      quantity: 5,
      shipping: true,
    });

    relatedProduct2 = await productModel.create({
      name: "Related Phone 2",
      slug: slugify("Related Phone 2"),
      description: "Second related phone",
      price: 699,
      category: gadgetCategory._id,
      quantity: 8,
      shipping: true,
    });

    relatedProduct3 = await productModel.create({
      name: "Related Phone 3",
      slug: slugify("Related Phone 3"),
      description: "Third related phone",
      price: 599,
      category: gadgetCategory._id,
      quantity: 12,
      shipping: false,
    });

    // Create a product in a different category
    electronicsCategory = await categoryModel.create({
      name: "Electronics",
      slug: "electronics",
    });

    differentCategoryProduct = await productModel.create({
      name: "Laptop",
      slug: slugify("Laptop"),
      description: "A laptop",
      price: 1299,
      category: electronicsCategory._id,
      quantity: 3,
      shipping: true,
    });

    testProduct = await productModel.create({
      name: "Test Smartphone",
      slug: slugify("Test Smartphone"),
      description: "A test smartphone",
      price: 999,
      category: gadgetCategory._id,
      quantity: 10,
      shipping: true,
      photo: {
        data: tinyBuffer,
        contentType: "image/jpeg",
      },
    });
  });

  test("should fetch related products successfully", async () => {
    const res = await request(app)
      .get(`/api/v1/product/related-product/${testProduct._id}/${gadgetCategory._id}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.products).toBeDefined();
    expect(res.body.products.length).toBeLessThanOrEqual(3);

    // Should not include the test product itself
    const productIds = res.body.products.map(p => p._id.toString());
    expect(productIds).not.toContain(testProduct._id.toString());

    // should only return products from the same category
    res.body.products.forEach(product => {
      expect(product.category._id.toString()).toBe(gadgetCategory._id.toString());
    });
  });

  test("should limit results to 3 products maximum", async () => {
    let relatedProduct4 = await productModel.create({
      name: "Related Phone 4",
      slug: slugify("Related Phone 4"),
      description: "Fourth related phone",
      price: 599,
      category: gadgetCategory._id,
      quantity: 12,
      shipping: false,
    });

    const res = await request(app)
      .get(`/api/v1/product/related-product/${testProduct._id}/${gadgetCategory._id}`)
      .expect(200);

    expect(res.body.products.length).toBeLessThanOrEqual(3);
  });

  test("should return 404 when product id is missing", async () => {
    const res = await request(app)
      .get(`/api/v1/product/related-product//${gadgetCategory._id}`)
      .expect(404); // Handles this as 404, not reaching the controller
  });

  test("should return 404 when category id is missing", async () => {
    const res = await request(app)
      .get(`/api/v1/product/related-product/${testProduct._id}/`)
      .expect(404); // Handles this as 404, not reaching the controller
  });

  test("should return empty array when no related products exist", async () => {
    // Create a new category with only one product
    const loneCategory = await categoryModel.create({
      name: "Lone Category",
      slug: "lone-category",
    });

    const loneProduct = await productModel.create({
      name: "Lone Product",
      slug: slugify("Lone Product"),
      description: "Only product in category",
      price: 999,
      category: loneCategory._id,
      quantity: 1,
      shipping: true,
    });

    const res = await request(app)
      .get(`/api/v1/product/related-product/${loneProduct._id}/${loneCategory._id}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.products).toEqual([]);
  });

  test("should handle when category has products but none are related", async () => {
    const res = await request(app)
      .get(`/api/v1/product/related-product/${differentCategoryProduct._id}/${electronicsCategory._id}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.products).toEqual([]);
  });
});