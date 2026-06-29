import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { CivicIssue, UserLocation } from "../types";
import { Layers, MapPin, Flame, Wind, AlertTriangle, CheckCircle, Sparkles, AlertCircle } from "lucide-react";

interface CivicMapProps {
  issues: CivicIssue[];
  height?: string;
  onSelectIssue?: (issue: CivicIssue) => void;
  selectedIssue?: CivicIssue | null;
  animateIssueId?: string | null;
  clearAnimateIssueId?: () => void;
  userLocation?: UserLocation | null;
  
  // Custom interactive overlay state for Level 1 & 2 maps
  level?: number;
  setLevel?: (level: number) => void;
  geojsonData?: any;
  selectedState?: string | null;
  setSelectedState?: (state: string | null) => void;
  hoveredStateId?: string | null;
  setHoveredStateId?: (state: string | null) => void;
  selectedCity?: string | null;
  setSelectedCity?: (city: string | null) => void;
  
  // Controls
  defaultLayers?: {
    markers: boolean;
    heatmap: boolean;
    aqi: boolean;
    risk: boolean;
  };
}

export default function CivicMap({
  issues,
  height = "100%",
  onSelectIssue,
  selectedIssue,
  animateIssueId,
  clearAnimateIssueId,
  userLocation,
  level = 3,
  setLevel,
  geojsonData,
  selectedState,
  setSelectedState,
  hoveredStateId,
  setHoveredStateId,
  selectedCity,
  setSelectedCity,
  defaultLayers = { markers: true, heatmap: false, aqi: false, risk: false }
}: CivicMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  // Layer group refs
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);
  const aqiLayerRef = useRef<L.LayerGroup | null>(null);
  const riskLayerRef = useRef<L.LayerGroup | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);

  // Toggle active layers
  const [layers, setLayers] = useState(defaultLayers);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // Update localized helper colors
  const getSeverityColor = (severity: string, status?: string) => {
    if (status === "Resolved") return "#10b981"; // Green
    switch (severity) {
      case "Critical": return "#ef4444"; // Red
      case "High": return "#f97316"; // Orange
      case "Medium": return "#eab308"; // Yellow/Amber
      default: return "#3b82f6"; // Blue
    }
  };

  // Helper to map state names to codes
  const findStateCodeByName = (name: string): string | null => {
    if (!name) return null;
    const n = name.toLowerCase();
    if (n.includes("delhi") || n.includes("ncr")) return "DL";
    if (n.includes("maharashtra") || n.includes("mumbai")) return "MH";
    if (n.includes("karnataka") || n.includes("bangalore") || n.includes("bengaluru")) return "KA";
    if (n.includes("telangana") || n.includes("hyderabad")) return "TS";
    if (n.includes("tamil nadu") || n.includes("chennai")) return "TN";
    if (n.includes("west bengal") || n.includes("kolkata") || n.includes("calcutta")) return "WB";
    if (n.includes("jammu") || n.includes("kashmir") || n.includes("ladakh")) return "JK";
    if (n.includes("punjab") || n.includes("haryana") || n.includes("himachal")) return "PH";
    if (n.includes("rajasthan") || n.includes("jaipur")) return "RJ";
    if (n.includes("gujarat") || n.includes("ahmedabad")) return "GJ";
    if (n.includes("uttar pradesh") || n.includes("lucknow")) return "UP";
    if (n.includes("bihar") || n.includes("patna")) return "BR";
    if (n.includes("kerala") || n.includes("cochin")) return "KL";
    return null;
  };

  // State health scores for polygons
  const stateHealthScores: { [id: string]: number } = {
    DL: 62, MH: 74, KA: 78, TS: 70, TN: 80, WB: 68, JK: 71, PH: 66, RJ: 65, GJ: 76, UP: 52, BR: 54, KL: 85
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Use userLocation if available, else default to India geocenter
    const initialCenter: [number, number] = userLocation
      ? [userLocation.latitude, userLocation.longitude]
      : [21.0, 78.0];
    const initialZoom = userLocation ? (level === 1 ? 5 : level === 2 ? 8 : 13) : 4.5;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      attributionControl: false
    });

    // Elegant high-tech CartoDB dark tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 18,
      minZoom: 3
    }).addTo(map);

    mapInstanceRef.current = map;

    // Create layer groups
    markersLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);
    aqiLayerRef.current = L.layerGroup().addTo(map);
    riskLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Smoothly center the map when userLocation changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    map.setView([userLocation.latitude, userLocation.longitude], level === 1 ? 5 : level === 2 ? 8 : 13, {
      animate: true,
      duration: 1.5
    });
  }, [userLocation]);

  // Sync state boundaries when level changes or state changes (Level 1 & 2)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
      geojsonLayerRef.current = null;
    }

    if (geojsonData && (level === 1 || level === 2)) {
      const geojsonLayer = L.geoJSON(geojsonData, {
        style: (feature) => {
          const name = feature?.properties?.ST_NM || feature?.properties?.state_name || "";
          const stateCode = findStateCodeByName(name);
          const score = stateCode ? stateHealthScores[stateCode] || 70 : 70;
          
          const isHovered = hoveredStateId === stateCode;
          const isSelected = selectedState === stateCode;

          const getHealthColor = (s: number) => {
            if (s >= 80) return "#10b981";
            if (s >= 65) return "#f59e0b";
            return "#ef4444";
          };

          let fillOpacity = 0.07;
          let strokeOpacity = 0.6;

          if (level === 2) {
            if (!isSelected) {
              fillOpacity = 0.01;
              strokeOpacity = 0.15;
            } else {
              fillOpacity = 0.35;
              strokeOpacity = 1.0;
            }
          } else if (isHovered) {
            fillOpacity = 0.22;
          }

          return {
            fillColor: getHealthColor(score),
            fillOpacity,
            color: isSelected ? "#a855f7" : getHealthColor(score),
            weight: isSelected ? 3.5 : isHovered ? 2.2 : 0.8,
            opacity: strokeOpacity
          };
        },
        onEachFeature: (feature, layer) => {
          const name = feature?.properties?.ST_NM || feature?.properties?.state_name || "";
          const stateCode = findStateCodeByName(name);

          layer.on({
            mouseover: () => {
              if (level === 1 && stateCode && setHoveredStateId) {
                setHoveredStateId(stateCode);
              }
            },
            mouseout: () => {
              if (level === 1 && setHoveredStateId) {
                setHoveredStateId(null);
              }
            },
            click: () => {
              if (level === 1 && stateCode && setSelectedState && setLevel) {
                setSelectedState(stateCode);
                setLevel(2);
                if (typeof (layer as any).getBounds === "function") {
                  map.fitBounds((layer as any).getBounds(), { padding: [20, 20] });
                }
              }
            }
          });
        }
      }).addTo(map);

      geojsonLayerRef.current = geojsonLayer;
    }
  }, [geojsonData, level, selectedState, hoveredStateId]);

  // Redraw features when issues, layers toggle or level changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous elements
    markersLayerRef.current?.clearLayers();
    heatmapLayerRef.current?.clearLayers();
    aqiLayerRef.current?.clearLayers();
    riskLayerRef.current?.clearLayers();

    // Render features (only if in level 3, or if zoomed on a state)
    // Note: If level is 1 or 2, we can show active city pins or all pins as tiny reference dots
    const displayIssues = issues;

    displayIssues.forEach((issue) => {
      const color = getSeverityColor(issue.severity, issue.status);
      const isAnimated = animateIssueId === issue.id;

      // 1. ADD ISSUE MARKER (📍)
      if (layers.markers && markersLayerRef.current) {
        // Custom interactive HTML-styled CSS div icon
        const markerClass = `civic-pulse-marker ${isAnimated ? "animate-drop-pulse" : ""}`;
        const markerHtml = `
          <div class="relative flex items-center justify-center pointer-events-auto" style="width: 32px; height: 32px;">
            ${isAnimated ? `<div class="absolute w-20 h-20 rounded-full bg-cyan-400/30 animate-ping z-0 pointer-events-none"></div>` : ""}
            <div class="absolute w-6 h-6 rounded-full border border-white/40 shadow-xl flex items-center justify-center z-10 transition-transform duration-300 hover:scale-125" 
                 style="background-color: ${color}ee; box-shadow: 0 0 10px ${color};">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="text-white">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          html: markerHtml,
          className: markerClass,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([issue.latitude, issue.longitude], { icon });
        
        // Popup detailing telemetry information matching our design requirements
        const popupContent = `
          <div class="font-sans text-white p-3.5 bg-[#090d16] border border-white/10 rounded-2xl min-w-[220px] shadow-2xl space-y-2 pointer-events-auto">
            <div class="flex items-center gap-1.5 border-b border-white/5 pb-2">
              <span class="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border" 
                    style="color: ${color}; border-color: ${color}50; background-color: ${color}15;">
                ${issue.status}
              </span>
              <span class="text-[9px] font-mono text-slate-500 ml-auto">
                ${new Date(issue.reportedAt).toLocaleDateString()}
              </span>
            </div>
            
            <h4 class="text-xs font-bold font-display text-white mt-1 leading-snug">${issue.title}</h4>
            <p class="text-[10px] text-slate-400 leading-normal line-clamp-2">${issue.description}</p>
            
            <div class="grid grid-cols-2 gap-1.5 pt-2 text-[9px] font-mono text-slate-400 border-t border-white/5">
              <div>
                <span class="text-[7.5px] text-slate-500 uppercase block">Severity</span>
                <strong class="text-white font-bold" style="color: ${color};">${issue.severity}</strong>
              </div>
              <div>
                <span class="text-[7.5px] text-slate-500 uppercase block">Impact Score</span>
                <strong class="text-white font-bold">${issue.communityImpactScore || 50} pts</strong>
              </div>
            </div>

            <div class="text-[9px] font-mono text-neon-cyan pt-1 flex items-center gap-1.5">
              <span class="inline-block w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
              ${issue.verificationsCount} verified reports
            </div>

            ${issue.imageUrl ? `<img src="${issue.imageUrl}" class="w-full h-16 object-cover rounded-lg border border-white/5 mt-1" />` : ""}
            
            <button id="marker-btn-${issue.id}" class="w-full py-1.5 mt-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-[9px] font-bold border border-white/10 transition-colors cursor-pointer text-center">
              Open Analysis Center
            </button>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          className: "custom-leaflet-popup"
        });

        marker.on("popupopen", () => {
          const btn = document.getElementById(`marker-btn-${issue.id}`);
          if (btn) {
            btn.onclick = () => {
              if (onSelectIssue) onSelectIssue(issue);
            };
          }
        });

        marker.on("click", () => {
          if (onSelectIssue) {
            onSelectIssue(issue);
          }
        });

        markersLayerRef.current.addLayer(marker);
      }

      // 2. HEATMAP LAYER (🔥)
      if (layers.heatmap && heatmapLayerRef.current) {
        const heatmapCircle = L.circle([issue.latitude, issue.longitude], {
          radius: 1200,
          fillColor: color,
          fillOpacity: 0.18,
          stroke: false,
          interactive: false
        });
        heatmapLayerRef.current.addLayer(heatmapCircle);
      }

      // 3. AQI LAYER (🌫)
      if (layers.aqi && aqiLayerRef.current) {
        const aqiVal = issue.aqi || 120;
        const aqiColor = aqiVal > 150 ? "#f97316" : aqiVal > 100 ? "#eab308" : "#06b6d4";
        const aqiCircle = L.circle([issue.latitude, issue.longitude], {
          radius: 1800,
          fillColor: aqiColor,
          fillOpacity: 0.08,
          color: aqiColor,
          weight: 1,
          dashArray: "4, 4",
          interactive: false
        });
        aqiLayerRef.current.addLayer(aqiCircle);
      }

      // 4. RISK LAYER (🚨)
      if (layers.risk && riskLayerRef.current) {
        if (issue.severity === "Critical" || issue.severity === "High") {
          const riskCircle = L.circle([issue.latitude, issue.longitude], {
            radius: 800,
            fillColor: "#ef4444",
            fillOpacity: 0.04,
            color: "#ef4444",
            weight: 1.5,
            dashArray: "5, 5",
            interactive: false
          });
          riskLayerRef.current.addLayer(riskCircle);
        }
      }
    });

    // 5. Draw "You Are Here" GPS Synced Blue Pulse Marker
    if (userLocation && markersLayerRef.current) {
      const gpsClass = "user-gps-pulse-marker";
      const gpsHtml = `
        <div class="relative flex items-center justify-center pointer-events-auto" style="width: 32px; height: 32px;">
          <div class="absolute w-12 h-12 rounded-full bg-blue-500/25 animate-ping z-0 pointer-events-none"></div>
          <div class="absolute w-4 h-4 rounded-full border-2 border-white shadow-2xl bg-blue-500 z-10" style="box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>
        </div>
      `;
      const gpsIcon = L.divIcon({
        html: gpsHtml,
        className: gpsClass,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
      });
      const gpsMarker = L.marker([userLocation.latitude, userLocation.longitude], { icon: gpsIcon });
      gpsMarker.bindPopup(`
        <div class="font-sans text-white p-3 bg-[#090d16] border border-blue-500/30 rounded-2xl min-w-[200px] shadow-2xl space-y-1">
          <span class="text-[9px] font-mono text-blue-400 font-extrabold uppercase tracking-wider block">📍 Your Location Grid</span>
          <h4 class="text-xs font-black text-white font-display">${userLocation.locality || "GPS Sync"}</h4>
          <p class="text-[10px] text-slate-400 font-mono">${userLocation.city}, ${userLocation.state}</p>
        </div>
      `, { closeButton: false, className: "custom-leaflet-popup" });
      markersLayerRef.current.addLayer(gpsMarker);
    }

    // Handle Drop Animation toast when requested
    if (animateIssueId) {
      const animatedIssue = issues.find(i => i.id === animateIssueId);
      if (animatedIssue) {
        // Zoom map smoothly to the issue location
        map.setView([animatedIssue.latitude, animatedIssue.longitude], 14, {
          animate: true,
          duration: 1.2
        });

        setToastMessage(`Your report has been added to the Community Map.`);
        setShowToast(true);

        const timer = setTimeout(() => {
          setShowToast(false);
          if (clearAnimateIssueId) clearAnimateIssueId();
        }, 5000);

        return () => clearTimeout(timer);
      }
    }
  }, [issues, layers, animateIssueId, level]);

  // Sync selection flyto/zoom
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedIssue) return;

    // Center map with slightly zoomed in level
    map.setView([selectedIssue.latitude, selectedIssue.longitude], 14, {
      animate: true,
      duration: 1.0
    });
  }, [selectedIssue]);

  // Synchronize map pan & zoom behaviors on level, state, and city transitions
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (level === 1) {
      map.setView([22.5937, 78.9629], 4.5);
    } else if (level === 2 && selectedState) {
      let fitBoundsDone = false;
      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.eachLayer((layer: any) => {
          const feature = layer.feature;
          const name = (feature?.properties?.ST_NM || feature?.properties?.state_name || "") as string;
          const stateCode = findStateCodeByName(name);
          if (stateCode === selectedState && typeof layer.getBounds === "function") {
            map.fitBounds(layer.getBounds(), { padding: [40, 40] });
            fitBoundsDone = true;
          }
        });
      }

      if (!fitBoundsDone) {
        const stateCenters: { [code: string]: { lat: number; lng: number; zoom: number } } = {
          JK: { lat: 33.7782, lng: 76.5762, zoom: 6 },
          PH: { lat: 30.7333, lng: 76.7794, zoom: 7 },
          DL: { lat: 28.6139, lng: 77.2090, zoom: 10 },
          RJ: { lat: 27.0238, lng: 74.2179, zoom: 6 },
          GJ: { lat: 22.2587, lng: 71.1924, zoom: 6 },
          MP: { lat: 22.9734, lng: 78.6569, zoom: 6 },
          UP: { lat: 26.8467, lng: 80.7462, zoom: 6 },
          BR_JH: { lat: 25.0961, lng: 85.3131, zoom: 6 },
          WB: { lat: 22.9868, lng: 87.8550, zoom: 6 },
          CG: { lat: 21.2787, lng: 81.8661, zoom: 6 },
          OR: { lat: 20.9517, lng: 85.0985, zoom: 6 },
          MH: { lat: 19.7515, lng: 75.7139, zoom: 6 },
          TG: { lat: 18.1124, lng: 79.0193, zoom: 7 },
          KA: { lat: 15.3173, lng: 75.7139, zoom: 6 },
          AP: { lat: 15.9129, lng: 79.7400, zoom: 6 },
          KL: { lat: 10.8505, lng: 76.2711, zoom: 7 },
          TN: { lat: 11.1271, lng: 78.6569, zoom: 6 },
          NE: { lat: 26.2006, lng: 92.9376, zoom: 6 }
        };
        const fallback = stateCenters[selectedState];
        if (fallback) {
          map.setView([fallback.lat, fallback.lng], fallback.zoom);
        }
      }
    } else if (level === 3 && selectedCity) {
      const cityCoords = {
        "New Delhi": { lat: 28.6139, lng: 77.2090 },
        "Mumbai": { lat: 19.0760, lng: 72.8777 },
        "Pune": { lat: 18.5204, lng: 73.8567 },
        "Bengaluru": { lat: 12.9716, lng: 77.5946 },
        "Hyderabad": { lat: 17.3850, lng: 78.4867 },
        "Chennai": { lat: 13.0827, lng: 80.2707 },
        "Kolkata": { lat: 22.5726, lng: 88.3639 },
        "Noida": { lat: 28.5355, lng: 77.3910 },
        "Lucknow": { lat: 26.8467, lng: 80.9462 },
        "Jaipur": { lat: 26.9124, lng: 75.7873 },
        "Ahmedabad": { lat: 23.0225, lng: 72.5714 }
      };
      const coords = cityCoords[selectedCity as keyof typeof cityCoords];
      if (coords) {
        map.setView([coords.lat, coords.lng], 11);
      }
    }
  }, [level, selectedState, selectedCity]);

  const toggleLayer = (layerName: keyof typeof defaultLayers) => {
    setLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  return (
    <div className="w-full h-full relative" style={{ height }}>
      {/* Actual Map Container */}
      <div ref={mapContainerRef} className="w-full h-full relative z-0 bg-slate-950 rounded-2xl" />

      {/* Embedded High-Tech Layer Controller */}
      <div className="absolute bottom-4 left-4 z-20 flex flex-wrap gap-2 bg-slate-950/80 backdrop-blur-md border border-white/10 p-2 rounded-xl shadow-xl max-w-[calc(100%-2rem)]">
        <button
          onClick={() => toggleLayer("markers")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all border ${
            layers.markers
              ? "bg-neon-cyan/10 text-neon-cyan border-neon-cyan/40"
              : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10"
          }`}
        >
          <MapPin className="w-3.5 h-3.5" /> Issue Markers
        </button>

        <button
          onClick={() => toggleLayer("heatmap")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all border ${
            layers.heatmap
              ? "bg-red-500/10 text-red-400 border-red-500/40"
              : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10"
          }`}
        >
          <Flame className="w-3.5 h-3.5" /> Heatmap
        </button>

        <button
          onClick={() => toggleLayer("aqi")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all border ${
            layers.aqi
              ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/40"
              : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10"
          }`}
        >
          <Wind className="w-3.5 h-3.5" /> AQI Layer
        </button>

        <button
          onClick={() => toggleLayer("risk")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold transition-all border ${
            layers.risk
              ? "bg-rose-500/10 text-rose-400 border-rose-500/40"
              : "bg-white/[0.02] text-slate-400 border-white/5 hover:border-white/10"
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> Risk Contours
        </button>
      </div>

      {/* Floating Notarized Drop Confirmation Banner (Toast) */}
      {showToast && (
        <div className="absolute top-4 left-4 right-4 z-40 flex items-center gap-3 bg-slate-950/95 border border-cyan-500/40 px-5 py-3.5 rounded-2xl shadow-[0_0_25px_rgba(6,182,212,0.25)] animate-bounce-short max-w-md mx-auto">
          <div className="w-7 h-7 rounded-full bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0">
            <Sparkles className="w-4 h-4 animate-spin-slow" />
          </div>
          <div className="flex-grow text-left">
            <span className="text-[8px] font-mono font-bold text-cyan-400 uppercase tracking-widest block leading-none mb-0.5">
              SPATIAL SYNCHRONISATION SECURED
            </span>
            <p className="text-xs font-display text-white font-medium leading-tight">
              {toastMessage}
            </p>
          </div>
        </div>
      )}

      {/* Localized styles injection */}
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: transparent !important;
          box-shadow: none !important;
          border: none !important;
          padding: 0 !important;
        }
        .custom-leaflet-popup .leaflet-popup-tip-container {
          display: none !important;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 0 !important;
        }
        @keyframes bounce-short {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short {
          animation: bounce-short 3s infinite ease-in-out;
        }
        
        /* Drop animation styles */
        @keyframes marker-drop {
          0% {
            transform: translateY(-250px) scaleY(1.3);
            opacity: 0;
          }
          60% {
            transform: translateY(5px) scaleY(0.9);
            opacity: 1;
          }
          80% {
            transform: translateY(-2px) scaleY(1.05);
          }
          100% {
            transform: translateY(0) scaleY(1);
          }
        }
        .animate-drop-pulse {
          animation: marker-drop 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        
        .leaflet-container {
          outline: none;
        }
      `}</style>
    </div>
  );
}
