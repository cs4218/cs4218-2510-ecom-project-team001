import request from "supertest";
import {
  connectToTestDb,
  resetTestDb,
  disconnectFromTestDb,
} from "../../utils/db.js";
import JWT from "jsonwebtoken";
import slugify from "slugify";
import bcrypt from "bcrypt";

import categoryModel from "../../../models/categoryModel.js";
import userModel from "../../../models/userModel.js";
import productModel from "../../../models/productModel.js";

import app from "../../../server.js";
import fs from "fs";
import { jest } from '@jest/globals';

jest.setTimeout(25000);

let authToken;
let testCategory;

beforeAll(async () => {
    await connectToTestDb('jest-category-int');
});

afterAll(async () => {
    await disconnectFromTestDb();
});

beforeEach(async () => {
    await resetTestDb();

    const hashed = await bcrypt.hash("adminpass", 10);
    const adminUser = await userModel.create({
        name: "Admin User",
        email: "admin@user.com",
        password: hashed,
        phone: "11111111",
        address: "Admin Address",
        answer: "blue",
        role: 1
    });
    authToken = JWT.sign(
        { _id: adminUser._id },
        process.env.JWT_SECRET || "test-secret"
    );
    testCategory = await categoryModel.create({
        name: 'Test Category',
        slug: slugify('Test Category')
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
    test('GET /get-category returns all existing categories', async () => {
        const res = await request(app).get("/api/v1/category/get-category");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.category)).toBe(true);
        expect(res.body.category.length).toBe(1);
        expect(res.body.category[0].name).toBe('Test Category');
        expect(res.body.message).toBe("All Categories List");
    });

    test('GET /get-category returns all categories after creating new categories', async () => {
        await categoryModel.create({
            name: "New1",
            slug: slugify("New1")
        });
        await categoryModel.create({
            name: "New2",
            slug: slugify("New2")
        });

        const res = await request(app).get("/api/v1/category/get-category");
        expect(res.status).toBe(200);
        expect(res.body.message).toBe("All Categories List");
        expect(Array.isArray(res.body.category)).toBe(true);
        expect(res.body.category.length).toBe(3);
        expect(res.body.category[0].name).toBe('Test Category');
        expect(res.body.category[1].name).toBe('New1');
        expect(res.body.category[2].name).toBe('New2');

        // Clean up
        await categoryModel.deleteMany({ name: { $in: ['New1', 'New2'] } });
    });

    test('GET /get-category returns empty array when no categories exist', async () => {
        await categoryModel.deleteMany({});
        const res = await request(app).get("/api/v1/category/get-category");
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.category)).toBe(true);
        expect(res.body.category.length).toBe(0);
    });

    test('GET /get-category returns 500 on error', async () => {
        jest.spyOn(categoryModel, "find").mockImplementationOnce(() => {
            throw new Error("Crash find()");
        });
        const res = await request(app).get("/api/v1/category/get-category");
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Error while getting all categories");
    });
});

describe("singleCategoryController integration", () => {
    test('GET /single-category/:slug returns the correct category', async () => {
        const res = await request(app).get(`/api/v1/category/single-category/${testCategory.slug}`);
        expect(res.status).toBe(200);
        expect(res.body.category.name).toBe('Test Category');
        expect(res.body.category.slug).toBe(testCategory.slug);
        expect(res.body.message).toBe("Get Single Category Successfully");
    });

    test('GET /single-category/:slug returns empty array when category does not exist', async () => {
        const res = await request(app).get(`/api/v1/category/single-category/non-existent-slug`);
        expect(res.status).toBe(200);
        expect(res.body.category).toBeNull();
    });

    test('GET /single-category/:slug returns correct new category', async () => {
        await categoryModel.create({
            name: "New1",
            slug: slugify("New1")
        });
        const res = await request(app).get(`/api/v1/category/single-category/${slugify("New1")}`);
        expect(res.status).toBe(200);
        expect(res.body.category.name).toBe("New1");
        expect(res.body.category.slug).toBe("new1");
        expect(res.body.message).toBe("Get Single Category Successfully");

        // Clean up
        await categoryModel.deleteOne({ name: "New1" });
    });

    test('GET /single-category/:slug returns 500 on error', async () => {
        jest.spyOn(categoryModel, "findOne").mockImplementationOnce(() => {
            throw new Error("Crash findOne()");
        });
        const res = await request(app).get(`/api/v1/category/single-category/${testCategory.slug}`);
        expect(res.status).toBe(500);
        expect(res.body.message).toBe("Error while getting Single Category");
    });
})