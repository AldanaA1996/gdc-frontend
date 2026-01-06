// components/ToolsInUse.tsx
"use client"

import React, { useState, useEffect } from "react";
import { supabase } from "@/app/lib/supabaseClient";
import { Package, User, Clock, RefreshCw, AlertCircle } from "lucide-react";

type ToolInUse = {
  id: number;
  tool_id: number;
  tool_name: string;
  volunteer_id: number | null;
  volunteer_name: string;
  taken_at: string;
  taken_date: string;
};

interface ToolsInUseProps {
  onToolUpdate?:  () => void;
}

export default function ToolsInUse({ onToolUpdate }: ToolsInUseProps) {
  const [items, setItems] = useState<ToolInUse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchToolsInUse = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data:  toolsData, error: toolsError } = await supabase
        .from("tools")
        .select("id, name")
        .eq("inUse", true);

      if (toolsError) throw toolsError;

      if (! toolsData || toolsData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const toolsWithActivity = await Promise.all(
        toolsData.map(async (tool) => {
          const { data:  lastBorrowActivity, error: borrowError } = await supabase
            .from("activity")
            .select("id, tool, volunteer, created_at, created_date, activity_type")
            .eq("tool", tool.id)
            .eq("activity_type", "borrow")
            .order("id", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (borrowError || ! lastBorrowActivity) {
            return {
              id: tool.id,
              tool_id: tool.id,
              tool_name: tool.name,
              volunteer_id: null,
              volunteer_name: 'Sin voluntario',
              taken_at: new Date().toISOString(),
              taken_date: new Date().toISOString(),
            } as ToolInUse;
          }

          const { data:  returnAfter } = await supabase
            . from("activity")
            .select("id")
            .eq("tool", tool.id)
            .eq("activity_type", "return")
            .gt("id", lastBorrowActivity.id)
            .limit(1)
            .maybeSingle();

          if (returnAfter) {
            return null;
          }

          let volunteerName = 'Sin voluntario';
          const volunteerId = lastBorrowActivity.volunteer;

          if (volunteerId) {
            const { data: volunteerData, error: volError } = await supabase
              .from("volunteers")
              .select("id, name, volunteer_number")
              .eq("id", volunteerId)
              .single();

            if (! volError && volunteerData) {
              volunteerName = volunteerData.name;
              if (volunteerData.volunteer_number) {
                volunteerName += ` (#${volunteerData.volunteer_number})`;
              }
            }
          }

          return {
            id: lastBorrowActivity.id,
            tool_id: tool.id,
            tool_name: tool.name,
            volunteer_id: volunteerId || null,
            volunteer_name:  volunteerName,
            taken_at: lastBorrowActivity.created_at || '',
            taken_date: lastBorrowActivity.created_date || '',
          } as ToolInUse;
        })
      );

      const validTools = toolsWithActivity
        .filter((item) => item !== null) as ToolInUse[];
      
      validTools.sort((a, b) => b.id - a.id);

      setItems(validTools);

    } catch (err:  any) {
      console.error('❌ ERROR:', err);
      setError(err.message || 'Error al cargar');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchToolsInUse();
  }, []);

  // Parsear fecha YYYY-MM-DD + hora HH:mm:ss
  const parseDateTime = (dateString: string, timeString?:  string): Date | null => {
    try {
      if (!dateString) return null;

      // Si dateString ya incluye hora (formato ISO completo)
      if (dateString.includes('T') && dateString.length > 10) {
        const date = new Date(dateString);
        if (! isNaN(date.getTime())) return date;
      }

      // Si es fecha YYYY-MM-DD y tenemos hora aparte
      if (dateString.match(/^\d{4}-\d{2}-\d{2}$/) && timeString) {
        const isoString = `${dateString}T${timeString}`;
        const date = new Date(isoString);
        if (!isNaN(date.getTime())) return date;
      }

      // Intento genérico
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch {
      return null;
    }
  };

  const formatDate = (dateString: string, timeString?: string) => {
    const date = parseDateTime(dateString, timeString);
    if (!date) return `${dateString} ${timeString || ''}`.trim();

    return date.toLocaleString('es-AR', {
      day: '2-digit',
      month:  '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatTimeAgo = (dateString: string, timeString?: string) => {
    const date = parseDateTime(dateString, timeString);
    if (!date) return '';

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins}min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays === 1) return 'Ayer';
    return `Hace ${diffDays} días`;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-gray-600">
          {! loading && !error && `${items.length} herramienta${items.length !== 1 ? 's' :  ''} en uso`}
        </p>
        <button
          onClick={fetchToolsInUse}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          title="Actualizar"
        >
          <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mb-3" />
          <p className="text-sm text-gray-600">Cargando... </p>
        </div>
      )}

      {error && ! loading && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-base font-semibold text-gray-800 mb-1">
            No hay herramientas en uso
          </p>
          <p className="text-sm text-gray-600">
            Todas las herramientas están disponibles
          </p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Herramienta */}
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="h-5 w-5 text-blue-600 flex-shrink-0" />
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.tool_name}
                    </h3>
                  </div>

                  {/* Voluntario */}
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <p className="text-sm text-gray-600 truncate">
                      {item.volunteer_name}
                    </p>
                  </div>

                  {/* Fecha y hora */}
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        {formatDate(item.taken_date, item.taken_at)}
                      </span>
                      <span className="text-xs text-blue-600 font-medium">
                        {formatTimeAgo(item.taken_date, item.taken_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Badge */}
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 flex-shrink-0">
                  En uso
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}