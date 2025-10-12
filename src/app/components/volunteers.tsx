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
import { PlusIcon, EditIcon } from "lucide-react";

export function Volunteers() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingVolunteer, setEditingVolunteer] = useState<any | null>(null);
  const [name, setName] = useState("");
  const [volunteerNumber, setVolunteerNumber] = useState("");
  const [congregation, setCongregation] = useState("");

  // Cargar lista de voluntarios
  useEffect(() => {
    const fetchVolunteers = async () => {
      const { data, error } = await supabase
        .from("volunteers")
        .select("id, name, volunteer_number, congregation")
        .order("id", { ascending: true }) ;

      if (error) {
        console.error("Error al obtener voluntarios:", error);
        return;
      }
      setVolunteers(data || []);
    };
    fetchVolunteers();
  }, []);

  // Iniciar edición de voluntario
  const handleEditVolunteer = (volunteer: any) => {
    setEditingVolunteer(volunteer);
    setName(volunteer.name);
    setVolunteerNumber(volunteer.volunteer_number);
    setCongregation(volunteer.congregation || "");
    setEditOpen(true);
  };

  // Agregar nuevo voluntario
  const handleAddVolunteer = async () => {
    if (!name.trim() || !volunteerNumber.trim()) {
      alert("Completá todos los campos antes de guardar.");
      return;
    }

    const { data, error } = await supabase
      .from("volunteers")
      .insert([
        {
          name: name.trim(),
         
          congregation: congregation.trim(),
          volunteer_number: volunteerNumber.trim(),
        },
      ])
      .select();

    if (error) {
      console.error("Error al agregar voluntario:", error);
      alert("No se pudo agregar el voluntario.");
      return;
    }

    // Actualiza lista localmente
    setVolunteers((prev) => [...prev, ...(data || [])]);
    // Limpia formulario y cierra modal
    setName("");
    setVolunteerNumber("");
    setCongregation("");
    setOpen(false);
  };

  // Actualizar voluntario
  const handleUpdateVolunteer = async () => {
    if (!editingVolunteer || !name.trim() || !volunteerNumber.trim()) {
      alert("Completá todos los campos antes de guardar.");
      return;
    }

    const { data, error } = await supabase
      .from("volunteers")
      .update({
        name: name.trim(),
        congregation: congregation.trim(),
        volunteer_number: volunteerNumber.trim(),
      })
      .eq("id", editingVolunteer.id)
      .select();

    if (error) {
      console.error("Error al actualizar voluntario:", error);
      alert("No se pudo actualizar el voluntario.");
      return;
    }

    // Actualiza lista localmente
    setVolunteers((prev) =>
      prev.map((v) => (v.id === editingVolunteer.id ? { ...v, ...data[0] } : v))
    );
    // Limpia formulario y cierra modal
    setName("");
    setVolunteerNumber("");
    setCongregation("");
    setEditingVolunteer(null);
    setEditOpen(false);
  };

  return (
    <div className="p-6 mx-auto flex flex-col gap-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6 gap-2 sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200 pb-2">
        <h1 className="text-2xl font-semibold text-gray-800">Voluntarios</h1>

        {/* Botón para abrir el modal */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-700 hover:bg-green-600 text-white shadow-md">
              <PlusIcon className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar voluntario</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label>Nombre y apellido</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ana López"
                />
              </div>

              <div>
                <Label>Número de voluntario</Label>
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
                  placeholder="Ej: Oeste Montevidéo"
                />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={handleAddVolunteer} className="w-full bg-green-700 hover:bg-green-600 text-white">
                Guardar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Botón para editar voluntario */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar voluntario</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Nombre y apellido</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Ana López"
              />
            </div>

            <div>
              <Label>Número de voluntario</Label>
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
                placeholder="Ej: Oeste Montevidéo"
              />
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleUpdateVolunteer} className="w-full bg-green-700 hover:bg-green-600 text-white">
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lista de voluntarios */}
      <div className="grid gap-3 md:grid-cols-1 lg:grid-cols-2">
        {volunteers.map((v) => (
          <div
            key={v.id}
            className="border rounded-lg p-4 bg-gray-50 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col gap-2 relative"
          >
            <button
              onClick={() => handleEditVolunteer(v)}
              className="absolute top-2 right-2 p-1 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
              title="Editar voluntario"
            >
              <EditIcon className="h-4 w-4" />
            </button>
            <div className="font-medium text-gray-800">
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
    </div>
  );
}

export default Volunteers;
