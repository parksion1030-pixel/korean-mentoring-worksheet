import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite';

function cleanCategories(obj, words) {
  const out = {};
  for (const word of words) {
    const value = obj?.[word];
    out[word] = typeof value === 'string' && value.trim() ? value.trim() : '기타';
  }
  return out;
}

app.post('/api/classify', async (req, res) => {
  try {
    const words = Array.isArray(req.body?.words)
      ? req.body.words.map(x => String(x).trim()).filter(Boolean)
      : [];

    if (!words.length) return res.status(400).json({error:'단어가 없습니다.'});
    if (words.length > 300) return res.status(400).json({error:'한 번에 최대 300개까지 분류할 수 있어요.'});
   console.log('[AI] classify 요청 들어옴');
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({error:'서버에 GEMINI_API_KEY가 설정되지 않았어요.'});
    }

    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

    const prompt = `
너는 한국어 초급 학습지의 단어 분류 도우미다.
아래 한국어 단어들을 의미에 따라 가장 자연스러운 한국어 분류명으로 분류해라.

규칙:
- 반드시 각 단어마다 하나의 분류만 선택한다.
- 분류명은 짧고 일관성 있게 만든다. 예: 몸과 건강, 인사와 표현, 사람과 관계, 학교와 공부, 음식과 식사, 나라와 장소, 장소, 물건, 외모와 성격, 감정과 상태, 행동, 색깔과 모양, 시간과 날짜.
- 위 예시에 억지로 맞추지 말고, 필요하면 "교통", "가족", "동물", "자연", "날씨" 등 새로운 분류를 만들어도 된다.
- 특히 나라 이름은 "나라와 장소"로 분류한다.
- 출력은 설명 없이 JSON 객체 하나만 반환한다.
- JSON 형식은 {"단어":"분류명"}이다.
- 입력에 없는 단어를 추가하지 않는다.

단어:
${words.map((w,i)=>`${i+1}. ${w}`).join('\n')}
`;

    const response = await ai.models.generateContent({
  model: MODEL,
  contents: prompt,
  config: {
    responseMimeType: 'application/json'
  }
});

    let parsed;
    try {
      parsed = JSON.parse(response.text);
    } catch {
      return res.status(502).json({error:'AI가 올바른 분류 결과를 반환하지 않았어요.'});
    }

    res.json({categories: cleanCategories(parsed, words)});
  } catch (err) {
    console.error(err);
    res.status(500).json({error:'AI 분류 중 오류가 발생했어요.'});
  }
});

app.use((req,res,next)=>{
  if (req.method === 'GET') {
    res.sendFile(path.join(__dirname,'public','index.html'));
  } else {
    next();
  }
});
app.listen(PORT, '0.0.0.0', () => {
  console.log(`한국어 멘토링 학습지 서버 실행: ${PORT}`);
});
