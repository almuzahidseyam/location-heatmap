"use client";

import React, { useState, useEffect, useMemo } from "react";
import { parseFile, ParsedData, generateDemoData } from "@/lib/parseLocationData";
import { processData, ProcessedData } from "@/lib/processData";
import dynamic from "next/dynamic";
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { Sun, Moon, Map as MapIcon, Edit2, Camera } from "lucide-react";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [rawData, setRawData] = useState<ParsedData | null>(null);
  
  // UI State
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [minVisits, setMinVisits] = useState(1);
  const [customNames, setCustomNames] = useState<Record<string, string>>({});
  const [focusLoc, setFocusLoc] = useState<{lat: number, lng: number} | null>(null);

  // Load saved names
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tl-names');
      if (saved) setCustomNames(JSON.parse(saved));
      
      if (window.matchMedia('(prefers-color-scheme: light)').matches) {
        setTheme('light');
      }
    } catch(e) {}
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setLoading(true);
      const parsed = await parseFile(file, setProgressMsg);
      setRawData(parsed);
    } catch (err: any) {
      alert(err.message || "Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setRawData(generateDemoData());
      setLoading(false);
    }, 500);
  };

  const handleRename = (key: string, currentName: string) => {
    const newName = prompt('Enter a name for this place:', currentName !== 'Unnamed' ? currentName : '');
    if (newName === null) return;
    
    const updated = { ...customNames };
    if (newName.trim()) {
      updated[key] = newName.trim();
    } else {
      delete updated[key];
    }
    setCustomNames(updated);
    try { localStorage.setItem('tl-names', JSON.stringify(updated)); } catch(e) {}
  };

  // Derive processed data
  const data = useMemo(() => processData(rawData, minVisits, customNames), [rawData, minVisits, customNames]);

  const handleSaveImage = () => {
    const canvas = document.getElementById("deckgl-map") as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement("a");
      link.download = "timeline-heatmap.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else {
      alert("Map canvas not found.");
    }
  };

  return (
    <div className={`flex flex-col md:flex-row h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-200' : 'bg-gray-50 text-slate-800'}`}>
      
      {/* Sidebar */}
      <div className={`w-full md:w-96 h-[45%] md:h-full shadow-2xl flex flex-col z-10 overflow-hidden ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} border-b md:border-b-0 md:border-r`}>
        <div className="p-5 border-b shrink-0 flex justify-between items-center border-inherit">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-blue-500">Timeline Heatmap</h1>
            <p className="text-xs opacity-60 mt-1">Google Timeline Viewer</p>
          </div>
          <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2 rounded-md hover:bg-slate-500/20">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto space-y-6 custom-scrollbar">
          
          {/* Upload / Demo */}
          {!data && (
            <div className="space-y-4">
              <label className="border-2 border-dashed border-blue-400/50 hover:border-blue-400 bg-blue-500/5 rounded-lg p-6 text-center cursor-pointer transition-colors block">
                <input type="file" accept=".zip,.json" onChange={handleFileUpload} className="hidden" />
                <p className="text-sm font-semibold text-blue-500">Drop Timeline JSON / ZIP</p>
                <p className="text-xs opacity-60 mt-2">100% Client-side. Private.</p>
              </label>
              <button onClick={handleDemo} className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                Try the Demo
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center p-4 rounded-lg bg-slate-500/10">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-medium">{progressMsg}</p>
            </div>
          )}
          
          {/* Dashboard */}
          {data && (
            <>
              {/* Controls */}
              <div className="flex justify-between items-center bg-slate-500/10 p-2 rounded-lg text-sm">
                <span className="text-xs opacity-70">Min Visits:</span>
                <select 
                  className="bg-transparent border border-slate-500/30 rounded px-2 py-1 outline-none"
                  value={minVisits}
                  onChange={(e) => setMinVisits(Number(e.target.value))}
                >
                  <option value={1}>1+</option>
                  <option value={2}>2+</option>
                  <option value={5}>5+</option>
                  <option value={10}>10+</option>
                  <option value={25}>25+</option>
                </select>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-500/5 p-3 rounded-lg border border-slate-500/10">
                  <p className="text-[10px] uppercase opacity-60 font-semibold">Places</p>
                  <p className="text-xl font-bold">{data.places.length}</p>
                </div>
                <div className="bg-slate-500/5 p-3 rounded-lg border border-slate-500/10">
                  <p className="text-[10px] uppercase opacity-60 font-semibold">Visits</p>
                  <p className="text-xl font-bold">{rawData?.rawPlaces.length || 0}</p>
                </div>
                <div className="bg-slate-500/5 p-3 rounded-lg border border-slate-500/10">
                  <p className="text-[10px] uppercase opacity-60 font-semibold">Hours</p>
                  <p className="text-xl font-bold">{Math.round(data.totalHours)}h</p>
                </div>
                <div className="bg-slate-500/5 p-3 rounded-lg border border-slate-500/10">
                  <p className="text-[10px] uppercase opacity-60 font-semibold">Routes</p>
                  <p className="text-xl font-bold">{data.routes.length}</p>
                </div>
              </div>

              {/* Top Places */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-2 opacity-60">Top Places · Click to zoom</h3>
                <div className="space-y-1">
                  {data.topPlaces.map((place, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between text-sm p-2 hover:bg-slate-500/10 rounded cursor-pointer group"
                      onClick={() => setFocusLoc({lat: place.lat, lng: place.lng})}
                    >
                      <span className="truncate pr-2 font-medium flex-1" title={place.name}>{place.name}</span>
                      <span className="text-xs opacity-60 shrink-0">{place.visits}x · {Math.round(place.hours)}h</span>
                      <button 
                        className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleRename(place.key, place.name); }}
                      >
                        <Edit2 size={14} className="text-blue-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Patterns */}
              <div>
                <h3 className="text-[10px] font-bold uppercase tracking-wider mb-3 opacity-60">Arrival Patterns</h3>
                <p className="text-[10px] opacity-60 mb-1">By Weekday</p>
                <div className="h-20 w-full mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.patterns.byWeekday}>
                      <XAxis dataKey="day" tick={{fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} tickLine={false} axisLine={false}/>
                      <RechartsTooltip cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9'}} contentStyle={{fontSize: '12px', color: 'black'}}/>
                      <Bar dataKey="count" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-[10px] opacity-60 mb-1">By Hour</p>
                <div className="h-20 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.patterns.byHour}>
                      <XAxis dataKey="hour" tick={{fontSize: 10, fill: theme === 'dark' ? '#94a3b8' : '#64748b'}} tickLine={false} axisLine={false} interval={5}/>
                      <RechartsTooltip cursor={{fill: theme === 'dark' ? '#334155' : '#f1f5f9'}} contentStyle={{fontSize: '12px', color: 'black'}}/>
                      <Bar dataKey="count" fill="#10b981" radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 space-y-2">
                <button 
                  onClick={handleSaveImage}
                  className="w-full flex justify-center items-center gap-2 py-2 bg-slate-500/10 rounded-lg text-sm font-semibold hover:bg-slate-500/20 transition"
                >
                  <Camera size={16} /> Save as Image
                </button>
                <button 
                  onClick={() => { setRawData(null); setFocusLoc(null); }}
                  className="w-full py-2 text-red-500 bg-red-500/10 rounded-lg text-sm font-semibold hover:bg-red-500/20 transition"
                >
                  Clear Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 relative bg-inherit">
        {data ? (
          <MapView data={data} theme={theme} focusLocation={focusLoc} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-40">
            <MapIcon className="w-16 h-16 mb-4" />
            <p>Upload data to render map</p>
          </div>
        )}
      </div>
    </div>
  );
}
