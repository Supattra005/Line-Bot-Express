require("dotenv").config();

const express = require("express");
const line = require("@line/bot-sdk");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

app.get("/", (req, res) => {
  res.send("LINE + GEMINI BOT WORKING");
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== "message") return Promise.resolve(null);

  // ===== TEXT MESSAGE =====
  if (event.message.type === "text") {
    const userText = event.message.text;

    try {
      const result = await model.generateContent(
        `ตอบข้อความนี้แบบสร้างสรรค์และเป็นกันเอง: ${userText}`
      );

      const replyText = result.response.text();

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: replyText.substring(0, 1000),
          },
        ],
      });
    } catch (error) {
      console.error("Gemini error:", error);

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: "เกิดข้อผิดพลาดในการเชื่อมต่อ Gemini",
          },
        ],
      });
    }
  }

  // ===== IMAGE MESSAGE =====
  if (event.message.type === "image") {
    try {
      const messageId = event.message.id;

      // ดึง binary รูปจาก LINE
      const stream = await axios.get(
        `https://api-data.line.me/v2/bot/message/${messageId}/content`,
        {
          responseType: "arraybuffer",
          headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          },
        }
      );

      const base64Image = Buffer.from(stream.data).toString("base64");

      const result = await model.generateContent([
        "ภาพนี้เป็นสัตว์ชนิดอะไร ตอบสั้นๆ ภาษาไทย",
        {
          inlineData: {
            mimeType: "image/jpeg",
            data: base64Image,
          },
        },
      ]);

      const animalResult = result.response.text();

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: `ส่งรูปภาพสำเร็จ\nGemini วิเคราะห์ว่า: ${animalResult}`,
          },
        ],
      });
    } catch (error) {
      console.error("Image error:", error);

      return client.replyMessage({
        replyToken: event.replyToken,
        messages: [
          {
            type: "text",
            text: "รับรูปภาพแล้ว แต่วิเคราะห์ไม่สำเร็จ",
          },
        ],
      });
    }
  }

  return Promise.resolve(null);
}

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
