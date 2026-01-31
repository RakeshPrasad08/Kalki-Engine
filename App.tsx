
import React, { useState, useEffect, useRef } from 'react';
import { UserBrand, AnalysisResult, PostSuggestion, GroundingSource, StrategicBriefing, ChatMessage, ActivitySummary, RegionalTrends, ToneVariant } from './types';
import { analyzeBrandVoice, generateDailySuggestions, getStrategicBriefing, createManagerChat, translatePostContent, summarizeSocialPulse, generateVeoVideo, generateImage, fetchDetailedTrends } from './services/geminiService';
import { Chat, GenerateContentResponse } from '@google/genai';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  LineChart, Line, Legend
} from 'recharts';

const Header: React.FC<{ activeTab: string; setActiveTab: (t: string) => void }> = ({ activeTab, setActiveTab }) => (
  <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50 shadow-sm">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="bg-[#000080] w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-xl rotate-3">
            <i className="fas fa-dharmachakra text-2xl chakra-spin"></i>
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF9933] rounded-full border-4 border-white shadow-sm"></div>
        </div>
        <div>
          <h1 className="text-xl font-black text-[#000080] leading-none tracking-tight flex items-center gap-1">
            VOICE OF <span className="gradient-text">KALKI</span>
          </h1>
          <p className="text-[10px] text-[#138808] font-bold uppercase tracking-[0.25em] mt-1">Creator Suite x Rakesh Prasad</p>
        </div>
      </div>
      <nav className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
        {[
            { id: 'strategy', label: 'Strategy', icon: 'fa-landmark' },
            { id: 'pulse', label: 'Pulse', icon: 'fa-bolt' },
            { id: 'trends', label: 'Trends', icon: 'fa-fire' },
            { id: 'queue', label: 'Queue', icon: 'fa-calendar-check' },
        ].map((tab) => (
            <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)} 
                className={`${activeTab === tab.id ? 'bg-white text-[#000080] shadow-sm' : 'text-slate-500 hover:text-[#FF9933]'} px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2`}
            >
                <i className={`fas ${tab.icon} text-[10px]`}></i>
                {tab.label}
            </button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
           <div className="hidden sm:flex flex-col items-end">
             <span className="text-[10px] font-black text-[#000080] uppercase tracking-tighter">Digital India</span>
             <span className="text-[8px] font-bold text-slate-400">v2.5 PREVIEW</span>
           </div>
           <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FF9933] to-[#138808] p-0.5 shadow-lg">
             <img className="h-full w-full rounded-[0.9rem] object-cover bg-white" src={`https://ui-avatars.com/api/?name=RP&background=000080&color=fff`} alt="Rakesh Prasad" />
           </div>
      </div>
    </div>
  </header>
);

const AuthScreen: React.FC<{ 
  onAuth: (platform: string, location: { city: string, state: string, country: string, latitude?: number, longitude?: number }) => void 
}> = ({ onAuth }) => {
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);

  const socialPlatforms = [
    { name: 'Google', icon: 'fa-google', color: 'hover:text-[#DB4437] hover:bg-[#DB4437]/10' },
    { name: 'Facebook', icon: 'fa-facebook-f', color: 'hover:text-[#4267B2] hover:bg-[#4267B2]/10' },
    { name: 'Instagram', icon: 'fa-instagram', color: 'hover:text-[#E1306C] hover:bg-[#E1306C]/10' },
    { name: 'LinkedIn', icon: 'fa-linkedin-in', color: 'hover:text-[#0077B5] hover:bg-[#0077B5]/10' },
    { name: 'X (Twitter)', icon: 'fa-x-twitter', color: 'hover:text-black hover:bg-black/5' }
  ];

  const handleDetectLocation = () => {
    setIsDetecting(true);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      setIsDetecting(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsDetecting(false);
      },
      (err) => {
        console.error(err);
        setIsDetecting(false);
        alert("Location access denied. Please allow location permissions for mobility-aware trends.");
      }
    );
  };

  const canContinue = (city.trim().length > 0 && state.trim().length > 0) || coords !== null;

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9933]/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#138808]/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
      
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 relative z-10">
        <div className="bg-[#000080] p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
             <i className="fas fa-dharmachakra text-[12rem] absolute -top-10 -left-10 text-white"></i>
          </div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-2xl rotate-3 hover:rotate-0 transition-transform">
              <i className="fas fa-dharmachakra text-4xl text-[#000080] chakra-spin"></i>
            </div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">KALKI ENGINE</h2>
            <p className="text-white/60 text-[10px] font-black tracking-[0.3em] uppercase mt-2">Atma Nirbhar Creator Hub</p>
          </div>
        </div>
        
        <div className="p-10 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-black text-[#000080] uppercase tracking-widest">Region Settings</label>
              <button 
                onClick={handleDetectLocation}
                className={`text-[10px] font-black uppercase flex items-center gap-2 transition ${coords ? 'text-[#138808]' : 'text-[#FF9933] hover:opacity-70'}`}
              >
                {isDetecting ? <i className="fas fa-spinner animate-spin"></i> : <i className={`fas ${coords ? 'fa-location-dot' : 'fa-location-crosshairs'}`}></i>}
                {coords ? 'Mobility Mode Active' : 'Enable Mobility GPS'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input 
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#FF9933] outline-none transition-all placeholder:text-slate-300"
                placeholder="City (e.g. Pune)"
              />
              <input 
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-sm font-bold focus:border-[#138808] outline-none transition-all placeholder:text-slate-300"
                placeholder="Region (e.g. MH)"
              />
            </div>
            {coords && (
              <div className="bg-[#138808]/5 p-4 rounded-2xl border border-[#138808]/10 flex items-center justify-between animate-in fade-in zoom-in">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#138808] animate-pulse"></div>
                    <span className="text-[10px] font-black text-[#138808] uppercase tracking-tight">Hyper-Local Mapping: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                 </div>
                 <button onClick={() => setCoords(null)} className="text-[#D21B21] hover:scale-110 transition"><i className="fas fa-times-circle text-base"></i></button>
              </div>
            )}
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest text-center italic">Mobility mode enables Google Maps grounding for venue-specific trends.</p>
          </div>

          <div className="space-y-4">
            <label className="block text-[10px] font-black text-[#000080] uppercase tracking-widest text-center">Sync Identity</label>
            <div className="grid grid-cols-5 gap-4">
              {socialPlatforms.map((p) => (
                <button
                  key={p.name}
                  disabled={!canContinue}
                  onClick={() => onAuth(p.name, { city, state, country: 'India', latitude: coords?.lat, longitude: coords?.lng })}
                  className={`aspect-square rounded-2xl border-2 border-slate-100 flex items-center justify-center text-xl transition-all ${canContinue ? `${p.color} cursor-pointer hover:border-current hover:shadow-lg active:scale-95` : 'opacity-20 grayscale'}`}
                  title={`Sync with ${p.name}`}
                >
                  <i className={`fab ${p.icon}`}></i>
                </button>
              ))}
            </div>
          </div>
          
          <p className="text-[9px] text-center text-slate-400 font-bold leading-relaxed px-4">
            By connecting, you empower Kalki to analyze regional trends and your unique brand voice for optimized impact.
          </p>
        </div>
      </div>
    </div>
  );
};

