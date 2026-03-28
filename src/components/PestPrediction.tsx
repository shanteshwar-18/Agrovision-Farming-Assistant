import { useState, useCallback, ChangeEvent } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Bug, AlertTriangle, Shield, RefreshCw, Volume2, VolumeX, Upload, X, CheckCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Alert, AlertDescription } from './ui/alert';
import { Badge } from './ui/badge';
import { runFullPipeline } from '../agents/orchestrator';
import { identifyPlant, fileToPreviewUrl } from '../agents/visionAgent';
import { speak, stopSpeaking, isSpeaking } from '../agents/voiceAgent';
import type { AIDecision } from '../agents/types';

interface PestPredictionProps {
  language: 'en' | 'hi' | 'mr';
}

const t = {
  en: {
    title: 'Pest Prediction & Alert System',
    subtitle: 'AI-powered pest risk analysis using Qwen + real environmental data',
    selectCrop: 'Select Crop',
    chooseCrop: 'Choose your crop',
    analyzePest: 'Analyze Pest Risk with AI',
    analyzing: 'AI is analyzing your farm conditions…',
    riskLevel: 'Overall Pest Risk',
    actions: 'Recommended Actions',
    explanation: 'AI Explanation',
    highRisk: 'HIGH RISK',
    medRisk: 'MEDIUM RISK',
    lowRisk: 'LOW RISK',
    uploadImage: 'Upload Plant Image (Optional)',
    imageDetected: 'Plant Identified',
    confidence: 'Confidence',
    aiPowered: '⚡ AI Decision by Qwen',
    fallback: '⚠ Using rule-based fallback',
    listen: 'Listen',
  },
  hi: {
    title: 'कीट पूर्वानुमान और अलर्ट सिस्टम',
    subtitle: 'Qwen + वास्तविक पर्यावरण डेटा का उपयोग करके AI कीट जोखिम विश्लेषण',
    selectCrop: 'फसल चुनें',
    chooseCrop: 'अपनी फसल चुनें',
    analyzePest: 'AI से कीट जोखिम का विश्लेषण करें',
    analyzing: 'AI आपकी खेत की स्थिति का विश्लेषण कर रहा है…',
    riskLevel: 'समग्र कीट जोखिम',
    actions: 'अनुशंसित कार्रवाई',
    explanation: 'AI व्याख्या',
    highRisk: 'उच्च जोखिम',
    medRisk: 'मध्यम जोखिम',
    lowRisk: 'कम जोखिम',
    uploadImage: 'पौधे की छवि अपलोड करें (वैकल्पिक)',
    imageDetected: 'पौधा पहचाना गया',
    confidence: 'विश्वास',
    aiPowered: '⚡ Qwen द्वारा AI निर्णय',
    fallback: '⚠ नियम-आधारित फॉलबैक उपयोग हो रहा है',
    listen: 'सुनें',
  },
  mr: {
    title: 'कीटक अंदाज आणि सूचना प्रणाली',
    subtitle: 'Qwen + वास्तविक पर्यावरणीय डेटा वापरून AI कीटक धोका विश्लेषण',
    selectCrop: 'पीक निवडा',
    chooseCrop: 'तुमचे पीक निवडा',
    analyzePest: 'AI सह कीटक धोक्याचे विश्लेषण करा',
    analyzing: 'AI तुमच्या शेताच्या परिस्थितीचे विश्लेषण करत आहे…',
    riskLevel: 'एकूण कीटक धोका',
    actions: 'शिफारस केलेल्या कृती',
    explanation: 'AI स्पष्टीकरण',
    highRisk: 'उच्च धोका',
    medRisk: 'मध्यम धोका',
    lowRisk: 'कमी धोका',
    uploadImage: 'वनस्पती प्रतिमा अपलोड करा (पर्यायी)',
    imageDetected: 'वनस्पती ओळखली',
    confidence: 'विश्वास',
    aiPowered: '⚡ Qwen द्वारे AI निर्णय',
    fallback: '⚠ नियम-आधारित फॉलबॅक वापरत आहे',
    listen: 'ऐका',
  },
};

const CROPS = ['Rice', 'Wheat', 'Cotton', 'Corn', 'Sugarcane', 'Soyabean', 'Tomato', 'Onion', 'Potato', 'Groundnut'];

