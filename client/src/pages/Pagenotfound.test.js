import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Pagenotfound from './Pagenotfound'; 
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

describe('Page not found', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders without crashing', () => {
    renderWithRouter(<Pagenotfound />);
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  test('passes correct title to Layout component', () => {
    renderWithRouter(<Pagenotfound />);
    const layoutElement = screen.getByTestId('layout');
    expect(layoutElement).toHaveAttribute('data-title', 'Go Back - Page Not Found');
  });

  test('displays 404 error code', () => {
    renderWithRouter(<Pagenotfound />);
    const title = screen.getByRole('heading', { level: 1 });
    expect(title).toHaveTextContent('404');
  });

  test('displays error message', () => {
    renderWithRouter(<Pagenotfound />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Oops ! Page Not Found');
  });

  test('renders Go Back link with correct attributes', () => {
    renderWithRouter(<Pagenotfound />);
    const goBackLink = screen.getByText("Go Back");
    
    expect(goBackLink).toBeInTheDocument();
    expect(goBackLink).toHaveAttribute('href', '/');
  });
})

