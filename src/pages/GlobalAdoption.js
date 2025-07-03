import React, { useEffect, useState } from "react";
import PetCard from "../components/PetCard";
import CrawlChinaButton from "../components/CrawlChinaButton";

export default function GlobalAdoption() {
  const [allPets, setAllPets] = useState([]);

  const loadAllPets = async () => {
    // 加载 Petfinder 数据（你原有的逻辑）
    const petfinderRes = await fetch("http://localhost:8080/data/petfinder"); // 你自己的 API 地址
    const petfinderData = await petfinderRes.json();

    // 加载中国区数据（szadopt）
    const chinaRes = await fetch("http://localhost:8080/data/china");
    const chinaData = await chinaRes.json();

    // 合并数据
    const combined = [...petfinderData, ...chinaData];
    setAllPets(combined);
  };

  useEffect(() => {
    loadAllPets();
  }, []);

  return (
    <div>
      <h2>🌏 全球宠物领养信息</h2>
      <CrawlChinaButton onUpdate={loadAllPets} />
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {allPets.map((pet, i) => (
          <PetCard key={i} pet={pet} />
        ))}
      </div>
    </div>
  );
}
