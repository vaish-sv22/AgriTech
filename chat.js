const USE_AI_FALLBACK = true;

// Rule-based fallback responses (offline mode)
const RULE_BASED_FALLBACKS = {
  soil: "Healthy soil is essential for good yields. Add organic compost, avoid excessive chemical use, and test soil regularly.",
  crop: "Crop management involves selecting suitable crops for the season, timely sowing, and monitoring pests and diseases.",
  crops: "Proper crop care includes crop rotation, pest control, balanced fertilization, and timely irrigation.",
  water: "Efficient water management includes drip or sprinkler irrigation and avoiding overwatering.",
  irrigation: "Irrigation should be scheduled based on crop growth stage and soil moisture levels.",
  fertilizer: "Fertilizers should be applied based on soil test results. Overuse can damage crops and soil health."
};

const DEFAULT_FALLBACK_MESSAGE =
  "I’m currently running in offline mode. Here’s some general advice: focus on soil health, proper irrigation, and timely crop care.";

const FALLBACK_MESSAGES = [
  "I did not fully catch that, but I can still help. Try asking about crop diseases, irrigation planning, or soil health.",
  "I could not find an exact answer yet. Ask me about crop recommendation, weather impact, pest control, or fertilizers.",
  "Let us try a more specific question. You can ask: best crops for your state, disease prevention, or water-saving techniques."
];

const MIN_TYPING_DELAY_MS = 700;
const MAX_TYPING_DELAY_MS = 2200;

