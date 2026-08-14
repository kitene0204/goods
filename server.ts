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

let serverEventConfig: EventConfig = {
  id: "event-2026-08",
  title: "2026년 8월 에이스 테니스클럽 정기 월례대회",
  clubName: "에이스 테니스클럽 (ACE TC)",
  date: "2026-08-15",
  location: "올림픽공원 테니스장 1~4번 코트",
  primaryItemName: "참가 기념품 (테니스 타월 & 댐프너)",
  items: [
    { id: "gift", name: "참가 기념품", badgeColor: "bg-emerald-500" },
    { id: "lunch", name: "간식/음료", badgeColor: "bg-amber-500" },
    { id: "prize", name: "경품/추첨권", badgeColor: "bg-purple-500" },
  ],
  multiItemMode: false,
  gasWebhookUrl: DEFAULT_GAS_URL,
  googleSheetUrl: "",
  theme: "outdoor-court",
  fontSize: "normal",
};

let serverParticipants: Participant[] = [];

// Seed sample data if empty
const SAMPLE_NAMES = [
  { name: '김영수', division: '금배부', phone: '010-1234-5678', group: '1코트 (A조)' },
  { name: '이정민', division: '금배부', phone: '010-2345-6789', group: '1코트 (A조)' },
  { name: '박준호', division: '금배부', phone: '010-3456-7890', group: '1코트 (B조)' },
  { name: '최현우', division: '금배부', phone: '010-4567-8901', group: '1코트 (B조)' },
  { name: '정동진', division: '은배부', phone: '010-5678-9012', group: '2코트 (A조)' },
  { name: '강민석', division: '은배부', phone: '010-6789-0123', group: '2코트 (A조)' },
  { name: '조성훈', division: '은배부', phone: '010-7890-1234', group: '2코트 (B조)' },
  { name: '윤재혁', division: '은배부', phone: '010-8901-2345', group: '2코트 (B조)' },
  { name: '임성빈', division: '동배부', phone: '010-9012-3456', group: '3코트 (A조)' },
  { name: '한태웅', division: '동배부', phone: '010-0123-4567', group: '3코트 (A조)' },
  { name: '오세훈', division: '동배부', phone: '010-1122-3344', group: '3코트 (B조)' },
  { name: '송지훈', division: '동배부', phone: '010-2233-4455', group: '3코트 (B조)' },
  { name: '류승원', division: '신인부', phone: '010-3344-5566', group: '4코트 (A조)' },
  { name: '문도현', division: '신인부', phone: '010-4455-6677', group: '4코트 (A조)' },
  { name: '배성민', division: '신인부', phone: '010-5566-7788', group: '4코트 (B조)' },
  { name: '신우철', division: '신인부', phone: '010-6677-8899', group: '4코트 (B조)' },
];

serverParticipants = SAMPLE_NAMES.map((s, idx) => ({
  id: `p-${idx + 1}`,
  name: s.name,
  division: s.division,
  phone: s.phone,
  group: s.group,
  checked: false,
  checkedAt: null,
  items: { gift: false, lunch: false, prize: false },
}));

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
