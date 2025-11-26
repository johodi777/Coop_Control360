import useAuthStore from "../../context/authStore";
import { useNavigate } from "react-router-dom";

export default function Topbar() {
  const { logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <header className="w-full h-16 bg-panel flex items-center justify-between px-6 text-white border-b border-panel">
      <h2 className="text-xl font-semibold">Panel Administrativo</h2>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm text-gray-300 hidden md:block">
            {user.fullName || user.name || user.email}
          </span>
        )}
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-primary rounded-lg text-white hover:bg-primary/80 transition flex items-center gap-2"
        >
          <span>Cerrar sesión</span>
        </button>
      </div>
    </header>
  );
}

