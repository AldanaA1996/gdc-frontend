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
import { toast } from "sonner";
import { Loader2, CheckCircle2, AlertCircle, User, Phone, Users, Building2, Mail, Lock } from "lucide-react";

export default function SignUp() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [nombre, setNombre] = useState("");
  const [numeroVoluntario, setNumeroVoluntario] = useState("");
  const [telefono, setTelefono] = useState("");
  const [congregacion, setCongregacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validaciones
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      toast.error("Las contraseñas no coinciden");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      toast.error("La contraseña debe tener al menos 6 caracteres");
      setLoading(false);
      return;
    }

    if (!nombre. trim()) {
      setError("El nombre es requerido");
      toast.error("El nombre es requerido");
      setLoading(false);
      return;
    }

    try {
      console.log("📝 Iniciando registro de usuario...");

      // Preparar metadata
      const metadata:  any = {
        name: nombre. trim(),
      };

      // Agregar campos opcionales solo si tienen valor
      if (numeroVoluntario?.trim()) {
        metadata. volunteer_number = numeroVoluntario. trim();
      }

      if (telefono?.trim()) {
        metadata.phone = telefono.trim();
      }

      if (congregacion?.trim()) {
        metadata.congregation = congregacion.trim();
      }

      console.log("📤 Enviando datos:", {
        email:  email.trim(),
        metadata,
      });

      // Crear usuario en Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options:  {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/app/paniol`,
        },
      });

      if (authError) {
        console.error("❌ Error en Auth:", authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error("No se pudo crear el usuario");
      }

      console.log("✅ Usuario Auth creado:", authData.user. id);

      // Esperar a que el trigger complete con reintentos
      console.log("⏳ Esperando a que el trigger cree los registros...");
      
      let userProfile = null;
      let attempts = 0;
      const maxAttempts = 10; // 10 intentos = 5 segundos

      while (attempts < maxAttempts && ! userProfile) {
        await new Promise((resolve) => setTimeout(resolve, 500)); // Esperar 500ms entre intentos
        
        attempts++;
        console.log(`🔍 Intento ${attempts}/${maxAttempts} de verificar perfil...`);

        const { data, error } = await supabase
          .from("user")
          .select("*")
          .eq("userAuth", authData.user.id)
          .maybeSingle(); // 🔥 Cambio de . single() a .maybeSingle()

        if (data) {
          userProfile = data;
          console.log("✅ Perfil encontrado:", userProfile);
          break;
        }

        if (error && error.code !== 'PGRST116') {
          // Si es un error diferente a "no encontrado", lanzar
          console.error("❌ Error al verificar perfil:", error);
          throw error;
        }
      }

      if (! userProfile) {
        console.warn("⚠️ No se pudo verificar el perfil después de varios intentos");
        // No fallar, puede que el trigger tarde más
        toast.warning("Usuario creado, pero la verificación tomó más tiempo del esperado");
      }

      // Verificar voluntario si corresponde (sin fallar si no existe)
      if (numeroVoluntario?.trim()) {
        const { data: volunteer } = await supabase
          . from("volunteers")
          .select("*")
          .eq("user_id", authData.user.id)
          .maybeSingle();

        if (volunteer) {
          console.log("✅ Voluntario verificado:", volunteer);
        } else {
          console.log("ℹ️ Registro de voluntario aún no disponible");
        }
      }

      // Éxito
      setSuccess(true);
      toast.success("¡Cuenta creada exitosamente!");

      setTimeout(() => {
        window.location.href = "/app";
      }, 3000);

    } catch (err:  any) {
      console.error("❌ Error completo:", err);
      const errorMessage = err.message || "Error inesperado al crear la cuenta";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 🎉 Pantalla de éxito
  if (success) {
    return (
      <div
        className="min-h-screen flex items-center justify-center py-12 px-4"
        style={{
          backgroundImage:  "url(/images/bgStockly.png)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <Card className="max-w-md w-full bg-white/95 backdrop-blur rounded-xl shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-600">
              ¡Cuenta creada exitosamente!
            </CardTitle>
            <CardDescription>
              Revisa tu correo para confirmar tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">
                Enlace enviado a <strong>{email}</strong>
              </p>
            </div>
            <p className="text-sm text-gray-600">
              Haz clic en el enlace para activar tu cuenta
            </p>
            <Button onClick={() => (window.location.href = "/app")} className="w-full">
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 📝 Formulario
  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{
        backgroundImage:  "url(/images/bgStockly.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Card className="max-w-md w-full bg-white/95 backdrop-blur rounded-xl shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-gray-900">Crear Cuenta</CardTitle>
          <CardDescription className="text-gray-600">
            Regístrate en Stockly para comenzar
          </CardDescription>
        </CardHeader>

        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSignUp}>
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1. 5">
                <User className="h-4 w-4" />
                Nombre y apellido *
              </label>
              <Input
                required
                placeholder="Juan Pérez"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Phone className="h-4 w-4" />
                Teléfono (opcional)
              </label>
              <Input
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Número de voluntario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Users className="h-4 w-4" />
                Número de voluntario (opcional)
              </label>
              <Input
                type="number"
                placeholder="1234"
                value={numeroVoluntario}
                onChange={(e) => setNumeroVoluntario(e.target.value)}
                disabled={loading}
                min={0}
              />
            </div>

            {/* Congregación */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Building2 className="h-4 w-4" />
                Congregación (opcional)
              </label>
              <Input
                placeholder="Nombre de la congregación"
                value={congregacion}
                onChange={(e) => setCongregacion(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Mail className="h-4 w-4" />
                Correo Electrónico *
              </label>
              <Input
                type="email"
                required
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                Contraseña *
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target. value)}
                disabled={loading}
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                <Lock className="h-4 w-4" />
                Confirmar Contraseña *
              </label>
              <Input
                type="password"
                required
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full mt-6" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creando cuenta...
                </>
              ) : (
                "Crear Cuenta"
              )}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-between text-sm border-t pt-4">
          <span className="text-gray-500">¿Ya tienes cuenta?</span>
          <a href="/app" className="text-blue-600 hover:text-blue-500 font-medium">
            Iniciar sesión
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}