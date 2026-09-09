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


// =====================================================
// FORMATO MARKDOWN
// =====================================================

function formatInlineMarkdown(text, element) {

   // Dividir el texto en partes con formato
   const parts = text.split(
       /(\*\*.*?\*\*|__.*?__|\*.*?\*|_.*?_|`.*?`)/g
   );

   parts.forEach(part => {

       if (!part) {
           return;
       }

       // Negrita **texto**
       if (
           part.startsWith("**") &&
           part.endsWith("**")
       ) {
           const strong = document.createElement("strong");
           strong.textContent = part.slice(2, -2);
           element.appendChild(strong);
       }

       // Negrita __texto__
       else if (
           part.startsWith("__") &&
           part.endsWith("__")
       ) {
           const strong = document.createElement("strong");
           strong.textContent = part.slice(2, -2);
           element.appendChild(strong);
       }

       // Cursiva *texto*
       else if (
           part.startsWith("*") &&
           part.endsWith("*")
       ) {
           const em = document.createElement("em");
           em.textContent = part.slice(1, -1);
           element.appendChild(em);
       }

       // Cursiva _texto_
       else if (
           part.startsWith("_") &&
           part.endsWith("_")
       ) {
           const em = document.createElement("em");
           em.textContent = part.slice(1, -1);
           element.appendChild(em);
       }

       // Código `texto`
       else if (
           part.startsWith("`") &&
           part.endsWith("`")
       ) {
           const code = document.createElement("code");
           code.textContent = part.slice(1, -1);
           element.appendChild(code);
       }

       // Texto normal
       else {
           element.appendChild(
               document.createTextNode(part)
           );
       }
   });
}


