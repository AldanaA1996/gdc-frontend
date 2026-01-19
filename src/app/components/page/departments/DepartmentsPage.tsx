import Layout from "@/app/components/layout";
import DepartmentsGrid from "../../departmentsGrid";

export default function DepartmentsPage() {
  return (
    <Layout>
      <div className="p-6">
        <DepartmentsGrid />
      </div>
    </Layout>
  );
}
