import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Footer from "./Footer";

const renderWithRouter = (component) => {
  return render(
    <MemoryRouter>
      {component}
    </MemoryRouter>
  );
};

describe("Footer Component", () => {
  test("renders footer with copyright text", () => {
    renderWithRouter(<Footer />);
    const copyrightText = screen.getByText(/All Rights Reserved © TestingComp/i);
    expect(copyrightText).toBeInTheDocument();
  });

  test("renders About link with correct path", () => {
    renderWithRouter(<Footer />);
    const aboutLink = screen.getByRole("link", { name: /about/i });
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink).toHaveAttribute("href", "/about");
  });

  test("renders Contact link with correct path", () => {
    renderWithRouter(<Footer />);
    const contactLink = screen.getByRole("link", { name: /contact/i });
    expect(contactLink).toBeInTheDocument();
    expect(contactLink).toHaveAttribute("href", "/contact");
  });

  test("renders Privacy Policy link with correct path", () => {
    renderWithRouter(<Footer />);
    const policyLink = screen.getByRole("link", { name: /privacy policy/i });
    expect(policyLink).toBeInTheDocument();
    expect(policyLink).toHaveAttribute("href", "/policy");
  });
});