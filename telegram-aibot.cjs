<<<<<<< HEAD
const { Bot } = require('node-telegram-bot-api');

// ==========================================
// CONFIGURATION
// ==========================================
const TELEGRAM_BOT_TOKEN = "9248294635:AAHxRdaKt80Cxrc4OIRY6RjQnC3lRn0y3Ow";
const GROQ_API_KEY = "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";

// Initialize the v2 Bot instance
const bot = new Bot(TELEGRAM_BOT_TOKEN);

const SYSTEM_INSTRUCTION = `You are a helpful AI assistant named Uni-Aibot By Vathna. You must reply in the exact language the user uses. If the user writes in Khmer (ភាសាខ្មែរ), reply in natural, polite Khmer. If they write in English, reply in English.`;

const userHistories = {};

console.log("🤖 Telegram bot is running and waiting for messages...");

// v2 handler style using context (ctx)
bot.on('message', async (ctx) => {
  // Ensure message text exists
  if (!ctx.message || !ctx.message.text) return;

  const chatId = ctx.message.chat.id;
  const text = ctx.message.text;

  if (text === '/start') {
    await ctx.reply("Hello! I am Uni-Aibot By Vathna. You can talk to me in English or Khmer (ភាសាខ្មែរ).");
    return;
  }

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: 'user', content: text });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...userHistories[chatId]
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      await ctx.reply(`Error: ${data.error.message}`);
    } else if (data.choices && data.choices[0].message) {
      const reply = data.choices[0].message.content;
      userHistories[chatId].push({ role: 'assistant', content: reply });
      await ctx.reply(reply);
    } else {
      await ctx.reply("Unexpected response format from Groq.");
    }
  } catch (error) {
    console.error(error);
    await ctx.reply("Network or API connection error.");
  }
});

// Start long-polling
=======
const { Bot } = require('node-telegram-bot-api');

// ==========================================
// CONFIGURATION
// ==========================================
const TELEGRAM_BOT_TOKEN = "9248294635:AAHxRdaKt80Cxrc4OIRY6RjQnC3lRn0y3Ow";
const GROQ_API_KEY = "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";

// Initialize the v2 Bot instance
const bot = new Bot(TELEGRAM_BOT_TOKEN);

const SYSTEM_INSTRUCTION = `You are a helpful AI assistant named Uni-Aibot By Vathna. You must reply in the exact language the user uses. If the user writes in Khmer (ភាសាខ្មែរ), reply in natural, polite Khmer. If they write in English, reply in English.`;

const userHistories = {};

console.log("🤖 Telegram bot is running and waiting for messages...");

// v2 handler style using context (ctx)
bot.on('message', async (ctx) => {
  // Ensure message text exists
  if (!ctx.message || !ctx.message.text) return;

  const chatId = ctx.message.chat.id;
  const text = ctx.message.text;

  if (text === '/start') {
    await ctx.reply("Hello! I am Uni-Aibot By Vathna. You can talk to me in English or Khmer (ភាសាខ្មែរ).");
    return;
  }

  if (!userHistories[chatId]) {
    userHistories[chatId] = [];
  }

  userHistories[chatId].push({ role: 'user', content: text });

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          ...userHistories[chatId]
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (data.error) {
      await ctx.reply(`Error: ${data.error.message}`);
    } else if (data.choices && data.choices[0].message) {
      const reply = data.choices[0].message.content;
      userHistories[chatId].push({ role: 'assistant', content: reply });
      await ctx.reply(reply);
    } else {
      await ctx.reply("Unexpected response format from Groq.");
    }
  } catch (error) {
    console.error(error);
    await ctx.reply("Network or API connection error.");
  }
});

// Start long-polling
>>>>>>> 0d0e30e (Initial commit for Uni-Aibot By Vathna)
bot.startPolling();