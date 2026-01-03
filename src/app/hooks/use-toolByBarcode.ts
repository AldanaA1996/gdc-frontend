// hooks/use-tool-by-barcode.ts
import { useState, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';

type Tool = {
  id: number;
  name: string;
  quantity: number;
  barcode?:  string;
  department_id?:  number;
  inUse?: boolean;
};

export function useToolByBarcode() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const findToolByBarcode = useCallback(async (barcode: string): Promise<Tool | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error:  queryError } = await supabase
        .from('tools')
        .select('id, name, quantity, barcode, department_id, inUse')
        .eq('barcode', barcode)
        .maybeSingle();

      if (queryError) throw queryError;

      if (! data) {
        setError(`No se encontró ninguna herramienta con el código:  ${barcode}`);
        return null;
      }

      return data as Tool;
    } catch (err:  any) {
      console.error('Error buscando herramienta:', err);
      setError(err.message || 'Error al buscar la herramienta');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { findToolByBarcode, loading, error };
}