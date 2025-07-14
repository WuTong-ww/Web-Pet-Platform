import React, { useState, useEffect } from 'react';
import NearbyPlaces from '../components/maps/NearbyPlaces';
import { getCurrentLocation, getLocationByIP } from '../services/mapService';
import './MapPage.css';

const MapPage = () => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);

  // 获取用户位置
  const getLocation = async () => {
    setIsLoadingLocation(true);
    setLocationError('');
    
    try {
      // 优先使用GPS定位
      console.log('🔍 尝试GPS定位...');
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      console.log('✅ GPS定位成功:', location);
    } catch (gpsError) {
      console.warn('GPS定位失败:', gpsError.message);
      
      try {
        // 使用IP定位作为备用
        console.log('🌐 尝试IP定位...');
        const ipLocation = await getLocationByIP();
        setCurrentLocation(ipLocation);
        console.log('✅ IP定位成功:', ipLocation);
      } catch (ipError) {
        console.error('IP定位也失败:', ipError.message);
        setLocationError('无法获取位置信息，请手动搜索位置或检查位置权限');
      }
    } finally {
      setIsLoadingLocation(false);
      setShowLocationModal(false);
    }
  };

  // 处理用户同意获取定位
  const handleAllowLocation = () => {
    getLocation();
  };

  // 处理用户拒绝获取定位
  const handleDenyLocation = () => {
    setShowLocationModal(false);
    setLocationError('您拒绝了定位请求，可以手动搜索位置');
  };

  // 组件加载时显示定位请求弹窗
  useEffect(() => {
    // 延迟显示弹窗，让页面先加载完成
    const timer = setTimeout(() => {
      setShowLocationModal(true);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="map-page">
      <div className="map-page-header">
        <h1>🗺️ 动态地图服务</h1>
        <p>探索您附近的宠物友好场所，支持实时交互和导航</p>
        
        {/* 位置状态显示 */}
        <div className="location-status">
          {isLoadingLocation && (
            <div className="location-loading">
              <div className="spinner"></div>
              <span>正在获取您的位置...</span>
            </div>
          )}
          
          {currentLocation && (
            <div className="location-success">
              <span>📍 当前位置: {currentLocation.city || '未知'} ({currentLocation.source === 'gps' ? 'GPS' : 'IP'}定位)</span>
              <button onClick={() => setShowLocationModal(true)} disabled={isLoadingLocation}>
                🔄 重新定位
              </button>
            </div>
          )}
          
          {locationError && (
            <div className="location-error">
              <span>⚠️ {locationError}</span>
              <button onClick={() => setShowLocationModal(true)} disabled={isLoadingLocation}>
                🔄 重试
              </button>
            </div>
          )}
        </div>
      </div>
      
      <NearbyPlaces initialLocation={currentLocation} />
      
      {/* 定位请求弹窗 */}
      {showLocationModal && (
        <div className="location-modal-overlay">
          <div className="location-modal">
            <div className="modal-header">
              <h3>🗺️ 位置访问请求</h3>
            </div>
            <div className="modal-content">
              <div className="modal-icon">📍</div>
              <p>为了为您提供最佳的宠物友好场所推荐，我们需要获取您的位置信息。</p>
              <div className="modal-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">🎯</span>
                  <span>精准推荐附近的宠物友好场所</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">🚶</span>
                  <span>显示距离和导航信息</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">⚡</span>
                  <span>实时更新周边服务</span>
                </div>
              </div>
              <p className="privacy-note">
                <small>💡 我们承诺不会存储您的位置信息，仅用于当前服务</small>
              </p>
            </div>
            <div className="modal-actions">
              <button 
                className="btn-deny" 
                onClick={handleDenyLocation}
                disabled={isLoadingLocation}
              >
                暂不需要
              </button>
              <button 
                className="btn-allow" 
                onClick={handleAllowLocation}
                disabled={isLoadingLocation}
              >
                {isLoadingLocation ? '获取中...' : '允许定位'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPage;