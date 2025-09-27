import { registerController, loginController, forgotPasswordController, testController } from "./authController";
import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import validator from "validator";
import { th } from "date-fns/locale";

jest.mock("../models/userModel.js");
jest.mock("./../helpers/authHelper.js", () => ({
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
}));
jest.mock("jsonwebtoken");
jest.mock("validator", () => ({
    isEmail: jest.fn(),
    isMobilePhone: jest.fn(),
}));

describe('Auth Controller', () => {
    let req, res;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            body: {}
        };
        res = { 
            status: jest.fn().mockReturnThis(), 
            send: jest.fn() 
        };
    });

    describe('registerController', () => {
        const validUser = {
            name: "Test User",
            email: "testuser@example.com",
            password: "password123",
            phone: "99999999",
            address: "123 Test St",
            answer: "Test Answer"
        };

        let invalidEmail = "invalidemail";
        let invalidPhone = "abc";

        beforeEach(() => {
            req.body = { ...validUser };
        });

        it('should return 400 if name is missing', async () => {
            req.body.name = "";

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Name is Required" 
            });
        });

        it('should return 400 if email is missing', async () => {
            req.body.email = "";

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Email is Required" 
            });
        });

        it('should return 400 if password is missing', async () => {
            req.body.password = "";

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Password is Required" 
            });
        });

        it('should return 400 if phone is missing', async () => {
            req.body.phone = "";

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Phone no is Required" 
            });
        });

        it('should return 400 if address is missing', async () => {
            req.body.address = "";

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Address is Required" 
            });
        });

        it('should return 400 if answer is missing', async () => {
            req.body.answer = "";

            await registerController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Answer is Required" 
            });
        });

        it('should return 400 if email is invalid', async () => {
            req.body.email = invalidEmail;
            validator.isEmail.mockReturnValue(false);

            await registerController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Invalid email format" 
            });
        });

        it('should return 400 if phone is invalid', async () => {
            req.body.phone = invalidPhone;
            validator.isEmail.mockReturnValue(true);
            validator.isMobilePhone.mockReturnValue(false);

            await registerController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(validator.isMobilePhone).toHaveBeenCalledWith(req.body.phone, 'any');
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ 
                success: false,
                message: "Invalid phone number format" 
            });
        });

        it('should return 409 if user already exists', async () => {
            validator.isEmail.mockReturnValue(true);
            validator.isMobilePhone.mockReturnValue(true);
            userModel.findOne.mockResolvedValue({ email: validUser.email });

            await registerController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(validator.isMobilePhone).toHaveBeenCalledWith(req.body.phone, 'any');
            expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Already Registered please login"
            });
        });

        it('should register a new user successfully', async () => {
            validator.isEmail.mockReturnValue(true);
            validator.isMobilePhone.mockReturnValue(true);
            userModel.findOne.mockResolvedValue(null);
            hashPassword.mockResolvedValue("hashedpassword");
            userModel.mockImplementation(() => ({
                save: jest.fn().mockResolvedValue({ _id: '123', ...validUser, password: "hashedpassword" })
            }));

            await registerController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(validator.isMobilePhone).toHaveBeenCalledWith(req.body.phone, 'any');
            expect(hashPassword).toHaveBeenCalledWith(req.body.password);
            expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "User Register Successfully",
                user: { _id: '123', ...validUser, password: "hashedpassword" }
            });
        });

        it('should handle errors and return 500', async () => {
            validator.isEmail.mockReturnValue(true);
            validator.isMobilePhone.mockReturnValue(true);
            const error = new Error("Database error");
            userModel.findOne.mockRejectedValue(error);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            await registerController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(validator.isMobilePhone).toHaveBeenCalledWith(req.body.phone, 'any');
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error in Registration",
                error,
            });
            consoleSpy.mockRestore();
        });
    });

    describe('loginController', () => {
        const validLogin = {
            email: "testuser@example.com",
            password: "password123"
        };

        const mockUserFromDB = {
            _id: "123",
            name: "Test User",
            email: "testuser@example.com",
            password: "hashedpassword",
            phone: "99999999",
            address: "123 Test St",
            role: 0
        };

        beforeEach(() => {
            req.body = { ...validLogin };
        });

        it('should return 400 if email is missing', async () => {
            req.body.email = "";

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid email or password"
            });
        });

        it('should return 400 if password is missing', async () => {
            req.body.password = "";

            await loginController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid email or password"
            });
        });

        it('should return 400 if email format is invalid', async () => {
            req.body.email = "invalidemail";
            validator.isEmail.mockReturnValue(false);

            await loginController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid email format"
            });
        });

        it('should return 404 if user is not found', async () => {
            validator.isEmail.mockReturnValue(true);
            userModel.findOne.mockResolvedValue(null);

            await loginController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email});
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Email is not registerd"
            });
        });

        it('should return 401 if password does not match', async () => {
            validator.isEmail.mockReturnValue(true);
            req.body.password = "wrongpassword";
            userModel.findOne.mockResolvedValue({ email: "testuser@example.com", password: "hashedpassword" });
            comparePassword.mockResolvedValue(false);

            await loginController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email});
            expect(comparePassword).toHaveBeenCalledWith(req.body.password, mockUserFromDB.password);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid Password"
            });
        });

        it('should login a user successfully', async () => {
            validator.isEmail.mockReturnValue(true);
            userModel.findOne.mockResolvedValue(mockUserFromDB);
            comparePassword.mockResolvedValue(true);
            JWT.sign.mockReturnValue("token");

            await loginController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email });
            expect(comparePassword).toHaveBeenCalledWith(req.body.password, mockUserFromDB.password);
            expect(JWT.sign).toHaveBeenCalledWith(
                { _id: mockUserFromDB._id },
                process.env.JWT_SECRET,
                { expiresIn: "7d" }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "login successfully",
                user: {
                    _id: mockUserFromDB._id,
                    name: mockUserFromDB.name,
                    email: mockUserFromDB.email,
                    phone: mockUserFromDB.phone,
                    address: mockUserFromDB.address,
                    role: mockUserFromDB.role,
                },
                token: "token"
            });
        });

        it('should handle errors and return 500', async () => {
            validator.isEmail.mockReturnValue(true);
            const error = new Error("Database error");
            userModel.findOne.mockRejectedValue(error);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            await loginController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Error in login",
                error,
            });
            consoleSpy.mockRestore();
        });
    });

    describe('forgotPasswordController', () => {
        const validRequest = {
            email: "testuser@example.com",
            answer: "test answer",
            newPassword: "newpassword"
        };

        const mockUserFromDB = {
            _id: "123",
            email: "testuser@example.com",
            answer: "test answer",
            password: "hashedpassword"
        };

        it('should return 400 if email is missing', async () => {
            req.body = { ...validRequest, email: "" };

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Email is required"
            });
        });

        it('should return 400 if answer is missing', async () => {
            req.body = { ...validRequest, answer: "" };

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Answer is required"
            });
        });

        it('should return 400 if newPassword is missing', async () => {
            req.body = { ...validRequest, newPassword: "" };

            await forgotPasswordController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "New Password is required"
            });
        });

        it('should return 400 if email format is invalid', async () => {
            req.body = { ...validRequest, email: "invalidemail" };
            validator.isEmail.mockReturnValue(false);

            await forgotPasswordController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Invalid email format"
            });
        });

        it('should return 404 if user with email and answer is not found', async () => {
            validator.isEmail.mockReturnValue(true);
            req.body = {
                email: "testuser@example.com",
                answer: "wrong answer",
                newPassword: "newpassword"
            };
            userModel.findOne.mockResolvedValue(null);

            await forgotPasswordController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email, answer: req.body.answer });
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Wrong Email Or Answer"
            });
        });

        it('should reset password successfully', async () => {
            validator.isEmail.mockReturnValue(true);
            req.body = { ...validRequest };
            userModel.findOne.mockResolvedValue(mockUserFromDB);
            JWT.sign.mockReturnValue("token");
            hashPassword.mockResolvedValue("hashednewpassword");
            userModel.findByIdAndUpdate.mockResolvedValue(true);

            await forgotPasswordController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(userModel.findOne).toHaveBeenCalledWith({ email: req.body.email, answer: req.body.answer });
            expect(hashPassword).toHaveBeenCalledWith(req.body.newPassword);
            expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(mockUserFromDB._id, { password: "hashednewpassword" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Password Reset Successfully"
            });
        });

        it('should handle errors and return 500', async () => {
            validator.isEmail.mockReturnValue(true);
            req.body = { ...validRequest };
            const error = new Error("Database error");
            userModel.findOne.mockRejectedValue(error);
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

            await forgotPasswordController(req, res);

            expect(validator.isEmail).toHaveBeenCalledWith(req.body.email);
            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Something went wrong",
                error,
            });
            consoleSpy.mockRestore();
        });
    });

    describe('testController', () => {
        it('should send protected route message', async () => {
            await testController(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Protected Routes"
            });
        });
    });
});
