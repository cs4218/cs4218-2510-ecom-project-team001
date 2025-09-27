import { registerController, loginController, forgotPasswordController, testController } from "./authController";
import userModel from "../models/userModel.js";
import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";
import validator from "validator";

jest.mock("../models/userModel.js");
jest.mock("./../helpers/authHelper.js");
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
            // phone: "+6512345678",
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

            expect(validator.isEmail).toHaveBeenCalledWith(invalidEmail);
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

            expect(validator.isMobilePhone).toHaveBeenCalledWith(invalidPhone, 'any');
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

            expect(userModel.findOne).toHaveBeenCalledWith({ email: validUser.email });
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

            expect(hashPassword).toHaveBeenCalledWith(req.body.password);
            expect(userModel.findOne).toHaveBeenCalledWith({ email: validUser.email });
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

    // describe('loginController', () => {
    //     it('should login a user successfully', async () => {
    //         req.body = {
    //             email: "testuser@example.com",
    //             password: "password123"
    //         };
    //         userModel.findOne.mockResolvedValue(req.body);
    //         comparePassword.mockResolvedValue(true);
    //         JWT.sign.mockReturnValue("token");
    //         await loginController(req, res);
    //         expect(res.status).toHaveBeenCalledWith(200);
    //         expect(res.send).toHaveBeenCalledWith({
    //             success: true,
    //             data: {
    //                 token: "token"
    //             }
    //         });
    //     });
    // });

    // describe('forgotPasswordController', () => {
    //     it('should reset password successfully', async () => {
    //         req.body = {
    //             email: "testuser@example.com"
    //         };
    //         userModel.findOne.mockResolvedValue(req.body);
    //         JWT.sign.mockReturnValue("token");
    //         await forgotPasswordController(req, res);
    //         expect(res.status).toHaveBeenCalledWith(200);
    //         expect(res.send).toHaveBeenCalledWith({
    //             success: true,
    //             data: {
    //                 token: "token"
    //             }
    //         });
    //     });
    // });
    // describe('testController', () => {
    //     it('should return test message', async () => {
    //         await testController(req, res);
    //         expect(res.status).toHaveBeenCalledWith(200);
    //         expect(res.send).toHaveBeenCalledWith({
    //             success: true,
    //             message: "Protected route"
    //         });
    //     });
    // });
});
