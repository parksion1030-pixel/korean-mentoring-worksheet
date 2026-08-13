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
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';
function cleanCategories(obj, words) {
  const out = {};

  const countryWords = new Set([
    '한국','대한민국','일본','중국','미국','캐나다','멕시코',
    '영국','프랑스','독일','이탈리아','스페인','러시아',
    '베트남','태국','필리핀','인도네시아','인도','호주',
    '뉴질랜드','대만','싱가포르','말레이시아','몽골',
    '브라질','아르헨티나','칠레','터키','이집트'
  ]);

  for (const word of words) {
    // 명백한 나라 이름은 AI 결과와 관계없이 '나라'로 고정
    if (countryWords.has(word)) {
      out[word] = '나라';
      continue;
    }

    const value = obj?.[word];

    out[word] =
      typeof value === 'string' && value.trim()
        ? value.trim()
        : '기타';
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
너는 한국어 학습지의 단어 자동 분류 전문가다.

아래 단어들을 의미에 따라 가장 적절한 한국어 분류명으로 분류해라.

매우 중요한 규칙:
1. 모든 단어를 반드시 하나의 분류에 넣는다.
2. "기타"는 정말 어떤 분류에도 넣을 수 없을 때만 사용한다.
3. 나라 이름, 국가 이름, 국가를 나타내는 단어는 반드시 "나라"로 분류한다.
4. 예:
   - 미국 → 나라
   - 프랑스 → 나라
   - 한국 → 나라
   - 일본 → 나라
   - 중국 → 나라
   - 베트남 → 나라
   - 러시아 → 나라
   - 대만 → 나라
5. 도시나 지역 이름은 "지역/장소"로 분류한다.
6. 사람을 나타내는 단어는 "사람"으로 분류한다.
7. 음식은 "음식"으로 분류한다.
8. 신체 부위는 "몸"으로 분류한다.
9. 감정이나 상태는 "감정/상태"로 분류한다.
10. 행동을 나타내는 단어는 "행동"으로 분류한다.
11. 동물은 "동물"로 분류한다.
12. 물건은 "물건"으로 분류한다.
13. 장소는 "장소"로 분류한다.
14. 날짜, 시간, 숫자 등은 의미에 맞는 분류를 만든다.
15. 위 목록에 없는 단어도 스스로 적절한 분류를 만들어 분류한다.

중요:
"대만", "미국", "프랑스"처럼 명백하게 나라를 나타내는 단어를 절대로 "기타", "장소", "지명" 등으로 분류하지 마라.
반드시 "나라"로 분류한다.

설명하지 말고 JSON 객체 하나만 반환한다.

JSON 형식:
{"단어":"분류명"}

단어:
${words.map((w,i)=>`${i+1}. ${w}`).join('\n')}
`;

   console.log('[AI] Gemini 호출 시작');
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

app.post('/api/translate', async (req, res) => {
  try {
    const word = String(req.body.word || '').trim();

    if (!word) {
      return res.status(400).json({ error: '번역할 문장이 없습니다.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: '서버에 GEMINI_API_KEY가 설정되지 않았어요.' });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = `
너는 한국어를 베트남어로 번역하는 전문 번역가다.

다음 한국어 문장 또는 표현을 베트남 사람이 실제로 자연스럽게 사용하는 베트남어로 번역해라.

중요한 규칙:
1. 단어를 기계적으로 직역하지 말고 문맥과 감정을 살려라.
2. 원문의 의미를 임의로 추가하거나 삭제하지 마라.
3. 노래 가사나 감정적인 표현도 자연스럽게 번역하라.
4. 번역 결과만 출력하고 설명은 하지 마라.
5. 반드시 베트남어로만 출력하라.

한국어:
${word}
`;

    console.log(`[AI] 번역 요청: ${word}`);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt
    });

    const translation = String(response.text || '').trim();

    if (!translation) {
      return res.status(502).json({ error: 'Gemini가 번역 결과를 반환하지 않았어요.' });
    }

    console.log(`[AI] 번역 결과: ${translation}`);

    res.json({ translation });
  } catch (err) {
    console.error('[AI] 번역 오류:', err);
    res.status(500).json({ error: 'AI 번역 중 오류가 발생했어요.' });
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
