import React, { useEffect, useState } from 'react';
import './MouseClickEffect.css';
import { playClickSound } from '../../utils/soundEffects';


const MouseClickEffect = () => {
  const [effects, setEffects] = useState([]);
  
  const pawEmojis = ['🐾', '🐕', '🐱', '🐹', '🐰', '🦊', '🐻', '🐼'];
  const heartEmojis = ['❤️', '💕', '💖', '💗', '💝', '💟'];
  const sparkleEmojis = ['✨', '🌟', '💫', '⭐', '🌠'];
  
  useEffect(() => {
    
    const handleClick = (e) => {
      playClickSound();
    console.log('鼠标点击音效触发');
      
      // 主要的爪印效果
      const mainEffect = {
        id: Date.now(),
        x: e.clientX,
        y: e.clientY,
        emoji: pawEmojis[Math.floor(Math.random() * pawEmojis.length)],
        size: Math.random() * 15 + 25,
        duration: Math.random() * 500 + 1500,
        type: 'main'
      };
      
      setEffects(prev => [...prev, mainEffect]);
      
      // 创建毛茸茸的粒子效果
      const particleCount = Math.floor(Math.random() * 5) + 3;
      for (let i = 0; i < particleCount; i++) {
        setTimeout(() => {
          const angle = (Math.PI * 2 * i) / particleCount;
          const distance = Math.random() * 80 + 40;
          const particle = {
            id: Date.now() + i + 1000,
            x: e.clientX + Math.cos(angle) * distance,
            y: e.clientY + Math.sin(angle) * distance,
            emoji: sparkleEmojis[Math.floor(Math.random() * sparkleEmojis.length)],
            size: Math.random() * 8 + 12,
            duration: Math.random() * 800 + 1200,
            type: 'particle'
          };
          setEffects(prev => [...prev, particle]);
        }, i * 100);
      }
      
      // 随机添加爱心效果
      if (Math.random() < 0.3) {
        setTimeout(() => {
          const heart = {
            id: Date.now() + 2000,
            x: e.clientX + (Math.random() - 0.5) * 60,
            y: e.clientY + (Math.random() - 0.5) * 60,
            emoji: heartEmojis[Math.floor(Math.random() * heartEmojis.length)],
            size: Math.random() * 10 + 18,
            duration: Math.random() * 600 + 1400,
            type: 'heart'
          };
          setEffects(prev => [...prev, heart]);
        }, 200);
      }
      
      // 创建涟漪效果
      const ripple = {
        id: Date.now() + 3000,
        x: e.clientX,
        y: e.clientY,
        emoji: '',
        size: 0,
        duration: 800,
        type: 'ripple'
      };
      setEffects(prev => [...prev, ripple]);
    };
    
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);
  
  // 清理过期效果
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setEffects(prev => prev.filter(effect => 
        now - effect.id < effect.duration
      ));
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="mouse-click-effects">
      {effects.map(effect => (
        <div
          key={effect.id}
          className={`effect-${effect.type}`}
          style={{
            left: effect.x,
            top: effect.y,
            fontSize: `${effect.size}px`,
            '--duration': `${effect.duration}ms`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {effect.emoji}
        </div>
      ))}
    </div>
  );
};

export default MouseClickEffect;