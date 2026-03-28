import { useState, useCallback } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { FlaskConical, RefreshCw, Volume2, VolumeX, Leaf, TrendingUp, DollarSign } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Badge } from './ui/badge';
import { runFullPipeline } from '../agents/orchestrator';
import { speak, stopSpeaking, isSpeaking } from '../agents/voiceAgent';
import type { AIDecision } from '../agents/types';

interface FertilizerOptimizationProps {
  language: 'en' | 'hi' | 'mr';
}

const t = {
  en: {
    title: 'AI Fertilizer Optimizer',
    subtitle: 'Powered by Qwen AI + Soil + Weather data',
    crop: 'Crop',
    chooseCrop: 'Select crop',
    nitrogen: 'Current Nitrogen (N) kg/ha',
    phosphorus: 'Current Phosphorus (P) kg/ha',
    potassium: 'Current Potassium (K) kg/ha',
    ph: 'Soil pH',
    analyze: 'Get AI Fertilizer Plan',
    analyzing: 'AI is generating fertilizer plan…',
    plan: 'Fertilizer Plan',
    actions: 'Application Steps',
    organic: 'Organic Alternatives',
    savings: 'Cost Analysis',
    aiTag: '⚡ Qwen AI Plan',
    listen: 'Listen',
    explanation: 'Scientific Explanation',
  },
  hi: {
    title: 'AI उर्वरक अनुकूलक',
    subtitle: 'Qwen AI + मृदा + मौसम डेटा द्वारा संचालित',
    crop: 'फसल',
    chooseCrop: 'फसल चुनें',
    nitrogen: 'वर्तमान नाइट्रोजन (N) kg/ha',
    phosphorus: 'वर्तमान फॉस्फोरस (P) kg/ha',
    potassium: 'वर्तमान पोटेशियम (K) kg/ha',
    ph: 'मृदा pH',
    analyze: 'AI उर्वरक योजना प्राप्त करें',
    analyzing: 'AI उर्वरक योजना तैयार कर रहा है…',
    plan: 'उर्वरक योजना',
    actions: 'अनुप्रयोग चरण',
    organic: 'जैविक विकल्प',
    savings: 'लागत विश्लेषण',
    aiTag: '⚡ Qwen AI योजना',
    listen: 'सुनें',
    explanation: 'वैज्ञानिक व्याख्या',
  },
  mr: {
    title: 'AI खत अनुकूलक',
    subtitle: 'Qwen AI + माती + हवामान डेटाद्वारे संचालित',
    crop: 'पीक',
    chooseCrop: 'पीक निवडा',
    nitrogen: 'सध्याचा नायट्रोजन (N) kg/ha',
    phosphorus: 'सध्याचा फॉस्फरस (P) kg/ha',
    potassium: 'सध्याचा पोटॅशियम (K) kg/ha',
    ph: 'माती pH',
    analyze: 'AI खत योजना मिळवा',
    analyzing: 'AI खत योजना तयार करत आहे…',
    plan: 'खत योजना',
    actions: 'प्रयोग पायऱ्या',
    organic: 'सेंद्रिय पर्याय',
    savings: 'खर्च विश्लेषण',
    aiTag: '⚡ Qwen AI योजना',
    listen: 'ऐका',
    explanation: 'वैज्ञानिक स्पष्टीकरण',
  },
};

const CROPS = ['Rice', 'Wheat', 'Cotton', 'Corn', 'Sugarcane', 'Soyabean', 'Tomato', 'Onion', 'Potato', 'Groundnut'];

