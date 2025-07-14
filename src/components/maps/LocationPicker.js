import React, { useState, useEffect } from 'react';
import { 
  checkLocationPermission, 
  getBestLocation, 
  getCurrentLocation, 
  getLocationByIP, 
  inputTips, 
  reverseGeocode 
} from '../../services/mapService';
import './LocationPicker.css';

const LocationPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [locationPermission, setLocationPermission] = useState(null);
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation]);

  // 检查定位权限
  const checkPermission = async () => {
    try {
      const permission = await checkLocationPermission();
      console.log('🔍 权限检查结果:', permission);
      setLocationPermission(permission);
      return permission;
    } catch (error) {
      console.error('检查定位权限失败:', error);
      return { state: 'unknown', granted: false, denied: false, prompt: true };
    }
  };

  // 请求定位权限
  const requestLocationPermission = async () => {
    console.log('🚪 显示权限请求弹窗');
    setShowPermissionModal(true);
  };

  // 处理用户同意定位
  const handleAllowLocation = async () => {
    console.log('✅ 用户同意定位');
    setShowPermissionModal(false);
    setIsLoading(true);
    setError('');

    try {
      console.log('🔐 用户同意定位，开始获取最佳位置...');
      const location = await getBestLocation();
      await handleLocationSuccess(location);
    } catch (err) {
      console.error('获取位置失败:', err);
      setError(`定位失败: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理用户拒绝定位
  const handleDenyLocation = async () => {
    console.log('❌ 用户拒绝定位');
    setShowPermissionModal(false);
    setIsLoading(true);
    setError('');

    try {
      console.log('🌐 用户拒绝定位，使用IP定位...');
      const ipLocation = await getLocationByIP();
      await handleLocationSuccess(ipLocation);
    } catch (err) {
      console.error('IP定位失败:', err);
      setError('IP定位失败，请手动搜索位置');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理位置获取成功
  const handleLocationSuccess = async (location) => {
    try {
      // 获取详细地址信息
      const addressInfo = await reverseGeocode(location.latitude, location.longitude);
      
      const formattedLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: addressInfo.formatted_address,
        city: addressInfo.city,
        district: addressInfo.district,
        province: addressInfo.province,
        source: location.source
      };

      console.log('✅ 位置处理成功:', formattedLocation);
      setCurrentLocation(formattedLocation);

      if (onLocationSelect) {
        onLocationSelect(formattedLocation);
      }
    } catch (addressError) {
      console.warn('逆地理编码失败，使用基本位置信息:', addressError);
      
      // 如果逆地理编码失败，使用基本信息
      const basicLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy,
        address: location.city ? 
          `${location.city}, ${location.province || ''}` : 
          `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
        city: location.city,
        province: location.province,
        source: location.source
      };

      setCurrentLocation(basicLocation);

      if (onLocationSelect) {
        onLocationSelect(basicLocation);
      }
    }
  };

  // 获取当前位置
  const handleGetCurrentLocation = async () => {
    setError('');
    
    // 首先检查权限
    const permission = await checkPermission();
    
    console.log('🔍 权限状态:', permission);
    
    if (permission.denied) {
      setError('定位权限被拒绝。您可以：\n1. 在浏览器设置中允许定位\n2. 使用IP定位\n3. 手动搜索位置');
      return;
    }

    if (permission.granted) {
      // 已有权限，直接定位
      console.log('🚀 已有权限，直接定位');
      await handleAllowLocation();
      return;
    }

    // 需要请求权限 (prompt 或 unknown)
    console.log('🚪 需要请求权限，显示弹窗');
    await requestLocationPermission();
  };

  // 搜索地点（使用输入提示）
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await inputTips(query, currentLocation?.city || '');
      const formattedResults = results.map(tip => ({
        id: tip.id,
        name: tip.name,
        address: tip.address,
        district: tip.district,
        location: tip.location,
        adcode: tip.adcode,
        typecode: tip.typecode
      }));
      setSearchResults(formattedResults);
    } catch (err) {
      console.error('搜索失败:', err);
      setError('搜索失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 选择搜索结果
  const handleSelectPlace = (place) => {
    if (place.location) {
      const [lng, lat] = place.location.split(',').map(Number);
      const location = {
        latitude: lat,
        longitude: lng,
        address: place.address || place.name,
        name: place.name,
        district: place.district,
        adcode: place.adcode,
        source: 'search'
      };
      
      setCurrentLocation(location);
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      
      if (onLocationSelect) {
        onLocationSelect(location);
      }
    }
  };

  return (
    <div className="location-picker">
      <div className="location-display">
        <div className="current-location">
          <span className="location-icon">📍</span>
          <span className="location-text">
            {currentLocation ? (currentLocation.address || '位置已选择') : '请选择位置'}
          </span>
          {currentLocation?.source === 'ip_amap' && (
            <span className="location-source">(高德IP定位)</span>
          )}
          {currentLocation?.source === 'ip_fallback' && (
            <span className="location-source">(备用IP定位)</span>
          )}
          {currentLocation?.source === 'gps' && (
            <span className="location-source">(GPS定位)</span>
          )}
          {currentLocation?.accuracy && (
            <span className="location-accuracy">
              (精度: {currentLocation.accuracy}米)
            </span>
          )}
        </div>
        
        <div className="location-actions">
          <button 
            className="btn-location"
            onClick={handleGetCurrentLocation}
            disabled={isLoading}
          >
            {isLoading ? '定位中...' : '📍 当前位置'}
          </button>
          
          <button 
            className="btn-search"
            onClick={() => setShowSearch(!showSearch)}
          >
            🔍 搜索位置
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-panel">
          <div className="search-input">
            <input
              type="text"
              placeholder="搜索地点..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
          
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((place, index) => (
                <div 
                  key={index}
                  className="search-result-item"
                  onClick={() => handleSelectPlace(place)}
                >
                  <div className="place-name">{place.name}</div>
                  <div className="place-address">{place.address}</div>
                  {place.district && (
                    <div className="place-district">{place.district}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <div className="error-content">
            {error.split('\n').map((line, index) => (
              <div key={index}>{line}</div>
            ))}
          </div>
          <div className="error-actions">
            <button 
              className="btn-retry"
              onClick={() => handleDenyLocation()}
            >
              使用IP定位
            </button>
            <button 
              className="btn-search-alt"
              onClick={() => setShowSearch(true)}
            >
              手动搜索
            </button>
          </div>
        </div>
      )}

      {/* 定位权限请求弹窗 */}
      {showPermissionModal && (
        <div className="permission-modal-overlay">
          <div className="permission-modal">
            <div className="modal-header">
              <h3>🗺️ 位置访问请求</h3>
            </div>
            <div className="modal-content">
              <div className="modal-icon">📍</div>
              <p>为了为您提供最佳的服务，我们需要获取您的位置信息。</p>
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
                disabled={isLoading}
              >
                使用IP定位
              </button>
              <button 
                className="btn-allow" 
                onClick={handleAllowLocation}
                disabled={isLoading}
              >
                {isLoading ? '获取中...' : '允许精确定位'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;