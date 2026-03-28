import { useState, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Sprout, TrendingUp, Store, RefreshCw, Volume2, VolumeX, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { runFullPipeline } from '../agents/orchestrator';
import { quickMarket } from '../agents/orchestrator';
import { speak, stopSpeaking, isSpeaking } from '../agents/voiceAgent';
import type { AIDecision, MarketPrice } from '../agents/types';

interface CropRecommendationProps {
  language: 'en' | 'hi' | 'mr';
}

const t = {
  en: {
    title: 'AI Crop Recommendation',
    subtitle: 'Powered by Qwen AI + Soil + Weather + Live Market Prices',
    soilNpk: 'Soil NPK Values (optional)',
    nitrogen: 'Nitrogen (N)',
    phosphorus: 'Phosphorus (P)',
    potassium: 'Potassium (K)',
    ph: 'Soil pH',
    season: 'Season',
    kharif: 'Kharif (June–Oct)',
    rabi: 'Rabi (Nov–Mar)',
    zaid: 'Zaid (Mar–June)',
    analyze: 'Get AI Crop Recommendation',
    analyzing: 'AI is analyzing your farm…',
    crop: 'Recommended Crop',
    actions: 'Crop Plan Steps',
    marketPrices: 'Live Market Prices',
    selling: 'Selling Strategy',
    noMarket: 'Market data not available',
    aiTag: '⚡ Qwen AI Recommendation',
    listen: 'Listen',
    explanation: 'Scientific Explanation',
  },
  hi: {
    title: 'AI फसल सिफारिश',
    subtitle: 'Qwen AI + मृदा + मौसम + लाइव मंडी कीमतों द्वारा संचालित',
    soilNpk: 'मिट्टी NPK मान (वैकल्पिक)',
    nitrogen: 'नाइट्रोजन (N)',
    phosphorus: 'फॉस्फोरस (P)',
    potassium: 'पोटेशियम (K)',
    ph: 'मिट्टी pH',
    season: 'मौसम',
    kharif: 'खरीफ (जून–अक्टूबर)',
    rabi: 'रबी (नवंबर–मार्च)',
    zaid: 'जायद (मार्च–जून)',
    analyze: 'AI फसल सिफारिश प्राप्त करें',
    analyzing: 'AI आपके खेत का विश्लेषण कर रहा है…',
    crop: 'अनुशंसित फसल',
    actions: 'फसल योजना चरण',
    marketPrices: 'लाइव मंडी कीमतें',
    selling: 'बिक्री रणनीति',
    noMarket: 'बाजार डेटा उपलब्ध नहीं',
    aiTag: '⚡ Qwen AI सिफारिश',
    listen: 'सुनें',
    explanation: 'वैज्ञानिक व्याख्या',
  },
  mr: {
    title: 'AI पीक शिफारस',
    subtitle: 'Qwen AI + माती + हवामान + थेट मंडी किंमतींद्वारे संचालित',
    soilNpk: 'माती NPK मूल्ये (पर्यायी)',
    nitrogen: 'नायट्रोजन (N)',
    phosphorus: 'फॉस्फरस (P)',
    potassium: 'पोटॅशियम (K)',
    ph: 'माती pH',
    season: 'हंगाम',
    kharif: 'खरीप (जून–ऑक्टोबर)',
    rabi: 'रब्बी (नोव्हेंबर–मार्च)',
    zaid: 'उन्हाळी (मार्च–जून)',
    analyze: 'AI पीक शिफारस मिळवा',
    analyzing: 'AI तुमच्या शेताचे विश्लेषण करत आहे…',
    crop: 'शिफारस केलेले पीक',
    actions: 'पीक योजना पायऱ्या',
    marketPrices: 'थेट मंडी किंमती',
    selling: 'विक्री धोरण',
    noMarket: 'बाजार डेटा उपलब्ध नाही',
    aiTag: '⚡ Qwen AI शिफारस',
    listen: 'ऐका',
    explanation: 'वैज्ञानिक स्पष्टीकरण',
  },
};

export default function CropRecommendation({ language }: CropRecommendationProps) {
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [ph, setPh] = useState('');
  const [season, setSeason] = useState('kharif');
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const tr = t[language];

  const analyze = useCallback(async () => {
    setIsLoading(true);
    setDecision(null);

    const npkContext = nitrogen || phosphorus || potassium
      ? `Farmer provided soil NPK: N=${nitrogen || '?'}, P=${phosphorus || '?'}, K=${potassium || '?'}, pH=${ph || '?'}`
      : '';

    const result = await runFullPipeline({
      task: `Recommend the best crop for ${season} season in India. ${npkContext}. Consider current soil moisture, temperature, humidity, and live market prices. Provide specific variety, planting schedule, seed rate, fertilizer schedule, expected yield, and selling strategy.`,
      language,
    });

    if (result.decision.data) {
      setDecision(result.decision.data);
      // Fetch market prices for recommended crop
      const rec = result.decision.data.crop ?? result.decision.data.recommendation.split(' ')[0];
      const mktRes = await quickMarket(rec);
      if (mktRes.data?.prices) setMarketPrices(mktRes.data.prices.slice(0, 6));
      toast.success('Crop recommendation ready!');
    } else {
      toast.error('Could not get recommendation. Please try again.');
    }
    setIsLoading(false);
  }, [nitrogen, phosphorus, potassium, ph, season, language]);

  const handleSpeak = () => {
    if (isSpeaking()) { stopSpeaking(); setSpeaking(false); return; }
    if (decision) {
      speak(`${decision.recommendation}. ${decision.actions[0] ?? ''}. ${decision.sellingStrategy ?? ''}`, language);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 12000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1"><Sprout className="w-8 h-8" /><h2>{tr.title}</h2></div>
            <p className="text-green-100 text-sm">{tr.subtitle}</p>
          </div>
          {decision && (
            <button onClick={handleSpeak} className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm">
              {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              {tr.listen}
            </button>
          )}
        </div>
      </div>

      {/* Input Form */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label>{tr.season}</Label>
            <Select value={season} onValueChange={setSeason}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kharif">{tr.kharif}</SelectItem>
                <SelectItem value="rabi">{tr.rabi}</SelectItem>
                <SelectItem value="zaid">{tr.zaid}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{tr.ph}</Label>
            <Input type="number" min="4" max="9" step="0.1" placeholder="e.g. 6.5" value={ph} onChange={e => setPh(e.target.value)} className="mt-1" />
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-3">{tr.soilNpk}</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label>{tr.nitrogen}</Label>
            <Input type="number" placeholder="kg/ha" value={nitrogen} onChange={e => setNitrogen(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>{tr.phosphorus}</Label>
            <Input type="number" placeholder="kg/ha" value={phosphorus} onChange={e => setPhosphorus(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>{tr.potassium}</Label>
            <Input type="number" placeholder="kg/ha" value={potassium} onChange={e => setPotassium(e.target.value)} className="mt-1" />
          </div>
        </div>

        <Button
          onClick={analyze}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-6"
        >
          {isLoading ? (
            <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />{tr.analyzing}</>
          ) : (
            <><Sprout className="w-5 h-5 mr-2" />{tr.analyze}</>
          )}
        </Button>
      </Card>

      {/* Results */}
      {decision && (
        <div className="space-y-4">
          {/* Recommended Crop */}
          <Card className="p-6 border-l-4 border-green-500 bg-green-50">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-gray-900 mb-1">{tr.crop}</h3>
                <div className="text-3xl font-bold text-green-700 mb-2">{decision.crop ?? decision.recommendation.split('.')[0]}</div>
                <Badge className="bg-green-500 text-white">{tr.aiTag}</Badge>
                {decision.confidence && <Badge variant="outline" className="ml-2 text-xs">{decision.confidence}% confidence</Badge>}
              </div>
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
          </Card>

          {/* Full Recommendation */}
          <Card className="p-6">
            <h4 className="text-gray-900 mb-3 flex items-center gap-2"><Sprout className="w-5 h-5 text-green-600" />Recommendation</h4>
            <p className="text-gray-700">{decision.recommendation}</p>
          </Card>

          {/* Action Steps */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
            <h4 className="text-gray-900 mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-green-600" />{tr.actions}</h4>
            <ol className="space-y-2">
              {decision.actions.map((a, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">{i + 1}</span>
                  <span className="text-gray-700">{a}</span>
                </li>
              ))}
            </ol>
          </Card>

          {/* Selling Strategy */}
          {decision.sellingStrategy && (
            <Card className="p-6 border-l-4 border-orange-400 bg-orange-50">
              <h4 className="text-gray-900 mb-2 flex items-center gap-2"><Store className="w-5 h-5 text-orange-600" />{tr.selling}</h4>
              <p className="text-gray-700">{decision.sellingStrategy}</p>
            </Card>
          )}

          {/* Market Prices */}
          {marketPrices.length > 0 && (
            <Card className="p-6">
              <h4 className="text-gray-900 mb-4 flex items-center gap-2"><Store className="w-5 h-5 text-blue-600" />{tr.marketPrices}</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-gray-600">Commodity</th>
                      <th className="text-left py-2 text-gray-600">Market</th>
                      <th className="text-right py-2 text-gray-600">Min ₹</th>
                      <th className="text-right py-2 text-gray-600">Modal ₹</th>
                      <th className="text-right py-2 text-gray-600">Max ₹</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketPrices.map((p, i) => (
                      <tr key={i} className="border-b hover:bg-gray-50">
                        <td className="py-2 font-medium">{p.commodity}</td>
                        <td className="py-2 text-gray-600">{p.market}, {p.state}</td>
                        <td className="py-2 text-right text-red-600">₹{p.minPrice}</td>
                        <td className="py-2 text-right font-bold text-green-700">₹{p.modalPrice}</td>
                        <td className="py-2 text-right text-blue-600">₹{p.maxPrice}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
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
