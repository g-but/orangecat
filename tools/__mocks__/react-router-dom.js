// Mock for react-router-dom
import React from 'react';

export const BrowserRouter = ({ children }) => {
  return <div data-testid="browser-router">{children}</div>;
};

export const Router = ({ children }) => {
  return <div data-testid="router">{children}</div>;
};

export const Route = ({ children, element }) => {
  return <div data-testid="route">{element || children}</div>;
};

export const Routes = ({ children }) => {
  return <div data-testid="routes">{children}</div>;
};

export const Link = ({ children, to, ...props }) => {
  return <a href={to} {...props}>{children}</a>;
};

export const NavLink = ({ children, to, ...props }) => {
  return <a href={to} {...props}>{children}</a>;
};

export const useNavigate = () => {
  return jest.fn();
};

export const useLocation = () => {
  return {
    pathname: '/',
    search: '',
    hash: '',
    state: null
  };
};

export const useParams = () => {
  return {};
};

export const useSearchParams = () => {
  return [new URLSearchParams(), jest.fn()];
};