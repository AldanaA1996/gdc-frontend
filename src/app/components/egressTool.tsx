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
import { useSearch } from "../hooks/use-tool-search"; // 🔎 Debes crear este hook (similar a use-material-search)

const schema = z.object({
  toolId: z.string().min(1, "Debes seleccionar una herramienta."),
});

export type Tool = {
  id: string;
  name: string;
  status: string; // disponible, en uso, etc.
  condition: string;
};

function EgressTool() {
  const { tools, isLoading, setSearchTerm, searchTerm, setTools } = useSearch();
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthenticationStore((state) => state.user);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      toolId: "",
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
    console.log("onSubmit called with values:", values);
    setError(null);

    if (!selectedTool) {
      setError("Por favor, selecciona una herramienta.");
      toast.error("Por favor, selecciona una herramienta de la lista.");
      return;
    }

    if (selectedTool.status === "inUse") {
      setError("La herramienta ya está en uso.");
      toast.error("Esta herramienta ya está prestada.");
      return;
    }

    try {
      // 1️⃣ Actualizar el estado de la herramienta
      const { error: updateError } = await supabase
        .from("tools")
        .update({ status: "inUse" })
        .eq("id", selectedTool.id);

      if (updateError) throw updateError;

      // 2️⃣ Crear actividades
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
        now.toLocaleTimeString("es-AR", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });

      const createdBy = user?.id ?? null;
      const userCreatorId = await getDbUserId();

      const activities = [
        {
          tool: selectedTool.id,
          activity_type: "exit",
          user_creator: userCreatorId,
          created_by: createdBy,
          created_at: horaActual,
          created_date: fechaActual,
        },
        {
          tool: selectedTool.id,
          activity_type: "inUse",
          user_creator: userCreatorId,
          created_by: createdBy,
          created_at: horaActual,
          created_date: fechaActual,
        },
      ];

      const { error: activityError } = await supabase
        .from("activity")
        .insert(activities);

      if (activityError) throw activityError;

      // 3️⃣ Resetear formulario
      form.reset();
      setSearchTerm("");
      setSelectedTool(null);

      toast.success("Herramienta prestada correctamente", {
        description: `Se registró la salida de ${selectedTool.name} como 'en uso'.`,
      });
    } catch (err: any) {
      console.error("Error al prestar la herramienta:", err);
      setError("Ocurrió un error al procesar el préstamo. Intenta de nuevo.");
      toast.error("Error al registrar el préstamo");
    }
  };

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool);
    form.setValue("toolId", tool.id, { shouldValidate: true });
    setSearchTerm(tool.name);
    setTools([]);
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
          <Label htmlFor="search">Buscar Herramienta</Label>
          <Input
            id="search"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (selectedTool) setSelectedTool(null);
              form.setValue("toolId", "", { shouldValidate: true });
            }}
            placeholder="Escribe para buscar herramienta..."
            autoComplete="off"
          />

          {tools.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
              {tools.map((tool: Tool) => (
                <li
                  key={tool.id}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectTool(tool)}
                >
                  {tool.name} ({tool.status === "inUse" ? "En uso" : "Disponible"})
                </li>
              ))}
            </ul>
          )}
          {isLoading && <p className="text-sm text-gray-500">Buscando...</p>}
        </div>

        {selectedTool && (
          <p
            className={`text-sm p-2 rounded-md border ${
              selectedTool.status === "inUse"
                ? "bg-red-50 border-red-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <span className="font-semibold">Seleccionada:</span> {selectedTool.name}
            <br />
            <span className="font-semibold">Estado:</span>{" "}
            {selectedTool.status === "inUse" ? "En uso" : "Disponible"}
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>
        )}

        <Button
          type="submit"
          disabled={!selectedTool || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Procesando..." : "Prestar Herramienta"}
        </Button>
      </form>
    </div>
  );
}

export default EgressTool;
