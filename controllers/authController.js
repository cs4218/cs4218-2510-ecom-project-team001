import userModel from "../models/userModel.js";
import orderModel from "../models/orderModel.js";

import { comparePassword, hashPassword } from "./../helpers/authHelper.js";
import JWT from "jsonwebtoken";

import validator from "validator";

export const registerController = async (req, res) => {
  try {
    const { name, email, password, phone, address, answer } = req.body;
    //validations
    // fix: standardise error response format
    if (!name) {
      // return res.send({ error: "Name is Required" });
      // add status code
      return res.status(400).send({ 
        success: false,
        message: "Name is Required" // fix inconsistency
      }); 
    }
    if (!email) {
      // add status code
      return res.status(400).send({ 
        success: false,
        message: "Email is Required" 
      }); 
    }
    if (!password) {
      // add status code
      return res.status(400).send({ 
        success: false,
        message: "Password is Required" 
      });
    }
    if (!phone) {
      // add status code
      return res.status(400).send({ 
        success: false,
        message: "Phone no is Required" 
      });
    }
    if (!address) {
      // add status code
      return res.status(400).send({ 
        success: false,
        message: "Address is Required" 
      });
    }
    if (!answer) {
      // add status code
      return res.status(400).send({ 
        success: false,
        message: "Answer is Required" 
      });
    }

    // add a check for email format
    if (!validator.isEmail(email)) {
      return res.status(400).send({
        success: false,
        message: "Invalid email format",
      });
    }

    // add a check for phone format
    if (!validator.isMobilePhone(phone, 'any')) {
      return res.status(400).send({
        success: false,
        message: "Invalid phone number format",
      });
    }

    //check user
    const existingUser = await userModel.findOne({ email });
    //existing user
    if (existingUser) {
      // fix status code to 409
      return res.status(409).send({
        success: false,
        message: "Already Registered please login",
      });
    }
    //register user
    const hashedPassword = await hashPassword(password);
    //save
    const user = await new userModel({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      answer,
    }).save();

    res.status(201).send({
      success: true,
      message: "User Register Successfully",
      user,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      // message: "Errro in Registeration", 
      message: "Error in Registration", // fix typo
      error,
    });
  }
};

//POST LOGIN
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      // fix status code to 400
      return res.status(400).send({
        success: false,
        message: "Invalid email or password",
      });
    }

    // add a check for email format
    if (!validator.isEmail(email)) {
      return res.status(400).send({
        success: false,
        message: "Invalid email format",
      });
    }

    //check user
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Email is not registerd",
      });
    }
    const match = await comparePassword(password, user.password);
    if (!match) {
      // fix status code to 401
      return res.status(401).send({
        success: false,
        message: "Invalid Password",
      });
    }
    //token
    const token = await JWT.sign({ _id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.status(200).send({
      success: true,
      message: "login successfully",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error in login",
      error,
    });
  }
};

//forgotPasswordController

export const forgotPasswordController = async (req, res) => {
  try {
    const { email, answer, newPassword } = req.body;
    // fix: standardise error response format
    if (!email) {
      // res.status(400).send({ message: "Emai is required" });
      // add missing return
      return res.status(400).send({ 
        success: false,
        message: "Email is required"  // fix typo
      }); 
    }
    if (!answer) {
      // add missing return
      return res.status(400).send({ 
        success: false,
        message: "Answer is required" 
      }); 
    }
    if (!newPassword) {
      // add missing return
      return res.status(400).send({ 
        success: false,
        message: "New Password is required" 
      }); 
    }

    // add a check for email format
    if (!validator.isEmail(email)) {
      return res.status(400).send({
        success: false,
        message: "Invalid email format",
      });
    }

    //check
    const user = await userModel.findOne({ email, answer });
    //validation
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "Wrong Email Or Answer",
      });
    }
    const hashed = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, { password: hashed });
    res.status(200).send({
      success: true,
      message: "Password Reset Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Something went wrong",
      error,
    });
  }
};

//test controller
export const testController = (req, res) => {
  try {
    res.send("Protected Routes");
  } catch (error) {
    console.log(error);
    res.send({ error });
  }
};

//update prfole
export const updateProfileController = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const user = await userModel.findById(req.user._id);
    //password
    if (password && password.length < 6) {
      return res.json({ error: "Passsword is required and 6 character long" });
    }
    const hashedPassword = password ? await hashPassword(password) : undefined;
    const updatedUser = await userModel.findByIdAndUpdate(
      req.user._id,
      {
        name: name || user.name,
        password: hashedPassword || user.password,
        phone: phone || user.phone,
        address: address || user.address,
      },
      { new: true }
    );
    res.status(200).send({
      success: true,
      message: "Profile Updated SUccessfully",
      updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(400).send({
      success: false,
      message: "Error WHile Update profile",
      error,
    });
  }
};

//orders
export const getOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ buyer: req.user._id })
      .populate("products", "-photo")
      .populate("buyer", "name");
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};
//orders
export const getAllOrdersController = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("products", "-photo")
      .populate("buyer", "name")
      .sort({ createdAt: "-1" });
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error WHile Geting Orders",
      error,
    });
  }
};

//order status
export const orderStatusController = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const orders = await orderModel.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    res.json(orders);
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Error While Updateing Order",
      error,
    });
  }
};