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
