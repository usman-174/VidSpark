import { jsxs as _jsxs, jsx as _jsx, Fragment as _Fragment } from "react/jsx-runtime";
import useAuthStore from '../store/authStore';
import { Link } from 'react-router-dom';
const Home = () => {
    const { logout, isAuthenticated, user } = useAuthStore();
    return (_jsx(_Fragment, { children: _jsx("div", { className: "container mx-auto p-4", children: isAuthenticated ? (_jsxs("div", { className: "text-center", children: [_jsxs("p", { className: "text-xl text-foreground", children: ["Welcome back, ", user?.email, "!"] }), _jsx("button", { onClick: logout, className: "mt-4 px-4 py-2 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90", children: "Logout" })] })) : (_jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-xl text-foreground", children: "You are not logged in." }), _jsxs("div", { className: "flex justify-center space-x-4 mt-4", children: [_jsx(Link, { to: "/register", className: "px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90", children: "Register" }), _jsx(Link, { to: "/login", className: "px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90", children: "Login" })] })] })) }) }));
};
export default Home;
