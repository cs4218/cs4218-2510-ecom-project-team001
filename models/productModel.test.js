import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import productModel from "../models/productModel.js";

// Tests with different missing fields are generated with help of AI.
describe('Product Schema Tests', () => {
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
    await productModel.deleteMany({});
  });

  describe('Schema Validation', () => {
    test('should create a valid product', async () => {
      // Arrange
      const validProduct = {
        name: 'Test Product',
        slug: 'test-product',
        description: 'A test product description',
        price: 29.99,
        category: new mongoose.Types.ObjectId(),
        photo: {
          data: Buffer.from('fake image data'),
          contentType: 'image/jpeg'
        },
        quantity: 10,
        shipping: true
      };

      const product = new productModel(validProduct);
      const savedProduct = await product.save();

      expect(savedProduct._id).toBeDefined();
      expect(savedProduct.name).toBe(validProduct.name);
      expect(savedProduct.createdAt).toBeDefined();
      expect(savedProduct.updatedAt).toBeDefined();
    });

    test('should fail validation when required fields are missing', async () => {
      // Arrange
      const invalidProduct = new productModel({});

      // Act + Assert
      await expect(invalidProduct.save()).rejects.toThrow();
    });

    test('should fail when name is missing', async () => {
      // Arrange
      const product = new productModel({
        slug: 'test-slug',
        description: 'Test description',
        price: 10,
        category: new mongoose.Types.ObjectId(),
        quantity: 5
      });

      // Act + Assert
      await expect(product.save()).rejects.toThrow(/name/);
    });

    test('should fail when slug is missing', async () => {
      // Arrange
      const product = new productModel({
        name: 'Test Product',
        description: 'Test description',
        price: 10,
        category: new mongoose.Types.ObjectId(),
        quantity: 5
      });

      // Act + Assert
      await expect(product.save()).rejects.toThrow(/slug/);
    });

    test('should fail when description is missing', async () => {
      // Arrange
      const product = new productModel({
        name: 'Test Product',
        slug: 'test-slug',
        price: 10,
        category: new mongoose.Types.ObjectId(),
        quantity: 5
      });

      // Act + Assert
      await expect(product.save()).rejects.toThrow(/description/);
    });

    test('should fail when price is missing', async () => {
      // Arrange
      const product = new productModel({
        name: 'Test Product',
        slug: 'test-slug',
        description: 'Test description',
        category: new mongoose.Types.ObjectId(),
        quantity: 5
      });

      // Act + Assert
      await expect(product.save()).rejects.toThrow(/price/);
    });

    test('should fail when price is not a number', async () => {
      // Arrange
      const product = new productModel({
        name: 'Test Product',
        slug: 'test-slug',
        description: 'Test description',
        price: 'not-a-number',
        category: new mongoose.Types.ObjectId(),
        quantity: 5
      });

      // Act + Assert
      // Regex is obtained using chatgpt
      await expect(product.save()).rejects.toThrow(/(?=.*\bprice\b)(?=.*\bNumber\b)/);
    });

    test('should fail when category is missing', async () => {
      // Arrange
      const product = new productModel({
        name: 'Test Product',
        slug: 'test-slug',
        description: 'Test description',
        price: 10,
        quantity: 5
      });

      // Act + Assert
      await expect(product.save()).rejects.toThrow(/category/);
    });

    test('should fail when quantity is missing', async () => {
      // Arrange
      const product = new productModel({
        name: 'Test Product',
        slug: 'test-slug',
        description: 'Test description',
        price: 10,
        category: new mongoose.Types.ObjectId()
      });

      // Act + Assert
      await expect(product.save()).rejects.toThrow(/quantity/);
    });

    test('should fail when quantity is not a number', async () => {
      // Arrange
      const product = new productModel({
        name: 'Test Product',
        slug: 'test-slug',
        description: 'Test description',
        price: 10,
        category: new mongoose.Types.ObjectId(),
        quantity: 'not-a-number'
      });

      // Act + Assert
      // Regex is obtained using chatgpt
      await expect(product.save()).rejects.toThrow(/(?=.*\bquantity\b)(?=.*\bNumber\b)/);
    });
  });

  describe('Schema Properties', () => {
    test('should have correct field types', () => {
      // Arrange
      const paths = productModel.schema.paths;
      
      // Act + Assert
      expect(paths.name.instance).toBe('String');
      expect(paths.slug.instance).toBe('String');
      expect(paths.description.instance).toBe('String');
      expect(paths.price.instance).toBe('Number');
      expect(paths.quantity.instance).toBe('Number');
      expect(paths.shipping.instance).toBe('Boolean');
    });

    test('should have required fields marked correctly', () => {
      // Arrange
      const paths = productModel.schema.paths;
      
      // Act + Assert
      expect(paths.name.isRequired).toBe(true);
      expect(paths.slug.isRequired).toBe(true);
      expect(paths.description.isRequired).toBe(true);
      expect(paths.price.isRequired).toBe(true);
      expect(paths.category.isRequired).toBe(true);
      expect(paths.quantity.isRequired).toBe(true);
    });

    test('should have timestamps enabled', () => {
      // Act + Assert
      expect(productModel.schema.options.timestamps).toBe(true);
    });

    test('should have category reference to Category model', () => {
      const categoryPath = productModel.schema.paths.category;
      // Act + Assert
      expect(categoryPath.options.ref).toBe('Category');
    });
  });

  describe('Photo Field', () => {
    test('should accept Buffer data for photo', async () => {
      // Arrange
      const photoBuffer = Buffer.from('fake image data');
      
      const product = new productModel({
        name: 'Product with Photo',
        slug: 'product-with-photo',
        description: 'A product with photo',
        price: 15.99,
        category: new mongoose.Types.ObjectId(),
        quantity: 3,
        photo: {
          data: photoBuffer,
          contentType: 'image/jpeg'
        }
      });

      // Act
      const savedProduct = await product.save();
      // Assert
      expect(savedProduct.photo.data.toString()).toBe(photoBuffer.toString());
      expect(savedProduct.photo.contentType).toBe('image/jpeg');
    });
  });

  describe('CRUD Operations', () => {
    test('should create and retrieve product', async () => {
      // Arrange
      const productData = {
        name: 'CRUD Test Product',
        slug: 'crud-test-product',
        description: 'Testing CRUD operations',
        price: 45.50,
        category: new mongoose.Types.ObjectId(),
        quantity: 7
      };

      // Act
      const product = await productModel.create(productData);
      const foundProduct = await productModel.findById(product._id);

      // Assert
      expect(foundProduct.name).toBe(productData.name);
    });

    test('should update product', async () => {
      // Arrange
      const product = await productModel.create({
        name: 'Original Name',
        slug: 'original-slug',
        description: 'Original description',
        price: 20,
        category: new mongoose.Types.ObjectId(),
        quantity: 5
      });

      // Act
      const updatedProduct = await productModel.findByIdAndUpdate(
        product._id,
        { name: 'Updated Name', price: 25 },
        { new: true }
      );

      // Assert
      expect(updatedProduct.name).toBe('Updated Name');
      expect(updatedProduct.price).toBe(25);
    });

    test('should delete product', async () => {
      // Arrange
      const product = await productModel.create({
        name: 'To Delete',
        slug: 'to-delete',
        description: 'Will be deleted',
        price: 10,
        category: new mongoose.Types.ObjectId(),
        quantity: 1
      });

      // Act
      await productModel.findByIdAndDelete(product._id);
      const deletedProduct = await productModel.findById(product._id);

      // Assert
      expect(deletedProduct).toBeNull();
    });
  });
});