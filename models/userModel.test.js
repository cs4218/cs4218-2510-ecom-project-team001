import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import userModel from "../models/userModel.js";

describe("User Schema Tests", () => {
  let mongoServer;

  const buildUser = (overrides = {}) => ({
    name: "Cheng Hou",
    email: "chenghou@ch.com",
    password: "hashed-password",
    phone: "98765432",
    address: "Utown",
    answer: "Badminton",
    ...overrides,
  });

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await userModel.deleteMany({});
  });

  // Technique: Decision Table Testing — exercises the rule row where every required column is
  // satisfied, and the action corresponding to a valid user would be invoked.
  it("creates a valid user document", async () => {
    // Arrange
    const payload = buildUser();

    // Act
    const user = await userModel.create(payload);

    // Assert
    expect(user._id).toBeDefined();
    expect(user.email).toBe(payload.email);
    expect(user.createdAt).toBeDefined();
    expect(user.updatedAt).toBeDefined();
  });

  // Technique: Decision Table Testing — enumerates the rule rows where exactly one mandatory column
  // is missing, ensuring each such rule invoke an 'invalid' action.
  test.each([
    ["name"],
    ["email"],
    ["password"],
    ["phone"],
    ["address"],
    ["answer"],
  ])("rejects when %s is missing", async (missingField) => {
    // Arrange
    const payload = buildUser();
    delete payload[missingField];

    // Act + Assert
    const instance = new userModel(payload);
    await expect(instance.save()).rejects.toThrow(missingField);
  });

  // Technique: Equivalence Partitioning — "unique email" and "duplicate email" partitions. This
  // test verifies the schema's unique constraiant.
  it("enforces unique email addresses", async () => {
    // Arrange
    const firstUser = buildUser();
    const duplicateEmailUser = buildUser({ name: "Duplicate user" });
    await userModel.create(firstUser);

    // Act + Assert
    await expect(userModel.create(duplicateEmailUser)).rejects.toThrow(
      /duplicate key/
    );
  });

  // Technique: Boundary Value Analysis — verifies the trim behavior of leading and trailing white-
  // spaces. This verifies the trim property of the name field in the schema.
  it("trims surrounding whitespace from name", async () => {
    // Arrange
    const payload = buildUser({ name: "   Tan Jun Jie   " });

    // Act
    const saved = await userModel.create(payload);

    // Assert
    expect(saved.name).toBe("Tan Jun Jie");
  });

  // Technique: Control Flow Testing — sensitize the code path where the user.role field is omitted,
  // ensuring the default branch executes and assigns role 0.
  it("defaults role to zero when omitted", async () => {
    // Arrange
    const payload = buildUser();
    delete payload.role;

    // Act
    const saved = await userModel.create(payload);

    // Assert
    expect(saved.role).toBe(0);
  });
});
