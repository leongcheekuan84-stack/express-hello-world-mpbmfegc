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
    res.set("Content-Type",
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


// 固定 EURUSD endpoint
app.get("/eurusd", async (req, res) => {
  await proxy(base + "/?symbol=EURUSD", res);
});


// 健康检查
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "fmp-market-bridge",
    time: new Date().toISOString()
  });
});


// 保留原本 ?symbol=EURUSD 用法
app.get("/", async (req, res) => {

  const query =
    new URLSearchParams(req.query).toString();

  await proxy(
    base + (query ? "/?" + query : "/"),
    res
  );

});


app.listen(port, "0.0.0.0", () => {
  console.log(
    "FMP Market Bridge running on port " + port
  );
});
