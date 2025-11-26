import { useState } from "react";
import { affiliatesAPI } from "../../../api/affiliates";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import { X, Upload, FileSpreadsheet, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ImportExcel({ onClose, onImportComplete }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();
      if (!['xlsx', 'xls'].includes(ext)) {
        setError("Solo se permiten archivos Excel (.xlsx, .xls)");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Por favor selecciona un archivo");
      return;
    }

    setLoading(true);
    setError("");
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('Enviando archivo:', file.name);
      const response = await affiliatesAPI.importExcel(formData);
      console.log('Respuesta del servidor:', response);
      
      if (response.success) {
        setResults(response.data);
        if (onImportComplete) {
          // Esperar un poco para que el backend termine de procesar
          setTimeout(() => {
            onImportComplete();
          }, 500);
        }
      } else {
        setError(response.message || "Error al importar el archivo");
      }
    } catch (err) {
      console.error('Error completo:', err);
      const errorMessage = err.response?.data?.message || err.message || "Error al importar el archivo";
      setError(errorMessage);
      console.error('Mensaje de error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-panel rounded-xl p-6 w-full max-w-2xl border border-panel/50">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">Importar Afiliados desde Excel</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition">
            <X size={24} />
          </button>
        </div>

        {!results ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
                <XCircle size={20} />
                {error}
              </div>
            )}

            <Card className="bg-dark/50">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Seleccionar archivo Excel
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={loading}
                      />
                      <div className="flex items-center gap-3 p-4 border-2 border-dashed border-panel/50 rounded-lg hover:border-primary/50 transition">
                        <FileSpreadsheet className="text-primary" size={32} />
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {file ? file.name : "Haz clic para seleccionar archivo"}
                          </p>
                          <p className="text-gray-400 text-sm">
                            Formatos soportados: .xlsx, .xls
                          </p>
                        </div>
                        <Upload className="text-gray-400" size={20} />
                      </div>
                    </label>
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="text-blue-400 mt-0.5" size={20} />
                    <div className="text-sm text-blue-300">
                      <p className="font-medium mb-2">Formato esperado del Excel:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Columna con nombre del afiliado</li>
                        <li>Columna con número de documento</li>
                        <li>Columna con monto/aporte mensual</li>
                        <li>Columna con auxiliar (Natalia o Lina)</li>
                        <li>Columna con razón social (opcional)</li>
                        <li>Columna con estado de pago (opcional)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading || !file}>
                {loading ? "Importando..." : "Importar"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <Card className="bg-green-500/10 border-green-500/50">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="text-green-400" size={24} />
                <h3 className="text-lg font-bold text-white">Importación Completada</h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Exitosos</p>
                  <p className="text-2xl font-bold text-green-400">{results.success}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Errores</p>
                  <p className="text-2xl font-bold text-red-400">{results.errors}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Omitidos</p>
                  <p className="text-2xl font-bold text-yellow-400">{results.skipped}</p>
                </div>
              </div>
            </Card>

            {results.errorsList && results.errorsList.length > 0 && (
              <Card className="bg-dark/50 max-h-60 overflow-y-auto">
                <h4 className="text-white font-medium mb-2">Errores encontrados:</h4>
                <div className="space-y-2">
                  {results.errorsList.slice(0, 10).map((err, idx) => (
                    <div key={idx} className="text-sm text-red-400">
                      Fila {err.row}: {err.error}
                    </div>
                  ))}
                  {results.errorsList.length > 10 && (
                    <p className="text-xs text-gray-400">
                      ... y {results.errorsList.length - 10} errores más
                    </p>
                  )}
                </div>
              </Card>
            )}

            <div className="flex justify-end gap-4">
              <Button onClick={onClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

