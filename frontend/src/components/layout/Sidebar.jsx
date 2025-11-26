import { NavLink } from "react-router-dom";
import { Home, Users, CreditCard, HelpCircle, Shield, FileCheck, Settings } from "lucide-react";

export default function Sidebar() {
  const links = [
    { to: "/", label: "Dashboard", icon: <Home size={20} /> },
    { to: "/afiliados", label: "Afiliados", icon: <Users size={20} /> },
    { to: "/pagos", label: "Pagos", icon: <CreditCard size={20} /> },
    { to: "/servicios", label: "Servicios", icon: <FileCheck size={20} /> },
    { to: "/pqrs", label: "PQRS", icon: <HelpCircle size={20} /> },
    { to: "/auditoria", label: "Auditoría", icon: <Shield size={20} /> },
    { to: "/configuracion", label: "Configuración", icon: <Settings size={20} /> }
  ];

  return (
    <aside className="w-64 h-screen bg-dark text-white flex flex-col border-r border-panel fixed left-0 top-0">
      <div className="p-6 flex-shrink-0">
        <h1 className="text-2xl font-bold">
          CoopControl <span className="text-primary">360</span>
        </h1>
      </div>

      <nav className="flex-1 overflow-y-auto px-6">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `flex items-center gap-3 p-3 rounded-lg transition mb-2 ${
                isActive
                  ? "bg-primary text-white"
                  : "hover:bg-primary/20 text-gray-300"
              }`
            }
          >
            {l.icon}
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex-shrink-0 p-6 pt-4 border-t border-panel/30">
        <p className="text-xs opacity-50">BY Concorde Software</p>
      </div>
    </aside>
  );
}

