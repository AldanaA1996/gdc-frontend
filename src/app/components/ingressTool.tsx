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
import { useSearch } from "../hooks/use-tool-return-search"; // 👈 Hook específico para herramientas en uso

const schema = z.object({
  toolId: z.string().min(1, "Debes seleccionar una herramienta."),
});

export type Tool = {
  id: string;
  name: string;
  status: string;
  condition: string;
};

function ReturnTool() {
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
    setError(null);

    if (!selectedTool) {
      setError("Por favor, selecciona una herramienta de la lista.");
      toast.error("Selecciona una herramienta en uso para devolver.");
      return;
    }

    if (selectedTool.status !== "inUse") {
      setError("Esta herramienta no está marcada como en uso.");
      toast.error("La herramienta no está prestada actualmente.");
      return;
    }

    try {
      // 1️⃣ Actualizar herramienta a "available"
      const { error: updateError } = await supabase
        .from("tools")
        .update({ status: "available" })
        .eq("id", selectedTool.id);

      if (updateError) throw updateError;

      // 2️⃣ Registrar actividad "return"
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

      const { error: activityError } = await supabase.from("activity").insert([
        {
          tool: selectedTool.id,
          activity_type: "return",
          user_creator: userCreatorId,
          created_by: createdBy,
          created_at: horaActual,
          created_date: fechaActual,
        },
      ]);

      if (activityError) throw activityError;

      // 3️⃣ Reset
      form.reset();
      setSearchTerm("");
      setSelectedTool(null);

      toast.success("Herramienta devuelta correctamente", {
        description: `Se registró la devolución de ${selectedTool.name}.`,
      });
    } catch (err: any) {
      console.error("Error al devolver la herramienta:", err);
      setError("Ocurrió un error al registrar la devolución.");
      toast.error("Error al registrar la devolución");
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
    onSubmit(form.getValues());
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
            placeholder="Buscar herramienta prestada..."
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
                  {tool.name} ({tool.status})
                </li>
              ))}
            </ul>
          )}
          {isLoading && <p className="text-sm text-gray-500">Buscando...</p>}
        </div>

        {selectedTool && (
          <p className="text-sm p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <span className="font-semibold">Seleccionada:</span> {selectedTool.name}
            <br />
            <span className="font-semibold">Estado actual:</span> {selectedTool.status}
          </p>
        )}

        {error && (
          <p className="text-red-500 text-sm bg-red-50 p-2 rounded-md">{error}</p>
        )}

        <Button
          type="submit"
          disabled={!selectedTool || form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? "Procesando..." : "Devolver Herramienta"}
        </Button>
      </form>
    </div>
  );
}

export default ReturnTool;
