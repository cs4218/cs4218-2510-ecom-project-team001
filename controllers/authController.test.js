import {
    updateProfileController
  } from "../controllers/authController.js";
  import { hashPassword } from "../helpers/authHelper.js";
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

    it("should update profile successfully with valid input", async () => {
      // ARRANGE
      mockRequest = {
        user: { _id: "testUserId" },
        body: {
          name: "newName",
          email: "new@test.com",
          password: "newPassword",
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
          message: "Profile Updated SUccessfully",
          updatedUser: mockUpdatedUser,
        })
      );
    });

    it("should return error if password is too short", async () => {
      // ARRANGE
      mockRequest = {
        user: { _id: "testUserId" },
        body: { password: "123" }, // too short
      };
      const mockUser = { _id: "testUserId" };
      userModel.findById.mockResolvedValue(mockUser);

      // ACT
      await updateProfileController(mockRequest, mockResponse);

      // ASSERT
      expect(userModel.findById).toHaveBeenCalledWith("testUserId");
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Passsword is required and 6 character long",
      });
      expect(userModel.findByIdAndUpdate).not.toHaveBeenCalled();
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
          message: "Error WHile Update profile",
        })
      );
    });
  });

