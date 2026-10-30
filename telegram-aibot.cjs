require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');

// ==========================================
// CONFIGURATION (Loaded securely from .env & Render)
// ==========================================
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Initialize the TelegramBot instance with polling enabled
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

const SYSTEM_INSTRUCTION = `You are a helpful AI assistant named Uni-Aibot By Vathna. You must reply in the exact language the user uses. If the user writes in Khmer (ភាសាខ្មែរ), reply in natural, polite Khmer. If they write in English, reply in English.`;

const userHistories = {};

console.log("🤖 Telegram bot is running and waiting for messages...");

// Helper function to send images directly using Pollinations URL
async function sendGeneratedImage(chatId, promptText) {
  await bot.sendMessage(chatId, "🎨 Generating your realistic image, please wait...");

  try {
    const realisticPrompt = `${promptText}, photorealistic 8k resolution, real camera photography, highly detailed, cinematic lighting`;
    const encodedPrompt = encodeURIComponent(realisticPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux&width=1280&height=720&nologo=true`;

    await bot.sendPhoto(chatId, imageUrl, {
      caption: `🎨 Generated photo for: "${promptText}"`
    });
  } catch (error) {
    console.error("Image generation error details:", error);
    await bot.sendMessage(chatId, "Sorry, I failed to generate the image. Please try again.");
  }
}

bot.on('message', async (msg) => {
  if (!msg) return;

  const chatId = msg.chat.id;
  let text = msg.text || msg.caption || "";

  // 1. Handle /start command
  if (text === '/start') {
    await bot.sendMessage(chatId, "Hello! I am Uni-Aibot By Vathna. You can chat with me in English or Khmer (ភាសាខ្មែរ).\n\n🎨 **Generate an image:** Simply ask me to 'generate a car', 'draw a sunset', or use `/image [description]`!\n📎 **Send attachments:** Send photos or documents for me to analyze!");
    return;
  }

  // 2. Explicit /image command
  if (text.startsWith('/image ')) {
    const prompt = text.replace('/image ', '').trim();
    if (!prompt) {
      await bot.sendMessage(chatId, "Please provide a description. Example: `/image a red sports car`");
      return;
    }
    await sendGeneratedImage(chatId, prompt);
    return;
  }

  // 3. Robust Smart Intent Detection
  const lowerText = text.toLowerCase().trim();
  const imageTriggers = [
    'generate ', 'draw ', 'create an image of ', 'make a picture of ', 
    'show me a picture of ', 'picture of ', 'i want to generate ', 'i want a picture of '
  ];
  
  let isImageRequest = imageTriggers.some(trigger => lowerText.startsWith(trigger)) || lowerText === 'picture' || lowerText === 'image';

  if (isImageRequest) {
    let cleanPrompt = text;
    for (const trigger of imageTriggers) {
      if (lowerText.includes(trigger)) {
        const index = lowerText.indexOf(trigger);
        cleanPrompt = text.substring(index + trigger.length).trim();
        break;
      }
    }
    if (cleanPrompt.length > 0 && cleanPrompt !== 'picture' && cleanPrompt !== 'image') {
      await sendGeneratedImage(chatId, cleanPrompt);
      return;
    }
  }

  // 4. Handle incoming Photo attachments
  let imageUrl = null;
  if (msg.photo && msg.photo.length > 0) {
    const fileId = msg.photo[msg.photo.length - 1].file_id;
    try {
      const file = await bot.getFile(fileId);
      if (file && file.file_path) {
        imageUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
      }
      if (!text) text = "Please describe this image.";
    } catch (err) {
      console.error("Error fetching photo link:", err);
    }
  }

  // 5. Handle incoming Document attachments
  let documentText = "";
  if (msg.document) {
    try {
      const fileId = msg.document.file_id;
      const file = await bot.getFile(fileId);
      if (file && file.file_path) {
        const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`;
        const fileResponse = await fetch(fileUrl);
        let rawContent = await fileResponse.text();
        
        if (rawContent.length > 8000) {
          documentText = rawContent.substring(0, 8000) + "\n[Content truncated due to length...]";
        } else {
          documentText = rawContent;
        }
      }
      if (!text) text = "Please analyze the contents of this file.";
    } catch (err) {
      console.error("Error reading document:", err);
      documentText = "[Error reading attached document content]";
    }
  }

  if (!text && !imageUrl && !documentText) return;

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  // 6. Determine model and content structure
  let modelName = "openai/gpt-oss-120b";
  let finalUserContent = text;

  if (documentText) {
    finalUserContent = `${text}\n\n[Attached File Content]:\n${documentText}`;
  }

  if (imageUrl) {
    modelName = "qwen/qwen3.8-27b";
    finalUserContent = [
      { type: "text", text: text },
      { type: "image_url", image_url: { url: imageUrl } }
    ];
  }

  userHistories[chatId].push({ role: 'user', content: finalUserContent });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: modelName,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...userHistories[chatId]
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      await bot.sendMessage(chatId, `Error: ${data.error.message}`);
    } else if (data.choices && data.choices[0].message) {
      const reply = data.choices[0].message.content;
      userHistories[chatId].push({ role: 'assistant', content: reply });
      
      if (reply.length > 4000) {
        await bot.sendMessage(chatId, reply.substring(0, 4000) + "\n\n[Response truncated due to length]");
      } else {
        await bot.sendMessage(chatId, reply);
      }
    } else {
      await bot.sendMessage(chatId, "Unexpected response format from Groq.");
    }
  } catch (error) {
    console.error(error);
    await bot.sendMessage(chatId, "Network or API connection error.");
  }
});