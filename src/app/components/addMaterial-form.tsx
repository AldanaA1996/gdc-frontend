//form component to add materials
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';

function AddMaterialForm() {
  const [material, setMaterial] = useState({
    name: '',
    quantity: 0,
    description: ''
  });

  const formSchema = z.object({
    name: z.string().min(1, 'El nombre es obligatorio'),
    quantity: z.number().min(1, 'La cantidad debe ser mayor a 0'),
    description: z.string().optional()
  });

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: material
  });

  const onSubmit = (data) => {
    console.log('Material agregado:', data);
    // Aquí puedes agregar la lógica para enviar los datos al servidor o realizar otra acción
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre del Material</Label>
      <Input id="name" {...form.register('name')} placeholder="Nombre del material" />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input id="quantity" type="number" {...form.register('quantity')} placeholder="Cantidad" />

      <Label htmlFor="unit">Departamento</Label>
      <select id="unit" {...form.register('unit')} className="border rounded p-2">
        <option value="">Eliga el departamento al que pertenece</option>
        <option value="l">Litros</option>
        <option value="m">Metros</option>
        <option value="unidad">Unidad</option>
    </select>

      <Label htmlFor="description">Descripción</Label>
      <Input id="description" {...form.register('description')} placeholder="Descripción (opcional)" />

      <Button type="submit">Agregar Material</Button>
    </form>
  );
}

export default AddMaterialForm;