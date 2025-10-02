import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { useNavigate, useLocation } from "react-router-dom";
import Spinner from "./Spinner";

const mockNavigate = jest.fn();
const mockLocation = { pathname: "/dashboard" };

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
  useLocation: jest.fn(),
}));

describe("Spinner", () => {
  
  beforeEach(() => {
    useNavigate.mockReturnValue(mockNavigate);
    useLocation.mockReturnValue(mockLocation);
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("renders spinner with initial count of 3", () => {
    // Arrange + Act
    render(<Spinner />);
    // Assert
    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  test("decrements count every second", async () => {
    // Arrange + Act
    render(<Spinner />);
    
    // Assert
    expect(screen.getByText(/redirecting to you in 3 second/i)).toBeInTheDocument();
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/redirecting to you in 2 second/i)).toBeInTheDocument();
    });
    
    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/redirecting to you in 1 second/i)).toBeInTheDocument();
    });

    jest.advanceTimersByTime(1000);

    await waitFor(() => {
      expect(screen.getByText(/redirecting to you in 0 second/i)).toBeInTheDocument();
    });
  });

  test("navigates to default path 'login' when count reaches 0", async () => {
    // Arrange + Act
    render(<Spinner />);
    
    // Assert
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/login", {
        state: "/dashboard",
      });
    });
  });

  test("navigates to custom path when provided", async () => {
    // Arrange + Act
    render(<Spinner path="home" />);
    // Assert
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/home", {
        state: "/dashboard",
      });
    });
  });

  test("clears interval on unmount", () => {
    // Arrange
    const clearIntervalSpy = jest.spyOn(global, "clearInterval");
    const { unmount } = render(<Spinner />);
    // Act
    unmount();
    // Assert
    expect(clearIntervalSpy).toHaveBeenCalled();
    clearIntervalSpy.mockRestore();
  });

});