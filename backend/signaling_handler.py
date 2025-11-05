# signaling_handler.py
# Gestiona la lógica de señalización para las conexiones WebSocket entrantes.

import asyncio
import json
import logging
from queue import Queue

from webrtc_handler import WebRTCHandler

# Este conjunto almacena los manejadores activos para las conexiones WebRTC.
PEERS = set()

async def handle_signaling_connection(websocket, frame_queue: Queue):
    """
    Gestiona una conexión WebSocket individual para la señalización WebRTC.
    """
    client_ip = websocket.remote_address[0]
    logging.info(f"Cliente de señalización conectado: {client_ip}.")
    
    webrtc_handler = WebRTCHandler(frame_queue)
    PEERS.add(webrtc_handler)

    try:
        await websocket.send(json.dumps({"type": "welcome", "message": "Servidor de señalización conectado."}))
        
        async for message in websocket:
            try:
                data = json.loads(message)
                event_type = data.get("type")
                
                if event_type == 'offer':
                    logging.info(f"Oferta SDP recibida de {client_ip}.")
                    payload = data.get('payload', {})
                    if payload.get('sdp') and payload.get('type'):
                        answer = await webrtc_handler.handle_offer(payload['sdp'], payload['type'])
                        if answer:
                            logging.info(f"Enviando respuesta SDP a {client_ip}.")
                            await websocket.send(json.dumps({"type": "answer", "payload": answer}))
                    else:
                        logging.warning("La oferta SDP recibida está incompleta.")

                elif event_type == 'event':
                    payload = data.get('payload', {})
                    event_name = payload.get('eventName', 'evento_desconocido')
                    logging.info(f"[EVENTO RECIBIDO de {client_ip}] -> '{event_name}'")
                    
                    if event_name == 'device_changed' or event_name == 'streaming_started':
                        logging.info(f"Evento '{event_name}' recibido. Reiniciando el manejador WebRTC para una nueva oferta.")
                        if webrtc_handler in PEERS:
                            await webrtc_handler.close()
                            PEERS.remove(webrtc_handler)
                        webrtc_handler = WebRTCHandler(frame_queue)
                        PEERS.add(webrtc_handler)

                else:
                    logging.warning(f"Mensaje de tipo desconocido de {client_ip}: {data}")

            except json.JSONDecodeError:
                logging.error(f"Error al decodificar JSON de {client_ip}: {message}")
            except Exception as e:
                logging.error(f"Error procesando mensaje de {client_ip}: {e}", exc_info=True)

    except Exception as e:
        logging.error(f"Conexión con {client_ip} cerrada con error: {e}")
    finally:
        logging.info(f"Limpiando recursos para el cliente {client_ip}.")
        if webrtc_handler in PEERS:
            await webrtc_handler.close()
            PEERS.remove(webrtc_handler)