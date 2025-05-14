import type { Department } from "../types/strapi-entities";
import { Link } from "react-router";

export default function DepartmentsGrid ({ departments }: { departments: Department[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {departments.map((dep) => (
        <Link
          key={dep.id}
          to={`/departments/${dep.id}`}
          className="p-4 border rounded-lg shadow hover:bg-gray-100"
        >
          <h2 className="text-xl font-bold">{dep.name}</h2>
          
        </Link>
      ))}
    </div>
  );
}
