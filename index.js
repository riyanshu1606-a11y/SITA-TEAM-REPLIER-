const TelegramBot = require("node-telegram-bot-api");

const token = process.env.BOT_TOKEN;

if (!token) {
  throw new Error("BOT_TOKEN is missing from Render environment variables.");
}

const bot = new TelegramBot(token, { polling: true });

const replies = [
  {
    keywords: ["hello", "hey", "hii", "hi"],
    answer: "👋 Welcome to SITA Team! Type /help to see what I can answer."
  },
  {
    keywords: ["salary", "payment", "payout"],
    answer: "💰 For individual salary and payment updates, contact your authorized team manager."
  },
  {
    keywords: ["reward", "rewards", "bonus", "bonuses"],
    answer: "🎁 Check the latest official SITA Team announcement for current rewards, eligibility and deadlines."
  },
  {
    keywords: ["referral", "refer", "invite", "invitation"],
    answer: "👥 Check the official referral rules for current requirements and reward conditions."
  },
  {
    keywords: ["report", "reporting", "screenshot"],
    answer: "📋 Submit genuine reports and required screenshots within your assigned deadline."
  },
  {
    keywords: ["rules", "warning", "policy"],
    answer: "📌 Follow official team instructions, submit accurate reports and inform your manager about leave."
  },
  {
    keywords: ["leave", "absent", "holiday"],
    answer: "🗓️ Inform your team manager and follow the official leave procedure."
  },
  {
    keywords: ["task", "tasks", "duty"],
    answer: "✅ Follow the latest task instructions and deadlines from your authorized team manager."
  },
  {
    keywords: ["admin", "manager", "support", "help"],
    answer: "🛟 Contact an authorized SITA Team manager for account-specific assistance."
  }
];

const cooldowns = new Map();

bot.onText(/^\/start(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "👋 Welcome to SITA Team Assistant!\n\nI answer common questions about salary, rewards, referrals, reports and tasks.\n\nUse /help to see available commands."
  ).catch(console.error);
});

bot.onText(/^\/help(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(
    msg.chat.id,
    "🤖 SITA TEAM REPLIER\n\n" +
    "/help - Show help\n" +
    "/salary - Salary information\n" +
    "/rewards - Reward information\n" +
    "/rules - Team rules\n\n" +
    "Ask a question using keywords such as salary, bonus, referral, report or leave."
  ).catch(console.error);
});

bot.onText(/^\/salary(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, replies[1].answer).catch(console.error);
});

bot.onText(/^\/rewards(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, replies[2].answer).catch(console.error);
});

bot.onText(/^\/rules(?:@\w+)?(?:\s|$)/i, (msg) => {
  bot.sendMessage(msg.chat.id, replies[5].answer).catch(console.error);
});

bot.on("message", async (msg) => {
  if (!msg.text || msg.from?.is_bot) return;
  if (!["group", "supergroup"].includes(msg.chat.type)) return;

  const text = msg.text.trim().toLowerCase();
  if (text.startsWith("/")) return;

  const words = text.match(/[a-z0-9]+/g) || [];

  const matched = replies.find((item) =>
    item.keywords.some((keyword) => words.includes(keyword))
  );

  if (!matched) return;

  const key = `${msg.chat.id}:${msg.from.id}`;
  const now = Date.now();

  if (now - (cooldowns.get(key) || 0) < 4000) return;
  cooldowns.set(key, now);

  try {
    await bot.sendMessage(msg.chat.id, matched.answer, {
      reply_parameters: { message_id: msg.message_id },
      allow_sending_without_reply: true
    });
  } catch (error) {
    console.error("Reply failed:", error.message);
  }
});

bot.on("polling_error", (error) => {
  console.error("Telegram polling error:", error.message);
});

console.log("SITA Team Reply Bot is running!");
