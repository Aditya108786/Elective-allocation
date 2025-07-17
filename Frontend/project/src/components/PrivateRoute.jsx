
import { Navigate } from 'react-router-dom';
import { useAuth } from '../Authcontext';

const PrivateRoute = ({ children }) => {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
