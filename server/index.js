// ✅ 文件：server/index.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { crawlSzadoptPet } = require("./crawler/szadopt");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/crawl/china", async (req, res) => {
  try {
    const data = await crawlSzadoptPet();
    res.json({ status: "success", count: data.length });
  } catch (err) {
    res.status(500).json({ error: err.toString() });
  }
});

app.get("/data/china", (req, res) => {
  const file = path.join(__dirname, "data/chinaPets.json");
  if (!fs.existsSync(file)) return res.status(404).json([]);
  const content = fs.readFileSync(file, "utf-8");
  res.json(JSON.parse(content));
});

app.listen(8080, () => {
  console.log("✅ API server running at http://localhost:8080");
});
