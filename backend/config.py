# config.py
# Este archivo contiene todas las constantes de configuración para el servidor.

import logging

# --- Configuración de Red ---
HOST = "0.0.0.0"  # Escuchar en todas las interfaces de red
WEBSOCKET_PORT = 5001

# --- Configuración de SSL ---
# Asegúrate de que estos archivos estén en la misma carpeta que server.py
CERT_FILE = "cert.pem"
KEY_FILE = "key.pem"

# --- Configuración de la GUI ---
# Define la resolución fija para la ventana de visualización de video
DISPLAY_WIDTH = 1280
DISPLAY_HEIGHT = 720
WINDOW_NAME = "Video Stream en Tiempo Real (WebRTC)"

# --- Configuración de Logging ---
LOG_LEVEL = logging.INFO
LOG_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'