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
  Paperclip,
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
  Square,
  Pause,
  RotateCcw,
  Award,
  ChevronsLeft,
  Sun,
  Moon,
  Palette,
  Link,
  Layers,
  HelpCircle,
  Calendar,
  Copy,
  ArrowRight,
  FileUp,
  Brain,
  Zap,
  Video,
  Sparkles,
  Type as TypeIcon,
  MicOff,
  Download,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { cn, formatTime } from './utils';
import { ChatSession, Message, Department, User } from './types';
import { 
  chatWithSpyrisStream, 
  generateFlashcards, 
  generateQuiz,
  generateVideo,
  generateImage,
  editImage,
  analyzeVideo,
  transcribeAudio
} from './services/geminiService';
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { 
  auth, 
  loginWithGoogle, 
  logout, 
  getUserProfile, 
  createUserProfile, 
  db,
  updateXP,
  createProject,
  updateProjectStatus,
  deleteProject,
  updateMark
} from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

import { FlashcardViewer } from './components/FlashcardViewer';
import { QuizViewer } from './components/QuizViewer';

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surge-bg flex items-center justify-center p-8 text-center">
          <div className="max-w-md bg-surge-card p-10 rounded-[2.5rem] border-2 border-red-500/20 shadow-2xl">
            <AlertCircle size={64} className="text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-display font-bold text-surge-ink mb-4">Something went wrong</h2>
            <p className="text-surge-ink/40 text-sm mb-8 leading-relaxed">
              The neural engine encountered an unexpected error. Don't worry, your data is safe.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-surge-purple text-white font-bold py-4 rounded-2xl shadow-lg shadow-surge-purple/20 transition-all active:scale-95"
            >
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-black/10 rounded-xl text-[10px] text-red-500 text-left overflow-auto max-h-40 font-mono">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  { id: 'SmartVideos', name: 'Smart Videos', color: 'bg-red-500' },
  { id: 'Projects', name: 'Projects', color: 'bg-violet-600' },
];

