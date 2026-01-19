"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { PlusIcon, EditIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function Volunteers() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [volunteerNumber, setVolunteerNumber] = useState("");
  const [congregation, setCongregation] = useState("");

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    const { data, error } = await supabase
      .from("volunteers")
      .select("id, name, volunteer_number, congregation")
      .order("id", { ascending: true });

    if (error) {
      console.error("Error al obtener voluntarios:", error);
      toast.error("Error al cargar voluntarios");
      return;
    }
    setVolunteers(data || []);
  };

  const performDeleteVolunteer = async (id: number) => {
    const { error } = await supabase
      .from("volunteers")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error al eliminar voluntario:", error);
      toast.error("No se pudo eliminar el voluntario");
      return;
    }

    setVolunteers((prev) => prev.filter((v) => v.id !== id));
    toast.success("Voluntario eliminado correctamente");
  };

  const handleDeleteVolunteer = (id: number) => {
    toast.warning("Confirmar eliminación", {
      description: "Esta acción no se puede deshacer.",
      action: {
        label: "Eliminar",
        onClick: () => performDeleteVolunteer(id),
      },
      cancel: {
        label: "Cancelar",
        onClick: () => {},
      },
    });
  };

  const handleEditVolunteer = (volunteer: any) => {
    setEditingVolunteer(volunteer);
    setName(volunteer.name || "");
    setVolunteerNumber(volunteer.volunteer_number || "");
    setCongregation(volunteer.congregation || "");
    setEditOpen(true);
  };

  const handleAddVolunteer = async () => {
    if (!name.trim() || !volunteerNumber.trim()) {
      toast.error("Completá todos los campos obligatorios");
      return;
    }

    const { data, error } = await supabase
      . from("volunteers")
      .insert([
        {
          name: name. trim(),
          congregation: congregation.trim() || null,
          volunteer_number: volunteerNumber.trim(),
        },
      ])
      .select("id, name, volunteer_number, congregation");

    if (error) {
      console.error("Error al agregar voluntario:", error);
      toast.error("No se pudo agregar el voluntario");
      return;
    }

    if (data && data.length > 0) {
      setVolunteers((prev) => [...prev, ...data]);
      toast.success("Voluntario agregado correctamente");
    }

    setName("");
    setVolunteerNumber("");
    setCongregation("");
    setOpen(false);
  };

 const handleUpdateVolunteer = async () => {
  if (!editingVolunteer) {
    toast.error("No hay voluntario seleccionado");
    return;
  }

  if (!name.trim() || !volunteerNumber.trim()) {
    toast.error("Completá todos los campos obligatorios");
    return;
  }

  console.log('🔍 === DIAGNÓSTICO COMPLETO ===');
  console.log('📌 ID del voluntario:', editingVolunteer.id);
  console.log('📌 Tipo de ID:', typeof editingVolunteer. id);
  
  const updateData = {
    name: name.trim(),
    congregation: congregation.trim() || null,
    volunteer_number: volunteerNumber. trim(),
  };
  
  console.log('📦 Datos a actualizar:', updateData);
  console.log('📦 Datos originales:', {
    name: editingVolunteer.name,
    congregation: editingVolunteer.congregation,
    volunteer_number: editingVolunteer. volunteer_number,
  });

  // 🔥 Verificar primero si el registro existe
  const { data:  existingData, error: existingError } = await supabase
    .from("volunteers")
    .select("*")
    .eq("id", editingVolunteer.id)
    .single();

  console.log('🔍 Registro antes del update:', existingData);
  console.log('🔍 Error al buscar:', existingError);

  if (existingError || !existingData) {
    console.error('❌ No se encontró el registro');
    toast.error("No se encontró el voluntario en la base de datos");
    return;
  }

  // 🔥 Intentar el update
  const { data, error, status, statusText } = await supabase
    .from("volunteers")
    .update(updateData)
    .eq("id", editingVolunteer.id);

  console.log('📊 Respuesta del UPDATE: ');
  console.log('  - data:', data);
  console.log('  - error:', error);
  console.log('  - status:', status);
  console.log('  - statusText:', statusText);

  if (error) {
    console.error("❌ Error al actualizar:", error);
    toast.error(`Error: ${error.message}`);
    return;
  }

  // 🔥 Verificar después del update
  const { data: afterUpdateData, error: afterError } = await supabase
    .from("volunteers")
    .select("*")
    .eq("id", editingVolunteer.id)
    .single();

  console.log('🔍 Registro DESPUÉS del update:', afterUpdateData);
  console.log('🔍 Error después:', afterError);

  // Comparar si realmente cambió
  const changed = JSON.stringify(existingData) !== JSON.stringify(afterUpdateData);
  console.log('🔄 ¿Se modificó el registro?', changed);

  // Recargar lista
  await fetchVolunteers();

  if (changed) {
    toast.success("Voluntario actualizado correctamente");
  } else {
    toast.info("No hubo cambios en los datos");
  }

  setName("");
  setVolunteerNumber("");
  setCongregation("");
  setEditingVolunteer(null);
  setEditOpen(false);
};
  return (
    <div className="px-2 mx-4 flex flex-col max-w-5xl min-h-[100svh]">
      {/* Header */}
      <div className="flex justify-between items-center py-3 gap-2 sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800">Voluntarios</h1>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="hidden md:inline-flex bg-green-700 hover:bg-green-600 text-white shadow-md">
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar voluntario</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pb-2">
              <div>
                <Label>Nombre y apellido *</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ana López"
                />
              </div>

              <div>
                <Label>Número de voluntario *</Label>
                <Input
                  value={volunteerNumber}
                  onChange={(e) => setVolunteerNumber(e.target.value)}
                  placeholder="Ej: 12345"
                />
              </div>

              <div>
                <Label>Congregación</Label>
                <Input
                  value={congregation}
                  onChange={(e) => setCongregation(e.target.value)}
                  placeholder="Ej: Oeste Montevideo"
                />
              </div>
            </div>

            <DialogFooter>
              <Button 
                onClick={handleAddVolunteer} 
                className="w-full bg-green-700 hover: bg-green-600 text-white"
              >
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Modal editar */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar voluntario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre y apellido *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej:  Ana López"
              />
            </div>

            <div>
              <Label>Número de voluntario *</Label>
              <Input
                value={volunteerNumber}
                onChange={(e) => setVolunteerNumber(e.target.value)}
                placeholder="Ej: 12345"
              />
            </div>

            <div>
              <Label>Congregación</Label>
              <Input
                value={congregation}
                onChange={(e) => setCongregation(e.target.value)}
                placeholder="Ej: Oeste Montevideo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              onClick={handleUpdateVolunteer} 
              className="w-full bg-green-700 hover:bg-green-600 text-white"
            >
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto pt-4 pb-24 md:pb-6">
        {volunteers.length === 0 ?  (
          <div className="text-center py-12 text-gray-500">
            <p>No hay voluntarios registrados</p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
            {volunteers.map((v) => (
              <div
                key={v.id}
                className="border rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-2 relative"
              >
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => handleEditVolunteer(v)}
                    className="p-1.5 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                    title="Editar"
                  >
                    <EditIcon className="h-4 w-4 text-blue-600" />
                  </button>
                  <button
                    onClick={() => handleDeleteVolunteer(v.id)}
                    className="p-1.5 bg-red-100 hover:bg-red-200 rounded-full transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </button>
                </div>

                <div className="font-medium text-gray-800 pr-20">
                  {v.name}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Número:</span> #{v.volunteer_number}
                </div>
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Congregación:</span> {v.congregation || "N/A"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante móvil */}
      <Button
        onClick={() => setOpen(true)}
        className="md:hidden fixed right-6 bottom-20 z-50 h-14 w-14 p-0 rounded-full bg-green-700 hover:bg-green-600 text-white shadow-lg flex items-center justify-center"
      >
        <PlusIcon className="h-7 w-7" />
      </Button>
    </div>
  );
}

export default Volunteers;