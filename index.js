const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;
if (!token) throw new Error("BOT_TOKEN is missing!");

const bot = new TelegramBot(token, { polling: true });

const pending = new Map();
const cooldowns = new Map();

const replies = [
  { keys: ["salary", "payment", "payout"],
    answer: "💰 For salary updates, contact your authorized team manager.\n\n🇮🇳 सैलरी की जानकारी के लिए अपने टीम मैनेजर से संपर्क करें।" },
  { keys: ["reward", "rewards", "bonus"],
    answer: "🎁 Please check the latest official SITA Team reward announcement.\n\n🇮🇳 नए रिवॉर्ड की जानकारी के लिए SITA टीम का आधिकारिक अनाउंसमेंट देखें।" },
  { keys: ["referral", "refer", "invite"],
    answer: "👥 Please check the official referral rules.\n\n🇮🇳 रेफरल के नियमों के लिए आधिकारिक अनाउंसमेंट देखें।" },
  { keys: ["report", "screenshot"],
    answer: "📋 Submit genuine reports within your assigned deadline.\n\n🇮🇳 अपनी रिपोर्ट समय पर और सही जानकारी के साथ जमा करें।" },
  { keys: ["rules", "policy"],
    answer: "📌 Please follow the official SITA Team rules.\n\n🇮🇳 कृपया SITA टीम के आधिकारिक नियमों का पालन करें।" }
];

// Welcome every new human member.
bot.on("new_chat_members", async (msg) => {
  for (const member of msg.new_chat_members || []) {
    if (member.is_bot) continue;

    const welcome =
      `🎉 WELCOME TO SITA TEAM!\n\n` +
      `Hello and welcome! 👋\n\n` +
      `1. Are you a New User or an Existing User?\n\n` +
      `2. What is your Invitation Code?\n\n` +
      `━━━━━━━━━━━━━━━━━━\n\n` +
      `🎉 SITA टीम में आपका स्वागत है!\n\n` +
      `नमस्ते! 👋\n\n` +
      `1. क्या आप नए यूज़र हैं या पुराने यूज़र?\n\n` +
      `2. आपका Invitation Code क्या है?`;

    await bot.sendMessage(msg.chat.id, welcome, {
      reply_markup: {
        inline_keyboard: [[
          { text: "🆕 New User / नया यूज़र", callback_data: "type:new" },
          { text: "👤 Existing User / पुराना यूज़र", callback_data: "type:existing" }
        ]]
      }
    });
  }
});

// Handle user-type buttons.
bot.on("callback_query", async (query) => {
  const data = query.data || "";
  if (!data.startsWith("type:")) return;

  const chat = query.message?.chat;
  if (!chat || !["group", "supergroup"].includes(chat.type)) {
    await bot.answerCallbackQuery(query.id);
    return;
  }

  const type = data.slice(5);
  const key = `${chat.id}:${query.from.id}`;

  pending.set(key, { type, waiting: true });

  await bot.answerCallbackQuery(query.id, {
    text: type === "new" ? "New User selected!" : "Existing User selected!"
  });

  await bot.sendMessage(
    chat.id,
    type === "new"
      ? "🆕 You selected: NEW USER\n\n🇬🇧 Please enter your invitation code.\n🇮🇳 कृपया अपना Invitation Code भेजें।"
      : "👤 You selected: EXISTING USER\n\n🇬🇧 Please enter your invitation code.\n🇮🇳 कृपया अपना Invitation Code भेजें।"
  );
});

// Commands.
bot.onText(/^\/start(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id,
    "👋 Welcome to SITA Team Assistant!\n\nUse /help for available topics.");
});

bot.onText(/^\/help(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id,
    "🤖 SITA TEAM ASSISTANT\n\n" +
    "/help - Help\n/salary - Salary information\n" +
    "/rewards - Reward information\n\n" +
    "Ask about salary, rewards, referral, reports or rules.");
});

bot.onText(/^\/salary(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, replies[0].answer);
});

bot.onText(/^\/rewards(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, replies[1].answer);
});

// Process invitation codes and keyword questions.
bot.on("message", async (msg) => {
  try {
    if (!msg.text || msg.from?.is_bot) return;
    if (!["group", "supergroup"].includes(msg.chat.type)) return;

    const text = msg.text.trim();
    const key = `${msg.chat.id}:${msg.from.id}`;

    if (text.startsWith("/")) return;

    // If this member selected a user type, treat their next message as the code.
    if (pending.has(key)) {
      const details = pending.get(key);

      if (text.length > 100) {
        await bot.sendMessage(msg.chat.id,
          "Please send a valid invitation code.\nकृपया सही Invitation Code भेजें।");
        return;
      }

      pending.delete(key);

      await bot.sendMessage(msg.chat.id,
        `✅ INFORMATION RECEIVED\n\n` +
        `User Type: ${details.type === "new" ? "New User" : "Existing User"}\n` +
        `Invitation Code: ${text}\n\n` +
        `🇮🇳 धन्यवाद! आपकी जानकारी प्राप्त हो गई है।`
      );
      return;
    }

    // Match whole words to avoid accidental matches inside other words.
    const words = text.toLowerCase().match(/[a-z0-9]+/g) || [];
    const matched = replies.find(item =>
      item.keys.some(word => words.includes(word))
    );

    if (!matched) return;

    const now = Date.now();
    if (now - (cooldowns.get(key) || 0) < 4000) return;

    cooldowns.set(key, now);
    await bot.sendMessage(msg.chat.id, matched.answer, {
      reply_parameters: { message_id: msg.message_id },
      allow_sending_without_reply: true
    });
  } catch (error) {
    console.error("Message error:", error.message);
  }
});

bot.on("polling_error", (err) => {
  console.error("Telegram polling error:", err.message);
});

console.log("SITA Team Welcome & Reply Bot is running!");
