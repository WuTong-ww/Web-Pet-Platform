// ✅ 文件：server/crawler/szadopt.js
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");

async function crawlSzadoptPet() {
  const url = "http://www.szadoptpet.com/petList.aspx";
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const $ = cheerio.load(res.data);
  const petData = [];

  $(".petbox").each((i, el) => {
    const name = $(el).find(".petname").text().trim();
    const img = "http://www.szadoptpet.com" + $(el).find("img").attr("src");
    const detail = $(el).find("a").attr("href");
    const url = "http://www.szadoptpet.com/" + detail;

    petData.push({
      name,
      image: img,
      detailUrl: url,
      source: "szadopt"
    });
  });

  const outPath = path.join(__dirname, "../data/chinaPets.json");
  fs.writeFileSync(outPath, JSON.stringify(petData, null, 2), "utf-8");
  return petData;
}

module.exports = { crawlSzadoptPet };