import React, { useState, useEffect } from 'react';
import { fetchNearbyActivities, fetchPlaceDetails, getLocationByIP } from '../../services/mapService';
import LocationPicker from './LocationPicker';
import DynamicMap from './DynamicMap';
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
  const [isInitializing, setIsInitializing] = useState(true);

   // 组件初始化时自动获取位置
   useEffect(() => {
    const initializeLocation = async () => {
      setIsInitializing(true);
      try {
        console.log('🗺️ 地图页面初始化，自动获取位置...');
        
        // 优先使用IP定位作为默认位置
        const ipLocation = await getLocationByIP();
        console.log('✅ 自动获取位置成功:', ipLocation);
        
        setLocation(ipLocation);
        
        // 自动搜索附近的宠物场所
        await fetchPlaces(ipLocation);
        
      } catch (err) {
        console.error('自动获取位置失败:', err);
        
        // 如果IP定位也失败，设置一个默认位置（比如北京）
        const defaultLocation = {
          latitude: 31.22786,
          longitude: 121.40652,
          accuracy: 10000,
          city: '上海市',
          province: '上海市',
          address: '华东师范大学',
          source: 'default'
        };
        
        setLocation(defaultLocation);
        setError('无法获取您的位置，已设为默认位置。您可以手动搜索或重新定位。');
      } finally {
        setIsInitializing(false);
      }
    };

    initializeLocation();
  }, []);

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

  // 位置选择回调 - 优化版本
  const handleLocationSelect = (newLocation) => {
    console.log('新选择的位置:', newLocation);
    
    // 如果位置精度太低，提示用户
    if (newLocation.accuracy && newLocation.accuracy > 1000) {
      setError(`位置精度较低(${newLocation.accuracy}米)，搜索结果可能不够准确`);
    } else {
      setError(''); // 清除之前的错误
    }
    
    setLocation(newLocation);
    fetchPlaces(newLocation);
  };

  // 查看详情
  const handleViewDetails = async (place) => {
    setLoading(true);
    try {
      console.log('🔍 获取场所详情:', place);
      const details = await fetchPlaceDetails(place.id);
      console.log('✅ 场所详情获取成功:', details);
      
      setSelectedPlace({ ...place, ...details });
      setShowDetails(true);
      console.log('ok');
    } catch (err) {
      console.error('获取详情失败:', err);
      console.log('🔄 使用基础信息显示详情');
      // 使用基础信息作为备用
      setSelectedPlace({
        ...place,
        features: place.tags || [],
        reviews: [],
        photos: place.photos || [],
        description: `${place.name}是一家位于${place.address}的宠物服务场所。`,
        price: '价格面议',
        parkingType: '停车信息待更新',
        indoor: false
      });
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

  // 如果正在初始化，显示初始化状态
  if (isInitializing) {
    return (
      <div className="nearby-places">
        <div className="header">
          <h2>🐾 附近宠物友好场所</h2>
          <p>正在为您初始化地图服务...</p>
        </div>
        
        <div className="initializing">
          <div className="spinner"></div>
          <p>🌐 正在获取您的位置信息...</p>
          <p style={{ fontSize: '14px', color: '#666', marginTop: '10px' }}>
            这可能需要几秒钟时间
          </p>
        </div>
      </div>
    );
  }


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

      {/* 位置精度提示 */}
      {location && location.accuracy && (
        <div className={`accuracy-info ${location.accuracy > 1000 ? 'low-accuracy' : 'good-accuracy'}`}>
          <span className="accuracy-icon">
            {location.accuracy > 1000 ? '⚠️' : '✅'}
          </span>
          <span>
            定位精度: {location.accuracy}米 
            {location.source === 'gps' && ' (GPS定位)'}
            {location.source === 'ip_amap' && ' (高德IP定位)'}
            {location.source === 'ip_fallback' && ' (备用IP定位)'}
          </span>
        </div>
      )}

{/* 地图组件 - 现在总是显示 */}
{location && (
        <div className="map-section">
          <DynamicMap
            location={location}
            places={filteredPlaces}
            zoom={13}
            showMarkers={true}
            onMapClick={(newLocation) => {
              setLocation(newLocation);
              fetchPlaces(newLocation);
            }}
            onMarkerClick={handleViewDetails}
            showInfoWindow={true}
            showPolyline={false}
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
      {showDetails && setShowDetails && selectedPlace && (
        <div className="modal-overlay" onClick={() => setShowDetails(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: `${window.scrollY + 100}px`, // 根据当前滚动位置动态调整
              left: '50%',
              transform: 'translateX(-50%)',
              maxHeight: '80vh',
              overflowY: 'auto',
              marginTop: '0',
              zIndex: 1100,
              width: '90%',
              maxWidth: '600px',
              boxShadow: '0 5px 15px rgba(0,0,0,0.2)'
            }}>
            <div className="modal-header">
              <h3>{selectedPlace.name|| '场所详情'}</h3>

              

              <button 
                className="close-btn"
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {selectedPlace.photos && selectedPlace.photos.length > 0 ?  (
                <div className="place-photos">
                  {selectedPlace.photos.slice(0, 3).map((photo, index) => (
                    <img key={index} src={photo} alt={`${selectedPlace.name} ${index + 1}`} />
                  ))}
                </div>
                ) : (
                  <div className="no-photos">
                    <p>暂无图片</p>
                  </div>
              )}
              
              <div className="place-details">
                <div className="detail-row">
                  <strong>地址：</strong>
                  <span>{selectedPlace.address || '未知地址'}</span>
                </div>
                
                {selectedPlace.phone && selectedPlace.phone.length> 0 && (
                  <div className="detail-row">
                    <strong>电话：</strong>
                    <span>{Array.isArray(selectedPlace.phone) ? selectedPlace.phone[0] : selectedPlace.phone}</span>
                  </div>
                )}
                
                <div className="detail-row">
                  <strong>营业时间：</strong>
                  <span>{selectedPlace.operatingHours || '未知'}</span>
                </div>
                
                <div className="detail-row">
                  <strong>评分：</strong>
                  <span>{selectedPlace.rating || '暂无'}⭐ ({selectedPlace.reviewCount || 0}条评价)</span>
          </div>
                
                <div className="detail-row">
                  <strong>距离：</strong>
                  <span>{selectedPlace.distance|| '未知'}</span>
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
                
              {/* 添加调试信息 */}
          {/* <div className="debug-info" style={{fontSize: '12px', color: '#888', marginTop: '10px'}}>
            <p>ID: {selectedPlace.id}</p>
            <p>数据来源: {selectedPlace.dataSource || '高德地图'}</p>
          </div> */}
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