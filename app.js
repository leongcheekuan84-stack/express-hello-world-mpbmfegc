const express = require("express");

const app = express();
const port = process.env.PORT || 10000;

const worker =
  "https://dry-wildflower-2347.leongcheekuan84.workers.dev";

const renderBase =
  "https://fmp-market-bridge.onrender.com";


// ======================================================
// PROXY
// ======================================================

async function proxy(url, res) {
  try {
    const r = await fetch(url);

    const body = Buffer.from(
      await r.arrayBuffer()
    );

    res.status(r.status);

    res.set(
      "Content-Type",
      r.headers.get("content-type") ||
      "application/json"
    );

    res.set(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.set(
      "Cache-Control",
      "no-store"
    );

    res.send(body);

  } catch (e) {

    res.status(502).json({
      ok: false,
      error: e.message
    });

  }
}


// ======================================================
// 原本已经验证成功的四个接口
// ======================================================

app.get("/xau", async (req, res) => {

  await proxy(
    worker + "/symbol=XAUUSD",
    res
  );

});


app.get("/btc", async (req, res) => {

  await proxy(
    worker + "/symbol=BTCUSD",
    res
  );

});


app.get("/usdchf", async (req, res) => {

  await proxy(
    worker + "/symbol=USDCHF",
    res
  );

});


app.get("/eurusd", async (req, res) => {

  await proxy(
    worker + "/symbol=EURUSD",
    res
  );

});


// ======================================================
// 读取 Render 自己已经验证成功的接口
// ======================================================

async function readEndpoint(endpoint) {

  const url =
    renderBase +
    endpoint +
    "?t=" +
    Date.now() +
    "-" +
    Math.random();

  const r = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Cache-Control": "no-cache"
    }
  });

  if (!r.ok) {

    throw new Error(
      endpoint +
      " returned HTTP " +
      r.status
    );

  }

  return await r.json();
}


// ======================================================
// ALL
// ======================================================

app.get("/all", async (req, res) => {

  try {

    const xau =
      await readEndpoint("/xau");

    const btc =
      await readEndpoint("/btc");

    const usdchf =
      await readEndpoint("/usdchf");

    const eurusd =
      await readEndpoint("/eurusd");


    // 强制检查，防止以后再次串 symbol

    if (xau.symbol !== "XAUUSD") {
      throw new Error(
        "XAU ERROR: received " +
        xau.symbol
      );
    }

    if (btc.symbol !== "BTCUSD") {
      throw new Error(
        "BTC ERROR: received " +
        btc.symbol
      );
    }

    if (usdchf.symbol !== "USDCHF") {
      throw new Error(
        "USDCHF ERROR: received " +
        usdchf.symbol
      );
    }

    if (eurusd.symbol !== "EURUSD") {
      throw new Error(
        "EURUSD ERROR: received " +
        eurusd.symbol
      );
    }


    res.set(
      "Access-Control-Allow-Origin",
      "*"
    );

    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate"
    );


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
