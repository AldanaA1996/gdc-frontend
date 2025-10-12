import {useState} from "react"
import {supabase} from "@/app/lib/supabaseClient"

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
  const [error, setError] = useState<string |null>(null);



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("🔐 Intentando login con:", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("❌ Error de autenticación:", error.message);
      setError(error.message)
    } else {
      console.log("✅ Login exitoso:", {
        user: data.user?.id,
        email: data.user?.email,
        session: data.session ? "Sesión creada" : "Sin sesión"
      });

      // Pequeña pausa para asegurar que la sesión se establezca
      setTimeout(() => {
        window.location.href ="/app/paniol";
      }, 100);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'url(/images/bgStockly.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
    <Card className="w-96 mx-auto  bg-white/50  shadow-lg p-6 justify-center">
      <CardHeader className="text-center">
        <CardTitle>Login</CardTitle>
        <CardDescription>Inicia Sesión</CardDescription>
      </CardHeader>

      <CardContent>
        <form
          className="flex flex-col gap-4"
          onSubmit={handleLogin}
        >
          <fieldset className="contents">
            <Input
              required
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              
            />

            <Input
              required
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              
            />

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-teal-700 hover:bg-teal-600 text-white"
              onSubmit={handleLogin}
            >
              Iniciar sesión
            </Button>
          </fieldset>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col items-center justify-center">
        <div className="flex justify-between pb-4 w-full">
          <p className="text-sm text-gray-500">¿No tienes una cuenta?</p>
          <a className="text-sm text-blue-400" href="/app/signup">
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
    </div>
  );
}
