"use client";

import React, { useState } from "react";
import { parseGoogleTakeoutZip, ParsedData } from "@/lib/parseLocationData";
import MapView from "@/components/MapView";
import { BarChart, Bar, XAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");
  const [data, setData] = useState<ParsedData | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const parsed = await parseGoogleTakeoutZip(file, setProgressMsg);
      setData(parsed);
    } catch (err: any) {
      alert(err.message || "Failed to process file.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveImage = () => {
    const canvas = document.getElementById("deckgl-overlay") as HTMLCanvasElement;
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
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-slate-800 font-sans">
      {/* Sidebar Dashboard */}
      <div className="w-80 h-full bg-white shadow-xl flex flex-col z-10 overflow-hidden">
        <div className="p-5 border-b shrink-0">
          <h1 className="text-xl font-bold tracking-tight text-blue-600">Timeline Heatmap</h1>
          <p className="text-xs text-gray-500 mt-1">Visualize your Google Location History</p>
        </div>
        
        <div className="flex-1 p-5 overflow-y-auto space-y-6 custom-scrollbar">
          {/* File Upload Zone */}
          {!data && (
            <label className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg p-6 text-center cursor-pointer transition-colors block">
              <input 
                type="file" 
                accept=".zip" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <p className="text-sm font-semibold text-blue-700">Drop Takeout ZIP here</p>
              <p className="text-xs text-blue-500 mt-2">or click to browse</p>
              <p className="text-xs text-gray-400 mt-4">100% Client-side. No data uploaded.</p>
            </label>
          )}

          {loading && (
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs font-medium">{progressMsg}</p>
            </div>
          )}
          
          {/* Stats & Dashboard Display */}
          {data && (
            <>
              {/* Summary */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Summary</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Places</p>
                    <p className="text-lg font-bold text-gray-800">{data.places.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Routes</p>
                    <p className="text-lg font-bold text-gray-800">{data.routes.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Hours</p>
                    <p className="text-lg font-bold text-gray-800">{Math.round(data.totalHours).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase">Distance (KM)</p>
                    <p className="text-lg font-bold text-gray-800">{Math.round(data.totalDistance / 1000).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              {/* Top Places */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Top Places</h3>
                <div className="space-y-2">
                  {data.topPlaces.map((place, idx) => (
                    <div key={idx} className="flex justify-between items-center text-sm border-b pb-1">
                      <span className="truncate pr-2 font-medium" title={place.name}>{place.name}</span>
                      <span className="text-xs text-gray-500 shrink-0">{place.visits}x · {Math.round(place.hours)}h</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Arrival Patterns */}
              <div>
                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Arrival Patterns</h3>
                
                <div className="mb-4">
                  <p className="text-xs text-gray-500 mb-1">By Weekday</p>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.patterns.byWeekday}>
                        <XAxis dataKey="day" tick={{fontSize: 10}} tickLine={false} axisLine={false}/>
                        <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{fontSize: '12px'}}/>
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">By Hour of Day</p>
                  <div className="h-24 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.patterns.byHour}>
                        <XAxis dataKey="hour" tick={{fontSize: 10}} tickLine={false} axisLine={false} interval={5}/>
                        <RechartsTooltip cursor={{fill: '#f3f4f6'}} contentStyle={{fontSize: '12px'}}/>
                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="pt-4 space-y-2">
                <button 
                  onClick={handleSaveImage}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                >
                  Save Map as Image
                </button>
                <button 
                  onClick={() => setData(null)}
                  className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
                >
                  Clear Data
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Map Area */}
      <div className="flex-1 relative bg-slate-900">
        {data ? (
          <MapView data={data} />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path></svg>
            <p>Upload data to see your map</p>
          </div>
        )}
      </div>
    </div>
  );
}
