
const GROQ_API_KEY = "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";

const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');
const langBtn = document.getElementById('lang-btn');
const shareBtn = document.getElementById('share-btn');
const appTitle = document.getElementById('app-title');
const sendBtn = document.getElementById('send-btn');
const welcomeMsg = document.getElementById('welcome-msg');

let currentLang = 'en'; 
let chatHistory = [];

const SYSTEM_INSTRUCTION = `You are a helpful AI assistant. You must reply in the exact language the user uses. If the user writes in Khmer (ភាសាខ្មែរ), reply in natural, polite Khmer. If they write in English, reply in English.`;

const translations = {
  en: {
    title: "Uni-Ai bot by Vathna",
    placeholderInput: "Type a message in Khmer or English...",
    send: "Send",
    welcome: "Hello! You can talk to me in English or Khmer (ភាសាខ្មែរ). Start chatting below!",
    langBtn: "🇰🇭 ភាសាខ្មែរ",
    thinking: "Thinking...",
    copiedShare: "Shareable link copied to clipboard!"
  },
  km: {
    title: "កម្មវិធីជជែក AI Vathna",
    placeholderInput: "សរសេរសារជាភាសាខ្មែរ ឬអង់គ្លេស...",
    send: "ផ្ញើ",
    welcome: "សួស្តី! អ្នកអាចជជែកជាមួយខ្ញុំជាភាសាអង់គ្លេស ឬភាសាខ្មែរបាន។ ចាប់ផ្តើមជជែកខាងក្រោម!",
    langBtn: "🇬🇧 English",
    thinking: "កំពុងគិត...",
    copiedShare: "បានចម្លងតំណភ្ជាប់ (Link) សម្រាប់ចែករំលែករួចរាល់!"
  }
};

langBtn.addEventListener('click', () => {
  currentLang = currentLang === 'en' ? 'km' : 'en';
  const t = translations[currentLang];
  
  appTitle.textContent = t.title;
  userInput.placeholder = t.placeholderInput;
  sendBtn.textContent = t.send;
  langBtn.textContent = t.langBtn;
  welcomeMsg.textContent = t.welcome;
});

shareBtn.addEventListener('click', () => {
  const shareUrl = window.location.origin + window.location.pathname;
  navigator.clipboard.writeText(shareUrl).then(() => {
    alert(translations[currentLang].copiedShare);
  });
});

function appendMessage(text, className) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', className);
  messageElement.textContent = text;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const text = userInput.value.trim();
  if (!text) return;

  appendMessage(text, 'user-message');
  userInput.value = '';
  userInput.focus();

  chatHistory.push({ role: 'user', content: text });

  const loadingMessage = document.createElement('div');
  loadingMessage.classList.add('message', 'bot-message');
  loadingMessage.textContent = translations[currentLang].thinking;
  chatBox.appendChild(loadingMessage);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b", // Updated to current active model ID
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...chatHistory
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    chatBox.removeChild(loadingMessage);

    if (data.error) {
      appendMessage(`Error: ${data.error.message}`, 'bot-message');
    } else if (data.choices && data.choices[0].message) {
      const reply = data.choices[0].message.content;
      chatHistory.push({ role: 'assistant', content: reply });
      appendMessage(reply, 'bot-message');
    } else {
      appendMessage("Unexpected response format from Groq.", 'bot-message');
    }
  } catch (error) {
    chatBox.removeChild(loadingMessage);
    appendMessage("Network or API connection error.", 'bot-message');
    console.error(error);
  }
});