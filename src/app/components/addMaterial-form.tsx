"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Package, 
  Tag, 
  Ruler, 
  FileText, 
  Barcode, 
  Building2,
  AlertCircle,
  PackagePlus,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Badge } from "@/app/components/ui/badge";
import { useAuthenticationStore } from "../store/authentication";
import { supabase } from "../lib/supabaseClient";
import { toast } from "sonner";

const Medidas = [
  "Select",
  "Kg",
  "Mts",
  "Cms",
  "Cajas",
  "Unidades",
  "Paquetes",
  "Litros",
  "Gramos",
  "Piezas",
  "Bolsas",
  "Otros",
] as const;

const schema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  quantity: z.number().min(1, "La cantidad es requerida"),
  unit: z.enum(Medidas),
  description: z.string().optional(),
  manufactur: z.string().optional(),
  min_quantity: z.number().min(0).optional(),
  max_quantity: z.number().min(0).optional(),
  barcode: z.string().optional(),
  department_id: z.number().min(1, "Debe seleccionar un departamento"),
});

type Material = {
  id: number;
  name: string;
  quantity:  number;
  unit: string | null;
  min_quantity?:  number | null;
  manufactur?: string | null;
  barcode?: string | null;
  department_id?:  number | null;
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

export default function AddMaterialForm() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [materialsLoading, setMaterialsLoading] = useState(true);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<z.infer<typeof schema> | null>(null);
  const [matchedMaterials, setMatchedMaterials] = useState<Material[]>([]);
  const [isInserting, setIsInserting] = useState(false);

  const userAuth = useAuthenticationStore((state) => state.user);

  // Cargar inventario
  useEffect(() => {
    const fetchInventory = async () => {
      setMaterialsLoading(true);
      const { data, error } = await supabase
        .from("inventory")
        .select("id,name,quantity,unit,min_quantity,manufactur,barcode,department_id");
      
      if (error) {
        console.error("Error al cargar inventario:", error);
        toast.error("Error al cargar inventario");
      } else {
        setMaterials((data as Material[]) || []);
      }
      setMaterialsLoading(false);
    };
    fetchInventory();
  }, []);

  // Cargar departamentos
  useEffect(() => {
    const fetchDepartments = async () => {
      setDepartmentsLoading(true);
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");
      
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

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name:  "",
      quantity: 1,
      unit: "Select",
      description: "",
      manufactur: "",
      min_quantity: undefined,
      max_quantity: undefined,
      barcode: "",
      department_id: 0,
    },
  });

  const getUser = async (): Promise<number | null> => {
    if (!userAuth?. id) return null;

    const { data:  dbUser, error } = await supabase
      .from("user")
      .select("id")
      .eq("userAuth", userAuth.id)
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

    return dbUser.id;
  };

  const insertMaterial = async (values: z.infer<typeof schema>) => {
    setIsInserting(true);
    try {
      const unitValue = values.unit && values.unit !== "Select" ? values.unit :  null;

      const { data:  inserted, error:  insErr } = await supabase
        .from("inventory")
        .insert([
          {
            name: values.name. trim(),
            quantity: values. quantity,
            unit: unitValue,
            description: values.description && values.description.trim() !== "" 
              ? values.description.trim() 
              : null,
            manufactur: values.manufactur && values.manufactur.trim() !== "" 
              ? values.manufactur.trim() 
              : null,
            min_quantity:  values.min_quantity ??  null,
            max_quantity:  values.max_quantity ?? null,
            barcode: values.barcode && values.barcode.trim() !== "" 
              ? values.barcode. trim() 
              : null,
            department_id: values. department_id,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insErr) throw insErr;

      const dbUserId = await getUser();
      if (!dbUserId) return;

      const horaActual = new Date().toLocaleTimeString("en-GB");
      await supabase. from("activity").insert([
        {
          material:  (inserted as any)?.id,
          activity_type: "new",
          user_creator: dbUserId,
          created_by: userAuth.id,
          created_at: horaActual,
          created_date: new Date().toISOString(),
          quantity: values.quantity,
        },
      ]);

      const { data: mats } = await supabase
        . from("inventory")
        .select("id,name,quantity,unit,min_quantity,manufactur,barcode,department_id");
      
      setMaterials((mats as Material[]) || []);

      form.reset();
      toast.success("Material creado correctamente");
    } catch (err:  any) {
      console.error("ERROR AL INTENTAR CREAR:", err);
      toast.error(err.message || "Error al crear el material");
    } finally {
      setIsInserting(false);
      setConfirmModalOpen(false);
      setPendingValues(null);
      setMatchedMaterials([]);
    }
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    try {
      if (! values.department_id || values.department_id === 0) {
        toast.error("Debe seleccionar un departamento");
        return;
      }

      const normalizedName = normalizedText(values.name);
      const normalizedManufactur = normalizedText(values.manufactur);

      const duplicate = materials.find((m) => {
        const mName = normalizedText(m.name || "");
        const mManufactur = normalizedText(m.manufactur || "");
        return mName === normalizedName && mManufactur === normalizedManufactur;
      });

      if (duplicate) {
        toast.warning("No se puede cargar el material", {
          description: "Ya existe un material con el mismo nombre y la misma marca.",
        });
        return;
      }

      const onlyNameEntered =
        normalizedName &&
        (! values.manufactur || values.manufactur. trim() === "") &&
        (!values.description || values.description.trim() === "") &&
        (!values.barcode || values.barcode.trim() === "") &&
        (! values.min_quantity && values.min_quantity !== 0) &&
        (!values.max_quantity && values.max_quantity !== 0);

      if (onlyNameEntered) {
        const sameNameMaterials = materials.filter(
          (m) => normalizedText(m.name || "") === normalizedName
        );

        if (sameNameMaterials.length > 0) {
          setMatchedMaterials(sameNameMaterials);
          setPendingValues(values);
          setConfirmModalOpen(true);
          return;
        }
      }

      await insertMaterial(values);
    } catch (err) {
      console.error("Error en onSubmit:", err);
      toast.error("Error en el formulario");
    }
  };

  const handleConfirmInsert = async () => {
    if (!pendingValues) return;
    await insertMaterial(pendingValues);
  };

  const handleCancel = () => {
    setConfirmModalOpen(false);
    setPendingValues(null);
    setMatchedMaterials([]);
    toast("Cancelado");
  };

  return (
    <>
    
      <div className=" pt-2 pb-24 ">
       
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <PackagePlus className="h-6 w-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Agregar Material</h2>
          </div>
          <p className="text-sm text-gray-600">
            Complete los datos para añadir <span className="font-bold">un nuevo</span> material al inventario
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          
          <div className="space-y-1. 5">
            <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center gap-1. 5">
              <Package className="h-3. 5 w-3.5" />
              Nombre del Material *
            </Label>
            <Input 
              id="name" 
              {... form.register("name")} 
              placeholder="Ingrese el nombre del material"
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            {form.formState.errors.name && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{form.formState. errors.name.message}</span>
              </div>
            )}
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
                  {dept.name}
                </option>
              ))}
            </select>
            {form.formState.errors.department_id && (
              <div className="flex items-center gap-1.5 text-red-600 text-xs">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>{form.formState.errors.department_id. message}</span>
              </div>
            )}
          </div>

          {/* Cantidad y Unidad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Package className="h-3.5 w-3.5" />
                Cantidad *
              </Label>
              <Input 
                id="quantity" 
                type="number" 
                {... form.register("quantity", { valueAsNumber: true })} 
                placeholder="Cantidad"
                className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              />
              {form.formState. errors.quantity && (
                <div className="flex items-center gap-1.5 text-red-600 text-xs">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{form.formState. errors.quantity.message}</span>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
                <Ruler className="h-3.5 w-3.5" />
                Unidad *
              </Label>
              <select 
                id="unit" 
                {...form.register("unit")} 
                className="w-full border border-gray-300 rounded-md p-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              >
                {Medidas.map((medida) => (
                  <option key={medida} value={medida}>
                    {medida}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Mínimo y Máximo */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-3">
            <h3 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-3.5 w-3.5 text-amber-600" />
              Control de Stock (opcional)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="min_quantity" className="text-xs font-medium text-gray-600">
                  Stock Mínimo
                </Label>
                <Input
                  id="min_quantity"
                  type="number"
                  step="1"
                  min="0"
                  {...form.register("min_quantity", {
                    setValueAs: (v) => (v === "" || v === null || v === undefined ?  undefined : Number(v)),
                  })}
                  placeholder="Ej: 5"
                  className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="max_quantity" className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Stock Máximo
                </Label>
                <Input
                  id="max_quantity"
                  type="number"
                  step="1"
                  min="0"
                  {...form.register("max_quantity", {
                    setValueAs: (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
                  })}
                  placeholder="Ej:  100"
                  className="bg-white border-amber-200 focus:border-amber-400 focus:ring-2 focus:ring-amber-200 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Marca */}
          <div className="space-y-1.5">
            <Label htmlFor="manufactur" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Marca (opcional)
            </Label>
            <Input 
              id="manufactur" 
              {...form.register("manufactur")} 
              placeholder="Ej:  Sony, Samsung, etc."
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          {/* Código de Barras */}
          <div className="space-y-1.5">
            <Label htmlFor="barcode" className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Barcode className="h-3.5 w-3.5" />
              Código de Barras (opcional)
            </Label>
            <Input 
              id="barcode" 
              {...form.register("barcode")} 
              placeholder="Escanéalo o escríbelo"
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-mono"
            />
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
              placeholder="Detalles adicionales del material"
              className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
          </div>

          
          <div className="md:relative md:pt-4 bottom-0 left-0 right-0 bg-white pt-4 pb-2 -mx-4 px-4 ">
            <Button 
              type="submit" 
              disabled={materialsLoading || departmentsLoading || isInserting}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {materialsLoading || departmentsLoading ?  (
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
                  Agregar Material
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* Modal de confirmación */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              Confirmar carga de material
            </DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Se encontraron materiales con el mismo nombre.  Revisa los registros existentes antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-3 space-y-2 max-h-72 overflow-auto pr-2">
            {matchedMaterials.map((m) => (
              <div key={m.id} className="p-3 border-2 border-amber-200 bg-amber-50 rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <p className="font-bold text-gray-800">{m.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Tag className="h-3 w-3" />
                      <span>Marca: {m.manufactur || "Sin especificar"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {m. quantity} {m.unit || "unidades"}
                      </Badge>
                      <span className="text-xs text-gray-500">ID: {m.id}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={handleCancel} 
              disabled={isInserting}
              className="border-gray-300 hover:bg-gray-100"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleConfirmInsert} 
              disabled={isInserting}
              className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
            >
              {isInserting ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </span>
              ) : (
                "Confirmar y Guardar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}