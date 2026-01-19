import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export const useSearch = () => {
  const [tools, setTools] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchTools = async () => {
      if (!searchTerm) {
        setTools([]);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("tools")
        .select("*")
        .ilike("name", `%${searchTerm}%`)
        .eq("inUse", true)
        .limit(10);

      if (!error) setTools(data || []);
      setIsLoading(false);
    };

    const delay = setTimeout(fetchTools, 400);
    return () => clearTimeout(delay);
  }, [searchTerm]);

  return { tools, setTools, searchTerm, setSearchTerm, isLoading };
};
