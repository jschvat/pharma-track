import React from 'react';

const mockNavigate = jest.fn();
const mockUseSearchParams = jest.fn(() => [new URLSearchParams(), jest.fn()]);

export const BrowserRouter = ({ children }) => <div data-testid="mock-router">{children}</div>;
export const useNavigate = () => mockNavigate;
export const useSearchParams = () => mockUseSearchParams();
export const Link = ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>;
export const Navigate = ({ to }) => <div data-testid="navigate" data-to={to} />;

export default {
  BrowserRouter,
  useNavigate,
  useSearchParams,
  Link,
  Navigate
};