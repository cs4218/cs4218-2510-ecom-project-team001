import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import useCategory from '../hooks/useCategory';
import Categories from './Categories';

jest.mock("../hooks/useCategory", () => jest.fn(() => []));
jest.mock('../components/Layout', () => ({ children }) => <div data-testid="layout">{children}</div>);


describe('Categories page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        useCategory.mockReturnValue([]);
    });

    test('renders one button link per category with correct href and text', () => {
        // Arrange
        const mockCategories = [
            { _id: '1', name: 'Electronics', slug: 'electronics' },
            { _id: '2', name: 'Books', slug: 'books' },
            { _id: '3', name: 'Clothing', slug: 'clothing' },
        ];
        useCategory.mockReturnValue(mockCategories);

        // Act
        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        // Assert
        const layout = screen.getByTestId('layout');
        expect(layout).toBeInTheDocument();

        const links = screen.getAllByRole('link');
        expect(links).toHaveLength(mockCategories.length);

        mockCategories.forEach(({ name, slug }) => {
            const link = screen.getByRole('link', { name });
            expect(link).toBeInTheDocument();
            expect(link).toHaveAttribute('href', `/category/${slug}`);
        });
    });

    test('renders no links when categories is empty', () => {
        // Arrange
        useCategory.mockReturnValue([]);

        // Act
        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        // Assert
        expect(screen.queryAllByRole('link')).toHaveLength(0);
    });

    test('renders "No categories found" message when categories is empty', () => {
        // Arrange
        useCategory.mockReturnValue([]);

        // Act
        render(
            <MemoryRouter>
                <Categories />
            </MemoryRouter>
        );

        // Assert
        expect(screen.getByText('No categories found')).toBeInTheDocument();
    });
});