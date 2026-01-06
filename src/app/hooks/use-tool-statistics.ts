// hooks/use-tool-statistics.ts
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { startOfDay, endOfDay, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';

export type DailyStats = {
  date: string;
  borrows: number;
  returns:  number;
  net: number; // préstamos - devoluciones
};

export type TodayStats = {
  totalBorrows: number;
  totalReturns: number;
  currentInUse: number;
  mostUsedTools: Array<{
    name:  string;
    count: number;
  }>;
};

export function useToolStatistics(days: number = 7) {
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [todayStats, setTodayStats] = useState<TodayStats>({
    totalBorrows: 0,
    totalReturns: 0,
    currentInUse: 0,
    mostUsedTools:  [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDailyStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const dates:  DailyStats[] = [];
      
      // Generar últimos N días
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        // Contar préstamos del día
        const { data: borrowData, error: borrowError } = await supabase
          .from('activity')
          .select('id')
          .eq('activity_type', 'borrow')
          .gte('created_date', startOfDay(date).toISOString())
          .lte('created_date', endOfDay(date).toISOString());

        if (borrowError) throw borrowError;

        // Contar devoluciones del día
        const { data: returnData, error: returnError } = await supabase
          .from('activity')
          .select('id')
          .eq('activity_type', 'return')
          .gte('created_date', startOfDay(date).toISOString())
          .lte('created_date', endOfDay(date).toISOString());

        if (returnError) throw returnError;

        const borrows = borrowData?.length || 0;
        const returns = returnData?.length || 0;

        dates.push({
          date: format(date, 'dd/MM', { locale: es }),
          borrows,
          returns,
          net: borrows - returns,
        });
      }

      setDailyStats(dates);
    } catch (err:  any) {
      console.error('Error fetching daily stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [days]);

  const fetchTodayStats = useCallback(async () => {
    try {
      const today = new Date();
      
      // Préstamos de hoy
      const { data:  borrowData, error: borrowError } = await supabase
        . from('activity')
        .select('id')
        .eq('activity_type', 'borrow')
        .gte('created_date', startOfDay(today).toISOString())
        .lte('created_date', endOfDay(today).toISOString());

      if (borrowError) throw borrowError;

      // Devoluciones de hoy
      const { data: returnData, error: returnError } = await supabase
        .from('activity')
        .select('id')
        .eq('activity_type', 'return')
        .gte('created_date', startOfDay(today).toISOString())
        .lte('created_date', endOfDay(today).toISOString());

      if (returnError) throw returnError;

      // Herramientas actualmente en uso
      const { data:  inUseData, error: inUseError } = await supabase
        .from('tools')
        .select('id')
        .eq('inUse', true);

      if (inUseError) throw inUseError;

      // Herramientas más usadas (últimos 7 días)
      const { data: topToolsData, error: topToolsError } = await supabase
        .from('activity')
        .select('tool, tools(name)')
        .eq('activity_type', 'borrow')
        .gte('created_date', subDays(today, 7).toISOString())
        .order('created_at', { ascending: false })
        .limit(100);

      if (topToolsError) throw topToolsError;

      // Contar herramientas más usadas
      const toolCounts:  Record<string, { name: string; count: number }> = {};
      topToolsData?.forEach((activity:  any) => {
        const toolName = activity.tools?.name;
        if (toolName) {
          if (!toolCounts[toolName]) {
            toolCounts[toolName] = { name: toolName, count: 0 };
          }
          toolCounts[toolName].count++;
        }
      });

      const mostUsedTools = Object.values(toolCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setTodayStats({
        totalBorrows: borrowData?.length || 0,
        totalReturns: returnData?.length || 0,
        currentInUse: inUseData?.length || 0,
        mostUsedTools,
      });
    } catch (err: any) {
      console.error('Error fetching today stats:', err);
    }
  }, []);

  useEffect(() => {
    fetchDailyStats();
    fetchTodayStats();

    // Refrescar cada 30 segundos
    const interval = setInterval(() => {
      fetchTodayStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchDailyStats, fetchTodayStats]);

  const refresh = useCallback(() => {
    fetchDailyStats();
    fetchTodayStats();
  }, [fetchDailyStats, fetchTodayStats]);

  return {
    dailyStats,
    todayStats,
    loading,
    error,
    refresh,
  };
}