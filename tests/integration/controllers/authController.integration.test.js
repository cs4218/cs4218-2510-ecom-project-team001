import request from "supertest";
import JWT from "jsonwebtoken";
import mongoose from "mongoose";
import slugify from "slugify";
import bcrypt from "bcrypt";

import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../utils/db.js";

import userModel from "../../../models/userModel.js";
import productModel from "../../../models/productModel.js";
import orderModel from "../../../models/orderModel.js";
import app from "../../../server.js";

jest.setTimeout(25000);

let authToken;
let testUser;
let productA;
let productB;

beforeAll(async () => {
  await connectToTestDb("jest-orders-profile-int");
});

afterAll(async () => {
  await disconnectFromTestDb();
});

// chatgpt is used to aid in creation of the initial states
beforeEach(async () => {
  await resetTestDb();

  // === Create User and Auth Token ===
  const hashed = await bcrypt.hash("password123", 10);
  testUser = await userModel.create({
    name: "Order User",
    email: "orderuser@test.com",
    password: hashed,
    phone: "99998888",
    address: "NUS, Singapore",
    answer: "blue",
  });

  authToken = JWT.sign(
    { _id: testUser._id },
    process.env.JWT_SECRET || "test-secret"
  );

  // === Create Products ===
  productA = await productModel.create({
    name: "Sample Product A",
    slug: slugify("Sample Product A"),
    description: "Desc A",
    price: 100,
    category: new mongoose.Types.ObjectId(),
    quantity: 3,
    shipping: true,
  });

  productB = await productModel.create({
    name: "Sample Product B",
    slug: slugify("Sample Product B"),
    description: "Desc B",
    price: 50,
    category: new mongoose.Types.ObjectId(),
    quantity: 5,
    shipping: false,
  });
});

/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. pages/user/Orders.js
2. controllers/authController.js (getOrdersController)
3. /models/orderModel.js
4. /models/productModel.js
=====================================================

*/
describe("getOrdersController integration", () => {
  test("GET /api/v1/auth/orders should return user orders (200)", async () => {
    // Arrange: insert an order linked to testUser
    await orderModel.create({
      products: [productA._id, productB._id],
      payment: { success: true },
      buyer: testUser._id,
      status: "Delivered",
    });

    // Act: send relevant api request
    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("authorization", authToken);

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);

    const o = res.body[0];
    expect(o.status).toBe("Delivered");
    expect(o.buyer.name).toBe("Order User");
    expect(o.products.length).toBe(2);
    expect(o.products[0]).toHaveProperty("name"); // populated product check
    expect(o.products[1]).toHaveProperty("price");
  });

  test("GET /api/v1/auth/orders should return empty array when user has no orders (200)", async () => {
    // Arrange: no need arrange anything since no orders

    // Act: send relevant api request
    const res = await request(app)
      .get("/api/v1/auth/orders")
      .set("authorization", authToken);

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });

  test("GET /api/v1/auth/orders should return 401 when token missing", async () => {
    // Arrange: no need arrange anything since testing error behaviour

    // Act: send relevant api request
    const res = await request(app).get("/api/v1/auth/orders");

    // Assert: check correct behaviour and correct returned objects
    expect([401, 403]).toContain(res.status); // support either based on your middleware
    expect(res.body).toMatchObject({
      success: false,
    });
  });
});

/*
chatgpt is used to aid in creation of the test cases below

=====================================================
Integration testing involving
1. pages/user/Profile.js
2. controllers/authController.js (updateProfileController)
3. /models/userModel.js
=====================================================

*/
describe("updateProfileController integration", () => {
  test("PUT /api/v1/auth/profile should update user profile (200)", async () => {
    // Arrange: prepare updated fields
    const updatedData = {
      name: "Johnny Updated",
      phone: "99990000",
      address: "NUS Computing",
    };

    // Act: send relevant api request
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("authorization", authToken)
      .send(updatedData);

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Profile Updated Successfully",
    });
    expect(res.body.updatedUser.name).toBe("Johnny Updated");
    expect(res.body.updatedUser.phone).toBe("99990000");

    // Assert: verify DB persisted changes
    const updated = await userModel.findById(testUser._id);
    expect(updated.name).toBe("Johnny Updated");
    expect(updated.phone).toBe("99990000");
  });

  test("PUT /api/v1/auth/profile should reject short password (200 + error msg)", async () => {
    // Arrange: use invalid short password
    const invalidData = { password: "123" };

    // Act: send relevant api request
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("authorization", authToken)
      .send(invalidData);

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(200);
    expect(res.body.error).toBe("Password is required and 6 character long");

    // Assert: confirm DB password not updated
    const unchanged = await userModel.findById(testUser._id);
    const isSamePassword = await bcrypt.compare(
      "password123",
      unchanged.password
    );
    expect(isSamePassword).toBe(true);
  });

  test("PUT /api/v1/auth/profile should return 401/403 if token missing", async () => {
    // Arrange: no token to simulate unauthorised access

    // Act: send relevant api request
    const res = await request(app).put("/api/v1/auth/profile").send({
      name: "Unauthorized Attempt",
    });

    // Assert: check correct behaviour and correct returned objects
    expect([401, 403]).toContain(res.status);
    expect(res.body).toMatchObject({
      success: false,
    });
  });

  test("PUT /api/v1/auth/profile should handle DB error gracefully (400)", async () => {
    // Arrange: simulate DB failure
    const spy = jest
      .spyOn(userModel, "findByIdAndUpdate")
      .mockRejectedValue(new Error("DB crashed"));

    // Act: send relevant api request
    const res = await request(app)
      .put("/api/v1/auth/profile")
      .set("authorization", authToken)
      .send({ name: "DB Error" });

    // Assert: check correct behaviour and correct returned objects
    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({
      success: false,
      message: "Error While Update profile",
    });

    spy.mockRestore();
  });
});
