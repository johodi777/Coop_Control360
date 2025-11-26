import { useState, useEffect } from "react";
import { settingsAPI } from "../../../api/settings";
import Card from "../../../components/ui/Card";
import Button from "../../../components/ui/Button";
import { Settings, Users, Plus, Edit, Trash2, Save, X } from "lucide-react";

const COLOR_OPTIONS = [
  { value: "blue", label: "Azul" },
  { value: "green", label: "Verde" },
  { value: "purple", label: "Morado" },
  { value: "orange", label: "Naranja" },
  { value: "red", label: "Rojo" },
  { value: "yellow", label: "Amarillo" },
  { value: "pink", label: "Rosa" },
  { value: "cyan", label: "Cian" },
];

export default function SettingsList() {
  const [assistants, setAssistants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [newAssistant, setNewAssistant] = useState({ id: "", name: "", color: "blue" });
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadAssistants();
  }, []);

  const loadAssistants = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAssistants();
      if (response.success !== false && response.data) {
        setAssistants(response.data);
      } else {
        // Valores por defecto si no hay configuración
        setAssistants([
          { id: "natalia", name: "Natalia", color: "blue" },
          { id: "lina", name: "Lina", color: "green" },
        ]);
      }
    } catch (error) {
      console.error("Error cargando auxiliares:", error);
      // Valores por defecto en caso de error
      setAssistants([
        { id: "natalia", name: "Natalia", color: "blue" },
        { id: "lina", name: "Lina", color: "green" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await settingsAPI.updateAssistants(assistants);
      if (response.success !== false) {
        alert("Auxiliares guardados exitosamente");
        setEditingIndex(null);
        setShowAddForm(false);
        setNewAssistant({ id: "", name: "", color: "blue" });
      } else {
        alert("Error al guardar: " + (response.message || "Error desconocido"));
      }
    } catch (error) {
      console.error("Error guardando auxiliares:", error);
      alert("Error al guardar los auxiliares");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (index) => {
    setEditingIndex(index);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    loadAssistants(); // Recargar para descartar cambios
  };

  const handleUpdateAssistant = (index, field, value) => {
    const updated = [...assistants];
    updated[index] = { ...updated[index], [field]: value };
    setAssistants(updated);
  };

  const handleDelete = (index) => {
    if (window.confirm(`¿Estás seguro de eliminar a ${assistants[index].name}?`)) {
      const updated = assistants.filter((_, i) => i !== index);
      setAssistants(updated);
      // Guardar automáticamente después de eliminar
      settingsAPI.updateAssistants(updated).then(() => {
        loadAssistants();
      }).catch((error) => {
        console.error("Error eliminando auxiliar:", error);
        alert("Error al eliminar el auxiliar");
        loadAssistants(); // Recargar para restaurar
      });
    }
  };

  const handleAdd = () => {
    if (!newAssistant.id || !newAssistant.name) {
      alert("Por favor completa el ID y el nombre del auxiliar");
      return;
    }

    // Validar que el ID no esté duplicado
    if (assistants.some(a => a.id === newAssistant.id)) {
      alert("Ya existe un auxiliar con ese ID");
      return;
    }

    const updated = [...assistants, { ...newAssistant }];
    setAssistants(updated);
    setNewAssistant({ id: "", name: "", color: "blue" });
    setShowAddForm(false);
  };

  const getColorClass = (color) => {
    const colorMap = {
      blue: "bg-blue-500/20 text-blue-400 border-blue-500/50",
      green: "bg-green-500/20 text-green-400 border-green-500/50",
      purple: "bg-purple-500/20 text-purple-400 border-purple-500/50",
      orange: "bg-orange-500/20 text-orange-400 border-orange-500/50",
      red: "bg-red-500/20 text-red-400 border-red-500/50",
      yellow: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
      pink: "bg-pink-500/20 text-pink-400 border-pink-500/50",
      cyan: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
    };
    return colorMap[color] || colorMap.blue;
  };

  if (loading) {
    return (
      <div className="text-white">
        <div className="text-center py-12 text-gray-400">Cargando configuración...</div>
      </div>
    );
  }

  return (
    <div className="text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Configuración</h1>
          <p className="text-gray-400">Personaliza el aplicativo según tus necesidades</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Sección de Auxiliares */}
        <Card className="border-panel/50 bg-panel/30">
          <div className="flex items-center gap-3 mb-6">
            <Users size={24} className="text-primary" />
            <div>
              <h2 className="text-xl font-bold text-white">Gestión de Auxiliares</h2>
              <p className="text-sm text-gray-400">Agrega, edita o elimina auxiliares del sistema</p>
            </div>
          </div>

          <div className="space-y-4">
            {assistants.map((assistant, index) => (
              <div
                key={index}
                className="p-4 bg-dark/50 rounded-lg border border-panel/50"
              >
                {editingIndex === index ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        ID (identificador único)
                      </label>
                      <input
                        type="text"
                        value={assistant.id}
                        onChange={(e) => handleUpdateAssistant(index, "id", e.target.value)}
                        className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                        placeholder="ej: natalia"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Nombre
                      </label>
                      <input
                        type="text"
                        value={assistant.name}
                        onChange={(e) => handleUpdateAssistant(index, "name", e.target.value)}
                        className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                        placeholder="Nombre del auxiliar"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Color
                      </label>
                      <select
                        value={assistant.color}
                        onChange={(e) => handleUpdateAssistant(index, "color", e.target.value)}
                        className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                      >
                        {COLOR_OPTIONS.map((color) => (
                          <option key={color.value} value={color.value}>
                            {color.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                      <Button onClick={handleSave} disabled={saving} className="flex-1">
                        <Save size={18} className="mr-2" />
                        {saving ? "Guardando..." : "Guardar Cambios"}
                      </Button>
                      <Button variant="outline" onClick={handleCancelEdit} className="flex-1">
                        <X size={18} className="mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`px-4 py-2 rounded-lg border ${getColorClass(assistant.color)}`}
                      >
                        <div className="font-semibold">{assistant.name}</div>
                        <div className="text-xs opacity-75">ID: {assistant.id}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => handleEdit(index)}
                        className="flex items-center gap-2"
                      >
                        <Edit size={18} />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleDelete(index)}
                        className="flex items-center gap-2 text-red-400 border-red-400/50 hover:bg-red-500/20"
                      >
                        <Trash2 size={18} />
                        Eliminar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {showAddForm ? (
              <div className="p-4 bg-dark/50 rounded-lg border border-panel/50 border-dashed">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      ID (identificador único)
                    </label>
                    <input
                      type="text"
                      value={newAssistant.id}
                      onChange={(e) => setNewAssistant({ ...newAssistant, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                      placeholder="ej: natalia"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={newAssistant.name}
                      onChange={(e) => setNewAssistant({ ...newAssistant, name: e.target.value })}
                      className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                      placeholder="Nombre del auxiliar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Color
                    </label>
                    <select
                      value={newAssistant.color}
                      onChange={(e) => setNewAssistant({ ...newAssistant, color: e.target.value })}
                      className="w-full px-4 py-2 bg-dark border border-panel/50 rounded-lg text-white focus:outline-none focus:border-primary transition"
                    >
                      {COLOR_OPTIONS.map((color) => (
                        <option key={color.value} value={color.value}>
                          {color.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleAdd} className="flex-1">
                    <Plus size={18} className="mr-2" />
                    Agregar
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewAssistant({ id: "", name: "", color: "blue" });
                    }}
                    className="flex-1"
                  >
                    <X size={18} className="mr-2" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowAddForm(true)}
                className="w-full border-dashed"
              >
                <Plus size={18} className="mr-2" />
                Agregar Nuevo Auxiliar
              </Button>
            )}

            {assistants.length > 0 && editingIndex === null && !showAddForm && (
              <div className="pt-4 border-t border-panel/50">
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save size={18} className="mr-2" />
                  {saving ? "Guardando..." : "Guardar Cambios"}
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Sección para futuras configuraciones */}
        <Card className="border-panel/50 bg-panel/30 opacity-50">
          <div className="flex items-center gap-3 mb-4">
            <Settings size={24} className="text-gray-400" />
            <div>
              <h2 className="text-xl font-bold text-gray-400">Otras Configuraciones</h2>
              <p className="text-sm text-gray-500">Próximamente: más opciones de personalización</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

