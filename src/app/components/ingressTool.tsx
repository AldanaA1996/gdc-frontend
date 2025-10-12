import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";

import { useAuthenticationStore } from "../store/authentication";
import { supabase } from "../lib/supabaseClient";
import { useSearch } from "../hooks/use-tool-return-search";
import { useVolunteerSearch } from "../hooks/use-volunteer-search";

const schema = z.object({
  toolId: z.string().min(1, "Debes seleccionar una herramienta."),
  volunteerId: z.string().optional(),
});

export type Tool = {
  id: string;
  name: string;
  inUse: boolean;
  condition: string;
};

interface ReturnToolProps {
  onToolUpdate?: () => void; // ✅ nueva prop para actualizar contador
}

function ReturnTool({ onToolUpdate }: ReturnToolProps) {
  const { tools, isLoading, setSearchTerm, searchTerm, setTools } = useSearch();
  const { volunteers, isLoading: volunteerLoading, setSearchTerm: setVolunteerSearchTerm, searchTerm: volunteerSearchTerm } = useVolunteerSearch();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthenticationStore((state) => state.user);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      toolId: "",
      volunteerId: "",
    },
  });

  const getDbUserId = async (): Promise<number | null> => {
    if (!user?.id) return null;

    const { data: dbUser, error } = await supabase
      .from("user")
      .select("id")
      .eq("userAuth", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error buscando user.id:", error);
      toast.error("Error buscando usuario en la base");
      return null;
    }
    if (!dbUser) {
      toast.error("El usuario logueado no está vinculado en la tabla user");
      return null;
    }
    return dbUser.id;
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null);

    if (!selectedTool) {
      setError("Por favor, selecciona una herramienta.");
      toast.error("Selecciona una herramienta para devolver.");
      return;
    }

    // Volunteer is optional, no validation needed

    if (!selectedTool.inUse) {
      setError("La herramienta no está prestada actualmente.");
      toast.error("Esta herramienta no está marcada como 'en uso'.");
      return;
    }

    try {
      const userCreatorId = await getDbUserId();
      if (!userCreatorId) throw new Error("No se pudo obtener el usuario creador");

      // 1️⃣ Actualizar herramienta como disponible
      const { error: updateError } = await supabase
        .from("tools")
        .update({ inUse: false })
        .eq("id", selectedTool.id);
      if (updateError) throw updateError;

      // 2️⃣ Registrar devolución en activity
      const now = new Date();
      const horaActual = now.toLocaleTimeString("es-AR", {
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const fechaActual =
        now
          .toLocaleDateString("es-AR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          })
          .split("/")
          .reverse()
          .join("-") +
        "T" +
        horaActual;

      const { error: activityError } = await supabase.from("activity").insert([
        {
          tool: selectedTool.id,
          activity_type: "return",
          user_creator: userCreatorId,
          created_by: user?.id ?? null,
          created_at: horaActual,
          created_date: fechaActual,
          volunteer: selectedVolunteer?.id || null,
        },
      ]);
      if (activityError) throw activityError;

      // 3️⃣ Resetear formulario y estado
      form.reset();
      setSearchTerm("");
      setSelectedTool(null);
      setVolunteerSearchTerm("");
      setSelectedVolunteer(null);

      toast.success("Herramienta devuelta correctamente", {
        description: `Se registró la devolución de ${selectedTool.name}${selectedVolunteer ? ` por ${selectedVolunteer.name}` : ""}.`,
      });

      // 4️⃣ Actualizar contador en componente padre
      if (onToolUpdate) onToolUpdate();
    } catch (err: any) {
      console.error("Error al devolver la herramienta:", err);
      setError("Ocurrió un error al registrar la devolución.");
      toast.error("Error al registrar la devolución");
    }
  };

  const handleSelectTool = (tool: Tool) => {
    if (!tool.inUse) return; // prevenir selección de herramientas no prestadas
    setSelectedTool(tool);
    form.setValue("toolId", tool.id, { shouldValidate: true });
    setSearchTerm(tool.name);
    setTools([]);
  };

  const handleSelectVolunteer = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    form.setValue("volunteerId", volunteer.id, { shouldValidate: true });
    setVolunteerSearchTerm(`${volunteer.name} ${volunteer.surname}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = form.getValues();
    onSubmit(formData);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-md">
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 relative">
          <Label htmlFor="search">Buscar Herramienta (en uso)</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (selectedTool) setSelectedTool(null);
              form.setValue("toolId", "", { shouldValidate: true });
            }}
            placeholder="Escribe para buscar herramienta prestada..."
            autoComplete="off"
          />

          {tools.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
              {tools.map((tool: Tool) => (
                <li
                  key={tool.id}
                  className={`px-4 py-2 cursor-pointer ${
                    !tool.inUse
                      ? "text-gray-400 bg-gray-50 cursor-not-allowed"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => handleSelectTool(tool)}
                >
                  {tool.name} {tool.inUse ? "(En uso)" : "(Disponible)"}
                </li>
              ))}
            </ul>
          )}
          {isLoading && <p className="text-sm text-gray-500">Buscando...</p>}
        </div>

        {/* 👤 Buscar voluntario */}
        <div className="flex flex-col gap-2 relative">
          <Label htmlFor="volunteerSearch">Buscar Voluntario</Label>
          <Input
            id="volunteerSearch"
            value={volunteerSearchTerm}
            onChange={(e) => {
              setVolunteerSearchTerm(e.target.value);
              if (selectedVolunteer) setSelectedVolunteer(null);
              form.setValue("volunteerId", "", { shouldValidate: true });
            }}
            placeholder="Escribí para buscar voluntario..."
            autoComplete="off"
          />
          {volunteers.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
              {volunteers.map((volunteer) => (
                <li
                  key={volunteer.id}
                  className="px-4 py-2 cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSelectVolunteer(volunteer)}
                >
                  {volunteer.name} — #{volunteer.volunteer_number}
                </li>
              ))}
            </ul>
          )}
          {volunteerLoading && <p className="text-sm text-gray-500">Buscando...</p>}
        </div>

        {selectedTool && (
          <p
            className="text-sm p-2 rounded-md border bg-green-50 border-green-200"
          >
            <span className="font-semibold">Seleccionada:</span> {selectedTool.name}
          </p>
        )}

        {/* 👥 Voluntario seleccionado */}
        {selectedVolunteer && (
          <p className="text-sm p-2 rounded-md border bg-green-50 border-green-200">
            <span className="font-semibold">Voluntario seleccionado:</span> {selectedVolunteer.name} — #{selectedVolunteer.volunteer_number}
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>
        )}

        <Button
          type="submit"
          disabled={!selectedTool || !selectedTool.inUse || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Procesando..." : "Devolver Herramienta"}
        </Button>
      </form>
    </div>
  );
}

export default ReturnTool;
