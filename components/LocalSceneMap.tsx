import React, { useMemo, useState } from 'react';
import { MusicHotspot } from '../types';

interface LocalSceneMapProps {
    hotspots: MusicHotspot[];
}

// Bounding box for Namibia for coordinate normalization
const NAMIBIA_BOUNDS = {
    lat: { min: -29.0, max: -17.0 }, // Southernmost to Northernmost
    lon: { min: 11.0, max: 26.0 },  // Westernmost to Easternmost
};

const MapPinIcon = ({ type }: { type: string }) => {
    const color = type === 'Venue' ? 'text-red-400' : type === 'Studio' ? 'text-blue-400' : 'text-green-400';
    return (
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-8 w-8 ${color}`} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
        </svg>
    );
};

const LocalSceneMap: React.FC<LocalSceneMapProps> = ({ hotspots }) => {
    const [activeHotspot, setActiveHotspot] = useState<MusicHotspot | null>(null);

    const normalizeCoords = (lat: number, lon: number) => {
        const latRange = NAMIBIA_BOUNDS.lat.max - NAMIBIA_BOUNDS.lat.min;
        const lonRange = NAMIBIA_BOUNDS.lon.max - NAMIBIA_BOUNDS.lon.min;

        // Calculate percentage from top (for y) and left (for x)
        const y = 100 - ((lat - NAMIBIA_BOUNDS.lat.min) / latRange) * 100;
        const x = ((lon - NAMIBIA_BOUNDS.lon.min) / lonRange) * 100;

        return { x: `${x}%`, y: `${y}%` };
    };

    const hotspotsWithCoords = useMemo(() => {
        return hotspots.map(h => ({ ...h, position: normalizeCoords(h.latitude, h.longitude) }));
    }, [hotspots]);

    return (
        <div className="relative w-full aspect-[4/3] bg-slate-800/50 rounded-lg overflow-hidden border-2 border-slate-700/50 shadow-inner">
            {/* Pseudo-map background could be an SVG or just styled divs */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-800"></div>

            {hotspotsWithCoords.map((hotspot) => (
                <button
                    key={hotspot.name}
                    className="absolute map-pin"
                    style={{ left: hotspot.position.x, top: hotspot.position.y }}
                    onClick={() => setActiveHotspot(hotspot)}
                    onMouseEnter={() => setActiveHotspot(hotspot)}
                    onMouseLeave={() => setActiveHotspot(null)}
                    aria-label={`Show details for ${hotspot.name}`}
                >
                    <MapPinIcon type={hotspot.type} />
                </button>
            ))}

            {activeHotspot && (
                <div
                    className="absolute bg-slate-900/80 backdrop-blur-md rounded-lg p-4 shadow-lg w-64 border border-slate-600 map-popup"
                    style={{ left: normalizeCoords(activeHotspot.latitude, activeHotspot.longitude).x, top: normalizeCoords(activeHotspot.latitude, activeHotspot.longitude).y }}
                >
                    <h4 className="font-bold text-amber-300">{activeHotspot.name}</h4>
                    <p className="text-xs font-semibold text-slate-400 mb-2">{activeHotspot.type}</p>
                    <p className="text-sm text-slate-200">{activeHotspot.description}</p>
                </div>
            )}
        </div>
    );
};

export default LocalSceneMap;
