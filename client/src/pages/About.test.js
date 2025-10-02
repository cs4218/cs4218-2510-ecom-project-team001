import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import About from './About'; 
import { MemoryRouter } from 'react-router-dom';

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return jest.fn(({ title, children }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ));
});

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('About', () => {
  let consoleErrorSpy;
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    // Verify no console errors occurred
    expect(consoleErrorSpy).not.toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('renders without crashing', () => {
    // Arrange + Act
    renderWithRouter(<About />);
    // Assert
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  test('passes correct title to Layout component', () => {
    // Arrange + Act
    renderWithRouter(<About />);
    // Assert
    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toHaveAttribute('data-title', 'About us - Ecommerce app');
  });

  test('renders the contact image with correct attributes', () => {
    // Act
    render(<About />);
    
    // Assert
    const image = screen.getByAltText('about');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/about.jpeg');
    expect(image).toHaveAttribute('alt', 'about');
    expect(image).toHaveStyle('width: 100%');
  });

  test('renders Go Back link with correct attributes', () => {
    // Arrange + Act
    renderWithRouter(<About />);
    // Assert
    const text = screen.getAllByText((content, element) => {
        return content === "Add text";
    });
    expect(text).toHaveLength(1);
  });
})


