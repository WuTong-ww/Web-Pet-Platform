// src/components/adoption/PetCard.js
import React from 'react';
import { Heart, MapPin, TrendingUp } from 'lucide-react';

const PetCard = ({ pet }) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group">
      <div className="relative">
        <img 
          src={pet.image} 
          alt={pet.name} 
          className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500" 
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://source.unsplash.com/300x300/?pet,silhouette";
          }}
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
          <TrendingUp size={16} className="text-red-500" />
          <span className="text-sm font-bold text-gray-800">{pet.popularity}%</span>
        </div>
        <div className="absolute bottom-4 left-4 bg-purple-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold">
          {pet.adoptionCenter}
        </div>
      </div>
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{pet.name}</h3>
        <p className="text-gray-600 mb-2">{pet.breed} • {pet.age}</p>
        <div className="flex items-center text-gray-500 mb-4">
          <MapPin size={16} className="mr-2" />
          <span className="text-sm">{pet.location}</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {pet.tags && pet.tags.map((tag, index) => (
            <span key={index} className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs font-medium">
              {tag}
            </span>
          ))}
        </div>
        <button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-300 transform hover:scale-105">
          <Heart size={18} className="inline mr-2" />
          申请领养
        </button>
      </div>
    </div>
  );
};

export default PetCard;