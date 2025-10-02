import mongoose from "mongoose";
import connectDB from "./db";

jest.mock('mongoose');

describe("connectDB", () => {
  let consoleLogSpy, consoleErrorSpy;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    consoleLogSpy = jest.spyOn(console, "log").mockImplementation();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    
    process.env.MONGO_URL = "mongodb://localhost:27017/testdb";
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  test("should connect to MongoDB successfully", async () => {
    // Arrange
    const mockConnection = {
      connection: {
        host: "localhost"
      }
    };
    mongoose.connect.mockResolvedValue(mockConnection);

    // Act
    await connectDB();

    // Assert
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining("Connected To Mongodb Database localhost")
    );
  });

  test("should handle connection errors", async () => {
    // Arrange
    const mockError = new Error("Connection failed");
    mongoose.connect.mockRejectedValue(mockError);

    // Act
    await connectDB();

    // Assert
    expect(mongoose.connect).toHaveBeenCalledWith(process.env.MONGO_URL);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error in Mongodb")
    );
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining("Connection failed")
    );
  });
});