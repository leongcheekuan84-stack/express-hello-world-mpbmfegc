const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

const base =
  "https://dry-wildflower-2347.leongcheekuan84.workers.dev";

async function proxy(url, res) {
  try {
    const r = await fetch(url);
    const body = Buffer.from(await r.arrayBuffer());

    res.status(r.status);
    res.set(
      "Content-Type",
      r.headers.get("content-type") || "application/json"
    );
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "no-store");

    res.send(body);
  } catch (e) {
    res.status(502).json({
      ok: false,
      error: e.message
    });
  }
}


// EURUSD
app.get("/eurusd", async (req, res) => {
  await proxy(base + "/symbol=EURUSD", res);
});


// USDCHF
app.get("/usdchf", async (req, res) => {
  await proxy(base + "/symbol=USDCHF", res);
});


// XAUUSD
app.get("/xau", async (req, res) => {
  await proxy(base + "/symbol=XAUUSD", res);
});


// BTCUSD
app.get("/btc", async (req, res) => {
  await proxy(base + "/symbol=BTCUSD", res);
});


// ALL 4 SYMBOLS
app.get("/all", async (req, res) => {
  try {
    const symbols = {
      xau: "XAUUSD",
      btc: "BTCUSD",
      usdchf: "USDCHF",
      eurusd: "EURUSD"
    };

    const result = {};

    for (const [key, symbol] of Object.entries(symbols)) {
      const r = await fetch(base + "/symbol=" + symbol);

      if (!r.ok) {
        throw new Error(
          symbol + " upstream returned " + r.status
        );
      }

      result[key] = await r.json();
    }

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "no-store");

    res.json({
      ok: true,
      generated_at: new Date().toISOString(),
      data: result
    });

  } catch (e) {
    res.status(502).json({
      ok: false,
      error: e.message
    });
  }
});


// HEALTH CHECK
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "fmp-market-bridge",
    time: new Date().toISOString()
  });
});


// HOME
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "FMP Market Bridge",
    endpoints: [
      "/all",
      "/xau",
      "/btc",
      "/usdchf",
      "/eurusd",
      "/health"
    ]
  });
});


app.listen(port, () => {
  console.log(`FMP Market Bridge running on port ${port}`);
});
