// components/ToolStatistics.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useToolStatistics } from '@/app/hooks/use-tool-statistics';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  RefreshCw,
  Calendar,
  Award
} from 'lucide-react';
import { useState } from 'react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

type ChartType = 'line' | 'bar';

export default function ToolStatistics() {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [daysRange, setDaysRange] = useState(7);
  const { dailyStats, todayStats, loading, refresh } = useToolStatistics(daysRange);

  return (
    <div className="space-y-4">
      {/* Tarjetas de resumen del día */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Préstamos de hoy */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 mb-1">
                  Préstamos Hoy
                </p>
                <p className="text-3xl font-bold text-blue-700">
                  {todayStats. totalBorrows}
                </p>
              </div>
              <div className="p-3 bg-blue-200 rounded-full">
                <TrendingUp className="h-6 w-6 text-blue-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Devoluciones de hoy */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 mb-1">
                  Devoluciones Hoy
                </p>
                <p className="text-3xl font-bold text-green-700">
                  {todayStats.totalReturns}
                </p>
              </div>
              <div className="p-3 bg-green-200 rounded-full">
                <TrendingDown className="h-6 w-6 text-green-700" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* En uso actual */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 mb-1">
                  Actualmente en Uso
                </p>
                <p className="text-3xl font-bold text-orange-700">
                  {todayStats.currentInUse}
                </p>
              </div>
              <div className="p-3 bg-orange-200 rounded-full">
                <Package className="h-6 w-6 text-orange-700" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico principal */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <CardTitle>Actividad Diaria</CardTitle>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {/* Selector de rango */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                {[7, 14, 30].map((days) => (
                  <button
                    key={days}
                    onClick={() => setDaysRange(days)}
                    className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                      daysRange === days
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {days}d
                  </button>
                ))}
              </div>

              {/* Selector de tipo de gráfico */}
              <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setChartType('bar')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    chartType === 'bar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Barras
                </button>
                <button
                  onClick={() => setChartType('line')}
                  className={`px-3 py-1 rounded text-sm font-medium transition-all ${
                    chartType === 'line'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📈 Líneas
                </button>
              </div>

              {/* Botón refrescar */}
              <Button
                onClick={refresh}
                variant="outline"
                size="sm"
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading && dailyStats.length === 0 ?  (
            <div className="h-[300px] flex items-center justify-center">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Cargando estadísticas...</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'bar' ?  (
                <BarChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '14px' }}
                    iconType="circle"
                  />
                  <Bar 
                    dataKey="borrows" 
                    fill="#3b82f6" 
                    name="Préstamos"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar 
                    dataKey="returns" 
                    fill="#10b981" 
                    name="Devoluciones"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              ) : (
                <LineChart data={dailyStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    stroke="#6b7280"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow:  '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '14px' }}
                    iconType="circle"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="borrows" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    name="Préstamos"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="returns" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Devoluciones"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          )}

          {/* Estadísticas adicionales */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Préstamos</p>
                <p className="text-2xl font-bold text-blue-600">
                  {dailyStats.reduce((acc, day) => acc + day.borrows, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Devoluciones</p>
                <p className="text-2xl font-bold text-green-600">
                  {dailyStats.reduce((acc, day) => acc + day.returns, 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Promedio Diario</p>
                <p className="text-2xl font-bold text-orange-600">
                  {dailyStats.length > 0
                    ? Math.round(
                        dailyStats.reduce((acc, day) => acc + day.borrows, 0) /
                          dailyStats.length
                      )
                    :  0}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Día Pico</p>
                <p className="text-2xl font-bold text-purple-600">
                  {dailyStats.length > 0
                    ? Math.max(...dailyStats.map((d) => d.borrows))
                    : 0}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Herramientas más usadas */}
      {todayStats.mostUsedTools. length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <CardTitle>Top 5 Herramientas (últimos 7 días)</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md: grid-cols-2 gap-4">
              {/* Lista */}
              <div className="space-y-2">
                {todayStats. mostUsedTools.map((tool, index) => (
                  <div
                    key={tool.name}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div
                      className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-white ${
                        index === 0
                          ? 'bg-yellow-500'
                          : index === 1
                          ? 'bg-gray-400'
                          : index === 2
                          ? 'bg-amber-600'
                          : 'bg-blue-500'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {tool.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {tool.count} {tool.count === 1 ? 'préstamo' : 'préstamos'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-600">
                        {tool.count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gráfico de pastel */}
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={todayStats.mostUsedTools}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name.substring(0, 15)}... ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {todayStats.mostUsedTools.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}