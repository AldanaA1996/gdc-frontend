import { useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
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

export default function SignUp() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [numeroVoluntario, setNumeroVoluntario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    // Validar longitud mínima de contraseña
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app/home`
        }
      });

      if (error) {
        setError(error.message);
      } else {
        console.log("Usuario registrado:", data);
        // Crear registro relacionado en tabla 'user' inmediatamente
        if (data.user) {
          const authId = data.user.id;
          const numeroParsed = numeroVoluntario?.trim() ? Number(numeroVoluntario) : null;
          console.log("🔄 Creando usuario en tabla personalizada:", {
            userAuth: authId,
            email: email,
            name: nombre,
            volunteerNumber: numeroParsed
          });

          const { error: insertErr } = await supabase
            .from("user")
            .insert([
              {
                userAuth: authId,
                email,
                name: nombre || null,
                volunteerNumber: numeroParsed,
                
              },
            ]);
          if (insertErr) {
            console.error("❌ Error insertando en tabla user:", insertErr);
            setError("No se pudo crear el usuario en la base de datos: " + insertErr.message);
            setLoading(false);
            return;
          } else {
            console.log("✅ Usuario creado exitosamente en tabla personalizada");
          }

          const { error: insertErr2 } = await supabase
            .from("volunteers")
            .insert([
              {
                
                name: nombre || null,
                volunteer_number: numeroParsed,
              },
            ]);
          if (insertErr2) {
            console.error("❌ Error insertando en tabla user:", insertErr2);
            setError("No se pudo crear el usuario en la base de datos: " + insertErr2.message);
            setLoading(false);
            return;
          } else {
            console.log("✅ Usuario creado exitosamente en tabla personalizada");
          }
        }
        setSuccess(true);
        // Si el email no necesita confirmación, redirigir automáticamente
        if (data.user && !data.user.email_confirmed_at) {
          setTimeout(() => {
            window.location.href = "/app/paniol";
          }, 3000);
        }
      }
    } catch (err: any) {
      setError("Error inesperado al crear la cuenta");
      console.error("Error en sign up:", err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'url(/images/bgStockly.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <div className="max-w-md w-full space-y-8">
          <Card className="bg-white/50 backdrop-blur border-b border-gray-700 rounded-xl shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-600">
                ¡Cuenta creada exitosamente!
              </CardTitle>
              <CardDescription className="text-gray-600">
                Revisa tu correo electrónico para confirmar tu cuenta
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="p-4 bg-green-50 border border-green-200 rounded-md mb-4" >
                <p className="text-sm text-green-600">
                  Hemos enviado un enlace de confirmación a <strong>{email}</strong>
                </p>
              </div>
              <p className="text-sm text-gray-600 mb-4">
                Haz clic en el enlace para activar tu cuenta y poder iniciar sesión.
              </p>
              <Button
                onClick={() => window.location.href = "/app"}
                className="w-full"
              >
                Volver al inicio
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundImage: 'url(/images/bgStockly.png)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      <div className="max-w-md w-full space-y-8">
        <Card className="bg-white/50 backdrop-blur rounded-xl shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Crear Cuenta
            </CardTitle>
            <CardDescription className="text-gray-600">
              Regístrate en Stockly para comenzar
            </CardDescription>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <form className="space-y-4" onSubmit={handleSignUp}>
              
                <div>
                  <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre y apellido
                  </label>
                  <Input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    placeholder="Juan Pérez"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    disabled={loading}
                  />
                </div>
                
                
              <div>
                <label htmlFor="numeroVoluntario" className="block text-sm font-medium text-gray-700 mb-1">
                  Número de voluntario
                </label>
                <Input
                  id="numeroVoluntario"
                  name="numeroVoluntario"
                  type="number"
                  placeholder="1234"
                  value={numeroVoluntario}
                  onChange={(e) => setNumeroVoluntario(e.target.value)}
                  disabled={loading}
                  min={0}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Mínimo 6 caracteres
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmar Contraseña
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creando cuenta..." : "Crear Cuenta"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">o</span>
                </div>
              </div>

            </div>
          </CardContent>

          <CardFooter className="flex flex-col items-center justify-center space-y-2">
            <div className="flex justify-between w-full text-sm">
              <span className="text-gray-500">¿Ya tienes una cuenta?</span>
              <a className="text-blue-600 hover:text-blue-500 font-medium" href="/app">
                Iniciar sesión
              </a>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
