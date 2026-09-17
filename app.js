const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

const base =
  "https://dry-wildflower-2347.leongcheekuan84.workers.dev";

async function getSymbol(symbol) {
  const url = `${base}/?symbol=${encodeURIComponent(symbol)}`;

  const r = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "FMP-Market-Bridge/1.0"
    }
  });

  if (!r.ok) {
    throw new Error(`Worker HTTP ${r.status}`);
  }

  const data = await r.json();

  if (!data || data.ok !== true) {
    throw new Error(`${symbol} upstream error`);
  }

  const received = String(data.symbol || "").toUpperCase();

  if (received !== symbol.toUpperCase()) {
    throw new Error(
      `${symbol} ERROR: received ${received || "UNKNOWN"}`
    );
  }

  return data;
}

async function sendSymbol(symbol, res) {
  try {
    const data = await getSymbol(symbol);

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "no-store");
    res.json(data);
  } catch (e) {
    res.status(502).json({
      ok: false,
      symbol,
      error: e.message
    });
  }
}


// =========================
// 四个固定接口
// =========================

app.get("/xau", async (req, res) => {
  await sendSymbol("XAUUSD", res);
});

app.get("/btc", async (req, res) => {
  await sendSymbol("BTCUSD", res);
});

app.get("/usdchf", async (req, res) => {
  await sendSymbol("USDCHF", res);
});

app.get("/eurusd", async (req, res) => {
  await sendSymbol("EURUSD", res);
});


// =========================
// 一次读取四个品种
// =========================

app.get("/all", async (req, res) => {
  try {
    const symbols = [
      "XAUUSD",
      "BTCUSD",
      "USDCHF",
      "EURUSD"
    ];

    const results = await Promise.allSettled(
      symbols.map(symbol => getSymbol(symbol))
    );

    const output = {};

    symbols.forEach((symbol, i) => {
      const result = results[i];

      if (result.status === "fulfilled") {
        output[symbol] = result.value;
      } else {
        output[symbol] = {
          ok: false,
          symbol,
          error: result.reason.message
        };
      }
    });

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "no-store");

    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      markets: output
    });

  } catch (e) {
    res.status(500).json({
      ok: false,
      error: e.message
    });
  }
});


// =========================
// Health
// =========================

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "fmp-market-bridge",
    time: new Date().toISOString()
  });
});


// =========================
// 首页
// =========================

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "FMP Market Bridge",
    endpoints: [
      "/xau",
      "/btc",
      "/usdchf",
      "/eurusd",
      "/all",
      "/health"
    ]
  });
});


app.listen(port, () => {
  console.log(`FMP Market Bridge running on port ${port}`);
});
