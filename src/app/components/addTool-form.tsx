import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { supabase } from '../lib/supabaseClient';
import { useAuthenticationStore } from '../store/authentication';
import { toast } from 'sonner';


const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  buyDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date()
  ),
  warranty: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date().optional()
  ),
  department_id: z.number().min(1, 'El departamento es requerido'),
  description: z.string().optional()
});

type Tool = {
  id: number;
  name: string;
  quantity: number;
  purchase_date?: string;
  warranty_expirationdate?: string;
  department_id?: number;
  description?: string;
};

type Department = {
  id: number;
  name: string;
};

function normalizedText(text: string | null | undefined) {
  if (!text) return null;
  return text
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function AddToolForm() {
  const [tools, setTools] = useState<Tool[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [isInserting, setIsInserting] = useState(false);
  const user = useAuthenticationStore((state) => state.user);

  const getUser = async (): Promise<number | null> => {
    if (!user?.id) return null;

    const { data: dbUser, error } = await supabase
      .from("user")
      .select("id")
      .eq("userAuth", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error buscando user.id:", error);
      toast.error("Error buscando usuario en la base");
      return null;
    }

    if (!dbUser) {
      toast.error("El usuario logueado no está vinculado en la tabla user");
      return null;
    }

    return dbUser.id;
  };


  // Cargar herramientas existentes
  useEffect(() => {
    const fetchTools = async () => {
      setToolsLoading(true);
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, quantity, purchase_date, warranty_expirationdate, department_id, description');

      if (error) {
        console.error("Error al cargar herramientas:", error);
        toast.error("Error al cargar herramientas");
      } else {
        setTools((data as Tool[]) || []);
      }
      setToolsLoading(false);
    };
    fetchTools();
  }, []);

  // Cargar departamentos
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      if (error) {
        console.error("Error al cargar departamentos:", error);
        toast.error("Error al cargar departamentos");
      } else {
        setDepartments((data as Department[]) || []);
      }
      setDepartmentsLoading(false);
    };
    fetchDepartments();
  }, []);

  type AddToolFormValues = z.infer<typeof schema>;
  const form = useForm<AddToolFormValues>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      name: '',
      quantity: 1,
      buyDate: new Date(),
      warranty: new Date(),
      department_id: 0,
      description: '',
    },
  });

  const insertTool = async (values: AddToolFormValues) => {
    setIsInserting(true);
    try {
      // Insertar herramienta
      const { data: toolData, error: toolError } = await supabase
        .from('tools')
        .insert([
          {
            name: values.name.trim(),
            quantity: values.quantity,
            purchase_date: values.buyDate.toISOString(),
            warranty_expirationdate: values.warranty?.toISOString(),
            department_id: values.department_id,
            description: values.description && values.description.trim() !== ""
              ? values.description.trim()
              : null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (toolError) throw toolError;

      const dbUserId = await getUser();
      if (!dbUserId) return;

      // Registrar actividad
      const horaActual = new Date().toLocaleTimeString("en-GB");
      await supabase.from("activity").insert([
        {
          tool: toolData.id,
          activity_type: 'new',
          quantity: values.quantity,
          created_by: user?.id,
          created_at: horaActual,
          created_date: new Date().toISOString(),
        },
      ]);

      // Refrescar cache local
      const { data: updatedTools } = await supabase
        .from('tools')
        .select('id, name, quantity, purchase_date, warranty_expirationdate, department_id, description');

      setTools((updatedTools as Tool[]) || []);

      form.reset();
      toast.success("Herramienta creada correctamente");
    } catch (err: any) {
      console.error("ERROR AL INTENTAR CREAR:", err);
      toast.error(err.message || "Error al crear la herramienta");
    } finally {
      setIsInserting(false);
    }
  };

  const onSubmit = async (values: AddToolFormValues) => {
    try {
      // Validar departamento
      if (!values.department_id || values.department_id === 0) {
        toast.error("Debe seleccionar un departamento");
        return;
      }

      const normalizedName = normalizedText(values.name);

      // Buscar duplicados exactos (nombre)
      const duplicate = tools.find((t) => {
        const tName = normalizedText(t.name || "");
        return tName === normalizedName;
      });

      if (duplicate) {
        toast.warning("No se puede cargar la herramienta", {
          description: "Ya existe una herramienta con el mismo nombre.",
        });
        return;
      }

      // Insertar directo
      await insertTool(values);
    } catch (err) {
      console.error("Error en onSubmit:", err);
      toast.error("Error en el formulario");
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name" className="font-semibold">
          Nombre de la Herramienta *
        </Label>
        <Input
          id="name"
          {...form.register("name")}
          placeholder="Ingrese el nombre de la herramienta"
        />
        {form.formState.errors.name && (
          <span className="text-red-500 text-sm">{form.formState.errors.name.message}</span>
        )}
      </div>

      {/* Selector de Departamento */}
      <div className="flex flex-col gap-2">
        <Label htmlFor="department_id" className="font-semibold">
          Departamento *
        </Label>
        <select
          id="department_id"
          {...form.register("department_id", { valueAsNumber: true })}
          className="border rounded p-2"
          disabled={departmentsLoading}
        >
          <option value={0}>
            {departmentsLoading ? "Cargando..." : "Seleccione un departamento"}
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="quantity" className="font-semibold">
            Cantidad *
          </Label>
          <Input
            id="quantity"
            type="number"
            {...form.register("quantity", { valueAsNumber: true })}
            placeholder="Cantidad"
          />
          {form.formState.errors.quantity && (
            <span className="text-red-500 text-sm">{form.formState.errors.quantity.message}</span>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="buyDate" className="font-semibold">
            Fecha de Compra *
          </Label>
          <Input
            id="buyDate"
            type="date"
            {...form.register("buyDate")}
          />
          {form.formState.errors.buyDate && (
            <span className="text-red-500 text-sm">{form.formState.errors.buyDate.message}</span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="warranty" className="font-semibold">
          Fecha Vencimiento de la Garantía (opcional)
        </Label>
        <Input
          id="warranty"
          type="date"
          {...form.register("warranty")}
        />
        {form.formState.errors.warranty && (
          <span className="text-red-500 text-sm">{form.formState.errors.warranty.message}</span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description" className="font-semibold">
          Descripción (opcional)
        </Label>
        <Input id="description" {...form.register("description")} placeholder="Descripción" />
      </div>

      <Button
        type="submit"
        disabled={toolsLoading || departmentsLoading || isInserting}
        className="mt-4"
      >
        {toolsLoading || departmentsLoading
          ? "Cargando..."
          : isInserting
          ? "Guardando..."
          : "Agregar Herramienta"}
      </Button>
    </form>
  );
}

export default AddToolForm;
