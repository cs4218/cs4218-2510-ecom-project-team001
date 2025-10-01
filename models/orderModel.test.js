import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import Order from "./OrderModel.js";

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Order.deleteMany({});
});

describe("OrderModel", () => {
  //
  // 🔹 Schema Validation Tests
  //
  describe("Schema Validation", () => {
    it("should default status to 'Not Process'", async () => {
      const order = await Order.create({});
      expect(order.status).toBe("Not Process");
    });

    it("should accept valid status 'Processing'", async () => {
      const order = await Order.create({ status: "Processing" });
      expect(order.status).toBe("Processing");
    });

    it("should reject invalid status value", async () => {
      await expect(Order.create({ status: "InTransit" })).rejects.toThrow();
    });

    it("should allow empty products array", async () => {
      const order = await Order.create({ products: [] });
      expect(order.products.length).toBe(0);
    });

    it("should allow one product", async () => {
      const order = await Order.create({
        products: [new mongoose.Types.ObjectId()],
      });
      expect(order.products.length).toBe(1);
    });

    it("should reject string instead of ObjectId in products", async () => {
      await expect(Order.create({ products: ["abc123"] })).rejects.toThrow();
    });
  });

  //
  // 🔹 Functional Behavior Tests
  //
  describe("Functional Behavior", () => {
    it("should set createdAt and updatedAt automatically", async () => {
      const order = await Order.create({});
      expect(order.createdAt).toBeDefined();
      expect(order.updatedAt).toBeDefined();
    });

    it("should preserve payment object structure", async () => {
      const order = await Order.create({
        payment: { method: "card", amount: 200 },
      });
      expect(order.payment).toEqual({ method: "card", amount: 200 });
    });
  });

  //
  // 🔹 Error Handling Tests
  //
  describe("Error Handling", () => {
    it("should throw an error when saving invalid enum status", async () => {
      await expect(Order.create({ status: "Invalid" })).rejects.toThrow();
    });

    it("should throw an error when products array contains invalid type", async () => {
      await expect(Order.create({ products: ["not-an-objectid"] })).rejects.toThrow();
    });
  });
});
