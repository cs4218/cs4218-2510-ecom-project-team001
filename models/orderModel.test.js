import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import OrderModel from "./OrderModel.js";

// chatgpt is used to aid in creation of the testcases and mocking
let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  await OrderModel.deleteMany();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Order Schema Tests", () => {
  // State-based: default status
  it("should set default status to 'Not Process'", async () => {
    const order = await OrderModel.create({ products: [] });
    expect(order.status).toBe("Not Process");
  });

  // State-based + EP: valid status values
  it("should accept valid status 'Processing'", async () => {
    const order = await OrderModel.create({ status: "Processing" });
    expect(order.status).toBe("Processing");
  });

  // EP: invalid status should throw
  it("should reject invalid status value", async () => {
    await expect(OrderModel.create({ status: "InvalidStatus" })).rejects.toThrow();
  });

  // BVA: empty products array
  it("should allow empty products array", async () => {
    const order = await OrderModel.create({ products: [] });
    expect(order.products).toHaveLength(0);
  });

  // BVA: one product
  it("should allow one product", async () => {
    const order = await OrderModel.create({ products: [new mongoose.Types.ObjectId()] });
    expect(order.products).toHaveLength(1);
  });

  // Output-based: timestamps
  it("should set timestamps on creation", async () => {
    const order = await OrderModel.create({});
    expect(order.createdAt).toBeDefined();
    expect(order.updatedAt).toBeDefined();
  });

  // Communication-based: payment object
  it("should preserve payment object fields", async () => {
    const order = await OrderModel.create({ payment: { method: "card", amount: 100 } });
    expect(order.payment.method).toBe("card");
    expect(order.payment.amount).toBe(100);
  });

  // Error handling: invalid product type
  it("should reject string as product id", async () => {
    await expect(OrderModel.create({ products: ["abc123"] })).rejects.toThrow();
  });
});
