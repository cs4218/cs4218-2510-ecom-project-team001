import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Layout from "./Layout";
import { Helmet } from "react-helmet";

jest.mock("./Footer", () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>;
  };
});

jest.mock("./Header", () => {
  return function Header() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster">Toaster</div>,
}));

describe("Layout Component", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders children content", () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    );
    
    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  test("renders Header component", () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId("header")).toBeInTheDocument();
  });

  test("renders Footer component", () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  test("renders Toaster component", () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    expect(screen.getByTestId("toaster")).toBeInTheDocument();
  });

  test("applies default title when no title prop provided", () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const helmet = Helmet.peek();
    expect(helmet.title).toBe("Ecommerce app - shop now");
  });

  test("applies custom title when title prop provided", () => {
    render(
      <Layout title="Custom Title">
        <div>Content</div>
      </Layout>
    );
    
    const helmet = Helmet.peek();
    expect(helmet.title).toBe("Custom Title");
  });

  test("applies default meta tags when no props provided", () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    );
    
    const helmet = Helmet.peek();
    expect(helmet.metaTags).toContainEqual(
      expect.objectContaining({
        name: "description",
        content: "mern stack project",
      })
    );
    expect(helmet.metaTags).toContainEqual(
      expect.objectContaining({
        name: "keywords",
        content: "mern,react,node,mongodb",
      })
    );
    expect(helmet.metaTags).toContainEqual(
      expect.objectContaining({
        name: "author",
        content: "Techinfoyt",
      })
    );
  });

  test("applies custom meta tags when props provided", () => {
    render(
      <Layout
        description="Custom description"
        keywords="custom,keywords"
        author="Custom Author"
      >
        <div>Content</div>
      </Layout>
    );
    
    const helmet = Helmet.peek();
    expect(helmet.metaTags).toContainEqual(
      expect.objectContaining({
        name: "description",
        content: "Custom description",
      })
    );
    expect(helmet.metaTags).toContainEqual(
      expect.objectContaining({
        name: "keywords",
        content: "custom,keywords",
      })
    );
    expect(helmet.metaTags).toContainEqual(
      expect.objectContaining({
        name: "author",
        content: "Custom Author",
      })
    );
  });
});