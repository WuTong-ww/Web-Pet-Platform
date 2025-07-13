import React, { useState, useEffect } from 'react';
import { generateStaticMapUrl } from '../../services/mapService';
import './StaticMap.css';

const StaticMap = ({ 
  location, 
  places = [], 
  zoom = 13, 
  size = '600*400', 
  showMarkers = true,
  onMapClick = null 
}) => {
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location) {
      generateMap();
    }
  }, [location, places, zoom, size, showMarkers]);

  const generateMap = async () => {
    setLoading(true);
    setError('');
    
    try {
      const options = {
        location: `${location.longitude},${location.latitude}`,
        zoom,
        size,
        scale: 2, // 高清图
        traffic: 0
      };

      // 添加标记点
      if (showMarkers && places.length > 0) {
        const markers = [];
        
        // 当前位置标记
        markers.push({
          style: 'large,0x00FF00,A',
          locations: [`${location.longitude},${location.latitude}`]
        });
        
        // 宠物场所标记
        const placeLocations = places.slice(0, 9).map(place => 
          `${place.longitude},${place.latitude}`
        );
        
        if (placeLocations.length > 0) {
          markers.push({
            style: 'mid,0xFF0000,B',
            locations: placeLocations
          });
        }
        
        options.markers = markers;
      } else if (showMarkers) {
        // 只显示当前位置
        options.markers = [{
          style: 'large,0x00FF00,A',
          locations: [`${location.longitude},${location.latitude}`]
        }];
      }

      const url = generateStaticMapUrl(options);
      setMapUrl(url);
      
    } catch (err) {
      console.error('生成地图失败:', err);
      setError('地图加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleMapClick = () => {
    if (onMapClick) {
      onMapClick(location);
    }
  };

  if (loading) {
    return (
      <div className="static-map loading">
        <div className="map-loading">
          <div className="spinner"></div>
          <p>地图加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="static-map error">
        <div className="map-error">
          <p>{error}</p>
          <button onClick={generateMap}>重新加载</button>
        </div>
      </div>
    );
  }

  return (
    <div className="static-map">
      {mapUrl && (
        <img 
          src={mapUrl} 
          alt="地图"
          className="map-image"
          onClick={handleMapClick}
        />
      )}
      
      {places.length > 0 && (
        <div className="map-legend">
          <div className="legend-item">
            <span className="legend-marker current">A</span>
            <span>当前位置</span>
          </div>
          <div className="legend-item">
            <span className="legend-marker place">B</span>
            <span>宠物场所</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticMap;