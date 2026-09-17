const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

const base =
  "https://dry-wildflower-2347.leongcheekuan84.workers.dev";


// ======================================================
// 通用 Proxy
// ======================================================

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


// ======================================================
// EURUSD
// ======================================================

app.get("/eurusd", async (req, res) => {
  await proxy(base + "/symbol=EURUSD", res);
});


// ======================================================
// USDCHF
// ======================================================

app.get("/usdchf", async (req, res) => {
  await proxy(base + "/symbol=USDCHF", res);
});


// ======================================================
// XAUUSD
// ======================================================

app.get("/xau", async (req, res) => {
  await proxy(base + "/symbol=XAUUSD", res);
});


// ======================================================
// BTCUSD
// ======================================================

app.get("/btc", async (req, res) => {
  await proxy(base + "/symbol=BTCUSD", res);
});


// ======================================================
// ALL
//
// 重点：
// 每一个请求加入独立 cache-buster
// 防止 Worker / CDN 把第一个 EURUSD response
// 错误重复给其他 symbol
// ======================================================

async function getSymbol(symbol) {

  const url =
    base +
    "/symbol=" +
    encodeURIComponent(symbol) +
    "?_cb=" +
    Date.now() +
    "-" +
    Math.random();

  const r = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Cache-Control": "no-cache"
    }
  });

  if (!r.ok) {
    throw new Error(
      symbol + " upstream returned HTTP " + r.status
    );
  }

  const data = await r.json();

  // 防止 symbol 串线
  if (
    data.symbol &&
    data.symbol.toUpperCase() !== symbol.toUpperCase()
  ) {
    throw new Error(
      "Symbol mismatch: requested " +
      symbol +
      " but received " +
      data.symbol
    );
  }

  return data;
}


app.get("/all", async (req, res) => {

  try {

    // 顺序读取，避免四个请求互相串数据
    const xau = await getSymbol("XAUUSD");
    const btc = await getSymbol("BTCUSD");
    const usdchf = await getSymbol("USDCHF");
    const eurusd = await getSymbol("EURUSD");

    res.set("Access-Control-Allow-Origin", "*");
    res.set("Cache-Control", "no-store, no-cache, must-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    res.json({

      ok: true,

      generated_at:
        new Date().toISOString(),

      symbols: {
        xau: xau.symbol,
        btc: btc.symbol,
        usdchf: usdchf.symbol,
        eurusd: eurusd.symbol
      },

      data: {
        xau,
        btc,
        usdchf,
        eurusd
      }

    });

  } catch (e) {

    res.status(502).json({
      ok: false,
      error: e.message
    });

  }

});


// ======================================================
// HEALTH
// ======================================================

app.get("/health", (req, res) => {

  res.json({
    ok: true,
    service: "fmp-market-bridge",
    time: new Date().toISOString()
  });

});


// ======================================================
// HOME
// ======================================================

app.get("/", (req, res) => {

  res.json({

    ok: true,

    service:
      "FMP Market Bridge",

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


// ======================================================
// START
// ======================================================

app.listen(port, () => {

  console.log(
    `FMP Market Bridge running on port ${port}`
  );

});
