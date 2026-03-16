import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Archive, 
  Plus, 
  Image as ImageIcon, 
  Send, 
  Search, 
  Settings, 
  History, 
  Menu, 
  X,
  FileText,
  Trash2,
  Aperture,
  Loader2,
  LogOut,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Mic,
  Languages,
  Phone,
  PhoneOff,
  Volume2,
  Timer as TimerIcon,
  Trophy,
  Globe,
  Clock,
  Coffee,
  Play,
  Pause,
  RotateCcw,
  Award,
  ChevronsLeft,
  Sun,
  Moon,
  Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn, formatTime } from './utils';
import { ChatSession, Message, Department, User } from './types';
import { chatWithSpyrisStream, generateFlashcards, generateQuiz } from './services/geminiService';
import { GoogleGenAI, Modality } from "@google/genai";
import { FlashcardViewer } from './components/FlashcardViewer';
import { QuizViewer } from './components/QuizViewer';

const DEPARTMENTS: { id: Department; name: string; color: string }[] = [
  { id: 'Experience', name: 'Level & XP', color: 'bg-yellow-400' },
  { id: 'General', name: 'General', color: 'bg-surge-purple' },
  { id: 'Marks', name: 'Marks Analysis', color: 'bg-amber-500' },
  { id: 'Flashcards', name: 'Flashcards', color: 'bg-blue-500' },
  { id: 'Quizzes', name: 'Quizzes', color: 'bg-pink-500' },
  { id: 'Plan', name: 'Study Plan', color: 'bg-emerald-500' },
  { id: 'Test', name: 'Test Generator', color: 'bg-rose-500' },
  { id: 'Voice', name: 'Voice Chat', color: 'bg-indigo-500' },
  { id: 'Translator', name: 'Translator', color: 'bg-cyan-500' },
  { id: 'Timer', name: 'Study Timer', color: 'bg-orange-500' },
  { id: 'Projects', name: 'Projects', color: 'bg-cyan-500' },
];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light' | 'night' | 'glass'>('dark');

  useEffect(() => {
    document.body.className = '';
    if (theme !== 'dark') {
      document.body.classList.add(theme);
    }
  }, [theme]);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>('General');
  
  // Specialized Department States
  const [marksData, setMarksData] = useState<Record<string, string>>({
    'Algebra': '',
    'Geometry': '',
    'Chemistry': '',
    'Physics': '',
    'Biology': '',
    'Geography': '',
    'English': '',
    'Kazakh Language': '',
    'Kazakh Literature': '',
    'Russian Language and Literature': '',
    'Kazakh History': '',
    'World History': '',
    'Informatics': '',
    'Rights': ''
  });
  const [flashcardsData, setFlashcardsData] = useState({ grade: '', topic: '', count: 10 });
  const [quizzesData, setQuizzesData] = useState({ grade: '', topic: '', count: 10 });
  const [planGoal, setPlanGoal] = useState('');
  const [testData, setTestData] = useState({ subject: 'Algebra', topic: '', difficulty: 'Medium' });
  const [translatorData, setTranslatorData] = useState({ text: '', sourceLang: 'Russian', targetLang: 'English' });
  const [disabledSubjects, setDisabledSubjects] = useState<string[]>([]);
  
  // Timer States
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    study: 25 * 60, // 25 minutes
    break: 5 * 60   // 5 minutes
  });
  const [timerTimeLeft, setTimerTimeLeft] = useState(25 * 60);
  const [isFloatingTimerVisible, setIsFloatingTimerVisible] = useState(true);

  useEffect(() => {
    if (isTimerRunning) {
      setIsFloatingTimerVisible(true);
    }
  }, [isTimerRunning]);

  const checkAndAwardAchievement = (achievementId: string) => {
    if (!achievements.includes(achievementId)) {
      const newAchievements = [...achievements, achievementId];
      setAchievements(newAchievements);
      syncAchievements(newAchievements);
      alert(`Achievement Unlocked: ${ALL_ACHIEVEMENTS[achievementId].name}!`);
    }
  };

  const syncAchievements = async (newAchievements: string[]) => {
    try {
      await fetch("/api/achievements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ achievements: newAchievements })
      });
    } catch (e) {
      console.error("Failed to sync achievements", e);
    }
  };

  const syncExperience = async (newXp: number, newLevel: number) => {
    try {
      await fetch("/api/experience", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xp: newXp, level: newLevel })
      });
    } catch (e) {
      console.error("Failed to sync experience", e);
    }
  };

  const addXp = (amount: number) => {
    const newXp = xp + amount;
    const newLevel = Math.floor(newXp / 100) + 1;
    setXp(newXp);
    if (newLevel > level) {
      setLevel(newLevel);
      if (newLevel === 5) checkAndAwardAchievement('LEVEL_5');
      if (newLevel === 10) checkAndAwardAchievement('LEVEL_10');
    }
    syncExperience(newXp, newLevel);
  };

  // Timer Effect
  useEffect(() => {
    let interval: any;
    if (isTimerRunning && timerTimeLeft > 0) {
      interval = setInterval(() => {
        setTimerTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerTimeLeft === 0) {
      setIsTimerRunning(false);
      const nextMode = timerMode === 'study' ? 'break' : 'study';
      setTimerMode(nextMode);
      setTimerTimeLeft(timerSettings[nextMode]);
      
      if (timerMode === 'study') {
        addXp(50); // Reward for finishing a study session
        alert("Study session complete! Time for a break.");
      } else {
        alert("Break over! Time to get back to work.");
      }
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerTimeLeft, timerMode, timerSettings]);

  const formatTimerTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`;
  };

  // Voice Chat States
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<'idle' | 'connecting' | 'active' | 'error'>('idle');
  const voiceSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const audioQueueRef = useRef<Int16Array[]>([]);
  const isPlayingRef = useRef(false);

  const startVoiceChat = async () => {
    try {
      setVoiceStatus('connecting');
      setIsVoiceActive(true);

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Spyris, a helpful and friendly study assistant. You are multilingual and can speak and understand any language requested by the user, including Kazakh, Russian, English, and others. Always respond in the language the user is speaking to you in. You are having a real-time voice conversation with a student. Keep your responses concise and engaging.",
        },
        callbacks: {
          onopen: () => {
            setVoiceStatus('active');
            setupAudioInput();
          },
          onmessage: async (message) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              audioQueueRef.current.push(pcmData);
              if (!isPlayingRef.current) {
                playNextInQueue();
              }
            }
            if (message.serverContent?.interrupted) {
              audioQueueRef.current = [];
              isPlayingRef.current = false;
            }
          },
          onclose: () => stopVoiceChat(),
          onerror: (err) => {
            console.error("Voice Chat Error:", err);
            setVoiceStatus('error');
            stopVoiceChat();
          }
        }
      });
      voiceSessionRef.current = session;
    } catch (err) {
      console.error("Failed to start voice chat:", err);
      setVoiceStatus('error');
      setIsVoiceActive(false);
    }
  };

  const setupAudioInput = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const source = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);

      processorRef.current.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        voiceSessionRef.current?.sendRealtimeInput({
          media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
        });
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
    } catch (err) {
      console.error("Microphone access denied:", err);
      setVoiceStatus('error');
    }
  };

  const playNextInQueue = async () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const pcmData = audioQueueRef.current.shift()!;
    const floatData = new Float32Array(pcmData.length);
    for (let i = 0; i < pcmData.length; i++) {
      floatData[i] = pcmData[i] / 0x7FFF;
    }

    const buffer = audioContextRef.current.createBuffer(1, floatData.length, 24000);
    buffer.getChannelData(0).set(floatData);
    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => playNextInQueue();
    source.start();
  };

  const stopVoiceChat = () => {
    voiceSessionRef.current?.close();
    voiceSessionRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
    setIsVoiceActive(false);
    setVoiceStatus('idle');
    audioQueueRef.current = [];
    isPlayingRef.current = false;
  };

  // Subscription States
  const [showSubscription, setShowSubscription] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'plan' | 'checkout'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Plus'>('Pro');
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', cardName: '', cvv: '' });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth Check
  useEffect(() => {
    fetch("/api/auth/me")
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setXp(data.user.xp || 0);
          setLevel(data.user.level || 1);
          setAchievements(JSON.parse(data.user.achievements || '[]'));
          fetchSessions();
        }
      })
      .catch(() => {});
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        if (data.sessions.length > 0) {
          setCurrentSessionId(data.sessions[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch sessions", e);
    }
  };

  const syncSessions = async (updatedSessions: ChatSession[]) => {
    try {
      await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: updatedSessions })
      });
    } catch (e) {
      console.error("Failed to sync sessions", e);
    }
  };

  // Experience States
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [achievements, setAchievements] = useState<string[]>([]);

  const ALL_ACHIEVEMENTS: Record<string, { name: string; description: string; icon: React.ReactNode }> = {
    LEVEL_5: { name: "Novice Scholar", description: "Reach level 5.", icon: <Award size={24} /> },
    LEVEL_10: { name: "Adept Learner", description: "Reach level 10.", icon: <Trophy size={24} /> },
    FIRST_PROJECT: { name: "Project Initiator", description: "Create your first project.", icon: <FileText size={24} /> },
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (data.error) {
        setAuthError(data.error);
      } else {
        setUser(data.user);
        fetchSessions();
      }
    } catch (e) {
      setAuthError("Authentication failed");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading]);

  // Reset current session if it doesn't match selected department
  useEffect(() => {
    if (currentSession && currentSession.department !== selectedDept) {
      setCurrentSessionId(null);
    }
  }, [selectedDept]);

  const currentSession = sessions.find(s => s.id === currentSessionId);

  const createNewSession = async (type: 'chat' | 'conspect' | 'flashcards' | 'quiz' = 'chat', dept: Department = 'General', initialMessage?: string) => {
    const newSessionId = crypto.randomUUID();
    const newSession: ChatSession = {
      id: newSessionId,
      title: type === 'chat' ? `New ${dept} Chat` : type === 'conspect' ? `New ${dept} Conspect` : type === 'flashcards' ? `New ${dept} Flashcards` : `New ${dept} Quiz`,
      messages: [],
      isArchived: false,
      createdAt: Date.now(),
      type,
      department: dept
    };
    
    if (sessions.length === 0) {
      checkAndAwardAchievement('FIRST_PROJECT');
    }
    const updated = [newSession, ...sessions];
    setSessions(updated);
    setCurrentSessionId(newSessionId);
    setSelectedDept(dept);
    syncSessions(updated);
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    if (initialMessage) {
      handleSendMessage(undefined, initialMessage, newSessionId, type);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customMessage?: string, overrideSessionId?: string, overrideSessionType?: 'chat' | 'conspect' | 'flashcards' | 'quiz') => {
    e?.preventDefault();
    const messageText = customMessage || input;
    const targetSessionId = overrideSessionId || currentSessionId;
    const currentAttachedImages = [...attachedImages];
    
    if ((!messageText.trim() && currentAttachedImages.length === 0) || !targetSessionId || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: messageText || `[Attached: ${currentAttachedImages.length} image(s)]`,
      timestamp: Date.now(),
      attachments: currentAttachedImages.map(img => img.data)
    };

    setIsLoading(true);
    setInput('');
    setAttachedImages([]);
    addXp(10);

    // 1. Update state with user message
    let targetSession: ChatSession | undefined;
    
    // Find session type immediately to avoid race conditions
    const sessionType = overrideSessionType || sessions.find(s => s.id === targetSessionId)?.type || 'chat';
    const department = sessions.find(s => s.id === targetSessionId)?.department || 'General';

    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === targetSessionId) {
          const updatedSession = {
            ...s,
            messages: [...s.messages, userMessage],
            title: s.messages.length === 0 ? (messageText ? messageText.slice(0, 30) + (messageText.length > 30 ? '...' : '') : 'New Chat') : s.title
          };
          targetSession = updatedSession;
          return updatedSession;
        }
        return s;
      });
      return updated;
    });

    // 2. Call AI
    try {
      const history = sessions.find(s => s.id === targetSessionId)?.messages.map(m => {
        const parts: any[] = [];
        if (m.image) {
          parts.push({
            inlineData: {
              data: m.image,
              mimeType: 'image/jpeg'
            }
          });
        }
        parts.push({ text: m.content });
        return {
          role: m.role,
          parts
        };
      }) || [];

      if (sessionType === 'flashcards') {
        const flashcards = await generateFlashcards(userMessage.content, history);
        setSessions(prev => {
          const finalSessions = prev.map(s => {
            if (s.id === targetSessionId) {
              const surgeMessage: Message = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `Here are your flashcards:`,
                timestamp: Date.now(),
                flashcards
              };
              return { ...s, messages: [...s.messages, surgeMessage] };
            }
            return s;
          });
          syncSessions(finalSessions);
          return finalSessions;
        });
      } else if (sessionType === 'quiz') {
        const quiz = await generateQuiz(userMessage.content, history);
        setSessions(prev => {
          const finalSessions = prev.map(s => {
            if (s.id === targetSessionId) {
              const surgeMessage: Message = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `Here is your quiz:`,
                timestamp: Date.now(),
                quiz
              };
              return { ...s, messages: [...s.messages, surgeMessage] };
            }
            return s;
          });
          syncSessions(finalSessions);
          return finalSessions;
        });
      } else {
        const responseStream = await chatWithSpyrisStream(userMessage.content, history, department, currentAttachedImages.length > 0 ? currentAttachedImages : undefined);
        
        const surgeMessageId = crypto.randomUUID();
        let currentContent = "";

        // Add empty message first
        setSessions(prev => {
          return prev.map(s => {
            if (s.id === targetSessionId) {
              const surgeMessage: Message = {
                id: surgeMessageId,
                role: 'model',
                content: '',
                timestamp: Date.now(),
              };
              return {
                ...s,
                messages: [...s.messages, surgeMessage]
              };
            }
            return s;
          });
        });

        for await (const chunk of responseStream) {
          if (chunk.text) {
            currentContent += chunk.text;
            setSessions(prev => prev.map(s => s.id === targetSessionId ? {
              ...s,
              messages: s.messages.map(m => m.id === surgeMessageId ? { ...m, content: currentContent } : m)
            } : s));
          }
        }

        // Sync after stream finishes
        setSessions(prev => {
          syncSessions(prev);
          return prev;
        });
      }

    } catch (error) {
      console.error("Spyris error:", error);
      // Add error message
      setSessions(prev => {
        const finalSessions = prev.map(s => {
          if (s.id === targetSessionId) {
            const errorMessage: Message = {
              id: crypto.randomUUID(),
              role: 'model',
              content: "Spyris is having a bit of a brain freeze. Please check your connection or try again in a moment!",
              timestamp: Date.now(),
            };
            return {
              ...s,
              messages: [...s.messages, errorMessage]
            };
          }
          return s;
        });
        syncSessions(finalSessions);
        return finalSessions;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Note: I need to fix the setSessions call in handleSendMessage
  // I'll use a functional update to be safe

  const [attachedImages, setAttachedImages] = useState<{ data: string, mimeType: string, name: string, url: string }[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !currentSessionId) return;

    const remainingSlots = 10 - attachedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      alert("You can only attach up to 10 images.");
      return;
    }

    const newImages: { data: string, mimeType: string, name: string, url: string }[] = [];

    for (const file of filesToProcess) {
      const reader = new FileReader();
      const promise = new Promise<void>((resolve) => {
        reader.onload = async (event) => {
          const result = event.target?.result as string;
          const base64String = result.split(',')[1];
          newImages.push({
            url: URL.createObjectURL(file),
            data: base64String,
            mimeType: file.type,
            name: file.name
          });
          resolve();
        };
      });
      reader.readAsDataURL(file);
      await promise;
    }

    setAttachedImages(prev => [...prev, ...newImages]);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachedImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const archiveSession = (id: string) => {
    const updated = sessions.map(s => s.id === id ? { ...s, isArchived: !s.isArchived } : s);
    setSessions(updated);
    syncSessions(updated);
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    syncSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const filteredSessions = sessions.filter(s => {
    const query = searchQuery.toLowerCase();
    const titleMatch = s.title.toLowerCase().includes(query);
    const deptMatch = s.department === selectedDept;
    const messageMatch = s.messages.some(m => m.content.toLowerCase().includes(query));
    return (titleMatch || messageMatch) && deptMatch;
  });

  const activeSessions = filteredSessions.filter(s => !s.isArchived);

  if (!user) {
    return (
      <div className="min-h-screen bg-surge-bg flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-surge-purple/10 blur-[120px] rounded-full pointer-events-none" />
        
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full max-w-md glass-panel rounded-[2.5rem] p-10 shadow-2xl relative z-10"
        >
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-black border-2 border-surge-ink/20 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-surge-purple/20 icon-glow-container">
              <Aperture className="lightning-effect" size={32} />
            </div>
            <h1 className="text-3xl font-display font-bold text-surge-ink mb-2">SpyrisLearn</h1>
            <p className="text-surge-ink/40 text-sm font-medium uppercase tracking-widest">The Future of Study</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            {authMode === 'signup' && (
              <div>
                <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={authForm.name}
                  onChange={e => setAuthForm({...authForm, name: e.target.value})}
                  className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                  placeholder="Enter your name"
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                value={authForm.email}
                onChange={e => setAuthForm({...authForm, email: e.target.value})}
                className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                placeholder="name@example.com"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Password</label>
              <input 
                type="password" 
                required
                value={authForm.password}
                onChange={e => setAuthForm({...authForm, password: e.target.value})}
                className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                placeholder="••••••••"
              />
            </div>

            {authError && (
              <div className="flex items-center gap-2 text-red-500 text-xs font-bold bg-red-500/10 p-4 rounded-xl border border-red-500/20">
                <AlertCircle size={14} />
                <span>{authError}</span>
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-surge-purple/20 transition-all active:scale-95"
            >
              {authMode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-surge-purple hover:text-surge-ink text-sm font-bold transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surge-bg text-surge-ink font-sans">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="fixed md:relative z-40 w-72 h-full glass-panel flex flex-col"
          >
            <div className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-black border border-surge-ink/20 rounded-xl flex items-center justify-center shadow-lg shadow-surge-purple/20 icon-glow-container">
                  <Aperture className="lightning-effect" size={20} />
                </div>
                <div>
                  <h1 className="font-display text-xl font-bold tracking-tight text-surge-ink">SpyrisLearn</h1>
                  <p className="text-[10px] text-surge-purple font-bold uppercase tracking-tighter">Study Assistant</p>
                </div>
              </div>
              <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-surge-ink/40 hover:text-surge-ink">
                <X size={20} />
              </button>
            </div>

            <div className="px-4 mb-6 flex gap-2">
              <button 
                onClick={() => createNewSession('chat', selectedDept)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-surge-purple hover:bg-surge-purple-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-surge-purple/20 active:scale-95"
              >
                <Plus size={18} />
                <span>New Session</span>
              </button>
              <button 
                onClick={() => setIsNewProjectModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95"
              >
                <FileText size={18} />
                <span>New Project</span>
              </button>
            </div>

            <div className="px-4 mb-4">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surge-ink/30 group-focus-within:text-surge-purple transition-colors" size={16} />
                <input 
                  type="text"
                  placeholder="Search archive..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surge-bg border border-surge-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-surge-purple/30 focus:border-surge-purple transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-6 custom-scrollbar">
              {/* Experience Highlight */}
              <div className="px-2">
                <button
                  onClick={() => setSelectedDept('Experience')}
                  className={cn(
                    "w-full p-4 rounded-2xl border transition-all relative overflow-hidden group",
                    selectedDept === 'Experience'
                      ? "bg-surge-purple border-surge-purple shadow-xl shadow-surge-purple/20"
                      : "bg-surge-ink/5 border-surge-ink/10 hover:border-surge-purple/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      selectedDept === 'Experience' ? "bg-white text-surge-purple" : "bg-surge-purple text-white"
                    )}>
                      <Trophy size={16} />
                    </div>
                    <div className="text-left">
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", selectedDept === 'Experience' ? "text-surge-ink/60" : "text-surge-purple")}>Level {level}</p>
                      <p className={cn("text-sm font-bold", selectedDept === 'Experience' ? "text-surge-ink" : "text-surge-ink")}>Mastery Rank</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-surge-ink/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${xp % 100}%` }}
                      className={cn("h-full", selectedDept === 'Experience' ? "bg-white" : "bg-surge-purple")}
                    />
                  </div>
                </button>
              </div>

              {/* Departments Filter */}
              <div className="px-2">
                <h2 className="px-2 text-[10px] font-bold uppercase tracking-widest text-surge-ink/30 mb-3">Departments</h2>
                <div className="flex flex-col gap-1.5 px-2">
                  {DEPARTMENTS.filter(d => d.id !== 'Experience').map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => setSelectedDept(dept.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
                        selectedDept === dept.id 
                          ? "bg-surge-purple/20 border-surge-purple text-surge-purple" 
                          : "bg-transparent border-surge-border text-surge-ink/40 hover:border-surge-ink/20"
                      )}
                    >
                      <div className={cn("w-2 h-2 rounded-full", dept.color)} />
                      {dept.name}
                    </button>
                  ))}
                </div>
              </div>

              {activeSessions.length > 0 && (
                <div>
                  <h2 className="px-4 text-[10px] font-bold uppercase tracking-widest text-surge-ink/30 mb-2">Recent</h2>
                  <div className="space-y-1">
                    {activeSessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => {
                          setCurrentSessionId(session.id);
                          if (window.innerWidth < 768) setIsSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm transition-all group relative overflow-hidden",
                          currentSessionId === session.id 
                            ? "bg-surge-purple text-white shadow-xl shadow-surge-purple/20" 
                            : "hover:bg-surge-bg text-surge-ink/60 hover:text-surge-ink"
                        )}
                      >
                        <span className="flex-1 truncate font-medium">{session.title}</span>
                        <Archive 
                          size={14} 
                          className="opacity-0 group-hover:opacity-100 hover:text-surge-purple transition-all" 
                          onClick={(e) => { e.stopPropagation(); archiveSession(session.id); }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-surge-border bg-surge-ink/10">
              <div 
                onClick={() => setShowSubscription(true)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-surge-ink/5 transition-colors cursor-pointer group relative"
              >
                <div className="w-10 h-10 rounded-xl bg-surge-purple/20 flex items-center justify-center text-surge-purple font-bold text-sm shadow-inner border border-surge-purple/30">
                  {user?.name?.slice(0, 2).toUpperCase() || '??'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-surge-ink truncate">{user?.name || 'Guest'}</p>
                  <p className="text-[10px] text-surge-purple font-bold uppercase tracking-tighter">Pro Student</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      const themes: ('dark' | 'light' | 'night' | 'glass')[] = ['dark', 'light', 'night', 'glass'];
                      const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
                      setTheme(nextTheme);
                    }}
                    className="p-2 hover:bg-surge-ink/10 rounded-lg text-surge-ink/40 hover:text-surge-ink transition-colors"
                    title={`Current theme: ${theme}`}
                  >
                    <Palette size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleLogout(); }}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-surge-ink/20 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

        {/* Collapse Button */}
        <div className="hidden md:flex items-center justify-center h-full w-8 bg-surge-bg border-r border-surge-border">
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="w-6 h-6 flex items-center justify-center rounded-full bg-surge-card hover:bg-surge-purple text-surge-ink/40 hover:text-white transition-all"
          >
            <ChevronsLeft size={14} className={cn("transition-transform", isSidebarOpen ? "rotate-0" : "rotate-180")} />
          </button>
        </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 bg-surge-bg overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-surge-border bg-surge-card">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-surge-purple">
            <Menu size={24} />
          </button>
          <h1 className="font-display font-bold text-surge-ink">SpyrisLearn</h1>
          <div className="w-10" />
        </div>

        {!currentSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-y-auto">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-surge-purple/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-surge-purple/5 blur-[120px] rounded-full" />
            
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="max-w-2xl z-10 w-full"
            >
              <div className="w-24 h-24 bg-black border-2 border-surge-ink/20 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-2xl shadow-surge-purple/40 rotate-3 icon-glow-container">
                <Aperture className="lightning-effect" size={48} />
              </div>
              <h2 className="font-display text-5xl md:text-6xl font-black mb-6 text-surge-ink tracking-tighter">
                READY TO <span className="text-surge-purple italic">STUDY</span>?
              </h2>
              
              {selectedDept === 'Marks' ? (
                <div className="bg-gradient-to-b from-rose-50 to-orange-50 rounded-[2rem] p-8 shadow-xl mb-12 border border-rose-100 relative">
                  <div className="absolute top-4 right-4 bg-white p-3 rounded-full shadow-sm text-rose-400">
                    <Trophy size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-rose-900 mb-2">Grade Analyzer</h3>
                  <p className="text-rose-700/60 text-sm mb-8 font-medium">Enter your current marks (0-5) for a personalized improvement plan.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                    {Object.keys(marksData).map(subject => {
                      const isDisabled = disabledSubjects.includes(subject);
                      return (
                        <div key={subject} className={cn(
                          "flex items-center justify-between p-3 bg-white rounded-xl shadow-sm border transition-all group",
                          isDisabled ? "opacity-50 border-rose-100 bg-rose-50/30" : "border-rose-100/50 hover:border-rose-300"
                        )}>
                          <div className="flex items-center gap-2 overflow-hidden">
                            <button 
                              onClick={() => {
                                if (isDisabled) {
                                  setDisabledSubjects(disabledSubjects.filter(s => s !== subject));
                                } else {
                                  setDisabledSubjects([...disabledSubjects, subject]);
                                }
                              }}
                              className={cn(
                                "p-1 rounded-lg transition-all",
                                isDisabled ? "text-rose-500 bg-rose-100" : "text-rose-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100"
                              )}
                              title={isDisabled ? "Show subject" : "Hide subject"}
                            >
                              {isDisabled ? <Plus size={14} /> : <X size={14} />}
                            </button>
                            <span className={cn(
                              "text-sm font-bold text-rose-900/80 truncate",
                              isDisabled && "line-through decoration-rose-400"
                            )}>
                              {subject}
                            </span>
                          </div>
                          <input 
                            type="number"
                            min="0"
                            max="5"
                            disabled={isDisabled}
                            placeholder="-"
                            value={marksData[subject]}
                            onChange={(e) => setMarksData({...marksData, [subject]: e.target.value})}
                            className={cn(
                              "w-14 bg-rose-50 border-none rounded-lg px-2 py-1.5 text-center text-rose-900 font-bold focus:outline-none focus:ring-2 focus:ring-rose-400",
                              isDisabled && "cursor-not-allowed opacity-50"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {Object.keys(marksData).length === 0 && (
                    <div className="text-center py-8 mb-8 bg-rose-50/50 rounded-2xl border-2 border-dashed border-rose-200">
                      <p className="text-rose-900/40 font-medium mb-4">No subjects added</p>
                      <button 
                        onClick={() => setMarksData({
                          'Algebra': '', 'Geometry': '', 'Chemistry': '', 'Physics': '', 'Biology': '', 'Geography': '', 'English': '',
                          'Kazakh Language': '', 'Kazakh Literature': '', 'Russian Language and Literature': '',
                          'Kazakh History': '', 'World History': '', 'Informatics': '', 'Rights': ''
                        })}
                        className="text-rose-500 font-bold text-sm hover:underline"
                      >
                        Restore Default Subjects
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      const activeMarks = Object.entries(marksData)
                        .filter(([s]) => !disabledSubjects.includes(s) && marksData[s] !== '');
                      
                      if (activeMarks.length === 0) {
                        alert("Please enter at least one mark to analyze.");
                        return;
                      }

                      const marksStr = activeMarks.map(([s, g]) => `${s}: ${g}`).join(', ');
                      createNewSession('chat', 'Marks', `Here are my marks: ${marksStr}. Please analyze them and give me a plan.`);
                      addXp(50);
                    }}
                    className="w-full bg-gradient-to-r from-rose-400 to-orange-400 hover:from-rose-500 hover:to-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-rose-400/30 transition-all active:scale-95"
                  >
                    Analyze My Performance
                  </button>
                </div>
              ) : selectedDept === 'Flashcards' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-surge-purple/20 relative overflow-hidden">
                  <div className="absolute -right-10 -top-10 w-40 h-40 bg-surge-purple/5 rounded-full blur-3xl"></div>
                  <h3 className="text-3xl font-display font-black text-surge-ink mb-2 tracking-tight">Flashcard Studio</h3>
                  <p className="text-surge-ink/40 mb-10 text-sm font-medium">Create custom study cards in seconds.</p>
                  
                  <div className="space-y-6 mb-10">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">Class / Grade</label>
                        <input 
                          type="text"
                          placeholder="e.g. 10th Grade, College Freshman"
                          value={flashcardsData.grade}
                          onChange={(e) => setFlashcardsData({...flashcardsData, grade: e.target.value})}
                          className="w-full bg-surge-ink/5 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-surge-purple/30 focus:bg-surge-ink/[0.02] transition-all"
                        />
                      </div>
                      <div className="md:w-1/3">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">Count</label>
                        <select 
                          value={flashcardsData.count}
                          onChange={(e) => setFlashcardsData({...flashcardsData, count: parseInt(e.target.value)})}
                          className="w-full bg-surge-ink/5 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-surge-purple/30 focus:bg-surge-ink/[0.02] transition-all appearance-none cursor-pointer"
                        >
                          <option value={5}>5 Cards</option>
                          <option value={10}>10 Cards</option>
                          <option value={15}>15 Cards</option>
                          <option value={20}>20 Cards</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">Topic</label>
                      <input 
                        type="text"
                        placeholder="e.g. World War II, React Hooks, Spanish Verbs"
                        value={flashcardsData.topic}
                        onChange={(e) => setFlashcardsData({...flashcardsData, topic: e.target.value})}
                        className="w-full bg-surge-ink/5 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-surge-purple/30 focus:bg-surge-ink/[0.02] transition-all"
                      />
                    </div>
                  </div>
                  <button 
                    disabled={!flashcardsData.topic}
                    onClick={() => {
                      const gradeContext = flashcardsData.grade ? ` for a ${flashcardsData.grade} student` : '';
                      createNewSession('flashcards', 'Flashcards', `Generate ${flashcardsData.count} flashcards about ${flashcardsData.topic}${gradeContext}`);
                      addXp(30);
                    }}
                    className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-surge-purple/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Flashcards
                  </button>
                </div>
              ) : selectedDept === 'Quizzes' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-surge-purple/10 relative overflow-hidden">
                  <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-surge-purple/5 rounded-full blur-3xl"></div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-black text-surge-ink mb-2 tracking-tight">Pop Quiz Generator</h3>
                    <p className="text-surge-ink/40 mb-10 text-sm font-medium">Test your knowledge with AI-generated questions.</p>
                    
                    <div className="space-y-8 mb-10">
                      <div className="border-b-2 border-surge-ink/5 pb-4">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Student Grade/Class</label>
                        <input 
                          type="text"
                          placeholder="e.g. 8th Grade, High School Senior"
                          value={quizzesData.grade}
                          onChange={(e) => setQuizzesData({...quizzesData, grade: e.target.value})}
                          className="w-full bg-transparent border-none px-1 py-2 text-surge-ink font-bold text-lg focus:outline-none focus:ring-0 placeholder:text-surge-ink/10"
                        />
                      </div>
                      <div className="border-b-2 border-surge-ink/5 pb-4">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Quiz Topic</label>
                        <input 
                          type="text"
                          placeholder="e.g. Quantum Physics, European Capitals"
                          value={quizzesData.topic}
                          onChange={(e) => setQuizzesData({...quizzesData, topic: e.target.value})}
                          className="w-full bg-transparent border-none px-1 py-2 text-surge-ink font-bold text-lg focus:outline-none focus:ring-0 placeholder:text-surge-ink/10"
                        />
                      </div>
                      <div className="border-b-2 border-surge-ink/5 pb-4">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Number of Questions</label>
                        <select 
                          value={quizzesData.count}
                          onChange={(e) => setQuizzesData({...quizzesData, count: parseInt(e.target.value)})}
                          className="w-full bg-transparent border-none px-1 py-2 text-surge-ink font-bold text-lg focus:outline-none focus:ring-0 appearance-none cursor-pointer"
                        >
                          <option value={5} className="bg-surge-card">5 Questions (Short)</option>
                          <option value={10} className="bg-surge-card">10 Questions (Standard)</option>
                          <option value={15} className="bg-surge-card">15 Questions (Long)</option>
                          <option value={20} className="bg-surge-card">20 Questions (Exam)</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      disabled={!quizzesData.topic}
                      onClick={() => {
                        const gradeContext = quizzesData.grade ? ` for a ${quizzesData.grade} student` : '';
                        createNewSession('quiz', 'Quizzes', `Generate a ${quizzesData.count}-question quiz about ${quizzesData.topic}${gradeContext}`);
                        addXp(30);
                      }}
                      className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-surge-purple/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Begin Quiz
                    </button>
                  </div>
                </div>
              ) : selectedDept === 'Plan' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-surge-purple/10 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-surge-purple to-transparent opacity-50"></div>
                  <h3 className="text-3xl font-display font-black text-surge-ink mb-2 tracking-tight">Study Plan Architect</h3>
                  <p className="text-surge-ink/40 text-sm mb-10 font-medium">Build a structured path to your academic goals.</p>
                  
                  <div className="space-y-6 mb-10 text-left">
                    <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">What are you studying for?</label>
                    <textarea 
                      rows={4}
                      placeholder="e.g. Final Exams in 2 weeks, Learning Python from scratch, SAT preparation..."
                      value={planGoal}
                      onChange={(e) => setPlanGoal(e.target.value)}
                      className="w-full bg-surge-ink/5 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-surge-purple/30 focus:bg-surge-ink/[0.02] transition-all resize-none shadow-inner text-sm"
                    />
                  </div>
                  <button 
                    disabled={!planGoal.trim()}
                    onClick={() => {
                      createNewSession('chat', 'Plan', `I want to create a study plan for: ${planGoal}`);
                      addXp(50);
                    }}
                    className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-surge-purple/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Draft My Plan
                  </button>
                </div>
              ) : selectedDept === 'Test' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-surge-purple/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-surge-purple">
                    <FileText size={150} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-surge-ink mb-2 tracking-tight">Test Generator</h3>
                  <p className="text-surge-ink/40 text-sm mb-10 font-medium">Create comprehensive practice tests for any subject.</p>
                  
                  <div className="space-y-6 mb-10 text-left relative z-10">
                    <div className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10">
                      <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-1">Subject</label>
                      <select 
                        value={testData.subject}
                        onChange={(e) => setTestData({...testData, subject: e.target.value})}
                        className="w-full bg-transparent border-none px-1 py-2 text-surge-ink font-bold text-lg focus:outline-none focus:ring-0 appearance-none cursor-pointer"
                      >
                        {Object.keys(marksData).map(s => <option key={s} value={s} className="bg-surge-card">{s}</option>)}
                      </select>
                    </div>
                    <div className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10">
                      <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-1">Topic</label>
                      <input 
                        type="text"
                        placeholder="e.g. Photosynthesis, Quadratic Equations"
                        value={testData.topic}
                        onChange={(e) => setTestData({...testData, topic: e.target.value})}
                        className="w-full bg-transparent border-none px-1 py-2 text-surge-ink font-bold text-lg focus:outline-none focus:ring-0 placeholder:text-surge-ink/10"
                      />
                    </div>
                    <div className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10">
                      <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-1">Difficulty</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['Easy', 'Medium', 'Hard'].map(level => (
                          <button
                            key={level}
                            onClick={() => setTestData({...testData, difficulty: level})}
                            className={cn(
                              "py-4 rounded-xl text-sm font-bold transition-all border-2",
                              testData.difficulty === level 
                                ? "bg-surge-purple text-white border-surge-purple shadow-lg shadow-surge-purple/20" 
                                : "bg-transparent border-surge-ink/10 text-surge-ink/40 hover:border-surge-purple/30 hover:text-surge-purple"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    disabled={!testData.topic.trim()}
                    onClick={() => {
                      createNewSession('quiz', 'Test', `Generate a ${testData.difficulty} test for ${testData.subject} on the topic: ${testData.topic}. Include 5 multiple choice questions.`);
                      addXp(50);
                    }}
                    className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-surge-purple/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                  >
                    Generate Test
                  </button>
                </div>
              ) : selectedDept === 'Translator' ? (
                <div className="bg-surge-card rounded-[2rem] p-8 shadow-2xl mb-12 border border-emerald-500/20 relative overflow-hidden text-surge-ink">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-emerald-500">
                    <Globe size={200} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-emerald-500 mb-2">AI.Translator</h3>
                  <p className="text-surge-ink/40 text-sm mb-8 font-medium">Neural machine translation engine.</p>
                  
                  <div className="space-y-6 mb-8 text-left relative z-10">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-surge-ink/5 p-3 rounded-xl border border-surge-ink/10">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Source</label>
                        <select 
                          value={translatorData.sourceLang}
                          onChange={(e) => setTranslatorData({...translatorData, sourceLang: e.target.value})}
                          className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold"
                        >
                          {['Auto Detect', 'Russian', 'English', 'Kazakh', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Arabic', 'Italian', 'Portuguese'].map(lang => (
                            <option key={lang} value={lang} className="bg-surge-card">{lang}</option>
                          ))}
                        </select>
                      </div>
                      <div className="bg-surge-ink/5 p-3 rounded-xl border border-surge-ink/10">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Target</label>
                        <select 
                          value={translatorData.targetLang}
                          onChange={(e) => setTranslatorData({...translatorData, targetLang: e.target.value})}
                          className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold"
                        >
                          {['English', 'Russian', 'Kazakh', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Arabic', 'Italian', 'Portuguese'].map(lang => (
                            <option key={lang} value={lang} className="bg-surge-card">{lang}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Input Text</label>
                      <textarea 
                        rows={4}
                        placeholder="Type anything here..."
                        value={translatorData.text}
                        onChange={(e) => setTranslatorData({...translatorData, text: e.target.value})}
                        className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-emerald-500/50 transition-all resize-none font-medium text-sm"
                      />
                    </div>
                  </div>
                  <button 
                    disabled={!translatorData.text.trim()}
                    onClick={() => {
                      const source = translatorData.sourceLang === 'Auto Detect' ? 'detected language' : translatorData.sourceLang;
                      createNewSession('chat', 'Translator', `Translate the following text from ${source} to ${translatorData.targetLang}: ${translatorData.text}`);
                      addXp(20);
                    }}
                    className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-mono font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                  >
                    EXECUTE_TRANSLATION
                  </button>
                </div>
              ) : selectedDept === 'Voice' ? (
                <div className="glass-panel rounded-[2rem] p-10 shadow-2xl mb-12 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-surge-purple/10 flex items-center justify-center mb-8 relative">
                    {isVoiceActive && (
                      <motion.div 
                        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="absolute inset-0 bg-surge-purple rounded-full"
                      />
                    )}
                    <div className="w-24 h-24 rounded-full bg-surge-purple flex items-center justify-center shadow-2xl shadow-surge-purple/40 z-10">
                      {isVoiceActive ? <Volume2 size={40} className="text-surge-ink animate-pulse" /> : <Mic size={40} className="text-surge-ink" />}
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-display font-bold text-surge-ink mb-2">Spyris Live Voice</h3>
                  <p className="text-surge-ink/40 mb-10 text-center max-w-xs">
                    {voiceStatus === 'idle' ? 'Start a real-time voice conversation with Spyris.' : 
                     voiceStatus === 'connecting' ? 'Connecting to Spyris...' : 
                     voiceStatus === 'active' ? 'Spyris is listening...' : 
                     'Something went wrong. Please try again.'}
                  </p>

                  {!isVoiceActive ? (
                    <button 
                      onClick={startVoiceChat}
                      className="flex items-center gap-3 bg-surge-purple hover:bg-surge-purple-dark text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-surge-purple/20 transition-all active:scale-95"
                    >
                      <Phone size={20} />
                      Start Call
                    </button>
                  ) : (
                    <button 
                      onClick={stopVoiceChat}
                      className="flex items-center gap-3 bg-red-500 hover:bg-red-600 text-white font-bold px-10 py-4 rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-95"
                    >
                      <PhoneOff size={20} />
                      End Call
                    </button>
                  )}
                </div>
              ) : selectedDept === 'Experience' ? (
                <div className="w-full max-w-4xl mx-auto p-4 md:p-0">
                  <div className="glass-panel rounded-[2.5rem] p-6 md:p-10 shadow-2xl mb-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Trophy size={120} />
                    </div>
                    <div className="relative z-10">
                      <div className="flex flex-col md:flex-row items-center gap-6 mb-8">
                        <div className="w-20 h-20 rounded-3xl bg-surge-purple flex items-center justify-center shadow-2xl shadow-surge-purple/40 flex-shrink-0">
                          <Trophy className="text-surge-ink" size={40} />
                        </div>
                        <div>
                          <h3 className="text-3xl text-center md:text-left font-display font-black text-surge-ink mb-1 tracking-tight">LEVEL {level}</h3>
                          <p className="text-surge-purple text-center md:text-left font-bold uppercase tracking-widest text-sm">Mastery Rank: Scholar</p>
                        </div>
                      </div>

                      <div className="space-y-4 mb-10">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-surge-ink/40 uppercase tracking-widest">Progress to Level {level + 1}</span>
                          <span className="text-surge-ink">{xp % 100} / 100 XP</span>
                        </div>
                        <div className="w-full h-4 bg-surge-ink/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${xp % 100}%` }}
                            className="h-full bg-gradient-to-r from-surge-purple to-indigo-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                        <div className="bg-surge-ink/5 rounded-2xl p-4 md:p-6 border border-white/5 text-center">
                          <span className="block text-2xl font-black text-surge-ink mb-1">{xp}</span>
                          <span className="text-[10px] text-surge-ink/40 uppercase font-bold tracking-widest">Total XP</span>
                        </div>
                        <div className="bg-surge-ink/5 rounded-2xl p-4 md:p-6 border border-white/5 text-center">
                          <span className="block text-2xl font-black text-surge-ink mb-1">{level}</span>
                          <span className="text-[10px] text-surge-ink/40 uppercase font-bold tracking-widest">Current Level</span>
                        </div>
                        <div className="bg-surge-ink/5 rounded-2xl p-4 md:p-6 border border-white/5 text-center">
                          <span className="block text-2xl font-black text-surge-ink mb-1">{achievements.length || 3}</span>
                          <span className="text-[10px] text-surge-ink/40 uppercase font-bold tracking-widest">Achievements</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    <div className="glass-panel rounded-[2rem] p-6 md:p-8 border-surge-purple/20">
                      <h4 className="text-lg font-bold text-surge-ink mb-6 flex items-center gap-2">
                        <Aperture size={20} className="text-surge-purple" />
                        Daily Quests
                      </h4>
                      <div className="space-y-4">
                        {[
                          { name: "Study for 15 minutes", xp: 50, icon: Clock, targetDept: 'Timer' },
                          { name: "Complete a Test", xp: 100, icon: FileText, targetDept: 'Test' },
                          { name: "Analyze Marks", xp: 40, icon: Award, targetDept: 'Marks' },
                          { name: "Review Flashcards", xp: 30, icon: Coffee, targetDept: 'Flashcards' }
                        ].map((quest, i) => (
                          <button 
                            key={i} 
                            onClick={() => setSelectedDept(quest.targetDept as Department)}
                            className="w-full flex items-center justify-between p-4 bg-surge-ink/5 rounded-2xl border border-white/5 hover:border-surge-purple/30 transition-all cursor-pointer group text-left"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-surge-purple/10 flex items-center justify-center text-surge-purple group-hover:bg-surge-purple group-hover:text-white transition-all flex-shrink-0">
                                <quest.icon size={18} />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-surge-ink">{quest.name}</p>
                                <p className="text-[10px] text-surge-purple font-bold">+{quest.xp} XP</p>
                              </div>
                            </div>
                            <Plus size={16} className="text-surge-ink/20 group-hover:text-surge-purple" />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="glass-panel rounded-[2rem] p-6 md:p-8 border-amber-500/20">
                      <h4 className="text-lg font-bold text-surge-ink mb-6 flex items-center gap-2">
                        <Award size={20} className="text-amber-500" />
                        Achievements
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { name: "Early Bird", desc: "Study before 8 AM", color: "text-amber-500" },
                          { name: "Night Owl", desc: "Study after 10 PM", color: "text-indigo-400" },
                          { name: "Polyglot", desc: "Translate 5 texts", color: "text-cyan-400" },
                          { name: "Master", desc: "Reach Level 5", color: "text-surge-purple" }
                        ].map((ach, i) => (
                          <div key={i} className="p-4 bg-surge-ink/5 rounded-2xl border border-white/5 text-center opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help">
                            <div className={cn("w-10 h-10 rounded-full bg-surge-ink/5 flex items-center justify-center mx-auto mb-3", ach.color)}>
                              <Award size={20} />
                            </div>
                            <p className="text-xs font-bold text-surge-ink mb-1">{ach.name}</p>
                            <p className="text-[8px] text-surge-ink/40 uppercase font-bold tracking-tighter">{ach.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedDept === 'Timer' ? (
                <div className="glass-panel rounded-[2rem] p-10 shadow-2xl mb-12 flex flex-col items-center">
                  <div className="flex gap-4 mb-8">
                    <button 
                      onClick={() => {
                        setTimerMode('study');
                        setTimerTimeLeft(timerSettings.study);
                        setIsTimerRunning(false);
                      }}
                      className={cn(
                        "px-6 py-2 rounded-xl font-bold transition-all",
                        timerMode === 'study' ? "bg-surge-purple text-white" : "bg-surge-ink/5 text-surge-ink/40"
                      )}
                    >
                      Study
                    </button>
                    <button 
                      onClick={() => {
                        setTimerMode('break');
                        setTimerTimeLeft(timerSettings.break);
                        setIsTimerRunning(false);
                      }}
                      className={cn(
                        "px-6 py-2 rounded-xl font-bold transition-all",
                        timerMode === 'break' ? "bg-surge-purple text-white" : "bg-surge-ink/5 text-surge-ink/40"
                      )}
                    >
                      Break
                    </button>
                  </div>

                  <div className="text-8xl font-display font-bold text-surge-ink mb-10 tracking-tighter">
                    {formatTimerTime(timerTimeLeft)}
                  </div>

                  <div className="flex items-center gap-6 mb-12">
                    <button 
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="w-20 h-20 rounded-full bg-surge-purple flex items-center justify-center shadow-2xl shadow-surge-purple/40 hover:scale-110 transition-all active:scale-95"
                    >
                      {isTimerRunning ? <Pause size={32} className="text-surge-ink" /> : <Play size={32} className="text-surge-ink ml-1" />}
                    </button>
                    <button 
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerTimeLeft(timerSettings[timerMode]);
                      }}
                      className="w-14 h-14 rounded-full bg-surge-ink/5 flex items-center justify-center text-surge-ink/40 hover:text-surge-ink transition-all"
                    >
                      <RotateCcw size={24} />
                    </button>
                  </div>

                  <div className="w-full max-w-md space-y-8 text-left">
                    <h4 className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest ml-2">Settings</h4>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase mb-3 ml-2">Study Duration</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="H"
                              value={Math.floor(timerSettings.study / 3600)}
                              onChange={(e) => {
                                const h = parseInt(e.target.value) || 0;
                                const m = Math.floor((timerSettings.study % 3600) / 60);
                                const s = timerSettings.study % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, study: total});
                                if (timerMode === 'study') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-3 py-2 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Hours</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="M"
                              value={Math.floor((timerSettings.study % 3600) / 60)}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.study / 3600);
                                const m = parseInt(e.target.value) || 0;
                                const s = timerSettings.study % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, study: total});
                                if (timerMode === 'study') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-3 py-2 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Minutes</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="S"
                              value={timerSettings.study % 60}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.study / 3600);
                                const m = Math.floor((timerSettings.study % 3600) / 60);
                                const s = parseInt(e.target.value) || 0;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, study: total});
                                if (timerMode === 'study') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-3 py-2 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Seconds</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase mb-3 ml-2">Break Duration</label>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="H"
                              value={Math.floor(timerSettings.break / 3600)}
                              onChange={(e) => {
                                const h = parseInt(e.target.value) || 0;
                                const m = Math.floor((timerSettings.break % 3600) / 60);
                                const s = timerSettings.break % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, break: total});
                                if (timerMode === 'break') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-3 py-2 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Hours</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="M"
                              value={Math.floor((timerSettings.break % 3600) / 60)}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.break / 3600);
                                const m = parseInt(e.target.value) || 0;
                                const s = timerSettings.break % 60;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, break: total});
                                if (timerMode === 'break') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-3 py-2 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Minutes</span>
                          </div>
                          <div className="space-y-1">
                            <input 
                              type="number"
                              placeholder="S"
                              value={timerSettings.break % 60}
                              onChange={(e) => {
                                const h = Math.floor(timerSettings.break / 3600);
                                const m = Math.floor((timerSettings.break % 3600) / 60);
                                const s = parseInt(e.target.value) || 0;
                                const total = (h * 3600) + (m * 60) + s;
                                setTimerSettings({...timerSettings, break: total});
                                if (timerMode === 'break') setTimerTimeLeft(total);
                              }}
                              className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-3 py-2 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Seconds</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-surge-ink/50 mb-12 text-lg max-w-lg mx-auto leading-relaxed font-medium">
                    Your AI-powered study department. Summarize photos, solve problems, and build your knowledge archive.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <button 
                      onClick={() => createNewSession('chat', selectedDept)}
                      className="group relative flex flex-col items-center gap-4 p-8 glass-panel rounded-3xl hover:border-surge-purple hover:shadow-2xl hover:shadow-surge-purple/10 transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-surge-purple/10 flex items-center justify-center text-surge-purple group-hover:scale-110 group-hover:bg-surge-purple group-hover:text-white transition-all duration-300">
                        <MessageSquare size={28} />
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-bold text-surge-ink mb-1">Quick Chat</span>
                        <span className="text-xs text-surge-ink/40">Ask Spyris anything</span>
                      </div>
                    </button>
                    <button 
                      onClick={() => {
                        createNewSession('conspect', selectedDept);
                        setTimeout(() => fileInputRef.current?.click(), 100);
                      }}
                      className="group relative flex flex-col items-center gap-4 p-8 glass-panel rounded-3xl hover:border-white hover:shadow-2xl hover:shadow-white/5 transition-all"
                    >
                      <div className="w-14 h-14 rounded-2xl bg-surge-ink/10 flex items-center justify-center text-surge-ink group-hover:scale-110 group-hover:bg-white group-hover:text-black transition-all duration-300">
                        <ImageIcon size={28} />
                      </div>
                      <div className="text-center">
                        <span className="block text-lg font-bold text-surge-ink mb-1">New Conspect</span>
                        <span className="text-xs text-surge-ink/40">Upload photo for notes</span>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="h-20 border-b border-surge-border bg-surge-bg/80 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-20">
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "p-3 rounded-2xl shadow-inner",
                  DEPARTMENTS.find(d => d.id === currentSession?.department)?.color || 'bg-surge-purple'
                )}>
                  {currentSession?.type === 'conspect' ? <FileText size={20} className="text-surge-ink" /> : <Aperture size={20} className="text-surge-ink" />}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-bold text-surge-ink truncate text-lg">{currentSession?.title}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surge-purple">
                    {currentSession?.department} Department
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => archiveSession(currentSessionId)}
                  className={cn(
                    "p-2.5 rounded-xl transition-all border",
                    currentSession?.isArchived 
                      ? "bg-surge-purple/20 border-surge-purple text-surge-purple" 
                      : "bg-surge-card border-surge-border text-surge-ink/40 hover:text-surge-ink hover:border-surge-ink/20"
                  )}
                >
                  <Archive size={20} />
                </button>
                <button 
                  onClick={() => deleteSession(currentSessionId)}
                  className="p-2.5 bg-surge-card border border-surge-border text-surge-ink/40 hover:text-red-500 hover:border-red-500/30 rounded-xl transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </header>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar"
            >
              {currentSession?.type === 'flashcards' ? (
                <div className="max-w-5xl mx-auto">
                  {currentSession.messages.filter(m => m.flashcards).map((message, idx) => {
                    const messageIndex = currentSession.messages.findIndex(m => m.id === message.id);
                    const userMessage = messageIndex > 0 ? currentSession.messages[messageIndex - 1] : null;
                    const topic = userMessage?.content?.replace(/Generate \d+ flashcards about /i, '') || 'Flashcards';
                    return (
                      <div key={message.id} className="mb-12">
                        <h3 className="text-2xl font-bold text-surge-ink mb-6 text-center capitalize">{topic}</h3>
                        <FlashcardViewer flashcards={message.flashcards!} />
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-surge-ink/50">
                      <Loader2 size={48} className="animate-spin mb-4 text-surge-purple" />
                      <p className="font-medium animate-pulse">Generating your flashcards...</p>
                    </div>
                  )}
                </div>
              ) : currentSession?.type === 'quiz' ? (
                <div className="max-w-5xl mx-auto">
                  {currentSession.messages.filter(m => m.quiz).map((message, idx) => {
                    const messageIndex = currentSession.messages.findIndex(m => m.id === message.id);
                    const userMessage = messageIndex > 0 ? currentSession.messages[messageIndex - 1] : null;
                    const topic = userMessage?.content?.replace(/Generate a \d+ question quiz about /i, '') || 'Quiz';
                    return (
                      <div key={message.id} className="mb-12">
                        <h3 className="text-2xl font-bold text-surge-ink mb-6 text-center capitalize">{topic}</h3>
                        <QuizViewer quiz={message.quiz!} />
                      </div>
                    );
                  })}
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-surge-ink/50">
                      <Loader2 size={48} className="animate-spin mb-4 text-surge-purple" />
                      <p className="font-medium animate-pulse">Generating your quiz...</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  {currentSession?.messages.map((message) => (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      key={message.id}
                      className={cn(
                        "flex gap-6 max-w-5xl mx-auto",
                        message.role === 'user' ? "flex-row-reverse" : "flex-row"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex-shrink-0 flex items-center justify-center font-bold text-sm shadow-lg",
                        message.role === 'user' ? "bg-surge-purple/40 text-white" : "bg-surge-purple text-white"
                      )}>
                        {message.role === 'user' ? (user?.name?.slice(0, 2).toUpperCase() || 'U') : <Aperture size={18} />}
                      </div>
                      <div className={cn(
                        "flex flex-col gap-2 max-w-[80%]",
                        message.role === 'user' ? "items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "px-6 py-4 rounded-3xl text-[15px] leading-relaxed shadow-2xl",
                          message.role === 'user' 
                            ? "bg-surge-purple text-white rounded-tr-none" 
                            : "bg-surge-card border border-surge-border text-surge-ink/90 rounded-tl-none"
                        )}>
                          {message.image && (
                            <img src={`data:image/jpeg;base64,${message.image}`} alt="Attached" className="max-w-xs rounded-xl mb-4" />
                          )}
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {message.attachments.map((imgData, idx) => (
                                <img key={idx} src={`data:image/jpeg;base64,${imgData}`} alt={`Attached ${idx + 1}`} className="max-w-[150px] rounded-xl object-cover" />
                              ))}
                            </div>
                          )}
                          {message.role === 'model' ? (
                            <div className="markdown-body">
                              {message.content && (
                                <Markdown 
                                  remarkPlugins={[remarkMath]} 
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {message.content}
                                </Markdown>
                              )}
                              {message.flashcards && <FlashcardViewer flashcards={message.flashcards} />}
                              {message.quiz && <QuizViewer quiz={message.quiz} />}
                            </div>
                          ) : (
                            <div className="markdown-body user-markdown">
                              {message.content && (
                                <Markdown 
                                  remarkPlugins={[remarkMath]} 
                                  rehypePlugins={[rehypeKatex]}
                                >
                                  {message.content}
                                </Markdown>
                              )}
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-surge-ink/20 px-2 uppercase tracking-tighter">
                          {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-6 max-w-5xl mx-auto"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-surge-purple text-white flex items-center justify-center shadow-lg">
                        <Loader2 size={18} className="animate-spin" />
                      </div>
                      <div className="bg-surge-card border border-surge-border px-6 py-4 rounded-3xl rounded-tl-none shadow-2xl">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 bg-surge-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-surge-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-1.5 h-1.5 bg-surge-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-8 bg-surge-bg border-t border-surge-border">
              <form 
                onSubmit={handleSendMessage}
                className="max-w-5xl mx-auto relative"
              >
                {attachedImages.length > 0 && (
                  <div className="absolute bottom-full left-0 mb-4 p-2 glass-panel rounded-2xl inline-flex gap-2 max-w-full overflow-x-auto">
                    {attachedImages.map((img, idx) => (
                      <div key={idx} className="relative flex-shrink-0">
                        <img src={img.url} alt={`Attached ${idx + 1}`} className="h-20 w-20 object-cover rounded-xl" />
                        <button 
                          type="button"
                          onClick={() => removeAttachedImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-3 bg-surge-card border border-surge-border rounded-[2rem] p-3 focus-within:ring-4 focus-within:ring-surge-purple/10 focus-within:border-surge-purple transition-all shadow-2xl">
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-4 bg-surge-bg hover:bg-surge-purple/10 rounded-2xl text-white/30 hover:text-surge-purple transition-all group"
                    title="Upload image for conspect (max 10)"
                    disabled={attachedImages.length >= 10}
                  >
                    <ImageIcon size={24} className={cn("transition-transform", attachedImages.length < 10 && "group-hover:scale-110")} />
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  <textarea 
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={currentSession?.department === 'Marks' ? "Enter your marks (e.g. Algebra: 3, Science: 4)..." : 
                                 currentSession?.department === 'Flashcards' ? "Enter a new topic to generate more flashcards..." :
                                 currentSession?.department === 'Quizzes' ? "Enter a new topic to generate another quiz..." :
                                 "Message Spyris..."}
                    className="flex-1 bg-transparent border-none focus:ring-0 py-4 text-base resize-none max-h-60 text-surge-ink placeholder:text-surge-ink/20 font-medium"
                  />
                  <button 
                    type="submit"
                    disabled={(!input.trim() && attachedImages.length === 0) || isLoading}
                    className={cn(
                      "p-4 rounded-2xl transition-all shadow-xl",
                      (input.trim() || attachedImages.length > 0) && !isLoading 
                        ? "bg-surge-purple text-white shadow-surge-purple/30 hover:scale-105 active:scale-95" 
                        : "bg-surge-border text-surge-ink/10 cursor-not-allowed"
                    )}
                  >
                    <Send size={24} />
                  </button>
                </div>
                <div className="flex justify-center gap-6 mt-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surge-ink/20">
                    Spyris v2.5 <span className="text-surge-purple">Turbo</span>
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-surge-ink/20">
                    Secure <span className="text-surge-purple">Archive</span>
                  </p>
                </div>
              </form>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {showSubscription && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md glass-panel rounded-[2.5rem] p-10 shadow-2xl relative"
            >
              <button 
                onClick={() => {
                  setShowSubscription(false);
                  setPaymentStep('plan');
                }}
                className="absolute top-6 right-6 p-2 hover:bg-surge-ink/5 rounded-full text-surge-ink/40 transition-colors"
              >
                <X size={20} />
              </button>
              
              {paymentStep === 'plan' ? (
                <>
                  <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-black border border-surge-ink/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-surge-purple/20 icon-glow-container">
                      <Aperture className="lightning-effect" size={32} />
                    </div>
                    <h2 className="text-3xl font-display font-bold text-surge-ink mb-2">Choose Your Plan</h2>
                    <p className="text-surge-ink/40 text-sm">Unlock the full power of SpyrisLearn</p>
                  </div>

                  <div className="space-y-4 mb-10 max-h-[400px] overflow-y-auto pr-2">
                    {/* Basic Plan */}
                    <div className="p-5 rounded-2xl border border-surge-ink/10 bg-surge-ink/5 relative">
                      <h3 className="text-xl font-bold text-surge-ink mb-1">Basic</h3>
                      <p className="text-surge-ink/40 text-sm mb-4">Free forever</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-ink/40" />
                          <span>Basic AI Chat</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-ink/40" />
                          <span>Limited Conspects (3/day)</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-ink/40" />
                          <span>Standard Study Timer</span>
                        </div>
                      </div>
                      <button className="w-full bg-surge-ink/10 text-surge-ink/40 font-bold py-3 rounded-xl cursor-not-allowed">
                        Current Plan
                      </button>
                    </div>

                    {/* Pro Plan */}
                    <div className="p-5 rounded-2xl border-2 border-surge-purple bg-surge-purple/5 relative">
                      <div className="absolute -top-3 right-4 bg-surge-purple text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                        Popular
                      </div>
                      <h3 className="text-xl font-bold text-surge-ink mb-1">Pro</h3>
                      <p className="text-surge-ink/40 text-sm mb-4">$4.99 / month</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Unlimited AI Chat & Conspects</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Priority Marks Analysis</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Unlimited Flashcards & Quizzes</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-surge-purple" />
                          <span>Cloud Sync Across Devices</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedPlan('Pro'); setPaymentStep('checkout'); }}
                        className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-bold py-3 rounded-xl shadow-lg shadow-surge-purple/20 transition-all active:scale-95"
                      >
                        Upgrade to Pro
                      </button>
                    </div>

                    {/* Plus Plan */}
                    <div className="p-5 rounded-2xl border border-amber-500/50 bg-amber-500/5 relative">
                      <h3 className="text-xl font-bold text-surge-ink mb-1">Plus</h3>
                      <p className="text-surge-ink/40 text-sm mb-4">$19.99 / month</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>Everything in Pro</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>1-on-1 AI Voice Tutoring</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>Personalized Study Plans</span>
                        </div>
                        <div className="flex items-center gap-3 text-surge-ink/80 text-sm">
                          <CheckCircle2 size={16} className="text-amber-500" />
                          <span>Early Access to New Features</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { setSelectedPlan('Plus'); setPaymentStep('checkout'); }}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                      >
                        Upgrade to Plus
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-display font-bold text-surge-ink mb-2">Secure Checkout</h2>
                    <p className="text-surge-ink/40 text-sm">Enter payment details for {selectedPlan} plan</p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Cardholder Name</label>
                      <input 
                        type="text"
                        value={paymentForm.cardName}
                        onChange={(e) => setPaymentForm({...paymentForm, cardName: e.target.value})}
                        className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Card Number</label>
                      <input 
                        type="text"
                        value={paymentForm.cardNumber}
                        onChange={(e) => setPaymentForm({...paymentForm, cardNumber: e.target.value})}
                        className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                        placeholder="0000 0000 0000 0000"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">CVV (3 digits)</label>
                      <input 
                        type="text"
                        maxLength={3}
                        value={paymentForm.cvv}
                        onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value})}
                        className="w-16 bg-surge-ink/5 border border-surge-ink/10 rounded-2xl px-3 py-4 text-surge-ink text-center focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                        placeholder="123"
                      />
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      if (!paymentForm.cardName || !paymentForm.cardNumber || !paymentForm.cvv) {
                        alert("Please fill in all payment details.");
                        return;
                      }
                      alert(`Subscription successful! You are now a ${selectedPlan} Student.`);
                      setShowSubscription(false);
                      setPaymentStep('plan');
                      setPaymentForm({ cardNumber: '', cardName: '', cvv: '' });
                    }}
                    className="w-full bg-surge-purple hover:bg-surge-purple-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-surge-purple/20 transition-all active:scale-95 mb-4"
                  >
                    Complete Payment
                  </button>
                  <button 
                    onClick={() => setPaymentStep('plan')}
                    className="w-full text-surge-ink/40 text-sm font-bold hover:text-surge-ink transition-colors"
                  >
                    Back to Plans
                  </button>
                </>
              )}
              
              <p className="text-[10px] text-center text-surge-ink/20 uppercase tracking-widest font-bold mt-4">
                Cancel anytime • Secure payment
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isTimerRunning && selectedDept !== 'Timer' && isFloatingTimerVisible && (
          <motion.div
            drag
            dragMomentum={false}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-24 right-6 z-[60] bg-surge-card border border-surge-purple/30 p-4 rounded-2xl shadow-2xl flex flex-col items-center gap-2 cursor-move min-w-[120px]"
          >
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsFloatingTimerVisible(false);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-surge-ink text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-all z-10"
            >
              <X size={14} />
            </button>
            <div className="flex items-center gap-2 text-surge-purple pointer-events-none">
              <TimerIcon size={16} className={isTimerRunning ? "animate-pulse" : ""} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{timerMode}</span>
            </div>
            <div className="text-2xl font-display font-bold text-surge-ink pointer-events-none">
              {formatTimerTime(timerTimeLeft)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isNewProjectModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surge-card border border-surge-ink/10 p-8 rounded-3xl w-full max-w-md shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-surge-ink mb-6">Create New Project</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (newProjectName.trim()) {
                  createNewSession('chat', 'Projects', `New project: ${newProjectName}`);
                  setNewProjectName('');
                  setIsNewProjectModalOpen(false);
                }
              }}>
                <div className="mb-6">
                  <label className="block text-sm font-bold text-surge-ink/60 mb-2">Project Name</label>
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="e.g., Science Fair, History Essay"
                    className="w-full px-4 py-3 bg-surge-bg border border-surge-border rounded-xl text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/50 focus:border-surge-purple transition-all"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewProjectModalOpen(false);
                      setNewProjectName('');
                    }}
                    className="flex-1 py-3 rounded-xl font-bold text-surge-ink bg-surge-ink/5 hover:bg-surge-ink/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!newProjectName.trim()}
                    className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

