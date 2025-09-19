import { act, renderHook, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useCart, CartProvider } from './cart';

describe('Cart Context', () => {
    beforeAll(() => {
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: jest.fn(),
                setItem: jest.fn(),
                clear: jest.fn(),
            },
            writable: true,
        })
    });

    beforeEach(() => {
        localStorage.clear();
        jest.clearAllMocks();
    })

    test('initialise empty cart', async () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        })
        expect(localStorage.getItem).toHaveBeenCalledWith('cart');
        expect(result.current[0]).toEqual([]);
    })

    test('initialise cart with existing items from localStorage', async () => {
        const existingCart = [
            { id: "1", name: "Product 1", quantity: 1 },
            { id: "1", name: "Product 1", quantity: 1 },
            { id: "2", name: "Product 2", quantity: 1 }
        ];
        const numProducts = existingCart.reduce((sum, item) => sum + item.quantity, 0);
        localStorage.getItem.mockReturnValue(JSON.stringify(existingCart));

        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        })

        expect(localStorage.getItem).toHaveBeenCalledWith('cart');
        expect(result.current[0].reduce((sum, item) => sum + item.quantity, 0)).toEqual(numProducts);
    })

    test("update cart", async () => {
        const { result } = renderHook(() => useCart(), {
            wrapper: CartProvider
        })
        const newCart = [
            { id: "3", name: "Product 3", quantity: 2 }
        ]
        act(() => {
            result.current[1](newCart);
        })
        expect(result.current[0]).toEqual(newCart);
    })
})