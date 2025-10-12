import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '../lib/supabaseClient';


type Department = {
  id: number;
  name: string;
};

const schema = z
  .object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(0, 'La cantidad no puede ser negativa'),
  manufactur: z.string().nullable().optional(),
  // barcode: z.number().nullable().optional(),
  // hasQrCode: z.boolean().nullable().optional(),
  description: z.string().nullable().optional(),
  // fechas en formato string (YYYY-MM-DD) para inputs type="date"
  purchase_date: z.string().nullable().optional(),
  warranty_expirationdate: z.string().nullable().optional(),
  department_id: z.number().min(1, 'El departamento es requerido'),
  })
  .superRefine((val, ctx) => {
    if (val.purchase_date && val.warranty_expirationdate) {
      // Comparación segura para formato YYYY-MM-DD (lexicográfica)
      if (val.warranty_expirationdate < val.purchase_date) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'La garantía no puede vencer antes de la fecha de compra',
          path: ['warranty_expirationdate'],
        });
      }
    }
  });

interface EditToolFormProps {
  tools: {
    id: number;
    name: string;
    quantity: number;
    manufactur?: string;
    // barcode?: number;
    // hasQrCode?: boolean;
    description?: string;
    purchase_date?: string | null;
    warranty_expirationdate?: string | null;
    department_id?: number;
  };
  onClose: () => void;
}

function EditToolForm({ tools, onClose }: EditToolFormProps) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [currentDepartmentName, setCurrentDepartmentName] = useState<string>('');

  // Cargar departamentos y obtener el nombre del departamento actual
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) {
        console.error("Error al cargar departamentos:", error);
      } else {
        const departmentsData = (data as Department[]) || [];
        setDepartments(departmentsData);

        // Si hay un department_id, encontrar el nombre correspondiente
        if (tools.department_id) {
          const currentDept = departmentsData.find(d => d.id === tools.department_id);
          setCurrentDepartmentName(currentDept?.name || `Departamento ID: ${tools.department_id}`);
        } else {
          setCurrentDepartmentName('');
        }
      }
      setDepartmentsLoading(false);
    };
    fetchDepartments();
  }, [tools.department_id]);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: tools.name,
      quantity: tools.quantity,
      manufactur: tools.manufactur,
      // barcode: tools.barcode,
      // hasQrCode: tools.hasQrCode,
      description: tools.description,
      purchase_date: tools.purchase_date ?? undefined,
      warranty_expirationdate: tools.warranty_expirationdate ?? undefined,
      department_id: tools.department_id || 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      // Crear objeto solo con los campos que han cambiado
      const changedValues: Partial<typeof values> = {};

      // Comparar cada campo con los valores originales
      if (values.name !== tools.name) changedValues.name = values.name;
      if (values.quantity !== tools.quantity) changedValues.quantity = values.quantity;
      if (values.manufactur !== tools.manufactur) changedValues.manufactur = values.manufactur;
      // if (values.barcode !== tools.barcode) changedValues.barcode = values.barcode;
      // if (values.hasQrCode !== tools.hasQrCode) changedValues.hasQrCode = values.hasQrCode;
      if (values.description !== tools.description) changedValues.description = values.description;
      if (values.purchase_date !== tools.purchase_date) changedValues.purchase_date = values.purchase_date;
      if (values.warranty_expirationdate !== tools.warranty_expirationdate) changedValues.warranty_expirationdate = values.warranty_expirationdate;
      if (values.department_id !== tools.department_id) {
        changedValues.department_id = values.department_id;
        // Mostrar el nombre del departamento en el log
        const selectedDept = departments.find(d => d.id === values.department_id);
        console.log(`Departamento cambiado de "${currentDepartmentName}" a "${selectedDept?.name || 'Ninguno'}"`);
      }

      // Convertir undefined a null para los campos que se están limpiando
      const cleanedValues = Object.fromEntries(
        Object.entries(changedValues).map(([k, v]) => [k, v === undefined ? null : v])
      );

      // Solo proceder si hay cambios
      if (Object.keys(cleanedValues).length === 0) {
        console.log('No hay cambios para guardar');
        onClose();
        return;
      }

      const { error } = await supabase
        .from('tools')
        .update(cleanedValues)
        .eq('id', tools.id);

      if (error) throw error;

      // Create activity log: tool modified
      try {
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id ?? null;
        await supabase.from('activity').insert([
          {
            activity_type: 'modified',
            name: null,
            tool: tools.id, // references tools.id
            created_by: userId,
          },
        ]);
      } catch (logErr) {
        console.warn('No se pudo registrar la actividad de modificación (tool):', logErr);
      }

      console.log('Herramienta actualizada con cambios:', cleanedValues);

      // Mostrar resumen de cambios con nombres de departamentos
      if (cleanedValues.department_id) {
        const newDept = departments.find(d => d.id === cleanedValues.department_id);
        console.log(`Departamento cambiado a: ${newDept?.name || 'Ninguno'}`);
      }
      onClose();
    } catch (err) {
      console.error('Error al actualizar la herramienta:', err);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Label htmlFor="name">Nombre de la Herramienta</Label>
      <Input id="name" {...form.register('name')} />

      <Label htmlFor="quantity">Cantidad</Label>
      <Input
        id="quantity"
        type="number"
        {...form.register('quantity', { valueAsNumber: true })}
      />

      {/* Selector de Departamento */}
      <Label htmlFor="department_id">Departamento</Label>
      <select
        id="department_id"
        {...form.register('department_id', { valueAsNumber: true })}
        className="border rounded p-2"
        disabled={departmentsLoading}
      >
        <option value={0}>
          {departmentsLoading ? 'Cargando...' : 'Seleccione un departamento'}
        </option>
        {departments.map((dept) => (
          <option key={dept.id} value={dept.id}>
            {dept.name}
          </option>
        ))}
      </select>
      {form.formState.errors.department_id && (
        <span className="text-red-500 text-sm">{form.formState.errors.department_id.message}</span>
      )}

      {/* Mostrar departamento actual si existe y no se ha modificado */}
      {currentDepartmentName && (
        <div className="text-sm text-gray-600">
          {form.formState.isDirty ?
            'Departamento seleccionado arriba' :
            `Departamento actual: ${currentDepartmentName}`
          }
        </div>
      )}

      <Label htmlFor="manufactur">Fabricante</Label>
      <Input id="manufactur" {...form.register('manufactur')} />

      {/* <Label htmlFor="barcode">Código de Barras</Label>
      <Input
        id="barcode"
        type="number"
        {...form.register('barcode', { valueAsNumber: true })}
      /> */}

      <Label htmlFor="purchase_date">Fecha de compra</Label>
      <Input
        id="purchase_date"
        type="date"
        {...form.register('purchase_date')}
      />

      <Label htmlFor="warranty_expirationdate">Vencimiento de garantía</Label>
      <Input
        id="warranty_expirationdate"
        type="date"
        {...form.register('warranty_expirationdate')}
      />

      {/* <div className="flex items-center gap-3">
      <Label>Tiene código QR</Label>
        <Controller
          name="hasQrCode"
          control={form.control}
          render={({ field }) => (
            <button
              type="button"
              role="switch"
              aria-checked={!!field.value}
              onClick={() => field.onChange(!field.value)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                field.value ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  field.value ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          )}
        />
        
      </div> */}

      <Label htmlFor="description">Descripción</Label>
      <Input id="description" {...form.register('description')} />


      <Button type="submit">Guardar Cambios</Button>
    </form>
  );
}

export default EditToolForm;
