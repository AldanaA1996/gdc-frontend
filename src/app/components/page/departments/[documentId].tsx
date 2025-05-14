import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getDepartmentById } from "@/app/services/api/department";
import { Department, Material, Tool } from "@/app/types/strapi-entities";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/app/components/ui/tabs";
import { Card } from "@/app/components/ui/card";
import { set } from "astro:schema";

export default function DepartmentDetailPage() {
  const { documentId } = useParams();
  const [department, setDepartment] = useState<Department | null>(null);

  useEffect(() => {
  
    const fetchDepartment = async () => {
      const {data: department, error} = await getDepartmentById(documentId);
      console.log("respuesta de la API:", { error});
      if (error) {
        console.error("Error al obtener el departamento:", error);
        return;
      }
      console.log("Departamento obtenido:", department);
      setDepartment(department);
    };
    fetchDepartment();
  }, [documentId]);

  if (!department) return <p className="p-6 text-center">Cargando...</p>;

  const materials = department.materials ?? [];
  const tools = department.tools ?? [];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">{department.name}</h1>

      <Tabs defaultValue="materials" className="w-full max-w-4xl mx-auto">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="materials">Materiales</TabsTrigger>
          <TabsTrigger value="tools">Herramientas</TabsTrigger>
        </TabsList>

        <TabsContent value="materials" className="mt-4 space-y-3">
          {materials.length === 0 ? (
            <p className="text-center text-gray-500">No hay materiales registrados.</p>
          ) : (
            materials.map((mat: Material) => (
              <Card key={mat.id} className="p-4 shadow-sm border">
                <h2 className="text-lg font-semibold">{mat.name}</h2>
                <p className="text-sm text-gray-500">
                  {mat.quantity} {mat.unit}
                </p>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tools" className="mt-4 space-y-3">
          {tools.length === 0 ? (
            <p className="text-center text-gray-500">No hay herramientas registradas.</p>
          ) : (
            tools.map((tool: Tool) => (
              <Card key={tool.id} className="p-4 shadow-sm border">
                <h2 className="text-lg font-semibold">{tool.name}</h2>
                <p className="text-sm text-gray-500">{tool.description}</p>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
