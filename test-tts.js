const dotenv = require('dotenv');
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const TTS_MODEL = 'gemini-3.1-flash-tts-preview';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${TTS_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

async function test() {
  const geminiPayload = {
    contents: [
      {
        parts: [
          { text: `Mỗi đêm, cậu nằm nghe tiếng sóng trong trí tưởng tượng, và tự hỏi: "Biển có thật sự rộng lớn như người ta nói không?"\n\n<break time="1.0s"/>\n\nRồi một ngày cậu quyết định lên đường` }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: "Aoede",
          },
        },
      },
    },
  };

  try {
    const res = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(geminiPayload),
    });
    
    console.log("STATUS:", res.status);
    const text = await res.text();
    console.log("RESPONSE:", text);
  } catch (e) {
    console.error("ERROR:", e);
  }
}

test();
