import {
    getOrdersController,
    getAllOrdersController,
    orderStatusController,
    updateProfileController
  } from "../controllers/authController.js";
  import { hashPassword } from "../helpers/authHelper.js";
  import orderModel from "../models/orderModel.js";
  import userModel from "../models/userModel.js";

  // need to mock our orderModel
  // chatGPT is used to aid in creation of the mockings below

  jest.mock("../models/orderModel.js", () => ({
    __esModule: true,   // tells Jest this is an ES module
    default: {
      find: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  }));

  // mock userModel
  jest.mock("../models/userModel.js", () => ({
    __esModule: true,
    default: {
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
    },
  }));

  // mock hashPassword
  jest.mock("../helpers/authHelper.js", () => ({
    __esModule: true,
    hashPassword: jest.fn(),
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
      expect(mockSort).toHaveBeenCalledWith({ createdAt: "-1" });
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

