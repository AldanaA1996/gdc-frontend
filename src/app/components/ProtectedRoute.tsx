import { User } from "@/app/types/strapi-entities";
import { AvatarFallback } from "@radix-ui/react-avatar";
import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import { useOnlineStatus } from "../hooks/use-online-status";
import { setToken } from "../services/api";
import { requestVolunteerByUser } from "../services/api/volunteers";
import { useAuthenticationStore } from "../store/authentication";
import DropdownInline from "./DropdownInline";
import { Avatar } from "./ui/avatar";

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

    setCurrentVolunteer(result.data);
  };

  const [hasFailedToLoadVolunteer, setHasFailedToLoadVolunteer] =
    useState(false);
  const navigate = useNavigate();
  const currentUser = useAuthenticationStore((state) => state.user);
  const currentVolunteer = useAuthenticationStore((state) => state.volunteer);
  const setCurrentVolunteer = useAuthenticationStore(
    (state) => state.setCurrentVolunteer
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
          .join("")
      );
    }
  }, [currentVolunteer]);

  const onLogoutClick = () => {
    logout();
    navigate("/app");
  };

  const isOnline = useOnlineStatus();

  return !isAuthenticated ? (
    <Navigate to="/app" replace />
  ) : (
    <>
      <DropdownInline
        actions={[{ label: "Cerrar sesión", action: onLogoutClick }]}
        asChild
      >
        <div className="fixed right-2 top-2 z-10">
          <div
            className={`flex flex-row items-center justify-between gap-2 ${
              isOnline ? "bg-white" : "bg-red-300 ps-2"
            }  transition-all duration-300 ease-out`}
          >
            <WifiOffIcon
              className={`${isOnline ? "hidden" : ""} text-red-100`}
            />
            <span
              className={`${
                isOnline ? "hidden" : "flex"
              } gap-2 font-mono text-red-100`}
            >
              Sin conexión
            </span>
            <Avatar
              className={`flex cursor-pointer select-none items-center justify-center rounded-lg ${
                isOnline ? "bg-white" : "bg-white/70"
              } text-black shadow-md`}
            >
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </DropdownInline>

      {children}
    </>
  );
}
