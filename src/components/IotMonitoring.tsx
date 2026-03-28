import { useEffect, useState, useCallback } from 'react';
import { Card } from './ui/card';
import { Droplets, ThermometerSun, Wind, CloudRain, Zap, Activity, RefreshCw, AlertTriangle, Volume2, VolumeX, Wifi, WifiOff } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Alert, AlertDescription } from './ui/alert';
import { quickSoil, quickWeather } from '../agents/orchestrator';
import { speak, stopSpeaking, isSpeaking } from '../agents/voiceAgent';
import type { SoilData, WeatherData } from '../agents/types';

interface IotMonitoringProps {
  language: 'en' | 'hi' | 'mr';
}

const t = {
  en: {
    title: 'IoT Monitoring System',
    subtitle: 'Live sensor data from AgroMonitoring + Visual Crossing APIs',
    liveData: 'Live Sensor Readings',
    soilMoisture: 'Soil Moisture',
    temperature: 'Air Temperature',
    humidity: 'Humidity',
    rainfall: 'Rainfall Today',
    soilPh: 'Soil Temp (10cm)',
    lightIntensity: 'Surface Temp',
    trend24h: '24-Hour Trend (Session)',
    sensorStatus: 'Data Sources',
    allOnline: 'APIs connected and live',
    offline: 'Offline — showing cached data',
    lastUpdate: 'Last updated',
    justNow: 'Just now',
    recommendations: 'AI Smart Recommendations',
    irrigate: 'Soil moisture is low. Irrigation required within 24 hours.',
    overwater: 'Soil is saturated. Pause irrigation to prevent root rot.',
    goodConditions: 'Temperature and humidity levels are optimal for crop growth.',
    phCheck: 'Soil temperature is elevated. Monitor for heat stress.',
    refresh: 'Refresh',
    listen: 'Listen',
    powered: '⚡ Powered by AgroMonitoring API',
  },
  hi: {
    title: 'IoT निगरानी प्रणाली',
    subtitle: 'AgroMonitoring + Visual Crossing APIs से लाइव डेटा',
    liveData: 'लाइव सेंसर रीडिंग',
    soilMoisture: 'मिट्टी की नमी',
    temperature: 'वायु तापमान',
    humidity: 'आर्द्रता',
    rainfall: 'आज बारिश',
    soilPh: 'मिट्टी तापमान (10cm)',
    lightIntensity: 'सतह तापमान',
    trend24h: '24 घंटे का रुझान',
    sensorStatus: 'डेटा स्रोत',
    allOnline: 'API जुड़े हैं',
    offline: 'ऑफलाइन — कैश डेटा दिखा रहा है',
    lastUpdate: 'अंतिम अपडेट',
    justNow: 'अभी',
    recommendations: 'AI स्मार्ट सिफारिशें',
    irrigate: 'मिट्टी की नमी कम है। 24 घंटे में सिंचाई करें।',
    overwater: 'मिट्टी संतृप्त है। सिंचाई रोकें।',
    goodConditions: 'तापमान और आर्द्रता का स्तर इष्टतम है।',
    phCheck: 'मिट्टी का तापमान बढ़ा हुआ है। गर्मी देखें।',
    refresh: 'ताज़ा करें',
    listen: 'सुनें',
    powered: '⚡ AgroMonitoring API द्वारा संचालित',
  },
  mr: {
    title: 'IoT निरीक्षण प्रणाली',
    subtitle: 'AgroMonitoring + Visual Crossing APIs कडून थेट डेटा',
    liveData: 'लाइव्ह सेन्सर रीडिंग',
    soilMoisture: 'मातीची ओलावा',
    temperature: 'हवा तापमान',
    humidity: 'आर्द्रता',
    rainfall: 'आज पाऊस',
    soilPh: 'माती तापमान (10cm)',
    lightIntensity: 'पृष्ठभाग तापमान',
    trend24h: '24 तासांचा कल',
    sensorStatus: 'डेटा स्रोत',
    allOnline: 'API जोडलेले आणि थेट',
    offline: 'ऑफलाइन — कॅश्ड डेटा',
    lastUpdate: 'शेवटचे अपडेट',
    justNow: 'आत्ताच',
    recommendations: 'AI स्मार्ट शिफारसी',
    irrigate: 'मातीची ओलावा कमी आहे. सिंचन करा.',
    overwater: 'माती भिजलेली आहे. सिंचन थांबवा.',
    goodConditions: 'तापमान आणि आर्द्रता इष्टतम आहे.',
    phCheck: 'मातीचे तापमान जास्त आहे. उष्णता तणाव पहा.',
    refresh: 'ताजेतवाने करा',
    listen: 'ऐका',
    powered: '⚡ AgroMonitoring API द्वारे संचालित',
  },
};

