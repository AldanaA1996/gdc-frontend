import { useEffect, useState } from "react";
import { Department } from "@/app/types/strapi-entities";
import { getAllDepartments } from "@/app/services/api/department";
import Layout from "@/app/components/layout";
import DepartmentList from "@/app/components/departmentList";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getAllDepartments();
        setDepartments(response.data);
      } catch (err) {
        setError("Error fetching departments");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  if (loading) {
    return <p className="text-center mt-10">Cargando Departamentos...</p>;
  }
  if (error) {
    return <p className="text-center mt-10 text-red-500">{error}</p>;
  }
  if (departments.length === 0) {
    return <p className="text-center mt-10">No hay departamentos disponibles</p>;
  }

  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Departamentos</h1>
        <DepartmentList departments={departments} />
      </div>
    </Layout>
  );
}
