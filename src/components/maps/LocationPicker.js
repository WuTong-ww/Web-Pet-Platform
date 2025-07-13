import React, { useState, useEffect } from 'react';
import { getCurrentLocation, getLocationByIP, inputTips, reverseGeocode } from '../../services/mapService';
import './LocationPicker.css';

const LocationPicker = ({ onLocationSelect, initialLocation = null }) => {
  const [currentLocation, setCurrentLocation] = useState(initialLocation);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (initialLocation) {
      setCurrentLocation(initialLocation);
    }
  }, [initialLocation]);

  // 获取当前位置
  const handleGetCurrentLocation = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const location = await getCurrentLocation();
      
      // 获取地址信息
      try {
        const addressInfo = await reverseGeocode(location.latitude, location.longitude);
        const formattedLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: addressInfo.formatted_address,
          city: addressInfo.city,
          district: addressInfo.district,
          source: 'gps'
        };
        
        setCurrentLocation(formattedLocation);
        
        if (onLocationSelect) {
          onLocationSelect(formattedLocation);
        }
      } catch (addressError) {
        // 如果逆地理编码失败，仍然使用坐标
        const basicLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
          address: `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`,
          source: 'gps'
        };
        
        setCurrentLocation(basicLocation);
        
        if (onLocationSelect) {
          onLocationSelect(basicLocation);
        }
      }
      
    } catch (err) {
      console.error('获取当前位置失败:', err);
      // 尝试IP定位
      try {
        const ipLocation = await getLocationByIP();
        const formattedLocation = {
          latitude: ipLocation.latitude,
          longitude: ipLocation.longitude,
          address: `${ipLocation.city}, ${ipLocation.province}`,
          city: ipLocation.city,
          province: ipLocation.province,
          source: 'ip'
        };
        
        setCurrentLocation(formattedLocation);
        
        if (onLocationSelect) {
          onLocationSelect(formattedLocation);
        }
      } catch (ipErr) {
        setError('无法获取位置信息，请手动搜索位置或检查位置权限');
      }
    } finally {
      setIsLoading(false);
    }
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
          {currentLocation?.source === 'ip' && (
            <span className="location-source">(IP定位)</span>
          )}
          {currentLocation?.source === 'gps' && (
            <span className="location-source">(GPS定位)</span>
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
          {error}
        </div>
      )}
    </div>
  );
};

export default LocationPicker;