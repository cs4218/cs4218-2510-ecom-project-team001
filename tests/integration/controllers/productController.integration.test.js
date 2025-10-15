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
