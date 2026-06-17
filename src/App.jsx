import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Cloud, CloudRain, Sun, CloudLightning, 
  CloudSnow, CloudDrizzle, Droplets, Wind, Thermometer,
  CloudFog, AlertCircle, Eye, Sunrise, Sunset, SunDim, Clock, X, CheckCircle
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './index.css';

// Map WMO codes to human readable text and Lucide icons
const getWeatherInfo = (code, isDay = 1) => {
  const codes = {
    0: { text: 'Clear Sky', icon: isDay ? Sun : Sun },
    1: { text: 'Mainly Clear', icon: isDay ? Sun : Cloud },
    2: { text: 'Partly Cloudy', icon: Cloud },
    3: { text: 'Overcast', icon: Cloud },
    45: { text: 'Fog', icon: CloudFog },
    48: { text: 'Rime Fog', icon: CloudFog },
    51: { text: 'Light Drizzle', icon: CloudDrizzle },
    53: { text: 'Moderate Drizzle', icon: CloudDrizzle },
    55: { text: 'Dense Drizzle', icon: CloudDrizzle },
    56: { text: 'Freezing Drizzle', icon: CloudDrizzle },
    57: { text: 'Dense Freezing Drizzle', icon: CloudDrizzle },
    61: { text: 'Slight Rain', icon: CloudRain },
    63: { text: 'Moderate Rain', icon: CloudRain },
    65: { text: 'Heavy Rain', icon: CloudRain },
    66: { text: 'Light Freezing Rain', icon: CloudRain },
    67: { text: 'Heavy Freezing Rain', icon: CloudRain },
    71: { text: 'Slight Snow', icon: CloudSnow },
    73: { text: 'Moderate Snow', icon: CloudSnow },
    75: { text: 'Heavy Snow', icon: CloudSnow },
    77: { text: 'Snow Grains', icon: CloudSnow },
    80: { text: 'Slight Showers', icon: CloudRain },
    81: { text: 'Moderate Showers', icon: CloudRain },
    82: { text: 'Violent Showers', icon: CloudRain },
    85: { text: 'Slight Snow Showers', icon: CloudSnow },
    86: { text: 'Heavy Snow Showers', icon: CloudSnow },
    95: { text: 'Thunderstorm', icon: CloudLightning },
    96: { text: 'Thunderstorm & Hail', icon: CloudLightning },
    99: { text: 'Heavy Thunderstorm', icon: CloudLightning },
  };
  return codes[code] || { text: 'Unknown', icon: Cloud };
};

const getDayName = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

const getShortDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatTime = (dateStr) => {
  if (!dateStr) return '--:--';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Custom tooltip for Recharts showing the icon beside the temp number
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const fullLabel = data.fullLabel;
    
    // Get the icon based on the specific hour's weather code and day/night status
    const info = getWeatherInfo(data.code, data.isDay);
    const Icon = info.icon;

    return (
      <div className="custom-tooltip">
        <p className="label">{fullLabel || label}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
          <Icon size={20} color="#3b82f6" strokeWidth={2} />
          <p className="temp" style={{ margin: 0 }}>{`${data.temp}°C`}</p>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', textTransform: 'capitalize' }}>
          {info.text}
        </p>
      </div>
    );
  }
  return null;
};

