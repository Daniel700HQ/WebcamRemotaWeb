// StreamManager.jsx
// Componente de React para la UI de control de cámara y transmisión.

import React from 'react';
import { styles } from './styles'; // Importar estilos compartidos
import { ReadyState } from 'react-use-websocket';

const StreamManager = ({
    isCameraOn, handleToggleCamera,
    isStreaming, handleToggleStreaming,
    devices, selectedDevice, handleDeviceChange,
    videoRef, readyState
}) => {
    const isConnected = readyState === ReadyState.OPEN;

    return (
        <div style={styles.container}>
            <header style={styles.header}><h1 style={styles.title}>Control de Cámara y Transmisión</h1></header>
            <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleToggleCamera} style={{ ...styles.button, flex: 1 }}>{isCameraOn ? 'Apagar Cámara' : 'Encender Cámara'}</button>
                <button onClick={handleToggleStreaming} style={{ ...styles.button, ...(isStreaming ? styles.buttonDanger : styles.buttonSuccess), flex: 1 }} disabled={!isCameraOn || !isConnected}>
                    {isStreaming ? 'Detener Transmisión' : 'Iniciar Transmisión'}
                </button>
            </div>
            
            {isCameraOn && (
                <>
                    <select onChange={handleDeviceChange} value={selectedDevice || ""} style={styles.select} disabled={devices.length === 0}>
                        <option value="">{devices.length > 0 ? "Selecciona una cámara" : "Buscando..."}</option>
                        {devices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label || `Cámara ${device.deviceId.substring(0, 8)}`}</option>)}
                    </select>
                    <video ref={videoRef} autoPlay playsInline muted style={styles.video}></video>
                </>
            )}
        </div>
    );
};

export default StreamManager;