import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  mapLoginErrors,
  requestLogin,
} from "@/app/services/api/authentication";
import { setToken } from "@/app/services/api";
import { useOnlineStatus } from "@/app/hooks/use-online-status";
import { useAuthenticationStore } from "@/app/store/authentication";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";

export default function Login() {
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [isDisabled, setIsDisabled] = useState(false);
  const [isLoginDisabled, setIsLoginDisabled] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [loginError, setLoginError] = useState("");
  const navigate = useNavigate();

  const token = useAuthenticationStore((state) => state.token);
  const storeToken = useAuthenticationStore((state) => state.setToken);
  const setCurrentUser = useAuthenticationStore((state) => state.setCurrentUser);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setIsLoginDisabled(!(email && password) || !isOnline);
  }, [email, password, isOnline]);

  useEffect(() => {
    if (token) {
      navigate("/app");
    }
  }, [token, navigate]);

  const getLogin = async () => {
    setIsDisabled(true);
    setPendingLogin(true);
    setLoginError("");
    setHasError(false);

    const { data, error } = await requestLogin(email, password);
    setPendingLogin(false);

    if (error || !data) {
      setLoginError(
        mapLoginErrors[error?.data?.error?.name] || mapLoginErrors.default
      );
      setHasError(true);
      setIsDisabled(false);
      return;
    }

    const { jwt, user } = data;

    setToken(jwt);
    storeToken(jwt);
    setCurrentUser(user);

    setTimeout(() => {
      console.log("Login successful, redirecting to dashboard...", {token: jwt, user});
      navigate("/app/dashboard");
    }, 0);
    setIsDisabled(false);
  };

  const getInputClasses = (hasError: boolean, isDisabled: boolean) =>
    `mb-2 rounded-md border bg-white p-3 focus:outline-none focus:ring-2 dark:bg-gray-700 ${
      isDisabled ? "opacity-50" : ""
    } ${
      hasError
        ? "border-red-500 focus:ring-red-500"
        : "border-gray-300 focus:ring-blue-500"
    }`;

  return (
    <Card className="w-96 mx-auto mt-20 bg-gray shadow-lg p-6 justify-center">
      <CardHeader className="text-center">
        <CardTitle>Login</CardTitle>
        <CardDescription>Inicia Sesión</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            getLogin();
          }}
        >
          <fieldset disabled={isDisabled} className="contents">
            <Input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={getInputClasses(hasError, isDisabled)}
            />

            <Input
              required
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={getInputClasses(hasError, isDisabled)}
            />

            {hasError && (
              <span className="flex items-center rounded-md bg-red-200 p-1 text-sm text-red-500">
                {loginError}
              </span>
            )}

            <Button
              type="submit"
              disabled={isLoginDisabled || pendingLogin}
              className="w-full"
            >
              Iniciar sesión
            </Button>

            {pendingLogin && (
              <p className="text-sm text-gray-500">Cargando...</p>
            )}
          </fieldset>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center">
        <div className="flex justify-between pb-4 w-full">
          <p className="text-sm text-gray-500">¿No tienes una cuenta?</p>
          <a className="text-sm text-blue-400" href="/register">
            Regístrate
          </a>
        </div>
        <div className="flex justify-end border-t border-gray-300 pt-4 w-full">
          <a className="text-sm text-blue-400" href="/forgot-password">
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
