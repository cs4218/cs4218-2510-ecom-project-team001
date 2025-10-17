import {
    getOrdersController,
    getAllOrdersController,
    orderStatusController,
    updateProfileController,
    registerController,
    loginController,
    forgotPasswordController,
    testController
  } from "../controllers/authController.js";
import { comparePassword, hashPassword } from "../helpers/authHelper.js";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import validator from "validator";

jest.mock("../models/userModel.js");
// jest.mock("./../helpers/authHelper.js");
jest.mock("./../helpers/authHelper.js", () => ({
    hashPassword: jest.fn(),
    comparePassword: jest.fn(),
}));
jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");
jest.mock("validator", () => ({
    isEmail: jest.fn(),
    isMobilePhone: jest.fn(),
}));

  // need to mock our orderModel
  // chatGPT is used to aid in creation of the mockings below

  jest.mock("../models/orderModel.js", () => ({
    __esModule: true,   // tells Jest this is an ES module
    default: {
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  }));

  // chatGPT is aid in creation of the set of unit tests below, but manual effort is used to tweak mockings
  describe("getOrdersController", () => {
    let mockRequest, mockResponse;

    // ARRANGE
    const mockOrders = [{
      products: ["testProduct"],
      payment: {},
      buyer: "testBuyer",
      status: "Processing",
    }];

    // chatGPT is used to create the mockings below
    const mockPopulate2 = jest.fn().mockReturnValue(mockOrders);
    const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
    const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate1 });

    beforeEach(() => {
      // simple mockResponse with json field
      // chatGPT is used to create the mockResponse
      mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it("should return correct orders for valid user._id", async () => {
      // ARRANGE
      mockRequest = { user: { _id: "testUserId" } }; // valid user._id
      orderModel.find.mockImplementation(mockFind); // mock our find and populate

      // ACT
      await getOrdersController(mockRequest, mockResponse);

      // ASSERT (chatGPT is used to create what to expect)
      expect(mockFind).toHaveBeenCalledWith({ buyer: mockRequest.user._id });
      expect(mockPopulate1).toHaveBeenCalledWith("products", "-photo");
      expect(mockPopulate2).toHaveBeenCalledWith("buyer", "name");
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrders);
    });

    it("should return 500 status and error message for missing user._id", async () => {
      // ARRANGE
      mockRequest = {}; // no user._id
      orderModel.find.mockImplementation(mockFind); // mock our find and populate

      // ACT
      await getOrdersController(mockRequest, mockResponse);

      // ASSERT (chatGPT is used to create what to expect)
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Getting Orders",
        })
      );
    });

    // chatGPT is used to create the unit test below
    it("should return 500 status and error message on DB error", async () => {
        // ARRANGE
        orderModel.find.mockImplementation(() => {
          throw new Error("DB fail");
        });

        // ACT
        await getAllOrdersController(mockRequest, mockResponse);

        // ASSERT
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: false,
            message: "Error While Getting Orders",
          })
        );
      });
  });

  // chatGPT is aid in creation of the set of unit tests below, but manual effort is used to tweak mockings
  describe("getAllOrdersController", () => {
    let mockRequest, mockResponse;

    // ARRANGE
    const mockOrders = [{
      products: ["testProduct"],
      payment: {},
      buyer: "testBuyer",
      status: "Processing",
    }];

    // chatGPT is used to create the mockSort below
    const mockSort = jest.fn().mockReturnValue(mockOrders);
    const mockPopulate2 = jest.fn().mockReturnValue({ sort: mockSort });
    const mockPopulate1 = jest.fn().mockReturnValue({ populate: mockPopulate2 });
    const mockFind = jest.fn().mockReturnValue({ populate: mockPopulate1 });

    beforeEach(() => {
      mockRequest = {}; // not used in this controller
      mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };

      // reset mocks
      jest.clearAllMocks();
    });

    it("should return all orders successfully", async () => {
      // ARRANGE
      orderModel.find.mockImplementation(mockFind);

      // ACT
      await getAllOrdersController(mockRequest, mockResponse);

      // ASSERT
      expect(orderModel.find).toHaveBeenCalledWith({});
      expect(mockPopulate1).toHaveBeenCalledWith("products", "-photo");
      expect(mockPopulate2).toHaveBeenCalledWith("buyer", "name");
      expect(mockSort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrders);
    });

    // chatGPT is used to create the unit test below
    it("should return 500 status and error message on DB error", async () => {
      // ARRANGE
      orderModel.find.mockImplementation(() => {
        throw new Error("DB fail");
      });

      // ACT
      await getAllOrdersController(mockRequest, mockResponse);

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Getting Orders",
        })
      );
    });
  });

  // chatGPT is aid in creation of the set of unit tests below, but manual effort is used to tweak mockings
  describe("orderStatusController", () => {
    let mockRequest, mockResponse;

    beforeEach(() => {
      mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it("should update and return the order when valid orderId and status are provided", async () => {
      // ARRANGE
      const mockOrder = { _id: "testOrderId", status: "Shipped" };
      mockRequest = {
        params: { orderId: "testOrderId" },
        body: { status: "Shipped" },
      };
      orderModel.findByIdAndUpdate.mockResolvedValue(mockOrder);

      // ACT
      await orderStatusController(mockRequest, mockResponse);

      // ASSERT
      expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "testOrderId",
        { status: "Shipped" },
        { new: true }
      );
      expect(mockResponse.json).toHaveBeenCalledWith(mockOrder);
    });

    it("should return 500 status and error message if DB update fails", async () => {
      // ARRANGE
      mockRequest = {
        params: { orderId: "badId" },
        body: { status: "Invalid" },
      };
      orderModel.findByIdAndUpdate.mockRejectedValue(new Error("DB Error"));

      // ACT
      await orderStatusController(mockRequest, mockResponse);

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Updating Order",
        })
      );
    });

    it("should return 500 status and error message if orderId is missing", async () => {
      // ARRANGE
      mockRequest = { params: {}, body: { status: "Processing" } };

      // ACT
      await orderStatusController(mockRequest, mockResponse);

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Updating Order",
        })
      );
    });
  });


  // chatGPT is used to aid in creation of the set of unit tests below, but manual effort is used to tweak mockings and decide what to test
  describe("updateProfileController", () => {
    let mockRequest, mockResponse;

    beforeEach(() => {
      mockResponse = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      jest.clearAllMocks();
    });

    it("should update profile successfully with when password length > 6", async () => {
      // ARRANGE
      mockRequest = {
        user: { _id: "testUserId" },
        body: {
          name: "newName",
          email: "new@test.com",
          password: "newPassword123",
          address: "newAddress",
          phone: "123456",
        },
      };
      const mockUser = {
        _id: "testUserId",
        name: "oldName",
        email: "oldEmail@gmail.com",
        password: "oldPassword",
        phone: "987654",
        address: "oldAddress",
      };
      const mockHashedPassword = "hashedNewPassword";
      const mockUpdatedUser = { ...mockUser, ...mockRequest.body, password: mockHashedPassword };

      userModel.findById.mockResolvedValue(mockUser);
      hashPassword.mockResolvedValue(mockHashedPassword);
      userModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // ACT
      await updateProfileController(mockRequest, mockResponse);

      // ASSERT
      expect(userModel.findById).toHaveBeenCalledWith("testUserId");
      expect(hashPassword).toHaveBeenCalledWith(mockRequest.body.password);
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "testUserId",
        {
          ...mockRequest.body,
          password: mockHashedPassword,
        },
        { new: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Profile Updated Successfully",
          updatedUser: mockUpdatedUser,
        })
      );
    });

    it("should update profile successfully with when password length = 6", async () => {
        // ARRANGE
        mockRequest = {
          user: { _id: "testUserId" },
          body: {
            name: "newName",
            email: "new@test.com",
            password: "passwd",
            address: "newAddress",
            phone: "123456",
          },
        };
        const mockUser = {
          _id: "testUserId",
          name: "oldName",
          email: "oldEmail@gmail.com",
          password: "oldPassword",
          phone: "987654",
          address: "oldAddress",
        };
        const mockHashedPassword = "hashedNewPassword";
        const mockUpdatedUser = { ...mockUser, ...mockRequest.body, password: mockHashedPassword };

        userModel.findById.mockResolvedValue(mockUser);
        hashPassword.mockResolvedValue(mockHashedPassword);
        userModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

        // ACT
        await updateProfileController(mockRequest, mockResponse);

        // ASSERT
        expect(userModel.findById).toHaveBeenCalledWith("testUserId");
        expect(hashPassword).toHaveBeenCalledWith(mockRequest.body.password);
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "testUserId",
          {
            ...mockRequest.body,
            password: mockHashedPassword,
          },
          { new: true }
        );
        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: "Profile Updated Successfully",
            updatedUser: mockUpdatedUser,
          })
        );
      });

    it("should return error if password length < 6", async () => {
      // ARRANGE
      mockRequest = {
        user: { _id: "testUserId" },
        body: { password: "123" },
      };
      const mockUser = { _id: "testUserId" };
      userModel.findById.mockResolvedValue(mockUser);

      // ACT
      await updateProfileController(mockRequest, mockResponse);

      // ASSERT
      expect(userModel.findById).toHaveBeenCalledWith("testUserId");
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Password is required and 6 character long",
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should keep old password if empty password string is provided", async () => {
        mockRequest = {
          user: { _id: "testUserId" },
          body: { password: "" }, // empty string
        };
        const mockUser = {
          _id: "testUserId",
          name: "Old Name",
          email: "old@test.com",
          password: "oldHash",
          phone: "999999",
          address: "oldAddress",
        };
        const mockUpdatedUser = { ...mockUser };

        userModel.findById.mockResolvedValue(mockUser);
        userModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

        await updateProfileController(mockRequest, mockResponse);

        // hashPassword should not be called because "" is falsy
        expect(hashPassword).not.toHaveBeenCalled();

        // the DB update should reuse the old password
        expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
          "testUserId",
          expect.objectContaining({ password: "oldHash" }),
          { new: true }
        );

        expect(mockResponse.status).toHaveBeenCalledWith(200);
        expect(mockResponse.send).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            updatedUser: mockUpdatedUser,
          })
        );
      });

    it("should use old values if some fields are missing", async () => {
      // ARRANGE
      mockRequest = {
        user: { _id: "testUserId" },
        body: { name: "OnlyNameUpdated" },
      };
      const mockUser = {
        _id: "testUserId",
        name: "Old Name",
        password: "oldhash",
        phone: "987654",
        address: "Old Address",
      };
      const mockUpdatedUser = { ...mockUser, name: "OnlyNameUpdated" };

      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedUser);

      // ACT
      await updateProfileController(mockRequest, mockResponse);

      // ASSERT
      expect(userModel.findById).toHaveBeenCalledWith("testUserId");
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "testUserId",
        {
          name: "OnlyNameUpdated",
          password: "oldhash",
          phone: "987654",
          address: "Old Address",
        },
        { new: true }
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          updatedUser: mockUpdatedUser,
        })
      );
    });

    it("should return 400 if DB lookup fails", async () => {
      // ARRANGE
      mockRequest = {
        user: { _id: "testUserId" },
        body: { name: "Test" },
      };
      userModel.findById.mockRejectedValue(new Error("DB Error"));

      // ACT
      await updateProfileController(mockRequest, mockResponse);

      // ASSERT
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Update profile",
        })
      );
    });
  });



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
            address: "123 Street",
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
            address: "123 Street",
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
                message: "Email is not registered"
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
