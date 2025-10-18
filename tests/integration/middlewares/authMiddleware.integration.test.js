import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import userModel from '../../../models/userModel.js';
import { requireSignIn, isAdmin } from '../../../middlewares/authMiddleware.js';

process.env.JWT_SECRET = "test_jwt";
const User = userModel;

const app = express();
app.use(express.json());

app.get('/protected', requireSignIn, (req, res) => {
    res.status(200).send({ success: true, message: 'Protected route access granted', user: req.user });
});

app.get('/admin', requireSignIn, isAdmin, (req, res) => {
    res.status(200).send({ success: true, message: 'Admin access granted', user: req.user });
});

describe('Auth Middleware Integration Tests', () => {
    let mongoServer;
    let nonAdminUser;
    let adminUser;
    let nonAdminToken;
    let adminToken;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(async () => {
        await User.deleteMany({});

        nonAdminUser = new userModel({
            name: 'Non Admin Test User',
            email: 'nonadmin@example.com',
            password: 'password123',
            phone: '1234567890',
            address: '123 Street',
            answer: 'Test Answer',
            role: 0
        });
        await nonAdminUser.save();

        adminUser = new userModel({
            name: 'Admin Test User',
            email: 'admin@example.com',
            password: 'password123',
            phone: '1234567890',
            address: '123 Street',
            answer: 'Test Answer',
            role: 1
        });
        await adminUser.save();

        nonAdminToken = jwt.sign({ _id: nonAdminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
        });
        adminToken = jwt.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
        });
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('requireSignIn Middleware', () => {
        it('should allow access with valid token', async () => {
            const res = await request(app)
                .get('/protected')
                .set('Authorization', nonAdminToken);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Protected route access granted');
            expect(res.body.user._id).toBe(nonAdminUser._id.toString());
        });

        it('should deny access with no token', async () => {
            const res = await request(app).get('/protected');

            expect(res.status).toBe(401);
            expect(res.body).toEqual({
                success: false,
                message: 'No token provided',
            });
        });

        it('should deny access with invalid token', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const res = await request(app)
                .get('/protected')
                .set('Authorization', 'invalidtoken');

            expect(consoleSpy).toHaveBeenCalled();
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid or expired token');
            consoleSpy.mockRestore();
        });

        it('should deny access with expired token', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const expiredToken = jwt.sign({ _id: nonAdminUser._id }, process.env.JWT_SECRET, { expiresIn: '1ms' });
            // Wait for token to expire
            await new Promise(res => setTimeout(res, 10));

            const res = await request(app)
                .get('/protected')
                .set('Authorization', expiredToken);

            expect(consoleSpy).toHaveBeenCalled();
            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid or expired token');
            consoleSpy.mockRestore();
        });
    });

    describe('isAdmin Middleware', () => {
        it('should allow access for admin user', async () => {
            const res = await request(app)
                .get('/admin')
                .set('Authorization', adminToken);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Admin access granted');
            expect(res.body.user._id).toBe(adminUser._id.toString());
        });

        it('should deny access for non-admin user', async () => {
            const res = await request(app)
                .get('/admin')
                .set('Authorization', nonAdminToken);

            expect(res.status).toBe(403);
            expect(res.body).toEqual({
                success: false,
                message: 'Forbidden',
            });
        });

        it('should handle user not found error', async () => {
            const nonExistentUserId = new mongoose.Types.ObjectId();
            const userToken = jwt.sign({ _id: nonExistentUserId }, process.env.JWT_SECRET, { 
                expiresIn: "7d" 
            });

            const res = await request(app)
                .get('/admin')
                .set('Authorization', userToken);

            expect(res.status).toBe(404);
            expect(res.body).toEqual({
                success: false,
                message: 'User not found',
            });
        });

        it('should handle errors and return 500', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const error = new Error('Database error');
            jest.spyOn(User, 'findById').mockRejectedValueOnce(error);

            const res = await request(app)
                .get('/admin')
                .set('Authorization', adminToken);

            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error in admin middleware');
            consoleSpy.mockRestore();
        });
    });
});