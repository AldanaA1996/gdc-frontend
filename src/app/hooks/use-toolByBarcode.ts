// hooks/use-tool-by-barcode.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

type Tool = {
  id: number;
  name: string;
  quantity: number;
  barcode?: string;
  department_id?:  number;
  inUse?:  boolean;
  condition?: string;
};

export function useToolByBarcode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findToolByBarcode = useCallback(async (barcode:  string): Promise<Tool | null> => {
    // Validación inicial
    if (!barcode || barcode.trim().length < 3) {
      setError('Código de barras inválido');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Buscando herramienta con código:', barcode);

      const { data, error:  queryError } = await supabase
        .from('tools')
        .select('id, name, quantity, barcode, department_id, inUse')
        .eq('barcode', barcode. trim())
        .maybeSingle();

      if (queryError) {
        console.error('Error en query:', queryError);
        throw queryError;
      }

      if (!data) {
        const errorMsg = `No se encontró ninguna herramienta con el código: ${barcode}`;
        console.warn(errorMsg);
        setError(errorMsg);
        return null;
      }

      console.log('✅ Herramienta encontrada:', data);
      return data as Tool;
      
    } catch (err: any) {
      console.error('Error buscando herramienta:', err);
      const errorMsg = err.message || 'Error al buscar la herramienta';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { 
    findToolByBarcode, 
    loading, 
    error,
    clearError
  };
}