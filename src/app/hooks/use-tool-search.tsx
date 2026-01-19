// hooks/use-tool-search.ts
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Tool } from "../components/egressTool";

export const useSearch = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTools = async () => {
      // 🔥 Si no hay término de búsqueda, limpiar resultados
      if (! searchTerm || searchTerm.trim().length === 0) {
        setTools([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const { data, error } = await supabase
          .from("tools")
          .select("*")
          .ilike("name", `%${searchTerm}%`)
          .eq("inUse", false) // 🔥 Solo herramientas disponibles
          .limit(10);

        if (error) {
          console.error("Error buscando herramientas:", error);
          setTools([]);
        } else {
          setTools(data || []);
        }
      } catch (err) {
        console.error("Error en búsqueda:", err);
        setTools([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce de 400ms
    const delay = setTimeout(fetchTools, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  // 🔥 Función para limpiar la búsqueda
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setTools([]);
  }, []);

  return { 
    tools, 
    setTools, 
    searchTerm, 
    setSearchTerm, 
    isLoading,
    clearSearch // 🔥 Nueva función
  };
};