import { useState } from 'react';
import { Sprout, Cloud, Bug, FlaskConical, TrendingUp, Droplets, LayoutDashboard, User, Menu, X } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CropRecommendation from './components/CropRecommendation';
import YieldForecasting from './components/YieldForecasting';
import PestPrediction from './components/PestPrediction';
import FertilizerOptimization from './components/FertilizerOptimization';
import IotMonitoring from './components/IotMonitoring';
import WeatherInsights from './components/WeatherInsights';
import AuthPage from './components/AuthPage';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');

  const translations = {
    en: {
      appName: 'AgroVision',
      dashboard: 'Dashboard',
      cropRec: 'Crop Recommendation',
      yieldForecast: 'Yield Forecasting',
      pestPrediction: 'Pest Prediction',
      fertilizer: 'Fertilizer Optimizer',
      iotMonitoring: 'IoT Monitoring',
      weather: 'Weather Insights',
      logout: 'Logout'
    },
    hi: {
      appName: 'एग्रोविज़न',
      dashboard: 'डैशबोर्ड',
      cropRec: 'फसल सिफारिश',
      yieldForecast: 'उपज पूर्वानुमान',
      pestPrediction: 'कीट पूर्वानुमान',
      fertilizer: 'उर्वरक अनुकूलक',
      iotMonitoring: 'IoT निगरानी',
      weather: 'मौसम अंतर्दृष्टि',
      logout: 'लॉगआउट'
    },
    mr: {
      appName: 'एग्रोव्हिजन',
      dashboard: 'डॅशबोर्ड',
      cropRec: 'पीक शिफारस',
      yieldForecast: 'उत्पन्न अंदाज',
      pestPrediction: 'कीटक अंदाज',
      fertilizer: 'खत अनुकूलक',
      iotMonitoring: 'IoT निरीक्षण',
      weather: 'हवामान माहिती',
      logout: 'बाहेर पडा'
    }
  };

  const t = translations[language];

  const menuItems = [
    { id: 'dashboard', name: t.dashboard, icon: LayoutDashboard },
    { id: 'crop', name: t.cropRec, icon: Sprout },
    { id: 'yield', name: t.yieldForecast, icon: TrendingUp },
    { id: 'pest', name: t.pestPrediction, icon: Bug },
    { id: 'fertilizer', name: t.fertilizer, icon: FlaskConical },
    { id: 'iot', name: t.iotMonitoring, icon: Droplets },
    { id: 'weather', name: t.weather, icon: Cloud },
  ];

  const handleLogin = (name: string, profile?: any) => {
    setUserName(name);
    setUserProfile(profile || null);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserName('');
    setUserProfile(null);
    setActiveTab('dashboard');
  };

  if (!isAuthenticated) {
    return <AuthPage onLogin={handleLogin} language={language} setLanguage={setLanguage} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard userName={userName} language={language} userProfile={userProfile} />;
      case 'crop':
        return <CropRecommendation language={language} />;
      case 'yield':
        return <YieldForecasting language={language} />;
      case 'pest':
        return <PestPrediction language={language} />;
      case 'fertilizer':
        return <FertilizerOptimization language={language} />;
      case 'iot':
        return <IotMonitoring language={language} />;
      case 'weather':
        return <WeatherInsights language={language} />;
      default:
        return <Dashboard userName={userName} language={language} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-2 rounded-lg">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-green-900">{t.appName}</h1>
                <p className="text-green-600 text-sm">Smart & Climate-Resilient Farming</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
                className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>

              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-lg">
                  <User className="w-5 h-5 text-green-600" />
                  <span className="text-green-900">{userName}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  {t.logout}
                </button>
              </div>

              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-2 mb-4 pb-4 border-b">
              <User className="w-5 h-5 text-green-600" />
              <span className="text-green-900">{userName}</span>
            </div>
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  activeTab === item.id
                    ? 'bg-green-600 text-white'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </button>
            ))}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors mt-4"
            >
              {t.logout}
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden md:block w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-lg p-4 sticky top-8">
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
                      activeTab === item.id
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main Content Area */}
          <main className="flex-1 min-w-0">
            {renderContent()}
          </main>
        </div>
      </div>

      <Toaster />
    </div>
  );
}
