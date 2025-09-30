import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import PrivateRoute from "./Private";
import axios from "axios";
import { useAuth } from "../../context/auth";

jest.mock("axios", () => ({
  get: jest.fn(),
}));

jest.mock("../../context/auth", () => ({
  __esModule: true,
  useAuth: jest.fn(),
}));

const mockNavigate = jest.fn().mockImplementation(() => {});

jest.mock("../Spinner", () => ({
  __esModule: true,
  default: ({ path }) => {
    return <div data-testid="spinner">redirecting</div>;
  },
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  Outlet: () => <div data-testid="outlet-stub">Stub Outlet</div>,
  useNavigate: () => mockNavigate,
}));

describe("PrivateRoute", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReset();
  });

  // Technique: Decision Table Testing — executes the rule (token present = true, server grants
  // ok = true) that should allow access i.e. <Outlet />; The test should verify that the Spinner
  // is replaced with the Outlet after successful auth check.
  it("renders outlet after successful auth check", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: true } });

    // Act
    render(<PrivateRoute />);

    // Assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth")
    );
    await screen.findByTestId("outlet-stub");
    expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
  });

  // Technique: Decision Table Testing — executes the rule (token present = true, server grants
  // ok = false) capturing the "deny" branch of the access guard; verifies that the Spinner remains
  // rendered and the Outlet stays hidden.
  it("keeps spinner when auth API returns ok=false", async () => {
    // Arrange
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockResolvedValueOnce({ data: { ok: false } });

    // Act
    render(<PrivateRoute />);

    // Assert
    await waitFor(() =>
      expect(axios.get).toHaveBeenCalledWith("/api/v1/auth/user-auth")
    );
    await screen.findByTestId("spinner");
    expect(screen.queryByTestId("outlet-stub")).not.toBeInTheDocument();
  });

  // Technique: Decision Table Testing — executes the rule (token present = false/undefined,
  // server call skipped) verifying the guard never attempts network validation and the Spinner
  // continues showing while the Outlet remains hidden.
  it("keeps spinner and skips auth check when token is undefined", () => {
    // Arrange
    useAuth.mockReturnValue([{ token: undefined }, jest.fn()]);

    // Act
    render(<PrivateRoute />);

    // Assert
    expect(axios.get).not.toHaveBeenCalled();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("outlet-stub")).not.toBeInTheDocument();
  });

  // Technique: Control Flow Testing — forces the network/api auth check to throw an error
  // sensitizing the error path of the program; This test verifies that the Spinner remains visible
  // and the Outlet is never rendered.
  it("fails closed when the auth check throws", async () => {
    // Arrange
    const consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    useAuth.mockReturnValue([{ token: "test-token" }, jest.fn()]);
    axios.get.mockRejectedValueOnce(new Error("network down"));

    // Act
    render(<PrivateRoute />);

    // Assert
    await waitFor(() => expect(axios.get).toHaveBeenCalled());
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    expect(screen.queryByTestId("outlet-stub")).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