// Custom Dot to display small icons directly on the chart line!
const CustomDot = (props) => {
  const { cx, cy, payload, index } = props;
  
  // To avoid crowding, let's only render the icon every 3 hours (index % 3 === 0)
  if (index % 3 !== 0) return null;

  const info = getWeatherInfo(payload.code, payload.isDay);
  const Icon = info.icon;
  
  // Render the Lucide icon as an SVG element directly on the chart
  return (
    <svg x={cx - 10} y={cy - 25} width={20} height={20} className="chart-icon-dot">
      <Icon size={20} color="var(--text-primary)" strokeWidth={1.5} />
    </svg>
  );
};

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [locationName, setLocationName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [coords, setCoords] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);
  
  const [notification, setNotification] = useState(null);
  const [removingCity, setRemovingCity] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('weatherRecentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const saveRecentSearch = (cityObj) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(item => item.name !== cityObj.name);
      const updated = [cityObj, ...filtered].slice(0, 5);
      localStorage.setItem('weatherRecentSearches', JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteRecent = (e, cityObj) => {
    e.stopPropagation(); 
    setRemovingCity(cityObj.name);
    setTimeout(() => {
      setRecentSearches((prev) => {
        const updated = prev.filter(item => item.name !== cityObj.name);
        localStorage.setItem('weatherRecentSearches', JSON.stringify(updated));
        return updated;
      });
      setRemovingCity(null);
      showNotification(`Removed ${cityObj.name.split(',')[0]} from recents`);
    }, 300);
  };

  const fetchWeather = async (lat, lon, name, isBackgroundUpdate = false) => {
    try {
      if (!isBackgroundUpdate) {
        setLoading(true);
        setError(null);
      }
      
      // Fetching is_day in hourly as well
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,wind_speed_10m&hourly=temperature_2m,relative_humidity_2m,apparent_temperature,wind_speed_10m,weather_code,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      
      setWeatherData(data);
      setLocationName(name);
      setCoords({ lat, lon });
      
      if (!isBackgroundUpdate) {
        setSelectedDayIndex(0); 
      }
    } catch (err) {
      if (!isBackgroundUpdate) setError(err.message);
    } finally {
      if (!isBackgroundUpdate) setLoading(false);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (coords) {
        fetchWeather(coords.lat, coords.lon, locationName, true);
      }
    }, 1000 * 60 * 60); 
    
    return () => clearInterval(interval);
  }, [coords, locationName]);

  const executeSearch = async (query) => {
    try {
      setLoading(true);
      setError(null);
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.results || data.results.length === 0) {
        throw new Error('City not found');
      }

      const city = data.results[0];
      const fullName = `${city.name}, ${city.country_code}`;
      await fetchWeather(city.latitude, city.longitude, fullName);
      
      saveRecentSearch({ name: fullName, lat: city.latitude, lon: city.longitude });
      setSearchQuery('');
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      executeSearch(searchQuery);
    }
  };

  const handleRecentClick = (city) => {
    fetchWeather(city.lat, city.lon, city.name);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      fetchWeather(51.5085, -0.1257, 'London, GB');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const revUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
          const res = await fetch(revUrl);
          const revData = await res.json();
          const name = revData.city ? `${revData.city}, ${revData.countryCode}` : 'Current Location';
          await fetchWeather(latitude, longitude, name);
          saveRecentSearch({ name, lat: latitude, lon: longitude });
        } catch {
          await fetchWeather(latitude, longitude, 'Current Location');
        }
      },
      (err) => {
        console.warn('Geolocation error:', err.message);
        fetchWeather(51.5085, -0.1257, 'London, GB'); 
      }
    );
  };

  useEffect(() => {
    const saved = localStorage.getItem('weatherRecentSearches');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        const lastCity = parsed[0];
        fetchWeather(lastCity.lat, lastCity.lon, lastCity.name);
        return;
      }
    }
    getCurrentLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (weatherData && selectedDayIndex === 0) {
      const isDay = weatherData.current.is_day;
      const root = document.documentElement;
      if (isDay) {
        root.style.setProperty('--bg-start', '#1e40af');
        root.style.setProperty('--bg-end', '#0f172a');
      } else {
        root.style.setProperty('--bg-start', '#020617');
        root.style.setProperty('--bg-end', '#0f172a');
      }
    }
  }, [weatherData, selectedDayIndex]);

  const getChartData = () => {
    if (!weatherData) return [];
    
    const targetDatePrefix = weatherData.daily.time[selectedDayIndex];
    let startIndex = weatherData.hourly.time.findIndex(t => t.startsWith(targetDatePrefix));
    if (startIndex === -1) startIndex = 0;

    const chartSlice = weatherData.hourly.time.slice(startIndex, startIndex + 24);
    
    return chartSlice.map((timeStr, idx) => {
      const realIndex = startIndex + idx;
      const date = new Date(timeStr);
      
      const timeFormatted = date.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
      const dateFormatted = getShortDate(timeStr); 
      
      return {
        time: timeFormatted,
        temp: Math.round(weatherData.hourly.temperature_2m[realIndex]),
        fullLabel: `${dateFormatted}, ${timeFormatted}`,
        code: weatherData.hourly.weather_code[realIndex],
        isDay: weatherData.hourly.is_day[realIndex]
      };
    });
  };

  const getDisplayData = () => {
    if (!weatherData) return null;
    
    if (selectedDayIndex === 0) {
      const current = weatherData.current;
      return {
        tempStr: `${Math.round(current.temperature_2m)}°`,
        code: current.weather_code,
        isDay: current.is_day,
        wind: current.wind_speed_10m,
        humidity: current.relative_humidity_2m,
        uv: weatherData.daily.uv_index_max[0] || 0,
        feelsLike: Math.round(current.apparent_temperature),
        sunrise: weatherData.daily.sunrise[0],
        sunset: weatherData.daily.sunset[0],
        dateText: new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      };
    } else {
      const targetDate = weatherData.daily.time[selectedDayIndex];
      let middayIndex = weatherData.hourly.time.findIndex(t => t.startsWith(targetDate) && t.includes('12:00'));
      if (middayIndex === -1) middayIndex = weatherData.hourly.time.findIndex(t => t.startsWith(targetDate));
      
      const max = weatherData.daily.temperature_2m_max[selectedDayIndex];
      const min = weatherData.daily.temperature_2m_min[selectedDayIndex];
      const avg = Math.round((max + min) / 2);

      return {
        tempStr: `~ ${avg}°`,
        code: weatherData.daily.weather_code[selectedDayIndex],
        isDay: 1, 
        wind: weatherData.hourly.wind_speed_10m[middayIndex],
        humidity: weatherData.hourly.relative_humidity_2m[middayIndex],
        uv: weatherData.daily.uv_index_max[selectedDayIndex] || 0,
        feelsLike: Math.round(weatherData.hourly.apparent_temperature[middayIndex]),
        sunrise: weatherData.daily.sunrise[selectedDayIndex],
        sunset: weatherData.daily.sunset[selectedDayIndex],
        dateText: new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
      };
    }
  };

  if (loading && !weatherData) {
    return (
      <div className="full-center">
        <div className="spinner"></div>
        <h2>Initializing...</h2>
      </div>
    );
  }

  if (error && !weatherData) {
    return (
      <div className="full-center">
        <AlertCircle size={64} color="var(--danger)" />
        <p className="error-text">{error}</p>
        <button className="retry-btn" onClick={getCurrentLocation}>Try Again</button>
      </div>
    );
  }

  const chartData = getChartData();
  const displayData = getDisplayData();
  const currentInfo = getWeatherInfo(displayData.code, displayData.isDay);
  const CurrentIcon = currentInfo.icon;

  return (
    <div className="app-dashboard">
      
      {/* Smart Toast Notification */}
      {notification && (
        <div className="toast-notification">
          <CheckCircle size={20} color="#4ade80" />
          <span>{notification}</span>
        </div>
      )}

      {/* SIDEBAR - Left Column */}
      <aside className="sidebar">
        <form className="search-section" onSubmit={handleSearchSubmit}>
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className="location-btn" onClick={getCurrentLocation} title="Use GPS">
            <MapPin size={22} />
          </button>
        </form>

        {recentSearches.length > 0 && (
          <div className="recent-searches">
            <span className="recent-label"><Clock size={14} /> Recent:</span>
            <div className="recent-chips">
              {recentSearches.map((city, idx) => (
                <div 
                  key={idx} 
                  className={`recent-chip ${removingCity === city.name ? 'removing' : ''}`} 
                  onClick={() => handleRecentClick(city)}
                >
                  <span>{city.name.split(',')[0]}</span>
                  <button 
                    className="delete-chip-btn" 
                    onClick={(e) => handleDeleteRecent(e, city)}
                    title="Remove from recents"
                  >
                    <X size={14} strokeWidth={3} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="current-weather-hero">
          <CurrentIcon className="weather-icon-huge" color="#ffffff" strokeWidth={1.5} />
          <h1 className="temp-huge">{displayData.tempStr}</h1>
          <h2 className="condition-text">{currentInfo.text}</h2>
          <p className="location-text">
            <MapPin size={18} /> {locationName}
          </p>
        </div>

        <div className="date-divider"></div>
        <div className="date-text">
          <span>{displayData.dateText} {selectedDayIndex > 0 && "(Forecast)"}</span>
        </div>
      </aside>


      {/* MAIN CONTENT - Right Column */}
      <main className="main-content">
        
        {/* Highlights Section */}
        <section>
          <h2 className="section-title">
            {selectedDayIndex === 0 ? "Today's Highlights" : `${getDayName(weatherData.daily.time[selectedDayIndex])}'s Highlights`}
          </h2>
          <div className="highlights-grid">
            
            <div className="highlight-card">
              <h3 className="highlight-header">UV Index</h3>
              <div className="highlight-content">
                <div>
                  <span className="highlight-value">{displayData.uv}</span>
                </div>
                <div className="highlight-icon-wrapper">
                  <SunDim size={28} />
                </div>
              </div>
            </div>

            <div className="highlight-card">
              <h3 className="highlight-header">Wind Status</h3>
              <div className="highlight-content">
                <div>
                  <span className="highlight-value">{displayData.wind}</span>
                  <span className="highlight-unit"> km/h</span>
                </div>
                <div className="highlight-icon-wrapper">
                  <Wind size={28} />
                </div>
              </div>
            </div>

            <div className="highlight-card">
              <h3 className="highlight-header">Sunrise & Sunset</h3>
              <div className="highlight-content sun-times">
                <div className="sun-time-row">
                  <div className="sun-time-info">
                    <span className="sun-label">Sunrise</span>
                    <span className="sun-val">{formatTime(displayData.sunrise)}</span>
                  </div>
                  <Sunrise size={28} color="#f59e0b" />
                </div>
                <div className="sun-time-row">
                  <div className="sun-time-info">
                    <span className="sun-label">Sunset</span>
                    <span className="sun-val">{formatTime(displayData.sunset)}</span>
                  </div>
                  <Sunset size={28} color="#f97316" />
                </div>
              </div>
            </div>

            <div className="highlight-card">
              <h3 className="highlight-header">Humidity</h3>
              <div className="highlight-content">
                <div>
                  <span className="highlight-value">{displayData.humidity}</span>
                  <span className="highlight-unit"> %</span>
                </div>
                <div className="highlight-icon-wrapper">
                  <Droplets size={28} />
                </div>
              </div>
            </div>
            
          </div>
        </section>

        {/* 24-Hour Chart Section */}
        <section>
          <h2 className="section-title">24-Hour Forecast</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="time" 
                  stroke="var(--text-secondary)" 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  minTickGap={20}
                />
                <YAxis 
                  stroke="var(--text-secondary)" 
                  tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `${val}°`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="temp" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorTemp)"
                  dot={<CustomDot />}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 7-Day Forecast Section */}
        <section>
          <h2 className="section-title">Upcoming Days</h2>
          <div className="week-forecast-grid">
            {weatherData.daily.time.map((timeStr, index) => {
              const code = weatherData.daily.weather_code[index];
              const info = getWeatherInfo(code, 1);
              const DayIcon = info.icon;
              
              const max = Math.round(weatherData.daily.temperature_2m_max[index]);
              const min = Math.round(weatherData.daily.temperature_2m_min[index]);
              const tempDisplay = (
                <>
                  <span className="week-day-max">{max}°</span>
                  <span className="week-day-min">{min}°</span>
                </>
              );
              
              let labelName = getDayName(timeStr).split(',')[0];
              if (index === 0) labelName = 'Today';
              if (index === 1) labelName = 'Tomorrow';

              const isSelected = index === selectedDayIndex;

              return (
                <div 
                  className={`week-day-card ${isSelected ? 'selected' : ''}`} 
                  key={timeStr}
                  onClick={() => setSelectedDayIndex(index)}
                >
                  <span className="week-day-name">{labelName}</span>
                  <DayIcon className="week-day-icon" size={36} color="var(--text-primary)" strokeWidth={1.5} />
                  <div className="week-day-temps">
                    {tempDisplay}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
