import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { key: 'home', label: '首页', icon: '🏠', path: '/' },
    { key: 'search', label: '搜索', icon: '🔍', path: '/search' },
    { key: 'recommend', label: '地区推荐', icon: '🌎', path: '/recommend' },
    { key: 'map', label: '地图', icon: '🗺️', path: '/map' },
    { key: 'profile', label: '档案', icon: '👤', path: '/profile' },
    { key: 'ai', label: 'AI助手', icon: '🤖', path: '/ai' }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ key, icon, label, path }) => (
          <button
            key={key}
            onClick={() => handleNavigation(path)}
            className={`flex flex-col items-center space-y-1 p-2 transition-colors relative ${
              location.pathname === path ? 'text-purple-600' : 'text-gray-600'
            }`}
          >
            <span className="text-xl">{icon}</span>
            <span className="text-xs">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default Navigation;