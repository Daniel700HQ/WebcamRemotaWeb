// LogModal.jsx
// Componente de React para la ventana modal que visualiza los logs de la aplicación.

import React from 'react';

const LogModal = ({ logs, onClose, onClear }) => {
  const styles = {
    overlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, },
    modal: { backgroundColor: '#2b2b2b', color: '#f1f1f1', borderRadius: '8px', padding: '20px', width: '80%', maxWidth: '900px', height: '70%', display: 'flex', flexDirection: 'column', },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #555', paddingBottom: '10px', marginBottom: '10px', },
    logContainer: { flex: 1, overflowY: 'auto', fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'pre-wrap', },
    logEntry: { padding: '4px 0', borderBottom: '1px solid #444', },
    button: { padding: "8px 16px", borderRadius: "4px", border: "none", cursor: "pointer", color: "white", backgroundColor: "#007bff", marginLeft: '10px', },
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'error': return '#ff6b6b';
      case 'warn': return '#ffd966';
      case 'info': return '#87cefa';
      default: return '#cccccc';
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2>Visor de Logs en Tiempo Real</h2>
          <div>
            <button style={{...styles.button, backgroundColor: '#6c757d'}} onClick={onClear}>Limpiar Logs</button>
            <button style={styles.button} onClick={onClose}>Cerrar</button>
          </div>
        </div>
        <div style={styles.logContainer}>
          {logs.map((log, index) => (
            <div key={index} style={styles.logEntry}>
              <span style={{ color: '#999' }}>{log.timestamp}</span>
              <span style={{ color: getLevelColor(log.level), fontWeight: 'bold', margin: '0 10px' }}>[{log.level.toUpperCase()}]</span>
              <span style={{ color: '#4ec9b0' }}>[{log.component}]</span>
              <span style={{ marginLeft: '10px' }}>{log.message}</span>
              {log.data && <pre style={{ margin: '5px 0 0 20px', color: '#ccc' }}>{log.data}</pre>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LogModal;