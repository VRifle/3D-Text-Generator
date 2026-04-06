import React, { useState, useRef, Suspense, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text3D, Center, Grid, Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';
import { STLExporter, TTFLoader, FontLoader } from 'three-stdlib';
import JSZip from 'jszip';
import { Download, ChevronDown, Check, Maximize, AlertTriangle, X, Link as LinkIcon, Mail, Loader2, CheckCircle2, Smartphone } from 'lucide-react';
import { suspend } from 'suspend-react';

// Custom hook to correctly load and parse TTF fonts
// TTFLoader.load in three-stdlib has a bug where it returns the opentype.js font instead of the parsed JSON
const useTTFFont = (url: string) => {
  return suspend(async () => {
    const res = await fetch(url);
    const arrayBuffer = await res.arrayBuffer();
    const loader = new TTFLoader();
    const json = loader.parse(arrayBuffer);
    return json;
  }, [url]);
};

const FONTS = [
  { name: 'Pacifico', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/pacifico/Pacifico-Regular.ttf', css: 'Pacifico' },
  { name: 'Bangers', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/bangers/Bangers-Regular.ttf', css: 'Bangers' },
  { name: 'Lobster', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/lobster/Lobster-Regular.ttf', css: 'Lobster' },
  { name: 'Righteous', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/righteous/Righteous-Regular.ttf', css: 'Righteous' },
  { name: 'Audiowide', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/audiowide/Audiowide-Regular.ttf', css: 'Audiowide' },
  { name: 'VT323', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/vt323/VT323-Regular.ttf', css: 'VT323' },
  { name: 'Press Start 2P', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/pressstart2p/PressStart2P-Regular.ttf', css: '"Press Start 2P"' },
  { name: 'Anton', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/anton/Anton-Regular.ttf', css: 'Anton' },
  { name: 'Bebas Neue', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/bebasneue/BebasNeue-Regular.ttf', css: '"Bebas Neue"' },
  { name: 'Creepster', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/creepster/Creepster-Regular.ttf', css: 'Creepster' },
  { name: 'Fascinate', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/fascinate/Fascinate-Regular.ttf', css: 'Fascinate' },
  { name: 'Monoton', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/monoton/Monoton-Regular.ttf', css: 'Monoton' },
  { name: 'Russo One', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/russoone/RussoOne-Regular.ttf', css: '"Russo One"' },
  { name: 'Sigmar One', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/sigmarone/SigmarOne-Regular.ttf', css: '"Sigmar One"' },
  { name: 'Titan One', url: 'https://raw.githubusercontent.com/google/fonts/main/ofl/titanone/TitanOne-Regular.ttf', css: '"Titan One"' },
];

type LayerConfig = {
  text: string;
  fontUrl: string;
  size: number;
  depth: number;
  letterSpacing: number;
  xOffset: number;
  yOffset: number;
  zOffset: number;
  color: string;
};

const defaultLayer1: LayerConfig = {
  text: 'BASE',
  fontUrl: FONTS[0].url,
  size: 5.2,
  depth: 0.5,
  letterSpacing: -0.15,
  xOffset: 0,
  yOffset: 0,
  zOffset: 0,
  color: '#4f46e5',
};

const defaultLayer2: LayerConfig = {
  text: 'TOP',
  fontUrl: FONTS[3].url,
  size: 2,
  depth: 0.5,
  letterSpacing: 0,
  xOffset: 0,
  yOffset: 0,
  zOffset: 0.5,
  color: '#ec4899',
};

const FontSelect = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedFont = FONTS.find(f => f.url === value) || FONTS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-white/60 rounded-2xl text-sm bg-white/50 flex justify-between items-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] hover:bg-white/70 transition-all outline-none focus:ring-2 focus:ring-blue-400/40"
        style={{ fontFamily: selectedFont.css }}
      >
        <span className="truncate text-xl text-gray-800" style={{ fontFamily: selectedFont.css }}>{selectedFont.name}</span>
        <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] max-h-60 overflow-auto p-1">
          {FONTS.map(font => (
            <button
              key={font.url}
              type="button"
              onClick={() => { onChange(font.url); setIsOpen(false); }}
              className="w-full text-left px-4 py-3 hover:bg-gray-100 rounded-xl flex items-center justify-between transition-colors"
            >
              <span className="truncate text-xl text-gray-900" style={{ fontFamily: font.css }}>{font.name}</span>
              {value === font.url && <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const LayerControls = ({ title, layer, setLayer, isBaseLayer = false }: { title: string, layer: LayerConfig, setLayer: React.Dispatch<React.SetStateAction<LayerConfig>>, isBaseLayer?: boolean }) => {
  const handleChange = (field: keyof LayerConfig, value: string | number) => {
    setLayer(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-5 md:p-6 space-y-4 md:space-y-5 relative">
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/40 to-transparent pointer-events-none rounded-3xl" />
      
      <h3 className="font-semibold text-gray-800 text-lg tracking-tight relative z-10">{title}</h3>
      
      <div className="relative z-10">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Text</label>
        <input 
          type="text" 
          value={layer.text} 
          onChange={e => handleChange('text', e.target.value)}
          className="w-full px-4 py-2.5 border border-white/60 rounded-2xl text-sm focus:ring-2 focus:ring-blue-400/40 focus:border-blue-400/50 bg-white/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] transition-all outline-none text-gray-800 font-medium"
        />
      </div>

      <div className="relative z-50">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Schriftart</label>
        <FontSelect value={layer.fontUrl} onChange={val => handleChange('fontUrl', val)} />
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Größe</label>
          {isBaseLayer ? (
            <div className="flex items-center justify-center h-[38px] bg-white/40 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <span className="text-sm font-mono font-bold text-gray-700">5.2 <span className="text-[10px] font-normal text-gray-400 ml-1">(Fixiert)</span></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <input 
                type="range" min="0.1" max="10" step="0.1" 
                value={layer.size} 
                onChange={e => handleChange('size', parseFloat(e.target.value))}
                className="w-full accent-gray-800"
              />
              <input 
                type="number" 
                value={layer.size}
                onChange={e => handleChange('size', parseFloat(e.target.value) || 0.1)}
                className="w-12 text-xs px-1 py-1 border border-white/60 rounded-xl text-right font-mono bg-white/50 shadow-sm outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Tiefe</label>
          {isBaseLayer ? (
            <div className="flex flex-col gap-2">
              <div className="flex gap-1 bg-white/40 p-1 rounded-xl border border-white/60">
                {[
                  { label: 'Stehend', value: 2.5, desc: 'Buchstaben stehend' },
                  { label: 'Türschild', value: 1.3, desc: 'Türschild' },
                  { label: 'Anhänger', value: 0.5, desc: 'Schlüsselanhänger' }
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleChange('depth', opt.value)}
                    className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                      layer.depth === opt.value 
                        ? 'bg-gray-800 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-white/60'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="text-[8px] text-gray-400 font-medium text-center italic">
                {layer.depth === 2.5 ? 'Buchstaben stehend (2.5mm)' : 
                 layer.depth === 1.3 ? 'Türschild (1.3mm)' : 
                 layer.depth === 0.5 ? 'Schlüsselanhänger (0.5mm)' : 
                 `${layer.depth.toFixed(1)} mm`}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
              <input 
                type="range" min="0.1" max="5" step="0.1" 
                value={layer.depth} 
                onChange={e => handleChange('depth', parseFloat(e.target.value))}
                className="w-full accent-gray-800"
              />
              <input 
                type="number" 
                value={layer.depth}
                onChange={e => handleChange('depth', parseFloat(e.target.value) || 0.1)}
                className="w-12 text-xs px-1 py-1 border border-white/60 rounded-xl text-right font-mono bg-white/50 shadow-sm outline-none focus:ring-2 focus:ring-blue-400/40"
              />
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Buchstabenabstand</label>
        <div className="flex items-center gap-2 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <input 
            type="range" min="-0.5" max="1" step="0.01" 
            value={layer.letterSpacing} 
            onChange={e => handleChange('letterSpacing', parseFloat(e.target.value))}
            className="w-full accent-gray-800"
          />
          <input 
            type="number" 
            value={layer.letterSpacing}
            onChange={e => handleChange('letterSpacing', parseFloat(e.target.value) || 0)}
            className="w-16 text-xs px-1 py-1 border border-white/60 rounded-xl text-right font-mono bg-white/50 shadow-sm outline-none focus:ring-2 focus:ring-blue-400/40"
          />
        </div>
      </div>

      <div className="space-y-3 relative z-10">
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Positionierung</label>
        
        <div className="flex items-center gap-3 bg-white/40 p-2.5 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <span className="text-[9px] font-bold text-red-400 w-20 uppercase">Links-Rechts</span>
          <input 
            type="range" min="-20" max="20" step="0.01" 
            value={layer.xOffset} 
            onChange={e => handleChange('xOffset', parseFloat(e.target.value))}
            className="flex-1 accent-red-400"
          />
          <input 
            type="number" 
            step="0.01"
            value={layer.xOffset}
            onChange={e => handleChange('xOffset', parseFloat(e.target.value) || 0)}
            className="w-16 text-xs px-2 py-1.5 border border-white/60 rounded-xl text-right font-mono bg-white/50 shadow-sm outline-none focus:ring-2 focus:ring-red-400/40"
          />
        </div>

        <div className="flex items-center gap-3 bg-white/40 p-2.5 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <span className="text-[9px] font-bold text-green-500 w-20 uppercase">Hoch-Runter</span>
          <input 
            type="range" min="-20" max="20" step="0.01" 
            value={layer.yOffset} 
            onChange={e => handleChange('yOffset', parseFloat(e.target.value))}
            className="flex-1 accent-green-500"
          />
          <input 
            type="number" 
            step="0.01"
            value={layer.yOffset}
            onChange={e => handleChange('yOffset', parseFloat(e.target.value) || 0)}
            className="w-16 text-xs px-2 py-1.5 border border-white/60 rounded-xl text-right font-mono bg-white/50 shadow-sm outline-none focus:ring-2 focus:ring-green-500/40"
          />
        </div>

        <div className="flex items-center gap-3 bg-white/40 p-2.5 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
          <span className="text-[9px] font-bold text-blue-500 w-20 uppercase">Vor-Zurück</span>
          <input 
            type="range" min="-20" max="20" step="0.01" 
            value={layer.zOffset} 
            onChange={e => handleChange('zOffset', parseFloat(e.target.value))}
            className="flex-1 accent-blue-500"
          />
          <input 
            type="number" 
            step="0.01"
            value={layer.zOffset}
            onChange={e => handleChange('zOffset', parseFloat(e.target.value) || 0)}
            className="w-16 text-xs px-2 py-1.5 border border-white/60 rounded-xl text-right font-mono bg-white/50 shadow-sm outline-none focus:ring-2 focus:ring-blue-500/40"
          />
        </div>
      </div>

      <div className="relative z-10">
        <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">Farbe</label>
        <div className="flex items-center gap-3 bg-white/40 p-2 rounded-2xl border border-white/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)] w-max">
          <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-sm border border-black/10">
            <input 
              type="color" 
              value={layer.color} 
              onChange={e => handleChange('color', e.target.value)}
              className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer border-0 p-0"
            />
          </div>
          <span className="text-xs text-gray-600 font-mono pr-2">{layer.color.toUpperCase()}</span>
        </div>
      </div>
    </div>
  );
};

const TTFText3D = ({ fontUrl, text, color, size, depth, ...props }: any) => {
  const fontData = useTTFFont(fontUrl);
  
  return (
    <Text3D 
      font={fontData as any} 
      size={size} 
      height={depth}
      curveSegments={12}
      bevelEnabled
      bevelThickness={0.02}
      bevelSize={0.02}
      bevelOffset={0}
      bevelSegments={3}
      castShadow
      receiveShadow
      {...props}
    >
      {text}
      <meshPhysicalMaterial 
        color={color} 
        roughness={0.2} 
        metalness={0.1} 
        clearcoat={0.8}
        clearcoatRoughness={0.2}
      />
    </Text3D>
  );
};

const Eyelet = ({ position, color, depth, size = 1 }: { position: [number, number, number], color: string, depth: number, size?: number }) => {
  return (
    <group position={position} scale={[size, size, size]}>
      {/* The thick ring (O-shape) - oriented for front view */}
      <mesh castShadow receiveShadow>
        <torusGeometry args={[0.4, 0.18, 16, 48]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.1} 
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>
      {/* Horizontal connection bridge to the right */}
      <mesh position={[0.4, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.5, 0.4, depth / size]} />
        <meshPhysicalMaterial 
          color={color} 
          roughness={0.2} 
          metalness={0.1} 
          clearcoat={0.8}
          clearcoatRoughness={0.2}
        />
      </mesh>
    </group>
  );
};

export default function App() {
  const [layer1, setLayer1] = useState<LayerConfig>(defaultLayer1);
  const [layer2, setLayer2] = useState<LayerConfig>(defaultLayer2);
  const [showMobilePrompt, setShowMobilePrompt] = useState(false);
  const [isWarningMinimized, setIsWarningMinimized] = useState(false);
  const [isKeychainEnabled, setIsKeychainEnabled] = useState(false);
  const [keychainPos, setKeychainPos] = useState<[number, number, number] | null>(null);
  const [keychainSize, setKeychainSize] = useState(1);
  const [isPlacingKeychain, setIsPlacingKeychain] = useState(false);
  const [layer1Bounds, setLayer1Bounds] = useState<THREE.Box3 | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);
  const [showIframePrompt, setShowIframePrompt] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    // Detect iframe
    const inIframe = window.self !== window.top;
    setIsInIframe(inIframe);
    
    // Show prompt if in iframe and on mobile
    if (inIframe && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
      setShowIframePrompt(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Default position calculation if none set
  useEffect(() => {
    if (isKeychainEnabled && !keychainPos && layer1Bounds) {
      setKeychainPos([
        layer1Bounds.min.x + layer1.xOffset - 0.6, 
        (layer1Bounds.min.y + layer1Bounds.max.y) / 2 + layer1.yOffset, 
        layer1.zOffset + layer1.depth / 2
      ]);
    }
  }, [isKeychainEnabled, layer1Bounds, layer1.xOffset, layer1.yOffset, layer1.zOffset, layer1.depth, keychainPos]);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Anton&family=Audiowide&family=Bangers&family=Bebas+Neue&family=Creepster&family=Fascinate&family=Lobster&family=Monoton&family=Pacifico&family=Press+Start+2P&family=Righteous&family=Russo+One&family=Sigmar+One&family=Titan+One&family=VT323&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    // Check if mobile on load
    if (window.innerWidth < 768) {
      setShowMobilePrompt(true);
    }
  }, []);

  const enterFullscreen = () => {
    const elem = document.documentElement as any;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch((err: any) => console.log(err));
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
    setShowMobilePrompt(false);
  };

  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const sendSTL = async () => {
    if (groupRef.current) {
      setIsSending(true);
      setSendError(null);
      setSendSuccess(false);

      try {
        const exporter = new STLExporter();
        const stlString = exporter.parse(groupRef.current);
        
        // Create ZIP archive
        const zip = new JSZip();
        const stlFilename = `3d-text-${layer1.text}-${layer2.text}.stl`;
        zip.file(stlFilename, stlString);
        
        // Compress with high level
        const zipBlob = await zip.generateAsync({
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 9 }
        });
        
        // Convert ZIP blob to base64
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
          };
        });
        
        reader.readAsDataURL(zipBlob);
        const base64Data = await base64Promise;

        const response = await fetch('/api/send-stl', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: `3d-text-${layer1.text}-${layer2.text}.zip`,
            base64Data,
            text1: layer1.text,
            text2: layer2.text
          }),
        });

        if (response.status === 413) {
          setSendError('Datei zu groß für den Versand (Limit 50MB)');
          return;
        }

        const result = await response.json();

        if (response.ok) {
          setSendSuccess(true);
          setTimeout(() => setSendSuccess(false), 5000);
        } else {
          setSendError(result.error || 'Fehler beim Senden');
          setTimeout(() => setSendError(null), 5000);
        }
      } catch (err: any) {
        setSendError('Netzwerkfehler oder Server nicht erreichbar');
        setTimeout(() => setSendError(null), 5000);
      } finally {
        setIsSending(false);
      }
    }
  };

  const exportSTL = () => {
    if (groupRef.current) {
      const exporter = new STLExporter();
      const stlString = exporter.parse(groupRef.current);
      const blob = new Blob([stlString], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = url;
      link.download = '3d-text-model.stl';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-[#f8fafc] font-sans overflow-hidden relative selection:bg-blue-200">
      {/* Mobile Fullscreen Prompt */}
      {showMobilePrompt && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4 border border-white/20">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
              <Maximize className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Optimales Erlebnis</h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Um den VRifle 3D Text Generator auf dem Smartphone optimal zu genießen, empfehlen wir den Vollbildmodus.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <button 
                onClick={enterFullscreen}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                Im Vollbild öffnen
              </button>
              <button 
                onClick={() => setShowMobilePrompt(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Nein danke, so lassen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Iframe Open Standalone Prompt */}
      {showIframePrompt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
                <Maximize className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">App-Modus nutzen</h3>
                <p className="text-[10px] text-gray-500 font-medium">Öffnen, um die App zu installieren oder Vollbild zu nutzen.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowIframePrompt(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={() => window.open(window.location.href, '_blank')}
                className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95"
              >
                Öffnen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PWA Install Prompt */}
      {showInstallPrompt && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-white/80 backdrop-blur-xl border border-white/60 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-lg">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">App installieren</h3>
                <p className="text-[10px] text-gray-500 font-medium">Für schnellen Zugriff zum Home-Bildschirm hinzufügen.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowInstallPrompt(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <button 
                onClick={handleInstallClick}
                className="bg-gray-900 text-white px-4 py-2 rounded-2xl text-xs font-bold shadow-md hover:bg-black transition-all active:scale-95"
              >
                Installieren
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decorative Background Blobs for Glassmorphism */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-200/40 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-purple-200/40 blur-[120px] pointer-events-none" />

      {/* Sidebar */}
      <div className="w-full h-[55vh] md:h-full md:w-[420px] bg-white/40 backdrop-blur-2xl border-t md:border-t-0 md:border-r border-white/60 flex flex-col overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.04)] md:shadow-[10px_0_40px_rgba(0,0,0,0.04)] z-10 relative order-2 md:order-1">
        <div className="p-4 md:p-6 border-b border-white/40 bg-white/30 sticky top-0 z-20 flex justify-between items-center backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-start">
              <img src="/logo.png" alt="VRifle" className="h-5 md:h-7 object-contain mb-1" />
              <span className="text-gray-500 font-bold text-[9px] md:text-[11px] tracking-[0.2em] uppercase">3D Text Generator</span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button 
              onClick={sendSTL}
              disabled={isSending}
              className={`${
                sendSuccess 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : sendError 
                    ? 'bg-red-500 hover:bg-red-600' 
                    : 'bg-gray-900 hover:bg-black'
              } text-white px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed`}
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : sendSuccess ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              {isSending ? 'Sende...' : sendSuccess ? 'Gesendet!' : 'Datei senden'}
            </button>
            {sendError && (
              <span className="text-[10px] text-red-500 font-bold animate-pulse mr-2">
                {sendError}
              </span>
            )}
          </div>
        </div>
        
        <div className="p-4 md:p-6 space-y-6 md:space-y-8 flex flex-col">
            {/* Keychain Controls */}
            <div className="bg-white/50 backdrop-blur-xl rounded-3xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-4 space-y-4 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-50/40 to-transparent pointer-events-none" />
              
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${isKeychainEnabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Schlüsselanhänger</h4>
                    <p className="text-[10px] text-gray-500 font-medium tracking-tight uppercase">Öse hinzufügen</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsKeychainEnabled(!isKeychainEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none z-10 ${isKeychainEnabled ? 'bg-blue-500' : 'bg-gray-200'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isKeychainEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {isKeychainEnabled && (
                <div className="space-y-4 pt-2 border-t border-white/40 relative z-10">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Positionierung</label>
                      <button 
                        onClick={() => setIsPlacingKeychain(!isPlacingKeychain)}
                        className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-2 ${
                          isPlacingKeychain 
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-200 animate-pulse' 
                          : 'bg-white/60 text-gray-700 border border-white/80 hover:bg-white/80'
                        }`}
                      >
                        {isPlacingKeychain ? 'Klick...' : 'Per Klick'}
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Größe</label>
                      <div className="flex items-center gap-2 bg-white/40 p-1.5 rounded-xl border border-white/60">
                        <input 
                          type="range" min="0.5" max="3" step="0.1" 
                          value={keychainSize} 
                          onChange={e => setKeychainSize(parseFloat(e.target.value))}
                          className="flex-1 accent-blue-500 h-1.5"
                        />
                        <span className="text-[9px] font-mono text-gray-500 w-6 text-right">{keychainSize.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">Manuelle Positionierung</label>
                    
                    <div className="flex items-center gap-3 bg-white/40 px-2 py-1.5 rounded-xl border border-white/60">
                      <span className="text-[8px] font-bold text-red-400 w-16 uppercase">Links-Rechts</span>
                      <input 
                        type="range" min="-20" max="20" step="0.01" 
                        value={keychainPos?.[0] || 0} 
                        onChange={e => setKeychainPos([parseFloat(e.target.value), keychainPos?.[1] || 0, keychainPos?.[2] || 0])}
                        className="flex-1 accent-red-400 h-1.5"
                      />
                      <span className="text-[9px] font-mono text-gray-500 w-10 text-right">{(keychainPos?.[0] || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-white/40 px-2 py-1.5 rounded-xl border border-white/60">
                      <span className="text-[8px] font-bold text-green-500 w-16 uppercase">Hoch-Runter</span>
                      <input 
                        type="range" min="-20" max="20" step="0.01" 
                        value={keychainPos?.[1] || 0} 
                        onChange={e => setKeychainPos([keychainPos?.[0] || 0, parseFloat(e.target.value), keychainPos?.[2] || 0])}
                        className="flex-1 accent-green-500 h-1.5"
                      />
                      <span className="text-[9px] font-mono text-gray-500 w-10 text-right">{(keychainPos?.[1] || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-white/40 px-2 py-1.5 rounded-xl border border-white/60">
                      <span className="text-[8px] font-bold text-blue-500 w-16 uppercase">Vor-Zurück</span>
                      <input 
                        type="range" min="-20" max="20" step="0.01" 
                        value={keychainPos?.[2] || 0} 
                        onChange={e => setKeychainPos([keychainPos?.[0] || 0, keychainPos?.[1] || 0, parseFloat(e.target.value)])}
                        className="flex-1 accent-blue-500 h-1.5"
                      />
                      <span className="text-[9px] font-mono text-gray-500 w-10 text-right">{(keychainPos?.[2] || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

           <div className="relative z-20">
             <LayerControls title="Ebene 1 (Basis)" layer={layer1} setLayer={setLayer1} isBaseLayer={true} />
           </div>
           <div className="relative z-10">
             {layer1.letterSpacing > -0.05 && (
               <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                 <div className="flex items-start gap-3">
                   <div className="text-amber-500 mt-0.5">
                     <AlertTriangle className="w-5 h-5" />
                   </div>
                   <div>
                     <h4 className="text-sm font-bold text-amber-800">Buchstaben berühren sich nicht!</h4>
                     <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                       Für einen stabilen 3D-Druck müssen die Buchstaben der Basis-Ebene verbunden sein. Bitte verringere den Buchstabenabstand (Ebene 1) auf maximal -0.05, um Ebene 2 freizuschalten.
                     </p>
                   </div>
                 </div>
               </div>
             )}
             <div className={layer1.letterSpacing > -0.05 ? "opacity-40 pointer-events-none transition-opacity duration-300 select-none grayscale-[0.5]" : "transition-opacity duration-300"}>
               <LayerControls title="Ebene 2 (Top)" layer={layer2} setLayer={setLayer2} />
             </div>
           </div>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="w-full h-[45vh] md:h-full md:flex-1 relative z-0 order-1 md:order-2">
         {/* Liquid Glass Warning */}
         <div className={`absolute top-4 z-10 transition-all duration-300 ease-in-out flex justify-center pointer-events-none ${isWarningMinimized ? 'left-4 md:left-auto md:right-6 md:top-6' : 'left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-max md:max-w-lg'}`}>
           <div 
             className={`bg-amber-300/20 backdrop-blur-md border border-amber-300/40 shadow-[0_8px_32px_rgba(251,191,36,0.2)] transition-all duration-300 overflow-hidden relative ${
               isWarningMinimized 
                 ? 'w-12 h-12 rounded-full cursor-pointer pointer-events-auto hover:bg-amber-300/40 flex items-center justify-center' 
                 : 'w-full rounded-2xl p-3 md:p-4 flex items-start gap-3'
             }`}
             onClick={() => isWarningMinimized && setIsWarningMinimized(false)}
             title={isWarningMinimized ? "Warnhinweis anzeigen" : ""}
           >
             {isWarningMinimized ? (
               <AlertTriangle className="w-6 h-6 text-amber-600 drop-shadow-sm" />
             ) : (
               <>
                 <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 drop-shadow-sm" />
                 <div className="pr-6">
                   <p className="text-xs md:text-sm text-amber-900 font-medium leading-relaxed drop-shadow-sm">
                     <strong className="font-bold text-amber-950">Wichtig für den 3D-Druck:</strong> Die Buchstaben der Ebene 1 (Basis) müssen sich zwingend berühren, um ein qualitativ gutes und stabiles Ergebnis zu erhalten.
                   </p>
                 </div>
                 <button 
                   onClick={(e) => { e.stopPropagation(); setIsWarningMinimized(true); }}
                   className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-amber-400/40 text-amber-700 transition-colors pointer-events-auto"
                   title="Minimieren"
                 >
                   <X className="w-4 h-4" />
                 </button>
               </>
             )}
           </div>
         </div>

         <Canvas 
            shadows 
            camera={{ position: [0, 2, 15], fov: 45 }}
          >
            <ambientLight intensity={0.6} />
            <directionalLight position={[10, 10, 10]} intensity={1} castShadow shadow-mapSize={[1024, 1024]} />
            <directionalLight position={[-10, -10, -10]} intensity={0.3} />
            
            <Suspense fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="red" /></mesh>}>
              <Float speed={1.5} rotationIntensity={0.1} floatIntensity={0.5}>
                <group 
                  ref={groupRef}
                  onPointerDown={(e) => {
                    if (isPlacingKeychain) {
                      e.stopPropagation();
                      const point = e.point;
                      setKeychainPos([point.x, point.y, point.z]);
                      setIsPlacingKeychain(false);
                    }
                  }}
                >
                   {/* Layer 1 */}
                   {layer1.text.trim() && (
                     <group>
                       <Center 
                         key={layer1.text + layer1.fontUrl + layer1.size + layer1.letterSpacing}
                         disableZ 
                         position={[layer1.xOffset, layer1.yOffset, layer1.zOffset]}
                         onCentered={({ boundingBox }) => setLayer1Bounds(boundingBox)}
                       >
                         <TTFText3D 
                           fontUrl={layer1.fontUrl} 
                           text={layer1.text}
                           size={layer1.size} 
                           depth={layer1.depth}
                           letterSpacing={layer1.letterSpacing}
                           color={layer1.color}
                         />
                       </Center>
                       {isKeychainEnabled && keychainPos && (
                         <Eyelet 
                           position={keychainPos} 
                           color={layer1.color} 
                           depth={layer1.depth} 
                           size={keychainSize}
                         />
                       )}
                     </group>
                   )}
                   
                   {/* Layer 2 */}
                   {layer2.text.trim() && (
                     <Center disableZ position={[layer2.xOffset, layer2.yOffset, layer2.zOffset]}>
                       <TTFText3D 
                         fontUrl={layer2.fontUrl} 
                         text={layer2.text}
                         size={layer2.size} 
                         depth={layer2.depth}
                         letterSpacing={layer2.letterSpacing}
                         color={layer2.color}
                       />
                     </Center>
                   )}
                </group>
              </Float>
              <ContactShadows position={[0, -3, 0]} opacity={0.7} scale={40} blur={2} far={4} />
            </Suspense>
            
            <Grid infiniteGrid fadeDistance={50} sectionColor="#cbd5e1" cellColor="#e2e8f0" position={[0, -3, 0]} />
            <OrbitControls makeDefault />
            <Environment preset="city" />
         </Canvas>
         
         {/* Desktop Hints */}
         <div className="absolute bottom-6 right-6 bg-white/60 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 text-xs text-gray-600 font-medium pointer-events-none hidden md:flex gap-4">
           <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400"></div> Rotieren: Linksklick</span>
           <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-purple-400"></div> Verschieben: Rechtsklick</span>
           <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-pink-400"></div> Zoom: Scroll</span>
         </div>

         {/* Mobile Hints */}
         <div className="absolute bottom-4 right-4 bg-white/60 backdrop-blur-xl px-3 py-2 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 text-[10px] text-gray-600 font-medium pointer-events-none flex md:hidden flex-col gap-1.5">
           <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div> 1 Finger: Rotieren</span>
           <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-purple-400"></div> 2 Finger: Verschieben</span>
           <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-pink-400"></div> Pinch: Zoom</span>
         </div>
      </div>
    </div>
  );
}