export default function FertilizerOptimization({ language }: FertilizerOptimizationProps) {
  const [crop, setCrop] = useState('');
  const [nitrogen, setNitrogen] = useState('');
  const [phosphorus, setPhosphorus] = useState('');
  const [potassium, setPotassium] = useState('');
  const [ph, setPh] = useState('');
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const tr = t[language];

  const analyze = useCallback(async () => {
    if (!crop) { toast.error('Please select a crop'); return; }
    setIsLoading(true);
    setDecision(null);

    const soilInfo = `Farmer-provided soil: N=${nitrogen || 'unknown'}, P=${phosphorus || 'unknown'}, K=${potassium || 'unknown'}, pH=${ph || 'unknown'}`;
    const result = await runFullPipeline({
      task: `Create a detailed fertilizer optimization plan for ${crop} crop. ${soilInfo}. Provide: 1) Required NPK for optimal yield, 2) Fertilizer products to use (Urea, DAP, MOP, etc.) with exact quantities per hectare and household equivalents, 3) Application schedule (basal, top-dress timings), 4) Organic alternatives (compost, FYM, green manure), 5) Cost comparison (chemical vs organic), 6) Soil health improvement roadmap.`,
      crop,
      language,
    });

    if (result.decision.data) {
      setDecision(result.decision.data);
      toast.success('Fertilizer plan ready!');
    } else {
      toast.error('Could not generate plan. Please try again.');
    }
    setIsLoading(false);
  }, [crop, nitrogen, phosphorus, potassium, ph, language]);

  const handleSpeak = () => {
    if (isSpeaking()) { stopSpeaking(); setSpeaking(false); return; }
    if (decision) {
      speak(`${decision.fertilizer ?? decision.recommendation}. ${decision.actions[0] ?? ''}`, language);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 12000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-lime-600 to-green-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1"><FlaskConical className="w-8 h-8" /><h2>{tr.title}</h2></div>
            <p className="text-lime-100 text-sm">{tr.subtitle}</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label>{tr.crop}</Label>
            <Select value={crop} onValueChange={setCrop}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={tr.chooseCrop} />
              </SelectTrigger>
              <SelectContent>
                {CROPS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{tr.ph}</Label>
            <Input type="number" min="4" max="9" step="0.1" placeholder="e.g. 6.5" value={ph} onChange={e => setPh(e.target.value)} className="mt-1" />
          </div>
        </div>

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
          disabled={isLoading || !crop}
          className="w-full bg-gradient-to-r from-lime-600 to-green-600 hover:from-lime-700 hover:to-green-700 text-white py-6"
        >
          {isLoading ? (
            <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />{tr.analyzing}</>
          ) : (
            <><FlaskConical className="w-5 h-5 mr-2" />{tr.analyze}</>
          )}
        </Button>
      </Card>

      {/* Results */}
      {decision && (
        <div className="space-y-4">
          {/* Fertilizer Plan */}
          <Card className="p-6 border-l-4 border-lime-500 bg-lime-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-gray-900 mb-2">{tr.plan}</h3>
                <p className="text-gray-700">{decision.fertilizer ?? decision.recommendation}</p>
                <div className="mt-3 flex items-center gap-2">
                  <Badge className="bg-lime-600 text-white">{tr.aiTag}</Badge>
                  {decision.confidence && <Badge variant="outline">{decision.confidence}% confidence</Badge>}
                </div>
              </div>
              <FlaskConical className="w-10 h-10 text-lime-600 ml-4 flex-shrink-0" />
            </div>
          </Card>

          {/* Application Steps */}
          <Card className="p-6 bg-gradient-to-r from-lime-50 to-green-50 border-l-4 border-green-500">
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

          {/* Organic Alternatives */}
          <Card className="p-6 border-l-4 border-emerald-400 bg-emerald-50">
            <h4 className="text-gray-900 mb-2 flex items-center gap-2"><Leaf className="w-5 h-5 text-emerald-600" />{tr.organic}</h4>
            <p className="text-gray-700">{decision.explanation}</p>
          </Card>

          {/* Full Explanation */}
          {decision.recommendation && (
            <Card className="p-6 bg-blue-50 border-l-4 border-blue-400">
              <h4 className="text-blue-900 mb-2">🔬 {tr.explanation}</h4>
              <p className="text-blue-800 text-sm">{decision.recommendation}</p>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