interface SensorReading {
  time: string;
  moisture: number;
  temp: number;
  humidity: number;
  soilSurfaceTemp: number;
}

export default function IotMonitoring({ language }: IotMonitoringProps) {
  const [soil, setSoil] = useState<SoilData | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [history, setHistory] = useState<SensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [speaking, setSpeaking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const tr = t[language];

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [soilRes, weatherRes] = await Promise.all([quickSoil(), quickWeather()]);
    let hasError = false;
    if (soilRes.data) setSoil(soilRes.data); else hasError = true;
    if (weatherRes.data) setWeather(weatherRes.data); else hasError = true;
    if (hasError && !soilRes.data && !weatherRes.data) {
      setError('Could not load sensor data. Check API keys or internet connection.');
    }
    setLastUpdated(new Date());
    setLoading(false);

    // Append to history
    if (soilRes.data && weatherRes.data) {
      const reading: SensorReading = {
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        moisture: soilRes.data.moisturePercent,
        temp: weatherRes.data.temperature,
        humidity: weatherRes.data.humidity,
        soilSurfaceTemp: soilRes.data.surfaceTemp,
      };
      setHistory(h => [...h, reading].slice(-20));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 15 min
  useEffect(() => {
    const interval = setInterval(loadData, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleSpeak = () => {
    if (isSpeaking()) { stopSpeaking(); setSpeaking(false); return; }
    if (soil && weather) {
      const msg = `Soil moisture is ${soil.moisturePercent} percent. Status: ${soil.status}. Air temperature is ${weather.temperature} degrees. Humidity ${weather.humidity} percent. ${soil.irrigationNeeded ? 'Irrigation is needed.' : soil.overWaterRisk ? 'Overwatering risk. Stop irrigation.' : 'Conditions are good.'}`;
      speak(msg, language);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 8000);
    }
  };

  const sensors = soil && weather ? [
    { title: tr.soilMoisture, value: soil.moisturePercent, unit: '%', icon: Droplets, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-50', optimal: [30, 60], statusColor: soil.status === 'optimal' ? 'bg-green-500' : 'bg-orange-500' },
    { title: tr.temperature, value: weather.temperature, unit: '°C', icon: ThermometerSun, color: 'from-orange-500 to-red-500', bgColor: 'bg-orange-50', optimal: [15, 35], statusColor: weather.temperature >= 15 && weather.temperature <= 35 ? 'bg-green-500' : 'bg-orange-500' },
    { title: tr.humidity, value: weather.humidity, unit: '%', icon: Wind, color: 'from-teal-500 to-emerald-500', bgColor: 'bg-teal-50', optimal: [40, 80], statusColor: weather.humidity >= 40 && weather.humidity <= 80 ? 'bg-green-500' : 'bg-orange-500' },
    { title: tr.rainfall, value: weather.rainfall, unit: 'mm', icon: CloudRain, color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-50', optimal: [0, 50], statusColor: 'bg-green-500' },
    { title: tr.soilPh, value: soil.deepTemp, unit: '°C', icon: Activity, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-50', optimal: [10, 30], statusColor: soil.deepTemp >= 10 && soil.deepTemp <= 30 ? 'bg-green-500' : 'bg-orange-500' },
    { title: tr.lightIntensity, value: soil.surfaceTemp, unit: '°C', icon: Zap, color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-50', optimal: [10, 35], statusColor: soil.surfaceTemp >= 10 && soil.surfaceTemp <= 35 ? 'bg-green-500' : 'bg-orange-500' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Activity className="w-8 h-8" />
              <h2>{tr.title}</h2>
            </div>
            <p className="text-blue-100 text-sm">{tr.subtitle}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSpeak} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
              {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {tr.listen}
            </button>
            <button onClick={loadData} disabled={loading} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {tr.refresh}
            </button>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <Alert className={`${isOnline ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}`}>
        {isOnline ? <Wifi className="h-4 w-4 text-green-600" /> : <WifiOff className="h-4 w-4 text-yellow-600" />}
        <AlertDescription className={isOnline ? 'text-green-800' : 'text-yellow-800'}>
          <span className="flex items-center gap-2">
            <span className={`w-2 h-2 ${isOnline ? 'bg-green-500' : 'bg-yellow-500'} rounded-full animate-pulse`} />
            {tr.sensorStatus}: {isOnline ? tr.allOnline : tr.offline}
            {lastUpdated && ` • ${tr.lastUpdate}: ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
          </span>
        </AlertDescription>
      </Alert>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Fetching live sensor data…</p>
          </div>
        </div>
      )}

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Sensor Cards */}
      {!loading && sensors.length > 0 && (
        <>
          <div>
            <h3 className="text-gray-900 mb-4">{tr.liveData}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sensors.map((sensor, i) => {
                const Icon = sensor.icon;
                const isOptimal = sensor.value >= sensor.optimal[0] && sensor.value <= sensor.optimal[1];
                return (
                  <Card key={i} className={`${sensor.bgColor} border-0 p-6 hover:shadow-lg transition-shadow`}>
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${sensor.color}`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 ${sensor.statusColor} rounded-full animate-pulse`} />
                        <span className="text-xs text-gray-600">Live</span>
                      </div>
                    </div>
                    <h4 className="text-gray-700 text-sm mb-2">{sensor.title}</h4>
                    <div className={`flex items-baseline gap-1 bg-gradient-to-r ${sensor.color} bg-clip-text`}>
                      <span className="text-4xl font-bold text-transparent bg-gradient-to-r from-gray-700 to-gray-900">{sensor.value}</span>
                      <span className="text-gray-500 text-xl">{sensor.unit}</span>
                    </div>
                    {!isOptimal && (
                      <p className="text-xs text-orange-600 mt-2">
                        Optimal: {sensor.optimal[0]}–{sensor.optimal[1]} {sensor.unit}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2 text-right">{tr.powered}</p>
          </div>

          {/* Historical Trends */}
          {history.length > 1 && (
            <div>
              <h3 className="text-gray-900 mb-4">{tr.trend24h}</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                  <h4 className="text-gray-900 mb-4">{tr.soilMoisture}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={history}>
                      <defs>
                        <linearGradient id="moistGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="moisture" stroke="#3b82f6" fill="url(#moistGrad)" name="Moisture %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-6">
                  <h4 className="text-gray-900 mb-4">{tr.temperature} & {tr.humidity}</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={history}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="temp" stroke="#f97316" strokeWidth={2} name="Temp °C" />
                      <Line type="monotone" dataKey="humidity" stroke="#14b8a6" strokeWidth={2} name="Humidity %" />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
          )}

          {/* Smart Recommendations */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
            <h4 className="text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              {tr.recommendations}
            </h4>
            <div className="space-y-3">
              {soil?.irrigationNeeded && (
                <Alert className="border-orange-200 bg-orange-50">
                  <Droplets className="h-4 w-4 text-orange-600" />
                  <AlertDescription className="text-orange-800">{tr.irrigate}</AlertDescription>
                </Alert>
              )}
              {soil?.overWaterRisk && (
                <Alert className="border-blue-200 bg-blue-50">
                  <CloudRain className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">{tr.overwater}</AlertDescription>
                </Alert>
              )}
              {!soil?.irrigationNeeded && !soil?.overWaterRisk && weather && weather.temperature >= 15 && weather.temperature <= 35 && (
                <Alert className="border-green-200 bg-green-50">
                  <ThermometerSun className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{tr.goodConditions}</AlertDescription>
                </Alert>
              )}
              {soil && soil.surfaceTemp > 35 && (
                <Alert className="border-red-200 bg-red-50">
                  <Activity className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{tr.phCheck}</AlertDescription>
                </Alert>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
