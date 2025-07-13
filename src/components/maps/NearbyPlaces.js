import React, { useState, useEffect } from 'react';
import { fetchNearbyActivities, fetchPlaceDetails } from '../../services/mapService';
import LocationPicker from './LocationPicker';
import StaticMap from './StaticMap';
import './NearbyPlaces.css';

const NearbyPlaces = () => {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [radius, setRadius] = useState(5000);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('distance');

  // 获取附近场所
  const fetchPlaces = async (userLocation, searchRadius = radius) => {
    if (!userLocation) return;
    
    setLoading(true);
    setError('');
    
    try {
      const results = await fetchNearbyActivities(
        userLocation.latitude, 
        userLocation.longitude, 
        searchRadius
      );
      setPlaces(results);
    } catch (err) {
      console.error('获取附近场所失败:', err);
      setError('获取附近场所失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  // 位置选择回调
  const handleLocationSelect = (newLocation) => {
    setLocation(newLocation);
    fetchPlaces(newLocation);
  };

  // 查看详情
  const handleViewDetails = async (place) => {
    setLoading(true);
    try {
      const details = await fetchPlaceDetails(place.id);
      setSelectedPlace({ ...place, ...details });
      setShowDetails(true);
    } catch (err) {
      console.error('获取详情失败:', err);
      setSelectedPlace(place);
      setShowDetails(true);
    } finally {
      setLoading(false);
    }
  };

  // 导航到目的地
  const handleNavigate = (place) => {
    // 使用高德地图导航
    const amapUrl = `https://uri.amap.com/navigation?to=${place.longitude},${place.latitude}&toname=${encodeURIComponent(place.name)}&callnative=1`;
    // 备用：百度地图
    const baiduUrl = `https://api.map.baidu.com/marker?location=${place.latitude},${place.longitude}&title=${encodeURIComponent(place.name)}&content=${encodeURIComponent(place.address)}&output=html`;
    
    window.open(amapUrl, '_blank');
  };

  // 过滤和排序场所
  const getFilteredAndSortedPlaces = () => {
    let filtered = places;
    
    // 类型过滤
    if (filter !== 'all') {
      filtered = filtered.filter(place => place.type === filter);
    }
    
    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          const distanceA = parseFloat(a.distance) || 999;
          const distanceB = parseFloat(b.distance) || 999;
          return distanceA - distanceB;
        case 'rating':
          return parseFloat(b.rating) - parseFloat(a.rating);
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
    
    return filtered;
  };

  // 获取场所类型列表
  const getPlaceTypes = () => {
    const types = [...new Set(places.map(place => place.type))];
    return types;
  };

  const filteredPlaces = getFilteredAndSortedPlaces();

  return (
    <div className="nearby-places">
      <div className="header">
        <h2>🐾 附近宠物友好场所</h2>
        <p>发现你周围的宠物友好场所，让毛孩子快乐出行</p>
      </div>

      <LocationPicker 
        onLocationSelect={handleLocationSelect}
        initialLocation={location}
      />

      {location && (
        <div className="map-container">
          <StaticMap 
            location={location}
            places={filteredPlaces.slice(0, 10)}
            zoom={13}
            size="800*400"
            showMarkers={true}
          />
        </div>
      )}

      {location && (
        <div className="search-controls">
          <div className="control-group">
            <label>搜索半径：</label>
            <select 
              value={radius} 
              onChange={(e) => {
                const newRadius = parseInt(e.target.value);
                setRadius(newRadius);
                fetchPlaces(location, newRadius);
              }}
            >
              <option value={1000}>1公里</option>
              <option value={3000}>3公里</option>
              <option value={5000}>5公里</option>
              <option value={10000}>10公里</option>
              <option value={20000}>20公里</option>
            </select>
          </div>

          <div className="control-group">
            <label>类型筛选：</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">全部类型</option>
              {getPlaceTypes().map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label>排序方式：</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="distance">按距离排序</option>
              <option value="rating">按评分排序</option>
              <option value="name">按名称排序</option>
            </select>
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>正在搜索附近的宠物友好场所...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => fetchPlaces(location)}>重试</button>
        </div>
      )}

      {filteredPlaces.length > 0 && (
        <div className="places-section">
          <div className="places-header">
            <h3>找到 {filteredPlaces.length} 个宠物友好场所</h3>
          </div>
          
          <div className="places-grid">
            {filteredPlaces.map((place, index) => (
              <div key={index} className="place-card">
                <div className="place-header">
                  <h4>{place.name}</h4>
                  <span className={`place-type ${place.type.replace(/\s+/g, '-').toLowerCase()}`}>
                    {place.type}
                  </span>
                </div>
                
                <div className="place-info">
                  <div className="info-row">
                    <span className="icon">📍</span>
                    <span className="text">{place.address}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="icon">📏</span>
                    <span className="text">{place.distance}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="icon">⭐</span>
                    <span className="text">{place.rating} ({place.reviewCount}条评价)</span>
                  </div>
                  
                  {place.operatingHours && (
                    <div className="info-row">
                      <span className="icon">🕐</span>
                      <span className="text">{place.operatingHours}</span>
                    </div>
                  )}

                  {place.phone && (
                    <div className="info-row">
                      <span className="icon">📞</span>
                      <span className="text">{place.phone}</span>
                    </div>
                  )}
                </div>

                {place.tags && place.tags.length > 0 && (
                  <div className="place-tags">
                    {place.tags.slice(0, 3).map((tag, tagIndex) => (
                      <span key={tagIndex} className="tag">{tag}</span>
                    ))}
                  </div>
                )}

                <div className="place-actions">
                  <button 
                    className="btn-details"
                    onClick={() => handleViewDetails(place)}
                  >
                    查看详情
                  </button>
                  
                  <button 
                    className="btn-navigate"
                    onClick={() => handleNavigate(place)}
                  >
                    导航
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && filteredPlaces.length === 0 && location && (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>没有找到符合条件的场所</h3>
          <p>尝试扩大搜索范围或更换筛选条件</p>
          <button onClick={() => {
            setFilter('all');
            setRadius(10000);
            fetchPlaces(location, 10000);
          }}>
            重置筛选条件
          </button>
        </div>
      )}

      {/* 详情模态框 */}
      {showDetails && selectedPlace && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedPlace.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {selectedPlace.photos && selectedPlace.photos.length > 0 && (
                <div className="place-photos">
                  {selectedPlace.photos.slice(0, 3).map((photo, index) => (
                    <img key={index} src={photo} alt={`${selectedPlace.name} ${index + 1}`} />
                  ))}
                </div>
              )}
              
              <div className="place-details">
                <div className="detail-row">
                  <strong>地址：</strong>
                  <span>{selectedPlace.address}</span>
                </div>
                
                {selectedPlace.phone && (
                  <div className="detail-row">
                    <strong>电话：</strong>
                    <span>{selectedPlace.phone}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <strong>营业时间：</strong>
                  <span>{selectedPlace.operatingHours}</span>
                </div>
                
                <div className="detail-row">
                  <strong>评分：</strong>
                  <span>{selectedPlace.rating}⭐ ({selectedPlace.reviewCount}条评价)</span>
                </div>
                
                <div className="detail-row">
                  <strong>距离：</strong>
                  <span>{selectedPlace.distance}</span>
                </div>
                
                {selectedPlace.description && (
                  <div className="detail-row">
                    <strong>简介：</strong>
                    <span>{selectedPlace.description}</span>
                  </div>
                )}
                
                {selectedPlace.features && selectedPlace.features.length > 0 && (
                  <div className="detail-row">
                    <strong>特色服务：</strong>
                    <div className="features">
                      {selectedPlace.features.map((feature, index) => (
                        <span key={index} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedPlace.reviews && selectedPlace.reviews.length > 0 && (
                  <div className="detail-row">
                    <strong>用户评价：</strong>
                    <div className="reviews">
                      {selectedPlace.reviews.map((review, index) => (
                        <div key={index} className="review">
                          <div className="review-header">
                            <span className="reviewer">{review.user}</span>
                            <span className="rating">{review.rating}⭐</span>
                          </div>
                          <p className="review-text">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-navigate large"
                onClick={() => {
                  handleNavigate(selectedPlace);
                  setShowDetails(false);
                }}
              >
                🧭 导航到这里
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NearbyPlaces;