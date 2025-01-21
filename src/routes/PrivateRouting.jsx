import { useContext } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { AuthContext } from "../context/AuthContext";

function PrivateRouting() {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  if (user==null) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  } else {
    return <Outlet />;
  }
}

export default PrivateRouting;