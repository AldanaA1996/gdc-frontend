import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { useNavigate } from "react-router-dom";
import { Building, Building2Icon, ChevronRight, Loader2 } from "lucide-react";

type Department = {
  id: string;
  name: string;
};

export default function DepartmentsGrid() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("departments").select("id, name").order("name");
      if (error) {
        console.error("Error fetching departments:", error. message);
      } else {
        setDepartments(data || []);
      }
      setLoading(false);
    };

    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-sm text-gray-600">Cargando departamentos... </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pt-2 pb-24 md:pb-6">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Building2Icon className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Departamentos</h2>
        </div>
        <p className="text-xs text-gray-600">
          Selecciona un departamento para ver sus detalles
        </p>
      </div>

      {/* Grid de departamentos */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((dep) => (
          <div
            key={dep.id}
            onClick={() => navigate(`/app/departments/${dep.id}`)}
            className="group relative p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 hover:bg-blue-50 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                  <Building className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                  {dep.name}
                </h3>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </div>
        ))}
      </div>

      {/* Mensaje cuando no hay departamentos */}
      {! loading && departments.length === 0 && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <Building className="h-12 w-12 text-gray-300" />
          <p className="text-gray-500 text-sm">No hay departamentos disponibles</p>
        </div>
      )}
    </div>
  );
}