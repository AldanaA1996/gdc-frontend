import Layout from "@/app/components/layout";

export function Info() {
  return (
    <Layout>
      <div className="flex flex-col items-center w-full p-6">
        <h1 className="text-3xl font-bold mb-6 text-center">Bienvenido a Stockly</h1>

        <div className="max-w-4xl mx-auto text-lg">
          <p className="mb-4">
            Stockly es un sistema completo de gestión de inventario diseñado para organizaciones que necesitan llevar un control preciso de sus materiales, herramientas y recursos.
          </p>

          <h2 className="text-2xl font-semibold mt-8 mb-4">🏠 Pañol Principal</h2>
          <p className="mb-4">
            El pañol es el corazón de tu sistema de inventario. Aquí puedes:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Realizar préstamos y devoluciones de herramientas</li>
            <li>Registrar entradas y salidas de materiales</li>
            <li>Recibir notificaciones automáticas cuando los artículos llegan al stock mínimo</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">📦 Gestión de Inventario</h2>
          <p className="mb-4">
            Mantén un control detallado de todos tus materiales:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Agregar nuevos materiales con información detallada (nombre, cantidad, fabricante, etc.)</li>
            <li>Establecer cantidades mínimas para recibir alertas automáticas</li>
            <li>Editar información de materiales existentes</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">🔧 Gestión de Herramientas</h2>
          <p className="mb-4">
            Controla el préstamo y devolución de herramientas de forma eficiente:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Registrar nuevas herramientas con información detallada</li>
            <li>Sistema de préstamo con seguimiento de quién tiene cada herramienta</li>
            <li>Control de estado: disponible, en uso, prestada</li>
            <li>Registro automático de movimientos de préstamo y devolución</li>
            <li>Información de mantenimiento y garantía</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">🏢 Organización por Departamentos</h2>
          <p className="mb-4">
            Organiza tu inventario por departamentos para una mejor gestión:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Crear y gestionar múltiples departamentos</li>
            <li>Asignar materiales y herramientas a departamentos específicos</li>
            <li>Visualizar inventario por departamento</li>
            <li>Control de acceso y permisos por departamento</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">📊 Movimientos y Reportes</h2>
          <p className="mb-4">
            Lleva un registro completo de todas las transacciones:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Registro automático de entradas y salidas</li>
            <li>Historial completo de movimientos por artículo</li>
            <li>Filtros por fecha, tipo de actividad y usuario</li>
            <li>Exportación de datos para análisis externos</li>
            <li>Informes de uso y tendencias</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">🛒 Sistema de Compras</h2>
          <p className="mb-4">
            Gestiona tus necesidades de reposición de manera inteligente:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Lista automática de artículos que necesitan reposición</li>
            <li>Sugerencias basadas en el stock mínimo establecido</li>
            <li>Historial de compras realizadas</li>
            <li>Planificación de pedidos basada en el consumo</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">🔍 Búsqueda Avanzada</h2>
          <p className="mb-4">
            Encuentra rápidamente lo que necesitas:
          </p>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li>Búsqueda en tiempo real por nombre, fabricante, código de barras</li>
            <li>Filtros por tipo (materiales/herramientas), departamento y stock</li>
            <li>Vista unificada de todo el inventario</li>
            <li>Información detallada de cada artículo</li>
            <li>Exportación de resultados a CSV</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">⚡ Características Técnicas</h2>
          <ul className="list-disc list-inside mb-6 space-y-2">
            <li><strong>Base de datos:</strong> Supabase (PostgreSQL en la nube)</li>
            <li><strong>Frontend:</strong> React + Astro + TypeScript</li>
            <li><strong>UI:</strong> Tailwind CSS + Shadcn UI</li>
            <li><strong>Autenticación:</strong> Sistema seguro con sesiones persistentes</li>
            <li><strong>Responsive:</strong> Funciona en escritorio, tablet y móvil</li>
            <li><strong>Tiempo real:</strong> Actualizaciones automáticas de datos</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-8 mb-4">🚀 Cómo Empezar</h2>
          <ol className="list-decimal list-inside space-y-4 mb-6">
            <li>
              <strong>Configura tu inventario inicial:</strong>
              <p className="text-base ml-4">
                Comienza agregando tus materiales y herramientas existentes a través de las secciones "Inventario" y "Herramientas".
              </p>
            </li>
            <li>
              <strong>Establece cantidades mínimas:</strong>
              <p className="text-base ml-4">
                Define niveles mínimos de stock para recibir alertas automáticas cuando necesites reponer artículos.
              </p>
            </li>
            <li>
              <strong>Organiza por departamentos:</strong>
              <p className="text-base ml-4">
                Crea departamentos para organizar mejor tu inventario y asignar responsabilidades específicas.
              </p>
            </li>
            <li>
              <strong>Comienza a registrar movimientos:</strong>
              <p className="text-base ml-4">
                Usa el pañol para registrar préstamos, devoluciones y consumos de materiales de forma sistemática.
              </p>
            </li>
          </ol>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
            <h3 className="text-xl font-semibold mb-3 text-blue-800">💡 Consejos para una Gestión Efectiva</h3>
            <ul className="list-disc list-inside space-y-2 text-blue-700">
              <li>Mantén actualizadas las cantidades mínimas según el consumo real</li>
              <li>Realiza inventarios físicos periódicamente para verificar la precisión de los datos</li>
              <li>Usa códigos de barras para agilizar las búsquedas y registros</li>
              <li>Revisa regularmente los informes de movimientos para identificar patrones</li>
              <li>Configura alertas para artículos críticos que no deben agotarse</li>
            </ul>
          </div>

          <p className="mt-8 text-center text-gray-600">
            ¡Stockly está diseñado para hacer tu gestión de inventario más fácil y eficiente!
            Explora las diferentes secciones y descubre cómo cada herramienta puede ayudarte a mantener el control total de tus recursos.
          </p>

        </div>
      </div>
    </Layout>
  );
}
