import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import categoryModel from "../models/categoryModel.js";

describe('Category Model tests', () => {
    let mongoServer;

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
        await categoryModel.deleteMany({});
      });

    describe('Schema Validation', () => {
        test('should create a valid category', async () => {
            // Arrange
            const validCategory = {
                name: 'Gadgets',
                slug: 'gadgets'
            }

            // Act
            const category = new categoryModel(validCategory);
            const savedCategory = await category.save();

            // Assert
            expect(savedCategory._id).toBeDefined();
            expect(savedCategory.name).toBe(validCategory.name);
            expect(savedCategory.slug).toBe(validCategory.slug);
        })

        test('should fail when name is missing', async () => {
            // Arrange
            const missingName = new categoryModel({
                slug: 'missing'
            });

            // Act, Assert
            await expect(missingName.save()).rejects.toThrow(/name/);
        })

        test('should fail when slug is missing', async () => {
            // Arrange
            const missingSlug = new categoryModel({
                name: 'Name'
            });

            // Act, Assert
            await expect(missingSlug.save()).rejects.toThrow(/slug/);
        })

        test('should fail when the name is not unique', async () => {
            // Arrange
            const cat1 = new categoryModel({
                name: 'Cat1',
                slug: 'cat1'
            });
            await cat1.save();

            const cat2 = new categoryModel({
                name: 'Cat1',
                slug: 'cat2'
            });

            // Act, Assert
            await expect(cat2.save()).rejects.toThrow(/duplicate key error/);
        })

        test('should fail when the slug is not unique', async () => {
            // Arrange
            const cat1 = new categoryModel({
                name: 'Cat1',
                slug: 'cat1'
            });
            await cat1.save();

            const cat2 = new categoryModel({
                name: 'Cat2',
                slug: 'cat1'
            });

            // Act, Assert
            await expect(cat2.save()).rejects.toThrow(/duplicate key error/);
        })

        test('should automatically convert slug to lowercase', async () => {
            // Arrange
            const invalidSlug = new categoryModel({
                name: 'Name',
                slug: 'INVALID'
            });

            // Act
            const savedCategory = await invalidSlug.save();

            // Assert
            expect(savedCategory.slug).toBe('invalid');
        })

        test('should convert name to string', async () => {
            // Arrange
            const invalidName = new categoryModel({
                name: 123,
                slug: 'valid-slug'
            });

            // Act
            const savedCategory = await invalidName.save();

            // Assert
            expect(savedCategory.name).toBe('123');
        })

        test('should convert slug to string', async () => {
            // Arrange
            const invalidSlug = new categoryModel({
                name: 'Valid Name',
                slug: 456
            });

            // Act
            const savedCategory = await invalidSlug.save();

            // Assert
            expect(savedCategory.slug).toBe('456');
        })
    })

    describe('Schema Properties', () => {
        test('should have correct field types', async () => {
            // Arrange
            const paths = categoryModel.schema.paths;

            // Act + Assert
            expect(paths.name.instance).toBe('String');
            expect(paths.slug.instance).toBe('String');
        })

        test('should have the required fields', async () => {
            // Arrange
            const paths = categoryModel.schema.paths;

            // Act + Assert
            expect(paths.name.isRequired).toBe(true);
            expect(paths.slug.isRequired).toBe(true);
        })
    })

    describe('CRUD Operations', () => {
        test('should create and retrieve a category', async () => {
            const categoryData = {
                name: "Gadgets",
                slug: "gadgets"
            };

            // Act
            const category = new categoryModel(categoryData);
            await category.save();
            const foundCategory = await categoryModel.findById(category._id);

            // Assert
            expect(foundCategory).not.toBeNull();
            expect(foundCategory.name).toBe(categoryData.name);
            expect(foundCategory.slug).toBe(categoryData.slug);
        })

        test('should update a category', async () => {
            const categoryData = {
                name: "Original name",
                slug: "original-slug"
            };

            // Act
            const category = new categoryModel(categoryData);
            await category.save();

            const updatedCategory = await categoryModel.findByIdAndUpdate(
                category._id,
                { name: "Updated name", slug: "updated-slug" },
                { new: true }
            )
            
            // Assert
            expect(updatedCategory.name).toBe("Updated name");
            expect(updatedCategory.slug).toBe("updated-slug");
        })

        test('should delete a category', async () => {
            // Arrange
            const categoryData = {
                name: "To be deleted",
                slug: "to-be-deleted"
            };
            const category = new categoryModel(categoryData);
            await category.save();

            // Act
            await categoryModel.findByIdAndDelete(category._id);
            const deletedCategory = await categoryModel.findById(category._id);

            // Assert
            expect(deletedCategory).toBeNull();
        })
    })
})