import { requireSignIn, isAdmin } from "./authMiddleware.js";
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe('Auth Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            headers: {},
            user: {}
        };
        res = { 
            status: jest.fn().mockReturnThis(), 
            send: jest.fn() 
        };
        next = jest.fn();
    });

    describe('requireSignIn', () => {
        it('should call next() if user is authenticated', async () => {
            req.headers.authorization = "validtoken";
            JWT.verify.mockReturnValue({ _id: "123" });

            await requireSignIn(req, res, next);

            expect(JWT.verify).toHaveBeenCalledWith("validtoken", process.env.JWT_SECRET);
            expect(req.user).toEqual({ _id: "123" });
            expect(next).toHaveBeenCalled();
        });

        it('should return 401 if no token is provided', async () => {
            await requireSignIn(req, res, next);

            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "No token provided",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should return 401 if token is invalid', async () => {
            req.headers.authorization = "invalidtoken";
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const error = new Error("Invalid token");
            JWT.verify.mockImplementation(() => { throw error; });

            await requireSignIn(req, res, next);

            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error,
                message: "Invalid or expired token",
            });
            expect(next).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('isAdmin', () => {
        it('should call next() if user is admin', async () => {
            const mockUser = { _id: "123", role: 1 };
            req.user = { _id: "123", role: 1 };
            userModel.findById.mockResolvedValue({ role: 1 });

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("123");
            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should return 403 if user is not admin', async () => {
            req.user = { _id: "123", role: 0 };
            userModel.findById.mockResolvedValue({ role: 0 });

            await isAdmin(req, res, next);

            expect(userModel.findById).toHaveBeenCalledWith("123");
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Forbidden",
            });
            expect(next).not.toHaveBeenCalled();
        });

        it('should handle errors and return 500', async () => {
            req.user = { _id: "123" };
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const error = new Error("Database error");
            userModel.findById.mockRejectedValue(error);

            await isAdmin(req, res, next);

            expect(consoleSpy).toHaveBeenCalledWith(error);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                error,
                message: "Error in admin middleware",
            });
            expect(next).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
})