const express = require('express');
const https = require('https');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8000;

const OPENAI_KEY    = process.env.OPENAI_API_KEY    || '';
const GEMINI_KEY    = process.env.GEMINI_API_KEY    || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

let AI_ENGINE = 'demo';
if (OPENAI_KEY)    AI_ENGINE = 'openai';
else if (GEMINI_KEY)    AI_ENGINE = 'gemini';
else if (ANTHROPIC_KEY) AI_ENGINE = 'anthropic';

async function callAI(system, messages, max = 400) {
  if (AI_ENGINE === 'openai')    return callOpenAI(system, messages, max);
  if (AI_ENGINE === 'gemini')    return callGemini(system, messages, max);
  if (AI_ENGINE === 'anthropic') return callAnthropic(system, messages, max);
  return null;
}

function httpPost(hostname, path, headers, body) {
  return new Promise((resolve, reject) => {
    const buf = Buffer.from(body);
    const req = https.request({ hostname, path, method: 'POST', headers: { ...headers, 'Content-Length': buf.length } }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    });
    req.on('error', reject);
    req.write(buf);
    req.end();
  });
}

async function callOpenAI(system, messages, max) {
  const r = await httpPost('api.openai.com', '/v1/chat/completions',
    { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_KEY}` },
    JSON.stringify({ model: 'gpt-4o-mini', max_tokens: max, messages: [{ role: 'system', content: system }, ...messages] }));
  if (r.error) throw new Error(r.error.message);
  return r.choices[0].message.content;
}

async function callGemini(system, messages, max) {
  const contents = messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }));
  const r = await httpPost('generativelanguage.googleapis.com',
    `/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`,
    { 'Content-Type': 'application/json' },
    JSON.stringify({ system_instruction: { parts: [{ text: system }] }, contents, generationConfig: { maxOutputTokens: max } }));
  if (r.error) throw new Error(r.error.message);
  return r.candidates[0].content.parts[0].text;
}

async function callAnthropic(system, messages, max) {
  const r = await httpPost('api.anthropic.com', '/v1/messages',
    { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: max, system, messages }));
  if (r.error) throw new Error(r.error.message);
  return r.content[0].text;
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ===================== DB =====================
const db = {
  children: [
    { id: 1, name: '김준서', grade: '2학년', village: '다로리마을', parentName: '김민수', emoji: '🦁', items: ['🎒'], completedMissions: 3 },
    { id: 2, name: '이나은', grade: '3학년', village: '다로리마을', parentName: '이정은', emoji: '🐿️', items: ['🌿', '🔍'], completedMissions: 5 },
    { id: 3, name: '박민준', grade: '4학년', village: '화양읍', parentName: '박성호', emoji: '🦊', items: ['🪵'], completedMissions: 2 },
    { id: 4, name: '최서윤', grade: '2학년', village: '청도읍', parentName: '최영희', emoji: '🐰', items: [], completedMissions: 1 },
    { id: 5, name: '정하늘', grade: '5학년', village: '각남면', parentName: '정재원', emoji: '🦋', items: ['🗺️', '🧭', '⭐'], completedMissions: 7 },
  ],

  villages: ['다로리마을', '화양읍', '청도읍', '각남면', '풍각면', '매전면', '운문면'],

  activityTagMap: {
    '목공수업':    { emoji: '🪵', tags: ['창의', '문제해결'], items: ['🪵 장인의 망치', '🪚 나무 모자'] },
    '생태교실':    { emoji: '🌿', tags: ['자연탐구', '표현'],  items: ['🌿 풀잎 머리띠', '🔍 탐험가 돋보기'] },
    '마을탐험':    { emoji: '🗺️', tags: ['협력', '창의'],     items: ['🗺️ 탐험가 배낭', '🧭 나침반'] },
    '음반제작':    { emoji: '🎵', tags: ['창의', '표현'],      items: ['🎵 음표 귀걸이', '🎤 마이크'] },
    '두부만들기':  { emoji: '🫘', tags: ['협력', '자연탐구'], items: ['🫘 콩 요리사 앞치마', '🥄 나무 숟가락'] },
    '달리기훈련':  { emoji: '🏃', tags: ['신체활동', '협력'], items: ['👟 달리기 운동화', '🏅 체력 배지'] },
    '엄빠학교':    { emoji: '📚', tags: ['협력', '표현'],      items: ['📚 지식의 책', '✏️ 금빛 연필'] },
    '플로깅':      { emoji: '🌍', tags: ['협력', '자연탐구'], items: ['🌍 지구 배지', '♻️ 재활용 가방'] },
    '어르신 말벗': { emoji: '👴', tags: ['협력', '표현'],      items: ['💬 이야기 말풍선', '🍵 전통 찻잔'] },
  },

  cards: [
    { id: 'c1', childId: 1, activity: '목공수업', cardName: '새집 장인', cardDesc: '나무로 새집을 직접 만드는 기술. 못 박는 위치에 따라 나무의 튼튼함이 달라져요.', childQuote: '못이 가장자리에 있으면 나무가 쪼개져요. 그래서 가운데에 박으면 될 것 같아요!', tags: ['창의', '문제해결'], date: '2026-03-17', village: '다로리마을', emoji: '🪵' },
    { id: 'c2', childId: 1, activity: '생태교실', cardName: '봄꽃 탐험가', cardDesc: '봄에 피어나는 들꽃의 비밀을 발견한 탐험가. 씨앗이 바람을 타고 멀리 날아가요.', childQuote: '씨앗이 솜털처럼 생긴 건 바람 타고 멀리 날려고 그런 거예요!', tags: ['자연탐구', '표현'], date: '2026-03-10', village: '다로리마을', emoji: '🌿' },
    { id: 'c3', childId: 1, activity: '마을탐험', cardName: '길잡이', cardDesc: '복잡한 골목도 기준점 하나면 길을 찾을 수 있어요. 마을을 손바닥처럼 아는 탐험가.', childQuote: '이장님 댁 나무를 기준점으로 정하면 헷갈리지 않아요!', tags: ['협력', '창의'], date: '2026-03-03', village: '다로리마을', emoji: '🗺️' },
    { id: 'c4', childId: 2, activity: '생태교실', cardName: '자연 관찰자', cardDesc: '작은 풀 한 포기에서도 자연의 신비를 발견하는 눈을 가졌어요.', childQuote: '벌레가 흙을 뒤집으면 땅이 건강해진다고 어르신이 알려주셨어요!', tags: ['자연탐구'], date: '2026-03-15', village: '다로리마을', emoji: '🌿' },
    { id: 'c5', childId: 2, activity: '마을탐험', cardName: '지도 제작자', cardDesc: '마을 구석구석을 지도로 만드는 기술. 나만의 마을 지도를 완성했어요.', childQuote: '우리 마을에 이렇게 많은 골목이 있는 줄 몰랐어요!', tags: ['창의', '협력'], date: '2026-03-08', village: '다로리마을', emoji: '🗺️' },
    { id: 'c6', childId: 3, activity: '목공수업', cardName: '나무 조각가', cardDesc: '나무의 결을 따라 조각하면 훨씬 쉽게 깎을 수 있다는 걸 발견했어요.', childQuote: '나무에도 방향이 있어요. 결 방향으로 깎으면 안 부러져요!', tags: ['창의', '문제해결'], date: '2026-03-12', village: '화양읍', emoji: '🪵' },
    { id: 'c7', childId: 5, activity: '음반제작', cardName: '마을 음악가', cardDesc: '마을의 이야기를 노래로 만들어요. 우리 마을만의 특별한 노래가 탄생했어요.', childQuote: '각남면의 들판 이야기를 노래로 만들었어요. 할머니가 좋아하셨어요!', tags: ['창의', '표현'], date: '2026-03-05', village: '각남면', emoji: '🎵' },
    { id: 'c8', childId: 5, activity: '마을탐험', cardName: '역사 탐정', cardDesc: '마을의 오래된 이야기를 찾아내는 탐정. 100년 전 기차 이야기를 발견했어요.', childQuote: '남성현역 옆에 100년 전부터 기차가 다녔대요! 진짜 신기해요!', tags: ['협력', '자연탐구'], date: '2026-02-26', village: '각남면', emoji: '🔍' },
    { id: 'c9', childId: 5, activity: '어르신 말벗', cardName: '이야기 수집가', cardDesc: '어르신의 옛날 이야기를 귀 기울여 듣고 기록하는 이야기꾼이에요.', childQuote: '어르신이 어렸을 때 이 마을에는 사과나무가 엄청 많았대요!', tags: ['협력', '표현'], date: '2026-02-19', village: '각남면', emoji: '💬' },
  ],

  missions: [
    { id: 'm1', childId: 1, activity: '목공수업', mission: '오늘 만든 것 중 가장 어려웠던 부분을 마루에게 설명해줘', reward: '🪵 장인의 망치', completed: true, date: '2026-03-17' },
    { id: 'm2', childId: 1, activity: '생태교실', mission: '오늘 발견한 식물 중 가장 신기했던 것과 그 이유를 말해줘', reward: '🌿 풀잎 머리띠', completed: true, date: '2026-03-10' },
    { id: 'm3', childId: 2, activity: '마을탐험', mission: '마을에서 가장 기억에 남는 장소와 그 이유를 마루에게 알려줘', reward: '🗺️ 탐험가 배낭', completed: true, date: '2026-03-08' },
  ],

  conversations: [
    {
      id: 'cv1', childId: 1, activity: '목공수업', date: '2026-03-17',
      messages: [
        { role: 'assistant', content: '안녕 준서야! 오늘 목공 수업 어땠어? 뭘 만들었어? 😊' },
        { role: 'user', content: '새집 만들었는데 못 박다가 나무가 쪼개졌어' },
        { role: 'assistant', content: '아, 나무가 쪼개졌구나! 왜 그랬을 것 같아?' },
        { role: 'user', content: '못이 너무 가장자리에 있었어' },
        { role: 'assistant', content: '오! 그럼 다음엔 어떻게 하면 좋을까?' },
        { role: 'user', content: '가운데에 박으면 될 것 같아' },
        { role: 'assistant', content: '와, 스스로 방법을 찾아냈네! 진짜 대단한데? 🎉 오늘 기록 완성! 🪵 장인의 망치 아이템 획득!' },
      ]
    }
  ],

  reports: []
};

// ===================== API =====================

app.get('/api/children', (req, res) => res.json(db.children));
app.get('/api/villages', (req, res) => res.json(db.villages));
app.get('/api/activities', (req, res) => res.json(Object.keys(db.activityTagMap)));
app.get('/api/activity-tags', (req, res) => res.json(db.activityTagMap));

// 전체 카드 (마을 간 도감 구경용)
app.get('/api/cards', (req, res) => {
  const { village, childId } = req.query;
  let cards = [...db.cards].sort((a, b) => new Date(b.date) - new Date(a.date));
  if (village) cards = cards.filter(c => c.village === village);
  if (childId) cards = cards.filter(c => c.childId === parseInt(childId));
  const withChild = cards.map(c => ({
    ...c,
    child: db.children.find(ch => ch.id === c.childId)
  }));
  res.json(withChild);
});

// 아이별 미션
app.get('/api/missions/:childId', (req, res) => {
  const missions = db.missions.filter(m => m.childId === parseInt(req.params.childId));
  res.json(missions);
});

// 아이별 대화
app.get('/api/conversations/:childId', (req, res) => {
  res.json(db.conversations.filter(c => c.childId === parseInt(req.params.childId)));
});

// ── AI 첫 메시지 ──
app.post('/api/chat/start', async (req, res) => {
  const { childName, activity } = req.body;
  const fallbacks = {
    '목공수업': `안녕 ${childName}야! 오늘 목공 수업에서 뭘 만들었어? 🪵`,
    '생태교실': `안녕 ${childName}야! 오늘 생태 교실에서 뭘 발견했어? 🌿`,
    '마을탐험': `안녕 ${childName}야! 오늘 마을 탐험 어디까지 가봤어? 🗺️`,
    '음반제작': `안녕 ${childName}야! 오늘 어떤 노래 만들었어? 🎵`,
    '두부만들기': `안녕 ${childName}야! 오늘 두부 만들기 해봤어? 어땠어? 🫘`,
    '달리기훈련': `안녕 ${childName}야! 오늘 달리기 훈련 얼마나 뛰었어? 🏃`,
    '엄빠학교': `안녕 ${childName}야! 오늘 엄빠학교에서 뭘 배웠어? 📚`,
    '플로깅': `안녕 ${childName}야! 오늘 플로깅하면서 어떤 쓰레기를 제일 많이 주웠어? 🌍`,
    '어르신 말벗': `안녕 ${childName}야! 오늘 어르신이 어떤 이야기를 해주셨어? 👴`,
  };
  const fallback = fallbacks[activity] || `안녕 ${childName}야! 오늘 ${activity} 어땠어? 😊`;
  if (AI_ENGINE === 'demo') return res.json({ content: fallback });

  const sys = `너는 '마루'야. 경북 청도 온마을 배움터의 AI 친구야.
초등학생 아이와 오늘 한 활동에 대해 대화해줘.
규칙: 질문 1개만, 짧게, 반말로, 따뜻하게, 이모지 가끔.`;
  try {
    const text = await callAI(sys, [{ role: 'user', content: `나는 ${childName}이고 오늘 ${activity} 했어. 첫 인사와 질문 1개 해줘.` }], 150);
    res.json({ content: text });
  } catch { res.json({ content: fallback }); }
});

// ── AI 대화 ──
app.post('/api/chat', async (req, res) => {
  const { messages, activity, childName } = req.body;
  const demos = ['오, 그랬구나! 그때 기분이 어땠어?', '와 진짜? 왜 그렇게 생각했어?', '대박! 다음엔 어떻게 해보고 싶어?', '혼자 알아낸 거야? 대단한데 👍', '오늘 가장 기억에 남는 순간이 뭐야?'];
  if (AI_ENGINE === 'demo') return res.json({ content: demos[Math.floor(Math.random() * demos.length)] });

  const sys = `너는 '마루'야. 경북 청도 온마을 배움터 AI 친구야.
${childName}이가 오늘 ${activity} 했어. 대화를 이어가줘.
규칙: 질문 1개만, 짧게 반말, 아이 말 먼저 반영("오 그랬구나!"), 반추 질문 자주("왜 그랬을 것 같아?"), 칭찬 많이, 이모지 가끔.
5턴 이상이면 "오늘 가장 기억에 남는 순간이 뭐야?" 물어봐.`;
  try {
    const text = await callAI(sys, messages, 250);
    res.json({ content: text });
  } catch { res.json({ content: '잠깐, 생각 중이야... 다시 말해줄 수 있어? 😊' }); }
});

// ── 카드 자동 생성 (선생님 태그 입력 → AI) ──
app.post('/api/cards/generate', async (req, res) => {
  const { activity, childIds, village, note } = req.body;
  const actInfo = db.activityTagMap[activity] || { emoji: '⭐', tags: [], items: [] };

  // 데모 카드 템플릿
  const demoCards = {
    '목공수업': { cardName: '나무 장인', cardDesc: '나무를 다루는 손재주를 키웠어요. 직접 만든 것의 소중함을 알게 됐죠.', mission: '오늘 만든 것 중 가장 어려웠던 부분을 마루에게 설명해줘', reward: actInfo.items[0] || '🎁 활동 배지' },
    '생태교실': { cardName: '자연 탐험가', cardDesc: '마을 자연 속에서 살아있는 생명들을 발견했어요.', mission: '오늘 발견한 것 중 가장 신기했던 것과 이유를 말해줘', reward: actInfo.items[0] || '🎁 활동 배지' },
    '마을탐험': { cardName: '마을 길잡이', cardDesc: '마을 구석구석을 탐험하며 숨겨진 이야기를 찾았어요.', mission: '마을에서 가장 기억에 남는 장소와 그 이유를 마루에게 알려줘', reward: actInfo.items[0] || '🎁 활동 배지' },
    '두부만들기': { cardName: '전통 요리사', cardDesc: '콩으로 두부를 만드는 전통 기술을 배웠어요.', mission: '두부 만들 때 가장 신기했던 순간을 마루에게 말해줘', reward: actInfo.items[0] || '🎁 활동 배지' },
    '음반제작': { cardName: '마을 음악가', cardDesc: '마을의 이야기를 노래로 담아냈어요.', mission: '오늘 만든 노래에서 가장 마음에 드는 부분을 마루에게 설명해줘', reward: actInfo.items[0] || '🎁 활동 배지' },
  };
  const demo = demoCards[activity] || { cardName: `${activity} 탐험가`, cardDesc: `${activity}를 통해 새로운 것을 배웠어요.`, mission: `오늘 ${activity}에서 배운 것 중 가장 기억에 남는 걸 마루에게 말해줘`, reward: actInfo.items[0] || '🎁 활동 배지' };

  let generated = demo;

  if (AI_ENGINE !== 'demo') {
    const prompt = `활동: ${activity}
마을: ${village}
${note ? `메모: ${note}` : ''}
아래 JSON만 출력해줘 (마크다운 없이):
{"cardName":"카드이름(5자이내)","cardDesc":"카드설명(2문장,초등학생눈높이)","mission":"마루에게할질문(1문장)","reward":"아이템이름(이모지포함,10자이내)"}`;
    try {
      const raw = await callAI('너는 초등학생 마을 활동 기록 카드를 만드는 도우미야. JSON만 출력해.', [{ role: 'user', content: prompt }], 300);
      const clean = raw.replace(/```json|```/g, '').trim();
      generated = JSON.parse(clean);
    } catch { /* use demo */ }
  }

  // 카드 저장
  const newCards = childIds.map(childId => {
    const child = db.children.find(c => c.id === parseInt(childId));
    const card = {
      id: 'c' + Date.now() + childId,
      childId: parseInt(childId),
      activity,
      cardName: generated.cardName,
      cardDesc: generated.cardDesc,
      childQuote: '',
      tags: actInfo.tags,
      date: new Date().toISOString().split('T')[0],
      village,
      emoji: actInfo.emoji,
      pending: true // 아직 아이가 마루와 대화 안 함
    };
    db.cards.push(card);

    // 미션 생성
    const mission = {
      id: 'm' + Date.now() + childId,
      childId: parseInt(childId),
      activity,
      mission: generated.mission,
      reward: generated.reward,
      completed: false,
      date: new Date().toISOString().split('T')[0]
    };
    db.missions.push(mission);
    return { card, mission, childName: child?.name };
  });

  res.json({ success: true, generated, cards: newCards });
});

// ── 대화 저장 + 카드 완성 ──
app.post('/api/conversations/save', async (req, res) => {
  const { childId, activity, messages } = req.body;
  const child = db.children.find(c => c.id === parseInt(childId));

  // 아이 발언 추출
  const userMsgs = messages.filter(m => m.role === 'user');
  const bestQuote = userMsgs[userMsgs.length - 1]?.content || '';

  // 대화 저장
  const conv = { id: 'cv' + Date.now(), childId: parseInt(childId), activity, date: new Date().toISOString().split('T')[0], messages };
  db.conversations.push(conv);

  // 해당 아이의 pending 카드 완성
  const card = db.cards.find(c => c.childId === parseInt(childId) && c.activity === activity && c.pending);
  if (card) { card.childQuote = bestQuote; card.pending = false; }

  // 미션 완료 처리
  const mission = db.missions.find(m => m.childId === parseInt(childId) && m.activity === activity && !m.completed);
  let reward = null;
  if (mission) {
    mission.completed = true;
    reward = mission.reward;
    if (child && reward) {
      child.items = child.items || [];
      child.items.push(reward);
      child.completedMissions = (child.completedMissions || 0) + 1;
    }
  }

  res.json({ success: true, reward, card });
});

// ── 리포트 생성 ──
app.post('/api/report/generate', async (req, res) => {
  const { childId } = req.body;
  const child = db.children.find(c => c.id === parseInt(childId));
  if (!child) return res.status(404).json({ error: '아이 없음' });

  const existing = db.reports.find(r => r.childId === parseInt(childId));
  if (existing) return res.json({ report: existing });

  const cards = db.cards.filter(c => c.childId === parseInt(childId) && !c.pending);
  const missions = db.missions.filter(m => m.childId === parseInt(childId) && m.completed);
  const quotes = cards.map(c => c.childQuote).filter(Boolean);
  const activities = [...new Set(cards.map(c => c.activity))].join(', ');
  const allTags = cards.flatMap(c => c.tags);
  const topTags = [...new Set(allTags)].slice(0, 3).join(', ');

  let content = `**${child.name} (${child.grade}, ${child.village}) — 이달의 성장 리포트**\n\n${child.name}는 이번 달 ${activities || '다양한 활동'}에 참여하며 ${cards.length}장의 마을 도감 카드를 채우고 ${missions.length}개의 미션을 완료했습니다.\n\n**주요 역량:** ${topTags || '협력, 창의'}\n\n마을의 자연과 공동체 경험을 통해 AI와 자연스럽게 대화하며 소중한 기록을 남겼습니다.\n\n**${child.name}의 목소리**\n> "${quotes[0] || '오늘도 재밌었어요!'}"\n\n다음 달도 응원합니다! 🌱`;

  if (AI_ENGINE !== 'demo' && cards.length > 0) {
    const prompt = `아이: ${child.name} (${child.grade}, ${child.village})
이달 활동: ${activities}
완성한 카드: ${cards.length}장
미션 완료: ${missions.length}개
주요 역량: ${topTags}
아이 발언: ${quotes.map(q => `"${q}"`).join(' / ')}

부모님께 드리는 이달 성장 리포트를 마크다운으로 300자 내외로 작성해줘.
제목, 역량 분석(이모지 포함), 아이 발언 인용(> 형식), 따뜻한 마무리 포함. 🌱로 끝내줘.`;
    try {
      const text = await callAI('너는 아이의 성장 리포트를 쓰는 전문가야.', [{ role: 'user', content: prompt }], 500);
      content = text;
    } catch { /* use default */ }
  }

  const report = { id: 'r' + Date.now(), childId: parseInt(childId), childName: child.name, month: new Date().toISOString().slice(0, 7), content, generatedAt: new Date().toISOString() };
  db.reports.push(report);
  res.json({ report });
});

app.get('/api/report/:childId', (req, res) => {
  res.json(db.reports.find(r => r.childId === parseInt(req.params.childId)) || null);
});

// ── 대시보드 ──
app.get('/api/dashboard', (req, res) => {
  const villageStats = db.villages.map(v => {
    const vChildren = db.children.filter(c => c.village === v);
    const vCards = db.cards.filter(c => c.village === v);
    return { name: v, childCount: vChildren.length, cardCount: vCards.length, lastActivity: vCards.sort((a, b) => new Date(b.date) - new Date(a.date))[0]?.activity || '-' };
  });
  const allTags = db.cards.flatMap(c => c.tags);
  const tagStats = {};
  allTags.forEach(t => { tagStats[t] = (tagStats[t] || 0) + 1; });

  res.json({
    totalChildren: db.children.length,
    totalCards: db.cards.filter(c => !c.pending).length,
    totalMissions: db.missions.filter(m => m.completed).length,
    activeVillages: [...new Set(db.cards.map(c => c.village))].length,
    villageStats,
    tagStats,
    recentCards: db.cards.filter(c => !c.pending).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6).map(c => ({ ...c, child: db.children.find(ch => ch.id === c.childId) }))
  });
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  const eng = { openai: 'GPT-4o-mini', gemini: 'Gemini 2.0 Flash', anthropic: 'Claude Sonnet', demo: '데모 모드' };
  console.log(`\n🌱 두레 — 마을 도감 AI 성장기록 시스템`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`✅ http://localhost:${PORT}`);
  console.log(`🤖 AI: ${eng[AI_ENGINE]}`);
  if (AI_ENGINE === 'demo') {
    console.log(`   GPT:    OPENAI_API_KEY=sk-...     node server.js`);
    console.log(`   Gemini: GEMINI_API_KEY=AIza...    node server.js`);
    console.log(`   Claude: ANTHROPIC_API_KEY=sk-ant- node server.js`);
  }
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
});
