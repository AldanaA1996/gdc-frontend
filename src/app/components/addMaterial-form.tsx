import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import type { Medidas } from '../types/strapi-entities';
import type { MovimientosM } from '../types/strapi-entities';
import { createMaterial } from '../services/api/material';
import { getAllDepartments } from '../services/api/department';
import { createMaterialMovement } from '../services/api/material_movement';

import { Department } from '../types/strapi-entities';

const MovimientosM = [
  "entry", "exit"
] as const;

const Medidas = [ "Select",
  "Kg", "Mts", "Cms", "Caja", "Unidad", "Paquete", "Litro", "Gramo", "Pieza", "Bolsa", "Otro"
] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  unit: z.enum(Medidas),
  department: z.string().min(1, 'El departamento es requerido'),
  movement_type: z.enum(['entry', 'exit']),
  description: z.string().optional(),
});

function AddMaterialForm() {
  const [departments, setDepartments] = useState<Department[]>([]);
 
  

  useEffect(() => {
    const fetchDepartments = async () => {
      const deptResponse = await getAllDepartments();
      setDepartments(deptResponse.data); 
    };
    fetchDepartments();
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'Select',
      department: '',
      movement_type: 'entry',
      description: '',
    },
  });

 const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      const deptId = Number(values.department);
      const departmentObj = departments.find(dep => dep.id === deptId);
      if (!departmentObj) {
        throw new Error("Departamento no encontrado");
      }
    // 1. Crear el material
    const nuevoMaterial = await createMaterial(
      {
        name: values.name,
        quantity: values.quantity,
        unit: values.unit,
        description: values.description,
      },
      departmentObj.id,
      [
        {
          quantity: values.quantity,
          department: departmentObj,
          notes: values.description,
        }
      ]
    );

    console.log("Material creado:", nuevoMaterial);



    const movementPayload = {
      quantity: values.quantity,
      movement_type: values.movement_type,
      movement_date: new Date(), // 👈 IMPORTANTE: string, no Date
      material: nuevoMaterial.data.id,          // 👈 número, no objeto
      notes: values.description || "",
    };

    console.log("Payload del movimiento:", JSON.stringify(movementPayload, null, 2));

    const movimiento = await createMaterialMovement(movementPayload);

    console.log("Movimiento creado:", movimiento);
  } catch (error) {
    console.error("Error en creación de material o movimiento:", error);
  }
};

//   const onSubmit = async (values: z.infer<typeof schema>) => {
//     try {
//       const deptId = Number(values.department);
//       const departmentObj = departments.find(dep => dep.id === deptId);
//       if (!departmentObj) {
//         throw new Error("Departamento no encontrado");
//       }
  
//       // Un solo request: material + movimiento de entrada
//       const nuevoMaterial = await createMaterial(
//         {
//           name: values.name,
//           quantity: values.quantity,
//           unit: values.unit,
//           description: values.description,
          
//         },
//         deptId,
//         [
//           {
//             quantity: values.quantity,
//             movement_type: "entry",
//             movement_date: new Date(),
//             department: departmentObj,
//             notes: values.description,
//           }
//         ])
        
//         const materialId = nuevoMaterial.data.id;
// console.log("Payload del movimiento:", {
//   quantity: values.quantity,
//   movement_type: "entry",
//   movement_date: new Date(),
//   material: nuevoMaterial.data.id,
//   department: departmentObj,
//   notes: values.description,
// });
//       // 2. Crear movimiento de entrada
//       const movementRes = await createMaterialMovement({
//         quantity: values.quantity,
//         movement_type: "entry",
//         movement_date: new Date(),
//         notes: values.description,
//         material: nuevoMaterial.data,
//         department: deptId,
//       });

//       console.log('Material y movimiento creados:', nuevoMaterial, movementRes);
        
      
  
//       console.log("Creado:", nuevoMaterial);
//       form.reset();
//     } catch (error) {
//       console.error("Error al crear material o movimiento:", error);
//     }
//   };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre del Material</Label>
      <Input id="name" {...form.register('name')} placeholder="Nombre del material" />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} placeholder="Cantidad" />

      <Label htmlFor="unit">Unidad</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        <option value="">Selecciona la unidad</option>
        {Medidas.map((medida) => (
          <option key={medida} value={medida}>{medida}</option>
        ))}
      </select>

      <Label htmlFor="department">Departamento</Label>
      <select id="department" {...form.register('department')} className="border rounded p-2">
        <option value="">Selecciona un departamento</option>
        {departments.map((dep) => (
          <option key={dep.id} value={dep.id.toString()}>
            {dep.name}
          </option>
        ))}
      </select>

      <Label htmlFor="description">Descripción (opcional)</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción" />

      <Button type="submit">Agregar Material</Button>
    </form>
  );
}

export default AddMaterialForm;
