import { hashPassword, comparePassword } from "./authHelper";
import bcrypt from "bcrypt";

// Mock bcrypt
jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('Auth Helper Functions', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('hashPassword', () => {
        it('should hash a password successfully', async () => {
            const password = "testpassword";
            const hashedPassword = "hashedpassword";
            bcrypt.hash.mockResolvedValue(hashedPassword);

            const result = await hashPassword(password);
            expect(result).toBe(hashedPassword);
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
        });

        it('should handle errors and return undefined', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
            const password = "testpassword";
            const error = new Error("Hashing failed");
            bcrypt.hash.mockRejectedValue(error);

            const result = await hashPassword(password);
            expect(result).toBeUndefined();
            expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('comparePassword', () => {
        it('should return true if the passwords match', async () => {
            const password = "testpassword";
            const hashedPassword = "hashedpassword";
            bcrypt.compare.mockResolvedValue(true);

            const result = await comparePassword(password, hashedPassword);
            expect(result).toBe(true);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should return false if the passwords do not match', async () => {
            const password = "wrongpassword";
            const hashedPassword = "hashedpassword";
            bcrypt.compare.mockResolvedValue(false);

            const result = await comparePassword(password, hashedPassword);
            expect(result).toBe(false);
            expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
        });

        it('should handle comparison errors', async () => {
            const password = "testpassword";
            const hashedPassword = "hashedpassword";
            const error = new Error("Comparison failed");
            bcrypt.compare.mockRejectedValue(error);

            await expect(comparePassword(password, hashedPassword)).rejects.toThrow("Comparison failed");
        });
    });
});