import React, { useEffect } from 'react';
import './MouseClickEffect.css';

const MouseClickEffect = () => {
  useEffect(() => {
    const handleClick = (e) => {
      // 创建爪印元素
      const paw = document.createElement('div');
      paw.className = 'paw-print-effect';
      paw.innerHTML = '🐾';
      
      // 设置位置
      paw.style.left = e.clientX + 'px';
      paw.style.top = e.clientY + 'px';
      
      // 添加到页面
      document.body.appendChild(paw);
      
      // 动画结束后移除元素
      setTimeout(() => {
        if (paw.parentNode) {
          paw.parentNode.removeChild(paw);
        }
      }, 1000);
    };

    // 添加全局点击事件监听器
    document.addEventListener('click', handleClick);

    // 清理函数
    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  return null; // 这个组件不渲染任何内容
};

export default MouseClickEffect;