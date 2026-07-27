import { Navigate } from "react-router-dom";

const PrivateRoute = ({ children }) => {
  let isAuthenticated = false;
  try {
    const userInfo = JSON.parse(localStorage.getItem("userInfo") || {});
    isAuthenticated = !!userInfo?._id && !!userInfo?.token;
  } catch (err) {
    isAuthenticated = false;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
