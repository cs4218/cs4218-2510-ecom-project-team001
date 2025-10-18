import request from "supertest";
import bcrypt from "bcrypt";
import slugify from "slugify";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../utils/db.js";
import JWT from "jsonwebtoken";

import categoryModel from "../../../models/categoryModel.js";
import userModel from "../../../models/userModel.js";

import app from "../../../server.js";

jest.setTimeout(25000);

let authToken;
let adminUser;
let testCategory;

const TEST_SECRET = "test-secret";

beforeAll(async () => {
  await connectToTestDb("jest-category-int");
});

afterAll(async () => {
  await disconnectFromTestDb();
});

beforeEach(async () => {
  await resetTestDb();

  const hashed = await bcrypt.hash("adminpass", 10);
  adminUser = await userModel.create({
    name: "Admin",
    email: "admin@test.com",
    password: hashed,
    phone: "12345678",
    address: "123 Kent Ridge Bus Stop",
    answer: "blue",
    role: 1,
  });
  authToken = JWT.sign(
    { _id: adminUser._id },
    process.env.JWT_SECRET || TEST_SECRET
  );
  testCategory = await categoryModel.create({
    name: "Test Category",
    slug: slugify("Test Category"),
  });
});

/*
=====================================================
Integration testing involving
1. pages/Homepage.js
2. controllers/categoryController.js
3. /models/categoryModel.js
=====================================================
AI Declaration: Some tests below have been created with the help of AI
*/

describe("categoryController integration", () => {
  test("GET /get-category returns all existing categories", async () => {
    const res = await request(app).get("/api/v1/category/get-category");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.category)).toBe(true);
    expect(res.body.category.length).toBe(1);
    expect(res.body.category[0].name).toBe("Test Category");
    expect(res.body.message).toBe("All Categories List");
  });

  test("GET /get-category returns all categories after creating new categories", async () => {
    await categoryModel.create({
      name: "New1",
      slug: slugify("New1"),
    });
    await categoryModel.create({
      name: "New2",
      slug: slugify("New2"),
    });

    const res = await request(app).get("/api/v1/category/get-category");
    expect(res.status).toBe(200);
    expect(res.body.message).toBe("All Categories List");
    expect(Array.isArray(res.body.category)).toBe(true);
    expect(res.body.category.length).toBe(3);
    expect(res.body.category[0].name).toBe("Test Category");
    expect(res.body.category[1].name).toBe("New1");
    expect(res.body.category[2].name).toBe("New2");

    // Clean up
    await categoryModel.deleteMany({ name: { $in: ["New1", "New2"] } });
  });

  test("GET /get-category returns empty array when no categories exist", async () => {
    await categoryModel.deleteMany({});
    const res = await request(app).get("/api/v1/category/get-category");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.category)).toBe(true);
    expect(res.body.category.length).toBe(0);
  });

  test("GET /get-category returns 500 on error", async () => {
    jest.spyOn(categoryModel, "find").mockImplementationOnce(() => {
      throw new Error("Crash find()");
    });
    const res = await request(app).get("/api/v1/category/get-category");
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Error while getting all categories");
  });
});

describe("singleCategoryController integration", () => {
  test("GET /single-category/:slug returns the correct category", async () => {
    const res = await request(app).get(
      `/api/v1/category/single-category/${testCategory.slug}`
    );
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe("Test Category");
    expect(res.body.category.slug).toBe(testCategory.slug);
    expect(res.body.message).toBe("Get Single Category Successfully");
  });

  test("GET /single-category/:slug returns empty array when category does not exist", async () => {
    const res = await request(app).get(
      `/api/v1/category/single-category/non-existent-slug`
    );
    expect(res.status).toBe(200);
    expect(res.body.category).toBeNull();
  });

  test("GET /single-category/:slug returns correct new category", async () => {
    await categoryModel.create({
      name: "New1",
      slug: slugify("New1"),
    });
    const res = await request(app).get(
      `/api/v1/category/single-category/${slugify("New1")}`
    );
    expect(res.status).toBe(200);
    expect(res.body.category.name).toBe("New1");
    expect(res.body.category.slug).toBe("new1");
    expect(res.body.message).toBe("Get Single Category Successfully");

    // Clean up
    await categoryModel.deleteOne({ name: "New1" });
  });

  test("GET /single-category/:slug returns 500 on error", async () => {
    jest.spyOn(categoryModel, "findOne").mockImplementationOnce(() => {
      throw new Error("Crash findOne()");
    });
    const res = await request(app).get(
      `/api/v1/category/single-category/${testCategory.slug}`
    );
    expect(res.status).toBe(500);
    expect(res.body.message).toBe("Error while getting Single Category");
  });
});

/**
 * =================================================================================================
 * Integration testing (using ESM + supertest) involving
 * 1. controllers/categoryController.js (createCategoryController,
 *    updateCategoryController, deleteCategoryController)
 * 2. server.js (app)
 * 3. /models/categoryModel.js
 * 4. /routes/categoryRoutes.js
 * Covers:
 * - POST /api/v1/category/create-category
 * - PUT  /api/v1/category/update-category/:id
 * - DELETE /api/v1/category/delete-category/:id
 * =================================================================================================
 */
