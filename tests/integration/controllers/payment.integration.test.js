/**
 * =================================================================================================
 * Integration testing (using ESM + supertest) involving
 * 1. controllers/productController.js (braintreeTokenController, brainTreePaymentController)
 * 2. server.js (app)
 * 3. /models/orderModel.js
 * 4. /routes/productRoutes.js
 * Covers:
 * - GET /api/v1/product/braintree/token
 * - POST /api/v1/product/braintree/payment
 * =================================================================================================
 */

import request from "supertest";
import mongoose from "mongoose";
import slugify from "slugify";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../utils/db.js";
import JWT from "jsonwebtoken";

import categoryModel from "../../../models/categoryModel.js";
import userModel from "../../../models/userModel.js";
import productModel from "../../../models/productModel.js";
import orderModel from "../../../models/orderModel.js";

import app from "../../../server.js";
import braintree from "braintree";

jest.setTimeout(25000);

let authToken;
let adminUser;
let testProducts;
let testCart = [];

beforeAll(async () => {
    await connectToTestDb("jest-braintree-int");
    await orderModel.deleteMany({});

    const testCategory = await categoryModel.create({
        name: "Payment Test Category",
        slug: slugify("Payment Test Category"),
    });

    testProducts = [
        {
            name: "Alpha",
            description: "Alpha Test",
            price: 100,
            quantity: 10,
            category: testCategory._id,
            slug: slugify("Payment Test Product 1"),
        },
        {
            name: "Beta",
            description: "Beta Test",
            price: 200,
            quantity: 5,
            category: testCategory._id,
            slug: slugify("Payment Test Product 2"),
        }
    ];

    for (const product of testProducts) {
        const createdProduct = await productModel.create(product);
        testCart.push(createdProduct);
    }
});

afterAll(async () => {
    await orderModel.deleteMany({});
    await productModel.deleteMany({});
    await categoryModel.deleteMany({});
    await disconnectFromTestDb();
});

beforeEach(async () => {
    await resetTestDb();

    adminUser = await userModel.create({
        name: "PayAdmin",
        email: "pay@admin.com",
        password: "payment",
        phone: "11111111",
        address: "Payment Ave",
        answer: "green",
        role: 1,
    });

    authToken = JWT.sign(
        { _id: adminUser._id },
        process.env.JWT_SECRET || TEST_SECRET
    );
});

describe("braintreeTokenController integration", () => {
    test("GET braintree/token should successfully return a client token", async () => {
        const response = await request(app)
            .get("/api/v1/product/braintree/token")
            .set("Authorization", authToken)
            .expect(200);

        expect(response.body).toHaveProperty("clientToken");
    });

    test("GET braintree/token should return 401 when user not logged in", async () => {
         const response = await request(app)
            .get("/api/v1/product/braintree/token")
            .expect(401);

            expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "No token provided");
    });
});

describe("brainTreePaymentController integration", () => {
    let orderCount;

    beforeEach(async () => {
        orderCount = await orderModel.countDocuments();
    });

    test("POST /braintree/payment should successfully process a payment and create an order", async () => {
        const expectedTotal = "300.00"; // 100 + 200
        const response = await request(app)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", authToken)
            .send({
                nonce: "fake-valid-nonce",
                cart: testCart,
            })
            .expect(200);

        expect(response.body).toHaveProperty("ok", true);
        
        // Verify a new Order is created
        const newOrderCount = await orderModel.countDocuments();
        expect(newOrderCount).toBe(orderCount + 1);

        const createdOrder = await orderModel.findOne({}).sort({ createdAt: -1 });
        expect(createdOrder).toBeDefined();
        expect(createdOrder.buyer.toString()).toBe(adminUser._id.toString());
        expect(createdOrder.products.length).toBe(testCart.length);
        expect(createdOrder.payment.success).toBe(true);
        expect(createdOrder.payment.transaction.amount).toBe(expectedTotal);
        expect(createdOrder.status).toBe("Not Process");
    });

    test("POST /braintree/payment should return 401 when user not logged in", async () => {
        const response = await request(app)
            .post("/api/v1/product/braintree/payment")
            .send({
                nonce: "fake-valid-nonce",
                cart: testCart,
            })
            .expect(401);

        expect(response.body).toHaveProperty("success", false);
        expect(response.body).toHaveProperty("message", "No token provided");
    });

    test("POST /braintree/payment should return 400 when cart is empty", async () => {
        const emptyCart = [];
        const response = await request(app)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", authToken)
            .send({
                nonce: "fake-valid-nonce",
                cart: emptyCart,
            })
            .expect(400);

        expect(response.text).toMatch(/Cart is empty/i);
    });

    test("POST /braintree/payment should fail payment when nonce is invalid", async () => {
        const response = await request(app)
            .post("/api/v1/product/braintree/payment")
            .set("Authorization", authToken)
            .send({
                nonce: "fake-invalid-nonce",
                cart: testCart,
            })
            .expect(200);

        expect(response.body).toHaveProperty("ok", true);
        
        // Verify a new Order is created
        const newOrderCount = await orderModel.countDocuments();
        expect(newOrderCount).toBe(orderCount + 1);

        const createdOrder = await orderModel.findOne({}).sort({ createdAt: -1 });
        expect(createdOrder).toBeDefined();
        expect(createdOrder.products.length).toBe(testCart.length);
        expect(createdOrder.buyer.toString()).toBe(adminUser._id.toString());
        expect(createdOrder.status).toBe("Not Process");

        // Verify the payment should fail
        expect(createdOrder.payment.success).toBe(false);
    })
});