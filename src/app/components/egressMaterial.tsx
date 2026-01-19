import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Search, Package, TrendingUp, AlertCircle } from 'lucide-react';

import { useAuthenticationStore } from '../store/authentication';
import { supabase } from '../lib/supabaseClient';
import { useSearch } from '../hooks/use-material-search';

const schema = z.object({
  materialId: z.string().min(1, 'Debes seleccionar un material.'),
  quantity: z.number().min(1, 'La cantidad a retirar debe ser mayor a 0.'),
});

export type Material = {
  id: string;
  name: string;
  manufactur: string;
  quantity: number;
  unit: string;
};

function EgressMaterialForm() {
  const { materials, isLoading, setSearchTerm, searchTerm, setMaterials } = useSearch();
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [error, setError] = useState<string | null>(null);

  const user = useAuthenticationStore((state) => state.user);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      materialId: '',
      quantity: 1,
    },
  });

  const getDbUserId = async (): Promise<number | null> => {
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

  const onSubmit = async (values: z.infer<typeof schema>) => {
    console.log('onSubmit called with values:', values);
    setError(null);

    if (!selectedMaterial) {
      setError("Por favor, selecciona un material de la lista.");
      toast.error("Por favor, selecciona un material de la lista.");
      return;
    }

    if (!values.quantity || values.quantity <= 0 || isNaN(values.quantity)) {
      setError("Debes ingresar una cantidad válida mayor a 0.");
      toast.error("Cantidad inválida");
      return;
    }

    if (values.quantity > selectedMaterial.quantity) {
      setError(`No puedes retirar más de la cantidad disponible (${selectedMaterial.quantity}).`);
      form.setError("quantity", { message: "Cantidad excede el stock." });
      toast.error("Cantidad excede el stock disponible");
      return;
    }

    try {
      const newQuantity = selectedMaterial.quantity - values.quantity;

      const { error: updateError } = await supabase
        .from('inventory')
        .update({ quantity: newQuantity })
        .eq('id', selectedMaterial.id);

      if (updateError) throw updateError;

      // Registrar actividad con formato consistente
      const now = new Date();
      const horaActual = now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const fechaActual = now.toLocaleDateString("es-AR", { year: 'numeric', month: '2-digit', day: '2-digit' }).split('/').reverse().join('-') + 'T' + now.toLocaleTimeString("es-AR", { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const createdBy = user?.id ?? null;
      const userCreatorId = await getDbUserId();

      const { error: activityError } = await supabase.from("activity").insert([
        {
          material: selectedMaterial.id,
          activity_type: 'exit',
          user_creator: userCreatorId,
          created_by: createdBy,
          created_at: horaActual,
          created_date: fechaActual,
          quantity: values.quantity,
        },
      ]);

      if (activityError) throw activityError;

      // Resetear formulario
      form.reset();
      setSearchTerm('');
      setSelectedMaterial(null);

      // Notificación de éxito
      toast.success('Egreso registrado exitosamente', {
        description: `Material: ${selectedMaterial.name} | Marca: ${selectedMaterial.manufactur} | Cantidad: ${values.quantity} | Nuevo stock: ${newQuantity}`,
      });
    } catch (err: any) {
      console.error("Error al retirar el material:", err);
      setError("Ocurrió un error al procesar el egreso. Intenta de nuevo.");
      toast.error("Error al registrar el egreso");
    }
  };

  const handleSelectMaterial = (material: Material) => {
    setSelectedMaterial(material);
    form.setValue('materialId', material.id, { shouldValidate: true });
    setSearchTerm(material.name);
    setMaterials([]);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted via handleFormSubmit');
    const formData = form.getValues();
    console.log('Form data:', formData);
    onSubmit(formData);
  };

  return (
    <div className="px-3">
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-800">Egreso de Material</h2>
        </div>
        <p className="text-sm text-gray-600">Selecciona un material y registra la cantidad retirada del inventario</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-3">
        {/* Campo de búsqueda */}
        <div className="space-y-2 relative">
          <Label htmlFor="search" className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Search className="h-4 w-4" />
            Buscar Material
          </Label>
          <div className="relative">
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (selectedMaterial) setSelectedMaterial(null);
                form.setValue('materialId', '', { shouldValidate: true });
              }}
              placeholder="Escribe el nombre del material..."
              autoComplete="off"
              className="pl-10 pr-4 py-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* Lista de resultados */}
          {materials.length > 0 && (
            <ul className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-lg shadow-xl mt-2 max-h-64 overflow-y-auto">
              {materials.map((material: Material) => (
                <li
                  key={material.id}
                  className="px-4 py-3 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 first:rounded-t-lg last:rounded-b-lg"
                  onClick={() => handleSelectMaterial(material)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{material.name}</p>
                      <p className="text-sm text-gray-500">{material.manufactur}</p>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      {material.quantity} {material.unit}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {isLoading && (
            <p className="text-sm text-blue-600 flex items-center gap-2 mt-2">
              <span className="animate-spin">⏳</span>
              Buscando materiales...
            </p>
          )}
        </div>

        {/* Material seleccionado */}
        {selectedMaterial && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="space-y-2 flex-1">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Material Seleccionado</p>
                  <p className="text-base font-bold text-gray-900">{selectedMaterial.name}</p>
                  <p className="text-sm text-gray-600">Marca: {selectedMaterial.manufactur}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-blue-200">
                  <Package className="h-4 w-4 text-blue-700" />
                  <span className="text-sm font-medium text-gray-700">Stock Disponible:</span>
                  <Badge variant="outline" className="bg-white border-blue-300 text-blue-700 font-semibold">
                    {selectedMaterial.quantity} {selectedMaterial.unit}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Campo de cantidad */}
        {selectedMaterial && (
          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700">Cantidad a Retirar</Label>
            <Input
              id="quantity"
              type="number"
              {...form.register('quantity', {
                valueAsNumber: true,
                required: "La cantidad es requerida",
                min: { value: 1, message: "La cantidad debe ser mayor a 0" }
              })}
              placeholder="Ingresa la cantidad"
              max={selectedMaterial.quantity}
              min="1"
              step="1"
              className="text-lg font-medium border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            />
            {form.formState.errors.quantity && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-2 rounded-md border border-red-200">
                <AlertCircle className="h-4 w-4" />
                <p>{form.formState.errors.quantity.message}</p>
              </div>
            )}
          </div>
        )}

        {/* Mensaje de error */}
        {error && (
          <div className="flex items-center gap-2 text-red-700 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* Botón */}
        <Button
          type="submit"
          disabled={!selectedMaterial || form.formState.isSubmitting}
          onClick={() => console.log('Button clicked, selectedMaterial:', selectedMaterial)}
          className="w-full py-6 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
        >
          {form.formState.isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">⏳</span>
              Procesando...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Retirar Material
            </span>
          )}
        </Button>
      </form>
    </div>
  );
}

export default EgressMaterialForm;
