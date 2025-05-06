import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useAuthenticationStore } from "../store/authentication";
import { setToken } from "../services/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthenticationStore((state) => state.token);
  const isAuthenticated = !!token;
  const navigate = useNavigate();
  const currentUser = useAuthenticationStore((state) => state.user);
  const logout = useAuthenticationStore((state) => state.logout);

  const [initials, setInitials] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      setToken(token); // Set token globally for future API requests
    }
  }, [isAuthenticated, token]);

  useEffect(() => {
    if (currentUser?.name) {
      setInitials(
        currentUser.name
          .split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join("")
      );
    }
  }, [currentUser]);

  if (!isAuthenticated) {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
}
