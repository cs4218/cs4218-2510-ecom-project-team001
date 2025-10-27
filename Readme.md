# CS4218 Project - Virtual Vault

[CI link](https://github.com/cs4218/cs4218-2510-ecom-project-team001/actions/runs/18659635667/job/53196898874)

Tests have been written in part with the help of AI

## Team Member Contributions

### MS1

| Features                | Client Related Files (/client/src/)                                                                                                                  | Server Related Files (./)                                                                                                                                                                                                                                                                                                                    | Student                |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **Protected Routes**    | - context/auth.js                                                                                                                                    | - helpers/authHelper.js<br>- middlewares/authMiddleware.js                                                                                                                                                                                                                                                                                   | Pearlynn Toh Jieying   |
| **Registration**        | - pages/Auth/Register.js                                                                                                                             | - controllers/authController.js<br>1. registerController<br>2. loginController<br>3. forgotPasswordController<br>4. testController                                                                                                                                                                                                           | Pearlynn Toh Jieying   |
| **Login**               | - pages/Auth/Login.js                                                                                                                                |                                                                                                                                                                                                                                                                                                                                              | Pearlynn Toh Jieying   |
| **ForgotPassword**      | - pages/Auth/ForgotPassword.js                                                                                                                       |                                                                                                                                                                                                                                                                                                                                              | Pearlynn Toh Jieying   |
| **Admin Dashboard**     | - components/AdminMenu.js<br>- pages/admin/AdminDashboard.js                                                                                         |                                                                                                                                                                                                                                                                                                                                              | Pearlynn Toh Jieying   |
| **Admin Actions**       | - components/Form/CategoryForm.js<br>- pages/admin/CreateCategory.js<br>- pages/admin/CreateProduct.js<br>- pages/admin/UpdateProduct.js             | - controllers/categoryController.js<br>1. createCategoryController<br>2. updateCategoryController<br>3. deleteCategoryController                                                                                                                                                                                                             | Lam Cheng Hou          |
| **Admin View Orders**   | - pages/admin/AdminOrders.js                                                                                                                         |                                                                                                                                                                                                                                                                                                                                              | Lam Cheng Hou          |
| **Admin View Products** | - pages/admin/Products.js                                                                                                                            | - controllers/productController.js<br>1. createProductController<br>2. deleteProductController<br>3. updateProductController                                                                                                                                                                                                                 | Lam Cheng Hou          |
| **General**             | - components/Routes/Private.js<br>- components/UserMenu.js<br>- pages/user/Dashboard.js                                                              | - models/userModel.js                                                                                                                                                                                                                                                                                                                        | Lam Cheng Hou          |
| **Order**               | - pages/user/Orders.js                                                                                                                               | - controllers/authController.js<br>1. updateProfileController<br>2. getOrdersController<br>3. getAllOrdersController<br>4. orderStatusController<br>- models/orderModel.js                                                                                                                                                                   | Aaron Joel Tan Tze Ern |
| **Profile**             | - pages/user/Profile.js                                                                                                                              |                                                                                                                                                                                                                                                                                                                                              | Aaron Joel Tan Tze Ern |
| **Admin View Users**    | - pages/admin/Users.js                                                                                                                               |                                                                                                                                                                                                                                                                                                                                              | Aaron Joel Tan Tze Ern |
| **Search**              | - components/Form/SearchInput.js<br>- context/search.js<br>- pages/Search.js                                                                         |                                                                                                                                                                                                                                                                                                                                              | Aaron Joel Tan Tze Ern |
| **Product**             | - pages/ProductDetails.js<br>- pages/CategoryProduct.js                                                                                              | - controllers/productController.js<br>1. getProductController<br>2. getSingleProductController<br>3. productPhotoController<br>4. productFiltersController<br>5. productCountController<br>6. productListController<br>7. searchProductController<br>8. realtedProductController<br>9. productCategoryController<br>- models/productModel.js | Wong Li Yuan           |
| **Contact**             | - pages/Contact.js                                                                                                                                   |                                                                                                                                                                                                                                                                                                                                              | Wong Li Yuan           |
| **Policy**              | - pages/Policy.js                                                                                                                                    |                                                                                                                                                                                                                                                                                                                                              | Wong Li Yuan           |
| **General**             | - components/Footer.js<br>- components/Header.js<br>- components/Layout.js<br>- components/Spinner.js<br>- pages/About.js<br>- pages/Pagenotfound.js | - config/db.js                                                                                                                                                                                                                                                                                                                               | Wong Li Yuan           |
| **Home**                | - pages/Homepage.js                                                                                                                                  |                                                                                                                                                                                                                                                                                                                                              | Wang Jingting          |
| **Cart**                | - context/cart.js<br>- pages/CartPage.js                                                                                                             |                                                                                                                                                                                                                                                                                                                                              | Wang Jingting          |
| **Category**            | - hooks/useCategory.js<br>- pages/Categories.js                                                                                                      | - controllers/categoryController.js<br>1. categoryControlller<br>2. singleCategoryController<br>- models/categoryModel.js                                                                                                                                                                                                                    | Wang Jingting          |
| **Payment**             |                                                                                                                                                      | - controllers/productController.js<br>1. braintreeTokenController<br>2. brainTreePaymentController                                                                                                                                                                                                                                           | Wang Jingting          |

### MS 2

**Pearlynn Toh Jieying**
| Component | Integration Tests | UI/E2E Tests | Bug Fixes |
|-----------|-------------------|--------------|-----------|
| **Protected Routes** | `authMiddleware.integration.test.js` | None | None |
| **Registration** | • `Registration.integration.test.js`<br>• `authControllerLoginRegisterForgotPassword.integration.test.js` | `Register.spec.js` | None |
| **Login** | `Login.integration.test.js`<br>• `authControllerLoginRegisterForgotPassword.integration.test.js` | `Login.spec.js` | When I try to access `http://localhost:3000/dashboard/user` when I am logged out, I get redirected to `http://login/` instead of `http://localhost:3000/login` |
| **ForgotPassword** | • `ForgotPassword.integration.test.js`<br>• `authControllerLoginRegisterForgotPassword.integration.test.js` | •`ForgotPassword.spec.js` | Add missing ForgotPassword page |
| **Admin Dashboard** | `AdminDashboard.integration.js` | • `AdminMenu.spec.js`<br>• `AdminDashboard.spec.js` | None |

**Wong Li Yuan**
| Component | Integration Tests | UI/E2E Tests | Bug Fixes |
|-----------|-------------------|--------------|-----------|
| **ProductDetails** | • `productController.integration.test.js`: Backend API (`/get-product/:slug`, `/product-photo/:pid`, `/related-product/:pid/:cid`) with controllers & models<br>• `ProductDetails.integration.test.js`: Frontend-backend full pipeline<br>• `ProductDetails.integration.test.js`: Cart Context state management | • `ProductDetails.spec.js`: View product & add to cart, related products navigation, multiple additions, no similar items handling | Non-existent product → 404 redirect |
| **CategoryProduct** | • `productController.integration.test.js`: Backend API (`/product-category/:slug`) with controllers & models<br>• `CategoryProduct.integration.test.js`: Frontend-backend category display & navigation | • `CategoryProduct.spec.js`: Browse by category, navigate to product details | Non-existent category → 404 redirect |
| **Header** | • `useCategory.integration.test.js`: useCategory hook with controllers & database<br>• `Header.integration.test.js`: Frontend-backend categories dropdown<br>• `Header.integration.test.js`: Auth & Cart Contexts (conditional UI, logout, cart badge) | • `Header.spec.js`: Navigation (user/admin/guest), logout flow & localStorage clearing, cart badge updates, categories dropdown navigation | None |
| **Footer** | None | • `Footer.spec.js`: Footer links navigation | None |
| **Page Not Found** | None | • `Pagenotfound.spec.js`: 404 content & home navigation | None |

**Wang Jingting**
| Component | Integration Tests | UI/E2E Tests | Bug Fixes |
|-----------|-------------------|--------------|-----------|
| **HomePage** | • `productController.integration.test.js` -- Integration between controller, category model, and product model: <br/> - productFiltersController (`/product-filters`) <br/> <br/> • `HomePage.integration.test.js` -- Integration between HomePage components and real endpoints | • `HomePage.spec.js`: <br/> View all products, filter products, reset filter, view product details, add product to cart | Fix filter error messages to distinguish between between types of errors |
| **Categories** | • `categoryController.integration.test.js` -- Integration between controllers and category model: <br/> - categoryController (`/get-category`) <br/> - singleCategoryController (`/single-category/:slug`) <br/> <br/> • `Categories.integration.test.js` -- Integration between Categories components and real endpoints | • `Categories.spec.js`: <br/> View all categories, navigate to category page | None |
| **CartPage** | • `payment.integration.test.js` -- Integration between controllers and order model:<br/> - braintreeTokenController (`braintree/token`) <br/> - braintreePaymentController (`braintree/payment`) <br/> <br/> • `CartPage.integration.test.js` -- Integration between CartPage components and real endpoints | • `CartPage.spec.js`: View cart, remove items from cart, update address from cart, checkout process | • Only get braintree token when user is logged in <br/> <br/> • Await creation of new order so payment has time to finalise and return successfully |

**Lam Cheng Hou (Admin Pages, Dashboard, Menu etc.)**
| Component | Integration Tests | UI/E2E Tests | Bug Fixes |
|-----------|-------------------|--------------|-----------|
| **CreateCategory/CategoryForm** | • `CreateCategory.integration.test.js` -- Integration between CreateCategory and the server, and between CreateCategory and the CategoryForm component. <br/><br/> `categoryController.integration.test.js` -- Integration between server / controlleres and category model. (tests the endpoint) <br/> - createCategoryController <br/>- updateProductController <br/> - deleteProductController | • `CreateCategory.spec.js`: <br/> 1. Admin enters a non-empty new category into the textbox and clicks the ‘Submit’ and sees their newly-created category. <br/>2. Admin clicks on ‘Edit’ for an existing category, inputs a new category name into the textbox, hits ‘Submit’ and sees their updated category. <br/> 3. Admin clicks on ‘Delete’ for an existing category and sees the deletion. | None
| **CreateProduct** | • `CreateProduct.integration.test.js` -- Integration between CreateProduct.js and the server and AdminMenu.<br/><br/> • `productController.integration.test.js` -- Integration between server / controlleres and product model. (tests the endpoint) <br/> - createProductController <br/> | • `CreateProduct.spec.js`: <br/> 1. Admin fills in all fields in the form, clicks on ‘Create Product’, and is re-directed to Products.js where the newly-created product appears on top <br/> 2. Admin fills in all but one field, and the product cannot be created, with error toast.| Improve error handling. |
| **UpdateProduct** | • `UpdateProduct.integration.test.js` -- Integration between UpdateProduct.js and the server.<br/><br/> • `productController.integration.test.js` -- Integration between server / controlleres and product model. (tests the endpoint) <br/> - updateProductController <br/> - deleteProductController | • `UpdateProduct.spec.js`: <br/> 1. Admin accesses UpdateProduct.js for a product via the Products.js page will see all fields pre-filled, and can update the product by editing fields, and clicking on ‘UPDATE PRODUCT’. If all fields are filled, they will be re-directed to Products.js. Otherwise, they will receive an error toast. <br/> 2. Admin accesses UpdateProduct.js, clicks on ‘DELETE PRODUCT’, inputs a non-empty value into the confirmation prompt, and will be redirected to Products. | Missing shipping field in update body for product. |
| **Products** | • `Products.integration.test.js` -- Integration between Products.js and the server, as well as between Products.js and UpdateProduct.js (navigation) | • `Products.spec.js`: <br/> 1. All added test products listed. <br/> 2. Navigation to UpdateProduct.js works | Products should be displayed vertically (in a grid) instead of horizontally (overflow). |
| **AdminOrders** | • `AdminOrders.integration.test.js` -- Integration between AdminOrders.js and the server. | • `AdminOrders.spec.js`: <br/> 1. Admin goes to the order page, rendering all orders and their products. <br/>2. Admin clicks on the drop-down of one of the orders and updates the Order Status (e.g. from Processing to Delivered), a success toast shows. | Admin Orders not showing due to bug in getAllOrdersController. (bug fixed by Jing Ting in her PRs) |
| **Dashboard / UserMenu** | • `Dashboard.integration.test.js` -- Integration between Dashboard.js and UserMenu/useAuth. <br/><br/> • `UserMenu.integration.test.js`| • `Dashboard.spec.js`: <br/> 1. User goes to the /dashboard/user page, and clicking on either Profile or Orders, will re-direct to the correct User Profile or User Orders page | None |
| **Routes/Private** | • `Private.integration.test.js` -- Integration between Private.js and authentication. | None | None |


**Aaron Joel Tan (Orders Pages, Profile, SearchInput etc.)**
| Component                | Integration Tests                                                                                                                                                                                                                                                                 | UI/E2E Tests                                                                                                                        | Bug Fixes                                                                                                                                                               |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orders Page**          | • `orders.integration.test.js` — Integration between Orders page and backend endpoints: <br/> - Rendering layout, user menu, and order history <br/> - `/api/v1/auth/orders` handles valid, empty, and unauthorized responses                                                     | • `Orders.spec.js`: <br/> View user orders, verify product details, test empty order list, confirm multiple orders render correctly | • **Fix bug which prevents Admin from viewing Users component in Dashboard**                                                                                            |
| **Profile Page**         | • `profile.integration.test.js` — Integration between Profile page and update API: <br/> - PUT `/api/v1/auth/profile` (success, short password, missing token, DB error) <br/> - Validates persistence of updated values and graceful error handling                              | • `Profile.spec.js`: <br/> View and edit profile details, reject short password, persist updated data                               | None                                                                                                                                                                       |
| **Search Functionality** | • `SearchInput.integration.test.js` — Integration between Search component and backend search endpoints: <br/> - GET `/api/v1/product/search/:keyword` (valid, multiple, empty, and DB error cases) <br/> - Frontend integration via `SearchInput` component                      |  • `SearchInput.spec.js`: <br/> Search with full/partial keywords, multiple/no results, maintain search context                      | • **Fixed unrunnable code caused by missing keyword check in** `searchProductController` *(GET /api/v1/product/search/:keyword should return 404 when keyword missing)* |
| **Backend Controllers**  | • `getOrdersController.integration.test.js` — API validation for order retrieval <br/> • `updateProfileController.integration.test.js` — Full PUT update workflow validation <br/> • `searchProductController.integration.test.js` — Ensures DB and validation edge cases handled | None                                                                                                                                   | None                                                                                                                                                                       |




## 1. Project Introduction

Virtual Vault is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) e-commerce website, offering seamless connectivity and user-friendly features. The platform provides a robust framework for online shopping. The website is designed to adapt to evolving business needs and can be efficiently extended.

