import { useState, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { TrendingUp, RefreshCw, Volume2, VolumeX, BarChart2, Store, Droplets } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { runFullPipeline, quickMarket } from '../agents/orchestrator';
import { speak, stopSpeaking, isSpeaking } from '../agents/voiceAgent';
import type { AIDecision, MarketPrice } from '../agents/types';

interface YieldForecastingProps {
  language: 'en' | 'hi' | 'mr';
}

const t = {
  en: {
    title: 'AI Yield Forecasting',
    subtitle: 'Powered by Qwen AI + Weather + Market prices',
    selectCrop: 'Select Crop',
    chooseCrop: 'Choose crop',
    analyze: 'Generate AI Yield Forecast',
    analyzing: 'AI is forecasting your yield…',
    forecast: 'Yield Forecast',
    actions: 'Optimization Actions',
    market: 'Market Timing Strategy',
    water: 'Water & Irrigation Forecast',
    aiTag: '⚡ Qwen AI Forecast',
    listen: 'Listen',
    explanation: 'Scientific Reasoning',
    priceChart: 'Market Price Range (₹/quintal)',
  },
  hi: {
    title: 'AI उपज पूर्वानुमान',
    subtitle: 'Qwen AI + मौसम + मंडी कीमतों द्वारा संचालित',
    selectCrop: 'फसल चुनें',
    chooseCrop: 'फसल चुनें',
    analyze: 'AI उपज पूर्वानुमान उत्पन्न करें',
    analyzing: 'AI आपकी उपज का पूर्वानुमान लगा रहा है…',
    forecast: 'उपज पूर्वानुमान',
    actions: 'अनुकूलन कार्रवाई',
    market: 'बिक्री समय रणनीति',
    water: 'जल एवं सिंचाई पूर्वानुमान',
    aiTag: '⚡ Qwen AI पूर्वानुमान',
    listen: 'सुनें',
    explanation: 'वैज्ञानिक तर्क',
    priceChart: 'मंडी मूल्य श्रेणी (₹/क्विंटल)',
  },
  mr: {
    title: 'AI उत्पन्न अंदाज',
    subtitle: 'Qwen AI + हवामान + मंडी किंमतींद्वारे संचालित',
    selectCrop: 'पीक निवडा',
    chooseCrop: 'पीक निवडा',
    analyze: 'AI उत्पन्न अंदाज तयार करा',
    analyzing: 'AI तुमचे उत्पन्न अंदाज करत आहे…',
    forecast: 'उत्पन्न अंदाज',
    actions: 'ऑप्टिमायझेशन कृती',
    market: 'विक्री वेळ धोरण',
    water: 'पाणी आणि सिंचन अंदाज',
    aiTag: '⚡ Qwen AI अंदाज',
    listen: 'ऐका',
    explanation: 'वैज्ञानिक तर्क',
    priceChart: 'मंडी किंमत श्रेणी (₹/क्विंटल)',
  },
};

const CROPS = ['Rice', 'Wheat', 'Cotton', 'Corn', 'Sugarcane', 'Soyabean', 'Tomato', 'Onion', 'Potato', 'Groundnut'];

export default function YieldForecasting({ language }: YieldForecastingProps) {
  const [crop, setCrop] = useState('');
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const tr = t[language];

  const analyze = useCallback(async () => {
    if (!crop) { toast.error('Please select a crop'); return; }
    setIsLoading(true);
    setDecision(null);

    const result = await runFullPipeline({
      task: `Forecast yield for ${crop} crop in India. Provide min/average/max yield in quintals/acre, confidence percentage, top 3 factors affecting yield (weather, soil, water), contingency plans for drought/flood/pest risk, best time to sell based on market trends, and water use recommendations.`,
      crop,
      language,
      commodity: crop,
    });

    if (result.decision.data) {
      setDecision(result.decision.data);
      const mktRes = await quickMarket(crop);
      if (mktRes.data?.prices) setMarketPrices(mktRes.data.prices.slice(0, 8));
      toast.success('Yield forecast ready!');
    } else {
      toast.error('Could not generate forecast. Please try again.');
    }
    setIsLoading(false);
  }, [crop, language]);

  const handleSpeak = () => {
    if (isSpeaking()) { stopSpeaking(); setSpeaking(false); return; }
    if (decision) {
      speak(`${decision.yieldForecast ?? decision.recommendation}. ${decision.sellingStrategy ?? ''}`, language);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 12000);
    }
  };

  const priceChartData = marketPrices.slice(0, 6).map(p => ({
    name: p.market.slice(0, 8),
    min: p.minPrice,
    modal: p.modalPrice,
    max: p.maxPrice,
  }));

  const riskColorClass = decision?.risk_level === 'high' || decision?.risk_level === 'critical'
    ? 'border-red-500 bg-red-50'
    : decision?.risk_level === 'medium'
    ? 'border-yellow-500 bg-yellow-50'
    : 'border-green-500 bg-green-50';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1"><TrendingUp className="w-8 h-8" /><h2>{tr.title}</h2></div>
            <p className="text-purple-100 text-sm">{tr.subtitle}</p>
          </div>
          {decision && (
            <button onClick={handleSpeak} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
              {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {tr.listen}
            </button>
          )}
        </div>
      </div>

      {/* Form */}
      <Card className="p-6">
        <div className="mb-6">
          <Label>{tr.selectCrop}</Label>
          <Select value={crop} onValueChange={setCrop}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder={tr.chooseCrop} />
            </SelectTrigger>
            <SelectContent>
              {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={analyze}
          disabled={isLoading || !crop}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-6"
        >
          {isLoading ? (
            <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />{tr.analyzing}</>
          ) : (
            <><TrendingUp className="w-5 h-5 mr-2" />{tr.analyze}</>
          )}
        </Button>
      </Card>

      {/* Results */}
      {decision && (
        <div className="space-y-4">
          {/* Forecast Summary */}
          <Card className={`p-6 border-l-4 ${riskColorClass}`}>
            <h3 className="text-gray-900 mb-2">{tr.forecast}</h3>
            <p className="text-gray-700 text-lg">{decision.yieldForecast ?? decision.recommendation}</p>
            <div className="mt-3 flex items-center gap-3">
              <Badge className="bg-purple-500 text-white">{tr.aiTag}</Badge>
              {decision.confidence && <Badge variant="outline">{decision.confidence}% confidence</Badge>}
            </div>
          </Card>

          {/* Optimization Actions */}
          <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-500">
            <h4 className="text-gray-900 mb-4 flex items-center gap-2"><BarChart2 className="w-5 h-5 text-purple-600" />{tr.actions}</h4>
            <ol className="space-y-2">
              {decision.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-gray-700">{a}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* Water / Irrigation */}
          {decision.irrigation && (
            <Card className="p-6 border-l-4 border-cyan-400 bg-cyan-50">
              <h4 className="text-gray-900 mb-2 flex items-center gap-2"><Droplets className="w-5 h-5 text-cyan-600" />{tr.water}</h4>
              <p className="text-gray-700">{decision.irrigation}</p>
            </Card>
          )}

          {/* Selling Strategy */}
          {decision.sellingStrategy && (
            <Card className="p-6 border-l-4 border-orange-400 bg-orange-50">
              <h4 className="text-gray-900 mb-2 flex items-center gap-2"><Store className="w-5 h-5 text-orange-600" />{tr.market}</h4>
              <p className="text-gray-700">{decision.sellingStrategy}</p>
            </Card>
          )}

          {/* Price Chart */}
          {priceChartData.length > 0 && (
            <Card className="p-6">
              <h4 className="text-gray-900 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" />{tr.priceChart}</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={priceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip formatter={(v: any) => `₹${v}`} />
                  <Bar dataKey="min" fill="#ef4444" name="Min ₹" />
                  <Bar dataKey="modal" fill="#22c55e" name="Modal ₹" />
                  <Bar dataKey="max" fill="#3b82f6" name="Max ₹" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          )}

          {/* Explanation */}
          {decision.explanation && (
            <Card className="p-6 bg-blue-50 border-l-4 border-blue-400">
              <h4 className="text-blue-900 mb-2">🔬 {tr.explanation}</h4>
              <p className="text-blue-800 text-sm">{decision.explanation}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
