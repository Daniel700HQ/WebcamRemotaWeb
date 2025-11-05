// useWebRTC.js
// Custom Hook de React que encapsula toda la lógica de WebRTC y señalización WebSocket.

import { useEffect, useRef, useCallback } from 'react';
import useWebSocket, { ReadyState } from 'react-use-websocket';

export const useWebRTC = (socketUrl, stream, addLog, setConnectionHint) => {
    const peerConnectionRef = useRef(null);

    const { 
        readyState,
        sendMessage,
        lastMessage,
    } = useWebSocket(socketUrl, { 
        shouldReconnect: () => true, 
        reconnectInterval: 3000,
        onOpen: () => {
          addLog('info', 'WebSocket', 'Conexión WebSocket establecida con éxito (onOpen).');
          setConnectionHint({ type: 'success', message: 'Conectado con éxito al servidor de señalización.' });
        },
        onError: (event) => {
          addLog('error', 'WebSocket', 'Ha ocurrido un error en la conexión WebSocket (onError).', event);
        },
        onClose: (event) => {
          addLog('warn', 'WebSocket', `Conexión WebSocket cerrada (onClose). Código: ${event.code}, Razón: '${event.reason || 'Sin razón'}'`);
          switch (event.code) {
            case 1006:
            case 1015:
              setConnectionHint({ type: 'error', message: `Fallo de conexión (Código ${event.code}). Esto casi siempre es un problema con el certificado SSL. Usa el botón del 'Paso 1' para aceptar el riesgo.` });
              break;
            case 1000:
              setConnectionHint(null);
              break;
            default:
              setConnectionHint({ type: 'warn', message: `Conexión cerrada inesperadamente (Código ${event.code}).` });
              break;
          }
        },
    });

    useEffect(() => {
        if (lastMessage !== null) {
            try {
              const data = JSON.parse(lastMessage.data);
              addLog('info', 'WebSocket Rx', 'Mensaje de señalización recibido:', data);
              if (data.type === 'answer' && peerConnectionRef.current) {
                  addLog('info', 'WebRTC', 'Respuesta SDP recibida, estableciendo descripción remota.');
                  const answer = new RTCSessionDescription(data.payload);
                  peerConnectionRef.current.setRemoteDescription(answer)
                      .catch(e => addLog('error', 'WebRTC', 'Error al establecer la descripción remota:', e));
              }
            } catch(e) {
              addLog('error', 'WebSocket Rx', 'Error al parsear mensaje entrante', lastMessage.data);
            }
        }
    }, [lastMessage, addLog]);

    const sendEventToBackend = useCallback((eventName, eventData = {}) => {
        if (readyState === ReadyState.OPEN) {
          const eventPayload = { type: 'event', payload: { eventName, data: eventData, timestamp: new Date().toISOString() } };
          addLog('info', 'WebSocket Tx', `Enviando evento: '${eventName}'`, eventPayload);
          sendMessage(JSON.stringify(eventPayload));
        }
    }, [readyState, sendMessage, addLog]);

    const startWebRTCConnection = useCallback(async () => {
        if (!stream) {
            addLog('error', 'WebRTC', 'No hay stream de cámara para transmitir.');
            return;
        }
        addLog('info', 'WebRTC', 'Creando nueva RTCPeerConnection.');
        const pc = new RTCPeerConnection();
        peerConnectionRef.current = pc;

        pc.onconnectionstatechange = () => addLog('info', 'WebRTC State', `Connection State: ${pc.connectionState}`);
        
        stream.getTracks().forEach(track => pc.addTrack(track, stream));

        try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            const offerPayload = { type: 'offer', payload: { sdp: offer.sdp, type: offer.type } };
            addLog('info', 'WebSocket Tx', 'Enviando oferta SDP...', offerPayload);
            sendMessage(JSON.stringify(offerPayload));
        } catch (error) {
            addLog('error', 'WebRTC', 'Error al crear la oferta SDP:', error);
        }
    }, [stream, sendMessage, addLog]);

    // --- MODIFICADO: Secuencia de apagado robusta ---
    const stopWebRTCConnection = useCallback(() => {
        if (peerConnectionRef.current) {
            addLog('warn', 'WebRTC', 'Iniciando cierre de conexión RTCPeerConnection y liberación de pistas.');
            
            // Paso 1: Remover explícitamente cada pista (sender) de la conexión.
            // Esto es crucial para que el navegador sepa que ya no debe usar el hardware para esta conexión.
            peerConnectionRef.current.getSenders().forEach(sender => {
                if (sender.track) {
                    // Aunque detendremos el stream principal, detener la pista aquí es una buena práctica de robustez.
                    sender.track.stop();
                }
                peerConnectionRef.current.removeTrack(sender);
                addLog('log', 'WebRTC', 'Sender de pista removido de la conexión.');
            });

            // Paso 2: Cerrar la conexión PeerConnection para liberar todos los recursos de red.
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
            addLog('warn', 'WebRTC', 'Conexión PeerConnection cerrada y NULIFICADA.');
        }
    }, [addLog]);
    
    return { readyState, sendEventToBackend, startWebRTCConnection, stopWebRTCConnection };
};