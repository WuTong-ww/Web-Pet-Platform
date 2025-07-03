import React, { useState } from "react";

export default function CrawlChinaButton({ onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleClick = async () => {
    setLoading(true);
    setMessage("正在抓取...");
    try {
      const res = await fetch("http://localhost:8080/crawl/china");
      const data = await res.json();
      if (data.status === "success") {
        setMessage(`成功抓取 ${data.count} 条数据`);
        onUpdate && onUpdate();
      } else {
        setMessage("抓取失败");
      }
    } catch (e) {
      setMessage("网络错误或服务器故障");
    }
    setLoading(false);
  };

  return (
    <div style={{ margin: "1rem 0" }}>
      <button onClick={handleClick} disabled={loading}>
        {loading ? "抓取中..." : "抓取宠物数据"}
      </button>
      <div>{message}</div>
    </div>
  );
}
