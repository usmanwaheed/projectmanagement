import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { RouteNames } from "../Constants/route";
import PropTypes from "prop-types";

export default function ProtectedRoute({ allowedRoles }) {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(null);

    useEffect(() => {
        const accessToken = localStorage.getItem('userToken');
        const accessAdminToken = localStorage.getItem("accessAdminToken");
        // const userRole = localStorage.getItem("role");
        const adminRole = localStorage.getItem('roleAdmin');

        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        let isValid = false;

        // if (accessAdminToken && adminRole && rolesArray.includes(adminRole)) {
        //     isValid = true;
        // } else if (accessToken && userRole && rolesArray.includes(userRole)) {
        //     isValid = true;
        // }
        if (accessAdminToken) {
            isValid = true;
        } else if (accessToken) {
            isValid = true;
        }

        setIsAuthenticated(isValid);

        if (!isValid) {
            // navigate(`/${RouteNames.LOGIN}`, { replace: true });
            navigate(`/home`, { replace: true });
        }
    }, [navigate, allowedRoles]);

    if (isAuthenticated === null) return null;

    return isAuthenticated ? <Outlet /> : null;
}

ProtectedRoute.propTypes = {
    allowedRoles: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.arrayOf(PropTypes.string),
    ]).isRequired,
};
