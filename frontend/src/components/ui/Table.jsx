export default function Table({ headers, data, renderRow, className = "", stickyActions = false }) {
  return (
    <div className={`w-full ${className}`}>
      <div 
        className="relative border border-panel/30 rounded-lg" 
        style={{ 
          maxHeight: 'calc(100vh - 350px)',
          overflowX: 'scroll',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <table 
          className="w-full divide-y divide-panel/50 border-collapse" 
          style={{ minWidth: '900px', width: '100%' }}
        >
          <thead className="bg-panel/50 border-b border-panel/50 sticky top-0 z-20">
            <tr>
              {headers.map((header, index) => {
                const isActions = header === "Acciones";
                return (
                  <th
                    key={index}
                    className={`px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                      isActions && stickyActions ? 'sticky right-0 z-30' : ''
                    }`}
                    style={isActions && stickyActions ? { 
                      position: 'sticky', 
                      right: 0, 
                      backgroundColor: 'rgb(26, 26, 34)',
                      zIndex: 30,
                      boxShadow: '-2px 0 10px rgba(0, 0, 0, 0.8)',
                      minWidth: '160px',
                      textAlign: 'center'
                    } : {}}
                  >
                    {header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-panel/50 bg-panel">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length}
                  className="px-4 py-12 text-center text-gray-400"
                >
                  No hay datos disponibles
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index} className="hover:bg-panel/70 transition">
                  {renderRow(row, index)}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

