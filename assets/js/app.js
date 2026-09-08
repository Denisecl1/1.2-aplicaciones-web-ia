const API_URL = "https://1-2-aplicaciones-web-ia-1p4u.vercel.app/api/chat";

const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("sendButton");
const characterCount = document.getElementById("characterCount");
const newChatButton = document.getElementById("newChatButton");

let conversationHistory = [];

input.addEventListener("input", () => {
   characterCount.textContent =
       `${input.value.length} / 1000`;
});

function addMessage(text, type) {
   const container = document.createElement("div");
   container.classList.add("message", type);

   const label = document.createElement("div");
   label.classList.add("message-label");
   label.textContent = type === "user" ? "Tú" : "IA";

   const content = document.createElement("div");
   content.classList.add("message-content");
   content.textContent = text;

   container.appendChild(label);
   container.appendChild(content);
   messages.appendChild(container);

   messages.scrollTop = messages.scrollHeight;

   return container;
}

function newConversation() {
   // Eliminar todos los mensajes actuales
   messages.innerHTML = "";

   // Limpiar historial conversacional
   conversationHistory = [];

   // Restaurar el saludo inicial
   addMessage(
       "Hola. Soy tu asistente de Inteligencia Artificial. ¿En qué puedo ayudarte?",
       "assistant"
   );

   // Limpiar el campo de texto
   input.value = "";

   // Restaurar el contador
   characterCount.textContent = "0 / 1000";

   // Asegurar que el campo esté disponible
   input.disabled = false;
   sendButton.disabled = false;

   // Colocar el cursor en el campo
   input.focus();
}

newChatButton.addEventListener("click", newConversation);

form.addEventListener("submit", async (event) => {
   event.preventDefault();

   const message = input.value.trim();

   if (!message) {
       return;
   }

   addMessage(message, "user");

   // Guardar mensaje del usuario
   conversationHistory.push({
       role: "user",
       content: message
   });

   input.value = "";
   input.disabled = true;
   sendButton.disabled = true;

   const loading = addMessage("Pensando...", "loading");

   try {
       const response = await fetch(API_URL, {
           method: "POST",
           headers: {
               "Content-Type": "application/json"
           },
           body: JSON.stringify({
               message: message,
               history: conversationHistory
           })
       });

       const data = await response.json();

       loading.remove();

       // ==========================================
       // RETO 5 - MANEJO DE ERRORES
       // ==========================================

       if (!response.ok) {

           let errorMessage;

           switch (response.status) {

               case 400:
                   errorMessage =
                       "Error 400: Solicitud incorrecta. " +
                       (data.error ||
                        "Los datos enviados no son válidos.");
                   break;

               case 403:
                   errorMessage =
                       "Error 403: Acceso prohibido. " +
                       (data.error ||
                        "No tienes permiso para realizar esta solicitud.");
                   break;

               case 413:
                   errorMessage =
                       "Error 413: Petición demasiado grande. " +
                       (data.error ||
                        "La información enviada supera el límite permitido.");
                   break;

               case 500:
                   errorMessage =
                       "Error 500: Error interno del servidor. " +
                       (data.error ||
                        "No fue posible procesar la solicitud.");
                   break;

               default:
                   errorMessage =
                       `Error ${response.status}: ` +
                       (data.error ||
                        "Ocurrió un error inesperado.");
           }

           throw new Error(errorMessage);
       }

       // ==========================================
       // RESPUESTA CORRECTA
       // ==========================================

       addMessage(data.reply, "assistant");

       // Guardar respuesta de la IA
       conversationHistory.push({
           role: "assistant",
           content: data.reply
       });

   }
   catch (error) {

       // Evitar error si loading ya no existe
       if (loading.parentNode) {
           loading.remove();
       }

       addMessage(
           error.message,
           "assistant"
       );
   }

   finally {
       input.disabled = false;
       sendButton.disabled = false;
       input.focus();
   }
});
