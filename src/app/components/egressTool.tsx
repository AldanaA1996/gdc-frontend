"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/app/components/ui/select";

import { useAuthenticationStore } from "../store/authentication";
import { supabase } from "../lib/supabaseClient";
import { useSearch } from "../hooks/use-tool-search";
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

interface EgressToolProps {
  onToolUpdate?: () => void;
}

function EgressTool({ onToolUpdate }: EgressToolProps) {
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

  // 🔹 Cargar voluntarios (ahora usando el hook)
  // Eliminado: useEffect para cargar voluntarios, ahora se hace via hook

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
      setError("Por favor, seleccioná una herramienta.");
      toast.error("Por favor, seleccioná una herramienta de la lista.");
      return;
    }

    // Volunteer is optional, no validation needed

    if (selectedTool.inUse) {
      setError("La herramienta ya está prestada.");
      toast.error("Esta herramienta ya está prestada.");
      return;
    }

    try {
      const userCreatorId = await getDbUserId();
      if (!userCreatorId) throw new Error("No se pudo obtener el usuario creador");

      // 1️⃣ Actualizar estado de la herramienta
      const { error: updateError } = await supabase
        .from("tools")
        .update({ inUse: true })
        .eq("id", selectedTool.id);
      if (updateError) throw updateError;

      // 2️⃣ Crear registro en activity con volunteer_id
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
          activity_type: "borrow",
          user_creator: userCreatorId,
          created_by: user?.id ?? null,
          created_at: horaActual,
          created_date: fechaActual,
          volunteer: selectedVolunteer?.id || null, // Usar selectedVolunteer.id si existe
        },
      ]);
      if (activityError) throw activityError;

      // 3️⃣ Resetear estado y formulario
      form.reset();
      setSearchTerm("");
      setSelectedTool(null);
      setVolunteerSearchTerm("");
      setSelectedVolunteer(null);

      toast.success("Herramienta prestada correctamente", {
        description: `Se registró la salida de ${selectedTool.name}${selectedVolunteer ? ` para ${selectedVolunteer.name} ${selectedVolunteer.surname}` : ""}.`,
      });

      // 4️⃣ Actualizar contador
      if (onToolUpdate) onToolUpdate();
    } catch (err: any) {
      console.error("Error al prestar la herramienta:", err);
      setError("Ocurrió un error al procesar el préstamo. Intenta de nuevo.");
      toast.error("Error al registrar el préstamo");
    }
  };

  const handleSelectTool = (tool: Tool) => {
    if (tool.inUse) return;
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
        {/* 🔍 Buscar herramienta */}
        <div className="flex flex-col gap-2 relative">
          <Label htmlFor="search">Buscar Herramienta</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (selectedTool) setSelectedTool(null);
              form.setValue("toolId", "", { shouldValidate: true });
            }}
            placeholder="Escribí para buscar herramienta..."
            autoComplete="off"
          />
          {tools.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
              {tools.map((tool: Tool) => (
                <li
                  key={tool.id}
                  className={`px-4 py-2 cursor-pointer ${
                    tool.inUse
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
        {/* tool selected */}
        {selectedTool && (
          <p className="text-sm p-2 rounded-md border bg-green-50 border-green-200">
            <span className="font-semibold">Herramienta seleccionada:</span> {selectedTool.name}
          </p>
        )}

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

        {/* 👥 Voluntario seleccionado */}
        {selectedVolunteer && (
          <p className="text-sm p-2 rounded-md border bg-green-50 border-green-200">
            <span className="font-semibold">Voluntario seleccionado:</span> {selectedVolunteer.name} {selectedVolunteer.surname} — #{selectedVolunteer.volunteer_number}
          </p>
        )}

        {/* ⚠️ Error */}
        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>
        )}

        {/* 🚀 Botón */}
        <Button
          type="submit"
          disabled={
            !selectedTool || selectedTool.inUse || form.formState.isSubmitting
          }
        >
          {form.formState.isSubmitting ? "Procesando..." : "Prestar Herramienta"}
        </Button>
      </form>
    </div>
  );
}

export default EgressTool;
