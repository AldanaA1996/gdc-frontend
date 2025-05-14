import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from "react-router-dom";
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

import { createMaterial } from '../services/api/material';
import { getAllDepartments } from '../services/api/department';
import { createMaterialMovement } from '../services/api/material_movement';

import { Department } from '../types/strapi-entities';

const medidas = [
  "Kg", "Mts", "Cms", "Caja", "Unidad", "Paquete", "Litro", "Gramo", "Pieza", "Bolsa", "Otro"
] as const;

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  unit: z.enum(medidas),
  department: z.string().min(1, 'El departamento es requerido'),
  description: z.string().optional(),
});

function AddMaterialForm() {
  const [departments, setDepartments] = useState<Department[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      const deptResponse = await getAllDepartments();
      setDepartments(deptResponse.data); // Assuming the data is in the 'data' property
    };
    fetchDepartments();
  }, []);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      quantity: 0,
      unit: 'Kg',
      department: '',
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
  
      // Un solo request: material + movimiento de entrada
      const nuevoMaterial = await createMaterial(
        {
          name: values.name,
          quantity: values.quantity,
          unit: values.unit,
          description: values.description,
        },
        deptId,
        [
          {
            quantity: values.quantity,
            movement_type: "entry",
            movement_date: new Date(),
            department: departmentObj,
            notes: values.description,
          }
        ]
      );
  
      console.log("Creado:", nuevoMaterial);
      form.reset();
    } catch (error) {
      console.error("Error al crear material o movimiento:", error);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre del Material</Label>
      <Input id="name" {...form.register('name')} placeholder="Nombre del material" />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} placeholder="Cantidad" />

      <Label htmlFor="unit">Unidad</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        <option value="">Selecciona la unidad</option>
        {medidas.map((medida) => (
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
