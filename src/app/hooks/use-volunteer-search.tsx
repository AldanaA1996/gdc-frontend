import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

export function useVolunteerSearch() {
    const [volunteers, setVolunteers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchVolunteers = async () => {
            if (!searchTerm) {
                setVolunteers([]);
                return;
            }

            setIsLoading(true);
            const { data, error } = await supabase
                .from("volunteers")
                .select("*")
                .or(`name.ilike.%${searchTerm}%`)
                .limit(10);

            if (!error) setVolunteers(data || []);
            setIsLoading(false);
        };

        const delay = setTimeout(fetchVolunteers, 400);
        return () => clearTimeout(delay);
    }, [searchTerm]);

    return { volunteers, setVolunteers, searchTerm, setSearchTerm, isLoading };
}
