import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import useCategory from './useCategory';

jest.mock('axios');

describe("useCategory tests", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test("should return empty array if no categories present", () => {
        // Act, Assert
        const { result } = renderHook(() => useCategory());
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
        expect(result.current).toEqual([]);
    })

    test("should return categories when fetch is successful", async () => {
        // Arrange
        const mockCategories = [
            { name: 'Category 1', slug: 'category-1' },
            { name: 'Category 2', slug: 'category-2' }
        ];
        axios.get.mockResolvedValueOnce({ data: { category: mockCategories, success: true } });

        // Act
        const { result } = renderHook(() => useCategory());

        // Assert
        await waitFor(() => {
            expect(result.current).toEqual(mockCategories);
        });
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith("/api/v1/category/get-category");
    })

    test('log error when fetch fails', async () => {
        // Arrange
        const mockError = new Error('Error fetching categories');
        axios.get.mockRejectedValueOnce(mockError);
        const consoleErrorSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Act
        const { result } = renderHook(() => useCategory());

        // Assert
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalledWith(mockError);
        });
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(result.current).toEqual([]);
        consoleErrorSpy.mockRestore();
    })

    test('log error when fetch is unsuccessful', async () => {
        // Arrange
        axios.get.mockResolvedValueOnce({ data: { success: false } });
        const consoleErrorSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

        // Act
        const { result } = renderHook(() => useCategory());

        // Assert
        await waitFor(() => {
            expect(consoleErrorSpy).toHaveBeenCalled();
        });
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(result.current).toEqual([]);
        consoleErrorSpy.mockRestore();
    })
})