document.addEventListener('DOMContentLoaded', () => {
  // --- BUG FIX: DYNAMIC COPYRIGHT YEAR ---
  const yearElement = document.getElementById('current-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  const chatWindow = document.getElementById('chat-window');
  const chatForm = document.getElementById('chat-form');
  const chatInput = document.getElementById('chat-input');
  const sendBtn = document.getElementById('send-button');

  // Initialize JSON-based chatbot
  const jsonChatbot = new JSONChatbot();

  // HTML escaping function to prevent XSS
  function escapeHtml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  // Secure message rendering
  function displayMessage(messageContent, sender) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const name = sender === 'user' ? 'You' : 'AgriBot';

    const headerDiv = document.createElement('div');
    headerDiv.className = 'message-header';

    const icon = document.createElement('i');
    icon.className = `fas fa-${sender === 'user' ? 'user' : 'robot'}`;
    headerDiv.appendChild(icon);
    headerDiv.appendChild(document.createTextNode(` ${name}`));

    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = format(escapeHtml(messageContent));

    const timeDiv = document.createElement('div');
    timeDiv.className = 'timestamp';
    timeDiv.textContent = time;

    messageElement.appendChild(headerDiv);
    messageElement.appendChild(textDiv);
    messageElement.appendChild(timeDiv);

    chatWindow.appendChild(messageElement);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('suggestion')) {
      chatInput.value = e.target.textContent;
      chatForm.dispatchEvent(new Event('submit'));
    }
  });

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const getRandomFallbackMessage = () => {
    const randomIndex = Math.floor(Math.random() * FALLBACK_MESSAGES.length);
    return FALLBACK_MESSAGES[randomIndex] || DEFAULT_FALLBACK_MESSAGE;
  };

  const getRuleBasedFallback = (input) => {
    const lowerInput = (input || '').toLowerCase();
    for (const keyword in RULE_BASED_FALLBACKS) {
      if (lowerInput.includes(keyword)) {
        return RULE_BASED_FALLBACKS[keyword];
      }
    }
    return getRandomFallbackMessage();
  };

  const sanitizeReply = (reply) => {
    const normalized = String(reply || '').trim();
    if (!normalized) return '';

    const weakReplies = [
      'i do not know',
      'cannot help',
      'unable to process',
      'something went wrong',
      'try again'
    ];

    const normalizedLower = normalized.toLowerCase();
    const isWeak = weakReplies.some((item) => normalizedLower.includes(item));
    return isWeak ? '' : normalized;
  };

  const computeTypingDelay = (userInput, botReply, hasImage) => {
    const inputLength = (userInput || '').length;
    const replyLength = (botReply || '').length;
    const base = hasImage ? 1000 : 750;
    const dynamic = Math.min(900, Math.floor((inputLength + replyLength) * 2.2));
    return Math.max(MIN_TYPING_DELAY_MS, Math.min(MAX_TYPING_DELAY_MS, base + dynamic));
  };

  const resolveLocalResponse = async (input) => {
    try {
      const details = await jsonChatbot.getResponseDetails(input);
      if (details && details.response) {
        return details.response;
      }
    } catch (error) {
      console.warn('Local response matching failed:', error);
    }
    return getRuleBasedFallback(input);
  };

  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = chatInput.value.trim();

    if (!input && !window.selectedImageBase64) return;

    if (input.length > 1000) {
      alert('Message too long. Please keep messages under 1000 characters.');
      return;
    }

    displayMessage(input || "Analyzing uploaded image...", 'user');
    chatInput.value = '';
    chatInput.style.height = 'auto';

    const typing = showTyping(window.selectedImageBase64 ? 'AgriBot is analyzing your image' : 'AgriBot is typing');
    toggleInput(true);
    const startedAt = Date.now();

    try {
      let reply = "";

      if (USE_AI_FALLBACK && (window.selectedImageBase64 || input)) {
        setTypingText(typing, window.selectedImageBase64 ? 'Checking crop and disease patterns...' : 'Understanding your question...');

        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: input || "Identify crop and disease from image.",
            image: window.selectedImageBase64 || null
          })
        });

        if (res.ok) {
          const data = await res.json();
          reply = sanitizeReply(data.reply);
          if (!reply) {
            reply = await resolveLocalResponse(input);
          }
        } else {
          reply = await resolveLocalResponse(input);
        }
      } else {
        reply = await resolveLocalResponse(input);
      }

      setTypingText(typing, 'Finalizing answer...');
      const typingDelay = computeTypingDelay(input, reply, Boolean(window.selectedImageBase64));
      const elapsed = Date.now() - startedAt;
      if (elapsed < typingDelay) {
        await delay(typingDelay - elapsed);
      }

      displayMessage(reply || DEFAULT_FALLBACK_MESSAGE, 'bot');
      if (typeof clearImage === "function") clearImage();

    } catch (error) {
      console.error('Chatbot Error:', error);
      const fallbackReply = await resolveLocalResponse(input);
      displayMessage(fallbackReply, 'bot');
    } finally {
      typing.remove();
      toggleInput(false);
    }
  });

  const showTyping = (labelText) => {
    const typing = document.createElement('div');
    typing.className = 'typing-indicator';
    typing.innerHTML = `<div class="typing-text">${escapeHtml(labelText || 'AgriBot is typing')}</div><span></span><span></span><span></span>`;
    chatWindow.appendChild(typing);
    chatWindow.scrollTop = chatWindow.scrollHeight;
    return typing;
  };

  const setTypingText = (typingElement, text) => {
    if (!typingElement) return;
    const textElement = typingElement.querySelector('.typing-text');
    if (textElement) {
      textElement.textContent = text;
    }
  };

  const toggleInput = (disable) => {
    sendBtn.disabled = disable;
    chatInput.disabled = disable;
    if (!disable) chatInput.focus();
  };

  const format = (txt) =>
    txt.replace(/\n/g, '<br>')
       .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
       .replace(/\*(.*?)\*/g, '<em>$1</em>')
       .replace(/`(.*?)`/g, '<code>$1</code>');

  setTimeout(() => {
    displayMessage(
      "Hello! 🌱 I'm AgriBot, your AI assistant for AgriTech platform and farming guidance. I can help you navigate our tools, answer agriculture questions, recommend crops based on your region and season, and provide farming advice. How can I assist you today?",
      'bot'
    );
  }, 500);

  chatInput.focus();
});

// 🌙 GLOBAL DARK/LIGHT MODE FIX (Mobile + Desktop Toggle)
document.addEventListener("DOMContentLoaded", function () {
  const toggleButtons = document.querySelectorAll(".theme-toggle, .nav-btn");

  toggleButtons.forEach((btn) => {
    // Only attach to buttons that contain Dark or Light text
    if (
      btn.textContent.toLowerCase().includes("dark") ||
      btn.textContent.toLowerCase().includes("light")
    ) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation(); // critical for mobile sidebar overlay

        document.body.classList.toggle("dark-mode");

        // Save theme preference
        if (document.body.classList.contains("dark-mode")) {
          localStorage.setItem("theme", "dark");
          btn.innerHTML = "☀️ Light Mode";
        } else {
          localStorage.setItem("theme", "light");
          btn.innerHTML = "🌙 Dark Mode";
        }
      });
    }
  });

  // Apply saved theme on page load
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
  }
});

const chatInput = document.getElementById("chat-input");
const chatForm = document.getElementById("chat-form");

// Auto expand textarea
chatInput.addEventListener("input", function () {
  this.style.height = "auto";
  this.style.height = this.scrollHeight + "px";
});

// Enter vs Shift+Enter
chatInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    chatForm.dispatchEvent(new Event("submit"));
  }
});