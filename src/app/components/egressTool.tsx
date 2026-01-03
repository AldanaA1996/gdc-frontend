"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Badge } from "@/app/components/ui/badge";
import { Search, Wrench, Users, AlertCircle, TrendingUp } from "lucide-react";

import { useAuthenticationStore } from "../store/authentication";
import { supabase } from "../lib/supabaseClient";
import { useSearch } from "../hooks/use-tool-search";
import { useVolunteerSearch } from "../hooks/use-volunteer-search";

const schema = z.object({
  toolId: z.string().min(1, "Debes seleccionar una herramienta. "),
  volunteerId: z.string().optional(),
});

export type Tool = {
  id: string;
  name: string;
  inUse: boolean;
  condition: string;
};

interface EgressToolProps {
  onToolUpdate?:  () => void;
  scannedTool?:  Tool | null; // Nueva prop
  onToolProcessed?: () => void; // Nueva prop
}

function EgressTool({ onToolUpdate, scannedTool, onToolProcessed }: EgressToolProps) {
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

  // 🔥 Efecto para manejar herramienta escaneada
  useEffect(() => {
    if (scannedTool) {
      handleSelectTool(scannedTool);
    }
  }, [scannedTool]);

  const getDbUserId = async (): Promise<number | null> => {
    if (!user?. id) return null;
    const { data:  dbUser, error } = await supabase
      .from("user")
      .select("id")
      .eq("userAuth", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error buscando user. id:", error);
      toast.error("Error buscando usuario en la base");
      return null;
    }
    if (!dbUser) {
      toast.error("El usuario logueado no está vinculado en la tabla user");
      return null;
    }
    return dbUser. id;
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setError(null);
    if (!selectedTool) {
      setError("Por favor, seleccioná una herramienta.");
      toast.error("Por favor, seleccioná una herramienta de la lista.");
      return;
    }

    if (selectedTool.inUse) {
      setError("La herramienta ya está prestada.");
      toast.error("Esta herramienta ya está prestada.");
      return;
    }

    try {
      const userCreatorId = await getDbUserId();
      if (!userCreatorId) throw new Error("No se pudo obtener el usuario creador");

      const { error:  updateError } = await supabase
        .from("tools")
        .update({ inUse: true })
        .eq("id", selectedTool. id);
      if (updateError) throw updateError;

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
            year:  "numeric",
            month: "2-digit",
            day: "2-digit",
          })
          .split("/")
          .reverse()
          .join("-") +
        "T" +
        horaActual;

      const { error: activityError } = await supabase. from("activity").insert([
        {
          tool:  selectedTool.id,
          activity_type: "borrow",
          user_creator:  userCreatorId,
          created_by: user?.id ??  null,
          created_at:  horaActual,
          created_date: fechaActual,
          volunteer:  selectedVolunteer?.id || null,
        },
      ]);
      if (activityError) throw activityError;

      form.reset();
      setSearchTerm("");
      setSelectedTool(null);
      setVolunteerSearchTerm("");
      setSelectedVolunteer(null);

      toast.success("Herramienta prestada correctamente", {
        description: `Se registró la salida de ${selectedTool.name}${selectedVolunteer ? ` para ${selectedVolunteer.name} ${selectedVolunteer.surname}` : ""}.`,
      });

      if (onToolUpdate) onToolUpdate();
      if (onToolProcessed) onToolProcessed(); // Limpiar herramienta escaneada
    } catch (err:  any) {
      console.error("Error al prestar la herramienta:", err);
      setError("Ocurrió un error al procesar el préstamo. Intenta de nuevo.");
      toast.error("Error al registrar el préstamo");
    }
  };

  const handleSelectTool = (tool: Tool) => {
    if (tool.inUse) return;
    setSelectedTool(tool);
    form.setValue("toolId", tool. id, { shouldValidate: true });
    setSearchTerm(tool.name);
    setTools([]);
  };

  const handleSelectVolunteer = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    form.setValue("volunteerId", volunteer.id, { shouldValidate: true });
    setVolunteerSearchTerm(`${volunteer.name} ${volunteer. surname}`);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = form.getValues();
    onSubmit(formData);
  };

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Egreso de Herramienta</h2>
        </div>
        <p className="text-sm text-gray-600">
          Seleccioná una herramienta disponible y registrá el préstamo
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        {/* Buscar herramienta */}
        <div className="space-y-2 relative">
          <Label htmlFor="search" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" /> Buscar Herramienta
          </Label>
          <div className="relative">
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedTool) setSelectedTool(null);
                form.setValue("toolId", "", { shouldValidate: true });
              }}
              placeholder="Escribí el nombre o escaneá el código arriba..."
              autoComplete="off"
              className="pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {tools.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-64 overflow-y-auto">
              {tools.map((tool: Tool) => (
                <li
                  key={tool.id}
                  className={`px-4 py-3 transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg ${
                    tool.inUse ?  "text-gray-400 bg-gray-50 cursor-not-allowed" : "hover:bg-blue-50 cursor-pointer"
                  }`}
                  onClick={() => ! tool.inUse && handleSelectTool(tool)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      <p className="font-medium text-gray-800">{tool.name}</p>
                    </div>
                    <Badge variant="secondary" className={tool.inUse ? "bg-gray-100 text-gray-500" : ""}>
                      {tool.inUse ? "En uso" : "Disponible"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {isLoading && (
            <p className="text-sm text-blue-600 flex items-center gap-2 mt-2">
              <span className="animate-spin">⏳</span>
              Buscando herramientas...
            </p>
          )}
        </div>

        {/* Herramienta seleccionada */}
        {selectedTool && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Wrench className="h-5 w-5 text-green-700 mt-0.5 flex-shrink-0" />
              <div className="space-y-1.5 flex-1">
                <p className="text-sm font-semibold text-gray-700">Herramienta Seleccionada</p>
                <p className="text-base font-bold text-gray-900">{selectedTool. name}</p>
                <div className="flex items-center gap-2 pt-2 border-t border-green-200">
                  <Badge variant="outline" className="bg-white border-green-300 text-green-700 font-semibold">
                    Estado: {selectedTool.inUse ? "En uso" : "Disponible"}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Buscar voluntario (sin cambios) */}
        <div className="space-y-2 relative">
          <Label htmlFor="volunteerSearch" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Users className="h-4 w-4" /> Buscar Voluntario (opcional)
          </Label>
          <div className="relative">
            <Input
              id="volunteerSearch"
              value={volunteerSearchTerm}
              onChange={(e) => {
                setVolunteerSearchTerm(e.target.value);
                if (selectedVolunteer) setSelectedVolunteer(null);
                form.setValue("volunteerId", "", { shouldValidate: true });
              }}
              placeholder="Escribí el nombre del voluntario..."
              autoComplete="off"
              className="pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus: ring-blue-200 transition-all"
            />
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          {volunteers.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-64 overflow-y-auto">
              {volunteers.map((volunteer) => (
                <li
                  key={volunteer.id}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => handleSelectVolunteer(volunteer)}
                >
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-800">{volunteer.name} {volunteer.surname}</p>
                    <Badge variant="secondary">#{volunteer.volunteer_number}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {volunteerLoading && (
            <p className="text-sm text-blue-600 flex items-center gap-2 mt-2">
              <span className="animate-spin">⏳</span>
              Buscando voluntarios...
            </p>
          )}
        </div>

        {selectedVolunteer && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-gray-800"><span className="font-semibold">Voluntario:</span> {selectedVolunteer.name} {selectedVolunteer.surname} — #{selectedVolunteer.volunteer_number}</p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="mb-4">
          <Button
            type="submit"
            disabled={! selectedTool || selectedTool.inUse || form.formState.isSubmitting}
            className="w-full py-5 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {form.formState. isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Procesando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Prestar Herramienta
              </span>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default EgressTool;