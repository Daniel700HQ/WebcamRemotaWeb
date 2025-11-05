# server.py
# Punto de entrada principal para la aplicación del servidor.
# Orquesta el inicio del servidor de señalización y la GUI.

import asyncio
import ssl
import logging
import threading
from queue import Queue
from websockets.server import serve

# Importar componentes de otros archivos del proyecto
from config import HOST, WEBSOCKET_PORT, CERT_FILE, KEY_FILE, LOG_LEVEL, LOG_FORMAT
from signaling_handler import handle_signaling_connection
from gui import gui_loop
from network_utils import get_local_ip

async def main_async(frame_queue: Queue):
    """
    Configura e inicia el servidor WebSocket seguro.
    """
    ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    try:
        ssl_context.load_cert_chain(certfile=CERT_FILE, keyfile=KEY_FILE)
    except FileNotFoundError:
        # --- MODIFICADO: Mensaje de error mejorado con instrucciones ---
        print("\n" + "!"*70)
        logging.critical("ERROR CRÍTICO: ARCHIVOS DE CERTIFICADO SSL NO ENCONTRADOS.")
        print("!"*70)
        logging.info(f"No se pudieron encontrar los archivos '{CERT_FILE}' o '{KEY_FILE}'.")
        logging.info("Para ejecutar el servidor en modo seguro (WSS), se necesita un certificado.")
        logging.info("Puedes generar uno autofirmado (válido por 10 años) con OpenSSL.")
        print("\nEjecuta el siguiente comando en tu terminal (en esta misma carpeta):")
        
        # Se proporciona un comando no interactivo y fácil de copiar/pegar.
        # -nodes evita que se pida una contraseña para la clave privada.
        # -subj '/CN=localhost' evita las preguntas interactivas.
        openssl_command = (
            f'openssl req -x509 -newkey rsa:2048 -keyout {KEY_FILE} '
            f'-out {CERT_FILE} -sha256 -days 3650 -nodes -subj "/CN=localhost"'
        )
        print("-" * 70)
        print(openssl_command)
        print("-" * 70)
        
        logging.info("Asegúrate de tener OpenSSL instalado y accesible en tu PATH.")
        logging.info("El servidor se detendrá ahora.")
        print("\n")
        return # Detiene la ejecución del hilo del servidor.

    # Usamos una lambda para pasar la cola de fotogramas al manejador de señalización
    handler_with_queue = lambda ws, path: handle_signaling_connection(ws, frame_queue)

    async with serve(handler_with_queue, HOST, WEBSOCKET_PORT, ssl=ssl_context):
        logging.info(f"Servidor WebSocket seguro (WSS) iniciado y escuchando en wss://{HOST}:{WEBSOCKET_PORT}")
        await asyncio.Future()  # Mantener el servidor corriendo indefinidamente

def print_startup_message():
    """
    Imprime un mensaje útil en la consola al iniciar el servidor.
    """
    local_ip = get_local_ip()
    print("\n" + "="*60)
    print("      SERVIDOR WEBRTC INICIADO")
    print("="*60)
    print(f"  - Escuchando en: wss://{local_ip}:{WEBSOCKET_PORT}")
    print(f"  - (También accesible en wss://localhost:{WEBSOCKET_PORT} localmente)")
    print("\n" + "!"*60)
    print("  ACCIÓN REQUERIDA PARA CLIENTES REMOTOS:")
    print("  1. Asegúrate de que el puerto 5001 esté ABIERTO en el firewall de esta máquina.")
    print(f"  2. En el navegador del cliente, primero visita: https://{local_ip}:{WEBSOCKET_PORT}")
    print("     -> Acepta la advertencia de seguridad para confiar en el certificado.")
    print("  3. En la aplicación React, usa esta IP para conectar: " + local_ip)
    print("!"*60 + "\n")

if __name__ == "__main__":
    # 1. Configurar el logging
    logging.basicConfig(level=LOG_LEVEL, format=LOG_FORMAT)

    # 2. Crear la cola que comunicará los hilos.
    frame_queue = Queue(maxsize=30)

    # 3. Configurar y lanzar el servidor asyncio en un hilo secundario (demonio).
    server_thread = threading.Thread(
        target=asyncio.run, 
        args=(main_async(frame_queue),),
        daemon=True
    )
    server_thread.start()
    logging.info("El hilo del servidor WebSocket ha sido iniciado.")

    # 4. Imprimir el mensaje de bienvenida y las instrucciones
    print_startup_message()

    # 5. Ejecutar el bucle de la GUI en el hilo principal.
    gui_loop(frame_queue)

    logging.info("Programa finalizado.")