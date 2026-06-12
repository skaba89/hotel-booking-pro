'use client';

import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, Wind, Droplets, Thermometer } from 'lucide-react';

// Simulated weather for Conakry (tropical climate)
// In production, connect to OpenWeather API or similar
function getConakryWeather() {
  const month = new Date().getMonth();
  // Conakry: dry season Nov-Apr, rainy season May-Oct
  const isRainy = month >= 4 && month <= 9;

  const baseTemp = isRainy ? 26 : 30;
  const temp = baseTemp + Math.floor(Math.random() * 4) - 1;
  const humidity = isRainy ? 85 + Math.floor(Math.random() * 10) : 60 + Math.floor(Math.random() * 15);
  const wind = 8 + Math.floor(Math.random() * 10);

  return {
    temp,
    humidity,
    wind,
    condition: isRainy ? 'Pluies tropicales' : 'Ensoleille',
    icon: isRainy ? 'rain' : 'sun',
    forecast: [
      { day: 'Dem', temp: temp + 1, icon: isRainy ? 'cloud-rain' : 'sun' },
      { day: 'J+2', temp: temp - 1, icon: isRainy ? 'rain' : 'cloud' },
      { day: 'J+3', temp: temp, icon: isRainy ? 'cloud' : 'sun' },
    ],
  };
}

const WeatherIcon = ({ type, className }: { type: string; className?: string }) => {
  switch (type) {
    case 'sun': return <Sun className={className} />;
    case 'rain':
    case 'cloud-rain': return <CloudRain className={className} />;
    case 'cloud': return <Cloud className={className} />;
    default: return <Sun className={className} />;
  }
};

export function WeatherWidget() {
  const [weather, setWeather] = useState<ReturnType<typeof getConakryWeather> | null>(null);

  useEffect(() => {
    setWeather(getConakryWeather());
  }, []);

  if (!weather) return null;

  return (
    <div className="bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl p-4 text-white">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-blue-200">Meteo Conakry</p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">{weather.temp}</span>
            <span className="text-lg">°C</span>
          </div>
          <p className="text-sm text-blue-100">{weather.condition}</p>
        </div>
        <WeatherIcon type={weather.icon} className="w-12 h-12 text-white/80" />
      </div>

      <div className="flex gap-3 text-xs text-blue-200 mb-3">
        <span className="flex items-center gap-1"><Droplets className="w-3 h-3" /> {weather.humidity}%</span>
        <span className="flex items-center gap-1"><Wind className="w-3 h-3" /> {weather.wind} km/h</span>
      </div>

      <div className="border-t border-white/20 pt-3 flex gap-4">
        {weather.forecast.map((day) => (
          <div key={day.day} className="text-center flex-1">
            <p className="text-[10px] text-blue-200">{day.day}</p>
            <WeatherIcon type={day.icon} className="w-4 h-4 mx-auto my-1 text-white/70" />
            <p className="text-xs font-medium">{day.temp}°</p>
          </div>
        ))}
      </div>
    </div>
  );
}
