import request from 'supertest';
import mongoose from 'mongoose';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import userModel from '../../../models/userModel.js';
import { hashPassword, comparePassword } from '../../../helpers/authHelper.js';
import { registerController, loginController, forgotPasswordController, testController } from '../../../controllers/authController.js';
import { requireSignIn, isAdmin } from '../../../middlewares/authMiddleware.js';

process.env.JWT_SECRET = "test_jwt";
const User = userModel;

const app = express();
app.use(express.json());

app.post('/api/v1/auth/register', registerController);
app.post('/api/v1/auth/login', loginController);
app.post('/api/v1/auth/forgot-password', forgotPasswordController);
app.get('/api/v1/auth/test', requireSignIn, isAdmin, testController);

describe('Auth Controller Integration Tests', () => {
    let mongoServer;

    const validUser = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
        phone: '99999999',
        address: '123 Street',
        answer: 'Test Answer',
        role: 0
    };

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    beforeEach(async () => {
        await User.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    describe('Register Controller', () => {
        it('should register a new user successfully', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            expect(res.status).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('User Register Successfully');
            expect(res.body.user.name).toBe(validUser.name);
            expect(res.body.user.email).toBe(validUser.email);

            const userInDb = await User.findOne({ email: validUser.email });
            expect(userInDb).toBeTruthy();
            expect(userInDb.name).toBe(validUser.name);
        });

        it('should not register a user with an existing email', async () => {
            await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            expect(res.status).toBe(409);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Already Registered please login');
        });

        it('should not register a user with missing fields', async () => {
            const { email, ...incompleteUser } = validUser;

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(incompleteUser);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email is Required');
        });

        it('should not register a user with invalid email format', async () => {
            const invalidEmailUser = { ...validUser, email: 'invalidemail' };

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidEmailUser);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email format');
        });

        it('should not register a user with invalid phone number format', async () => {
            const invalidPhoneUser = { ...validUser, phone: 'invalidphone' };

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(invalidPhoneUser);

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid phone number format');
        });

        it('should hash the password before saving to the database', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            expect(res.status).toBe(201);
            const userInDb = await User.findOne({ email: validUser.email });
            expect(userInDb).toBeTruthy();
            expect(userInDb.password).not.toBe(validUser.password);

            const isMatch = await comparePassword(validUser.password, userInDb.password);
            expect(isMatch).toBe(true);
        });

        it('should handle server errors gracefully', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const error = new Error('Database error');
            jest.spyOn(User.prototype, 'save').mockRejectedValueOnce(error);

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error in Registration');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Login Controller', () => {
        it('should login an existing user successfully', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: validUser.email,
                    password: validUser.password
                });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('login successfully');
            expect(res.body.user.email).toBe(validUser.email);
            expect(res.body).toHaveProperty('token');
        });

        it('should not login with incorrect password', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: validUser.email,
                    password: 'wrongpassword'
                });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid Password');
        });

        it('should not login non-existing user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'somepassword'
                });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email is not registered');
        });

        it('should not login with missing fields', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: validUser.email
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email or password');
        });

        it('should not login with invalid email format', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'invalidemail',
                    password: validUser.password
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email format');
        });

        it('should handle server errors gracefully', async () => {
            delete process.env.JWT_SECRET; // Cause JWT signing to fail
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: validUser.email,
                    password: validUser.password
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Error in login');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
            // Restore JWT_SECRET after the test
            process.env.JWT_SECRET = 'test_jwt';
        });
    });

    describe('Forgot Password Controller', () => {
        it('should reset the password successfully', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();

            const res = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({
                    email: validUser.email,
                    answer: validUser.answer,
                    newPassword: 'newpassword123'
                });

            expect(res.status).toBe(200);
            expect(res.body.message).toBe('Password Reset Successfully');

            const userInDb = await User.findOne({ email: validUser.email });
            const isMatch = await comparePassword('newpassword123', userInDb.password);
            expect(isMatch).toBe(true);
        });

        it('should not reset password for non-existing user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({
                    email: 'nonexistent@example.com',
                    answer: 'Some Answer',
                    newPassword: 'newpassword123'
                });

            expect(res.status).toBe(404);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Wrong Email Or Answer');
        });

        it('should not reset password with missing fields', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();

            const res = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({
                    email: validUser.email,
                    newPassword: 'newpassword123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Answer is required');
        });

        it('should not reset password with invalid email format', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();

            const res = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({
                    email: 'invalidemail',
                    answer: validUser.answer,
                    newPassword: 'newpassword123'
                });

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email format');
        });

        it('should handle server errors gracefully', async () => {
            const hashedPassword = await hashPassword(validUser.password);
            await new User({ ...validUser, password: hashedPassword }).save();
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const error = new Error('Database error');
            jest.spyOn(User, 'findOne').mockRejectedValueOnce(error);

            const res = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({
                    email: validUser.email,
                    answer: validUser.answer,
                    newPassword: 'newpassword123'
                });

            expect(res.status).toBe(500);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Something went wrong');

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('Test Controller with Middlewares', () => {
        let adminUser;
        let nonAdminUser;
        let adminToken;
        let nonAdminToken;

        beforeEach(async () => {
            const hashedPassword = await hashPassword(validUser.password);

            adminUser = await new User({ ...validUser, password: hashedPassword, role: 1 }).save();
            nonAdminUser = await new User({ ...validUser, email: 'nonadmin@example.com', password: hashedPassword, role: 0 }).save();

            adminToken = jwt.sign({ _id: adminUser._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
            nonAdminToken = jwt.sign({ _id: nonAdminUser._id }, process.env.JWT_SECRET, {
                expiresIn: "7d",
            });
        });
        
        it('should allow access to admin user', async () => {
            const res = await request(app)
                .get('/api/v1/auth/test')
                .set('Authorization', adminToken);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Protected Routes');
        });

        it('should not allow access to non-admin user', async () => {
            const res = await request(app)
                .get('/api/v1/auth/test')
                .set('Authorization', nonAdminToken);

            expect(res.status).toBe(403);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Forbidden');
        });

        it('should not allow access with invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/test')
                .set('Authorization', 'invalidtoken');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid or expired token');
        });

        it('should not allow access with no token', async () => {
            const res = await request(app)
                .get('/api/v1/auth/test');

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No token provided');
        });
    });

    describe('End-to-End Integration Test: Register, Login, Forgot Password', () => {
        it('should register, login, and reset password successfully', async () => {
            // Register
            const registerRes = await request(app)
                .post('/api/v1/auth/register')
                .send(validUser);

            expect(registerRes.status).toBe(201);
            expect(registerRes.body.success).toBe(true);

            // Login
            const loginRes = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: validUser.email,
                    password: validUser.password
                });

            expect(loginRes.status).toBe(200);
            expect(loginRes.body.success).toBe(true);
            expect(loginRes.body).toHaveProperty('token');

            // Forgot Password
            const forgotRes = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({
                    email: validUser.email,
                    answer: validUser.answer,
                    newPassword: 'newpassword123'
                });

            expect(forgotRes.status).toBe(200);
            expect(forgotRes.body.success).toBe(true);
            expect(forgotRes.body.message).toBe('Password Reset Successfully');

            // Login with new password
            const loginNewRes = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: validUser.email,
                    password: 'newpassword123'
                });

            expect(loginNewRes.status).toBe(200);
            expect(loginNewRes.body.success).toBe(true);
            expect(loginNewRes.body).toHaveProperty('token');
        });
    });
});