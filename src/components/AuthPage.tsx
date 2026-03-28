import { useState, useEffect } from 'react';
import { Sprout, Phone, Lock, User, Shield, Fingerprint } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { toast } from 'sonner@2.0.3';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';

interface AuthPageProps {
  onLogin: (name: string, profile?: any) => void;
  language: 'en' | 'hi' | 'mr';
  setLanguage: (lang: 'en' | 'hi' | 'mr') => void;
}

export default function AuthPage({ onLogin, language, setLanguage }: AuthPageProps) {
  const [authMode, setAuthMode] = useState<'phone' | 'guest'>('phone');
  const [verificationMethod, setVerificationMethod] = useState<'otp' | 'missedcall' | 'ussd'>('otp');
  const [step, setStep] = useState<'phone' | 'verify' | 'setup'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [missedCallStatus, setMissedCallStatus] = useState<'waiting' | 'verified' | 'failed'>('waiting');
  const [guestProfile, setGuestProfile] = useState({ farmName: '', fieldName: '' });
  const [pinSetup, setPinSetup] = useState({ pin: '', confirmPin: '' });
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [savedProfiles, setSavedProfiles] = useState<any[]>([]);
  const [quickUnlockMode, setQuickUnlockMode] = useState(false);
  const [unlockPin, setUnlockPin] = useState('');

  const translations = {
    en: {
      welcome: 'Welcome to AgroVision',
      tagline: 'Smart & Climate-Resilient Farming Assistant',
      phoneAuth: 'Phone Login',
      guestMode: 'Guest Mode',
      phoneNumber: 'Phone Number',
      enterPhone: 'Enter your phone number',
      sendOtp: 'Send OTP',
      otpMethod: 'OTP via SMS',
      missedCallMethod: 'Missed Call Verification',
      ussdMethod: 'USSD Verification',
      enterOtp: 'Enter 6-digit OTP',
      verify: 'Verify',
      resendOtp: 'Resend OTP',
      resendIn: 'Resend in',
      seconds: 'seconds',
      missedCallWaiting: 'Please give a missed call to',
      missedCallVerifying: 'Waiting for missed call...',
      ussdInstructions: 'Dial *123*456# and enter code shown on screen',
      farmName: 'Farm Name',
      fieldName: 'First Field Name',
      createGuestProfile: 'Create Guest Profile',
      setupSecurity: 'Setup Security (Optional)',
      setPinTitle: 'Set 4-Digit PIN',
      enterPin: 'Enter PIN',
      confirmPin: 'Confirm PIN',
      enableBiometric: 'Enable Biometric Unlock',
      skipSecurity: 'Skip for Now',
      savePinAndContinue: 'Save PIN & Continue',
      continueWithoutPin: 'Continue Without PIN',
      quickUnlock: 'Quick Unlock',
      savedProfiles: 'Saved Profiles',
      unlockWithPin: 'Unlock with PIN',
      unlockWithBiometric: 'Unlock with Fingerprint',
      switchToFullAuth: 'Use Phone Login',
      invalidOtp: 'Invalid OTP. Please try again.',
      otpSent: 'OTP sent to your phone',
      verificationSuccess: 'Verification successful!',
      missedCallSuccess: 'Missed call verified successfully!',
      missedCallFailed: 'Missed call verification failed. Please try again.',
      profileCreated: 'Guest profile created successfully!',
      pinSet: 'PIN set successfully!',
      biometricEnabled: 'Biometric unlock enabled!',
      invalidPin: 'Invalid PIN. Please try again.',
      pinMismatch: 'PINs do not match. Please try again.',
      linkPhoneNumber: 'Link Phone Number',
      convertToRegistered: 'Convert to Registered Account',
    },
    hi: {
      welcome: 'एग्रोविज़न में आपका स्वागत है',
      tagline: 'स्मार्ट और जलवायु-लचीला खेती सहायक',
      phoneAuth: 'फोन लॉगिन',
      guestMode: 'गेस्ट मोड',
      phoneNumber: 'फोन नंबर',
      enterPhone: 'अपना फोन नंबर दर्ज करें',
      sendOtp: 'OTP भेजें',
      otpMethod: 'SMS के माध्यम से OTP',
      missedCallMethod: 'मिस्ड कॉल सत्यापन',
      ussdMethod: 'USSD सत्यापन',
      enterOtp: '6 अंकों का OTP दर्ज करें',
      verify: 'सत्यापित करें',
      resendOtp: 'OTP फिर से भेजें',
      resendIn: 'फिर से भेजें',
      seconds: 'सेकंड में',
      missedCallWaiting: 'कृपया मिस्ड कॉल दें',
      missedCallVerifying: 'मिस्ड कॉल की प्रतीक्षा कर रहे हैं...',
      ussdInstructions: '*123*456# डायल करें और स्क्रीन पर दिखाया गया कोड दर्ज करें',
      farmName: 'खेत का नाम',
      fieldName: 'पहले खेत का नाम',
      createGuestProfile: 'गेस्ट प्रोफाइल बनाएं',
      setupSecurity: 'सुरक्षा सेटअप करें (वैकल्पिक)',
      setPinTitle: '4 अंकों का PIN सेट करें',
      enterPin: 'PIN दर्ज करें',
      confirmPin: 'PIN की पुष्टि करें',
      enableBiometric: 'बायोमेट्रिक अनलॉक सक्षम करें',
      skipSecurity: 'अभी छोड़ें',
      savePinAndContinue: 'PIN सहेजें और जारी रखें',
      continueWithoutPin: 'बिना PIN के जारी रखें',
      quickUnlock: 'त्वरित अनलॉक',
      savedProfiles: 'सहेजे गए प्रोफाइल',
      unlockWithPin: 'PIN से अनलॉक करें',
      unlockWithBiometric: 'फिंगरप्रिंट से अनलॉक करें',
      switchToFullAuth: 'फोन लॉगिन का उपयोग करें',
      invalidOtp: 'अमान्य OTP। कृपया पुनः प्रयास करें।',
      otpSent: 'आपके फोन पर OTP भेजा गया',
      verificationSuccess: 'सत्यापन सफल!',
      missedCallSuccess: 'मिस्ड कॉल सफलतापूर्वक सत्यापित!',
      missedCallFailed: 'मिस्ड कॉल सत्यापन विफल। कृपया पुनः प्रयास करें।',
      profileCreated: 'गेस्ट प्रोफाइल सफलतापूर्वक बनाया गया!',
      pinSet: 'PIN सफलतापूर्वक सेट किया गया!',
      biometricEnabled: 'बायोमेट्रिक अनलॉक सक्षम!',
      invalidPin: 'अमान्य PIN। कृपया पुनः प्रयास करें।',
      pinMismatch: 'PIN मेल नहीं खाते। कृपया पुनः प्रयास करें।',
      linkPhoneNumber: 'फोन नंबर लिंक करें',
      convertToRegistered: 'पंजीकृत खाते में बदलें',
    },
    mr: {
      welcome: 'एग्रोव्हिजनमध्ये आपले स्वागत आहे',
      tagline: 'स्मार्ट आणि हवामान-लवचिक शेती सहाय्यक',
      phoneAuth: 'फोन लॉगिन',
      guestMode: 'गेस्ट मोड',
      phoneNumber: 'फोन नंबर',
      enterPhone: 'तुमचा फोन नंबर टाका',
      sendOtp: 'OTP पाठवा',
      otpMethod: 'SMS द्वारे OTP',
      missedCallMethod: 'मिस्ड कॉल पडताळणी',
      ussdMethod: 'USSD पडताळणी',
      enterOtp: '6 अंकी OTP टाका',
      verify: 'पडताळा',
      resendOtp: 'OTP पुन्हा पाठवा',
      resendIn: 'पुन्हा पाठवा',
      seconds: 'सेकंदांमध्ये',
      missedCallWaiting: 'कृपया मिस्ड कॉल द्या',
      missedCallVerifying: 'मिस्ड कॉलची प्रतीक्षा करत आहे...',
      ussdInstructions: '*123*456# डायल करा आणि स्क्रीनवर दाखवलेला कोड टाका',
      farmName: 'शेताचे नाव',
      fieldName: 'पहिल्या शेताचे नाव',
      createGuestProfile: 'गेस्ट प्रोफाइल तयार करा',
      setupSecurity: 'सुरक्षा सेटअप करा (पर्यायी)',
      setPinTitle: '4 अंकी PIN सेट करा',
      enterPin: 'PIN टाका',
      confirmPin: 'PIN ची पुष्टी करा',
      enableBiometric: 'बायोमेट्रिक अनलॉक सक्षम करा',
      skipSecurity: 'आता वगळा',
      savePinAndContinue: 'PIN जतन करा आणि सुरू ठेवा',
      continueWithoutPin: 'PIN शिवाय सुरू ठेवा',
      quickUnlock: 'जलद अनलॉक',
      savedProfiles: 'जतन केलेले प्रोफाइल',
      unlockWithPin: 'PIN सह अनलॉक करा',
      unlockWithBiometric: 'फिंगरप्रिंटसह अनलॉक करा',
      switchToFullAuth: 'फोन लॉगिन वापरा',
      invalidOtp: 'अवैध OTP. कृपया पुन्हा प्रयत्न करा.',
      otpSent: 'तुमच्या फोनवर OTP पाठवला',
      verificationSuccess: 'पडताळणी यशस्वी!',
      missedCallSuccess: 'मिस्ड कॉल यशस्वीरित्या पडताळला!',
      missedCallFailed: 'मिस्ड कॉल पडताळणी अयशस्वी. कृपया पुन्हा प्रयत्न करा.',
      profileCreated: 'गेस्ट प्रोफाइल यशस्वीरित्या तयार केले!',
      pinSet: 'PIN यशस्वीरित्या सेट केला!',
      biometricEnabled: 'बायोमेट्रिक अनलॉक सक्षम!',
      invalidPin: 'अवैध PIN. कृपया पुन्हा प्रयत्न करा.',
      pinMismatch: 'PIN जुळत नाहीत. कृपया पुन्हा प्रयत्न करा.',
      linkPhoneNumber: 'फोन नंबर लिंक करा',
      convertToRegistered: 'नोंदणीकृत खात्यात रूपांतरित करा',
    }
  };

  const t = translations[language];

  // Load saved profiles on mount
  useEffect(() => {
    const saved = localStorage.getItem('agrovision_profiles');
    if (saved) {
      setSavedProfiles(JSON.parse(saved));
    }
  }, []);

  // OTP timer
  useEffect(() => {
    if (otpTimer > 0) {
      const timer = setTimeout(() => setOtpTimer(otpTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpTimer]);

  // Missed call verification simulation
  useEffect(() => {
    if (verificationMethod === 'missedcall' && step === 'verify') {
      const timer = setTimeout(() => {
        const success = Math.random() > 0.2; // 80% success rate
        if (success) {
          setMissedCallStatus('verified');
          toast.success(t.missedCallSuccess);
          setTimeout(() => handleVerificationSuccess(), 1000);
        } else {
          setMissedCallStatus('failed');
          toast.error(t.missedCallFailed);
        }
      }, 5000); // Simulate 5 second verification
      return () => clearTimeout(timer);
    }
  }, [verificationMethod, step]);

  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    
    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(otp);
    setOtpTimer(30);
    setStep('verify');
    toast.success(t.otpSent);
    
    // In development, show OTP in console
    console.log('Generated OTP:', otp);
  };

  const handleVerifyOtp = () => {
    if (otp === generatedOtp) {
      toast.success(t.verificationSuccess);
      handleVerificationSuccess();
    } else {
      toast.error(t.invalidOtp);
    }
  };

  const handleVerificationSuccess = () => {
    const profile = {
      type: 'phone',
      phone: phoneNumber,
      name: phoneNumber,
      createdAt: new Date().toISOString(),
    };
    
    // Save to localStorage
    const profiles = [...savedProfiles, profile];
    localStorage.setItem('agrovision_profiles', JSON.stringify(profiles));
    
    // Ask about PIN setup
    setShowPinSetup(true);
  };

  const handleCreateGuestProfile = () => {
    if (!guestProfile.farmName) {
      toast.error('Please enter farm name');
      return;
    }

    const profile = {
      type: 'guest',
      farmName: guestProfile.farmName,
      fieldName: guestProfile.fieldName || 'Main Field',
      name: guestProfile.farmName,
      createdAt: new Date().toISOString(),
      data: {
        soilTests: [],
        tasks: [],
        crops: [],
      }
    };

    // Save to localStorage
    const profiles = [...savedProfiles, profile];
    localStorage.setItem('agrovision_profiles', JSON.stringify(profiles));
    setSavedProfiles(profiles);
    
    toast.success(t.profileCreated);
    
    // Ask about PIN setup
    setShowPinSetup(true);
  };

  const handleSetPin = () => {
    if (pinSetup.pin.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    if (pinSetup.pin !== pinSetup.confirmPin) {
      toast.error(t.pinMismatch);
      return;
    }

    // Save PIN to the latest profile
    const latestProfile = savedProfiles[savedProfiles.length - 1];
    if (latestProfile) {
      latestProfile.pin = pinSetup.pin;
      latestProfile.biometricEnabled = showBiometricPrompt;
      localStorage.setItem('agrovision_profiles', JSON.stringify(savedProfiles));
    }

    toast.success(t.pinSet);
    if (showBiometricPrompt) {
      toast.success(t.biometricEnabled);
    }
    
    setShowPinSetup(false);
    onLogin(latestProfile.name, latestProfile);
  };

  const handleSkipPinSetup = () => {
    setShowPinSetup(false);
    const latestProfile = savedProfiles[savedProfiles.length - 1];
    if (latestProfile) {
      onLogin(latestProfile.name, latestProfile);
    }
  };

  const handleQuickUnlock = (profile: any) => {
    if (profile.pin) {
      setQuickUnlockMode(true);
      setUnlockPin('');
    } else {
      onLogin(profile.name, profile);
    }
  };

  const handlePinUnlock = () => {
    const profile = savedProfiles.find(p => p.pin === unlockPin);
    if (profile) {
      toast.success(t.verificationSuccess);
      onLogin(profile.name, profile);
    } else {
      toast.error(t.invalidPin);
      setUnlockPin('');
    }
  };

  const handleBiometricUnlock = () => {
    // Simulate biometric authentication
    toast.info('Biometric authentication...');
    setTimeout(() => {
      const profile = savedProfiles.find(p => p.biometricEnabled);
      if (profile) {
        toast.success(t.verificationSuccess);
        onLogin(profile.name, profile);
      } else {
        toast.error('Biometric authentication failed');
      }
    }, 1500);
  };

  // Quick unlock screen
  if (quickUnlockMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 flex items-center justify-center p-4">
        <Card className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-3 rounded-xl">
                <Sprout className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-gray-900">{t.quickUnlock}</h2>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label>{t.unlockWithPin}</Label>
              <InputOTP maxLength={4} value={unlockPin} onChange={setUnlockPin} className="mt-2">
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button onClick={handlePinUnlock} className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
              <Lock className="w-4 h-4 mr-2" />
              {t.verify}
            </Button>

            {savedProfiles.some(p => p.biometricEnabled) && (
              <Button onClick={handleBiometricUnlock} variant="outline" className="w-full">
                <Fingerprint className="w-4 h-4 mr-2" />
                {t.unlockWithBiometric}
              </Button>
            )}

            <Button onClick={() => setQuickUnlockMode(false)} variant="ghost" className="w-full">
              {t.switchToFullAuth}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left Side - Branding */}
        <div className="text-white hidden md:block">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-white p-4 rounded-2xl">
              <Sprout className="w-16 h-16 text-green-600" />
            </div>
            <div>
              <h1 className="text-5xl">{t.welcome}</h1>
            </div>
          </div>
          <p className="text-xl text-green-100 mb-8">{t.tagline}</p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg">Multiple Authentication Options</h3>
                <p className="text-green-100 text-sm">OTP, Missed Call, USSD, or Guest Mode</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg">Offline Access</h3>
                <p className="text-green-100 text-sm">Use guest mode and work offline with local data</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <Fingerprint className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg">Quick Unlock</h3>
                <p className="text-green-100 text-sm">PIN or biometric for fast access</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <Card className="bg-white p-8 rounded-2xl shadow-2xl">
          {/* Language Selector */}
          <div className="flex justify-end mb-6">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'en' | 'hi' | 'mr')}
              className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
            </select>
          </div>

          {/* Saved Profiles Quick Access */}
          {savedProfiles.length > 0 && !quickUnlockMode && (
            <div className="mb-6">
              <Label className="mb-2 block">{t.savedProfiles}</Label>
              <div className="space-y-2">
                {savedProfiles.map((profile, idx) => (
                  <Button
                    key={idx}
                    onClick={() => handleQuickUnlock(profile)}
                    variant="outline"
                    className="w-full justify-start"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {profile.name || profile.farmName}
                    {profile.pin && <Lock className="w-4 h-4 ml-auto" />}
                  </Button>
                ))}
              </div>
              <div className="border-t my-4"></div>
            </div>
          )}

          <Tabs value={authMode} onValueChange={(v) => setAuthMode(v as 'phone' | 'guest')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="phone">{t.phoneAuth}</TabsTrigger>
              <TabsTrigger value="guest">{t.guestMode}</TabsTrigger>
            </TabsList>

            {/* Phone Authentication */}
            <TabsContent value="phone" className="space-y-4">
              {step === 'phone' && (
                <>
                  <div>
                    <Label htmlFor="phone">{t.phoneNumber}</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t.enterPhone}
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                        maxLength={10}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Verification Method</Label>
                    <div className="grid gap-2">
                      <Button
                        onClick={() => { setVerificationMethod('otp'); handleSendOtp(); }}
                        className="w-full justify-start bg-gradient-to-r from-green-600 to-emerald-600"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t.otpMethod}
                      </Button>
                      <Button
                        onClick={() => { setVerificationMethod('missedcall'); setStep('verify'); }}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t.missedCallMethod}
                      </Button>
                      <Button
                        onClick={() => { setVerificationMethod('ussd'); setStep('verify'); }}
                        variant="outline"
                        className="w-full justify-start"
                      >
                        <Phone className="w-4 h-4 mr-2" />
                        {t.ussdMethod}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {step === 'verify' && verificationMethod === 'otp' && (
                <>
                  <div>
                    <Label>{t.enterOtp}</Label>
                    <InputOTP maxLength={6} value={otp} onChange={setOtp} className="mt-2">
                      <InputOTPGroup className="gap-2">
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                    <p className="text-sm text-gray-600 mt-2">Sent to {phoneNumber}</p>
                  </div>

                  <Button onClick={handleVerifyOtp} className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                    {t.verify}
                  </Button>

                  <Button
                    onClick={handleSendOtp}
                    disabled={otpTimer > 0}
                    variant="ghost"
                    className="w-full"
                  >
                    {otpTimer > 0 ? `${t.resendIn} ${otpTimer} ${t.seconds}` : t.resendOtp}
                  </Button>
                </>
              )}

              {step === 'verify' && verificationMethod === 'missedcall' && (
                <div className="text-center space-y-4">
                  <p className="text-gray-700">{t.missedCallWaiting}</p>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-2xl text-green-900">+91-1800-XXX-XXXX</p>
                  </div>
                  <p className="text-sm text-gray-600">{t.missedCallVerifying}</p>
                  <div className="flex justify-center">
                    <div className="animate-pulse w-12 h-12 bg-green-500 rounded-full"></div>
                  </div>
                  {missedCallStatus === 'failed' && (
                    <Button onClick={() => setStep('phone')} variant="outline" className="w-full">
                      Try Again
                    </Button>
                  )}
                </div>
              )}

              {step === 'verify' && verificationMethod === 'ussd' && (
                <div className="text-center space-y-4">
                  <p className="text-gray-700">{t.ussdInstructions}</p>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <p className="text-3xl text-blue-900 mb-2">*123*456#</p>
                    <p className="text-sm text-gray-600">Verification Code:</p>
                    <p className="text-2xl text-gray-900">789012</p>
                  </div>
                  <Button onClick={handleVerificationSuccess} className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                    I've Completed USSD Verification
                  </Button>
                  <Button onClick={() => setStep('phone')} variant="ghost" className="w-full">
                    Back
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Guest Mode */}
            <TabsContent value="guest" className="space-y-4">
              <div>
                <Label htmlFor="farmName">{t.farmName}</Label>
                <Input
                  id="farmName"
                  type="text"
                  placeholder="e.g., Green Valley Farm"
                  value={guestProfile.farmName}
                  onChange={(e) => setGuestProfile({ ...guestProfile, farmName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="fieldName">{t.fieldName} (Optional)</Label>
                <Input
                  id="fieldName"
                  type="text"
                  placeholder="e.g., North Field"
                  value={guestProfile.fieldName}
                  onChange={(e) => setGuestProfile({ ...guestProfile, fieldName: e.target.value })}
                  className="mt-1"
                />
              </div>

              <Button onClick={handleCreateGuestProfile} className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                <User className="w-4 h-4 mr-2" />
                {t.createGuestProfile}
              </Button>

              <p className="text-sm text-gray-600 text-center">
                Guest profiles work offline and can be linked to a phone number later
              </p>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* PIN Setup Dialog */}
      <Dialog open={showPinSetup} onOpenChange={setShowPinSetup}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.setupSecurity}</DialogTitle>
            <DialogDescription>
              Set a PIN or enable biometric unlock for quick access
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>{t.enterPin}</Label>
              <InputOTP maxLength={4} value={pinSetup.pin} onChange={(v) => setPinSetup({ ...pinSetup, pin: v })} className="mt-2">
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div>
              <Label>{t.confirmPin}</Label>
              <InputOTP maxLength={4} value={pinSetup.confirmPin} onChange={(v) => setPinSetup({ ...pinSetup, confirmPin: v })} className="mt-2">
                <InputOTPGroup className="gap-2">
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="biometric"
                checked={showBiometricPrompt}
                onChange={(e) => setShowBiometricPrompt(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="biometric" className="cursor-pointer">
                {t.enableBiometric}
              </Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSetPin} className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600">
                {t.savePinAndContinue}
              </Button>
              <Button onClick={handleSkipPinSetup} variant="outline" className="flex-1">
                {t.skipSecurity}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
