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

       if (!response.ok) {
           throw new Error(
               data.error || "Error del servidor"
           );
       }

       addMessage(data.reply, "assistant");
       conversationHistory.push({
   role: "assistant",
   content: data.reply
});
   }
   catch (error) {
       loading.remove();

       addMessage(
           "Error: " + error.message,
           "assistant"
       );
   }
   finally {
       input.disabled = false;
       sendButton.disabled = false;
       input.focus();
   }
});