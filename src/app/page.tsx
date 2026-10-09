"use client";

import React, { useState } from "react";
import { parseGoogleTakeoutZip, ParsedData } from "@/lib/parseLocationData";
import MapView from "@/components/MapView";

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

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden text-slate-800 font-sans">
      {/* Sidebar Dashboard */}
      <div className="w-80 h-full bg-white shadow-xl flex flex-col z-10">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold tracking-tight text-blue-600">Timeline Heatmap</h1>
          <p className="text-sm text-gray-500 mt-1">Visualize your Google Location History</p>
        </div>
        
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* File Upload Zone */}
          {!data && (
            <label className="border-2 border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 rounded-lg p-6 text-center cursor-pointer transition-colors block">
              <input 
                type="file" 
                accept=".zip" 
                onChange={handleFileUpload} 
                className="hidden" 
              />
              <p className="text-sm font-semibold text-blue-700">Drop your Takeout ZIP here</p>
              <p className="text-xs text-blue-500 mt-2">or click to browse</p>
              <p className="text-xs text-gray-400 mt-4">100% Client-side. No data uploaded.</p>
            </label>
          )}

          {loading && (
            <div className="text-center p-4 bg-gray-100 rounded-lg">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm font-medium">{progressMsg}</p>
            </div>
          )}
          
          {/* Stats Display */}
          {data && (
            <>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Summary</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Places</p>
                    <p className="text-xl font-bold text-gray-800">{data.places.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Routes</p>
                    <p className="text-xl font-bold text-gray-800">{data.routes.length.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Hours Spent</p>
                    <p className="text-xl font-bold text-gray-800">{Math.round(data.totalHours).toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">KM Traveled</p>
                    <p className="text-xl font-bold text-gray-800">{Math.round(data.totalDistance / 1000).toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setData(null)}
                className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition"
              >
                Clear Data
              </button>
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
