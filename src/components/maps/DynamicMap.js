import React, { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { getMapConfig } from '../../services/mapService';
import './DynamicMap.css';

const DynamicMap = ({ 
  location, 
  places = [], 
  zoom = 13, 
  showMarkers = true,
  onMapClick = null,
  onMarkerClick = null,
  showInfoWindow = true,
  showPolyline = false,
  polylineData = []
}) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);
  const mountedRef = useRef(true);

  // 获取地图配置
  const mapConfig = getMapConfig();

  useEffect(() => {
    mountedRef.current = true;
    initializeMap();

    return () => {
      mountedRef.current = false;
      // 清理地图实例
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch (e) {
          console.warn('地图销毁失败:', e);
        }
        mapInstanceRef.current = null;
      }
      // 清理标记
      markersRef.current = [];
      infoWindowRef.current = null;
    };
  }, []);

  // 初始化地图
  const initializeMap = async () => {
    if (!mountedRef.current) return;

    try {
      // 设置安全密钥
      window._AMapSecurityConfig = {
        securityJsCode: mapConfig.securityJsCode,
      };

      // 使用官方加载器加载地图
      const AMap = await AMapLoader.load({
        key: mapConfig.dynamicKey, // 申请好的Web端开发者Key
        version: "2.0", // 指定要加载的 JSAPI 的版本
        plugins: [
          'AMap.Marker',
          'AMap.InfoWindow',
          'AMap.Icon',
          'AMap.Polyline'
        ] // 需要使用的插件列表
      });

      if (!mountedRef.current) return;

      // 创建地图实例
      const centerCoord = location ? 
        [location.longitude, location.latitude] : 
        [121.484968, 31.2351];

      mapInstanceRef.current = new AMap.Map("map-container", {
        viewMode: "2D", // 2D地图模式
        zoom: zoom, // 初始化地图级别
        center: centerCoord, // 初始化地图中心点位置
        mapStyle: 'amap://styles/fresh',
        scrollWheel: true,
        dragEnable: true,
        zoomEnable: true,
        doubleClickZoom: true,
        keyboardEnable: true,
        jogEnable: true,
        animateEnable: true,
        resizeEnable: true
      });

      // 创建信息窗体
      infoWindowRef.current = new AMap.InfoWindow({
        isCustom: false,
        content: '',
        offset: new AMap.Pixel(16, -45),
        closeWhenClickMap: true
      });

      // 设置地图点击事件
      if (onMapClick) {
        mapInstanceRef.current.on('click', (e) => {
          const { lng, lat } = e.lnglat;
          onMapClick({ longitude: lng, latitude: lat });
        });
      }

      // 地图加载完成后的处理
      mapInstanceRef.current.on('complete', () => {
        console.log('✅ 地图加载完成');
        // 调整地图尺寸
        setTimeout(() => {
          if (mapInstanceRef.current && mountedRef.current) {
            try {
              mapInstanceRef.current.resize();
            } catch (e) {
              console.warn('地图尺寸调整失败:', e);
            }
          }
        }, 300);
      });

      // 初始化标记
      updateMarkers(AMap);

    } catch (error) {
      console.error('地图初始化失败:', error);
      showFallbackMap();
    }
  };

  // 创建emoji风格的图标函数
