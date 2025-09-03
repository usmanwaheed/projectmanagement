import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';

const AdminRoute = ({ children }) => {
    const userRole = localStorage.getItem('userRole');

    // if (userRole === 'admin' || userRole === 'superadmin') {
    //     return children;
    // }
    if (userRole === 'superadmin') {
        return children;
    }

    return <Navigate to="/" />;
};

export default AdminRoute;

AdminRoute.propTypes = {
    // title: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
}