const getDeptThemeClasses = (deptId: Department) => {
  switch (deptId) {
    case 'General': return { bg: 'bg-surge-purple/20', border: 'border-surge-purple', text: 'text-surge-purple', solid: 'bg-surge-purple' };
    case 'Marks': return { bg: 'bg-amber-500/20', border: 'border-amber-500', text: 'text-amber-500', solid: 'bg-amber-500' };
    case 'Flashcards': return { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-500', solid: 'bg-blue-500' };
    case 'Quizzes': return { bg: 'bg-pink-500/20', border: 'border-pink-500', text: 'text-pink-500', solid: 'bg-pink-500' };
    case 'Plan': return { bg: 'bg-emerald-500/20', border: 'border-emerald-500', text: 'text-emerald-500', solid: 'bg-emerald-500' };
    case 'Test': return { bg: 'bg-rose-500/20', border: 'border-rose-500', text: 'text-rose-500', solid: 'bg-rose-500' };
    case 'Voice': return { bg: 'bg-indigo-500/20', border: 'border-indigo-500', text: 'text-indigo-500', solid: 'bg-indigo-500' };
    case 'Translator': return { bg: 'bg-cyan-500/20', border: 'border-cyan-500', text: 'text-cyan-500', solid: 'bg-cyan-500' };
    case 'Timer': return { bg: 'bg-orange-500/20', border: 'border-orange-500', text: 'text-orange-500', solid: 'bg-orange-500' };
    case 'SmartVideos': return { bg: 'bg-red-500/20', border: 'border-red-500', text: 'text-red-500', solid: 'bg-red-500' };
    case 'Projects': return { bg: 'bg-violet-600/20', border: 'border-violet-600', text: 'text-violet-600', solid: 'bg-violet-600' };
    case 'Experience': return { bg: 'bg-yellow-400/20', border: 'border-yellow-400', text: 'text-yellow-400', solid: 'bg-yellow-400' };
    default: return { bg: 'bg-surge-purple/20', border: 'border-surge-purple', text: 'text-surge-purple', solid: 'bg-surge-purple' };
  }
};

const GeminiThinking = () => (
  <div className="flex items-center gap-3 p-4 bg-surge-purple/5 rounded-2xl border border-surge-purple/10 w-fit animate-pulse">
    <div className="relative">
      <div className="w-8 h-8 rounded-full border-2 border-surge-purple/30 border-t-surge-purple animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Aperture size={14} className="text-surge-purple" />
      </div>
    </div>
    <span className="text-xs font-bold text-surge-purple uppercase tracking-widest">Spyris is thinking...</span>
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

function AppContent() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  const [isThinkingMode, setIsThinkingMode] = useState(false);

  // Live API States
  const [liveSession, setLiveSession] = useState<any>(null);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscription, setLiveTranscription] = useState("");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const playbackTimeRef = useRef<number>(0);

  // STT States
  const [isVoiceTyping, setIsVoiceTyping] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [signupStep, setSignupStep] = useState<'contact' | 'verify' | 'create'>('contact');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [verificationCode, setVerificationCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [demoCode, setDemoCode] = useState('');
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState<'dark' | 'light' | 'night' | 'glass' | 'neon' | 'gold' | 'silver' | 'ocean' | 'diamond'>('dark');

  const [isLiteMode, setIsLiteMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);

  const [toast, setToast] = useState<{message: string, type: 'success'|'error'|'info'} | null>(null);

  const showToast = (message: string, type: 'success'|'error'|'info' = 'info') => {
    setToast({message, type});
    setTimeout(() => setToast(null), 3000);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast("Copied to clipboard!", 'success');
    } catch (err) {
      console.error('Failed to copy: ', err);
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast("Copied to clipboard!", 'success');
      } catch (err2) {
        showToast("Failed to copy to clipboard.", 'error');
      }
      document.body.removeChild(textArea);
    }
  };

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          let profile = await getUserProfile(firebaseUser.uid);
          if (!profile) {
            profile = await createUserProfile(firebaseUser);
          }
          setUser(profile as User);
          setXp(profile.xp || 0);
          setLevel(profile.level || 1);
          setAchievements(profile.badges || []);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth listener error:", error);
        setAuthError("Failed to load user profile. Please try again.");
      } finally {
        setIsAuthLoading(false);
        setIsAuthReady(true);
      }
    });
    return () => unsubscribe();
  }, []);

  // Firestore Sessions Listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'sessions'),
      where('uid', '==', user.uid),
      orderBy('lastUpdated', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessionList = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatSession));
      setSessions(sessionList);
    });
    return () => unsubscribe();
  }, [user]);



  useEffect(() => {
    document.body.className = '';
    if (theme !== 'dark') {
      document.body.classList.add(theme);
    }
  }, [theme]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department>('General');
  
  // Specialized Department States
  const [marksData, setMarksData] = useState<Record<string, string>>({
    'Algebra': '', 'Geometry': '', 'Physics': '', 'Chemistry': '', 'Biology': '',
    'History': '', 'Geography': '', 'Literature': '', 'English': '', 'Computer Science': '',
    'Kazakh Language': '', 'Kazakh Literature': '', 'Russian Language and Literature': '',
    'Kazakh History': '', 'World History': '', 'Informatics': '', 'Rights': ''
  });
  const [flashcardsData, setFlashcardsData] = useState({ grade: '', topic: '', count: 10 });
  const [quizzesData, setQuizzesData] = useState({ grade: '', topic: '', count: 10 });
  const [planGoal, setPlanGoal] = useState('');
  const [planResult, setPlanResult] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [testData, setTestData] = useState({ subject: 'Algebra', topic: '', difficulty: 'Medium' });
  const [marksAnalysisResult, setMarksAnalysisResult] = useState<string | null>(null);
  const [marksDescription, setMarksDescription] = useState('');
  const [isAnalyzingMarks, setIsAnalyzingMarks] = useState(false);
  const [translatorData, setTranslatorData] = useState({ text: '', sourceLang: 'Russian', targetLang: 'English' });
  const [translatorMode, setTranslatorMode] = useState<'translate' | 'writer'>('translate');
  const [translatorResult, setTranslatorResult] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [writerData, setWriterData] = useState({ topic: '', tone: 'Formal', length: 'Medium', language: 'Russian' });
  const [smartVideosData, setSmartVideosData] = useState({ classLevel: '', topic: '', description: '' });
  const [suggestedVideos, setSuggestedVideos] = useState<{id: string, title: string, desc: string}[] | null>(null);
  const [isFetchingVideos, setIsFetchingVideos] = useState(false);
  const [projects, setProjects] = useState<{id: string, name: string, status: 'In Progress' | 'Completed', deadline: string}[]>([]);
  const [newProject, setNewProject] = useState({ name: '', deadline: '' });
  const [disabledSubjects, setDisabledSubjects] = useState<string[]>([]);
  
  // URL context for content generation
  const [contentUrl, setContentUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{name: string, data: string, type: string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Timer States
  const [timerMode, setTimerMode] = useState<'study' | 'break'>('study');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSettings, setTimerSettings] = useState({
    study: 25 * 60, // 25 minutes
    break: 5 * 60   // 5 minutes
  });
  const [timerTimeLeft, setTimerTimeLeft] = useState(25 * 60);
  const [isFloatingTimerVisible, setIsFloatingTimerVisible] = useState(true);

  // Firestore Projects Listener
  useEffect(() => {
    if (!user) {
      setProjects([]);
      return;
    }
    const q = query(
      collection(db, 'projects'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectList = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        name: doc.data().title, 
        status: doc.data().status, 
        deadline: doc.data().deadline || 'No deadline' 
      } as any));
      setProjects(projectList);
    });
    return () => unsubscribe();
  }, [user]);

  // Firestore Marks Listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'marks'),
      where('uid', '==', user.uid)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const marks: Record<string, string> = { ...marksData };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        marks[data.subject] = data.value.toString();
      });
      setMarksData(marks);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (isTimerRunning) {
      setIsFloatingTimerVisible(true);
    }
  }, [isTimerRunning]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Gemini API has a strict 50MB limit for inline data. We limit to 20MB to be safe.
    if (file.size > 20 * 1024 * 1024) {
      showToast("Файл слишком большой. Максимальный размер - 20 МБ.", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target?.result as string;
      setUploadedFile({
        name: file.name,
        data: base64Data.split(',')[1],
        type: file.type
      });
      showToast(`File "${file.name}" uploaded successfully!`, 'success');
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const checkAndAwardAchievement = (achievementId: string) => {
    if (!achievements.includes(achievementId)) {
      const newAchievements = [...achievements, achievementId];
      setAchievements(newAchievements);
      syncAchievements(newAchievements);
      showToast(`Achievement Unlocked: ${ALL_ACHIEVEMENTS[achievementId].name}!`, 'success');
    }
  };

  const syncAchievements = async (newAchievements: string[]) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { badges: newAchievements });
    } catch (e) {
      console.error("Failed to sync achievements", e);
    }
  };

  const addXp = async (amount: number) => {
    const newXp = xp + amount;
    const newLevel = Math.floor(newXp / 100) + 1;
    setXp(newXp);
    if (newLevel > level) {
      setLevel(newLevel);
      if (newLevel === 5) checkAndAwardAchievement('LEVEL_5');
      if (newLevel === 10) checkAndAwardAchievement('LEVEL_10');
    }
    if (user) {
      try {
        await updateXP(user.uid, amount);
      } catch (e) {
        console.error("Failed to sync experience", e);
      }
    }
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
        showToast("Study session complete! Time for a break.", 'success');
      } else {
        showToast("Break over! Time to get back to work.", 'info');
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

  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');

  // Subscription States
  const [showSubscription, setShowSubscription] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'plan' | 'checkout'>('plan');
  const [selectedPlan, setSelectedPlan] = useState<'Pro' | 'Plus'>('Pro');
  const [paymentForm, setPaymentForm] = useState({ cardNumber: '', cardName: '', cvv: '' });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auth Check
  useEffect(() => {
    // Relying on onAuthStateChanged for Firebase Auth
  }, []);

  const syncSessions = async (updatedSessions: ChatSession[], sessionIdToSync: string) => {
    if (!user) return;
    try {
      const sessionToSync = updatedSessions.find(s => s.id === sessionIdToSync);
      if (!sessionToSync) return;

      await setDoc(doc(db, 'sessions', sessionToSync.id), {
        id: sessionToSync.id,
        uid: user.uid,
        title: sessionToSync.title,
        department: sessionToSync.department,
        lastUpdated: Date.now(),
        createdAt: sessionToSync.createdAt,
        isArchived: sessionToSync.isArchived,
        type: sessionToSync.type,
        messages: sessionToSync.messages
      }, { merge: true });
    } catch (error) {
      console.error("Error syncing session:", error);
      throw new Error(JSON.stringify({
        error: error instanceof Error ? error.message : String(error),
        operationType: 'write',
        path: 'sessions/' + sessionIdToSync,
        authInfo: {
          userId: user.uid,
          email: user.email
        }
      }));
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

    if (authMode === 'signup') {
      if (signupStep === 'contact') {
        if (!authForm.email) {
          setAuthError('Please enter your email address');
          return;
        }
        
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(authForm.email)) {
          setAuthError('Please enter a valid email address. Phone numbers are not supported for email signup yet.');
          return;
        }

        // Mock OTP for demo
        setDemoCode(Math.floor(100000 + Math.random() * 900000).toString());
        setSignupStep('verify');
        return;
      }
      
      if (signupStep === 'verify') {
        if (verificationCode.length < 6) {
          setAuthError('Please enter a 6-digit verification code');
          return;
        }
        setSignupStep('create');
        return;
      }
    }

    try {
      if (authMode === 'signup') {
        if (!authForm.name || !authForm.password) {
          setAuthError('Please enter a username and password');
          return;
        }
        if (authForm.password.length < 6) {
          setAuthError('Password must be at least 6 characters long');
          return;
        }

        // Firebase Auth signup
        const { createUserWithEmailAndPassword, updateProfile } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        await updateProfile(userCredential.user, { displayName: authForm.name });
        await createUserProfile(userCredential.user);
      } else {
        if (!authForm.email || !authForm.password) {
          setAuthError('Please enter your email and password');
          return;
        }
        // Firebase Auth login
        const { signInWithEmailAndPassword } = await import('firebase/auth');
        await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
      }
    } catch (e: any) {
      console.error("Auth error:", e);
      let message = e.message || "Authentication failed";
      if (e.code === 'auth/email-already-in-use') message = "This email is already registered. Try logging in instead.";
      if (e.code === 'auth/invalid-email') message = "Invalid email address format.";
      if (e.code === 'auth/weak-password') message = "Password is too weak. Use at least 6 characters.";
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password') message = "Invalid email or password.";
      if (e.code === 'auth/network-request-failed') message = "Network error. Please check your connection.";
      setAuthError(message);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setAuthError('');
      await loginWithGoogle();
    } catch (e: any) {
      console.error("Google login error:", e);
      setAuthError(e.message || "Google login failed");
    }
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setSessions([]);
    setCurrentSessionId(null);
  };

  const playMessage = async (text: string) => {
    try {
      const { textToSpeech } = await import('./services/geminiService');
      const base64Audio = await textToSpeech(text);
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = ctx.createBuffer(1, bytes.length / 2, 24000);
      const nowBuffering = audioBuffer.getChannelData(0);
      const dataView = new DataView(bytes.buffer);
      for (let i = 0; i < bytes.length / 2; i++) {
        nowBuffering[i] = dataView.getInt16(i * 2, true) / 32768;
      }
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
    } catch (e) {
      console.error("Failed to play message:", e);
    }
  };

  const startLiveSession = async () => {
    try {
      const { GoogleGenAI, Modality } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY });
      
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      setAudioContext(ctx);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      const source = ctx.createMediaStreamSource(stream);
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      const sessionPromise = ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Ты Spyris, спокойный и дружелюбный голосовой помощник для учебы. Отвечай кратко, по делу и поддерживай студента. Общайся на том языке, на котором к тебе обращаются.",
        },
        callbacks: {
          onopen: () => {
            setIsLiveActive(true);
            setLiveTranscription("");
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              // Silence the output buffer to prevent echo
              const outputData = e.outputBuffer.getChannelData(0);
              for (let i = 0; i < outputData.length; i++) {
                outputData[i] = 0;
              }

              const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  audio: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
            source.connect(processor);
            processor.connect(ctx.destination);
          },
          onmessage: (message) => {
            if (message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              const floatData = new Float32Array(pcmData.length);
              for (let i = 0; i < pcmData.length; i++) {
                floatData[i] = pcmData[i] / 0x7FFF;
              }
              const buffer = ctx.createBuffer(1, floatData.length, 16000);
              buffer.getChannelData(0).set(floatData);
              const playSource = ctx.createBufferSource();
              playSource.buffer = buffer;
              playSource.connect(ctx.destination);
              
              // Schedule playback to prevent overlapping audio
              const startTime = Math.max(playbackTimeRef.current, ctx.currentTime);
              playSource.start(startTime);
              playbackTimeRef.current = startTime + buffer.duration;
            }
            if (message.serverContent?.interrupted) {
              playbackTimeRef.current = ctx.currentTime;
            }
            if (message.serverContent?.modelTurn?.parts?.[0]?.text) {
               setLiveTranscription(prev => prev + " " + message.serverContent.modelTurn.parts[0].text);
            }
          },
          onclose: () => {
            setIsLiveActive(false);
            setLiveSession(null);
            processorRef.current?.disconnect();
          },
          onerror: (e) => console.error("Live error:", e),
        }
      });

      setLiveSession(await sessionPromise);
    } catch (e: any) {
      console.error("Failed to start live session:", e);
      if (e.name === 'NotAllowedError' || e.message?.includes('Permission denied')) {
        showToast("Пожалуйста, разрешите доступ к микрофону в настройках браузера.", "error");
      } else {
        showToast("Произошла ошибка при запуске голосового помощника.", "error");
      }
    }
  };

  const stopLiveSession = () => {
    if (liveSession) {
      liveSession.close();
      setIsLiveActive(false);
      setLiveSession(null);
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
  };

  const toggleVoiceTyping = () => {
    if (isVoiceTyping) {
      recognitionRef.current?.stop();
      setIsVoiceTyping(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Ваш браузер не поддерживает голосовой ввод.", "error");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      if (event.error === 'not-allowed') {
        showToast("Пожалуйста, разрешите доступ к микрофону в настройках браузера.", "error");
      }
      setIsVoiceTyping(false);
    };

    recognition.onend = () => {
      setIsVoiceTyping(false);
    };

    recognition.start();
    setIsVoiceTyping(true);
    recognitionRef.current = recognition;
  };

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current && selectedDept === 'General' && currentSessionId) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [sessions, currentSessionId, isLoading, selectedDept]);

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
    syncSessions(updated, newSessionId);
    
    if (window.innerWidth < 768) setIsSidebarOpen(false);

    if (initialMessage) {
      handleSendMessage(undefined, initialMessage, newSessionId, type, contentUrl);
      setContentUrl('');
    }
  };

  const handleSendMessage = async (e?: React.FormEvent, customMessage?: string, overrideSessionId?: string, overrideSessionType?: 'chat' | 'conspect' | 'flashcards' | 'quiz', sourceUrl?: string) => {
    e?.preventDefault();
    const messageText = customMessage || input;
    const targetSessionId = overrideSessionId || currentSessionId;
    const currentAttachedImages = [...attachedImages];
    const currentAttachedLinks = [...attachedLinks];
    const currentUploadedFile = uploadedFile ? { ...uploadedFile } : null;
    
    if ((!messageText.trim() && currentAttachedImages.length === 0 && currentAttachedLinks.length === 0 && !sourceUrl && !currentUploadedFile) || !targetSessionId || isLoading) return;

    let finalContent = messageText;
    let effectiveSourceUrl = sourceUrl;
    
    // If no sourceUrl is provided but we have attached links, use the first one as sourceUrl
    if (!effectiveSourceUrl && currentAttachedLinks.length > 0) {
      effectiveSourceUrl = currentAttachedLinks[0];
    }

    if (currentAttachedLinks.length > 0) {
      finalContent += `\n\n[Attached Links: ${currentAttachedLinks.join(', ')}]`;
    }
    if (effectiveSourceUrl && effectiveSourceUrl !== currentAttachedLinks[0]) {
      finalContent += `\n\n[Source URL: ${effectiveSourceUrl}]`;
    }
    if (currentUploadedFile) {
      finalContent += `\n\n[Attached File: ${currentUploadedFile.name}]`;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: finalContent || `[Attached: ${currentAttachedImages.length} image(s)]`,
      timestamp: Date.now(),
      attachments: currentAttachedImages.map(img => img.data)
    };

    setIsLoading(true);
    setInput('');
    setAttachedImages([]);
    setAttachedLinks([]);
    setUploadedFile(null);
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
        const flashcards = await generateFlashcards(userMessage.content, history, effectiveSourceUrl, currentUploadedFile);
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
          syncSessions(finalSessions, targetSessionId);
          return finalSessions;
        });
      } else if (sessionType === 'quiz') {
        const quiz = await generateQuiz(userMessage.content, history, effectiveSourceUrl, currentUploadedFile);
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
          syncSessions(finalSessions, targetSessionId);
          return finalSessions;
        });
      } else {
        const responseStream = await chatWithSpyrisStream(
          userMessage.content, 
          history, 
          department, 
          currentAttachedImages.length > 0 ? currentAttachedImages.map(img => ({ data: img.data, mimeType: 'image/jpeg' })) : undefined, 
          effectiveSourceUrl,
          currentUploadedFile,
          isThinkingMode
        );
        
        const surgeMessageId = crypto.randomUUID();
        let currentContent = "";
        let currentGroundingChunks: any[] = [];

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
          }
          if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
            currentGroundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
          }
          setSessions(prev => prev.map(s => s.id === targetSessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === surgeMessageId ? { ...m, content: currentContent, groundingChunks: currentGroundingChunks } : m)
          } : s));
        }

        // Sync after stream finishes
        setSessions(prev => {
          syncSessions(prev, targetSessionId);
          return prev;
        });
      }

    } catch (error: any) {
      console.error("Spyris error:", error);
      
      if (error.message?.includes('Document size exceeds supported limit') || error.message?.includes('Http response at 400 or 500 level')) {
        showToast("Файл слишком большой для обработки. Пожалуйста, загрузите файл меньшего размера.", "error");
      } else {
        showToast("Произошла ошибка при обращении к ИИ.", "error");
      }

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
        syncSessions(finalSessions, targetSessionId);
        return finalSessions;
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Note: I need to fix the setSessions call in handleSendMessage
  // I'll use a functional update to be safe

  const [attachedImages, setAttachedImages] = useState<{ data: string, mimeType: string, name: string, url: string }[]>([]);
  const [attachedLinks, setAttachedLinks] = useState<string[]>([]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !currentSessionId) return;

    const remainingSlots = 10 - attachedImages.length;
    const filesToProcess = files.slice(0, remainingSlots);

    if (filesToProcess.length === 0) {
      showToast("You can only attach up to 10 images.", 'error');
      return;
    }

    const newImages: { data: string, mimeType: string, name: string, url: string }[] = [];

    for (const file of filesToProcess) {
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Изображение "${file.name}" слишком большое (макс. 5 МБ).`, "error");
        continue;
      }
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
    syncSessions(updated, id);
  };

  const deleteSession = async (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(updated.length > 0 ? updated[0].id : null);
    }
    try {
      await deleteDoc(doc(db, 'sessions', id));
    } catch (e) {
      console.error("Failed to delete session", e);
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
            {authMode === 'login' && (
              <>
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
              </>
            )}

            {authMode === 'signup' && signupStep === 'contact' && (
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
            )}

            {authMode === 'signup' && signupStep === 'verify' && (
              <div>
                <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Verification Code</label>
                <p className="text-xs text-surge-ink/60 mb-3 ml-1">We've sent a code to {authForm.email}</p>
                
                {demoCode && (
                  <div className="mb-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-center">
                    <p className="text-[10px] font-black text-yellow-600 uppercase tracking-widest mb-1">Demo Mode: Verification Code</p>
                    <p className="text-2xl font-display font-black text-yellow-700 tracking-[0.5em]">{demoCode}</p>
                  </div>
                )}

                <input 
                  type="text" 
                  required
                  value={verificationCode}
                  onChange={e => setVerificationCode(e.target.value)}
                  className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all tracking-widest text-center text-lg"
                  placeholder="000000"
                  maxLength={6}
                />
              </div>
            )}

            {authMode === 'signup' && signupStep === 'create' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Username</label>
                  <input 
                    type="text" 
                    required
                    value={authForm.name}
                    onChange={e => setAuthForm({...authForm, name: e.target.value})}
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                    placeholder="Choose a username"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-surge-ink/40 uppercase tracking-widest mb-2 ml-1">Create Password</label>
                  <input 
                    type="password" 
                    required
                    value={authForm.password}
                    onChange={e => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full bg-surge-bg border border-surge-border rounded-2xl px-5 py-4 text-surge-ink focus:outline-none focus:ring-2 focus:ring-surge-purple/30 transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </>
            )}

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
              {authMode === 'login' ? 'Log In' : 
               signupStep === 'contact' ? 'Send Code' :
               signupStep === 'verify' ? 'Verify Code' :
               'Create Account'}
            </button>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surge-border"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-surge-bg px-2 text-surge-ink/40 font-bold tracking-widest">Or continue with</span>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 font-bold py-4 rounded-2xl shadow-sm transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Google</span>
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'signup' : 'login');
                setSignupStep('contact');
                setAuthError('');
              }}
              className="text-surge-purple hover:text-surge-ink text-sm font-bold transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign In" : "Already have an account? Log In"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-surge-bg text-surge-ink font-sans">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl font-bold text-sm flex items-center gap-2 ${
              toast.type === 'success' ? 'bg-emerald-500 text-white' :
              toast.type === 'error' ? 'bg-red-500 text-white' :
              'bg-surge-purple text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} />}
            {toast.type === 'error' && <AlertCircle size={16} />}
            {toast.type === 'info' && <Info size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
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
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-surge-purple hover:bg-surge-purple-dark text-white rounded-xl font-bold transition-all shadow-lg shadow-surge-purple/20 active:scale-95"
              >
                <Plus size={18} />
                <span>New Session</span>
              </button>
              <button 
                onClick={() => setSelectedDept('Projects')}
                className="flex items-center justify-center gap-2 py-3 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-violet-600/20 active:scale-95"
                title="Projects"
              >
                <Layers size={18} />
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
                      ? "bg-yellow-400/20 border-yellow-400 shadow-xl shadow-yellow-400/10"
                      : "bg-surge-ink/5 border-surge-ink/10 hover:border-yellow-400/50"
                  )}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center",
                      selectedDept === 'Experience' ? "bg-yellow-400 text-white" : "bg-surge-purple text-white"
                    )}>
                      <Trophy size={16} />
                    </div>
                    <div className="text-left">
                      <p className={cn("text-[10px] font-bold uppercase tracking-widest", selectedDept === 'Experience' ? "text-yellow-500" : "text-surge-purple")}>Level {level}</p>
                      <p className="text-sm font-bold text-surge-ink">Mastery Rank</p>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-surge-ink/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${xp % 100}%` }}
                      className={cn("h-full", selectedDept === 'Experience' ? "bg-yellow-400" : "bg-surge-purple")}
                    />
                  </div>
                </button>
              </div>

              {/* Departments Filter */}
              <div className="px-2">
                <h2 className="px-2 text-[10px] font-bold uppercase tracking-widest text-surge-ink/30 mb-3">Departments</h2>
                  <div className="flex flex-col gap-1.5 px-2">
                    {DEPARTMENTS.filter(d => d.id !== 'Experience').map(dept => {
                      const theme = getDeptThemeClasses(dept.id);
                      return (
                        <button
                          key={dept.id}
                          onClick={() => setSelectedDept(dept.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border",
                            selectedDept === dept.id 
                              ? `${theme.bg} ${theme.border} ${theme.text}` 
                              : "bg-transparent border-surge-border text-surge-ink/40 hover:border-surge-ink/20"
                          )}
                        >
                          <div className={cn("w-2 h-2 rounded-full", dept.color)} />
                          {dept.name}
                        </button>
                      );
                    })}
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
                      const themes: ('dark' | 'light' | 'night' | 'glass' | 'neon' | 'gold' | 'silver' | 'ocean' | 'diamond')[] = ['dark', 'light', 'night', 'glass', 'neon', 'gold', 'silver', 'ocean', 'diamond'];
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
        {/* Hidden File Input for Attach File buttons */}
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".pdf,.txt,.doc,.docx,.md"
          className="hidden"
        />
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 border-b border-surge-border bg-surge-card">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-surge-purple">
            <Menu size={24} />
          </button>
          <h1 className="font-display font-bold text-surge-ink">SpyrisLearn</h1>
          <div className="w-10" />
        </div>

        {!currentSessionId ? (
          <div className="flex-1 flex flex-col items-center justify-start p-8 pt-20 text-center relative overflow-y-auto">
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
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-amber-500/20 relative overflow-hidden text-left">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-amber-500">
                    <Aperture size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-amber-500 mb-2 tracking-tight">Grade Analyzer</h3>
                  <p className="text-surge-ink/40 mb-10 text-sm font-medium">Enter your current marks (0-5) for a personalized improvement plan.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 relative z-10">
                    {Object.keys(marksData).map(subject => {
                      const isDisabled = disabledSubjects.includes(subject);
                      return (
                        <div key={subject} className={cn(
                          "flex items-center justify-between p-4 bg-surge-ink/5 rounded-2xl border transition-all group",
                          isDisabled ? "opacity-40 border-surge-ink/5" : "border-surge-ink/10 hover:border-amber-500/30"
                        )}>
                          <div className="flex items-center gap-3 overflow-hidden">
                            <button 
                              onClick={() => {
                                if (isDisabled) {
                                  setDisabledSubjects(disabledSubjects.filter(s => s !== subject));
                                } else {
                                  setDisabledSubjects([...disabledSubjects, subject]);
                                }
                              }}
                              className={cn(
                                "p-1.5 rounded-lg transition-all",
                                isDisabled ? "text-amber-500 bg-amber-500/10" : "text-surge-ink/20 hover:text-amber-500 hover:bg-amber-500/10 opacity-0 group-hover:opacity-100"
                              )}
                              title={isDisabled ? "Show subject" : "Hide subject"}
                            >
                              {isDisabled ? <Plus size={14} /> : <X size={14} />}
                            </button>
                            <span className={cn(
                              "text-sm font-bold text-surge-ink truncate",
                              isDisabled && "line-through opacity-30"
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
                            onChange={async (e) => {
                              const newVal = e.target.value;
                              setMarksData({...marksData, [subject]: newVal});
                              if (user && newVal) {
                                await updateMark(user.uid, subject, parseInt(newVal));
                              }
                            }}
                            className={cn(
                              "w-14 bg-amber-500/10 border border-amber-500/20 rounded-xl px-2 py-2 text-center text-surge-ink font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/50",
                              isDisabled && "cursor-not-allowed opacity-30"
                            )}
                          />
                        </div>
                      );
                    })}
                  </div>
                  {Object.keys(marksData).length === 0 && (
                    <div className="text-center py-12 mb-10 bg-surge-ink/5 rounded-[2rem] border-2 border-dashed border-surge-ink/10">
                      <p className="text-surge-ink/40 font-bold uppercase tracking-widest mb-4">No subjects detected</p>
                      <button 
                        onClick={() => setMarksData({
                          'Algebra': '', 'Geometry': '', 'Chemistry': '', 'Physics': '', 'Biology': '', 'Geography': '', 'English': '',
                          'Kazakh Language': '', 'Kazakh Literature': '', 'Russian Language and Literature': '',
                          'Kazakh History': '', 'World History': '', 'Informatics': '', 'Rights': ''
                        })}
                        className="text-amber-500 font-black text-xs uppercase tracking-widest hover:underline"
                      >
                        Initialize Default Subjects
                      </button>
                    </div>
                  )}

                  <div className="mb-10 relative z-10">
                    <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Дополнительная информация (например, какие темы вызывают трудности)</label>
                    <textarea 
                      rows={3}
                      placeholder="Опишите вашу ситуацию, цели или проблемы с предметами..."
                      value={marksDescription}
                      onChange={(e) => setMarksDescription(e.target.value)}
                      className="w-full bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-amber-500/50 transition-all resize-none font-medium text-sm"
                    />
                  </div>

                  <button 
                    onClick={async () => {
                      const activeMarks = Object.entries(marksData)
                        .filter(([s]) => !disabledSubjects.includes(s) && marksData[s] !== '');
                      
                      if (activeMarks.length === 0) {
                        showToast("Please enter at least one mark to analyze.", 'error');
                        return;
                      }

                      setIsAnalyzingMarks(true);
                      try {
                        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                        const marksStr = activeMarks.map(([s, g]) => `${s}: ${g}`).join(', ');
                        const response = await ai.models.generateContent({
                          model: "gemini-3-flash-preview",
                          contents: `Analyze these academic marks (on a 0-5 scale): ${marksStr}. ${marksDescription ? `Additional context from user: ${marksDescription}` : ''} Provide a personalized improvement plan, identifying strengths and weaknesses. Format as a structured list with clear advice for each subject. Use Markdown.`,
                        });
                        setMarksAnalysisResult(response.text || "No analysis generated.");
                        addXp(50);
                      } catch (err) {
                        console.error(err);
                        setMarksAnalysisResult("Error analyzing marks.");
                      } finally {
                        setIsAnalyzingMarks(false);
                      }
                    }}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-amber-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                  >
                    {isAnalyzingMarks ? 'ANALYZING...' : 'EXECUTE_ANALYSIS'}
                  </button>
                  {marksAnalysisResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-10 text-left relative z-10"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-amber-500 font-display font-bold text-xl uppercase tracking-widest">Analysis Result</h4>
                        <button 
                          onClick={() => setMarksAnalysisResult(null)}
                          className="text-[10px] font-black text-surge-ink/30 uppercase tracking-widest hover:text-amber-500 transition-colors"
                        >
                          Clear Analysis
                        </button>
                      </div>
                      <div className="bg-surge-ink/5 p-8 rounded-[2rem] border border-surge-ink/10 shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="prose prose-invert prose-sm max-w-none text-surge-ink/80 leading-relaxed">
                          <Markdown>{marksAnalysisResult}</Markdown>
                        </div>
                      </div>
                      <div className="mt-8">
                        <button 
                          onClick={() => copyToClipboard(marksAnalysisResult!)}
                          className="w-full bg-surge-ink/10 text-surge-ink font-bold py-4 rounded-2xl hover:bg-surge-ink/20 transition-all"
                        >
                          Copy Analysis
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : selectedDept === 'Flashcards' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-blue-500/20 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-blue-500">
                    <Layers size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-blue-500 mb-2 tracking-tight relative z-10">Flashcard Studio</h3>
                  <p className="text-surge-ink/40 mb-10 text-sm font-medium relative z-10">Create custom study cards in seconds.</p>
                  
                  <div className="space-y-6 mb-10 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">Class / Grade</label>
                        <input 
                          type="text"
                          placeholder="e.g. 10th Grade, College Freshman"
                          value={flashcardsData.grade}
                          onChange={(e) => setFlashcardsData({...flashcardsData, grade: e.target.value})}
                          className="w-full bg-surge-ink/10 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-blue-500/30 focus:bg-surge-ink/[0.05] transition-all"
                        />
                      </div>
                      <div className="md:w-1/3">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">Count</label>
                        <select 
                          value={flashcardsData.count}
                          onChange={(e) => setFlashcardsData({...flashcardsData, count: parseInt(e.target.value)})}
                          className="w-full bg-surge-ink/10 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-blue-500/30 focus:bg-surge-ink/[0.05] transition-all appearance-none cursor-pointer"
                        >
                          <option value={5} className="bg-surge-bg text-surge-ink">5 Cards</option>
                          <option value={10} className="bg-surge-bg text-surge-ink">10 Cards</option>
                          <option value={15} className="bg-surge-bg text-surge-ink">15 Cards</option>
                          <option value={20} className="bg-surge-bg text-surge-ink">20 Cards</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-3 ml-2">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest">Topic</label>
                        <div className="flex items-center gap-4">
                          {uploadedFile ? (
                            <button 
                              onClick={clearFile}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                            >
                              <X size={12} />
                              Clear File
                            </button>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                "text-surge-ink/30 hover:text-blue-500"
                              )}
                            >
                              <Paperclip size={12} />
                              Attach File
                            </button>
                          )}
                          <button 
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                              contentUrl ? "text-blue-500" : "text-surge-ink/30 hover:text-blue-500"
                            )}
                          >
                            <Link size={12} />
                            {contentUrl ? "Link Attached" : "Attach Link"}
                          </button>
                        </div>
                      </div>
                      <input 
                        type="text"
                        placeholder="e.g. World War II, React Hooks, Spanish Verbs"
                        value={flashcardsData.topic}
                        onChange={(e) => setFlashcardsData({...flashcardsData, topic: e.target.value})}
                        className="w-full bg-surge-ink/10 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-blue-500/30 focus:bg-surge-ink/[0.05] transition-all"
                      />
                    </div>

                    {showUrlInput && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4 relative"
                      >
                        <button 
                          onClick={() => setShowUrlInput(false)}
                          className="absolute top-2 right-2 p-1 text-surge-ink/30 hover:text-surge-ink bg-surge-ink/5 hover:bg-surge-ink/10 rounded-full transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <label className="block text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-2 ml-1">Source URL (YouTube, Article, etc.)</label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            placeholder="https://..."
                            value={contentUrl}
                            onChange={(e) => setContentUrl(e.target.value)}
                            className="flex-1 bg-surge-ink/10 border border-blue-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 transition-all text-surge-ink"
                          />
                          {contentUrl && (
                            <button 
                              onClick={() => setContentUrl('')}
                              className="p-2 text-surge-ink/30 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                  <button 
                    disabled={!flashcardsData.topic}
                    onClick={() => {
                      const gradeContext = flashcardsData.grade ? ` for a ${flashcardsData.grade} student` : '';
                      const urlContext = contentUrl ? ` based on this source: ${contentUrl}` : '';
                      createNewSession('flashcards', 'Flashcards', `Generate ${flashcardsData.count} flashcards about ${flashcardsData.topic}${gradeContext}${urlContext}`);
                      addXp(30);
                    }}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Generate Flashcards
                  </button>
                </div>
              ) : selectedDept === 'Quizzes' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-pink-500/20 relative overflow-hidden">
                  <div className="absolute -left-10 -bottom-10 w-64 h-64 bg-pink-500/5 rounded-full blur-3xl"></div>
                  <div className="absolute -left-10 -bottom-10 opacity-5 pointer-events-none text-pink-500">
                    <HelpCircle size={200} />
                  </div>
                  
                  <div className="relative z-10">
                    <h3 className="text-3xl font-display font-black text-pink-500 mb-2 tracking-tight">Pop Quiz Generator</h3>
                    <p className="text-surge-ink/40 mb-10 text-sm font-medium">Test your knowledge with AI-generated questions.</p>
                    
                    <div className="space-y-8 mb-10">
                      <div className="border-b-2 border-surge-ink/10 pb-4">
                        <div className="flex items-center justify-between mb-2 ml-1">
                          <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest">Student Grade/Class</label>
                        <div className="flex items-center gap-4">
                          {uploadedFile ? (
                            <button 
                              onClick={clearFile}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                            >
                              <X size={12} />
                              Clear File
                            </button>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                "text-surge-ink/30 hover:text-pink-500"
                              )}
                            >
                              <Paperclip size={12} />
                              Attach File
                            </button>
                          )}
                          <button 
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                              contentUrl ? "text-pink-500" : "text-surge-ink/30 hover:text-pink-500"
                            )}
                          >
                            <Link size={12} />
                            {contentUrl ? "Link Attached" : "Attach Link"}
                          </button>
                        </div>
                        </div>
                        <input 
                          type="text"
                          placeholder="e.g. 8th Grade, High School Senior"
                          value={quizzesData.grade}
                          onChange={(e) => setQuizzesData({...quizzesData, grade: e.target.value})}
                          className="w-full bg-surge-ink/10 border-none rounded-xl px-4 py-3 text-surge-ink font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/30 placeholder:text-surge-ink/20"
                        />
                      </div>

                      {showUrlInput && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-pink-500/5 border border-pink-500/20 rounded-2xl p-4 relative"
                        >
                          <button 
                            onClick={() => setShowUrlInput(false)}
                            className="absolute top-2 right-2 p-1 text-surge-ink/30 hover:text-surge-ink bg-surge-ink/5 hover:bg-surge-ink/10 rounded-full transition-colors"
                          >
                            <X size={14} />
                          </button>
                          <label className="block text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-2 ml-1">Source URL (YouTube, Article, etc.)</label>
                          <div className="flex gap-2">
                            <input 
                              type="url"
                              placeholder="https://..."
                              value={contentUrl}
                              onChange={(e) => setContentUrl(e.target.value)}
                              className="flex-1 bg-surge-ink/10 border border-pink-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pink-500 transition-all text-surge-ink"
                            />
                            {contentUrl && (
                              <button 
                                onClick={() => setContentUrl('')}
                                className="p-2 text-surge-ink/30 hover:text-red-500 transition-colors"
                              >
                                <X size={16} />
                              </button>
                            )}
                          </div>
                        </motion.div>
                      )}
                      <div className="border-b-2 border-surge-ink/10 pb-4">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Quiz Topic</label>
                        <input 
                          type="text"
                          placeholder="e.g. Quantum Physics, European Capitals"
                          value={quizzesData.topic}
                          onChange={(e) => setQuizzesData({...quizzesData, topic: e.target.value})}
                          className="w-full bg-surge-ink/10 border-none rounded-xl px-4 py-3 text-surge-ink font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/30 placeholder:text-surge-ink/20"
                        />
                      </div>
                      <div className="border-b-2 border-surge-ink/10 pb-4">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Number of Questions</label>
                        <select 
                          value={quizzesData.count}
                          onChange={(e) => setQuizzesData({...quizzesData, count: parseInt(e.target.value)})}
                          className="w-full bg-surge-ink/10 border-none rounded-xl px-4 py-3 text-surge-ink font-bold text-lg focus:outline-none focus:ring-2 focus:ring-pink-500/30 appearance-none cursor-pointer"
                        >
                          <option value={5} className="bg-surge-bg text-surge-ink">5 Questions (Short)</option>
                          <option value={10} className="bg-surge-bg text-surge-ink">10 Questions (Standard)</option>
                          <option value={15} className="bg-surge-bg text-surge-ink">15 Questions (Long)</option>
                          <option value={20} className="bg-surge-bg text-surge-ink">20 Questions (Exam)</option>
                        </select>
                      </div>
                    </div>
                    <button 
                      disabled={!quizzesData.topic}
                      onClick={() => {
                        const gradeContext = quizzesData.grade ? ` for a ${quizzesData.grade} student` : '';
                        const urlContext = contentUrl ? ` based on this source: ${contentUrl}` : '';
                        createNewSession('quiz', 'Quizzes', `Generate a ${quizzesData.count}-question quiz about ${quizzesData.topic}${gradeContext}${urlContext}`);
                        addXp(30);
                      }}
                      className="w-full bg-pink-500 hover:bg-pink-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-pink-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Begin Quiz
                    </button>
                  </div>
                </div>
              ) : selectedDept === 'Plan' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-green-500/20 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-green-500">
                    <Calendar size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-green-500 mb-2 tracking-tight relative z-10">Study Plan Architect</h3>
                  <p className="text-surge-ink/40 text-sm mb-10 font-medium relative z-10">Build a structured path to your academic goals.</p>
                  
                  {!planResult ? (
                    <>
                      <div className="space-y-6 mb-10 text-left relative z-10">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-2">What are you studying for?</label>
                        <textarea 
                          rows={4}
                          placeholder="e.g. Final Exams in 2 weeks, Learning Python from scratch, SAT preparation..."
                          value={planGoal}
                          onChange={(e) => setPlanGoal(e.target.value)}
                          className="w-full bg-surge-ink/5 border-2 border-transparent rounded-2xl px-6 py-5 text-surge-ink font-bold focus:outline-none focus:border-green-500/30 focus:bg-surge-ink/[0.02] transition-all resize-none shadow-inner text-sm"
                        />
                      </div>
                      <button 
                        disabled={!planGoal.trim() || isPlanning}
                        onClick={async () => {
                          setIsPlanning(true);
                          try {
                            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                            const response = await ai.models.generateContent({
                              model: "gemini-3-flash-preview",
                              contents: `Create a detailed, step-by-step study plan for the following goal: ${planGoal}. Format it as a structured list with clear milestones and daily tasks. Use Markdown.`,
                            });
                            setPlanResult(response.text || "No plan generated.");
                            if (user) await updateXP(user.uid, 50);
                          } catch (err) {
                            console.error(err);
                            setPlanResult("Error generating plan.");
                          } finally {
                            setIsPlanning(false);
                          }
                        }}
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-green-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                      >
                        {isPlanning ? 'ARCHITECTING...' : 'DRAFT_MY_PLAN'}
                      </button>
                    </>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-left relative z-10"
                    >
                      <div className="flex justify-between items-center mb-6">
                        <h4 className="text-green-500 font-display font-bold text-xl uppercase tracking-widest">Your Study Roadmap</h4>
                        <div className="flex gap-4">
                          <button 
                            onClick={async () => {
                              if (user) {
                                await createProject(user.uid, `Plan: ${planGoal.slice(0, 20)}...`, 'No deadline');
                                showToast("Plan added to your projects!", 'success');
                              }
                            }}
                            className="text-[10px] font-black text-green-500 uppercase tracking-widest hover:underline"
                          >
                            Add to Projects
                          </button>
                          <button 
                            onClick={() => setPlanResult(null)}
                            className="text-[10px] font-black text-surge-ink/30 uppercase tracking-widest hover:text-green-500 transition-colors"
                          >
                            Create New Plan
                          </button>
                        </div>
                      </div>
                      <div className="bg-surge-ink/5 p-8 rounded-[2rem] border border-surge-ink/10 shadow-inner max-h-[500px] overflow-y-auto custom-scrollbar">
                        <div className="prose prose-invert prose-sm max-w-none text-surge-ink/80 leading-relaxed">
                          <Markdown>{planResult}</Markdown>
                        </div>
                      </div>
                      <div className="mt-8">
                        <button 
                          onClick={() => copyToClipboard(planResult)}
                          className="w-full bg-surge-ink/10 text-surge-ink font-bold py-4 rounded-2xl hover:bg-surge-ink/20 transition-all"
                        >
                          Copy Plan
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : selectedDept === 'Test' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-rose-500/20 relative overflow-hidden">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-rose-500">
                    <FileText size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-rose-500 mb-2 tracking-tight relative z-10">Test Generator</h3>
                  <p className="text-surge-ink/40 text-sm mb-10 font-medium relative z-10">Create comprehensive practice tests for any subject.</p>
                  
                  <div className="space-y-6 mb-10 text-left relative z-10">
                    <div className="bg-surge-ink/10 p-5 rounded-2xl border border-surge-ink/20">
                      <div className="flex items-center justify-between mb-3 ml-1">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest">Subject</label>
                        <div className="flex items-center gap-4">
                          {uploadedFile ? (
                            <button 
                              onClick={clearFile}
                              className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 hover:text-red-600 transition-colors"
                            >
                              <X size={12} />
                              Clear File
                            </button>
                          ) : (
                            <button 
                              onClick={() => fileInputRef.current?.click()}
                              className={cn(
                                "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                                "text-surge-ink/30 hover:text-rose-500"
                              )}
                            >
                              <Paperclip size={12} />
                              Attach File
                            </button>
                          )}
                          <button 
                            onClick={() => setShowUrlInput(!showUrlInput)}
                            className={cn(
                              "flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest transition-colors",
                              contentUrl ? "text-rose-500" : "text-surge-ink/30 hover:text-rose-500"
                            )}
                          >
                            <Link size={12} />
                            {contentUrl ? "Link Attached" : "Attach Link"}
                          </button>
                        </div>
                      </div>
                      <select 
                        value={testData.subject}
                        onChange={(e) => setTestData({...testData, subject: e.target.value})}
                        className="w-full bg-transparent border-none px-1 py-2 text-surge-ink font-bold text-lg focus:outline-none focus:ring-0 appearance-none cursor-pointer"
                      >
                        {Object.keys(marksData).map(s => <option key={s} value={s} className="bg-surge-bg text-surge-ink">{s}</option>)}
                      </select>
                    </div>

                    {showUrlInput && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-rose-500/5 border border-rose-500/20 rounded-2xl p-4 relative"
                      >
                        <button 
                          onClick={() => setShowUrlInput(false)}
                          className="absolute top-2 right-2 p-1 text-surge-ink/30 hover:text-surge-ink bg-surge-ink/5 hover:bg-surge-ink/10 rounded-full transition-colors"
                        >
                          <X size={14} />
                        </button>
                        <label className="block text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-2 ml-1">Source URL (YouTube, Article, etc.)</label>
                        <div className="flex gap-2">
                          <input 
                            type="url"
                            placeholder="https://..."
                            value={contentUrl}
                            onChange={(e) => setContentUrl(e.target.value)}
                            className="flex-1 bg-surge-ink/10 border border-rose-500/20 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-rose-500 transition-all text-surge-ink"
                          />
                          {contentUrl && (
                            <button 
                              onClick={() => setContentUrl('')}
                              className="p-2 text-surge-ink/30 hover:text-red-500 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                    <div className="bg-surge-ink/10 p-5 rounded-2xl border border-surge-ink/20">
                      <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-1">Topic</label>
                      <input 
                        type="text"
                        placeholder="e.g. Photosynthesis, Quadratic Equations"
                        value={testData.topic}
                        onChange={(e) => setTestData({...testData, topic: e.target.value})}
                        className="w-full bg-transparent border-none px-1 py-2 text-surge-ink font-bold text-lg focus:outline-none focus:ring-0 placeholder:text-surge-ink/20"
                      />
                    </div>
                    <div className="bg-surge-ink/10 p-5 rounded-2xl border border-surge-ink/20">
                      <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-3 ml-1">Difficulty</label>
                      <div className="grid grid-cols-3 gap-4">
                        {['Easy', 'Medium', 'Hard'].map(level => (
                          <button
                            key={level}
                            onClick={() => setTestData({...testData, difficulty: level})}
                            className={cn(
                              "py-4 rounded-xl text-sm font-bold transition-all border-2",
                              testData.difficulty === level 
                                ? "bg-rose-500 text-white border-rose-500 shadow-lg shadow-rose-500/20" 
                                : "bg-transparent border-surge-ink/10 text-surge-ink/40 hover:border-rose-500/30 hover:text-rose-500"
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
                      const urlContext = contentUrl ? ` based on this source: ${contentUrl}` : '';
                      createNewSession('quiz', 'Test', `Generate a ${testData.difficulty} test for ${testData.subject} on the topic: ${testData.topic}${urlContext}. Include 5 multiple choice questions.`);
                      addXp(50);
                    }}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
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
                  <p className="text-surge-ink/40 text-sm mb-6 font-medium">Neural machine translation engine & Smart Text Writer.</p>
                  
                  <div className="flex space-x-2 mb-6 relative z-10 bg-surge-ink/5 p-1 rounded-xl">
                    <button
                      onClick={() => setTranslatorMode('translate')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${translatorMode === 'translate' ? 'bg-emerald-500 text-white shadow-md' : 'text-surge-ink/50 hover:text-surge-ink'}`}
                    >
                      Translate
                    </button>
                    <button
                      onClick={() => setTranslatorMode('writer')}
                      className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${translatorMode === 'writer' ? 'bg-emerald-500 text-white shadow-md' : 'text-surge-ink/50 hover:text-surge-ink'}`}
                    >
                      Smart Writer
                    </button>
                  </div>

                  {translatorMode === 'translate' ? (
                    <>
                      <div className="space-y-6 mb-8 text-left relative z-10">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Source</label>
                            <select 
                              value={translatorData.sourceLang}
                              onChange={(e) => setTranslatorData({...translatorData, sourceLang: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold"
                            >
                              {['Auto Detect', 'Russian', 'English', 'Kazakh', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Arabic', 'Italian', 'Portuguese'].map(lang => (
                                <option key={lang} value={lang} className="bg-surge-card text-surge-ink">{lang}</option>
                              ))}
                            </select>
                          </div>
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Target</label>
                            <select 
                              value={translatorData.targetLang}
                              onChange={(e) => setTranslatorData({...translatorData, targetLang: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold"
                            >
                              {['English', 'Russian', 'Kazakh', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Turkish', 'Arabic', 'Italian', 'Portuguese'].map(lang => (
                                <option key={lang} value={lang} className="bg-surge-card text-surge-ink">{lang}</option>
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
                        disabled={!translatorData.text.trim() || isTranslating}
                        onClick={async () => {
                          setIsTranslating(true);
                          try {
                            const source = translatorData.sourceLang === 'Auto Detect' ? 'detected language' : translatorData.sourceLang;
                            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                            const response = await ai.models.generateContent({
                              model: "gemini-3-flash-preview",
                              contents: `Translate the following text from ${source} to ${translatorData.targetLang}:\n\n${translatorData.text}`,
                            });
                            setTranslatorResult(response.text || "No translation generated.");
                            addXp(20);
                          } catch (err) {
                            console.error(err);
                            setTranslatorResult("Error generating translation.");
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-mono font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                      >
                        {isTranslating ? 'TRANSLATING...' : 'EXECUTE_TRANSLATION'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="space-y-6 mb-8 text-left relative z-10">
                        <div>
                          <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">What do you want to write?</label>
                          <textarea 
                            rows={3}
                            placeholder="e.g., A message to my parents asking for permission to go to a party..."
                            value={writerData.topic}
                            onChange={(e) => setWriterData({...writerData, topic: e.target.value})}
                            className="w-full bg-surge-ink/5 border border-surge-ink/10 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-emerald-500/50 transition-all resize-none font-medium text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Tone</label>
                            <select 
                              value={writerData.tone}
                              onChange={(e) => setWriterData({...writerData, tone: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold text-sm"
                            >
                              {['Formal', 'Casual', 'Persuasive', 'Apologetic', 'Friendly'].map(t => (
                                <option key={t} value={t} className="bg-surge-card text-surge-ink">{t}</option>
                              ))}
                            </select>
                          </div>
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Length</label>
                            <select 
                              value={writerData.length}
                              onChange={(e) => setWriterData({...writerData, length: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold text-sm"
                            >
                              {['Short', 'Medium', 'Long'].map(l => (
                                <option key={l} value={l} className="bg-surge-card text-surge-ink">{l}</option>
                              ))}
                            </select>
                          </div>
                          <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                            <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Language</label>
                            <select 
                              value={writerData.language}
                              onChange={(e) => setWriterData({...writerData, language: e.target.value})}
                              className="w-full bg-transparent border-none px-1 py-2 text-surge-ink focus:outline-none focus:ring-0 appearance-none font-bold text-sm"
                            >
                              {['Russian', 'English', 'Kazakh', 'Spanish', 'French'].map(lang => (
                                <option key={lang} value={lang} className="bg-surge-card text-surge-ink">{lang}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <button 
                        disabled={!writerData.topic.trim() || isTranslating}
                        onClick={async () => {
                          setIsTranslating(true);
                          try {
                            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                            const response = await ai.models.generateContent({
                              model: "gemini-3-flash-preview",
                              contents: `Write a ${writerData.length.toLowerCase()}, ${writerData.tone.toLowerCase()} message in ${writerData.language} about: ${writerData.topic}`,
                            });
                            setTranslatorResult(response.text || "No text generated.");
                            addXp(20);
                          } catch (err) {
                            console.error(err);
                            setTranslatorResult("Error generating text.");
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                        className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 font-mono font-bold py-4 rounded-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
                      >
                        {isTranslating ? 'GENERATING...' : 'GENERATE_TEXT'}
                      </button>
                    </>
                  )}
                  
                  {translatorResult && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-8 p-8 bg-surge-card rounded-3xl text-left relative z-10 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-t-8 border-emerald-500 overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-500">
                        <Globe size={80} />
                      </div>
                      <div className="flex justify-between items-center mb-6 border-b border-surge-ink/5 pb-4">
                        <div>
                          <h4 className="text-emerald-500 font-display font-bold text-lg uppercase tracking-widest">AI Result Screen</h4>
                          <p className="text-surge-ink/40 text-[10px] font-bold uppercase tracking-widest">Generated by Spyris Neural Engine</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => copyToClipboard(translatorResult)}
                            className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg hover:bg-emerald-500/20 transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              handleSendMessage(undefined, `[AI Generated Result]:\n\n${translatorResult}`);
                              setTranslatorResult('');
                            }}
                            className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            title="Send to chat"
                          >
                            <Send size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="text-surge-ink font-medium whitespace-pre-wrap leading-relaxed font-sans text-lg">
                        {translatorResult}
                      </div>
                      <div className="mt-8 pt-4 border-t border-surge-ink/5 flex justify-between items-center">
                        <div className="flex gap-1">
                          {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-500/20" />)}
                        </div>
                        <span className="text-[10px] font-bold text-emerald-500/30 uppercase tracking-tighter">End of transmission</span>
                      </div>
                    </motion.div>
                  )}
                </div>
              ) : selectedDept === 'Voice' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-indigo-500/20 relative overflow-hidden flex flex-col items-center min-h-[500px] justify-center">
                  <div className="absolute -left-10 -top-10 w-64 h-64 bg-surge-purple/5 rounded-full blur-3xl"></div>
                  <div className="absolute -left-10 -top-10 opacity-5 pointer-events-none text-surge-purple">
                    <Mic size={200} />
                  </div>
                  
                  <div className="relative z-10 text-center mb-12">
                    <h2 className="text-4xl font-display font-bold text-surge-ink mb-4">Voice Chat</h2>
                    <p className="text-surge-ink/40 font-medium">Спокойный и дружелюбный собеседник для обсуждения учебы</p>
                  </div>

                  <div className="w-48 h-48 rounded-full bg-surge-purple/10 flex items-center justify-center mb-12 relative z-10">
                    {isLiveActive && (
                      <>
                        <motion.div 
                          animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="absolute inset-0 bg-surge-purple rounded-full"
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                          className="absolute inset-0 bg-surge-purple rounded-full"
                        />
                      </>
                    )}
                    <div className={cn(
                      "w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 z-10",
                      isLiveActive ? "bg-surge-purple shadow-surge-purple/40 scale-110" : "bg-surge-ink/10"
                    )}>
                      {isLiveActive ? <Volume2 size={50} className="text-white animate-pulse" /> : <Mic size={50} className="text-surge-ink/40" />}
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-6 relative z-10 w-full max-w-md">
                    {isLiveActive ? (
                      <button 
                        onClick={stopLiveSession}
                        className="px-12 py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-2xl shadow-xl shadow-red-500/20 transition-all active:scale-95 flex items-center gap-3"
                      >
                        <Square size={20} fill="currentColor" />
                        STOP
                      </button>
                    ) : (
                      <button 
                        onClick={startLiveSession}
                        className="px-12 py-4 bg-surge-purple hover:bg-surge-purple/90 text-white font-bold rounded-2xl shadow-xl shadow-surge-purple/20 transition-all active:scale-95 flex items-center gap-3"
                      >
                        <Play size={20} fill="currentColor" />
                        START
                      </button>
                    )}

                    {liveTranscription && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full p-6 bg-surge-ink/5 rounded-2xl border border-surge-ink/5 text-center"
                      >
                        <p className="text-surge-ink/60 italic text-sm leading-relaxed">
                          "{liveTranscription.slice(-150)}..."
                        </p>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : selectedDept === 'Experience' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-yellow-500/20 relative overflow-hidden text-left">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-yellow-500">
                    <Trophy size={200} />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center gap-8 mb-12">
                      <div className="w-24 h-24 rounded-[2rem] bg-yellow-500 flex items-center justify-center shadow-2xl shadow-yellow-500/40 flex-shrink-0 rotate-3">
                        <Trophy className="text-white" size={48} />
                      </div>
                      <div className="text-center md:text-left">
                        <h3 className="text-4xl font-display font-black text-surge-ink mb-2 tracking-tight uppercase">LEVEL {user?.level || 1}</h3>
                        <div className="flex items-center gap-3 justify-center md:justify-start">
                          <span className="text-yellow-500 font-black uppercase tracking-[0.2em] text-xs px-3 py-1 bg-yellow-500/10 rounded-full border border-yellow-500/20">Mastery Rank: {user?.rank || 'Novice Scholar'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 mb-12">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                        <span className="text-surge-ink/30">Progress to Level {(user?.level || 1) + 1}</span>
                        <span className="text-yellow-500">{(user?.xp || 0) % 1000} / 1000 XP</span>
                      </div>
                      <div className="w-full h-6 bg-surge-ink/5 rounded-2xl overflow-hidden border-2 border-surge-ink/5 p-1">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${((user?.xp || 0) % 1000) / 10}%` }}
                          className="h-full bg-yellow-500 rounded-xl shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
                      <div className="bg-surge-ink/5 rounded-3xl p-8 border border-surge-ink/5 text-center group hover:border-yellow-500/30 transition-all">
                        <span className="block text-3xl font-display font-black text-surge-ink mb-2 group-hover:text-yellow-500 transition-colors">{user?.xp || 0}</span>
                        <span className="text-[10px] text-surge-ink/30 uppercase font-black tracking-widest">Total XP</span>
                      </div>
                      <div className="bg-surge-ink/5 rounded-3xl p-8 border border-surge-ink/5 text-center group hover:border-yellow-500/30 transition-all">
                        <span className="block text-3xl font-display font-black text-surge-ink mb-2 group-hover:text-yellow-500 transition-colors">{user?.level || 1}</span>
                        <span className="text-[10px] text-surge-ink/30 uppercase font-black tracking-widest">Current Level</span>
                      </div>
                      <div className="bg-surge-ink/5 rounded-3xl p-8 border border-surge-ink/5 text-center group hover:border-yellow-500/30 transition-all">
                        <span className="block text-3xl font-display font-black text-surge-ink mb-2 group-hover:text-yellow-500 transition-colors">{user?.badges?.length || 0}</span>
                        <span className="text-[10px] text-surge-ink/30 uppercase font-black tracking-widest">Achievements</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-surge-ink/30 uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                          <div className="w-8 h-px bg-yellow-500/30"></div>
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
                              className="w-full flex items-center justify-between p-5 bg-surge-ink/5 rounded-2xl border border-transparent hover:border-yellow-500/30 transition-all cursor-pointer group"
                            >
                              <div className="flex items-center gap-5">
                                <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 group-hover:bg-yellow-500 group-hover:text-white transition-all">
                                  <quest.icon size={20} />
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-surge-ink">{quest.name}</p>
                                  <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mt-1">+{quest.xp} XP</p>
                                </div>
                              </div>
                              <ArrowRight size={16} className="text-surge-ink/20 group-hover:text-yellow-500 transition-all group-hover:translate-x-1" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <h4 className="text-xs font-black text-surge-ink/30 uppercase tracking-[0.3em] flex items-center gap-3 mb-8">
                          <div className="w-8 h-px bg-yellow-500/30"></div>
                          Unlocked Badges
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          {Object.entries(ALL_ACHIEVEMENTS).map(([id, ach]) => {
                            const isUnlocked = achievements.includes(id);
                            return (
                              <div 
                                key={id} 
                                className={cn(
                                  "p-5 rounded-3xl border transition-all flex flex-col items-center text-center gap-3",
                                  isUnlocked 
                                    ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-600" 
                                    : "bg-surge-ink/5 border-transparent text-surge-ink/10 grayscale opacity-40"
                                )}
                              >
                                <div className={cn("p-3 rounded-2xl shadow-lg", isUnlocked ? "bg-yellow-500 text-white shadow-yellow-500/20" : "bg-surge-ink/10")}>
                                  {ach.icon}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter leading-tight">{ach.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : selectedDept === 'SmartVideos' ? (
                <div className="bg-surge-card rounded-[2rem] p-8 shadow-2xl mb-12 border border-red-500/20 relative overflow-hidden text-surge-ink">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-red-500">
                    <Play size={200} />
                  </div>
                  
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div>
                      <h3 className="text-2xl font-display font-bold text-red-500 mb-1">Smart Videos</h3>
                      <p className="text-surge-ink/40 text-xs font-medium">Discover educational content.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 text-left relative z-10">
                        <div>
                          <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Class / Grade Level</label>
                          <input 
                            type="text"
                            placeholder="e.g., 10th Grade..."
                            value={smartVideosData.classLevel}
                            onChange={(e) => setSmartVideosData({...smartVideosData, classLevel: e.target.value})}
                            className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-red-500/50 transition-all font-medium text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Topic</label>
                          <input 
                            type="text"
                            placeholder="e.g., Quantum Physics..."
                            value={smartVideosData.topic}
                            onChange={(e) => setSmartVideosData({...smartVideosData, topic: e.target.value})}
                            className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-red-500/50 transition-all font-medium text-sm"
                          />
                        </div>
                      </div>
                      <div className="mb-8 text-left relative z-10">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Additional Description (Optional)</label>
                        <textarea 
                          placeholder="Provide more context to find the perfect video..."
                          value={smartVideosData.description}
                          onChange={(e) => setSmartVideosData({...smartVideosData, description: e.target.value})}
                          className="w-full bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-red-500/50 transition-all font-medium text-sm h-24 resize-none"
                        />
                      </div>
                      <div className="flex gap-4 relative z-10">
                        <button 
                          disabled={!smartVideosData.classLevel.trim() || !smartVideosData.topic.trim() || isFetchingVideos}
                          onClick={async () => {
                            setIsFetchingVideos(true);
                            try {
                              const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
                              const response = await ai.models.generateContent({
                                model: "gemini-3.1-pro-preview", // Use pro for better search and extraction
                                contents: `Search Google for educational YouTube videos about "${smartVideosData.topic}" for ${smartVideosData.classLevel}. ${smartVideosData.description ? `Additional context: ${smartVideosData.description}` : ''} 
                                
                                CRITICAL INSTRUCTIONS:
                                1. You MUST use the googleSearch tool to find REAL youtube.com video URLs.
                                2. Extract the exact 11-character video ID from the 'v=' parameter of the real YouTube URLs you find.
                                3. DO NOT make up, guess, or hallucinate video IDs. If you don't find real URLs, search again.
                                4. Return ONLY a JSON array of objects with 'id' (the 11-character YouTube video ID), 'title', and 'desc' (brief description).`,
                                config: {
                                  tools: [{ googleSearch: {} }],
                                  toolConfig: { includeServerSideToolInvocations: true } as any,
                                  responseMimeType: "application/json",
                                  responseSchema: {
                                    type: Type.ARRAY,
                                    items: {
                                      type: Type.OBJECT,
                                      properties: {
                                        id: { type: Type.STRING },
                                        title: { type: Type.STRING },
                                        desc: { type: Type.STRING }
                                      },
                                      required: ["id", "title", "desc"]
                                    }
                                  }
                                }
                              });
                              
                              try {
                                const videos = JSON.parse(response.text || "[]");
                                setSuggestedVideos(videos);
                              } catch (e) {
                                console.error("Failed to parse videos JSON", e);
                                setSuggestedVideos([]);
                              }
                              addXp(20);
                            } catch (err) {
                              console.error(err);
                              setSuggestedVideos([]);
                            } finally {
                              setIsFetchingVideos(false);
                            }
                          }}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[0.2em] py-6 rounded-2xl shadow-2xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isFetchingVideos ? 'SEARCHING...' : 'FIND_VIDEOS'}
                        </button>
                        <button 
                          disabled={!smartVideosData.topic.trim() || isFetchingVideos}
                          onClick={async () => {
                            setIsFetchingVideos(true);
                            try {
                              const { analyzeVideo } = await import('./services/geminiService');
                              // This is a mock for now as we'd need a video file
                              createNewSession('chat', 'SmartVideos', `Analyze educational videos about ${smartVideosData.topic} for ${smartVideosData.classLevel}. What are the key concepts I should focus on?`);
                              addXp(30);
                            } catch (err) {
                              console.error(err);
                            } finally {
                              setIsFetchingVideos(false);
                            }
                          }}
                          className="px-8 bg-surge-ink/10 hover:bg-surge-ink/20 text-surge-ink font-bold uppercase tracking-widest py-6 rounded-2xl transition-all border border-surge-ink/10"
                        >
                          ANALYZE_CONTENT
                        </button>
                      </div>
                  {suggestedVideos && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-12 space-y-8 relative z-10"
                    >
                      <div className="flex items-center gap-4 mb-6">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
                        <h4 className="text-red-500 font-display font-black text-lg uppercase tracking-[0.3em]">Curated Learning Path</h4>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-red-500/30 to-transparent"></div>
                      </div>
                      
                      {suggestedVideos.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {suggestedVideos.map((video, idx) => (
                            <motion.div 
                              key={idx}
                              whileHover={{ y: -5 }}
                              className="bg-surge-card border border-red-500/10 rounded-[2rem] overflow-hidden shadow-2xl hover:shadow-red-500/20 transition-all group"
                            >
                              <div className="aspect-video w-full bg-black relative">
                                <iframe 
                                  src={`https://www.youtube.com/embed/${video.id}`} 
                                  title={video.title}
                                  className="absolute inset-0 w-full h-full opacity-90 group-hover:opacity-100 transition-opacity"
                                  allowFullScreen
                                ></iframe>
                                <div className="absolute top-4 left-4 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Video {idx + 1}</div>
                              </div>
                              <div className="p-6 text-left">
                                <h5 className="font-display font-bold text-lg text-surge-ink mb-3 line-clamp-2 leading-tight group-hover:text-red-500 transition-colors">{video.title}</h5>
                                <p className="text-surge-ink/50 text-sm line-clamp-3 leading-relaxed font-medium">{video.desc}</p>
                                <div className="mt-6 pt-4 border-t border-surge-ink/5 flex justify-between items-center">
                                  <div className="flex gap-4">
                                    <button 
                                      onClick={() => {
                                        const msg = `Generate a conspect for this video: ${video.title} - https://www.youtube.com/watch?v=${video.id}`;
                                        if (!currentSessionId) {
                                          createNewSession('chat', 'SmartVideos', msg);
                                        } else {
                                          handleSendMessage(undefined, msg);
                                        }
                                      }}
                                      className="text-[10px] font-black text-surge-ink/30 uppercase tracking-widest hover:text-red-500 transition-colors"
                                    >
                                      Generate Conspect
                                    </button>
                                    <button 
                                      onClick={() => {
                                        const msg = `Check out this video: ${video.title} - https://www.youtube.com/watch?v=${video.id}`;
                                        if (!currentSessionId) {
                                          createNewSession('chat', 'SmartVideos', msg);
                                        } else {
                                          handleSendMessage(undefined, msg);
                                        }
                                      }}
                                      className="text-[10px] font-black text-surge-ink/30 uppercase tracking-widest hover:text-red-500 transition-colors"
                                    >
                                      Send to Chat
                                    </button>
                                    <button 
                                      onClick={() => window.open(`https://www.youtube.com/watch?v=${video.id}`, '_blank')}
                                      className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline"
                                    >
                                      Watch on YouTube →
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-surge-ink/5 rounded-[2rem] py-20 text-center border-2 border-dashed border-surge-ink/10">
                          <Play size={48} className="mx-auto text-surge-ink/10 mb-4" />
                          <p className="text-surge-ink/30 font-bold uppercase tracking-widest">No transmissions found</p>
                          <p className="text-surge-ink/20 text-xs mt-2">Try adjusting your search parameters</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </div>
              ) : selectedDept === 'Projects' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-violet-500/20 relative overflow-hidden text-left">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-violet-500">
                    <Layers size={200} />
                  </div>
                  <h3 className="text-3xl font-display font-black text-violet-500 mb-2 tracking-tight">Project Manager</h3>
                  <p className="text-surge-ink/40 mb-10 text-sm font-medium">Track your academic projects, assignments, and long-term goals.</p>
                  
                  <div className="flex flex-col md:flex-row gap-4 mb-10 relative z-10">
                      <div className="flex-1">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Project Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Science Fair Research"
                          value={newProject.name}
                          onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                          className="w-full bg-violet-500/10 border border-violet-500/20 rounded-2xl px-6 py-4 text-surge-ink focus:outline-none focus:border-violet-500/50 transition-all font-bold"
                        />
                      </div>
                      <div className="w-full md:w-48">
                        <label className="block text-[10px] font-bold text-surge-ink/30 uppercase tracking-widest mb-2 ml-1">Deadline</label>
                        <input 
                          type="date" 
                          value={newProject.deadline}
                          onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                          className="w-full bg-violet-500/10 border border-violet-500/20 rounded-2xl px-6 py-4 text-surge-ink focus:outline-none focus:border-violet-500/50 transition-all font-bold"
                        />
                      </div>
                    <div className="flex items-end">
                      <button 
                        onClick={async () => {
                          if (!newProject.name.trim()) {
                            showToast("Please enter a project name.", 'error');
                            return;
                          }
                          if (user) {
                            await createProject(user.uid, newProject.name.trim(), newProject.deadline || 'No deadline');
                            setNewProject({ name: '', deadline: '' });
                            checkAndAwardAchievement('FIRST_PROJECT');
                          }
                        }}
                        className="w-full md:w-auto bg-violet-500 hover:bg-violet-600 text-white px-8 py-4 rounded-2xl transition-all shadow-lg shadow-violet-500/20 active:scale-95 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs"
                      >
                        <Plus size={20} />
                        Create Project
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4 relative z-10">
                    {projects.length === 0 ? (
                      <div className="text-center py-20 bg-surge-ink/5 rounded-[2rem] border-2 border-dashed border-surge-ink/10">
                        <Archive className="mx-auto text-surge-ink/10 mb-4" size={48} />
                        <p className="text-surge-ink/30 font-bold uppercase tracking-widest text-xs">No active projects</p>
                      </div>
                    ) : (
                      projects.map((project) => (
                        <div 
                          key={project.id}
                          className="flex items-center justify-between p-6 bg-white rounded-3xl border border-surge-ink/5 shadow-lg group hover:border-violet-500/30 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <button 
                              onClick={async () => {
                                const newStatus = project.status === 'Completed' ? 'In Progress' : 'Completed';
                                await updateProjectStatus(project.id, newStatus);
                              }}
                              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${project.status === 'Completed' ? 'bg-emerald-500 text-white' : 'bg-surge-ink/5 text-surge-ink/20 hover:bg-violet-500/10 hover:text-violet-500'}`}
                            >
                              {project.status === 'Completed' ? <CheckCircle2 size={20} /> : <div className="w-4 h-4 rounded-full border-2 border-current" />}
                            </button>
                            <div>
                              <h4 className={`font-display font-bold text-lg transition-all ${project.status === 'Completed' ? 'text-surge-ink/30 line-through' : 'text-surge-ink'}`}>{project.name}</h4>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-surge-ink/30 flex items-center gap-1">
                                  <Calendar size={10} className="text-violet-500" />
                                  {project.deadline || 'No deadline'}
                                </span>
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-violet-500/10 text-violet-500'}`}>
                                  {project.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => handleSendMessage(undefined, `I'm working on my project: ${project.name}. Help me with the next steps!`)}
                              className="p-3 bg-surge-ink/5 text-surge-ink/40 rounded-xl hover:bg-violet-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="Ask AI for help"
                            >
                              <HelpCircle size={18} />
                            </button>
                            <button 
                              onClick={async () => {
                                await deleteProject(project.id);
                              }}
                              className="p-3 bg-surge-ink/5 text-surge-ink/40 rounded-xl hover:bg-red-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                              title="Delete project"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : selectedDept === 'Timer' ? (
                <div className="bg-surge-card rounded-[2.5rem] p-10 shadow-2xl mb-12 border-2 border-red-500/20 relative overflow-hidden flex flex-col items-center">
                  <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none text-red-500">
                    <Clock size={200} />
                  </div>
                  <div className="flex gap-4 mb-8 relative z-10">
                    <button 
                      onClick={() => {
                        setTimerMode('study');
                        setTimerTimeLeft(timerSettings.study);
                        setIsTimerRunning(false);
                      }}
                      className={cn(
                        "px-6 py-2 rounded-xl font-bold transition-all",
                        timerMode === 'study' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-surge-ink/5 text-surge-ink/40 hover:bg-surge-ink/10"
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
                        timerMode === 'break' ? "bg-red-500 text-white shadow-lg shadow-red-500/20" : "bg-surge-ink/5 text-surge-ink/40 hover:bg-surge-ink/10"
                      )}
                    >
                      Break
                    </button>
                  </div>

                  <div className="text-8xl font-display font-bold text-red-500 mb-10 tracking-tighter relative z-10">
                    {formatTimerTime(timerTimeLeft)}
                  </div>

                  <div className="flex items-center gap-6 mb-12 relative z-10">
                    <button 
                      onClick={() => setIsTimerRunning(!isTimerRunning)}
                      className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 hover:scale-110 transition-all active:scale-95"
                    >
                      {isTimerRunning ? <Pause size={32} className="text-white" /> : <Play size={32} className="text-white ml-1" />}
                    </button>
                    <button 
                      onClick={() => {
                        setIsTimerRunning(false);
                        setTimerTimeLeft(timerSettings[timerMode]);
                      }}
                      className="w-14 h-14 rounded-full bg-surge-ink/5 flex items-center justify-center text-surge-ink/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                    >
                      <RotateCcw size={24} />
                    </button>
                  </div>

                  <div className="w-full max-w-md space-y-8 text-left relative z-10">
                    <h4 className="text-xs font-bold text-surge-ink/40 uppercase tracking-widest ml-2">Settings</h4>
                    
                    <div className="space-y-6">
                      <div className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10">
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
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
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
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
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
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
                            />
                            <span className="block text-[8px] text-center text-surge-ink/30 uppercase font-bold">Seconds</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-surge-ink/5 p-5 rounded-2xl border border-surge-ink/10">
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
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
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
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
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
                              className="w-full bg-transparent border-none px-3 py-2 text-surge-ink text-center font-bold text-lg focus:outline-none focus:ring-0"
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
                  {isLoading && <GeminiThinking />}
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
                                  remarkPlugins={[remarkMath, remarkGfm]} 
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-surge-purple hover:underline" />
                                  }}
                                >
                                  {message.content}
                                </Markdown>
                              )}
                              {message.groundingChunks && message.groundingChunks.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-surge-ink/10">
                                  <h4 className="text-xs font-bold text-surge-ink/50 uppercase tracking-widest mb-2">Sources</h4>
                                  <div className="flex flex-wrap gap-2">
                                    {message.groundingChunks.map((chunk, idx) => {
                                      if (chunk.web?.uri) {
                                        return (
                                          <a 
                                            key={idx} 
                                            href={chunk.web.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-surge-ink/5 hover:bg-surge-ink/10 rounded-lg text-xs font-medium text-surge-ink/70 transition-colors"
                                          >
                                            <span className="truncate max-w-[200px]">{chunk.web.title || new URL(chunk.web.uri).hostname}</span>
                                          </a>
                                        );
                                      }
                                      return null;
                                    })}
                                  </div>
                                </div>
                              )}
                              {message.flashcards && <FlashcardViewer flashcards={message.flashcards} />}
                              {message.quiz && <QuizViewer quiz={message.quiz} />}
                              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-surge-ink/5">
                                <button 
                                  onClick={() => playMessage(message.content)}
                                  className="p-2 bg-surge-ink/5 hover:bg-surge-purple/10 text-surge-ink/40 hover:text-surge-purple rounded-lg transition-all"
                                  title="Play audio"
                                >
                                  <Volume2 size={14} />
                                </button>
                                <button 
                                  className="p-2 bg-surge-ink/5 hover:bg-surge-purple/10 text-surge-ink/40 hover:text-surge-purple rounded-lg transition-all"
                                  title="Copy text"
                                  onClick={() => copyToClipboard(message.content)}
                                >
                                  <Copy size={14} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="markdown-body user-markdown">
                              {message.content && (
                                <Markdown 
                                  remarkPlugins={[remarkMath, remarkGfm]} 
                                  rehypePlugins={[rehypeKatex]}
                                  components={{
                                    a: ({node, ...props}) => <a {...props} target="_blank" rel="noopener noreferrer" className="underline" />
                                  }}
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
                  
                  {isLoading && <GeminiThinking />}
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
                {attachedLinks.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {attachedLinks.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-surge-purple/10 border border-surge-purple/20 text-surge-purple px-3 py-1.5 rounded-xl text-xs font-bold">
                        <Link size={12} />
                        <span className="max-w-[150px] truncate">{link}</span>
                        <button 
                          onClick={() => setAttachedLinks(prev => prev.filter((_, i) => i !== idx))}
                          className="hover:text-white transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-end gap-3 bg-surge-card border border-surge-border rounded-[2rem] p-3 focus-within:ring-4 focus-within:ring-surge-purple/10 focus-within:border-surge-purple transition-all shadow-2xl">
                  <div className="flex flex-col gap-2 pl-2 pb-2">
                    <button
                      type="button"
                      onClick={() => setIsThinkingMode(!isThinkingMode)}
                      className={cn(
                        "p-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest",
                        isThinkingMode ? "bg-surge-purple text-white shadow-lg shadow-surge-purple/20" : "bg-surge-ink/5 text-surge-ink/40 hover:bg-surge-ink/10"
                      )}
                      title="Toggle Thinking Mode"
                    >
                      <Brain size={16} />
                      {isThinkingMode && <span>Thinking</span>}
                    </button>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setIsLinkModalOpen(true)}
                    className="p-4 bg-surge-bg hover:bg-surge-purple/10 rounded-2xl text-white/30 hover:text-surge-purple transition-all group"
                    title="Attach a link"
                  >
                    <Link size={24} className="transition-transform group-hover:scale-110" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "p-4 bg-surge-bg hover:bg-surge-purple/10 rounded-2xl transition-all group",
                      uploadedFile ? "text-emerald-500" : "text-white/30 hover:text-surge-purple"
                    )}
                    title="Upload file (PDF, TXT, DOC)"
                  >
                    <FileUp size={24} className="transition-transform group-hover:scale-110" />
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      // Trigger image upload
                      const imgInput = document.createElement('input');
                      imgInput.type = 'file';
                      imgInput.accept = 'image/*';
                      imgInput.multiple = true;
                      imgInput.onchange = (e: any) => handleImageUpload(e);
                      imgInput.click();
                    }}
                    className="p-4 bg-surge-bg hover:bg-surge-purple/10 rounded-2xl text-white/30 hover:text-surge-purple transition-all group"
                    title="Upload image for conspect (max 10)"
                    disabled={attachedImages.length >= 10}
                  >
                    <ImageIcon size={24} className={cn("transition-transform", attachedImages.length < 10 && "group-hover:scale-110")} />
                  </button>
                  
                  <div className="flex-1 flex flex-col">
                    {uploadedFile && (
                      <div className="mb-2 flex flex-wrap items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit">
                        <div className="flex items-center gap-2">
                          <FileText size={14} className="text-emerald-500" />
                          <span className="text-[10px] font-bold text-emerald-600 truncate max-w-[150px]">{uploadedFile.name}</span>
                          <button onClick={clearFile} className="text-emerald-500 hover:text-red-500 transition-colors">
                            <X size={14} />
                          </button>
                        </div>
                        <div className="h-4 w-[1px] bg-emerald-500/20 mx-1" />
                        <div className="flex gap-1">
                          <button 
                            onClick={() => {
                              createNewSession('flashcards', 'Flashcards', `Generate flashcards based on the uploaded file: ${uploadedFile.name}`);
                            }}
                            className="text-[9px] font-black uppercase tracking-tighter bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600 transition-all"
                          >
                            Flashcards
                          </button>
                          <button 
                            onClick={() => {
                              createNewSession('quiz', 'Quizzes', `Generate a quiz based on the uploaded file: ${uploadedFile.name}`);
                            }}
                            className="text-[9px] font-black uppercase tracking-tighter bg-pink-500 text-white px-2 py-1 rounded-md hover:bg-pink-600 transition-all"
                          >
                            Quiz
                          </button>
                          <button 
                            onClick={() => {
                              createNewSession('chat', 'Test', `Generate a test based on the uploaded file: ${uploadedFile.name}`);
                            }}
                            className="text-[9px] font-black uppercase tracking-tighter bg-orange-500 text-white px-2 py-1 rounded-md hover:bg-orange-600 transition-all"
                          >
                            Test
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="w-full flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleVoiceTyping}
                        className={cn(
                          "p-2 rounded-xl transition-all flex-shrink-0 flex items-center justify-center",
                          isVoiceTyping 
                            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse" 
                            : "bg-surge-ink/5 text-surge-ink/40 hover:bg-surge-ink/10 hover:text-surge-ink"
                        )}
                        title="Голосовой ввод"
                      >
                        <Mic size={20} />
                      </button>
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
                        placeholder={isVoiceTyping ? "Говорите..." : uploadedFile ? `Ask about ${uploadedFile.name}...` : 
                                     currentSession?.department === 'Marks' ? "Enter your marks (e.g. Algebra: 3, Science: 4)..." : 
                                     currentSession?.department === 'Flashcards' ? "Enter a new topic to generate more flashcards..." :
                                     currentSession?.department === 'Quizzes' ? "Enter a new topic to generate another quiz..." :
                                     "Message Spyris..."}
                        className="w-full bg-transparent border-none focus:ring-0 py-4 text-base resize-none max-h-60 text-surge-ink placeholder:text-surge-ink/20 font-medium"
                      />
                    </div>
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={(!input.trim() && attachedImages.length === 0 && !uploadedFile) || isLoading}
                    className={cn(
                      "p-4 rounded-2xl transition-all shadow-xl",
                      (input.trim() || attachedImages.length > 0 || uploadedFile) && !isLoading 
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
                        showToast("Please fill in all payment details.", 'error');
                        return;
                      }
                      showToast(`Subscription successful! You are now a ${selectedPlan} Student.`, 'success');
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
        {isLinkModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-surge-ink/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-surge-card border border-surge-border rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setIsLinkModalOpen(false)}
                className="absolute top-6 right-6 text-surge-ink/40 hover:text-surge-ink transition-colors"
              >
                <X size={24} />
              </button>
              
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-surge-purple/10 flex items-center justify-center text-surge-purple">
                  <Link size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-display font-bold text-surge-ink">Attach Link</h3>
                  <p className="text-surge-ink/50 text-sm">Website, YouTube, or Presentation URL</p>
                </div>
              </div>

              <input 
                type="url"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-surge-bg border border-surge-border rounded-xl px-4 py-3 text-surge-ink focus:outline-none focus:border-surge-purple/50 transition-all mb-6"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && linkInput) {
                    setAttachedLinks(prev => [...prev, linkInput]);
                    setLinkInput('');
                    setIsLinkModalOpen(false);
                  }
                }}
              />

              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setIsLinkModalOpen(false)}
                  className="px-6 py-3 rounded-xl font-bold text-surge-ink/60 hover:bg-surge-ink/5 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (linkInput) {
                      setAttachedLinks(prev => [...prev, linkInput]);
                      setLinkInput('');
                      setIsLinkModalOpen(false);
                    }
                  }}
                  disabled={!linkInput}
                  className="px-6 py-3 rounded-xl font-bold bg-surge-purple text-white hover:bg-surge-purple-dark transition-colors disabled:opacity-50"
                >
                  Attach
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}

