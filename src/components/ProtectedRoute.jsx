import{Outlet,Navigate} from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({role})=>{
    const {user,loading}=useAuth();
    if (loading) return <p>Loading...</p>;

  if (!user) return <Navigate to="/login" />;

  if (role && user.role !== role) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}

export default ProtectedRoute;