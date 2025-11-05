// ConnectionManager.jsx
// Componente de React para la UI de conexión, desconexión y diagnóstico.

import React from 'react';
import { styles } from './styles'; // Importar estilos compartidos
import { ReadyState } from 'react-use-websocket';

const ConnectionManager = ({
    serverIp, setServerIp,
    serverPort, setServerPort,
    readyState,
    handleConnect, handleDisconnect, handleTestConnection,
    testResult, connectionHint,
    setIsConnectionPanelVisible // --- NUEVO: Prop para controlar la visibilidad ---
}) => {
    const isConnected = readyState === ReadyState.OPEN;
    const getStatusText = (rs) => Object.keys(ReadyState).find(key => ReadyState[key] === rs) || 'DESCONOCIDO';

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>Conexión y Diagnóstico</h1>
                {/* --- NUEVO: Botón para ocultar el panel cuando está conectado --- */}
                {isConnected && (
                    <button 
                        onClick={() => setIsConnectionPanelVisible(false)} 
                        style={{...styles.button, backgroundColor: '#6c757d', padding: '5px 10px', fontSize: '12px'}}
                    >
                        Ocultar
                    </button>
                )}
            </header>

            <div style={styles.wsControls}>
                <input type="text" value={serverIp} onChange={e => setServerIp(e.target.value)} style={{ ...styles.input, flex: 2 }} placeholder="IP del servidor (ej: 192.168.1.42)" disabled={isConnected} />
                <input type="text" value={serverPort} onChange={e => setServerPort(e.target.value)} style={styles.input} placeholder="Puerto" disabled={isConnected} />
            </div>

            <div style={styles.connectionStep}>
                <h4 style={styles.stepTitle}>Paso 1: Confiar en el Certificado</h4>
                <p style={styles.stepDescription}>Para conexiones remotas, haz clic aquí para abrir la dirección del servidor en una nueva pestaña y acepta la advertencia de seguridad.</p>
                <a
                    href={serverIp ? `https://${serverIp}:${serverPort}` : '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => !serverIp && e.preventDefault()}
                    style={{ ...styles.button, textDecoration: 'none', display: 'inline-block', backgroundColor: '#ffc107', color: 'black', opacity: serverIp ? 1 : 0.5, pointerEvents: serverIp ? 'auto' : 'none' }}
                >
                    Abrir Página de Confianza
                </a>
            </div>

            <div style={styles.connectionStep}>
                <h4 style={styles.stepTitle}>Paso 2: Probar y Conectar</h4>
                <p style={styles.stepDescription}>Después de aceptar el certificado, prueba la red. Si tiene éxito, conéctate.</p>
                <div style={styles.buttonGroup}>
                    <button onClick={handleTestConnection} style={{ ...styles.button, backgroundColor: '#17a2b8' }} disabled={isConnected || !serverIp}>Probar Red</button>
                    {!isConnected ?
                        <button onClick={handleConnect} style={{ ...styles.button, ...styles.buttonSuccess }} disabled={!serverIp}>Conectar</button> :
                        <button onClick={handleDisconnect} style={{ ...styles.button, ...styles.buttonDanger }}>Desconectar</button>
                    }
                </div>
            </div>

            {testResult && (
                <div style={{ padding: '10px', marginTop: '10px', borderRadius: '4px', color: 'white', backgroundColor: testResult.status === 'success' ? '#28a745' : testResult.status === 'error' ? '#dc3545' : '#6c757d' }}>
                    <strong>Resultado Prueba de Red:</strong> {testResult.message}
                </div>
            )}
            
            {connectionHint && (
                <div style={{ padding: '10px', marginTop: '10px', borderRadius: '4px', color: 'white', backgroundColor: connectionHint.type === 'success' ? '#28a745' : connectionHint.type === 'error' ? '#dc3545' : '#6c757d' }}>
                    <strong>Estado de Conexión:</strong> {connectionHint.message}
                </div>
            )}
            
            <div style={styles.statusBox}>
                <div style={{ ...styles.status, backgroundColor: isConnected ? '#28a745' : '#6c757d' }}>Señalización WebSocket: {getStatusText(readyState)}</div>
            </div>
        </div>
    );
};

export default ConnectionManager;