import { useEffect, useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Sprout, TrendingUp, Bug, Droplets, ThermometerSun, Wind, CloudRain, AlertTriangle, Calendar as CalendarIcon, CheckCircle, Leaf, Clock } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';

interface DashboardProps {
  userName: string;
  language: 'en' | 'hi' | 'mr';
  userProfile?: any;
}

interface ActionCard {
  id: string;
  type: 'irrigation' | 'pest' | 'fertilizer' | 'soiltest' | 'harvest';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  field: string;
  icon: any;
  color: string;
  dueDate?: Date;
  completed?: boolean;
}

interface CalendarTask {
  id: string;
  field: string;
  task: string;
  date: Date;
  type: string;
  completed: boolean;
}

export default function Dashboard({ userName, language, userProfile }: DashboardProps) {
  const [sensorData, setSensorData] = useState({
    soilMoisture: 0,
    temperature: 0,
    humidity: 0,
  });

  const [actionCards, setActionCards] = useState<ActionCard[]>([]);
  const [calendarTasks, setCalendarTasks] = useState<CalendarTask[]>([]);
  const [sustainability, setSustainability] = useState({
    waterSaved: 0,
    soilHealthDelta: 0,
    carbonSequestered: 0,
  });

  const translations = {
    en: {
      welcome: 'Welcome back',
      overview: 'Farm Overview',
      quickStats: 'Quick Statistics',
      totalArea: 'Total Farm Area',
      hectares: 'Hectares',
      activeCrops: 'Active Crops',
      crops: 'Crops',
      yieldThisSeason: 'Yield This Season',
      tons: 'Tons',
      waterSaved: 'Water Saved',
      liters: 'Liters',
      realTimeSensors: 'Real-time Sensor Data',
      soilMoisture: 'Soil Moisture',
      temperature: 'Temperature',
      humidity: 'Humidity',
      yieldTrend: 'Yield Trend (Last 6 Months)',
      cropDistribution: 'Current Crop Distribution',
      alerts: 'Active Alerts',
      pestAlert: 'High pest risk detected for wheat crops',
      irrigationAlert: 'Irrigation recommended for Field A',
      weatherAlert: 'Heavy rainfall expected in 48 hours',
      actionCards: 'Recommended Actions',
      farmCalendar: 'Farm Calendar',
      sustainabilityScore: 'Sustainability Score',
      soilHealth: 'Soil Health Change',
      carbonSeq: 'Carbon Sequestered',
      kgCO2e: 'kg CO₂e',
      markDone: 'Mark Done',
      schedule: 'Schedule',
      next3Tasks: 'Next 3 Scheduled Tasks',
      noTasks: 'No upcoming tasks',
      highPriority: 'High Priority',
      mediumPriority: 'Medium Priority',
      lowPriority: 'Low Priority',
      indexPoints: 'index points',
      completedAt: 'Completed at',
    },
    hi: {
      welcome: 'वापस स्वागत है',
      overview: 'खेत का अवलोकन',
      quickStats: 'त्वरित आंकड़े',
      totalArea: 'कुल खेत क्षेत्र',
      hectares: 'हेक्टेयर',
      activeCrops: 'सक्रिय फसलें',
      crops: 'फसलें',
      yieldThisSeason: 'इस मौसम की उपज',
      tons: 'टन',
      waterSaved: 'बचाया गया पानी',
      liters: 'लीटर',
      realTimeSensors: 'वास्तविक समय सेंसर डेटा',
      soilMoisture: 'मिट्टी की नमी',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      yieldTrend: 'उपज प्रवृत्ति (पिछले 6 महीने)',
      cropDistribution: 'वर्तमान फसल वितरण',
      alerts: 'सक्रिय अलर्ट',
      pestAlert: 'गेहूं की फसलों के लिए उच्च कीट जोखिम का पता चला',
      irrigationAlert: 'खेत A के लिए सिंचाई की सिफारिश की गई',
      weatherAlert: '48 घंटों में भारी बारिश की उम्मीद',
      actionCards: 'अनुशंसित कार्य',
      farmCalendar: 'खेत कैलेंडर',
      sustainabilityScore: 'स्थिरता स्कोर',
      soilHealth: 'मिट्टी स्वास्थ्य परिवर्तन',
      carbonSeq: 'कार्बन संग्रहीत',
      kgCO2e: 'किग्रा CO₂e',
      markDone: 'पूर्ण चिह्नित करें',
      schedule: 'अनुसूची',
      next3Tasks: 'अगले 3 निर्धारित कार्य',
      noTasks: 'कोई आगामी कार्य नहीं',
      highPriority: 'उच्च प्राथमिकता',
      mediumPriority: 'मध्यम प्राथमिकता',
      lowPriority: 'कम प्राथमिकता',
      indexPoints: 'सूचकांक अंक',
      completedAt: 'पूर्ण किया गया',
    },
    mr: {
      welcome: 'परत स्वागत आहे',
      overview: 'शेताचे विहंगावलोकन',
      quickStats: 'जलद आकडेवारी',
      totalArea: 'एकूण शेत क्षेत्र',
      hectares: 'हेक्टर',
      activeCrops: 'सक्रिय पिके',
      crops: 'पिके',
      yieldThisSeason: 'या हंगामाचे उत्पन्न',
      tons: 'टन',
      waterSaved: 'वाचवलेले पाणी',
      liters: 'लिटर',
      realTimeSensors: 'रिअल-टाइम सेन्सर डेटा',
      soilMoisture: 'मातीची ओलावा',
      temperature: 'तापमान',
      humidity: 'आर्द्रता',
      yieldTrend: 'उत्पन्न कल (गेली 6 महिने)',
      cropDistribution: 'सध्याचे पीक वितरण',
      alerts: 'सक्रिय सूचना',
      pestAlert: 'गव्हाच्या पिकांसाठी उच्च कीटक धोका आढळला',
      irrigationAlert: 'शेत A साठी सिंचनाची शिफारस केली',
      weatherAlert: '48 तासांत मुसळधार पाऊस अपेक्षित',
      actionCards: 'शिफारस केलेल्या कृती',
      farmCalendar: 'शेत कॅलेंडर',
      sustainabilityScore: 'स्थिरता गुण',
      soilHealth: 'माती आरोग्य बदल',
      carbonSeq: 'कार्बन साठवले',
      kgCO2e: 'किग्रॅ CO₂e',
      markDone: 'पूर्ण म्हणून चिन्हांकित करा',
      schedule: 'वेळापत्रक',
      next3Tasks: 'पुढील 3 नियोजित कार्ये',
      noTasks: 'कोणतीही आगामी कार्ये नाहीत',
      highPriority: 'उच्च प्राथमिकता',
      mediumPriority: 'मध्यम प्राथमिकता',
      lowPriority: 'कमी प्राथमिकता',
      indexPoints: 'निर्देशांक गुण',
      completedAt: 'पूर्ण केले',
    }
  };

  const t = translations[language];

  // Load persisted data from localStorage
  useEffect(() => {
    const savedTasks = localStorage.getItem('agrovision_tasks');
    if (savedTasks) {
      const tasks = JSON.parse(savedTasks).map((task: any) => ({
        ...task,
        date: new Date(task.date)
      }));
      setCalendarTasks(tasks);
    }

    const savedSustainability = localStorage.getItem('agrovision_sustainability');
    if (savedSustainability) {
      setSustainability(JSON.parse(savedSustainability));
    } else {
      // Initialize with some baseline values
      setSustainability({
        waterSaved: 12500,
        soilHealthDelta: 5,
        carbonSequestered: 145,
      });
    }
  }, []);

  // Simulate real-time sensor data updates
  useEffect(() => {
    const updateSensorData = () => {
      setSensorData({
        soilMoisture: Math.floor(Math.random() * (70 - 35) + 35),
        temperature: Math.floor(Math.random() * (35 - 20) + 20),
        humidity: Math.floor(Math.random() * (75 - 50) + 50),
      });
    };

    updateSensorData();
    const interval = setInterval(updateSensorData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Generate action cards based on sensor data and conditions
  // Use a separate effect with debouncing to prevent constant updates
  useEffect(() => {
    const checkAndUpdateActions = () => {
      const newCards: ActionCard[] = [];

      // Check if irrigation action already exists
      const hasIrrigationCard = actionCards.some(card => card.type === 'irrigation');
      
      // Irrigation action if soil moisture is low
      if (sensorData.soilMoisture < 45 && !hasIrrigationCard) {
        newCards.push({
          id: 'irrigation-north-field',
          type: 'irrigation',
          priority: 'high',
          title: 'Irrigate North Field',
          description: `Soil moisture at ${sensorData.soilMoisture}% - below optimal range. Recommend 2-hour irrigation cycle.`,
          field: 'North Field',
          icon: Droplets,
          color: 'from-blue-500 to-cyan-500',
        });
      }

      // Check if pest action already exists
      const hasPestCard = actionCards.some(card => card.type === 'pest');
      
      // Pest action based on conditions
      if (sensorData.temperature > 28 && sensorData.humidity > 65 && !hasPestCard) {
        newCards.push({
          id: 'pest-wheat-field',
          type: 'pest',
          priority: 'medium',
          title: 'Apply Neem Spray',
          description: 'High temperature and humidity detected. Risk of aphid infestation. Apply neem-based spray early morning.',
          field: 'Wheat Field',
          icon: Bug,
          color: 'from-orange-500 to-red-500',
        });
      }

      // Check if soil test action already exists
      const hasSoilTestCard = actionCards.some(card => card.type === 'soiltest');
      
      // Soil test reminder
      const lastSoilTest = localStorage.getItem('last_soil_test');
      const monthsSinceTest = lastSoilTest 
        ? (Date.now() - new Date(lastSoilTest).getTime()) / (1000 * 60 * 60 * 24 * 30)
        : 6;
      
      if ((monthsSinceTest > 6 || !lastSoilTest) && !hasSoilTestCard) {
        newCards.push({
          id: 'soiltest-all-fields',
          type: 'soiltest',
          priority: 'medium',
          title: 'Schedule Soil Test',
          description: 'Last soil test was over 6 months ago. Schedule new test for accurate nutrient recommendations.',
          field: 'All Fields',
          icon: Leaf,
          color: 'from-green-500 to-emerald-500',
        });
      }

      // Only update if there are new cards to add
      if (newCards.length > 0) {
        setActionCards(prev => {
          // Merge existing cards with new ones, avoiding duplicates
          const existingIds = new Set(prev.map(card => card.id));
          const cardsToAdd = newCards.filter(card => !existingIds.has(card.id));
          return [...prev, ...cardsToAdd].slice(0, 3);
        });
      }
    };

    // Only check every 10 seconds instead of every sensor update
    const timer = setTimeout(checkAndUpdateActions, 1000);
    return () => clearTimeout(timer);
  }, [sensorData.soilMoisture, sensorData.temperature, sensorData.humidity]);

  // Initialize calendar tasks and action cards on mount
  useEffect(() => {
    // Initialize calendar tasks if empty
    if (calendarTasks.length === 0) {
      const defaultTasks: CalendarTask[] = [
        {
          id: '1',
          field: 'North Field',
          task: 'Irrigation',
          date: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
          type: 'irrigation',
          completed: false,
        },
        {
          id: '2',
          field: 'South Field',
          task: 'Neem spray application',
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3), // 3 days
          type: 'pest',
          completed: false,
        },
        {
          id: '3',
          field: 'Wheat Field',
          task: 'Harvest preparation',
          date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
          type: 'harvest',
          completed: false,
        },
      ];
      setCalendarTasks(defaultTasks);
      localStorage.setItem('agrovision_tasks', JSON.stringify(defaultTasks));
    }

    // Initialize action cards with default set
    if (actionCards.length === 0) {
      const initialCards: ActionCard[] = [
        {
          id: 'soiltest-all-fields',
          type: 'soiltest',
          priority: 'medium',
          title: 'Schedule Soil Test',
          description: 'Last soil test was over 6 months ago. Schedule new test for accurate nutrient recommendations.',
          field: 'All Fields',
          icon: Leaf,
          color: 'from-green-500 to-emerald-500',
        },
      ];
      setActionCards(initialCards);
    }
  }, []);

  const handleMarkDone = (actionId: string) => {
    // Remove from action cards
    setActionCards(prev => prev.filter(card => card.id !== actionId));

    // Update sustainability metrics based on action type
    const action = actionCards.find(a => a.id === actionId);
    if (action) {
      const newSustainability = { ...sustainability };
      
      if (action.type === 'irrigation') {
        // Assume optimized irrigation saves 500L compared to baseline
        newSustainability.waterSaved += 500;
      } else if (action.type === 'pest') {
        // Organic pest control improves soil health slightly
        newSustainability.soilHealthDelta += 0.2;
      } else if (action.type === 'soiltest') {
        localStorage.setItem('last_soil_test', new Date().toISOString());
      }

      setSustainability(newSustainability);
      localStorage.setItem('agrovision_sustainability', JSON.stringify(newSustainability));
    }
  };

  const handleMarkTaskDone = (taskId: string) => {
    const updatedTasks = calendarTasks.map(task => 
      task.id === taskId ? { ...task, completed: true } : task
    );
    setCalendarTasks(updatedTasks);
    localStorage.setItem('agrovision_tasks', JSON.stringify(updatedTasks));

    // Update sustainability based on task completion
    const task = calendarTasks.find(t => t.id === taskId);
    if (task?.type === 'irrigation') {
      const newSustainability = { ...sustainability, waterSaved: sustainability.waterSaved + 300 };
      setSustainability(newSustainability);
      localStorage.setItem('agrovision_sustainability', JSON.stringify(newSustainability));
    }
  };

  const formatDate = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    };
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN', options);
  };

  const yieldData = [
    { month: 'Apr', yield: 45 },
    { month: 'May', yield: 52 },
    { month: 'Jun', yield: 48 },
    { month: 'Jul', yield: 61 },
    { month: 'Aug', yield: 58 },
    { month: 'Sep', yield: 67 },
  ];

  const cropDistribution = [
    { name: 'Wheat', value: 35, color: '#f59e0b' },
    { name: 'Rice', value: 25, color: '#10b981' },
    { name: 'Corn', value: 20, color: '#3b82f6' },
    { name: 'Cotton', value: 20, color: '#8b5cf6' },
  ];

  const quickStats = [
    {
      title: t.totalArea,
      value: '25',
      unit: t.hectares,
      icon: Sprout,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: t.activeCrops,
      value: '4',
      unit: t.crops,
      icon: Sprout,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: t.yieldThisSeason,
      value: '145',
      unit: t.tons,
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: t.waterSaved,
      value: (sustainability.waterSaved / 1000).toFixed(1) + 'K',
      unit: t.liters,
      icon: Droplets,
      color: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50',
      iconColor: 'text-cyan-600'
    },
  ];

  const upcomingTasks = calendarTasks
    .filter(task => !task.completed)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, 3);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-700 border-green-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
        <h2>{t.welcome}, {userName}! 🌾</h2>
        <p className="text-green-100 mt-2">{t.overview}</p>
      </div>

      {/* Quick Stats */}
      <div>
        <h3 className="text-gray-900 mb-4">{t.quickStats}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className={`${stat.bgColor} border-0 p-6 hover:shadow-lg transition-shadow`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.title}</p>
                    <div className="flex items-baseline gap-2">
                      <span className={`bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                        {stat.value}
                      </span>
                      <span className="text-gray-500 text-sm">{stat.unit}</span>
                    </div>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Action Cards */}
      {actionCards.length > 0 && (
        <div>
          <h3 className="text-gray-900 mb-4">{t.actionCards}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {actionCards.map((action) => {
              const Icon = action.icon;
              const borderColor = action.priority === 'high' 
                ? 'border-l-red-500' 
                : action.priority === 'medium' 
                ? 'border-l-yellow-500' 
                : 'border-l-green-500';
              
              return (
                <Card key={action.id} className={`p-6 border-l-4 ${borderColor} hover:shadow-lg transition-shadow`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`bg-gradient-to-r ${action.color} p-3 rounded-lg flex-shrink-0`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-gray-900 mb-2">{action.title}</h4>
                      <Badge className={getPriorityColor(action.priority)}>
                        {action.priority === 'high' ? t.highPriority : action.priority === 'medium' ? t.mediumPriority : t.lowPriority}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{action.description}</p>
                  <p className="text-gray-500 text-xs mb-4 flex items-center gap-1">
                    <span>📍</span>
                    <span>{action.field}</span>
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleMarkDone(action.id)}
                      className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                      size="sm"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      {t.markDone}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Clock className="w-4 h-4 mr-1" />
                      {t.schedule}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Farm Calendar & Sustainability */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Farm Calendar */}
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            {t.farmCalendar}
          </h3>
          <p className="text-gray-600 text-sm mb-4">{t.next3Tasks}</p>
          
          {upcomingTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">{t.noTasks}</p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-gray-900">{task.task}</h4>
                      <p className="text-gray-600 text-sm">📍 {task.field}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatDate(task.date)}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => handleMarkTaskDone(task.id)}
                    size="sm"
                    variant="outline"
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {t.markDone}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Sustainability Score */}
        <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
          <h3 className="text-gray-900 mb-4 flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            {t.sustainabilityScore}
          </h3>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-600" />
                  <span className="text-gray-700">{t.waterSaved}</span>
                </div>
                <span className="text-blue-600 text-sm">{t.liters}</span>
              </div>
              <p className="text-2xl text-blue-900">{sustainability.waterSaved.toLocaleString()}</p>
              <p className="text-xs text-gray-600 mt-1">vs. baseline irrigation</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-gray-700">{t.soilHealth}</span>
                </div>
                <span className="text-green-600 text-sm">{t.indexPoints}</span>
              </div>
              <p className="text-2xl text-green-900">+{sustainability.soilHealthDelta.toFixed(1)}</p>
              <p className="text-xs text-gray-600 mt-1">from previous baseline</p>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Leaf className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-700">{t.carbonSeq}</span>
                </div>
                <span className="text-emerald-600 text-sm">{t.kgCO2e}</span>
              </div>
              <p className="text-2xl text-emerald-900">{sustainability.carbonSequestered}</p>
              <p className="text-xs text-gray-600 mt-1">from cover crops & agroforestry</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Real-time Sensors */}
      <div>
        <h3 className="text-gray-900 mb-4">{t.realTimeSensors}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 border-0">
            <div className="flex items-center justify-between mb-4">
              <Droplets className="w-8 h-8" />
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-sm">Live</span>
              </div>
            </div>
            <h4>{t.soilMoisture}</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl">{sensorData.soilMoisture}</span>
              <span className="text-xl">%</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white p-6 border-0">
            <div className="flex items-center justify-between mb-4">
              <ThermometerSun className="w-8 h-8" />
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-sm">Live</span>
              </div>
            </div>
            <h4>{t.temperature}</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl">{sensorData.temperature}</span>
              <span className="text-xl">°C</span>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500 to-emerald-500 text-white p-6 border-0">
            <div className="flex items-center justify-between mb-4">
              <Wind className="w-8 h-8" />
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1">
                <span className="text-sm">Live</span>
              </div>
            </div>
            <h4>{t.humidity}</h4>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-4xl">{sensorData.humidity}</span>
              <span className="text-xl">%</span>
            </div>
          </Card>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Yield Trend */}
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">{t.yieldTrend}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={yieldData}>
              <defs>
                <linearGradient id="yieldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="yield" stroke="#10b981" fillOpacity={1} fill="url(#yieldGradient)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Crop Distribution */}
        <Card className="p-6">
          <h3 className="text-gray-900 mb-4">{t.cropDistribution}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cropDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {cropDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Alerts */}
      <div>
        <h3 className="text-gray-900 mb-4">{t.alerts}</h3>
        <div className="space-y-3">
          <Alert className="border-orange-200 bg-orange-50">
            <Bug className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              {t.pestAlert}
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-200 bg-blue-50">
            <Droplets className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {t.irrigationAlert}
            </AlertDescription>
          </Alert>

          <Alert className="border-cyan-200 bg-cyan-50">
            <CloudRain className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-cyan-800">
              {t.weatherAlert}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  );
}
