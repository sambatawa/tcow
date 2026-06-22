export async function sendTelegramNotification(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Kredensial Telegram belum diset di .env");
    return;
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown", // Agar bisa menggunakan format tebal/miring
      }),
    });

    if (!response.ok) {
      console.error("Gagal mengirim notifikasi Telegram:", await response.text());
    }
  } catch (error) {
    console.error("Error saat fetch API Telegram:", error);
  }
}