// Finds the chat id for TELEGRAM_CHAT_ID: send any message to your new bot,
// then run this. The bot token is read from TELEGRAM_BOT_TOKEN or typed at a
// hidden prompt; it is only sent to api.telegram.org.
//
// Usage: node tools/scripts/telegram-chat-id.mjs
import { ask } from './prompt.mjs';

const token =
  process.env.TELEGRAM_BOT_TOKEN?.trim() ||
  (await ask('Bot token from BotFather (hidden): ', { hidden: true }));
if (!/^\d+:[\w-]+$/.test(token)) {
  console.error('That does not look like a bot token (123456:ABC-...).');
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const result = await response.json();
if (!result.ok) {
  console.error(`Telegram said: ${result.description}`);
  process.exit(1);
}

const chats = new Map();
for (const update of result.result) {
  const chat = (update.message ?? update.channel_post ?? update.my_chat_member)
    ?.chat;
  if (chat) {
    chats.set(
      chat.id,
      chat.username ? `@${chat.username}` : (chat.title ?? ''),
    );
  }
}
if (chats.size === 0) {
  console.log(
    'No messages yet. Open your bot in Telegram, press Start (or send "hi"), then run this again.',
  );
  process.exit(0);
}
for (const [id, label] of chats) {
  console.log(`TELEGRAM_CHAT_ID=${id}  ${label}`);
}
