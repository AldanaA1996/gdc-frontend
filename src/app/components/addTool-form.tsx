import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  Wrench, 
  Building2, 
  Calendar, 
  Shield, 
  FileText, 
  AlertCircle,
  PackagePlus,
  Drill,
  Barcode,
  Scan,
  X
} from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { supabase } from '../lib/supabaseClient';
import { useAuthenticationStore } from '../store/authentication';
import { toast } from 'sonner';
import BarcodeScanner from '@/app/components/scanner';

const schema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  quantity: z.number().min(1, 'La cantidad es requerida'),
  buyDate: z.preprocess(
    (arg) => (typeof arg === 'string' ? new Date(arg) : arg),
    z.date()
  ),
  warranty: z.preprocess(
    (arg) => (typeof arg === 'string' ?  new Date(arg) : arg),
    z.date().optional()
  ),
  department_id: z.number().min(1, 'El departamento es requerido'),
  description: z.string().optional(),
  barcode: z.string().optional()
});

type Tool = {
  id: number;
  name: string;
  quantity:  number;
  purchase_date?:  string;
  warranty_expirationdate?: string;
  department_id?:  number;
  description?: string;
  barcode?: string;
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
  const [showScanner, setShowScanner] = useState(false); // 🔥 Estado para el modal
  const user = useAuthenticationStore((state) => state.user);

  const getUser = async (): Promise<number | null> => {
    if (!user?. id) return null;

    const { data:  dbUser, error } = await supabase
      .from("user")
      .select("id")
      .eq("userAuth", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error buscando user. id:", error);
      toast.error("Error buscando usuario en la base");
      return null;
    }

    if (!dbUser) {
      toast.error("El usuario logueado no está vinculado en la tabla user");
      return null;
    }

    return dbUser. id;
  };

  // Cargar herramientas existentes
  useEffect(() => {
    const fetchTools = async () => {
      setToolsLoading(true);
      const { data, error } = await supabase
        .from('tools')
        .select('id, name, quantity, purchase_date, warranty_expirationdate, department_id, description, barcode');

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

  type AddToolFormValues = z. infer<typeof schema>;
  const form = useForm<AddToolFormValues>({
    resolver:  zodResolver(schema) as any,
    defaultValues: {
      name: '',
      quantity:  1,
      buyDate:  new Date(),
      warranty: new Date(),
      department_id:  0,
      description: '',
      barcode: '',
    },
  });

  const insertTool = async (values: AddToolFormValues) => {
    setIsInserting(true);
    try {
      const { data:  toolData, error: toolError } = await supabase
        .from('tools')
        .insert([
          {
            name: values. name. trim(),
            quantity: values. quantity,
            purchase_date:  values.buyDate.toISOString(),
            warranty_expirationdate: values.warranty?.toISOString(),
            department_id: values.department_id,
            description: values.description && values.description.trim() !== ""
              ? values.description. trim()
              : null,
            barcode: values.barcode?. trim() || null,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (toolError) throw toolError;

      const dbUserId = await getUser();
      if (!dbUserId) return;

      const horaActual = new Date().toLocaleTimeString("en-GB");
      await supabase. from("activity").insert([
        {
          tool: toolData. id,
          activity_type: 'new',
          quantity: values.quantity,
          created_by: user?.id,
          created_at: horaActual,
          created_date: new Date().toISOString(),
        },
      ]);

      const { data: updatedTools } = await supabase
        . from('tools')
        .select('id, name, quantity, purchase_date, warranty_expirationdate, department_id, description, barcode');

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
      if (! values.department_id || values.department_id === 0) {
        toast.error("Debe seleccionar un departamento");
        return;
      }

      const normalizedName = normalizedText(values.name);

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

      await insertTool(values);
    } catch (err) {
      console.error("Error en onSubmit:", err);
      toast.error("Error en el formulario");
    }
  };

  // 🔥 Manejar código detectado
  const handleBarcodeDetected = (code: { rawValue: string }) => {
    console.log('Código detectado:', code.rawValue);
    form.setValue('barcode', code. rawValue, { shouldDirty: true, shouldValidate: true });
    setShowScanner(false);
    toast.success(`Código escaneado: ${code.rawValue}`);
  };

  return (
    <div className="px-4 pb-4 md:pb-6 overflow-y-auto max-h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Drill className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-800">Agregar Herramienta</h2>
        </div>
        <p className="text-xs text-gray-600">
          Complete los datos de la nueva herramienta para agregarla al inventario
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {/* Nombre de la Herramienta */}
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Wrench className="h-3.5 w-3.5" />
            Nombre de la Herramienta *
          </Label>
          <Input
            id="name"
            {...form.register("name")}
            placeholder="Ingrese el nombre de la herramienta"
            className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
          {form.formState.errors.name && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{form.formState.errors.name.message}</span>
            </div>
          )}
        </div>

        {/* Código de Barras */}
        <div className="space-y-1.5">
          <Label htmlFor="barcode" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Barcode className="h-3.5 w-3.5" />
            Código de Barras (opcional)
          </Label>
          <div className="flex gap-2">
            <Input
              id="barcode"
              {...form.register('barcode')}
              placeholder="Ingrese o escanee el código"
              className="flex-1 border-gray-300 focus: border-blue-500 focus: ring-2 focus:ring-blue-200 transition-all"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setShowScanner(true)}
              className="flex-shrink-0"
            >
              <Scan className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Departamento */}
        <div className="space-y-1.5">
          <Label htmlFor="department_id" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Departamento *
          </Label>
          <select
            id="department_id"
            {...form.register("department_id", { valueAsNumber: true })}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            disabled={departmentsLoading}
          >
            <option value={0}>
              {departmentsLoading ? "Cargando..." : "Seleccione un departamento"}
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept. name}
              </option>
            ))}
          </select>
          {form.formState. errors.department_id && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{form.formState. errors.department_id.message}</span>
            </div>
          )}
        </div>

        {/* Cantidad y Fecha de Compra */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5" />
              Cantidad *
            </Label>
            <Input
              id="quantity"
              type="number"
              {...form. register("quantity", { valueAsNumber: true })}
              placeholder="Cantidad"
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            {form.formState.errors.quantity && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{form.formState.errors.quantity.message}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="buyDate" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Fecha de Compra *
            </Label>
            <Input
              id="buyDate"
              type="date"
              {...form. register("buyDate")}
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            {form.formState. errors.buyDate && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{form.formState.errors.buyDate.message}</span>
              </div>
            )}
          </div>
        </div>

        {/* Garantía */}
        <div className="space-y-1.5">
          <Label htmlFor="warranty" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            Fecha Vencimiento de la Garantía (opcional)
          </Label>
          <Input
            id="warranty"
            type="date"
            {...form.register("warranty")}
            className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          />
          {form.formState.errors. warranty && (
            <div className="flex items-center gap-1.5 text-red-600 text-xs">
              <AlertCircle className="h-3.5 w-3.5" />
              <span>{form.formState.errors.warranty. message}</span>
            </div>
          )}
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            Descripción (opcional)
          </Label>
          <Input
            id="description"
            {...form.register("description")}
            placeholder="Detalles adicionales de la herramienta"
            className="border-gray-300 focus:border-blue-500 focus:ring-2 focus: ring-blue-200 transition-all"
          />
        </div>

        {/* Botón submit */}
        <div className="md:pt-4 bg-white pt-4 pb-2 md:px-0 border-t md:border-t-0 border-gray-200 md:shadow-none shadow-lg">
          <Button
            type="submit"
            disabled={toolsLoading || departmentsLoading || isInserting}
            className="w-full py-5 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            {toolsLoading || departmentsLoading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Cargando datos...
              </span>
            ) : isInserting ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Guardando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <PackagePlus className="h-5 w-5" />
                Agregar Herramienta
              </span>
            )}
          </Button>
        </div>

        <div className="h-20 md:hidden"></div>
      </form>

      {/* 🔥 Modal del escáner */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Escanear Código de Barras</DialogTitle>
          </DialogHeader>
          <BarcodeScanner
            onDetected={handleBarcodeDetected}
            onClose={() => setShowScanner(false)}
            autoStart={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AddToolForm;