import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../context/authStore";
import Button from "../components/ui/Button";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login({ email, password });
    if (result.success) {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      
      <div className="bg-panel rounded-xl p-8 w-full max-w-md border border-panel/50 shadow-xl relative z-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            CoopControl <span className="text-primary">360</span>
          </h1>
          <p className="text-gray-400">Panel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              placeholder="tu@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin">⏳</span>
                Iniciando sesión...
              </span>
            ) : (
              "Iniciar sesión"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          © Concorde Software
        </p>
      </div>
    </div>
  );
}

