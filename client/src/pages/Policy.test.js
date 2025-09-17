import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Policy from './Policy'; // Adjust path as needed
import Layout from '../components/Layout'; // Adjust path as needed

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return jest.fn(({ title, children }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ));
});

// General structure is generated with help from AI
describe('Policy Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('renders Layout with correct title', () => {
    // Act
    render(<Policy />);
    
    // Assert
    expect(Layout).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Privacy Policy'
      }),
      expect.any(Object)
    );
  });

  test('renders the main container with correct CSS class', () => {
    // Act
    render(<Policy />);
    
    // Assert
    const mainContainer = screen.getByTestId('privacy-policy-main-container')
    expect(mainContainer).toBeInTheDocument();
  });

  test('renders the contact image with correct attributes', () => {
    // Act
    render(<Policy />);
    
    // Assert
    const image = screen.getByAltText('contactus');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/images/contactus.jpeg');
    expect(image).toHaveAttribute('alt', 'contactus');
    expect(image).toHaveStyle('width: 100%');
  });

  test('renders the image', () => {
    // Act
    render(<Policy />);
    
    // Assert
    const image = screen.getByAltText('contactus');
    expect(image).toBeInTheDocument();
  });

  test('renders the content containers with correct CSS class', () => {
    // Act
    render(<Policy />);
    
    // Assert
    const contentContainers = screen.getAllByText('add privacy policy');
  
    expect(contentContainers).toHaveLength(7);

    expect(contentContainers[0]).toBeInTheDocument();
    
    contentContainers.forEach(container => {
        expect(container).toBeInTheDocument();
    });
  });

  test('renders policy page with expected content and structure', () => {
    // Act
    render(<Policy />);
    
    // Assert
    const image = screen.getByRole('img');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src');
    expect(image).toHaveAttribute('alt');
    
    const policyContent = screen.getByTestId('privacy-policy-content')
    expect(policyContent).toBeInTheDocument();
    
    const allParagraphs = screen.getAllByText((content, element) => {
        return element.tagName.toLowerCase() === 'p';
    });
    expect(allParagraphs).toHaveLength(7);

    allParagraphs.forEach(paragraph => {
        expect(paragraph).toHaveTextContent('add privacy policy');
    });
  });

});