const DataVisualization: React.FC<{ graphic: PostSuggestion['dataGraphic'] }> = ({ graphic }) => {
  if (!graphic || !graphic.labels || !graphic.values) return null;
  const data = graphic.labels.map((label, index) => ({
    name: label,
    value: graphic.values[index],
  }));

  const COLORS = ['#000080', '#FF9933', '#138808', '#D21B21', '#FFCC00', '#0077B5', '#666666'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-3 shadow-2xl rounded-2xl border border-slate-100 animate-in zoom-in duration-200">
          <p className="text-[10px] font-black uppercase text-slate-400 mb-1 tracking-widest">{label}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#000080]"></div>
            <p className="text-lg font-black text-[#000080]">
              {payload[0].value.toLocaleString()}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    switch (graphic.type) {
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar 
              dataKey="value" 
              fill="#000080" 
              radius={[10, 10, 0, 0]} 
              barSize={40}
              animationDuration={2000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              innerRadius={60}
              outerRadius={90}
              paddingAngle={6}
              dataKey="value"
              nameKey="name"
              animationBegin={0}
              animationDuration={2000}
              stroke="none"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomTooltip />} />
            <Legend 
              verticalAlign="bottom" 
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: '20px', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
            />
          </PieChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis 
              tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} 
              axisLine={false}
              tickLine={false}
            />
            <RechartsTooltip content={<CustomTooltip />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#000080" 
              strokeWidth={5} 
              dot={{ fill: '#000080', r: 6, strokeWidth: 4, stroke: '#fff' }} 
              activeDot={{ r: 10, strokeWidth: 0, fill: '#FF9933' }}
              animationDuration={2000}
            />
          </LineChart>
        );
      default: return null;
    }
  };

  return (
    <div className="bg-white/50 border border-slate-100 rounded-[2.5rem] p-10 mt-10 shadow-inner relative overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#FF9933]/10 to-transparent rounded-full -mr-16 -mt-16 blur-2xl"></div>
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-[#000080] flex items-center justify-center text-white shadow-lg">
              <i className={`fas ${graphic.type === 'pie' ? 'fa-chart-pie' : graphic.type === 'bar' ? 'fa-chart-bar' : 'fa-chart-line'} text-sm`}></i>
            </div>
            <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-none">
              {graphic.title}
            </h4>
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-[52px]">
            AI Data Analysis Node
          </p>
        </div>
        <div className="px-5 py-2.5 bg-white rounded-2xl shadow-sm border border-slate-100 text-[10px] font-black text-[#000080] uppercase tracking-widest flex items-center gap-2 self-start sm:self-auto hover:bg-[#000080] hover:text-white transition-all cursor-default group">
          <div className="w-2 h-2 rounded-full bg-[#138808] group-hover:bg-white animate-pulse"></div>
          {graphic.type} Matrix
        </div>
      </div>
      
      <div className="h-72 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() || <div />}
        </ResponsiveContainer>
      </div>

      {graphic.description && (
        <div className="mt-10 p-6 bg-white rounded-3xl border border-slate-100 shadow-sm relative z-10 group hover:border-[#FF9933]/30 transition-all">
          <p className="text-xs font-bold text-slate-600 leading-relaxed">
            <i className="fas fa-sparkles text-[#FF9933] mr-3"></i>
            {graphic.description}
          </p>
        </div>
      )}
    </div>
  );
};

