import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './auth';
import axios from 'axios';

jest.mock('axios');

Object.defineProperty(window, 'localStorage', {
    value: {
        setItem: jest.fn(),
        getItem: jest.fn(),
        removeItem: jest.fn(),
    },
    writable: true,
});

const TestAuthComponent = () => {
    const [auth, setAuth] = useAuth();
    return (
        <div>
            <p data-testid="auth-value">{JSON.stringify(auth)}</p>
            <button onClick={() => setAuth({ user: 'testuser', token: 'testtoken' })}>Set Auth</button>
        </div>
    );
};

const TestAuthComponentLogout = () => {
    const [auth, setAuth] = useAuth();

    const handleLogout = () => {
        setAuth({ user: null, token: '' });
        window.localStorage.removeItem('auth');
    };
    
    return (
        <div>
            <p data-testid="auth-value">{JSON.stringify(auth)}</p>
            <button onClick={() => setAuth({ user: 'testuser', token: 'testtoken' })}>Set Auth</button>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
}

describe('AuthProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        window.localStorage.getItem.mockReset();
        window.localStorage.setItem.mockReset();
        window.localStorage.removeItem.mockReset();
    });

    it('initialises with empty auth state when no localStorage data', () => {
        const { getByTestId } = render(
            <AuthProvider>
                <TestAuthComponent />
            </AuthProvider>
        );
        expect(getByTestId('auth-value').textContent).toContain('"user":null');
        expect(getByTestId('auth-value').textContent).toContain('"token":""');
    });

    it('updates auth state when setAuth is called', () => {
        const { getByTestId, getByText } = render(
            <AuthProvider>
                <TestAuthComponent />
            </AuthProvider>
        );
        expect(getByTestId('auth-value').textContent).toContain('"user":null');
        expect(getByTestId('auth-value').textContent).toContain('"token":""');
        act(() => {
            getByText('Set Auth').click();
        });
        expect(getByTestId('auth-value').textContent).toContain('"user":"testuser"');
        expect(getByTestId('auth-value').textContent).toContain('"token":"testtoken"');
    });

    it('loads auth from localStorage on mount', async () => {
        const storedAuth = JSON.stringify({ user: 'storedUser', token: 'storedToken' });
        window.localStorage.getItem.mockReturnValueOnce(storedAuth);
        const TestComponent = () => {
            const [auth] = useAuth();
            return <span data-testid="auth">{JSON.stringify(auth)}</span>;
        };
        const { getByTestId } = render(
            <AuthProvider>
                <TestComponent />
            </AuthProvider>
        );
        await waitFor(() => {
            expect(getByTestId('auth').textContent).toContain('"user":"storedUser"');
            expect(getByTestId('auth').textContent).toContain('"token":"storedToken"');
        });
        expect(window.localStorage.getItem).toHaveBeenCalledWith('auth');
    });

    it('sets axios default Authorization header', () => {
        const { getByText } = render(
            <AuthProvider>
                <TestAuthComponent />
            </AuthProvider>
        );
        expect(axios.defaults.headers.common["Authorization"]).toBe("");
        act(() => {
            getByText('Set Auth').click();
        });
        expect(axios.defaults.headers.common["Authorization"]).toBe("testtoken");
    });

    it('maintains auth state when localStorage is empty', () => {
        const { getByTestId } = render(
            <AuthProvider>
                <TestAuthComponent />
            </AuthProvider>
        );
        expect(window.localStorage.getItem).toHaveBeenCalledWith('auth');
        expect(getByTestId('auth-value').textContent).toContain('"user":null');
        expect(getByTestId('auth-value').textContent).toContain('"token":""');
    });

    it('clears auth state on logout', () => {
        const { getByTestId, getByText } = render(
            <AuthProvider>
                <TestAuthComponentLogout />
            </AuthProvider>
        );

        act(() => {
            getByText('Set Auth').click();
        });

        expect(getByTestId('auth-value').textContent).toContain('"user":"testuser"');
        expect(getByTestId('auth-value').textContent).toContain('"token":"testtoken"');
        expect(axios.defaults.headers.common["Authorization"]).toBe("testtoken");

        act(() => {
            getByText('Logout').click();
        });

        expect(getByTestId('auth-value').textContent).toContain('"user":null');
        expect(getByTestId('auth-value').textContent).toContain('"token":""');
        expect(window.localStorage.removeItem).toHaveBeenCalledWith('auth');
        expect(axios.defaults.headers.common["Authorization"]).toBe("");
    });
});