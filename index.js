
// index.js
const express = require('express');
const line = require('@line/bot-sdk');

const app = express();

// 🔐 ใส่ค่าของคุณจาก LINE Developers
const config = {
  channelAccessToken: 'mxVX6rNG9ydTTOBpHgtHM305uwcJQZlilElsLlyzPd/HGJvh+x7UUc0TEonsSrIx+qD+Zi4PPahnw5NC2YRXK8bzmcWNcTA96NtXTNjjf/SkCxYYJ+7vc6hSPzDoZ8oeck6txIoYkwRQreJWQi+vjQdB04t89/1O/w1cDnyilFU=',
  channelSecret: '038b9338c0d932bd32609c8d1d0e0cf1'
};

// client สำหรับ reply
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: config.channelAccessToken
});

// middleware
app.use('/webhook', line.middleware(config));

// route webhook
app.post('/webhook', (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then(result => res.json(result))
    .catch(err => {
      console.error(err);
      res.status(500).end();
    });
});

// ฟังก์ชันตอบข้อความ
function handleEvent(event) {
  // ไม่ใช่ข้อความ → ไม่ต้องทำอะไร
  if (event.type !== 'message' || event.message.type !== 'text') {
    return Promise.resolve(null);
  }

  const replyText = `คุณพิมพ์ว่า: ${event.message.text}`;

  return client.replyMessage(event.replyToken, {
    type: 'text',
    text: replyText
  });
}

// test หน้าเว็บ
app.get('/', (req, res) => {
  res.send('LINE BOT ทำงานแล้ว');
});

// start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});