// components/common/PageTransition.js
import React, { useState, useEffect } from 'react';
import './PageTransition.css';

const PageTransition = ({ children, currentView, isLoading }) => {
  const [displayContent, setDisplayContent] = useState(children);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (currentView) {
      setIsTransitioning(true);
      
      // 延迟更新内容，让退出动画先播放
      setTimeout(() => {
        setDisplayContent(children);
        setIsTransitioning(false);
      }, 300);
    }
  }, [currentView, children]);

  // 创建毛球效果
  const createFluffBalls = () => {
    const balls = [];
    for (let i = 0; i < 8; i++) {
      balls.push(
        <div
          key={i}
          className="fluff-ball"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            width: `${Math.random() * 30 + 20}px`,
            height: `${Math.random() * 30 + 20}px`,
          }}
        />
      );
    }
    return balls;
  };

  return (
    <div className="page-transition-container">
      {/* 过渡装饰层 */}
      {isTransitioning && (
        <div className="transition-decoration">
          {createFluffBalls()}
          <div className="transition-hearts">
            <span>💖</span>
            <span>🐾</span>
            <span>✨</span>
          </div>
        </div>
      )}
      
      {/* 页面内容 */}
      <div className={`page-content-wrapper ${isTransitioning ? 'transitioning' : 'active'} ${isLoading ? 'loading' : ''}`}>
        {displayContent}
      </div>
      
      {/* 加载时的毛茸茸效果 */}
      {isLoading && (
        <div className="loading-fluff">
          <div className="loading-paw">🐾</div>
          <div className="loading-text">加载中...</div>
        </div>
      )}
    </div>
  );
};

export default PageTransition;