const SuggestionCard: React.FC<{ post: PostSuggestion }> = ({ post }) => {
  const [selectedTone, setSelectedTone] = useState<string>(post.toneVariants?.[0]?.tone || post.tone);
  const [viewLanguage, setViewLanguage] = useState<string>('English');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [festivalOverlayText, setFestivalOverlayText] = useState(post.festivalInfo?.overlayText || '');
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  const activeVariant = post.toneVariants?.find(v => v.tone === selectedTone);

  const indianLanguages = [
    { name: 'Hindi', code: 'HI' },
    { name: 'Kannada', code: 'KN' },
    { name: 'Tamil', code: 'TN' },
    { name: 'Telugu', code: 'TE' },
    { name: 'Marathi', code: 'MR' },
    { name: 'Malayalam', code: 'ML' },
    { name: 'Bengali', code: 'BN' },
    { name: 'Gujarati', code: 'GU' },
    { name: 'Punjabi', code: 'PA' }
  ];
  
  let displayContent = '';
  let needsTranslation = false;

  if (viewLanguage === 'English') {
    displayContent = activeVariant?.contentEnglish || post.content;
  } else if (viewLanguage === 'Indic') {
    displayContent = activeVariant?.contentIndic || '';
    if (!displayContent) needsTranslation = true;
  } else {
    displayContent = translations[viewLanguage] || '';
    if (!displayContent) needsTranslation = true;
  }

  useEffect(() => {
    if (editorRef.current && !needsTranslation && document.activeElement !== editorRef.current) {
      editorRef.current.innerHTML = displayContent;
    }
  }, [displayContent, needsTranslation]);

  const handleTranslate = async (langName: string) => {
    setViewLanguage(langName);
    setShowLangMenu(false);
    
    if (activeVariant?.indicLanguage?.toLowerCase().includes(langName.toLowerCase())) {
        setViewLanguage('Indic');
        return;
    }

    if (!translations[langName]) {
        setIsTranslating(true);
        try {
            const source = activeVariant?.contentEnglish || post.content;
            const translated = await translatePostContent(source, langName);
            setTranslations(prev => ({ ...prev, [langName]: translated }));
        } catch (e) {
            console.error("Translation failed", e);
        } finally {
            setIsTranslating(false);
        }
    }
  };

  const handleIndicTranslate = async () => {
    if (!activeVariant) return;
    setIsTranslating(true);
    try {
        const source = activeVariant.contentEnglish || post.content;
        const translated = await translatePostContent(source, activeVariant.indicLanguage);
        activeVariant.contentIndic = translated;
        setTranslations(prev => ({ ...prev })); 
    } catch (e) {
        console.error("Indic translation failed", e);
    } finally {
        setIsTranslating(false);
    }
  };

  const applyFormat = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) editorRef.current.focus();
  };

  const handleVeo = async () => {
    setIsGeneratingVideo(true);
    try {
      const finalPrompt = post.festivalInfo 
        ? `Festival: ${post.festivalInfo.name}. Message: "${festivalOverlayText}". Style: Cinematic. ${post.videoPrompt || (editorRef.current?.innerText || displayContent)}`
        : (post.videoPrompt || (editorRef.current?.innerText || displayContent));
      const videoUrl = await generateVeoVideo(finalPrompt);
      window.open(videoUrl, '_blank');
    } catch(e) { console.error(e); } finally { setIsGeneratingVideo(false); }
  };

  const handleVisualShare = async () => {
    setIsSharing(true);
    try {
      const isFestival = !!post.festivalInfo;
      const visualType = isFestival ? `festival greeting for ${post.festivalInfo?.name}` : "highly engaging social media poster";
      const posterPrompt = `A stunning, high-definition cinematic ${visualType}. Vibrant Indian aesthetic with Saffron, Green and Gold. Elegant textures. ${isFestival ? post.festivalInfo?.name : ""} festive lighting. Clear central space. Professional creator branding. Rakesh Prasad style.`;
      
      const posterDataUrl = await generateImage(posterPrompt);
      
      if (navigator.share) {
        const res = await fetch(posterDataUrl);
        const blob = await res.blob();
        const file = new File([blob], `Kalki_Visual_Node.png`, { type: 'image/png' });
        
        await navigator.share({
          title: isFestival ? `Shubh ${post.festivalInfo?.name}!` : "New Content Node from RP",
          text: isFestival ? festivalOverlayText : (editorRef.current?.innerText || displayContent),
          files: [file]
        });
      } else {
        const link = document.createElement('a');
        link.href = posterDataUrl;
        link.download = `Kalki_RP_Visual.png`;
        link.click();
        alert("Visual forged and downloaded to your device storage!");
      }
    } catch (e) {
      console.error("Share error:", e);
      alert("Encountered an issue forging the visual node.");
    } finally {
      setIsSharing(false);
    }
  };

  const toneIcons: Record<string, string> = {
    'Humorous': 'fa-face-laugh-squint', 'Sarcastic': 'fa-face-grin-tongue-wink', 
    'Professional': 'fa-briefcase', 'Soft': 'fa-feather', 'Bold': 'fa-fire', 
    'Political': 'fa-landmark', 'Direct': 'fa-bolt'
  };

  return (
    <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden group hover:shadow-2xl transition-all duration-700 card-india">
      <div className="flex flex-col lg:flex-row">
        <div className="w-full lg:w-72 bg-slate-900 flex flex-col items-center justify-center p-10 text-center space-y-6 relative group/visual">
          {(isGeneratingVideo || isSharing) && (
            <div className="absolute inset-0 bg-[#000080]/90 backdrop-blur-xl flex flex-col items-center justify-center p-6 z-10 animate-in fade-in duration-300">
              <i className="fas fa-dharmachakra text-white text-4xl chakra-spin mb-6"></i>
              <p className="text-[10px] text-white font-black uppercase tracking-[0.3em] text-center leading-loose">
                {isGeneratingVideo ? 'Synthesizing Cinematic Veo...' : 'Forging Visual Matrix...'}
              </p>
            </div>
          )}
          <div className="w-20 h-20 rounded-3xl bg-white/5 flex items-center justify-center mb-2 group-hover/visual:scale-110 transition-transform">
            <i className={`fas ${isSharing ? 'fa-share-nodes' : 'fa-clapperboard'} text-white/30 text-4xl`}></i>
          </div>
          <div className="space-y-1">
             <p className="text-[10px] text-white/40 font-black uppercase tracking-[0.3em]">Neural Studio</p>
             <p className="text-[8px] text-[#FF9933] font-black uppercase tracking-[0.2em]">Kalki AI v2.5</p>
          </div>
          
          <div className="w-full flex flex-col gap-4">
            <button 
              disabled={isGeneratingVideo || isSharing}
              onClick={handleVeo}
              className="w-full bg-[#FF9933] hover:bg-white hover:text-[#FF9933] text-white font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
            >
              <i className="fas fa-play"></i> Cinematic Veo
            </button>
            <button 
              disabled={isGeneratingVideo || isSharing}
              onClick={handleVisualShare}
              className="w-full bg-white hover:bg-[#138808] hover:text-white text-[#138808] font-black text-[10px] uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
            >
              <i className="fas fa-share-nodes"></i> Visual Share
            </button>
          </div>
          <p className="text-[8px] text-white/20 font-black uppercase tracking-widest">Powered by Google Gemini</p>
        </div>

        <div className="flex-1 p-10 space-y-10">
          <div className="flex flex-wrap justify-between items-center gap-6">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${post.platform === 'X' ? 'bg-black' : post.platform === 'Facebook' ? 'bg-[#4267B2]' : post.platform === 'Instagram' ? 'bg-gradient-to-tr from-[#F58529] via-[#DD2A7B] to-[#8134AF]' : 'bg-[#0077B5]'}`}>
                <i className={`fab fa-${post.platform.toLowerCase() === 'x' ? 'x-twitter' : post.platform.toLowerCase()} text-2xl`}></i>
              </div>
              <div>
                <span className="text-xs font-black text-[#000080] uppercase tracking-widest block">{post.platform} Intelligence</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Strategic Suggestion for RP</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 relative">
                <button 
                    onClick={() => setViewLanguage('English')} 
                    className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${viewLanguage === 'English' ? 'bg-white shadow-sm text-[#000080]' : 'text-slate-400 hover:text-slate-600'}`}>
                    ENGLISH
                </button>
                <button 
                    onClick={() => setViewLanguage('Indic')} 
                    className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all ${viewLanguage === 'Indic' ? 'bg-white shadow-sm text-[#000080]' : 'text-slate-400 hover:text-slate-600'}`}>
                    {activeVariant?.indicLanguage?.toUpperCase() || 'INDIC'}
                </button>
                <div className="h-6 w-[1px] bg-slate-300 mx-1"></div>
                <button 
                    onClick={() => setShowLangMenu(!showLangMenu)}
                    className={`px-4 py-2 text-[10px] font-black rounded-xl transition-all flex items-center gap-2 ${viewLanguage !== 'English' && viewLanguage !== 'Indic' ? 'bg-white shadow-sm text-[#000080]' : 'text-slate-400 hover:text-[#000080]'}`}>
                    {isTranslating ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-language"></i>}
                    {viewLanguage !== 'English' && viewLanguage !== 'Indic' ? indianLanguages.find(l => l.name === viewLanguage)?.code : 'OTHERS'}
                </button>

                {showLangMenu && (
                    <div className="absolute top-full right-0 mt-4 w-64 bg-white rounded-[2rem] shadow-2xl border border-slate-100 p-4 z-20 grid grid-cols-3 gap-2 animate-in fade-in slide-in-from-top-6">
                        {indianLanguages.map(lang => (
                            <button 
                                key={lang.code}
                                onClick={() => handleTranslate(lang.name)}
                                className={`py-3 text-[11px] font-black rounded-2xl transition-all border border-transparent ${viewLanguage === lang.name ? 'bg-[#000080] text-white' : 'hover:bg-slate-50 hover:border-slate-100 text-slate-600'}`}>
                                {lang.code}
                            </button>
                        ))}
                    </div>
                )}
              </div>
            </div>
          </div>

          {post.festivalInfo && (
            <div className="bg-[#FF9933]/5 p-8 rounded-[2.5rem] border-2 border-[#FF9933]/20 animate-in slide-in-from-top-6 duration-500 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                 <i className="fas fa-om text-6xl text-[#FF9933]"></i>
              </div>
              <label className="text-[11px] font-black uppercase text-[#FF9933] tracking-[0.25em] mb-4 block flex items-center gap-3">
                <i className="fas fa-sparkles"></i> FESTIVAL GREETING OVERLAY
              </label>
              <input 
                type="text" 
                value={festivalOverlayText} 
                onChange={(e) => setFestivalOverlayText(e.target.value)} 
                className="w-full px-7 py-5 rounded-2xl border-2 border-white focus:border-[#FF9933] focus:ring-[12px] focus:ring-[#FF9933]/10 outline-none text-sm font-bold transition-all shadow-sm" 
                placeholder="Personalize your greeting (e.g., Shubh Deepavali from RP)" 
              />
            </div>
          )}

          {post.toneVariants && (
            <div className="flex flex-wrap gap-3">
              {post.toneVariants.map(v => (
                <button 
                  key={v.tone} 
                  onClick={() => {
                    setSelectedTone(v.tone);
                    setTranslations({}); 
                  }} 
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl border text-[11px] font-black uppercase transition-all duration-300 ${selectedTone === v.tone ? 'bg-[#000080] text-white border-[#000080] shadow-xl -translate-y-1' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>
                  <i className={`fas ${toneIcons[v.tone] || 'fa-tag'}`}></i> {v.tone}
                </button>
              ))}
            </div>
          )}

          <div className="relative group/editor">
            {!needsTranslation && (
              <div className="flex items-center gap-2 mb-4 opacity-0 group-hover/editor:opacity-100 transition-opacity bg-white shadow-2xl p-2 rounded-2xl w-fit border border-slate-100 absolute -top-16 left-0 z-10">
                <button onClick={() => applyFormat('bold')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition text-slate-600 hover:text-[#000080]" title="Bold"><i className="fas fa-bold"></i></button>
                <button onClick={() => applyFormat('italic')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition text-slate-600 hover:text-[#000080]" title="Italic"><i className="fas fa-italic"></i></button>
                <button onClick={() => applyFormat('underline')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition text-slate-600 hover:text-[#000080]" title="Underline"><i className="fas fa-underline"></i></button>
                <button onClick={() => applyFormat('strikethrough')} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition text-slate-600 hover:text-[#000080]" title="Strikethrough"><i className="fas fa-strikethrough"></i></button>
              </div>
            )}

            <div className="p-10 bg-slate-50/50 rounded-[2.5rem] border-2 border-transparent min-h-[180px] relative flex flex-col justify-center group-hover/editor:border-[#000080]/10 transition-all focus-within:bg-white focus-within:shadow-inner">
              {isTranslating && (
                  <div className="absolute inset-0 bg-white/70 backdrop-blur-md flex items-center justify-center z-10 rounded-[2.5rem] animate-in fade-in duration-300">
                      <div className="flex flex-col items-center gap-4">
                          <i className="fas fa-language text-[#000080] text-4xl animate-bounce"></i>
                          <span className="text-[10px] font-black text-[#000080] uppercase tracking-[0.4em] animate-pulse">Linguistic Bridge Node Active</span>
                      </div>
                  </div>
              )}
              
              {needsTranslation ? (
                  <div className="flex flex-col items-center justify-center space-y-6 py-10 animate-in fade-in zoom-in duration-500">
                      <div className="w-20 h-20 bg-[#000080]/5 rounded-3xl flex items-center justify-center text-[#000080]/40">
                          <i className="fas fa-language text-4xl"></i>
                      </div>
                      <div className="text-center">
                          <p className="text-sm font-black text-slate-800 uppercase tracking-widest mb-2">Regional Matrix Required</p>
                          <p className="text-[11px] font-bold text-slate-400">Gemini will synthesize regional nuances for you.</p>
                      </div>
                      <button 
                          onClick={() => viewLanguage === 'Indic' ? handleIndicTranslate() : handleTranslate(viewLanguage)}
                          className="px-10 py-4 bg-[#000080] hover:bg-[#FF9933] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-xl flex items-center gap-4 active:scale-95"
                      >
                          <i className="fas fa-bolt"></i> SYNC LANGUAGE
                      </button>
                  </div>
              ) : (
                  <div 
                    ref={editorRef}
                    contentEditable
                    className="text-slate-800 font-bold text-lg leading-relaxed whitespace-pre-wrap outline-none transition-colors"
                    style={{ minHeight: '100px' }}
                  />
              )}
            </div>
          </div>

          <DataVisualization graphic={post.dataGraphic} />
          
          <div className="pt-10 border-t border-slate-100 flex flex-wrap justify-between items-center gap-8">
             <div className="flex flex-wrap gap-2">
                {post.suggestedHashtags.map(h => (
                  <span key={h} className="text-[10px] font-black text-slate-500 bg-slate-100 px-4 py-1.5 rounded-xl hover:text-white hover:bg-[#000080] transition-all cursor-pointer tracking-tight">#{h}</span>
                ))}
             </div>
             <div className="flex gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(editorRef.current?.innerText || displayContent);
                  }} 
                  className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center hover:text-[#000080] hover:bg-[#000080]/5 transition-all active:scale-90"
                  title="Copy Content"
                >
                  <i className="far fa-copy text-lg"></i>
                </button>
                <button 
                  className="w-14 h-14 rounded-2xl bg-[#000080] text-white flex items-center justify-center hover:bg-[#138808] hover:scale-105 hover:shadow-2xl transition-all active:scale-90 shadow-xl"
                  title="Direct Post"
                >
                  <i className="fas fa-paper-plane text-lg"></i>
                </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const EngagementChart: React.FC<{ suggestions: PostSuggestion[] }> = ({ suggestions }) => {
  const data = [
    { name: 'HIGH', value: suggestions.filter(s => s.engagementLevel === 'High').length, color: '#138808' },
    { name: 'MEDIUM', value: suggestions.filter(s => s.engagementLevel === 'Medium').length, color: '#FF9933' },
    { name: 'STABLE', value: suggestions.filter(s => s.engagementLevel === 'Low').length, color: '#000080' },
  ].filter(d => d.value > 0);

  return (
    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 group hover:border-[#138808]/30 transition-all">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Engagement Pulse</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Algorithmic Reach Prediction</p>
        </div>
        <div className="w-12 h-12 bg-[#138808]/10 rounded-2xl flex items-center justify-center text-[#138808]">
           <i className="fas fa-chart-line text-xl"></i>
        </div>
      </div>
      <div className="h-60 relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} innerRadius={65} outerRadius={90} paddingAngle={8} dataKey="value" stroke="none">
              {data.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <RechartsTooltip 
              contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '11px', fontWeight: 900 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kalki</span>
           <span className="text-2xl font-black text-[#000080]">{suggestions.length}</span>
           <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Post Nodes</span>
        </div>
      </div>
      <div className="flex justify-center gap-8 mt-10">
        {data.map(d => (
          <div key={d.name} className="flex flex-col items-center gap-2">
            <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></span>
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{d.name}</span>
            <span className="text-xs font-black text-slate-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PulseEngine: React.FC<{ userBrand: UserBrand, onRefresh: (feed: string) => void, loading: boolean }> = ({ userBrand, onRefresh, loading }) => {
  const [pulseText, setPulseText] = useState('');
  return (
    <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[#FF9933]/5 to-transparent rounded-full -mr-32 -mt-32 blur-3xl"></div>
      
      <div className="flex items-center gap-5 mb-10">
        <div className="w-14 h-14 bg-[#FF9933]/10 text-[#FF9933] rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
           <i className="fas fa-bolt text-2xl"></i>
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Social Pulse Input</h3>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">RP Identity Sync Engine</p>
        </div>
      </div>
      
      <div className="relative">
        <textarea 
          value={pulseText}
          onChange={(e) => setPulseText(e.target.value)}
          placeholder="Paste recent post activity from X or Facebook here to calibrate Kalki's engine to your style..."
          className="w-full h-44 p-8 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-sm font-bold focus:border-[#000080] focus:bg-white outline-none transition-all placeholder:text-slate-300 resize-none shadow-inner"
        />
        <div className="absolute bottom-6 right-6 flex items-center gap-2 text-[9px] font-black text-slate-300 uppercase tracking-widest">
           <i className="fas fa-quote-right opacity-20 text-4xl absolute -bottom-2 -right-2"></i>
           Stylesync Active
        </div>
      </div>
      
      <button 
        disabled={loading || !pulseText.trim()}
        onClick={() => onRefresh(pulseText)}
        className="mt-8 w-full bg-[#000080] hover:bg-[#138808] text-white font-black py-6 rounded-2xl uppercase text-xs tracking-[0.3em] transition-all shadow-2xl flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 group"
      >
        {loading ? <i className="fas fa-dharmachakra animate-spin text-lg"></i> : <i className="fas fa-sync-alt group-hover:rotate-180 transition-transform duration-700"></i>}
        {loading ? 'CALIBRATING ENGINE...' : 'CALIBRATE KALKI'}
      </button>
    </div>
  );
};

const App: React.FC = () => {
  const [userBrand, setUserBrand] = useState<UserBrand | null>(null);
  const [activeTab, setActiveTab] = useState('strategy');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [trends, setTrends] = useState<RegionalTrends | null>(null);
  const [briefing, setBriefing] = useState<StrategicBriefing | null>(null);
  const [suggestions, setSuggestions] = useState<PostSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const chatRef = useRef<Chat | null>(null);

  const handleAuth = async (platform: string, location: { city: string, state: string, country: string, latitude?: number, longitude?: number }) => {
    setLoading(true);
    const mockBrand: UserBrand = {
      name: 'Rakesh Prasad', description: 'Atma Nirbhar tech creator pioneering the Digital India wave.',
      location, pastPosts: [], visualStyles: ['Cinematic', 'Vibrant'], profileImages: [], primaryPlatform: platform as any
    };
    try {
      const brandAnalysis = await analyzeBrandVoice(mockBrand);
      const briefingData = await getStrategicBriefing(mockBrand, brandAnalysis);
      const trendsData = await fetchDetailedTrends(mockBrand);
      const suggestionData = await generateDailySuggestions(mockBrand, brandAnalysis);

      setUserBrand(mockBrand); setAnalysis(brandAnalysis); setBriefing(briefingData);
      setTrends(trendsData); setSuggestions(suggestionData.suggestions);
      chatRef.current = createManagerChat(mockBrand, brandAnalysis);
      setChatMessages([{ role: 'model', text: 'Namaste Rakesh! Kalki Engine is online. I have analyzed regional clusters and your brand vector. Calibrate me in the Pulse tab for pinpoint accuracy.' }]);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const refreshWithPulse = async (feed: string) => {
    if (!userBrand || !analysis) return;
    setLoading(true);
    try {
      const updatedBrand = { ...userBrand, recentActivityFeed: feed };
      const newSuggestions = await generateDailySuggestions(updatedBrand, analysis);
      setSuggestions(newSuggestions.suggestions);
      setActiveTab('queue');
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatRef.current) return;
    const msg = chatInput; setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: msg }]);
    try {
      const response = await chatRef.current.sendMessage({ message: msg });
      setChatMessages(prev => [...prev, { role: 'model', text: response.text || "Synchronizing data nodes..." }]);
    } catch(e) { console.error(e); }
  };

  if (loading && !userBrand) return (
    <div className="min-h-screen bg-[#000080] flex flex-col items-center justify-center text-white p-10">
       <div className="relative mb-12">
          <i className="fas fa-dharmachakra text-9xl chakra-spin opacity-10"></i>
          <div className="absolute inset-0 flex items-center justify-center">
             <i className="fas fa-bolt text-4xl text-[#FF9933] animate-pulse"></i>
          </div>
       </div>
       <h2 className="text-3xl font-black uppercase tracking-[0.4em] text-center animate-pulse">Initializing <span className="text-[#FF9933]">Kalki</span> Engine</h2>
       <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-6 text-white/40">Syncing Regional Identity Clusters...</p>
    </div>
  );

  if (!userBrand) return <AuthScreen onAuth={handleAuth} />;

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-[#000080] selection:text-white">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 lg:p-12 flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-12">
          {activeTab === 'strategy' && briefing && (
            <section className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-700">
              <div className="bg-white rounded-[2.5rem] p-12 shadow-xl border border-slate-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#000080]/5 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tighter mb-8 flex items-center gap-4">
                    <span className="w-10 h-10 bg-[#FF9933]/10 text-[#FF9933] rounded-2xl flex items-center justify-center text-base"><i className="fas fa-chess-knight"></i></span>
                    Strategic Blueprint for RP
                  </h3>
                  <div className="space-y-6">
                    <p className="text-slate-600 text-base leading-relaxed font-medium">{briefing.overview}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                      {briefing.keyGoals.map((g, i) => (
                        <div key={i} className="flex gap-6 p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100 group hover:border-[#FF9933]/30 hover:bg-white transition-all duration-500 shadow-sm hover:shadow-xl">
                          <span className="text-4xl font-black text-slate-200 group-hover:text-[#FF9933]/20 transition-colors">0{i+1}</span>
                          <p className="text-sm font-bold text-slate-700 leading-snug">{g}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <EngagementChart suggestions={suggestions} />
            </section>
          )}

          {activeTab === 'pulse' && (
            <section className="space-y-10 animate-in fade-in zoom-in duration-500">
              <PulseEngine userBrand={userBrand} onRefresh={refreshWithPulse} loading={loading} />
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200">
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter mb-8 flex items-center gap-4">
                    <span className="w-10 h-10 bg-[#138808]/10 text-[#138808] rounded-2xl flex items-center justify-center text-base"><i className="fas fa-fingerprint"></i></span>
                    Brand Vector Keywords
                 </h3>
                 <div className="flex flex-wrap gap-3">
                    {analysis?.styleKeywords.map(k => (
                      <span key={k} className="px-6 py-3 bg-slate-50 text-[#000080] rounded-2xl text-[11px] font-black uppercase tracking-widest border border-slate-100 hover:border-[#FF9933] hover:bg-white transition-all shadow-sm">
                        {k}
                      </span>
                    ))}
                 </div>
              </div>
            </section>
          )}

          {activeTab === 'trends' && trends && (
            <section className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in slide-in-from-right-8 duration-700">
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 group hover:border-[#FF9933]/30 transition-all">
                <h3 className="font-black text-slate-800 text-lg mb-8 uppercase tracking-tighter flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#FF9933]/10 text-[#FF9933] rounded-2xl flex items-center justify-center"><i className="fas fa-location-dot"></i></div>
                  Regional Wave
                </h3>
                <div className="space-y-6">
                  {trends.city.map((t, i) => (
                    <div key={i} className="p-7 bg-slate-50 rounded-3xl border-l-[6px] border-[#FF9933] hover:shadow-xl hover:bg-white transition-all duration-300">
                      <h4 className="font-black text-slate-800 text-base mb-2">{t.title}</h4>
                      <p className="text-[10px] text-slate-400 font-black leading-tight uppercase tracking-wider">{t.context}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-200 group hover:border-[#138808]/30 transition-all">
                <h3 className="font-black text-slate-800 text-lg mb-8 uppercase tracking-tighter flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#138808]/10 text-[#138808] rounded-2xl flex items-center justify-center"><i className="fas fa-flag"></i></div>
                  Bharat Pulse
                </h3>
                <div className="space-y-6">
                  {trends.national.map((t, i) => (
                    <div key={i} className="p-7 bg-slate-50 rounded-3xl border-l-[6px] border-[#138808] hover:shadow-xl hover:bg-white transition-all duration-300">
                      <h4 className="font-black text-slate-800 text-base mb-2">{t.title}</h4>
                      <p className="text-[10px] text-slate-400 font-black leading-tight uppercase tracking-wider">{t.context}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {activeTab === 'queue' && suggestions.length > 0 && (
            <section className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              <div className="flex items-center justify-between px-2">
                <div>
                  <h3 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Broadcast Queue</h3>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Ready for Digital Bharat Release</p>
                </div>
                {loading && <i className="fas fa-dharmachakra animate-spin text-[#000080] text-2xl"></i>}
              </div>
              <div className="grid grid-cols-1 gap-14">
                {suggestions.map(p => <SuggestionCard key={p.id} post={p} />)}
              </div>
            </section>
          )}
        </div>

        <div className="w-full lg:w-96 space-y-8">
          <div className="bg-white rounded-[3rem] shadow-2xl border border-slate-100 flex flex-col h-[700px] overflow-hidden sticky top-32 group/chat">
            <div className="p-10 bg-[#000080] text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12 group-hover/chat:rotate-0 transition-transform duration-700">
                 <i className="fas fa-dharmachakra text-7xl chakra-spin"></i>
              </div>
              <div className="relative z-10">
                <h3 className="font-black text-sm uppercase tracking-[0.3em]">Kalki Neural</h3>
                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-[#138808] animate-pulse"></div>
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Engine Online</span>
                </div>
              </div>
            </div>
            
            <div className="flex-1 p-8 overflow-y-auto space-y-6 bg-slate-50/50">
              {chatMessages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-4 duration-300`}>
                  <div className={`max-w-[85%] px-6 py-4 rounded-[2rem] text-[12px] font-bold shadow-sm ${m.role === 'user' ? 'bg-[#FF9933] text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'}`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-white">
              <div className="flex gap-3 bg-slate-50 rounded-2xl p-2.5 items-center focus-within:ring-[12px] focus-within:ring-[#000080]/5 transition-all">
                <input 
                  value={chatInput} 
                  onChange={e => setChatInput(e.target.value)} 
                  onKeyDown={e => e.key === 'Enter' && handleSendMessage()} 
                  placeholder="Ask for RP strategy tips..." 
                  className="flex-1 bg-transparent rounded-xl px-4 py-3 text-sm font-bold outline-none placeholder:text-slate-300" 
                />
                <button onClick={handleSendMessage} className="w-12 h-12 bg-[#000080] text-white rounded-2xl flex items-center justify-center transition-all hover:bg-[#FF9933] hover:shadow-lg active:scale-90">
                  <i className="fas fa-paper-plane text-xs"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
