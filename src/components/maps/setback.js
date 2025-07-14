import React, { useEffect, useRef, useState } from 'react';
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
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [infoWindow, setInfoWindow] = useState(null);
  const [polyline, setPolyline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState('');
  const [loadingStep, setLoadingStep] = useState('初始化中...');
  const initRef = useRef(false); // 使用 ref 避免重复初始化
  const [isContainerReady, setIsContainerReady] = useState(false);

  // 获取地图配置
  const mapConfig = getMapConfig();

  // 初始化地图
  useEffect(() => {
    console.log('🚀 DynamicMap useEffect 开始执行');
    
    // 防止重复初始化
    if (initRef.current) {
      console.log('✅ 地图已经初始化过，跳过');
      return;
    }

    const initializeMap = async () => {
      console.log('🔥 开始初始化地图');
      
      // 等待 DOM 准备
      let retryCount = 0;
      const maxRetries = 60; // 最多等待 5 秒
      
      while (!mapRef.current && retryCount < maxRetries) {
        console.log(`🔍 等待 DOM 准备... 第 ${retryCount + 1} 次`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }

      if (!mapRef.current) {
        console.error('❌ 地图容器始终为空，初始化失败');
        setError('地图容器初始化失败');
        setLoading(false);
        return;
      }

      console.log('✅ 地图容器准备就绪');
      console.log('📐 容器尺寸:', mapRef.current.offsetWidth, 'x', mapRef.current.offsetHeight);

      // 标记已开始初始化
      initRef.current = true;
      
      try {
        await performMapInitialization();
      } catch (err) {
        console.error('❌ 地图初始化失败:', err);
        setError(`地图初始化失败: ${err.message}`);
        setLoading(false);
        showFallbackMap();
      }
    };

    // 开始初始化
    initializeMap();

    // 清理函数
    return () => {
      console.log('🧹 DynamicMap useEffect 清理');
      // 不重置 initRef，保持已初始化状态
    };
  }, []); // 空依赖数组，只在组件挂载时执行一次

  // 实际的地图初始化逻辑
  const performMapInitialization = async () => {
    try {
      setLoadingStep('准备初始化...');
      
      // 调试信息
      const debugSteps = [];
      debugSteps.push('🔧 开始地图初始化');
      debugSteps.push(`📦 地图配置: ${JSON.stringify(mapConfig)}`);
      debugSteps.push(`📍 位置信息: ${location ? `${location.latitude}, ${location.longitude}` : '无位置'}`);
      debugSteps.push(`🏢 场所数量: ${places.length}`);
      debugSteps.push(`📐 容器尺寸: ${mapRef.current.offsetWidth}x${mapRef.current.offsetHeight}`);
      
      console.log('=== 地图初始化调试信息 ===');
      debugSteps.forEach(step => console.log(step));
      setDebugInfo(debugSteps.join('\n'));

      // 验证必需的配置
      if (!mapConfig.dynamicKey) {
        throw new Error('动态地图API密钥未配置');
      }

      if (!mapConfig.securityJsCode) {
        throw new Error('安全密钥未配置');
      }

      console.log('✅ 配置验证通过');
      
      // 第一步：设置安全密钥
      setLoadingStep('设置安全密钥...');
      debugSteps.push('🔐 设置安全密钥...');
      setDebugInfo(debugSteps.join('\n'));
      
      window._AMapSecurityConfig = {
        securityJsCode: mapConfig.securityJsCode,
      };
      
      debugSteps.push('✅ 安全密钥设置完成');
      console.log('✅ 安全密钥设置完成');
      setDebugInfo(debugSteps.join('\n'));

      // 第二步：加载高德地图JS API
      setLoadingStep('加载高德地图API...');
      debugSteps.push('🌐 加载高德地图API...');
      setDebugInfo(debugSteps.join('\n'));
      
      console.log('🌐 开始加载高德地图API');
      await loadAMapScript();
      
      debugSteps.push('✅ 高德地图API加载完成');
      console.log('✅ 高德地图API加载完成');
      setDebugInfo(debugSteps.join('\n'));

      // 验证API加载
      if (!window.AMap) {
        throw new Error('高德地图API未正确加载');
      }

      // 第三步：创建地图实例
      setLoadingStep('创建地图实例...');
      debugSteps.push('🗺️ 创建地图实例...');
      setDebugInfo(debugSteps.join('\n'));
      
      const centerCoord = location ? [location.longitude, location.latitude] : [121.484968, 31.2351];
      console.log('📍 地图中心坐标:', centerCoord);

      console.log('🏗️ 开始创建地图实例');
      const mapInstance = new window.AMap.Map(mapRef.current, {
        zoom: zoom,
        center: centerCoord,
        mapStyle: 'amap://styles/normal',
        viewMode: '2D',
        scrollWheel: true,
        dragEnable: true,
        zoomEnable: true,
        doubleClickZoom: true,
        keyboardEnable: true,
        jogEnable: true,
        animateEnable: true,
        resizeEnable: true
      });

      debugSteps.push('✅ 地图实例创建成功');
      console.log('✅ 地图实例创建成功');
      setDebugInfo(debugSteps.join('\n'));

      // 创建信息窗体
      console.log('🔧 创建信息窗体');
      const infoWindowInstance = new window.AMap.InfoWindow({
        isCustom: false,
        content: '',
        offset: new window.AMap.Pixel(16, -45),
        closeWhenClickMap: true
      });

      // 地图点击事件
      if (onMapClick) {
        console.log('🖱️ 添加地图点击事件');
        mapInstance.on('click', (e) => {
          const { lng, lat } = e.lnglat;
          onMapClick({
            longitude: lng,
            latitude: lat
          });
        });
      }

      // 地图加载完成处理
      setLoadingStep('等待地图加载完成...');
      let loadComplete = false;
      
      console.log('⏳ 等待地图加载完成事件');
      mapInstance.on('complete', () => {
        if (!loadComplete) {
          loadComplete = true;
          debugSteps.push('🎉 地图加载完成');
          console.log('🎉 地图加载完成');
          setDebugInfo(debugSteps.join('\n'));
          setMap(mapInstance);
          setInfoWindow(infoWindowInstance);
          setLoading(false);
          setLoadingStep('');
        }
      });

      // 错误处理
      mapInstance.on('error', (e) => {
        console.error('❌ 地图加载错误:', e);
        setError(`地图加载错误: ${e.message || '未知错误'}`);
        setLoading(false);
        setLoadingStep('加载错误');
      });

      // 超时处理
      console.log('⏰ 设置超时处理');
      setTimeout(() => {
        if (!loadComplete) {
          console.log('⏰ 地图加载超时，强制完成');
          loadComplete = true;
          debugSteps.push('⏰ 地图加载超时，强制完成');
          setDebugInfo(debugSteps.join('\n'));
          setMap(mapInstance);
          setInfoWindow(infoWindowInstance);
          setLoading(false);
          setLoadingStep('');
        }
      }, 5000);

     // 强制触发resize（解决容器尺寸问题）
setTimeout(() => {
  if (mapInstance && mapRef.current) {
    try {
      console.log('📐 触发地图尺寸调整');
      // 修复：正确的方法是直接调用 resize()
      mapInstance.resize();
      console.log('📐 地图尺寸调整完成');
    } catch (resizeErr) {
      console.warn('地图尺寸调整失败:', resizeErr);
    }
  }
}, 1000);

    } catch (err) {
      console.error('❌ performMapInitialization 发生错误:', err);
      setError(`地图初始化失败: ${err.message}`);
      setLoading(false);
      setLoadingStep('初始化失败');
      showFallbackMap();
    }
  };

  // 监听位置变化
  useEffect(() => {
    if (map && location) {
      console.log('📍 位置变化，更新地图');
      updateMapCenter();
      updateMarkers();
    }
  }, [map, location, places, showMarkers]);

  // 监听折线数据变化
  useEffect(() => {
    if (map && showPolyline) {
      console.log('📏 折线数据变化');
      updatePolyline();
    }
  }, [map, showPolyline, polylineData]);

  const loadAMapScript = () => {
    return new Promise((resolve, reject) => {
      console.log('🔄 loadAMapScript 开始');
      
      // 检查是否已经加载过
      if (window.AMap) {
        console.log('✅ 高德地图API已存在');
        resolve();
        return;
      }

      // 清理可能存在的旧脚本
      const existingScripts = document.querySelectorAll('script[src*="webapi.amap.com"]');
      existingScripts.forEach(script => {
        if (script.src.includes('webapi.amap.com')) {
          console.log('🧹 清理旧的地图脚本');
          script.remove();
        }
      });

      console.log('🌐 开始加载高德地图JS API...');
      console.log('🔑 使用API密钥:', mapConfig.dynamicKey);

      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${mapConfig.dynamicKey}`;
      script.async = true;
      
      const timeout = setTimeout(() => {
        console.error('⏰ 地图API加载超时');
        script.remove();
        reject(new Error('地图API加载超时'));
      }, 15000);
      
      script.onload = () => {
        clearTimeout(timeout);
        console.log('✅ 高德地图JS API加载完成');
        resolve();
      };
      
      script.onerror = (err) => {
        clearTimeout(timeout);
        console.error('❌ 高德地图JS API加载失败:', err);
        script.remove();
        reject(new Error('地图API加载失败，请检查网络连接和API密钥'));
      };
      
      console.log('📤 添加脚本到页面');
      document.head.appendChild(script);
    });
  };

  const showFallbackMap = () => {
    console.log('🔄 显示备用地图');
    if (!mapRef.current) {
      console.log('❌ 无法显示备用地图，容器不存在');
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
        position: relative;
        overflow: hidden;
      ">
        <div style="
          z-index: 1;
          text-align: center;
          padding: 20px;
        ">
          <h3 style="margin: 0 0 10px 0; font-size: 24px;">🗺️ 地图服务</h3>
          <p style="margin: 0 0 20px 0; opacity: 0.8;">地图显示异常，但数据功能正常</p>
          
          ${location ? `
            <div style="
              background: rgba(255,255,255,0.1);
              border-radius: 10px;
              padding: 15px;
              margin: 10px 0;
              border: 1px solid rgba(255,255,255,0.2);
            ">
              <p style="margin: 5px 0;">📍 当前位置</p>
              <p style="margin: 5px 0; font-size: 14px;">经度: ${location.longitude}</p>
              <p style="margin: 5px 0; font-size: 14px;">纬度: ${location.latitude}</p>
              ${location.address ? `<p style="margin: 5px 0; font-size: 14px;">地址: ${location.address}</p>` : ''}
            </div>
          ` : ''}
          
          ${places.length > 0 ? `
            <div style="
              background: rgba(255,255,255,0.1);
              border-radius: 10px;
              padding: 15px;
              margin: 10px 0;
              border: 1px solid rgba(255,255,255,0.2);
            ">
              <p style="margin: 5px 0;">🐾 附近宠物场所 (${places.length}个)</p>
              <div style="max-height: 120px; overflow-y: auto; text-align: left;">
                ${places.slice(0, 5).map(place => `
                  <p style="margin: 5px 0; font-size: 13px; opacity: 0.9;">
                    • ${place.name} - ${place.distance || '未知距离'}
                  </p>
                `).join('')}
              </div>
            </div>
          ` : ''}
          
          <div style="margin-top: 20px;">
            <button onclick="window.location.reload()" style="
              background: rgba(255,255,255,0.2);
              border: 1px solid rgba(255,255,255,0.3);
              color: white;
              padding: 10px 20px;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              margin: 0 5px;
            ">
              重新加载
            </button>
          </div>
          
          <details style="margin-top: 20px; text-align: left;">
            <summary style="cursor: pointer; font-size: 14px;">详细调试信息</summary>
            <pre style="font-size: 12px; background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-top: 10px; white-space: pre-wrap;">
              ${debugInfo}
              
              错误信息: ${error}
              
              加载步骤: ${loadingStep}
            </pre>
          </details>
        </div>
      </div>
    `;
    
    mapRef.current.innerHTML = fallbackHtml;
  };

  const updateMapCenter = () => {
    if (map && location) {
      map.setCenter([location.longitude, location.latitude]);
      map.setZoom(zoom);
    }
  };

  const updateMarkers = () => {
    if (!map || !showMarkers || !window.AMap) return;

    // 清除现有标记
    markers.forEach(marker => map.remove(marker));
    const newMarkers = [];

    // 添加当前位置标记
    if (location) {
      const currentLocationMarker = new window.AMap.Marker({
        position: [location.longitude, location.latitude],
        title: '当前位置',
        icon: new window.AMap.Icon({
          image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
          size: new window.AMap.Size(25, 35),
          imageSize: new window.AMap.Size(25, 35)
        })
      });

      newMarkers.push(currentLocationMarker);
      map.add(currentLocationMarker);
    }

    // 添加场所标记
    places.forEach((place, index) => {
      const placeMarker = new window.AMap.Marker({
        position: [place.longitude, place.latitude],
        title: place.name,
        icon: new window.AMap.Icon({
          image: 'https://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-blue.png',
          size: new window.AMap.Size(25, 35),
          imageSize: new window.AMap.Size(25, 35)
        })
      });

      newMarkers.push(placeMarker);
      map.add(placeMarker);
    });

    setMarkers(newMarkers);
  };

  const updatePolyline = () => {
    if (!map || !showPolyline || !polylineData.length || !window.AMap) return;

    // 清除现有折线
    if (polyline) {
      map.remove(polyline);
    }

    // 创建新折线
    const newPolyline = new window.AMap.Polyline({
      path: polylineData,
      strokeColor: '#3366FF',
      strokeWeight: 5,
      strokeStyle: 'solid',
      strokeOpacity: 0.8,
      strokeDasharray: [10, 5]
    });

    map.add(newPolyline);
    setPolyline(newPolyline);
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="dynamic-map loading">
        <div className="map-loading">
          <div className="spinner"></div>
          <p>动态地图加载中...</p>
          <p style={{ fontSize: '14px', color: '#666' }}>{loadingStep}</p>
          {debugInfo && (
            <details style={{ marginTop: '10px', fontSize: '12px' }}>
              <summary>实时调试信息</summary>
              <pre style={{ textAlign: 'left', background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginTop: '5px', maxHeight: '200px', overflow: 'auto' }}>
                {debugInfo}
              </pre>
            </details>
          )}
        </div>
      </div>
    );
  }

  // 渲染地图
  return (
    <div className="dynamic-map">
      <div 
        ref={mapRef} 
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
      
      {places.length > 0 && !error && (
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
        </div>
      )}
    </div>
  );
};

export default DynamicMap;