"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
  quantity: number;
  unit: string | null;
  min_quantity?: number | null;
  manufactur?: string | null;
  barcode?: string | null;
  department_id?: number | null;
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
      name: "",
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
    if (!userAuth?.id) return null;

    const { data: dbUser, error } = await supabase
      .from("user")
      .select("id")
      .eq("userAuth", userAuth.id) // authUser.id = UUID de Auth
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

  const insertMaterial = async (values: z.infer<typeof schema>) => {
    setIsInserting(true);
    try {
      const unitValue = values.unit && values.unit !== "Select" ? values.unit : null;

      // Insertar material
      const { data: inserted, error: insErr } = await supabase
        .from("inventory")
        .insert([
          {
            name: values.name.trim(),
            quantity: values.quantity,
            unit: unitValue,
            description: values.description && values.description.trim() !== "" 
              ? values.description.trim() 
              : null,
            manufactur: values.manufactur && values.manufactur.trim() !== "" 
              ? values.manufactur.trim() 
              : null,
            min_quantity: values.min_quantity ?? null,
            max_quantity: values.max_quantity ?? null,
            barcode: values.barcode && values.barcode.trim() !== "" 
              ? values.barcode.trim() 
              : null,
            department_id: values.department_id,
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (insErr) throw insErr;

      const dbUserId = await getUser();
      if (!dbUserId) return;
      

      // Registrar actividad
      const horaActual = new Date().toLocaleTimeString("en-GB");
      await supabase.from("activity").insert([
          {
            material: (inserted as any)?.id,
            activity_type: "new",
            user_creator: dbUserId,
            created_by: userAuth.id,
            created_at: horaActual,
            created_date: new Date().toISOString(),
            quantity: values.quantity,
          },
        ]);
      
      // Refrescar cache local
      const { data: mats } = await supabase
        .from("inventory")
        .select("id,name,quantity,unit,min_quantity,manufactur,barcode,department_id");
      
      setMaterials((mats as Material[]) || []);

      form.reset();
      toast.success("Material creado correctamente");
    } catch (err: any) {
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
      // Validar departamento
      if (!values.department_id || values.department_id === 0) {
        toast.error("Debe seleccionar un departamento");
        return;
      }

      const normalizedName = normalizedText(values.name);
      const normalizedManufactur = normalizedText(values.manufactur);

      // Duplicado exacto (nombre + marca)
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

      // Caso: solo se ingresó el nombre
      const onlyNameEntered =
        normalizedName &&
        (!values.manufactur || values.manufactur.trim() === "") &&
        (!values.description || values.description.trim() === "") &&
        (!values.barcode || values.barcode.trim() === "") &&
        (!values.min_quantity && values.min_quantity !== 0) &&
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

      // Insertar directo
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 w-full h-full md:w-[90%]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="font-semibold">
            Nombre del Material *
          </Label>
          <Input 
            id="name" 
            {...form.register("name")} 
            placeholder="Ingrese el nombre del material" 
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
            <Label htmlFor="unit" className="font-semibold">
              Unidad *
            </Label>
            <select id="unit" {...form.register("unit")} className="border rounded p-2">
              {Medidas.map((medida) => (
                <option key={medida} value={medida}>
                  {medida}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="min_quantity" className="font-semibold">
              Stock Mínimo (opcional)
            </Label>
            <Input
              id="min_quantity"
              type="number"
              step="1"
              min="0"
              {...form.register("min_quantity", {
                setValueAs: (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
              })}
              placeholder="Ej: 5"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="max_quantity" className="font-semibold">
              Stock Máximo (opcional)
            </Label>
            <Input
              id="max_quantity"
              type="number"
              step="1"
              min="0"
              {...form.register("max_quantity", {
                setValueAs: (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
              })}
              placeholder="Ej: 10"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="manufactur" className="font-semibold">
            Marca (opcional)
          </Label>
          <Input id="manufactur" {...form.register("manufactur")} placeholder="Marca" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="barcode" className="font-semibold">
            Código de Barras (opcional)
          </Label>
          <Input id="barcode" {...form.register("barcode")} placeholder="Escanéalo o escríbelo" />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="description" className="font-semibold">
            Descripción (opcional)
          </Label>
          <Input id="description" {...form.register("description")} placeholder="Descripción" />
        </div>

        <Button 
          type="submit" 
          disabled={materialsLoading || departmentsLoading || isInserting}
          className="mt-4"
        >
          {materialsLoading || departmentsLoading 
            ? "Cargando..." 
            : isInserting 
            ? "Guardando..." 
            : "Agregar Material"}
        </Button>
      </form>

      {/* Modal de confirmación */}
      <Dialog open={confirmModalOpen} onOpenChange={setConfirmModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar carga de material</DialogTitle>
            <DialogDescription>
              Se encontró al menos un material con el mismo nombre. Revisa los registros existentes antes de confirmar.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2 max-h-40 overflow-auto">
            {matchedMaterials.map((m) => (
              <div key={m.id} className="p-3 border rounded">
                <div className="font-semibold">{m.name}</div>
                <div className="text-sm">Marca: {m.manufactur || "--"}</div>
                <div className="text-sm">Unidad: {m.unit || "--"} • Cant: {m.quantity}</div>
                <div className="text-sm">ID: {m.id}</div>
              </div>
            ))}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleCancel} disabled={isInserting}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmInsert} disabled={isInserting}>
              {isInserting ? "Guardando..." : "Confirmar y Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}