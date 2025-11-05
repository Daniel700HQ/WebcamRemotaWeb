// App.jsx
// Componente principal que orquesta el estado y ensambla la aplicación.

import React, { useState, useRef, useCallback, useEffect } from "react";
import { styles } from './styles';
import LogModal from './LogModal';
import ConnectionManager from './ConnectionManager';
import StreamManager from './StreamManager';
import { useWebRTC } from './useWebRTC';
import { ReadyState } from "react-use-websocket";

function App() {
  // --- Estados Principales ---
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [stream, setStream] = useState(null);
  const [serverIp, setServerIp] = useState('');
  const [serverPort, setServerPort] = useState('5001');
  const [socketUrl, setSocketUrl] = useState(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef(null);

  // --- Estados de UI y Diagnóstico ---
  const [logs, setLogs] = useState([]);
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [connectionHint, setConnectionHint] = useState(null);
  const [isConnectionPanelVisible, setIsConnectionPanelVisible] = useState(true);

  // --- NUEVO: Estado y ref para el banner de desactivación ---
  const [isDeactivating, setIsDeactivating] = useState(false);
  const deactivationTimerRef = useRef(null);
  
  // --- Sistema de Logging ---
  const addLog = useCallback((level, component, message, data) => {
    const newLog = { level, component, message, timestamp: new Date().toLocaleTimeString(), data: data !== undefined ? JSON.stringify(data, null, 2) : null, };
    setLogs(prevLogs => [newLog, ...prevLogs.slice(0, 199)]);
    
    const consoleStyles = { info: 'color: #007bff;', warn: 'color: #ffc107;', error: 'color: #dc3545;', log: 'color: #6c757d;', };
    console[level](`%c[${component}]%c ${message}`, consoleStyles[level], 'color: initial;', data !== undefined ? data : '');
  }, []);
  
  // --- Hook de WebRTC ---
  const { readyState, sendEventToBackend, startWebRTCConnection, stopWebRTCConnection } = useWebRTC(socketUrl, stream, addLog, setConnectionHint);

  useEffect(() => {
    if (readyState === ReadyState.OPEN) {
      setIsConnectionPanelVisible(false);
    } else {
      setIsConnectionPanelVisible(true);
    }
  }, [readyState]);

  // --- NUEVO: Efecto para limpiar el temporizador al desmontar el componente ---
  useEffect(() => {
    return () => {
      // Si el componente se desmonta, nos aseguramos de limpiar cualquier temporizador pendiente.
      if (deactivationTimerRef.current) {
        clearTimeout(deactivationTimerRef.current);
      }
    };
  }, []);

  // --- Manejadores de Eventos (Lógica de la Aplicación) ---
  const handleConnect = () => {
    if (!serverIp) { alert("Por favor, introduce la dirección IP del servidor."); return; }
    setTestResult(null);
    setConnectionHint({ type: 'info', message: 'Intentando conectar...' });
    setSocketUrl(`wss://${serverIp}:${serverPort}`);
  };

  const handleDisconnect = () => {
    sendEventToBackend('manual_disconnect');
    if (isStreaming) { 
        setIsStreaming(false); 
        stopWebRTCConnection(); 
    }
    setSocketUrl(null);
    setConnectionHint(null);
  };

  const handleTestConnection = async () => {
    if (!serverIp) { alert("Por favor, introduce la dirección IP del servidor."); return; }
    const url = `https://${serverIp}:${serverPort}`;
    addLog('info', 'Connectivity Test', `Iniciando prueba de conexión a: ${url}`);
    setTestResult({ status: 'testing', message: `Probando ${url}...` });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    try {
      await fetch(url, { signal: controller.signal, mode: 'no-cors' });
      clearTimeout(timeoutId);
      setTestResult({ status: 'success', message: '¡Éxito! Se pudo conectar. Asegúrate de haber aceptado el certificado SSL.' });
    } catch (error) {
      clearTimeout(timeoutId);
      setTestResult({ status: 'error', message: `Fallo: ${error.message}. Verifica IP, puerto y firewall.` });
    }
  };

  const handleToggleCamera = () => {
    if (isCameraOn) {
      // --- NUEVO: Activar el banner y programar su desactivación ---
      setIsDeactivating(true);
      // Limpiar cualquier temporizador anterior para evitar solapamientos
      if (deactivationTimerRef.current) {
        clearTimeout(deactivationTimerRef.current);
      }
      deactivationTimerRef.current = setTimeout(() => {
        setIsDeactivating(false);
      }, 3000); // El banner durará 3 segundos

      addLog('warn', 'Camera', 'Iniciando secuencia de apagado completo de la cámara.');
      
      if (isStreaming) {
        setIsStreaming(false);
        stopWebRTCConnection();
        sendEventToBackend('streaming_stopped');
      }

      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
          addLog('log', 'Camera', `Pista de stream local detenida: ${track.id}`);
        });
      }

      setStream(null);
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setIsCameraOn(false);
      setDevices([]);
      setSelectedDevice(null);
      sendEventToBackend('camera_off');
    } else {
      addLog('info', 'Camera', 'Solicitando acceso a la cámara...');
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(tempStream => {
          tempStream.getTracks().forEach(track => track.stop());
          navigator.mediaDevices.enumerateDevices().then(devices => {
            const videoDevices = devices.filter(d => d.kind === "videoinput");
            setDevices(videoDevices);
            if (videoDevices.length > 0) {
              handleDeviceChange({ target: { value: videoDevices[0].deviceId } }, true);
            }
          });
          setIsCameraOn(true);
          sendEventToBackend('camera_on');
        }).catch(err => addLog('error', 'Camera', 'Error al acceder a la cámara.', err));
    }
  };

  const handleDeviceChange = async (event, isInitialActivation = false) => {
    const deviceId = event.target.value;
    setSelectedDevice(deviceId);
    if (stream) stream.getTracks().forEach((track) => track.stop());
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({ video: { deviceId: { exact: deviceId } } });
      setStream(newStream);
      if (videoRef.current) videoRef.current.srcObject = newStream;
      if (!isInitialActivation) {
        sendEventToBackend('device_changed', { deviceId });
        if (isStreaming) {
          stopWebRTCConnection();
          setTimeout(() => startWebRTCConnection(), 100);
        }
      }
    } catch (error) { addLog('error', 'Camera', 'Error al cambiar dispositivo.', error); }
  };

  const handleToggleStreaming = () => {
    if (!isCameraOn) {
      addLog('warn', 'Streaming', 'No se puede iniciar/detener la transmisión, la cámara está apagada.');
      return;
    }
    const nextState = !isStreaming;
    setIsStreaming(nextState);
    if (nextState) {
      sendEventToBackend('streaming_started');
      startWebRTCConnection();
    } else {
      sendEventToBackend('streaming_stopped');
      stopWebRTCConnection();
    }
  };

  const getStatusText = (rs) => Object.keys(ReadyState).find(key => ReadyState[key] === rs) || 'DESCONOCIDO';

  return (
    <div style={styles.body}>
      {/* --- NUEVO: Renderizado condicional del banner --- */}
      {isDeactivating && (
        <div style={styles.deactivationBanner}>
          Desactivando cámara...
        </div>
      )}

      {isLogModalOpen && <LogModal logs={logs} onClose={() => setIsLogModalOpen(false)} onClear={() => setLogs([])} />}
      
      <button onClick={() => setIsLogModalOpen(true)} style={{...styles.button, backgroundColor: '#6c757d', position: 'fixed', top: '20px', right: '20px', zIndex: 100}}>Ver Logs</button>

      {isConnectionPanelVisible ? (
        <ConnectionManager
          serverIp={serverIp}
          setServerIp={setServerIp}
          serverPort={serverPort}
          setServerPort={setServerPort}
          readyState={readyState}
          handleConnect={handleConnect}
          handleDisconnect={handleDisconnect}
          handleTestConnection={handleTestConnection}
          testResult={testResult}
          connectionHint={connectionHint}
          setIsConnectionPanelVisible={setIsConnectionPanelVisible}
        />
      ) : (
        <div style={styles.container}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{...styles.status, backgroundColor: '#28a745', marginRight: '15px'}}>
              Conectado: {getStatusText(readyState)}
            </div>
            <button 
              onClick={() => setIsConnectionPanelVisible(true)} 
              style={{...styles.button}}
            >
              Gestionar Conexión
            </button>
          </div>
        </div>
      )}
      
      <StreamManager
        isCameraOn={isCameraOn}
        handleToggleCamera={handleToggleCamera}
        isStreaming={isStreaming}
        handleToggleStreaming={handleToggleStreaming}
        devices={devices}
        selectedDevice={selectedDevice}
        handleDeviceChange={handleDeviceChange}
        videoRef={videoRef}
        readyState={readyState}
      />
    </div>
  );
}

export default App;