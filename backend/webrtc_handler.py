# webrtc_handler.py

import asyncio
import logging
from queue import Queue
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaRelay
from aiortc.mediastreams import MediaStreamError
from av import VideoFrame

relay = MediaRelay()

class WebRTCHandler:
    def __init__(self, frame_queue: Queue):
        self.pc = RTCPeerConnection()
        self.frame_queue = frame_queue
        
        @self.pc.on("track")
        async def on_track(track):
            logging.info(f"Pista de video '{track.kind}' recibida")
            
            relayed_track = relay.subscribe(track)
            
            asyncio.create_task(self.consume_track(relayed_track))
            
            @track.on("ended")
            async def on_ended():
                logging.info(f"La pista de video '{track.kind}' ha finalizado (evento 'onended').")

    async def consume_track(self, track):
        while True:
            try:
                frame: VideoFrame = await track.recv()
                img = frame.to_ndarray(format="bgr24")
                self.frame_queue.put(img)
            except MediaStreamError:
                logging.warning("La pista de video remota fue detenida. Finalizando consumidor.")
                break
            except asyncio.CancelledError:
                logging.warning("La tarea de consumo de fotogramas fue cancelada.")
                break
            except Exception as e:
                logging.error(f"Error inesperado al consumir fotograma de la pista WebRTC: {e}", exc_info=True)
                break
        logging.info("Finalizada la tarea de consumo de fotogramas.")

    async def handle_offer(self, sdp, type):
        if self.pc.signalingState != "stable":
            logging.warning(f"El estado de señalización no es estable ('{self.pc.signalingState}'), ignorando la oferta.")
            return None
            
        try:
            offer = RTCSessionDescription(sdp=sdp, type=type)
            await self.pc.setRemoteDescription(offer)
            answer = await self.pc.createAnswer()
            await self.pc.setLocalDescription(answer)
            return {"sdp": self.pc.localDescription.sdp, "type": self.pc.localDescription.type}
        except Exception as e:
            logging.error(f"Error al manejar la oferta SDP: {e}", exc_info=True)
            await self.close()
            return None

    async def close(self):
        if self.pc.connectionState != "closed":
            logging.info("Cerrando la conexión RTCPeerConnection.")
            await self.pc.close()