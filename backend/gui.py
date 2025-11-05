# gui.py
# Gestiona el bucle de la interfaz gráfica de usuario con OpenCV.

import cv2
import queue
import logging
from config import DISPLAY_WIDTH, DISPLAY_HEIGHT, WINDOW_NAME

def gui_loop(frame_queue: queue.Queue):
    """
    Se ejecuta en el hilo principal, consume fotogramas de la cola
    y los muestra en una ventana de TAMAÑO FIJO.
    """
    # Usar WINDOW_NORMAL para permitir un tamaño de ventana fijo y redimensionable por el usuario
    cv2.namedWindow(WINDOW_NAME, cv2.WINDOW_NORMAL)
    cv2.resizeWindow(WINDOW_NAME, DISPLAY_WIDTH, DISPLAY_HEIGHT)

    logging.info("GUI iniciada. Esperando fotogramas... Presiona 'q' en la ventana para salir.")

    while True:
        try:
            # get() es bloqueante, con timeout para no bloquear indefinidamente el cierre del programa
            frame = frame_queue.get(timeout=1)
            
            # Redimensionar cada fotograma al tamaño de visualización estándar
            # Se utiliza interpolación lineal, que es rápida y de buena calidad para video.
            display_frame = cv2.resize(frame, (DISPLAY_WIDTH, DISPLAY_HEIGHT), interpolation=cv2.INTER_LINEAR)
            
            cv2.imshow(WINDOW_NAME, display_frame)
            
            # Espera 1ms por una tecla. Si es 'q', sal del bucle.
            if cv2.waitKey(1) & 0xFF == ord('q'):
                logging.info("Tecla 'q' presionada. Cerrando la aplicación.")
                break
        except queue.Empty:
            # Esto es normal si no llegan fotogramas durante el timeout
            continue
        except Exception as e:
            logging.error(f"Error en el bucle de la GUI: {e}")
            break
            
    cv2.destroyAllWindows()