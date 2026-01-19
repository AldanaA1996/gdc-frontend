// profile component
import { supabase } from "@/app/lib/supabaseClient";
import { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/app/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";

export default function UserProfile() {
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string>("");
  const [volunteerNumber, setVolunteerNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [congregation, setCongregation] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [changeEmailOpen, setChangeEmailOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const current = userRes?.user;
        if (!current) {
          setLoading(false);
          return;
        }
        setEmail(current.email ?? "");
        const { data } = await supabase
          .from("user")
          .select("name, volunteerNumber, email, phoneNumber, congregation")
          .eq("userAuth", current.id)
          .single();
        if (mounted && data) {
          setName(data.name ?? "");
          setVolunteerNumber(
            data.volunteerNumber != null ? String(data.volunteerNumber) : ""
          );
          if (data.email) setEmail(data.email);
          if (data.phoneNumber) setPhoneNumber(data.phoneNumber);
          if (data.congregation) setCongregation(data.congregation);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleSave = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        console.error("No authenticated user");
        toast.error("No hay un usuario autenticado");
        return;
      }
      const { data, error } = await supabase
        .from("user")
        .update({
          name,
          volunteerNumber: Number(volunteerNumber),
          phoneNumber,
          congregation,
        })
        .eq("userAuth", user.id);
      if (error) {
        console.error("Error updating user:", error);
        toast.error("Error al guardar los cambios");
      } else {
        setIsEditing(false);
        toast.success("Cambios guardados correctamente");
      }
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Ocurrió un error al actualizar el perfil");
    }
  };

  return (
    <>
      <div className="mx-4 flex flex-col gap-2 min-w-2/5 md:w-fit md:pt-6 pt-2 mb-6">
        <div className="flex justify-between font-bold text-xl py-2">
          <h1> Mi Perfil</h1>
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsEditing((v) => !v)}
            variant={isEditing ? "secondary" : "default"}
          >
            <Pencil /> {isEditing ? "Cancelar" : "Editar"}
          </Button>
        </div>
        <label>Nombre y apellido: </label>
        <input
          className="border border-gray-300 rounded-md p-2 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={!isEditing || loading}
        />

        <label>Número de voluntario: </label>
        <input
          className="border border-gray-300 rounded-md p-2 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          type="text"
          value={volunteerNumber}
          onChange={(e) => setVolunteerNumber(e.target.value)}
          disabled={!isEditing || loading}
        />

        <label>Congregación</label>
        <input
          className="border border-gray-300 rounded-md p-2 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          type="text"
          value={congregation}
          onChange={(e) => setCongregation(e.target.value)}
          disabled={!isEditing || loading}
        />

        <label>Correo: </label>
        <div className= "flex justify-between gap-2">
        <input
          className="flex-1 border  border-gray-300 rounded-md p-2 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={true}
        />
        
          <Button
            className="flex-2 h-full"
            type="button"
            variant="secondary"
            onClick={() => {
              setEmailError(null);
              setEmailSent(false);
              setNewEmail("");
              setConfirmEmail("")
              setChangeEmailOpen(true);
            }}
          >
            Cambiar correo
          </Button>
        </div>

        <label> Número de telefono: </label>
        <input
          className="border border-gray-300 rounded-md p-2 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
          type="text"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={!isEditing || loading}
        />

        <Button
          className="p-6 mt-4 text-lg bg-green-900"
          variant="default"
          disabled={!isEditing || loading}
          onClick={handleSave}
        >
          Guardar
        </Button>
      </div>

      <Dialog open={changeEmailOpen} onOpenChange={setChangeEmailOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cambiar correo de inicio de sesión</DialogTitle>
            <DialogDescription>
              Ingresa tu nuevo correo. Te enviaremos un email de confirmación para completar el cambio. Ten en cuenta que el cambio de correo puede tardar unos minutos.
            </DialogDescription>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setEmailError(null);
              setEmailSent(false);
              if (!newEmail) {
                setEmailError("Ingresa un correo válido");
                return;
              }
              if (newEmail !== confirmEmail) {
                setEmailError("Los correos no coinciden");
                return;
              }
              setEmailLoading(true);
              try {
                const redirectTo = typeof window !== "undefined"
                  ? `${window.location.origin}/login`
                  : undefined;
                const { error } = await supabase.auth.updateUser(
                  { email: newEmail },
                  { emailRedirectTo: redirectTo }
                );
                if (error) {
                  setEmailError(error.message);
                } else {
                  setEmailSent(true);
                  toast.success("Te enviamos un correo para confirmar el nuevo email. Ten en cuenta que el cambio de correo puede tardar unos minutos");
                }
              } finally {
                setEmailLoading(false);
              }
            }}
          >
            <Input
              type="email"
              placeholder="Nuevo correo"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="bg-white w-full"
              required
            />
            <Input
              type="email"
              placeholder="Confirmar nuevo correo"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              className="bg-white w-full"
              required
            />
            {emailError && (
              <div className="flex justify-center">
                <p className="text-red-500 text-sm">{emailError}</p>
              </div>
            )}
            {emailSent && (
              <div className="flex justify-center">
                <p className="text-green-600 text-sm">Revisa tu correo para confirmar el cambio.</p>
              </div>
            )}
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() => setChangeEmailOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={emailLoading}
                className="bg-green-950 hover:bg-green-800"
              >
                {emailLoading ? "Enviando..." : "Enviar confirmación"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}