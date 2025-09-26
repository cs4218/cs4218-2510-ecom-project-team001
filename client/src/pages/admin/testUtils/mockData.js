export const SAMPLE_ORDERS = [
  {
    _id: "order1",
    status: "Processing",
    buyer: { _id: "buyer1", name: "chenghou" },
    createdAt: "2025-02-04T13:42:16.741Z",
    updatedAt: "2025-02-04T13:42:16.741Z",
    payment: {
      success: true,
      // Self-note: This message has not been verified to be accurate.
      //            Paypal braintree docs does not provide a sample message.
      message: "Payment successful",
      params: {
        transaction: {
          amount: "29.99",
          type: "sale",
          options: { submitForSettlement: "true" },
        },
      },
    },
    products: [
      {
        _id: "prod1",
        name: "Blue Shirt",
        slug: "blue-shirt",
        description: "Soft cotton shirt",
        price: 29.99,
        category: "apparel",
        quantity: 1,
        shipping: true,
        createdAt: "2025-02-01T10:00:00.000Z",
        updatedAt: "2025-02-01T10:00:00.000Z",
      },
    ],
  },
  {
    _id: "order2",
    status: "Not Process",
    buyer: { _id: "buyer2", name: "chenghou2" },
    createdAt: "2025-02-03T09:21:00.000Z",
    updatedAt: "2025-02-03T09:21:00.000Z",
    payment: {
      success: false,
      message:
        "Amount is an invalid format. Credit card number is not an accepted test number.",
      params: {
        transaction: {
          amount: "3004.97",
          paymentMethodNonce: "fake-nonce",
          options: { submitForSettlement: "true" },
          type: "sale",
        },
      },
      errors: {
        errorCollections: {
          transaction: {
            validationErrors: {
              amount: [
                {
                  attribute: "amount",
                  code: "81503",
                  message: "Amount is an invalid format.",
                },
              ],
            },
            errorCollections: {
              creditCard: {
                validationErrors: {
                  number: [
                    {
                      attribute: "number",
                      code: "81717",
                      message:
                        "Credit card number is not an accepted test number.",
                    },
                  ],
                },
              },
            },
          },
        },
      },
    },
    products: [
      {
        _id: "prod2",
        name: "NUS T-shirt",
        slug: "nus-tshirt",
        description: "Plain NUS T-shirt for sale",
        price: 4.99,
        category: "merch",
        quantity: 2,
        shipping: true,
        createdAt: "2024-09-06T17:57:19.992Z",
        updatedAt: "2024-09-06T17:57:19.992Z",
      },
      {
        _id: "prod3",
        name: "Laptop",
        slug: "laptop",
        description: "A powerful laptop",
        price: 1499.99,
        category: "electronics",
        quantity: 1,
        shipping: true,
        createdAt: "2024-09-06T17:57:19.971Z",
        updatedAt: "2024-09-06T17:57:19.971Z",
      },
    ],
  },
];
export const SAMPLE_PRODUCTS = [
  {
    _id: "pid1",
    name: "Ipad Protector",
    slug: "ipad-protector",
    description: "Screen protection for iPads.",
    price: 12.99,
    category: {
      _id: "stationery",
      name: "Stationery",
      slug: "stationery",
    },
    quantity: 150,
    shipping: true,
    createdAt: "2025-02-01T09:00:00.000Z",
    updatedAt: "2025-02-01T09:00:00.000Z",
  },
  {
    _id: "pid2",
    name: "Aurora Lamp",
    slug: "aurora-lamp",
    description: "Serene lighting with adaptive colors.",
    price: 59.5,
    category: {
      _id: "lighting",
      name: "Lighting",
      slug: "lighting",
    },
    quantity: 80,
    shipping: true,
    createdAt: "2025-02-02T12:30:00.000Z",
    updatedAt: "2025-02-02T12:30:00.000Z",
  },
];
