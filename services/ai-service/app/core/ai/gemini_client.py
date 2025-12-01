import requests
import logging
from typing import List, Dict, Any
from app.config import settings

logger = logging.getLogger(__name__)

class GeminiClient:
    """
    Cliente para interactuar con la API REST de Gemini 2.0 Flash.
    Encapsula la lógica de llamadas HTTP y manejo de errores.
    """
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.MODEL_NAME
        self.base_url = settings.GEMINI_ENDPOINT

    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 2048, temperature: float = 0.7) -> str:
        """
        Genera contenido usando el modelo Gemini.
        
        Args:
            system_prompt: Instrucciones del sistema.
            user_prompt: Consulta del usuario.
            max_tokens: Límite de tokens de salida.
            temperature: Creatividad (0.0 a 1.0).
            
        Returns:
            Texto generado por el modelo.
        """
        url = f"{self.base_url}/{self.model_name}:generateContent?key={self.api_key}"
        
        # Construcción del payload para Gemini
        # Nota: Gemini API v1beta usa 'contents' para el historial y 'systemInstruction' (en algunos modelos)
        # Para simplificar y compatibilidad general, a veces se inyecta system prompt en el primer mensaje.
        # Pero Gemini 1.5/2.0 soporta system_instruction.
        
        payload = {
            "contents": [
                {
                    "role": "user",
                    "parts": [{"text": f"{system_prompt}\n\nUser Query: {user_prompt}"}] 
                    # Simplificación: concatenamos system y user si la API específica de systemInstruction da problemas,
                    # pero lo ideal es usar el campo systemInstruction si está disponible.
                    # Probemos estructura estándar de chat.
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }

        headers = {
            "Content-Type": "application/json"
        }

        try:
            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code >= 400:
                logger.error(f"Gemini API Error ({response.status_code}): {response.text}")
                raise Exception(f"Gemini API returned status {response.status_code}")

            data = response.json()
            
            # Extraer texto
            try:
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                return text
            except (KeyError, IndexError) as e:
                logger.error(f"Error parsing Gemini response: {data}")
                raise Exception("Invalid response format from Gemini API")

        except Exception as e:
            logger.error(f"Error calling Gemini: {e}")
            raise

gemini_client = GeminiClient()
