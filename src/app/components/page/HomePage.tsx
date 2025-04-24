import React from "react";
import Layout from "@/components/Layout";
import AddMaterialForm from "@/app/components/addMaterial-form";

export function Home() {
  return (
    <Layout>
      <div className="flex flex-col  min-h-screen py-2 gap-4">
        <div className="bg-gray-100 p-6 rounded-lg shadow-md mb-4">
          <h2 className="text-2xl font-semibold">Bienvenido a GDC Stock</h2>
          <p className="mt-2 text-gray-600">
            Una ayuda para manejar su ingreso y egreso de materiales al deposito
          </p>
        </div>
        <div className=" bg-white p-6 rounded-lg shadow-md mb-4">
          <h3 className="text-xl font-semibold p-2">Agregar Material</h3>
          <AddMaterialForm />
        </div>

        <div className="flex-end flex-1 text-end justify-end bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold">Información del Sistema</h3>
          <p className="mt-2 text-gray-600">
            Esta app esta en etapas de creacion por una programadora sin
            experiencia, por favor sea paciente con ella.
          </p>
        </div>
      </div>
    </Layout>
  );
}
export default Home;
