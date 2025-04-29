import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

import {
  mapLoginErrors,
  requestLogin,
} from "@/app/services/api/authentication"
import { setToken } from "@/app/services/api"
import { useOnlineStatus } from "@/app/hooks/use-online-status"
import { useAuthenticationStore } from "@/app/store/authentication"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Input } from "@/app/components/ui/input" // <<-- Acá importamos el Input de shadcn

const loginSchema = z.object({
  identifier: z.string().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const token = useAuthenticationStore((state) => state.token);
  const storeToken = useAuthenticationStore((state) => state.setToken);
  const setCurrentUser = useAuthenticationStore(
    (state) => state.setCurrentUser,
  );
  const isOnline = useOnlineStatus();

  const [pendingLogin, setPendingLogin] = useState(false);
  const [loginError, setLoginError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (token) {
      navigate("/app");
    }
  }, [token]);

  const onSubmit = async (values: LoginFormValues) => {
    if (!isOnline) return;

    setPendingLogin(true);
    setLoginError("");

    const { data, error } = await requestLogin(
      values.identifier,
      values.password,
    );

    setPendingLogin(false);

    if (error || !data) {
      setLoginError(
        mapLoginErrors[error?.data?.error?.name] || mapLoginErrors.default,
      );
      return;
    }

    const { jwt, user } = data;

    setToken(jwt);
    storeToken(jwt);
    setCurrentUser(user);

    navigate("/app");
  };

  return (
    <Card className="w-96 mx-auto mt-20 bg-gray shadow-lg p-6 justify-center">
      <CardHeader className="text-center">
        <CardTitle>Login</CardTitle>
        <CardDescription>Inicia Sesión</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Input
            type="email"
            placeholder="Email"
            {...register("identifier")}
            disabled={isSubmitting || !isOnline}
          />
          {errors.identifier && (
            <p className="text-sm text-red-500">{errors.identifier.message}</p>
          )}

          <Input
            type="password"
            placeholder="Contraseña"
            {...register("password")}
            disabled={isSubmitting || !isOnline}
          />
          {errors.password && (
            <p className="text-sm text-red-500">{errors.password.message}</p>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || pendingLogin || !isOnline}
          >
            Iniciar sesión
          </Button>

          {pendingLogin && <p className="text-sm text-gray-500">Cargando...</p>}
          {loginError && <p className="text-sm text-red-500">{loginError}</p>}
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center justify-center">
        <div className="flex justify-between pb-4 w-full">
          <p className="text-sm text-gray-500">¿No tienes una cuenta?</p>
          <a className="text-sm text-blue-400" href="/register">
            Registrate
          </a>
        </div>
        <div className="flex justify-between border-t border-gray-300 pt-4 w-full">
          <a className="text-sm text-blue-400" href="/forgot-password">
          ¿Olvidaste tu contraseña?
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