export default function PestPrediction({ language }: PestPredictionProps) {
  const [cropType, setCropType] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [plantId, setPlantId] = useState<{ species: string; confidence: number } | null>(null);
  const [decision, setDecision] = useState<AIDecision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFallback, setIsFallback] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const tr = t[language];

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const preview = await fileToPreviewUrl(file);
    setImagePreview(preview);
    // Identify plant
    const result = await identifyPlant(file);
    if (result.data) {
      setPlantId({ species: result.data.commonName, confidence: Math.round(result.data.confidence * 100) });
      toast.success(`Plant identified: ${result.data.commonName}`);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setPlantId(null);
  };

  const analyze = useCallback(async () => {
    if (!cropType) { toast.error('Please select a crop'); return; }
    setIsLoading(true);
    setDecision(null);
    const result = await runFullPipeline({
      task: `Analyze pest risk for ${cropType} crop. Identify specific pests likely in current conditions, their severity, and provide step-by-step treatment recommendations including organic and chemical options with dosages.`,
      crop: cropType,
      language,
      imageFile: imageFile ?? undefined,
    });
    if (result.decision.data) {
      setDecision(result.decision.data);
      setIsFallback(!!result.decision.error);
      toast.success('Pest analysis complete!');
    } else {
      toast.error('Analysis failed. Please try again.');
    }
    setIsLoading(false);
  }, [cropType, language, imageFile]);

  const handleSpeak = () => {
    if (isSpeaking()) { stopSpeaking(); setSpeaking(false); return; }
    if (decision) {
      speak(`${decision.pestAdvice ?? decision.recommendation}. ${decision.actions[0] ?? ''}`, language);
      setSpeaking(true);
      setTimeout(() => setSpeaking(false), 10000);
    }
  };

  const riskColors: Record<string, { bg: string; badge: string; border: string }> = {
    low: { bg: 'bg-green-50', badge: 'bg-green-500', border: 'border-green-500' },
    medium: { bg: 'bg-yellow-50', badge: 'bg-yellow-500', border: 'border-yellow-500' },
    high: { bg: 'bg-red-50', badge: 'bg-red-500', border: 'border-red-500' },
    critical: { bg: 'bg-red-100', badge: 'bg-red-700', border: 'border-red-700' },
  };
  const riskColor = decision ? (riskColors[decision.risk_level] ?? riskColors.low) : riskColors.low;
  const riskLabel = decision?.risk_level === 'high' || decision?.risk_level === 'critical' ? tr.highRisk : decision?.risk_level === 'medium' ? tr.medRisk : tr.lowRisk;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Bug className="w-8 h-8" />
              <h2>{tr.title}</h2>
            </div>
            <p className="text-orange-100 text-sm">{tr.subtitle}</p>
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
            <Label>{tr.selectCrop}</Label>
            <Select value={cropType} onValueChange={setCropType}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={tr.chooseCrop} />
              </SelectTrigger>
              <SelectContent>
                {CROPS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Image Upload */}
          <div>
            <Label>{tr.uploadImage}</Label>
            <div className="mt-1">
              {!imagePreview ? (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 hover:border-orange-400 rounded-lg p-4 cursor-pointer transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-500">Click to upload leaf/plant photo</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              ) : (
                <div className="relative">
                  <img src={imagePreview} alt="Plant" className="w-full h-24 object-cover rounded-lg" />
                  <button onClick={clearImage} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                  {plantId && (
                    <div className="mt-1 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-xs text-green-700">{tr.imageDetected}: {plantId.species} ({plantId.confidence}%)</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <Button
          onClick={analyze}
          disabled={isLoading || !cropType}
          className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white py-6"
        >
          {isLoading ? (
            <><RefreshCw className="w-5 h-5 mr-2 animate-spin" />{tr.analyzing}</>
          ) : (
            <><Bug className="w-5 h-5 mr-2" />{tr.analyzePest}</>
          )}
        </Button>
      </Card>

      {/* Results */}
      {decision && (
        <div className="space-y-4">
          {/* Risk Level */}
          <Card className={`p-6 border-2 ${riskColor.border} ${riskColor.bg}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-gray-900 mb-2">{tr.riskLevel}</h3>
                <Badge className={`${riskColor.badge} text-white px-4 py-2 text-lg`}>
                  {riskLabel}
                </Badge>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">{isFallback ? tr.fallback : tr.aiPowered}</span>
                  {decision.confidence && (
                    <Badge variant="outline" className="text-xs">{decision.confidence}% confidence</Badge>
                  )}
                </div>
              </div>
              {decision.risk_level === 'high' || decision.risk_level === 'critical'
                ? <AlertTriangle className="w-12 h-12 text-red-600" />
                : decision.risk_level === 'medium'
                ? <Bug className="w-12 h-12 text-yellow-600" />
                : <Shield className="w-12 h-12 text-green-600" />
              }
            </div>
          </Card>

          {/* Recommendation */}
          <Card className="p-6 border-l-4 border-orange-500">
            <h4 className="text-gray-900 mb-2 flex items-center gap-2">
              <Bug className="w-5 h-5 text-orange-600" />
              {decision.pestAdvice ? 'Pest Advice' : 'Recommendation'}
            </h4>
            <p className="text-gray-700">{decision.pestAdvice ?? decision.recommendation}</p>
          </Card>

          {/* Actions */}
          <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500">
            <h4 className="text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              {tr.actions}
            </h4>
            <ul className="space-y-2">
              {decision.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-gray-700">
                  <span className="text-green-600 mt-1 font-bold">{i + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </Card>

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