## 2. Website Features

- **User Authentication**: Secure user authentication system implemented to manage user accounts and sessions.
- **Payment Gateway Integration**: Seamless integration with popular payment gateways for secure and reliable online transactions.
- **Search and Filters**: Advanced search functionality and filters to help users easily find products based on their preferences.
- **Product Set**: Organized product sets for efficient navigation and browsing through various categories and collections.

## 3. Your Task

- **Unit and Integration Testing**: Utilize Jest for writing and running tests to ensure individual components and functions work as expected, finding and fixing bugs in the process.
- **UI Testing**: Utilize Playwright for UI testing to validate the behavior and appearance of the website's user interface.
- **Code Analysis and Coverage**: Utilize SonarQube for static code analysis and coverage reports to maintain code quality and identify potential issues.
- **Load Testing**: Leverage JMeter for load testing to assess the performance and scalability of the ecommerce platform under various traffic conditions.

## 4. Setting Up The Project

### 1. Installing Node.js

1. **Download and Install Node.js**:

   - Visit [nodejs.org](https://nodejs.org) to download and install Node.js.

2. **Verify Installation**:
   - Open your terminal and check the installed versions of Node.js and npm:
     ```bash
     node -v
     npm -v
     ```

### 2. MongoDB Setup

1. **Download and Install MongoDB Compass**:

   - Visit [MongoDB Compass](https://www.mongodb.com/products/tools/compass) and download and install MongoDB Compass for your operating system.

2. **Create a New Cluster**:

   - Sign up or log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
   - After logging in, create a project and within that project deploy a free cluster.

3. **Configure Database Access**:

   - Create a new user for your database (if not alredy done so) in MongoDB Atlas.
   - Navigate to "Database Access" under "Security" and create a new user with the appropriate permissions.

4. **Whitelist IP Address**:

   - Go to "Network Access" under "Security" and whitelist your IP address to allow access from your machine.
   - For example, you could whitelist 0.0.0.0 to allow access from anywhere for ease of use.

5. **Connect to the Database**:

   - In your cluster's page on MongoDB Atlas, click on "Connect" and choose "Compass".
   - Copy the connection string.

6. **Establish Connection with MongoDB Compass**:
   - Open MongoDB Compass on your local machine, paste the connection string (replace the necessary placeholders), and establish a connection to your cluster.

### 3. Application Setup

To download and use the MERN (MongoDB, Express.js, React.js, Node.js) app from GitHub, follow these general steps:

1. **Clone the Repository**

   - Go to the GitHub repository of the MERN app.
   - Click on the "Code" button and copy the URL of the repository.
   - Open your terminal or command prompt.
   - Use the `git clone` command followed by the repository URL to clone the repository to your local machine:
     ```bash
     git clone <repository_url>
     ```
   - Navigate into the cloned directory.

2. **Install Frontend and Backend Dependencies**

   - Run the following command in your project's root directory:

     ```
     npm install && cd client && npm install && cd ..
     ```

3. **Add database connection string to `.env`**

   - Add the connection string copied from MongoDB Atlas to the `.env` file inside the project directory (replace the necessary placeholders):
     ```env
     MONGO_URL = <connection string>
     ```

4. **Adding sample data to database**

   - Download “Sample DB Schema” from Canvas and extract it.
   - In MongoDB Compass, create a database named `test` under your cluster.
   - Add four collections to this database: `categories`, `orders`, `products`, and `users`.
   - Under each collection, click "ADD DATA" and import the respective JSON from the extracted "Sample DB Schema".

5. **Running the Application**
   - Open your web browser.
   - Use `npm run dev` to run the app from root directory, which starts the development server.
   - Navigate to `http://localhost:3000` to access the application.

## 5. Unit Testing with Jest

Unit testing is a crucial aspect of software development aimed at verifying the functionality of individual units or components of a software application. It involves isolating these units and subjecting them to various test scenarios to ensure their correctness.  
Jest is a popular JavaScript testing framework widely used for unit testing. It offers a simple and efficient way to write and execute tests in JavaScript projects.

## 6. Integration Testing with Jest

- Add your tests to `tests/integration/`, and update `jest.frontend.integration.config.js` etc.

## 7. UI Testing with PlayWright

- Add your tests to `tests/ui`. `tests/ui/globalSetup.js` is to login before each any test run.
  To ensure this is working properly, do the following:
  - Add a `TEST_EMAIL` and `TEST_PASSWORD` present in the corresponding MONGO_URL, in `.env`
  - `npx playwright test --ui` should generate a file `tests/ui/.auth/user.json`. This file will
    store your session auth token.

### Getting Started with Jest

To begin unit testing with Jest in your project, follow these steps:

1. **Install Jest**:  
   Use your preferred package manager to install Jest. For instance, with npm:

   ```bash
   npm install --save-dev jest

   ```

2. **Write Tests**  
   Create test files for your components or units where you define test cases to evaluate their behaviour.

3. **Run Tests**  
   Execute your tests using Jest to ensure that your components meet the expected behaviour.  
   You can run the tests by using the following command in the root of the directory:

   - **Frontend tests**

     ```bash
     npm run test:frontend
     ```

   - **Backend tests**

     ```bash
     npm run test:backend
     ```

   - **All the tests**
     ```bash
     npm run test
     ```
