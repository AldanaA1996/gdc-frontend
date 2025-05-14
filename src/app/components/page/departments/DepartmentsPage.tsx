import { useEffect, useState } from "react";
import { Department } from "@/app/types/strapi-entities";
import { getAllDepartments } from "@/app/services/api/department";
// import { Link } from "react-router";
import  Layout  from "@/app/components/layout";
import { Building2 } from "lucide-react";

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const response = await getAllDepartments()
                
                setDepartments(response.data)
            }
            catch (err) {
                setError("Error fetching departments")
            } finally {
                setLoading(false)
            }
        }
        fetchDepartments()
    }, [])

    if (loading) {
        return <p className="text-center mt-10">Cargando Departamentos...</p>
    }
    if (error) {
        return <p className="text-center mt-10 text-red-500">{error}</p>
    }
    if (departments.length === 0) {
        return <p className="text-center mt-10">No hay departamentos disponibles</p>
    }
    return (
        <Layout>
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-8 text-center">Departamentos</h1>

            <div className="flex flex-wrap gap-6 justify-center">
                {departments.map((dept) => (
                    <a
                        key={dept.id}
                        href={`/app/departments/${dept.documentId}`}
                        className="w-60 bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-200 flex flex-col items-center text-center">
                            <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-4">
              <Building2 className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-semibold">{dept.name}</h2>
                    </a>
                ))}
            </div>
        </div>
        </Layout>
    )
}