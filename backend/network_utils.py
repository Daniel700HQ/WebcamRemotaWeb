# network_utils.py
# Contiene funciones de utilidad relacionadas con la red.

import socket

def get_local_ip():
    """
    Intenta encontrar la dirección IP local de la máquina en la red local.
    """
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # No necesita ser alcanzable, es solo para forzar la creación de una ruta
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'  # Fallback a localhost si no se puede determinar
    finally:
        s.close()
    return IP