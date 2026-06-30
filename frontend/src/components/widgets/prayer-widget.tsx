"use client";

import React, { useState, useEffect } from "react";

export default function PrayerWidget() {
  const [currentTime, setCurrentTime] = useState("");
  
  // Static prayer times for Pawan Puri, Jodhpur simulation
  const prayerTimes = {
    Fajr: "04:30 AM",
    Dhuhr: "12:35 PM",
    Asr: "04:02 PM",
    Maghrib: "07:22 PM",
    Isha: "08:48 PM",
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-brand-mint border border-emerald-100 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      {/* Location Area */}
      <div className="flex items-center space-x-3">
        <span className="text-2xl">📍</span>
        <div>
          <h4 className="text-xs text-gray-500 font-bold uppercase tracking-wider">Delivery Location</h4>
          <button className="flex items-center text-sm font-bold text-brand-emeraldDark hover:underline">
            Pawan Puri, Jodhpur
            <span className="ml-1 text-xs">▼</span>
          </button>
        </div>
      </div>

      {/* Live Prayer countdown times */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="bg-white border border-emerald-50 rounded-lg px-3 py-1.5 text-center shadow-xs">
          <p className="text-[10px] text-gray-500 font-bold uppercase">Current Time</p>
          <p className="text-sm font-bold text-gray-800">{currentTime || "12:35 PM"}</p>
        </div>

        <div className="bg-emerald-800 text-white rounded-lg px-3 py-1.5 text-center shadow-xs">
          <p className="text-[10px] text-emerald-200 font-bold uppercase">Next Prayer: Asr</p>
          <p className="text-sm font-bold">04:02 PM</p>
        </div>

        <div className="hidden lg:flex gap-2">
          {Object.entries(prayerTimes).map(([name, time]) => (
            <div key={name} className="bg-white border border-gray-100 rounded-md px-2 py-1 text-center">
              <p className="text-[8px] text-gray-400 font-bold uppercase">{name}</p>
              <p className="text-[10px] font-bold text-gray-700">{time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
