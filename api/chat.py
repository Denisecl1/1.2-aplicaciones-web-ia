import json
import os

from http.server import BaseHTTPRequestHandler
from openai import OpenAI


ALLOWED_ORIGIN = os.environ.get(
    "ALLOWED_ORIGIN",
    ""
).rstrip("/")


class handler(BaseHTTPRequestHandler):

    def add_cors_headers(self):
        origin = self.headers.get("Origin", "")

        if ALLOWED_ORIGIN and origin == ALLOWED_ORIGIN:
            self.send_header(
                "Access-Control-Allow-Origin",
                origin
            )
            self.send_header("Vary", "Origin")


    def send_json(self, status_code, data):
        body = json.dumps(
            data,
            ensure_ascii=False
        ).encode("utf-8")

        self.send_response(status_code)
        self.send_header(
            "Content-Type",
            "application/json; charset=utf-8"
        )
        self.add_cors_headers()
        self.send_header(
            "Content-Length",
            str(len(body))
        )
        self.end_headers()

        self.wfile.write(body)


    def do_OPTIONS(self):
        origin = self.headers.get("Origin", "")

        if ALLOWED_ORIGIN and origin != ALLOWED_ORIGIN:
            self.send_response(403)
            self.end_headers()
            return

        self.send_response(204)
        self.add_cors_headers()
        self.send_header(
            "Access-Control-Allow-Methods",
            "POST, OPTIONS"
        )
        self.send_header(
            "Access-Control-Allow-Headers",
            "Content-Type"
        )
        self.send_header(
            "Access-Control-Max-Age",
            "86400"
        )
        self.end_headers()


    def do_GET(self):
        self.send_json(
            405,
            {
                "error":
                    "Este endpoint solamente acepta POST."
            }
        )


    def do_POST(self):
        try:
            origin = self.headers.get("Origin", "")

            if ALLOWED_ORIGIN and origin != ALLOWED_ORIGIN:
                self.send_json(
                    403,
                    {"error": "Origen no autorizado."}
                )
                return

            content_length = int(
                self.headers.get("Content-Length", 0)
            )

            if content_length <= 0 or content_length > 15000:
                self.send_json(
                    413,
                    {"error": "Petición no válida o demasiado grande."}
                )
                return

            body = self.rfile.read(content_length)

            data = json.loads(
                body.decode("utf-8")
            )

            message = str(
                data.get("message", "")
            ).strip()

            if not message:
                self.send_json(
                    400,
                    {"error": "Es necesario escribir un mensaje."}
                )
                return

            if len(message) > 1000:
                self.send_json(
                    400,
                    {"error": "El mensaje supera los 1000 caracteres."}
                )
                return

            # =====================================================
            # HISTORIAL CONVERSACIONAL
            # =====================================================

            history = data.get("history", [])

            if not isinstance(history, list):
                history = []

            # Conservar solamente los últimos 10 mensajes
            history = history[-10:]

            clean_history = []

            for item in history:
                if not isinstance(item, dict):
                    continue

                role = item.get("role")
                content = item.get("content")

                if role not in ("user", "assistant"):
                    continue

                if not isinstance(content, str):
                    continue

                content = content.strip()

                if not content:
                    continue

                # Evitar mensajes excesivamente largos
                content = content[:2000]

                clean_history.append({
                    "role": role,
                    "content": content
                })

            api_key = os.environ.get(
                "OPENAI_API_KEY"
            )

            if not api_key:
                self.send_json(
                    500,
                    {"error": "OPENAI_API_KEY no está configurada."}
                )
                return

            client = OpenAI(
                api_key=api_key
            )

            # =====================================================
            # CONTEXTO + MENSAJE ACTUAL
            # =====================================================

            conversation_input = clean_history

            response = client.responses.create(
                model="gpt-5.6-luna",

                instructions="""
Eres un asistente educativo especializado en Ciberseguridad.

Tu objetivo es ayudar a estudiantes a comprender conceptos,
principios y buenas prácticas de seguridad informática.

Responde siempre en español, de manera clara, breve y didáctica.
Explica los conceptos técnicos con lenguaje sencillo y utiliza
ejemplos prácticos cuando ayuden a comprender mejor el tema.

Puedes explicar temas como:
- Contraseñas seguras y autenticación.
- Phishing e ingeniería social.
- Malware y ransomware.
- Seguridad de redes.
- Cifrado y protección de datos.
- Control de acceso.
- Vulnerabilidades y actualizaciones.
- Seguridad en aplicaciones web.
- Copias de seguridad.
- Privacidad y seguridad digital.

Cuando sea posible, relaciona los conceptos con situaciones
cotidianas para facilitar el aprendizaje.

Utiliza el historial de la conversación para comprender preguntas
que dependan de mensajes anteriores.

No solicites ni reveles contraseñas, API keys, tokens,
credenciales u otros datos sensibles.
""",

                input=conversation_input,

                reasoning={
                    "effort": "none"
                },

                max_output_tokens=500
            )

            self.send_json(
                200,
                {
                    "reply":
                        response.output_text
                }
            )

        except json.JSONDecodeError:
            self.send_json(
                400,
                {"error": "El cuerpo no contiene JSON válido."}
            )

        except Exception as error:
            print(
                f"Error en /api/chat: "
                f"{type(error).__name__}: {error}"
            )

            self.send_json(
                500,
                {
                    "error":
                        "No fue posible consultar el modelo de IA."
                }
            )
