import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";

// Protected routes token base
export const requireSignIn = async (req, res, next) => {
    try {
        const token = req.headers.authorization;
        // edge case: no token provided
        if (!token) { 
            return res.status(401).send({
                success: false,
                message: "No token provided",
            });
        }
        const decode = JWT.verify(token, process.env.JWT_SECRET);
        req.user = decode;
        next();
    } catch (error) {
        console.log(error);
        res.status(401).send({
            success: false,
            error,
            message: "Invalid or expired token",
        });
    }
};

//admin access
export const isAdmin = async (req, res, next) => {
    try {
        const user = await userModel.findById(req.user._id);
        // edge case: user not found
        if (!user) {
            return res.status(404).send({
                success: false,
                message: "User not found",
            });
        }
        if(user.role !== 1) {
            // fix status code to 403
            return res.status(403).send({
                success: false,
                message: "Forbidden",
            });
        } else {
            next();
        }
    } catch (error) {
        console.log(error);
        // fix status code to 500
        res.status(500).send({
            success: false,
            error,
            message: "Error in admin middleware",
        });
    }
};