import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { createMaterial } from '../services/api/material'; 
import { getAllDepartments } from '../services/api/department';
import { createMaterialMovement } from '../services/api/material_movement';
import { Department } from '../types/strapi-entities'; 

function AddMaterialForm() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [material, setMaterial] = useState({
    name: '',
    quantity: 0,
    description: '',
    department: '',  // Nuevo campo para departamento
    unit: '',  // Nuevo campo para unidad de medida
  });

  const formSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    quantity: z.number()
      .min(1, 'La cantidad debe ser mayor a 0')
      .refine((val) => val > 0, { message: 'La cantidad debe ser mayor a 0' }),
    // quantity: z.string()
    //            .transform((val) => Number(val))
    //            .refine((val) => val > 0, { message: 'La cantidad debe ser mayor a 0' }),
    description: z.string().optional(),
    department: z.string().min(1, 'Debes seleccionar un departamento'),  // Validación para el departamento
    unit: z.string().min(1, 'Debes seleccionar una unidad de medida'),
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: material,
  });

  // Cargar departamentos al inicio
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const result = await getAllDepartments();
        setDepartments(result.data);
      } catch (error) {
        console.error('Error al cargar departamentos:', error);
      } finally {
        setIsLoading(false);
           
      }
    };
    fetchDepartments();
  }, []);

  const onSubmit = async (data: any) => {
   
    const newMaterial = {
      name: data.name,
      quantity: data.quantity,
      description: data.description,
      department: data.department,  // Obtener el departamento del formulario
      unit: data.unit,  // Obtener la unidad de medida del formulario
    };

    try {
      const res = await createMaterial(newMaterial);  // Enviar el material a la API para ser guardado
      const materialId = res.data.id;  // Obtener el ID del material creado
      console.log('Material agregado con éxito:', data);

      await createMaterialMovement({
        quantity: data.quantity,
        movement_type: 'entry',
        movement_date: new Date(),  // Usar la fecha actual
        notes: 'Ingreso inicial',
        material: materialId,// Usar el ID del material creado
        department: data.department,  // Usar el departamento seleccionado
      });
      console.log('Movimiento de material creado con éxito:', data);
    } catch (error) {
      console.error("Error al agregar material:", error);
    }


  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre del Material</Label>
      <Input id="name" {...form.register('name')} placeholder="Nombre del material" />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity', { valueAsNumber: true })} placeholder="Cantidad" />

      <Label htmlFor="unit">Tipo</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        <option value="">Selecciona la unidad de medida</option>
        <option value="Cms">Cms</option>
        <option value="Mts">Metros</option>
        <option value="Kg">Kilos</option>
        <option value="Caja">Cajas</option>
      </select>
      <Label htmlFor="department">Departamento</Label>
      <select
        id="department"
        {...form.register('department')}
        className="border rounded p-2"
      >
        <option value="">Elige el departamento</option>
        {departments.map((department) => (
          <option key={department.id} value={department.id}>
            {department.name}
          </option>
        ))}
      </select>

      <Label htmlFor="description">Descripción</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción (opcional)" />

      <Button type="submit">Agregar Material</Button>
    </form>
  );
}

export default AddMaterialForm;
