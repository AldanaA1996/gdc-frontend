import { User } from "@/app/types/strapi-entities";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useOnlineStatus } from "../hooks/use-online-status";
import { setToken } from "../services/api";
import { requestVolunteerByUser } from "../services/api/volunteers";
import { useAuthenticationStore } from "../store/authentication";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthenticationStore((state) => state.token);
  const isAuthenticated = token !== null;

  if (isAuthenticated) {
    setToken(token);
  }

  const getVolunteerByUser = async (user: User) => {
    const result = await requestVolunteerByUser(user);

    if (result.error) {
      console.error(result.error);
      setHasFailedToLoadVolunteer(true);
    }

    if (result.data) {
      setCurrentVolunteer(result.data);
    }
  };

  const [hasFailedToLoadVolunteer, setHasFailedToLoadVolunteer] =
    useState(false);
  const navigate = useNavigate();
  const currentUser = useAuthenticationStore((state) => state.user);
  const currentVolunteer = useAuthenticationStore((state) => state.volunteer);
  const setCurrentVolunteer = useAuthenticationStore(
    (state) => state.setCurrentVolunteer,
  );
  const logout = useAuthenticationStore((state) => state.logout);
  const [initials, setInitials] = useState("");

  useEffect(() => {
    if (currentUser && !currentVolunteer) {
      getVolunteerByUser(currentUser);
    }
  }, [currentUser, currentVolunteer]);

  useEffect(() => {
    if (hasFailedToLoadVolunteer) {
      logout();
      navigate("/app");
      // TODO: crear Profile page
      // navigate("/app/volunteer/me");
    }
  }, [hasFailedToLoadVolunteer, logout, navigate]);

  useEffect(() => {
    if (currentVolunteer) {
      setInitials(
        currentVolunteer.name
          .split(" ")
          .map((word) => word[0])
          .slice(0, 2)
          .join(""),
      );
    }
  }, [currentVolunteer]);

  // const onLogoutClick = () => {
  //   logout();
  //   navigate("/app");
  // };

  // const isOnline = useOnlineStatus();

  // return !isAuthenticated ? (
  //   <Navigate to="/app" replace />
  // )
}
