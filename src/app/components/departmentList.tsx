import { memo } from "react";
import { Department } from "@/app/types/strapi-entities";
import { Building2 } from "lucide-react";

type Props = {
  departments: Department[];
};

const DepartmentList = memo(({ departments }: Props) => {
  return (
    <div className="flex flex-wrap gap-6 justify-center">
      {departments.map((dept) => (
        <a
          key={dept.id}
          href={`/app/departments/${dept.documentId}`}
          className="w-60 bg-white rounded-2xl p-5 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all border border-gray-200 flex flex-col items-center text-center"
        >
          <div className="bg-blue-100 text-blue-600 p-3 rounded-full mb-4">
            <Building2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-semibold">{dept.name}</h2>
        </a>
      ))}
    </div>
  );
});

export default DepartmentList;