function renderMarkdown(text, container) {

   const lines = text.split("\n");

   let currentList = null;
   let currentListType = null;

   lines.forEach(line => {

       const trimmed = line.trim();

       // Línea vacía
       if (!trimmed) {

           currentList = null;
           currentListType = null;

           return;
       }


       // =================================================
       // BLOQUE DE CÓDIGO
       // =================================================

       if (trimmed.startsWith("```")) {

           const codeBlock = document.createElement("pre");
           const code = document.createElement("code");

           code.classList.add("code-block");

           code.textContent = trimmed.replace(
               /^```/,
               ""
           );

           codeBlock.appendChild(code);
           container.appendChild(codeBlock);

           return;
       }


       // =================================================
       // TITULOS
       // =================================================

       const headingMatch =
           trimmed.match(/^(#{1,3})\s+(.*)$/);

       if (headingMatch) {

           currentList = null;
           currentListType = null;

           const level =
               headingMatch[1].length;

           const heading =
               document.createElement(`h${level}`);

           formatInlineMarkdown(
               headingMatch[2],
               heading
           );

           container.appendChild(heading);

           return;
       }


       // =================================================
       // LISTA CON VIÑETAS
       // =================================================

       const unorderedMatch =
           trimmed.match(/^[-*]\s+(.*)$/);

       if (unorderedMatch) {

           if (currentListType !== "ul") {

               currentList =
                   document.createElement("ul");

               currentList.classList.add(
                   "markdown-list"
               );

               container.appendChild(
                   currentList
               );

               currentListType = "ul";
           }

           const li =
               document.createElement("li");

           formatInlineMarkdown(
               unorderedMatch[1],
               li
           );

           currentList.appendChild(li);

           return;
       }


       // =================================================
       // LISTA NUMERADA
       // =================================================

       const orderedMatch =
           trimmed.match(/^\d+\.\s+(.*)$/);

       if (orderedMatch) {

           if (currentListType !== "ol") {

               currentList =
                   document.createElement("ol");

               currentList.classList.add(
                   "markdown-list"
               );

               container.appendChild(
                   currentList
               );

               currentListType = "ol";
           }

           const li =
               document.createElement("li");

           formatInlineMarkdown(
               orderedMatch[1],
               li
           );

           currentList.appendChild(li);

           return;
       }


       // =================================================
       // CITA
       // =================================================

       const quoteMatch =
           trimmed.match(/^>\s?(.*)$/);

       if (quoteMatch) {

           currentList = null;
           currentListType = null;

           const blockquote =
               document.createElement("blockquote");

           formatInlineMarkdown(
               quoteMatch[1],
               blockquote
           );

           container.appendChild(
               blockquote
           );

           return;
       }


       // =================================================
       // LINEA SEPARADORA
       // =================================================

       if (
           trimmed === "---" ||
           trimmed === "***"
       ) {

           currentList = null;
           currentListType = null;

           container.appendChild(
               document.createElement("hr")
           );

           return;
       }


       // =================================================
       // PARRAFO
       // =================================================

       currentList = null;
       currentListType = null;

       const paragraph =
           document.createElement("p");

       formatInlineMarkdown(
           trimmed,
           paragraph
       );

       container.appendChild(
           paragraph
       );
   });
}


// =====================================================
// AGREGAR MENSAJE
// =====================================================

function addMessage(text, type) {

   const container =
       document.createElement("div");

   container.classList.add(
       "message",
       type
   );

   const label =
       document.createElement("div");

   label.classList.add(
       "message-label"
   );

   label.textContent =
       type === "user"
           ? "Tú"
           : "IA";

   const content =
       document.createElement("div");

   content.classList.add(
       "message-content"
   );


   // La IA usa Markdown
   if (type === "assistant") {

       renderMarkdown(
           text,
           content
       );

   }

   // Usuario y otros mensajes
   else {

       content.textContent = text;

   }


   container.appendChild(label);
   container.appendChild(content);

   messages.appendChild(container);

   messages.scrollTop =
       messages.scrollHeight;

   return container;
}


// =====================================================
// NUEVA CONVERSACIÓN
// =====================================================

function newConversation() {

   messages.innerHTML = "";

   conversationHistory = [];

   addMessage(
       "Hola. Soy tu asistente de Inteligencia Artificial. ¿En qué puedo ayudarte?",
       "assistant"
   );

   input.value = "";

   characterCount.textContent =
       "0 / 1000";

   input.disabled = false;
   sendButton.disabled = false;

   input.focus();
}


newChatButton.addEventListener(
   "click",
   newConversation
);


// =====================================================
// ENVÍO DEL MENSAJE
// =====================================================

form.addEventListener(
   "submit",
   async (event) => {

       event.preventDefault();

       const message =
           input.value.trim();

       if (!message) {
           return;
       }


       // Mostrar mensaje del usuario
       addMessage(
           message,
           "user"
       );


       // Guardar en historial
       conversationHistory.push({
           role: "user",
           content: message
       });


       input.value = "";
       input.disabled = true;
       sendButton.disabled = true;


       const loading =
           addMessage(
               "Pensando...",
               "loading"
           );


       try {

           const response =
               await fetch(
                   API_URL,
                   {
                       method: "POST",

                       headers: {
                           "Content-Type":
                               "application/json"
                       },

                       body: JSON.stringify({
                           message:
                               message,

                           history:
                               conversationHistory
                       })
                   }
               );


           const data =
               await response.json();


           loading.remove();


           // =================================================
           // MANEJO DE ERRORES
           // =================================================

           if (!response.ok) {

               let errorMessage;

               switch (
                   response.status
               ) {

                   case 400:
                       errorMessage =
                           "Error 400: Solicitud incorrecta. " +
                           (
                               data.error ||
                               "Los datos enviados no son válidos."
                           );
                       break;

                   case 403:
                       errorMessage =
                           "Error 403: Acceso prohibido. " +
                           (
                               data.error ||
                               "El origen de la solicitud no está autorizado."
                           );
                       break;

                   case 413:
                       errorMessage =
                           "Error 413: Petición demasiado grande. " +
                           (
                               data.error ||
                               "La información enviada supera el límite permitido."
                           );
                       break;

                   case 500:
                       errorMessage =
                           "Error 500: Error interno del servidor. " +
                           (
                               data.error ||
                               "No fue posible procesar la solicitud."
                           );
                       break;

                   default:
                       errorMessage =
                           `Error ${response.status}: ` +
                           (
                               data.error ||
                               "Ocurrió un error inesperado."
                           );
               }


               throw new Error(
                   errorMessage
               );
           }


           // =================================================
           // RESPUESTA DE LA IA
           // =================================================

           addMessage(
               data.reply,
               "assistant"
           );


           // Guardar respuesta
           conversationHistory.push({
               role: "assistant",
               content: data.reply
           });


       }
       catch (error) {

           if (
               loading.parentNode
           ) {
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
   }
);