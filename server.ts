import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface CheckItem {
  id: string;
  name: string;
  badgeColor?: string;
}

interface Participant {
  id: string;
  name: string;
  phone?: string;
  division: string;
  group?: string;
  checked: boolean;
  checkedAt: string | null;
  items: Record<string, boolean>;
  itemsTimestamps?: Record<string, string>;
  notes?: string;
  isProxy?: boolean;
  proxyName?: string;
  raffleWinnerPrize?: string;
}

interface EventConfig {
  id: string;
  title: string;
  clubName: string;
  date: string;
  location: string;
  primaryItemName: string;
  items: CheckItem[];
  multiItemMode: boolean;
  gasWebhookUrl: string;
  googleSheetUrl: string;
  theme: string;
  fontSize: string;
}

// In-Memory Shared State
let currentVersion = 1;
let lastUpdatedAt = new Date().toISOString();

const DEFAULT_GAS_URL = "https://script.google.com/macros/s/AKfycbzb9ZQbZUuQVD-EjM_TZ3R2LSaIZPcpMmZDpizbcR0YKNLm8i7bIPiXVUCtvAVA8NryfQ/exec";

const HANWOOLIM_MEMBERS_DATA = [
  { name: '강명규', division: '금배부', grade: '금E', score: 5, phone: '010-7569-1939', notes: '62.11.19 / 효자동' },
  { name: '강석원', division: '동배부', grade: '동', score: 1, phone: '010-2252-2214', notes: '88.01.16 / 효자동' },
  { name: '강운석', division: '동배부', grade: '동', score: 1, phone: '010-3689-1407', notes: '60.02.25 / 모악산자락길' },
  { name: '강전성', division: '동배부', grade: '동', score: 1, phone: '010-2280-1939', notes: '97.04.20 / 효자동' },
  { name: '고광직', division: '은배부', grade: '은B', score: 3, phone: '010-8645-7155', notes: '66.01.22 / 삼천동' },
  { name: '권용국', division: '동배부', grade: '동', score: 1, phone: '010-6375-0436', notes: '62.09.03 / 삼천동' },
  { name: '김동찬', division: '금배부', grade: '금C', score: 7, phone: '010-6423-0780', notes: '89.12.22 / 세병로' },
  { name: '김선경', division: '동배부', grade: '동', score: 1, phone: '010-2657-6545', notes: '77.07.11 / 효천중앙로' },
  { name: '김영수', division: '동배부', grade: '동', score: 1, phone: '010-5088-0507', notes: '71.01.10 / 우전로' },
  { name: '김영현', division: '동배부', grade: '동', score: 1, phone: '', notes: '' },
  { name: '김요셉', division: '은배부', grade: '은B', score: 3, phone: '010-6484-5778', notes: '85.12.23 / 효자동' },
  { name: '김일태', division: '동배부', grade: '동', score: 2, phone: '010-3673-3295', notes: '63.12.28 / 용머리로' },
  { name: '김재선', division: '동배부', grade: '동', score: 1, phone: '010-5155-5597', notes: '57.07.14 / 평화동' },
  { name: '김준관', division: '동배부', grade: '동', score: 1, phone: '010-2408-7242', notes: '57.08.06 / 수송동' },
  { name: '김준동', division: '동배부', grade: '동', score: 1, phone: '010-7676-6189', notes: '91.01.22 / 중화산동' },
  { name: '김진규', division: '동배부', grade: '동', score: 1, phone: '010-8470-3397', notes: '86.10.06 / 효자동' },
  { name: '김태균', division: '금배부', grade: '금D', score: 6, phone: '010-4652-0872', notes: '80.10.02 / 효자동' },
  { name: '김한진', division: '동배부', grade: '동', score: 1, phone: '', notes: '' },
  { name: '김현우', division: '동배부', grade: '동', score: 2, phone: '010-4291-1151', notes: '89.06.20 / 효자동' },
  { name: '문범준', division: '은배부', grade: '은B', score: 3, phone: '010-4118-2385', notes: '92.05.22 / 삼례읍' },
  { name: '문현덕', division: '동배부', grade: '동', score: 1, phone: '010-4930-6343', notes: '93.12.22 / 효자동' },
  { name: '박공래', division: '동배부', grade: '동', score: 1, phone: '010-9557-8301', notes: '57.08.06 / 봉남면' },
  { name: '박광전', division: '동배부', grade: '동', score: 1, phone: '010-9557-8301', notes: '66.11.20' },
  { name: '박력', division: '동배부', grade: '동', score: 1, phone: '010-2955-0560', notes: '평화동' },
  { name: '박의경', division: '금배부', grade: '금E', score: 5, phone: '010-3713-1235', notes: '69.04.29 / 삼천동' },
  { name: '박정태', division: '동배부', grade: '동', score: 2, phone: '010-9366-6550', notes: '93.08.11 / 송천동' },
  { name: '배동연', division: '금배부', grade: '금D', score: 6, phone: '010-2684-1508', notes: '58.04.14 / 효자동' },
  { name: '배정민', division: '금배부', grade: '금E', score: 5, phone: '010-4059-0021', notes: '76.09.23 / 삼천동' },
  { name: '배지혁', division: '동배부', grade: '동', score: 1, phone: '010-5199-7538', notes: '91.12.14' },
  { name: '서영진', division: '동배부', grade: '동', score: 1, phone: '010-5024-1507', notes: '' },
  { name: '서예찬', division: '동배부', grade: '동', score: 2, phone: '010-8363-0275', notes: '07.03.18 / 만성동' },
  { name: '서재원', division: '동배부', grade: '동', score: 2, phone: '010-4654-9081', notes: '76.11.21 / 만성동' },
  { name: '석영수', division: '동배부', grade: '동', score: 1, phone: '', notes: '' },
  { name: '송인한', division: '동배부', grade: '동', score: 2, phone: '010-3650-9524', notes: '52.03.25 / 서완산동' },
  { name: '송준민', division: '동배부', grade: '동', score: 1, phone: '010-3369-8775', notes: '91.08.09 / 송천동' },
  { name: '신민철', division: '동배부', grade: '동', score: 1, phone: '010-4599-6960', notes: '80.07.29 / 완산구' },
  { name: '신성화', division: '금배부', grade: '금E', score: 5, phone: '010-8644-2546', notes: '88.05.25 / 효자동' },
  { name: '신해련', division: '금배부', grade: '금', score: 4, phone: '010-8742-6113', notes: '82.02.10' },
  { name: '염규생', division: '금배부', grade: '금B', score: 8, phone: '010-7170-6595', notes: '80.09.13 / 삼천동' },
  { name: '오승찬', division: '동배부', grade: '동', score: 1, phone: '010-3857-1032', notes: '85.12.23 / 효자동' },
  { name: '온재승', division: '동배부', grade: '동', score: 2, phone: '010-4105-3256', notes: '79.06.26 / 만성동' },
  { name: '유경일', division: '금배부', grade: '금E', score: 5, phone: '010-3583-2133', notes: '79.06.06 / 만성동' },
  { name: '윤찬솔', division: '동배부', grade: '동', score: 1, phone: '010-3369-8775', notes: '87.03.26 / 안행로' },
  { name: '은희광', division: '동배부', grade: '동', score: 2, phone: '010-2621-6732', notes: '60.07.05 / 삼천동' },
  { name: '이경훈', division: '동배부', grade: '동', score: 1, phone: '010-3675-0854', notes: '80.04.03 / 평화동' },
  { name: '이계현', division: '동배부', grade: '동', score: 1, phone: '010-2042-1777', notes: '60.03.16 / 평화동' },
  { name: '이병훈', division: '동배부', grade: '동', score: 1, phone: '010-3190-6959', notes: '79.11.23 / 평화동' },
  { name: '이성훈', division: '동배부', grade: '동', score: 1, phone: '010-4548-3938', notes: '85.04.23 / 효자동' },
  { name: '이종선', division: '은배부', grade: '은B', score: 3, phone: '010-3653-3917', notes: '64.04.05 / 삼천동' },
  { name: '이창민', division: '동배부', grade: '동', score: 1, phone: '010-8613-9653', notes: '86.02.04 / 효자동' },
  { name: '이충효', division: '금배부', grade: '금D', score: 6, phone: '010-6635-4757', notes: '82.12.16 / 장동' },
  { name: '임강문', division: '동배부', grade: '동', score: 1, phone: '010-6297-2004', notes: '82.10.21 / 효자동' },
  { name: '임상섭', division: '은배부', grade: '은A', score: 4, phone: '010-6653-0028', notes: '89.06.29 / 백구면' },
  { name: '임태승', division: '동배부', grade: '동', score: 1, phone: '010-2070-6359', notes: '75.12.24 / 이서면' },
  { name: '장종석', division: '동배부', grade: '동', score: 1, phone: '010-3678-0847', notes: '63.04.28 / 삼천동' },
  { name: '전만국', division: '금배부', grade: '금D', score: 6, phone: '010-4406-7503', notes: '75.05.24 / 서신동' },
  { name: '전훈', division: '동배부', grade: '동', score: 1, phone: '010-3680-2416', notes: '72.06.06 / 세내로' },
  { name: '정재용', division: '은배부', grade: '은A', score: 4, phone: '010-5101-9252', notes: '94.01.16 / 송천동' },
  { name: '정진안', division: '동배부', grade: '동', score: 1, phone: '010-2057-5422', notes: '66.06.10 / 서신동' },
  { name: '정현욱', division: '동배부', grade: '동', score: 1, phone: '010-5002-7007', notes: '76.10.11 / 호암로' },
  { name: '정홍모', division: '동배부', grade: '동', score: 1, phone: '010-2484-8431', notes: '63.06.23 / 효자동' },
  { name: '조우영', division: '은배부', grade: '은B', score: 3, phone: '010-9476-8380', notes: '62.04.07 / 서신동' },
  { name: '천승진', division: '은배부', grade: '은A', score: 4, phone: '010-9616-3933', notes: '88.09.24 / 서신동' },
  { name: '최규성', division: '동배부', grade: '동', score: 1, phone: '010-8640-8828', notes: '52.05.20 / 삼천동' },
  { name: '최수민', division: '동배부', grade: '동', score: 2, phone: '010-6632-8366', notes: '91.03.02 / 삼천동' },
  { name: '편보성', division: '동배부', grade: '동', score: 1, phone: '010-8626-9899', notes: '' },
  { name: '현대삼', division: '동배부', grade: '동', score: 1, phone: '', notes: '' },
  { name: '홍성완', division: '동배부', grade: '동', score: 1, phone: '010-6366-1832', notes: '76.01.06 / 덕진동' },
];

