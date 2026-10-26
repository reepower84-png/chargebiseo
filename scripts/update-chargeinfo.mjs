// 차지인포(한국스마트그리드협회)의 공개 요금 데이터를 받아 data/chargeinfo.js로 저장한다.
// 사용법: node scripts/update-chargeinfo.mjs   (Node 18 이상, 추가 설치 없음)
import { writeFile, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const BASE = "https://chargeinfo.ksga.org";
const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "data", "chargeinfo.js");

async function getJson(path) {
  const res = await fetch(BASE + path, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${path} 응답 ${res.status}`);
  return res.json();
}

// 집 충전에 해당하는 요금제를 먼저 고르고, 고속도로·완성차 브랜드·콘센트 같은 특수 요금제는 뺀다.
const SPECIAL = /고속도로|브랜드|콘센트|과금형|KT|서울시/;
const HOME = /아파트|공동주택|주거/;
function pick(rows, kind, customer) {
  const list = rows.filter((r) => r.csKindType === kind && r.customerType === customer && !SPECIAL.test(r.name));
  if (!list.length) return null;
  return (kind === "1" && list.find((r) => HOME.test(r.name))) || list[0];
}
function ymd(s) { return s ? `${s.slice(0, 4)}.${s.slice(4, 6)}.${s.slice(6, 8)}` : ""; }

const [tariff, company] = await Promise.all([getJson("/ws/tariff/charger/list"), getJson("/ws/organization/company/list")]);
const names = {};
(company.result || company).forEach((c) => { names[c.bid] = c.companyName; });

const byBid = {};
tariff.result.forEach((r) => { (byBid[r.bid] = byBid[r.bid] || []).push(r); });

const providers = Object.keys(byBid).map((bid) => {
  const rows = byBid[bid];
  const fm = pick(rows, "2", "M"), fg = pick(rows, "2", "G"), sm = pick(rows, "1", "M"), sg = pick(rows, "1", "G");
  const used = [fm, fg, sm, sg].filter(Boolean);
  const start = used.map((r) => r.startDt).sort().pop();
  return {
    bid,
    name: (names[bid] || bid).replace(/^\(주\)|\(주\)$/g, "").trim(),
    asOf: ymd(start),
    fast: fm ? [fm.averageFee, fg ? fg.averageFee : null] : null,
    slow: sm ? [sm.averageFee, sg ? sg.averageFee : null] : null
  };
}).filter((p) => p.fast || p.slow).sort((a, b) => a.name.localeCompare(b.name, "ko"));

const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10).replace(/-/g, ".");
const data = { fetchedAt: today, source: BASE + "/index", providers };
const body = "// 자동 생성 파일: scripts/update-chargeinfo.mjs 로 갱신합니다. 직접 고치지 마세요.\nwindow.CHARGEINFO = " + JSON.stringify(data, null, 2) + ";\n";

// 수집일만 바뀌고 단가가 같으면 파일을 그대로 둔다(불필요한 커밋 방지).
let prev = "";
try { prev = await readFile(OUT, "utf8"); } catch {}
const strip = (s) => s.replace(/"fetchedAt": "[^"]*"/, "");
if (prev && strip(prev) === strip(body)) {
  console.log(`변경 없음 (${providers.length}개 사업자)`);
} else {
  await writeFile(OUT, body, "utf8");
  console.log(`저장: ${providers.length}개 사업자 → data/chargeinfo.js`);
}
