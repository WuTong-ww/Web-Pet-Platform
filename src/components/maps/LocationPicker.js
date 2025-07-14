import React, { useState, useEffect } from 'react';
import { 
  checkLocationPermission, 
  getBestLocation, 
  getCurrentLocation, 
  getLocationByIP, 
  inputTips, 
  reverseGeocode,
  searchPlaces,
  geocode
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

  // 搜索地点（使用输入提示）- 改进版本
const handleSearch = async (query) => {
  if (!query.trim()) {
    setSearchResults([]);
    return;
  }

  setIsLoading(true);
  setError('');
  
  try {
    console.log('🔍 开始搜索:', query);
    
    // 使用当前位置的城市作为搜索范围
    const city = currentLocation?.city || '';
    
    // 方案1：使用inputTips API
    const tipsResults = await inputTips(query, city);
    console.log('📋 输入提示结果:', tipsResults);
    
    // 方案2：使用searchPlaces API作为补充
    const searchResults = await searchPlaces(query, city);
    console.log('🔍 地点搜索结果:', searchResults);
    
    // 合并结果并去重
    const combinedResults = [...tipsResults, ...searchResults];
    const uniqueResults = removeDuplicateResults(combinedResults);
    
    const formattedResults = uniqueResults.map(item => ({
      id: item.id || `${item.name}_${Date.now()}`,
      name: item.name,
      address: item.address,
      district: item.district,
      location: item.location,
      latitude: item.latitude,
      longitude: item.longitude,
      adcode: item.adcode,
      typecode: item.typecode,
      type: item.type,
      province: item.province,
      city: item.city
    }));
    
    console.log('✅ 搜索完成，找到', formattedResults.length, '个结果');
    setSearchResults(formattedResults);
    
  } catch (err) {
    console.error('❌ 搜索失败:', err);
    setError('搜索失败，请重试');
  } finally {
    setIsLoading(false);
  }
};

 // 选择搜索结果
const handleSelectPlace = (place) => {
  console.log('🎯 选择地点:', place);
  
  // 安全地处理位置信息
  let latitude, longitude;
  
  if (place.location && typeof place.location === 'string') {
    // 高德地图API返回的格式：longitude,latitude
    const [lng, lat] = place.location.split(',').map(Number);
    latitude = lat;
    longitude = lng;
  } else if (place.latitude && place.longitude) {
    // 直接包含经纬度的格式
    latitude = place.latitude;
    longitude = place.longitude;
  } else {
    // 如果没有坐标信息，尝试地理编码
    console.warn('⚠️ 地点缺少坐标信息，尝试地理编码');
    handleGeocodePlace(place);
    return;
  }
  
  // 验证坐标有效性
  if (isNaN(latitude) || isNaN(longitude)) {
    console.error('❌ 无效的坐标信息:', { latitude, longitude });
    setError('选择的地点坐标信息无效');
    return;
  }
  
  const location = {
    latitude,
    longitude,
    accuracy: 100, // 搜索结果精度设为100米
    address: place.address || place.name,
    name: place.name,
    district: place.district,
    adcode: place.adcode,
    source: 'search'
  };
  
  console.log('✅ 位置信息处理完成:', location);
  
  setCurrentLocation(location);
  setShowSearch(false);
  setSearchQuery('');
  setSearchResults([]);
  
  if (onLocationSelect) {
    onLocationSelect(location);
  }
};

// 新增：处理需要地理编码的地点
const handleGeocodePlace = async (place) => {
  setIsLoading(true);
  setError('');
  
  try {
    const address = place.address || place.name;
    console.log('🔍 开始地理编码:', address);
    
    const result = await geocode(address);
    
    const location = {
      latitude: result.latitude,
      longitude: result.longitude,
      accuracy: 100,
      address: result.formatted_address || address,
      name: place.name,
      district: place.district,
      adcode: place.adcode,
      source: 'geocode'
    };
    
    console.log('✅ 地理编码成功:', location);
    
    setCurrentLocation(location);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    
    if (onLocationSelect) {
      onLocationSelect(location);
    }
    
  } catch (err) {
    console.error('❌ 地理编码失败:', err);
    setError('无法获取该地点的具体位置');
  } finally {
    setIsLoading(false);
  }
};

// 新增：去除重复结果的函数
const removeDuplicateResults = (results) => {
  const seen = new Set();
  return results.filter(item => {
    const key = `${item.name}_${item.address}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
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
          
          {/* 搜索结果显示 - 改进版本 */}
{searchResults.length > 0 && (
  <div className="search-results">
    <div className="search-results-header">
      <span>找到 {searchResults.length} 个结果</span>
    </div>
    {searchResults.map((place, index) => (
      <div 
        key={place.id || index}
        className="search-result-item"
        onClick={() => handleSelectPlace(place)}
      >
        <div className="place-info">
          <div className="place-name">{place.name}</div>
          <div className="place-address">{place.address}</div>
          {place.district && (
            <div className="place-district">{place.district}</div>
          )}
          {place.type && (
            <div className="place-type">{place.type}</div>
          )}
        </div>
        <div className="place-location">
          {place.location && place.location.includes(',') ? (
            <span className="location-available">📍</span>
          ) : (
            <span className="location-need-geocode">🔍</span>
          )}
        </div>
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