const createEmojiIcon = (emoji, size = 48) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  canvas.width = size;
  canvas.height = size;
  
  // 设置字体和样式
  ctx.font = `${size * 0.8}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // 绘制emoji
  ctx.fillText(emoji, size / 2, size / 2);
  
  return canvas.toDataURL();
};

  // 修改 updateMarkers 函数
const updateMarkers = (AMap) => {
  if (!mapInstanceRef.current || !showMarkers || !mountedRef.current) {
    return;
  }

  console.log('🔄 开始更新地图标记');
  console.log('📍 当前位置:', location);
  console.log('🏢 场所数量:', places.length);

  // 清除现有标记
  markersRef.current.forEach(marker => {
    try {
      mapInstanceRef.current.remove(marker);
    } catch (e) {
      console.warn('清除标记失败:', e);
    }
  });
  markersRef.current = [];

  // 添加当前位置标记
  if (location) {
    try {
      const currentLocationMarker = new AMap.Marker({
        position: [location.longitude, location.latitude],
        title: '当前位置',
        icon: new AMap.Icon({
          image: createEmojiIcon('📍', 48),
          size: new AMap.Size(48, 48),
          imageSize: new AMap.Size(48, 48),
          imageOffset: new AMap.Pixel(-24, -24) // 居中显示
        })
      });

      markersRef.current.push(currentLocationMarker);
      mapInstanceRef.current.add(currentLocationMarker);
      console.log('✅ 当前位置标记添加成功');

      // 添加信息窗体
      if (showInfoWindow && infoWindowRef.current) {
        currentLocationMarker.on('click', () => {
          infoWindowRef.current.setContent(`
            <div style="padding: 10px;">
              <h4>📍 当前位置</h4>
              <p>${location.address || '未知地址'}</p>
              <p>精度: ${location.accuracy || '未知'}米</p>
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, currentLocationMarker.getPosition());
        });
      }
    } catch (error) {
      console.error('❌ 当前位置标记创建失败:', error);
    }
  }

  // 获取宠物场所对应的emoji
  const getPlaceEmoji = (placeType) => {
    const emojiMap = {
      '宠物医院': '🏥',
      '宠物店': '🏪',
      '宠物美容': '✂️',
      '宠物公园': '🌳',
      '宠物咖啡': '☕',
      '动物医院': '🏥',
      '宠物用品店': '🛍️',
      '宠物诊所': '⚕️',
      '宠物训练': '🎓',
      '宠物酒店': '🏨',
      '宠物寄养': '🏠',
      '宠物游乐园': '🎡',
      '宠物餐厅': '🍽️',
      '宠物摄影': '📸',
      '宠物洗浴': '🛁',
      '宠物托管': '🏢',
      '宠物SPA': '💆',
      '宠物运动': '⚽',
      '宠物乐园': '🎪',
      '宠物会所': '🎭'
    };
    
    // 匹配类型关键词
    for (const [key, emoji] of Object.entries(emojiMap)) {
      if (placeType.includes(key)) {
        return emoji;
      }
    }
    
    return '🐾'; // 默认宠物图标
  };

  // 添加场所标记
  let successCount = 0;
  places.forEach((place, index) => {
    try {
      // 验证场所数据
      if (!place.latitude || !place.longitude) {
        console.warn('⚠️ 场所缺少经纬度信息:', place);
        return;
      }

      if (isNaN(place.latitude) || isNaN(place.longitude)) {
        console.warn('⚠️ 场所经纬度无效:', place);
        return;
      }

      console.log(`📍 创建场所标记: ${place.name} (${place.latitude}, ${place.longitude})`);

      // 获取对应的emoji
      const emoji = getPlaceEmoji(place.type);
      
      const placeMarker = new AMap.Marker({
        position: [place.longitude, place.latitude],
        title: place.name,
        icon: new AMap.Icon({
          image: createEmojiIcon(emoji, 36),
          size: new AMap.Size(36, 36),
          imageSize: new AMap.Size(36, 36),
          imageOffset: new AMap.Pixel(-18, -18) // 居中显示
        })
      });

      // 添加点击事件
      if (onMarkerClick) {
        placeMarker.on('click', () => {
          onMarkerClick(place);
        });
      }

      // 添加信息窗体
      if (showInfoWindow && infoWindowRef.current) {
        placeMarker.on('click', () => {
          infoWindowRef.current.setContent(`
            <div style="padding: 10px; max-width: 200px;">
              <h4>${emoji} ${place.name}</h4>
              <p><strong>类型:</strong> ${place.type}</p>
              <p><strong>距离:</strong> ${place.distance}</p>
              <p><strong>评分:</strong> ${place.rating}⭐</p>
              <p><strong>地址:</strong> ${place.address}</p>
              ${place.phone ? `<p><strong>电话:</strong> ${place.phone}</p>` : ''}
              ${place.operatingHours ? `<p><strong>营业时间:</strong> ${place.operatingHours}</p>` : ''}
            </div>
          `);
          infoWindowRef.current.open(mapInstanceRef.current, placeMarker.getPosition());
        });
      }

      markersRef.current.push(placeMarker);
      mapInstanceRef.current.add(placeMarker);
      successCount++;
      console.log(`✅ 场所标记创建成功: ${place.name} (${emoji})`);

    } catch (error) {
      console.error(`❌ 场所标记创建失败: ${place.name}`, error);
    }
  });

  console.log(`🎯 标记创建完成: ${successCount}/${places.length} 个场所标记成功创建`);
};

  // 更新地图中心
  const updateMapCenter = () => {
    if (mapInstanceRef.current && location && mountedRef.current) {
      mapInstanceRef.current.setCenter([location.longitude, location.latitude]);
      mapInstanceRef.current.setZoom(zoom);
    }
  };

  // 显示备用地图
  const showFallbackMap = () => {
    if (!mapRef.current || !mountedRef.current) {
      return;
    }

    const fallbackHtml = `
      <div style="
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
        font-family: Arial, sans-serif;
        text-align: center;
        padding: 20px;
        border-radius: 8px;
      ">
        <h3 style="margin: 0 0 15px 0; font-size: 24px;">🗺️ 地图服务暂不可用</h3>
        <p style="margin: 0 0 20px 0; opacity: 0.9;">正在为您准备地图服务，请稍后...</p>
        
        ${location ? `
          <div style="
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            max-width: 300px;
          ">
            <p style="margin: 0 0 10px 0; font-weight: bold;">📍 当前位置</p>
            <p style="margin: 5px 0; font-size: 14px;">经度: ${location.longitude.toFixed(6)}</p>
            <p style="margin: 5px 0; font-size: 14px;">纬度: ${location.latitude.toFixed(6)}</p>
            ${location.address ? `<p style="margin: 5px 0; font-size: 14px;">地址: ${location.address}</p>` : ''}
          </div>
        ` : ''}
        
        ${places.length > 0 ? `
          <div style="
            background: rgba(255,255,255,0.15);
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
            max-width: 300px;
          ">
            <p style="margin: 0 0 10px 0; font-weight: bold;">🐾 附近场所 (${places.length}个)</p>
            <div style="max-height: 100px; overflow-y: auto;">
              ${places.slice(0, 3).map(place => `
                <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">
                  • ${place.name}
                </p>
              `).join('')}
            </div>
          </div>
        ` : ''}
        
        <button onclick="window.location.reload()" style="
          background: rgba(255,255,255,0.2);
          border: 1px solid rgba(255,255,255,0.3);
          color: white;
          padding: 12px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          margin-top: 20px;
        ">
          🔄 重新加载
        </button>
      </div>
    `;

    mapRef.current.innerHTML = fallbackHtml;
  };

  // 监听位置和场所变化
  useEffect(() => {
    if (mapInstanceRef.current && mountedRef.current) {
      updateMapCenter();
      // 重新加载地图以获取AMap对象
      if (window.AMap) {
        updateMarkers(window.AMap);
      }
    }
  }, [location, places, showMarkers]);

  return (
    <div className="dynamic-map">
      <div 
        ref={mapRef}
        id="map-container"
        className="map-container"
        style={{ 
          width: '100%', 
          height: '400px',
          minHeight: '400px',
          position: 'relative',
          backgroundColor: '#f5f5f5',
          borderRadius: '8px',
          overflow: 'hidden'
        }}
      />
      
      {places.length > 0 && (
        <div className="map-controls">
          <div className="legend">
            <div className="legend-item">
              <span className="legend-marker current">📍</span>
              <span>当前位置</span>
            </div>
            <div className="legend-item">
              <span className="legend-marker place">🐾</span>
              <span>宠物场所</span>
            </div>
          </div>
          <div className="map-mode-indicator">
            <span className="mode-badge dynamic">动态地图</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicMap;