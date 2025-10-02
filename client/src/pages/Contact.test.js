import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Contact from './Contact'; 
import { MemoryRouter } from 'react-router-dom';

// Mock the Layout component
jest.mock('../components/Layout', () => {
  return jest.fn(({ title, children }) => (
    <div data-testid="layout" data-title={title}>
      {children}
    </div>
  ));
});

jest.mock("react-icons/bi", () => ({
  BiMailSend: () => <span data-testid="mail-icon">📧</span>,
  BiPhoneCall: () => <span data-testid="phone-icon">📞</span>,
  BiSupport: () => <span data-testid="support-icon">💬</span>,
}));

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe('Contact', () => {
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
    renderWithRouter(<Contact />);
    // Assert
    expect(screen.getByTestId('layout')).toBeInTheDocument();
  });

  test("passes correct title to Layout component", () => {
    // Arrange + Act
    renderWithRouter(<Contact />);

    // Assert
    const layoutElement = screen.getByTestId("layout");
    expect(layoutElement).toHaveAttribute("data-title", "Contact us");
  });

    test("renders the contact us heading", () => {
    // Arrange + Act
    renderWithRouter(<Contact />);

    // Assert
    const heading = screen.getByRole("heading", { name: /CONTACT US/i });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass("bg-dark", "p-2", "text-white", "text-center");
  });

  test("renders the contact us image", () => {
    // Arrange + Act
    renderWithRouter(<Contact />);

    // Assert
    const image = screen.getByAltText("contactus");
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute("src", "/images/contactus.jpeg");
    expect(image).toHaveStyle({ width: "100%" });
  });

  test("renders the introductory text", () => {
    // Arrange + Act
    renderWithRouter(<Contact />);

    // Assert
    const introText = screen.getByText(
      "For any query or info about product, feel free to call anytime. We are available 24X7."
    );
    expect(introText).toBeInTheDocument();
    expect(introText).toHaveClass("text-justify", "mt-2");
  });

  test("renders email contact information", () => {
    // Arrange + Act
    renderWithRouter(<Contact />);

    // Assert
    const emailText = screen.getByText(": www.help@ecommerceapp.com");
    expect(emailText).toBeInTheDocument();
    const mailIcon = screen.getByTestId("mail-icon");
    expect(mailIcon).toBeInTheDocument();
  });

  test("renders phone contact information", () => {
    // Arrange + Act
    renderWithRouter(<Contact />);

    // Assert
    const phoneText = screen.getByText(": 012-3456789");
    expect(phoneText).toBeInTheDocument();
    const phoneIcon = screen.getByTestId("phone-icon");
    expect(phoneIcon).toBeInTheDocument();
  });

  test("renders toll-free support information", () => {
    // Arrange + Act
    renderWithRouter(<Contact />);

    // Assert
    const tollFreeText = screen.getByText(": 1800-0000-0000 (toll free)");
    expect(tollFreeText).toBeInTheDocument();
    const supportIcon = screen.getByTestId("support-icon");
    expect(supportIcon).toBeInTheDocument();
  });

})


