/**
 * Creation/modification date: 21/05/2026
 * Path: src/app/(dashboard)/dashboard/page.tsx
 * Description: Dashboard home page with module overview.
 */

export default function DashboardPage() {
  const modules = [
    {
      name: "SAT",
      description: "Órdenes de trabajo y asistencia técnica",
      icon: "🔧",
      href: "/dashboard/sat",
      color: "bg-blue-50 hover:bg-blue-100 border-blue-200",
    },
    {
      name: "ERP",
      description: "Productos, stock y almacenes",
      icon: "📦",
      href: "/dashboard/erp",
      color: "bg-green-50 hover:bg-green-100 border-green-200",
    },
    {
      name: "Facturación",
      description: "Presupuestos, facturas y Veri*factu",
      icon: "💰",
      href: "/dashboard/billing",
      color: "bg-yellow-50 hover:bg-yellow-100 border-yellow-200",
    },
    {
      name: "CRM",
      description: "Clientes, ventas y oportunidades",
      icon: "🤝",
      href: "/dashboard/crm",
      color: "bg-purple-50 hover:bg-purple-100 border-purple-200",
    },
    {
      name: "Control de Acceso",
      description: "Fichaje de jornada y ausencias",
      icon: "⏱️",
      href: "/dashboard/access",
      color: "bg-red-50 hover:bg-red-100 border-red-200",
    },
    {
      name: "Configuración",
      description: "Ajustes de empresa y usuarios",
      icon: "⚙️",
      href: "/dashboard/settings",
      color: "bg-gray-50 hover:bg-gray-100 border-gray-200",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">RIBOTFLOW</h1>
          <nav className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Dashboard</span>
            <button className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-500">
              Cerrar sesión
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido a RIBOTFLOW
          </h2>
          <p className="mt-1 text-gray-600">
            Selecciona un módulo para empezar
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <a
              key={mod.name}
              href={mod.href}
              className={`rounded-lg border p-6 transition ${mod.color}`}
            >
              <div className="text-3xl">{mod.icon}</div>
              <h3 className="mt-3 text-lg font-semibold text-gray-900">
                {mod.name}
              </h3>
              <p className="mt-1 text-sm text-gray-600">{mod.description}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
