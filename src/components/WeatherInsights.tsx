import { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge, Calendar, MapPin, RefreshCw, Volume2, VolumeX, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { quickWeather } from '../agents/orchestrator';
import { speak, stopSpeaking, isSpeaking } from '../agents/voiceAgent';
import type { WeatherData } from '../agents/types';

interface WeatherInsightsProps {
  language: 'en' | 'hi' | 'mr';
}

const t = {
  en: {
    title: 'Weather Insights & Climate Data',
    subtitle: 'Real-time weather from Visual Crossing API',
    current: 'Current Weather',
    feelsLike: 'Feels Like',
    humidity: 'Humidity',
    wind: 'Wind Speed',
    pressure: 'Pressure',
    visibility: 'Visibility',
    uv: 'UV Index',
    forecast: '5-Day Forecast',
    rainfall: 'Rainfall Forecast (mm)',
    alerts: 'Climate Alerts',
    tips: 'Weather-Based Farming Tips',
    loading: 'Fetching live weather data…',
    cached: 'Showing cached data (offline)',
    refresh: 'Refresh',
    listen: 'Listen',
    location: 'Location',
    drought: 'Low rainfall expected. Plan water conservation.',
    heat: 'High temperatures. Protect crops from heat stress.',
    good: 'Favorable weather for the next few days.',
    aiPowered: '⚡ AI-Powered Insight',
  },
  hi: {
    title: 'मौसम अंतर्दृष्टि और जलवायु डेटा',
    subtitle: 'Visual Crossing API से लाइव मौसम डेटा',
    current: 'वर्तमान मौसम',
    feelsLike: 'महसूस होता है',
    humidity: 'आर्द्रता',
    wind: 'हवा की गति',
    pressure: 'दबाव',
    visibility: 'दृश्यता',
    uv: 'UV सूचकांक',
    forecast: '5-दिन का पूर्वानुमान',
    rainfall: 'वर्षा पूर्वानुमान (mm)',
    alerts: 'जलवायु अलर्ट',
    tips: 'मौसम-आधारित खेती युक्तियाँ',
    loading: 'लाइव मौसम डेटा प्राप्त हो रहा है…',
    cached: 'कैश्ड डेटा दिखाया जा रहा है (ऑफलाइन)',
    refresh: 'ताज़ा करें',
    listen: 'सुनें',
    location: 'स्थान',
    drought: 'कम वर्षा की उम्मीद। जल संरक्षण की योजना बनाएं।',
    heat: 'उच्च तापमान। फसलें गर्मी से बचाएं।',
    good: 'अगले कुछ दिनों के लिए अनुकूल मौसम।',
    aiPowered: '⚡ AI-संचालित अंतर्दृष्टि',
  },
  mr: {
    title: 'हवामान माहिती आणि हवामान डेटा',
    subtitle: 'Visual Crossing API कडून थेट हवामान',
    current: 'सध्याचे हवामान',
    feelsLike: 'जाणवते',
    humidity: 'आर्द्रता',
    wind: 'वाऱ्याचा वेग',
    pressure: 'दाब',
    visibility: 'दृश्यता',
    uv: 'UV निर्देशांक',
    forecast: '5-दिवसाचा अंदाज',
    rainfall: 'पावसाचा अंदाज (mm)',
    alerts: 'हवामान सूचना',
    tips: 'हवामान-आधारित शेती टिपा',
    loading: 'थेट हवामान डेटा मिळवत आहे…',
    cached: 'कॅश्ड डेटा दाखवत आहे (ऑफलाइन)',
    refresh: 'ताजेतवाने करा',
    listen: 'ऐका',
    location: 'स्थान',
    drought: 'कमी पाऊस अपेक्षित. पाणी संवर्धनाची योजना करा.',
    heat: 'उच्च तापमान. पिकांचे उष्णतेपासून संरक्षण करा.',
    good: 'पुढील काही दिवसांसाठी अनुकूल हवामान.',
    aiPowered: '⚡ AI-संचालित माहिती',
  },
};

export default function WeatherInsights({ language }: WeatherInsightsProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cached, setCached] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const tr = t[language];

  const loadWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await quickWeather();
    if (result.data) {
      setWeather(result.data);
      setCached(result.cached);
    } else {
      setError(result.error ?? 'Failed to load weather');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadWeather(); }, [loadWeather]);

  const handleSpeak = () => {
    if (isSpeaking()) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (weather) {
      const msg = `Current weather at ${weather.location}. Temperature ${weather.temperature} degrees Celsius. Humidity ${weather.humidity} percent. ${weather.condition}. ${weather.forecast[0]?.farmingAction ?? ''}`;
      speak(msg, language);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 8000);
    }
  };

  const getWeatherIcon = (cond: string) => {
    if (cond?.toLowerCase().includes('rain')) return <CloudRain className="w-16 h-16 text-blue-400" />;
    if (cond?.toLowerCase().includes('cloud')) return <Cloud className="w-16 h-16 text-gray-400" />;
    return <Sun className="w-16 h-16 text-yellow-400" />;
  };

  const totalRainfall = weather?.forecast.reduce((s, d) => s + d.rainfall, 0) ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Cloud className="w-8 h-8" />
              <h2>{tr.title}</h2>
            </div>
            <p className="text-sky-100 text-sm">{tr.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSpeak}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm transition-colors"
            >
              {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {tr.listen}
            </button>
            <button
              onClick={loadWeather}
              disabled={loading}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {tr.refresh}
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <RefreshCw className="w-12 h-12 text-sky-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">{tr.loading}</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Offline notice */}
      {cached && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">{tr.cached}</AlertDescription>
        </Alert>
      )}

      {/* Current Weather */}
      {!loading && weather && (
        <>
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-2 text-blue-100 text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  <span>{weather.location}</span>
                </div>
                <p className="text-blue-100">{weather.condition}</p>
              </div>
              {getWeatherIcon(weather.condition)}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { label: 'Temperature', value: weather.temperature, unit: '°C' },
                { label: tr.feelsLike, value: weather.feelsLike, unit: '°C' },
                { label: tr.humidity, value: weather.humidity, unit: '%' },
                { label: tr.wind, value: weather.windSpeed, unit: 'km/h' },
              ].map(stat => (
                <div key={stat.label}>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{stat.value}</span>
                    <span className="text-xl">{stat.unit}</span>
                  </div>
                  <p className="text-blue-100 text-sm mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Extra metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white p-6">
              <div className="flex items-center justify-between mb-2">
                <Gauge className="w-6 h-6" />
                <span className="text-sm bg-white/20 rounded-lg px-3 py-1">{tr.pressure}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{weather.pressure}</span>
                <span>hPa</span>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-cyan-500 to-teal-500 text-white p-6">
              <div className="flex items-center justify-between mb-2">
                <Eye className="w-6 h-6" />
                <span className="text-sm bg-white/20 rounded-lg px-3 py-1">{tr.visibility}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{weather.visibility}</span>
                <span>km</span>
              </div>
            </Card>
            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6">
              <div className="flex items-center justify-between mb-2">
                <Sun className="w-6 h-6" />
                <span className="text-sm bg-white/20 rounded-lg px-3 py-1">{tr.uv}</span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold">{weather.uvIndex}</span>
                <span>/11</span>
              </div>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h4 className="text-gray-900 mb-4">{tr.forecast}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={weather.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="tempMax" stroke="#f97316" strokeWidth={2} name="Max °C" />
                  <Line type="monotone" dataKey="tempMin" stroke="#3b82f6" strokeWidth={2} name="Min °C" />
                </LineChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-6">
              <h4 className="text-gray-900 mb-4">{tr.rainfall}</h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weather.forecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="rainfall" fill="#3b82f6" name="Rainfall (mm)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </div>

          {/* Alerts */}
          <div className="space-y-3">
            {totalRainfall < 20 && (
              <Alert className="border-orange-200 bg-orange-50">
                <Droplets className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">{tr.drought}</AlertDescription>
              </Alert>
            )}
            {weather.temperature > 35 && (
              <Alert className="border-red-200 bg-red-50">
                <Sun className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{tr.heat}</AlertDescription>
              </Alert>
            )}
            <Alert className="border-green-200 bg-green-50">
              <Cloud className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{tr.good}</AlertDescription>
            </Alert>
          </div>

          {/* AI-Powered Farming Tips from forecast */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
            <h4 className="text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              {tr.aiPowered} — {tr.tips}
            </h4>
            <div className="space-y-3">
              {weather.forecast.slice(0, 4).map((day, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg shadow-sm">
                  <div className="flex-shrink-0 w-20 text-center">
                    <div className="font-semibold text-sm text-gray-700">{day.day}</div>
                    <div className="text-xs text-gray-500">{day.tempMax}° / {day.tempMin}°</div>
                    {day.rainfall > 0 && (
                      <Badge className="mt-1 text-xs bg-blue-100 text-blue-700">{day.rainfall}mm</Badge>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 italic">{day.condition}</p>
                    <p className="text-sm text-green-700 mt-1">→ {day.farmingAction}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
