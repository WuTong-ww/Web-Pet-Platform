// ✅ 文件：src/components/PetCard.js
import React from "react";
import { truncateText } from "../../utils/textUtils";

export default function PetCard({ pet }) {
  const {
    name,
    image,
    detailUrl,
    gender,
    age,
    vaccinated,
    neutered,
    tags,
    source,
    description
  } = pet;

  const renderTag = (label, color) => (
    <span
      style={{
        backgroundColor: color || "#eee",
        color: "#333",
        fontSize: "0.75rem",
        padding: "2px 6px",
        marginRight: "4px",
        borderRadius: "4px",
        display: "inline-block"
      }}
    >
      {label}
    </span>
  );

  return (
    <div
      style={{
        width: "220px",
        border: "1px solid #ddd",
        borderRadius: "8px",
        padding: "10px",
        backgroundColor: "#fff",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }}
    >
      <img
        src={image}
        alt={name}
        style={{ width: "100%", height: "160px", objectFit: "cover", borderRadius: "4px" }}
      />
      <h3 style={{ fontSize: "1.1rem", marginTop: "0.5rem" }}>{name}</h3>

      <div style={{ margin: "4px 0" }}>
        {gender && renderTag(gender === "female" || gender === "女" ? "母" : "公", "#fcd5ce")}
        {age && renderTag(age, "#e0f7fa")}
        {vaccinated && renderTag("已接种", "#c8e6c9")}
        {neutered && renderTag("已绝育", "#ffe0b2")}
        {tags && tags.map((t, i) => renderTag(t, "#d7ccc8"))}
      </div>

      {description && (
        <p style={{ fontSize: "0.85rem", color: "#555", margin: "6px 0" }}>
          {truncateText(description, 80)}
        </p>
      )}

      {detailUrl && (
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: "0.85rem", color: "#1a73e8", textDecoration: "none" }}
        >
          查看详情
        </a>
      )}

      {source && (
        <div style={{ marginTop: "6px", fontSize: "0.75rem", color: "#888", fontStyle: "italic" }}>
          来自：{source === "szadopt" ? "领养之家" : source === "spca" ? "香港愛護動物協會" : "Petfinder"}
        </div>
      )}
    </div>
  );
}