describe("create/update/deleteCategoryController integration", () => {
  let createdCategoryId;

  test("POST /create-category should create a category (201)", async () => {
    // Act
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("authorization", authToken)
      .send({ name: "Electronics" });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      success: true,
      message: "new category created",
    });
    expect(res.body.category).toBeDefined();
    expect(res.body.category.name).toBe("Electronics");

    createdCategoryId = res.body.category._id;

    const doc = await categoryModel.findById(createdCategoryId);
    expect(doc).not.toBeNull();
    expect(doc.name).toBe("Electronics");
  });

  test("PUT /update-category/:id should update category (200)", async () => {
    // Arrange: create a category for this test
    const toUpdate = await categoryModel.create({
      name: "Old Name",
      slug: slugify("Old Name"),
    });
    // Act
    const res = await request(app)
      .put(`/api/v1/category/update-category/${toUpdate._id}`)
      .set("authorization", authToken)
      .send({ name: "Gadgets" });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Category Updated Successfully",
    });
    expect(res.body.category).toBeDefined();
    expect(res.body.category.name).toBe("Gadgets");

    const updated = await categoryModel.findById(toUpdate._id);
    expect(updated).not.toBeNull();
    expect(updated.name).toBe("Gadgets");
  });

  test("DELETE /delete-category/:id should delete category (200)", async () => {
    // Arrange: create category to delete
    const toDelete = await categoryModel.create({
      name: "Temp Cat",
      slug: slugify("Temp Cat"),
    });
    // Act
    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${toDelete._id}`)
      .set("authorization", authToken);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: /Category Deleted Successfully/i,
    });

    const deleted = await categoryModel.findById(toDelete._id);
    expect(deleted).toBeNull();
  });

  // Bad path tests
  test("POST /create-category without token should return 401 (unauthorized)", async () => {
    // Act
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .send({ name: "NoAuth" });
    // Assert
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({
      success: false,
      message: /No token provided/i,
    });
  });

  test("POST /create-category missing name should return 400 (bad request)", async () => {
    // Act
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("authorization", authToken)
      .send({});

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: /Name is required/i });
  });

  test("POST /create-category with empty name should return 400 (bad request)", async () => {
    // Act
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("authorization", authToken)
      .send({ name: "" });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: /Name is required/i });
  });

  test("POST /create-category duplicate name should return 409 (conflict)", async () => {
    // Arrange - Create once
    const first = await request(app)
      .post("/api/v1/category/create-category")
      .set("authorization", authToken)
      .send({ name: "DupCat" });
    expect(first.status).toBe(201);

    // Act – Create again
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("authorization", authToken)
      .send({ name: "DupCat" });

    // Assert
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({
      success: false,
      message: /Category Already Exists/i,
    });
  });

  test("PUT /update-category/:id invalid id should return 500", async () => {
    // Act
    const res = await request(app)
      .put(`/api/v1/category/update-category/not-a-valid-id`)
      .set("authorization", authToken)
      .send({ name: "BadId" });

    // Arrange
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "Error while updating category",
    });
  });

  test("PUT /update-category/:id with empty name should return 400 (bad request)", async () => {
    // Arrange: create with slug
    const cat = await categoryModel.create({
      name: "Kent Ridge Books",
      slug: slugify("Kent Ridge Books"),
    });

    // Act
    const res = await request(app)
      .put(`/api/v1/category/update-category/${cat._id}`)
      .set("authorization", authToken)
      .send({ name: "" });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ message: "Name is required" });
  });

  test("PUT /update-category/:id database error should return 500", async () => {
    // Arrange: create with slug
    const cat = await categoryModel.create({
      name: "Yusof Ishak House",
      slug: slugify("Yusof Ishak House"),
    });

    const spy = jest
      .spyOn(categoryModel, "findByIdAndUpdate")
      .mockRejectedValueOnce(new Error("db down"));

    // Act
    const res = await request(app)
      .put(`/api/v1/category/update-category/${cat._id}`)
      .set("authorization", authToken)
      .send({ name: "YIH Services" });

    // Assert
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "Error while updating category",
    });
    spy.mockRestore();
  });

  test("DELETE /delete-category/:id invalid id should return 500", async () => {
    // Act
    const res = await request(app)
      .delete(`/api/v1/category/delete-category/not-a-valid-id`)
      .set("authorization", authToken);

    // Assert
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "error while deleting category",
    });
  });

  test("DELETE /delete-category database error should return 500", async () => {
    // Arrange: create with slug
    const cat = await categoryModel.create({
      name: "NUS Computing",
      slug: slugify("NUS Computing"),
    });
    const spy = jest
      .spyOn(categoryModel, "findByIdAndDelete")
      .mockRejectedValueOnce(new Error("db down"));

    // Act
    const res = await request(app)
      .delete(`/api/v1/category/delete-category/${cat._id}`)
      .set("authorization", authToken);

    // Assert
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "error while deleting category",
    });
    spy.mockRestore();
  });

  test("POST /create-category database error should return 500", async () => {
    // Arrange
    const spy = jest
      .spyOn(categoryModel, "findOne")
      .mockRejectedValueOnce(new Error("db down"));

    // Act
    const res = await request(app)
      .post("/api/v1/category/create-category")
      .set("authorization", authToken)
      .send({ name: "ShouldFail" });

    // Assert
    expect(res.status).toBe(500);
    expect(res.body).toMatchObject({
      success: false,
      message: "Error in Category",
    });
    spy.mockRestore();
  });
});