let serverEventConfig: EventConfig = {
  id: "event-2026-08",
  title: "2026년 한울림",
  clubName: "한울림 테니스클럽",
  date: "2026-08-16",
  location: "완산체련공원",
  primaryItemName: "한울림 단체티",
  items: [],
  multiItemMode: false,
  gasWebhookUrl: DEFAULT_GAS_URL,
  googleSheetUrl: "",
  theme: "outdoor-court",
  fontSize: "xlarge",
};

const UNRECEIVED_NAMES = new Set([
  '김영현', '김한진', '배지혁', '서영진', '석영수', '편보성', '현대삼'
]);

let serverParticipants: Participant[] = HANWOOLIM_MEMBERS_DATA.map((s, idx) => {
  const isChecked = !UNRECEIVED_NAMES.has(s.name);
  return {
    id: `p-${idx + 1}`,
    name: s.name,
    division: s.division,
    phone: s.phone || '',
    group: '',
    checked: isChecked,
    checkedAt: isChecked ? '수령완료' : null,
    items: {},
    notes: s.notes,
    grade: s.grade,
    score: s.score,
  };
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // CORS for dev / preview
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString(), version: currentVersion });
  });

  // GET /api/participants - 5s polling endpoint
  app.get("/api/participants", (req, res) => {
    res.json({
      success: true,
      version: currentVersion,
      lastUpdatedAt,
      config: serverEventConfig,
      participants: serverParticipants,
    });
  });

  // POST /api/participants - Instant update endpoint
  app.post("/api/participants", async (req, res) => {
    try {
      const { participants, config, clientVersion } = req.body;
      
      if (Array.isArray(participants)) {
        serverParticipants = participants;
      }
      if (config && typeof config === "object") {
        serverEventConfig = { ...serverEventConfig, ...config };
      }

      currentVersion++;
      lastUpdatedAt = new Date().toISOString();

      res.json({
        success: true,
        version: currentVersion,
        lastUpdatedAt,
        count: serverParticipants.length,
      });

      // Background optional proxy to GAS if gasWebhookUrl is configured
      const gasUrl = serverEventConfig.gasWebhookUrl || DEFAULT_GAS_URL;
      if (gasUrl && gasUrl.startsWith("http")) {
        try {
          fetch(gasUrl, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
              eventTitle: serverEventConfig.title,
              date: serverEventConfig.date,
              location: serverEventConfig.location,
              clubName: serverEventConfig.clubName,
              syncedAt: lastUpdatedAt,
              totalCount: serverParticipants.length,
              checkedCount: serverParticipants.filter((p) => p.checked).length,
              participants: serverParticipants,
            }),
          }).catch(() => {});
        } catch {}
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "Update failed" });
    }
  });

  // POST /api/sync-gas - Proxy to Google Apps Script (avoids CORS)
  app.post("/api/sync-gas", async (req, res) => {
    try {
      const { gasUrl, payload } = req.body;
      const targetUrl = gasUrl || serverEventConfig.gasWebhookUrl || DEFAULT_GAS_URL;
      
      if (!targetUrl || !targetUrl.startsWith("http")) {
        return res.status(400).json({ success: false, message: "Invalid GAS URL" });
      }

      const gasRes = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
      });

      const responseText = await gasRes.text();
      res.json({ success: true, text: responseText });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "GAS Sync Failed" });
    }
  });

  // GET /api/fetch-gas - Proxy GET from Google Apps Script
  app.get("/api/fetch-gas", async (req, res) => {
    try {
      const targetUrl = (req.query.gasUrl as string) || serverEventConfig.gasWebhookUrl || DEFAULT_GAS_URL;
      const eventTitle = (req.query.eventTitle as string) || serverEventConfig.title;

      if (!targetUrl || !targetUrl.startsWith("http")) {
        return res.status(400).json({ success: false, message: "Invalid GAS URL" });
      }

      const url = new URL(targetUrl);
      if (eventTitle) {
        url.searchParams.set("eventTitle", eventTitle);
      }

      const gasRes = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      });

      const responseText = await gasRes.text();
      try {
        const json = JSON.parse(responseText);
        res.json(json);
      } catch {
        res.send(responseText);
      }
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message || "GAS Fetch Failed" });
    }
  });

  // Vite Middleware in Development vs Static in Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Tennis Checkin server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
