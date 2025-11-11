import React, { useState } from 'react';
import { MusicHotspot } from '../types';

interface LocalSceneMapProps {
  hotspots: MusicHotspot[];
  isLoading: boolean;
  error: string | null;
}

const VenueIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" /></svg>);
const StudioIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93V17a1 1 0 11-2 0v-2.07A5 5 0 014 11V7a1 1 0 012 0v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-3 4.93z" clipRule="evenodd" /></svg>);
const OtherIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>);

const LocalSceneMap: React.FC<LocalSceneMapProps> = ({ hotspots, isLoading, error }) => {
  const [selectedHotspot, setSelectedHotspot] = useState<MusicHotspot | null>(null);

  // Bounding box for Namibia (approximate)
  const latMin = -29.0, latMax = -17.0, lonMin = 11.5, lonMax = 25.5;

  const getPosition = (lat: number, lon: number) => {
    const x = ((lon - lonMin) / (lonMax - lonMin)) * 100;
    const y = ((latMax - lat) / (latMax - latMin)) * 100;
    return { left: `${x}%`, top: `${y}%` };
  };

  const getIcon = (type: MusicHotspot['type']) => {
    switch(type) {
      case 'venue': return <VenueIcon />;
      case 'studio': return <StudioIcon />;
      default: return <OtherIcon />;
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-300"></div></div>;
  }

  if (error) {
    return <p className="text-center text-red-400 py-4">{error}</p>;
  }

  if (hotspots.length === 0) {
    return <p className="text-center text-slate-500 py-4">Could not find any local hotspots. Check back later!</p>;
  }

  return (
    <div className="relative w-full aspect-square bg-slate-800 rounded-lg overflow-hidden border-2 border-slate-700/50">
      <img src="https://upload.wikimedia.org/wikipedia/commons/4/47/Namibia_in_Africa_%28-mini_map_-rivers%29.svg" alt="Map of Namibia" className="absolute inset-0 w-full h-full object-contain opacity-20" />
      
      {hotspots.map((hotspot) => {
        const { left, top } = getPosition(hotspot.latitude, hotspot.longitude);
        return (
          <button
            key={hotspot.name}
            className="absolute -translate-x-1/2 -translate-y-1/2 p-2 rounded-full bg-amber-500 text-white shadow-lg z-10 hover:z-20 map-pin"
            style={{ left, top }}
            onClick={() => setSelectedHotspot(hotspot)}
            aria-label={`Show details for ${hotspot.name}`}
          >
            {getIcon(hotspot.type)}
          </button>
        );
      })}

      {selectedHotspot && (
        <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedHotspot(null)}>
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-amber-300 flex items-center gap-2">{getIcon(selectedHotspot.type)} {selectedHotspot.name}</h3>
            <p className="text-xs text-slate-500 uppercase font-semibold">{selectedHotspot.type}</p>
            <p className="text-sm text-slate-300 mt-2">{selectedHotspot.description}</p>
            <p className="text-xs text-slate-400 mt-2">{selectedHotspot.address}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocalSceneMap;