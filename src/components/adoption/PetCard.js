import React from "react";
import { safeTextTruncate } from "../../utils/textUtils";

export default function PetCard({ pet }) {
  const {
    name,
    image,
    detailUrl,
    gender,
    age,
    vaccinated,
    neutered,
    spayed,
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

  // 使用安全的文本截断
  const displayDescription = safeTextTruncate(description, 135, '...');

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
        onError={(e) => {
          // 如果图片加载失败，使用备用图片
          if (pet.fallbackImage && e.target.src !== pet.fallbackImage) {
            e.target.src = pet.fallbackImage;
          }
        }}
      />
      <h3 style={{ fontSize: "1.1rem", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
        {name}
      </h3>

      <div style={{ margin: "4px 0" }}>
        {gender && renderTag(
          gender === "female" || gender === "女" || gender === "母" ? "母" : "公", 
          "#fcd5ce"
        )}
        {age && renderTag(age, "#e0f7fa")}
        {(vaccinated || pet.vaccinated) && renderTag("已接种", "#c8e6c9")}
        {(neutered || spayed || pet.spayed) && renderTag("已绝育", "#ffe0b2")}
        {tags && tags.slice(0, 3).map((tag, i) => (
          <span key={i}>
            {renderTag(tag, "#d7ccc8")}
          </span>
        ))}
      </div>

      {displayDescription && (
        <p style={{ 
          fontSize: "0.85rem", 
          color: "#555", 
          margin: "6px 0",
          lineHeight: "1.4",
          minHeight: "2.8em", // 确保至少两行的高度
          overflow: "hidden"
        }}>
          {displayDescription}
        </p>
      )}

      {detailUrl && (
        <a
          href={detailUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            fontSize: "0.85rem", 
            color: "#1a73e8", 
            textDecoration: "none",
            display: "inline-block",
            marginTop: "4px"
          }}
        >
          查看详情
        </a>
      )}

      {source && (
        <div style={{ 
          marginTop: "6px", 
          fontSize: "0.75rem", 
          color: "#888", 
          fontStyle: "italic",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <span>
            来自：{source === "spca" ? "香港SPCA" : 
                  source === "petfinder" ? "Petfinder" : 
                  source === "szadopt" ? "领养之家" : "其他"}
          </span>
          {pet.emoji && (
            <span style={{ fontSize: "1rem" }}>{pet.emoji}</span>
          )}
        </div>
      )}
    </div>
  );
}