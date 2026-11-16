import { marked } from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";
import DOMPurify from "https://cdn.jsdelivr.net/npm/dompurify/dist/purify.es.mjs";

const canvas = document.getElementById("bg-canvas");
const ctx = canvas.getContext("2d");

const output = document.getElementById("output");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");

const chatHistory = [];

let selectedBot = "pennsbot";
let waitingForResponse = false;

const botToggle = document.createElement("div");
botToggle.className = "bot-toggle";

const pennsbotButton = document.createElement("button");
pennsbotButton.textContent = "Penn's Bot";
pennsbotButton.className = "active";
pennsbotButton.type = "button";

<<<<<<< HEAD:buggle bot/bot.js
const buckoButton = document.createElement("button");
buckoButton.textContent = "BuckoBot";
buckoButton.type = "button";

botToggle.append(buggleButton, buckoButton);
=======
botToggle.append(pennsbotButton);
>>>>>>> 06759c7440b019387829fcb583f5741f7aedcd49:bot/bot.js

chatForm.before(botToggle);

function selectBot(bot) {
  selectedBot = bot;

<<<<<<< HEAD:buggle bot/bot.js
  buggleButton.classList.toggle("active", bot === "BuggleBot");
  buckoButton.classList.toggle("active", bot === "BuckoBot");
=======
  pennsbotButton.classList.toggle("active", bot === "pennsbot")
>>>>>>> 06759c7440b019387829fcb583f5741f7aedcd49:bot/bot.js

  addMessage("System", `Switched to ${bot}.`);
}

pennsbotButton.addEventListener("click", () => {
  selectBot("pennsbot");
});


function addMessage(sender, htmlContent, isUser = false) {
  const wrapper = document.createElement("div");

  wrapper.className = isUser ? "message user-message" : "message bot-message";

  wrapper.style.marginBottom = "12px";

  const label = document.createElement("strong");
  label.textContent = `${sender}: `;

  const body = document.createElement("div");
  body.innerHTML = DOMPurify.sanitize(htmlContent);

  wrapper.append(label, body);
  output.appendChild(wrapper);

  output.scrollTop = output.scrollHeight;

  return body;
}

chatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (waitingForResponse) return;

  const prompt = chatInput.value.trim();

  if (!prompt) return;

  addMessage("You", prompt, true);

  chatHistory.push({
    role: "user",
    content: prompt,
  });

  chatInput.value = "";

  const botBubble = addMessage(selectedBot, "<em>Thinking...</em>");

  waitingForResponse = true;
  chatInput.disabled = true;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot: selectedBot,
        messages: chatHistory.slice(-20),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    if (!data.response) {
      throw new Error("The bot returned an empty response.");
    }

    botBubble.innerHTML = DOMPurify.sanitize(marked.parse(data.response));

    chatHistory.push({
      role: "assistant",
      content: data.response,
    });

    output.scrollTop = output.scrollHeight;
  } catch (error) {
    console.error(error);
    botBubble.textContent = `Error: ${error.message}`;
  } finally {
    waitingForResponse = false;
    chatInput.disabled = false;
    chatInput.focus();
  }
});

let targetX = window.innerWidth / 2;
let currentX = targetX;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  currentX += (targetX - currentX) * 0.08;

  const rawRatio = Math.max(0, Math.min(1, currentX / canvas.width));
  const stopPosition = 0.2 + rawRatio * 0.6;

  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);

  gradient.addColorStop(0, "rgba(0, 0, 0, 0.04)");
  gradient.addColorStop(stopPosition, "rgba(255, 255, 255, 0.12)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.04)");

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  requestAnimationFrame(draw);
}

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  targetX = event.clientX - rect.left;
});

window.addEventListener("resize", resizeCanvas);

resizeCanvas();
draw();
