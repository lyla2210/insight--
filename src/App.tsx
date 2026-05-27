/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, ChevronLeft, ChevronRight, Smartphone, Vibrate } from 'lucide-react';
import { useShake } from './hooks/useShake';
import { AppButton } from './components/AppButton';
import { HexagramLogo } from './components/HexagramLogo';
import { QuestionGuide } from './components/QuestionGuide';
import { ResultCard } from './components/ResultCard';
import { InterpretationPanel } from './components/InterpretationPanel';

// --- Types ---
type AppState = 'CONNECTION' | 'CALM' | 'GUIDE' | 'INPUT' | 'TOSSING' | 'INTERPRETING' | 'RESULT';

interface HexagramData {
  count: number;
  results: number[]; // 1 for Yang, 0 for Yin
}

// --- Components ---

const ArcHeader = () => {
  return (
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[140%] md:w-full overflow-hidden pointer-events-none" style={{ height: '350px' }}>
       <motion.svg 
          viewBox="0 0 1000 400" 
          className="w-full h-full opacity-60"
          animate={{ rotate: [0, 5, -5, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
       >
          <motion.ellipse 
            cx="500" cy="-80" rx="420" ry="320"
            fill="none" 
            stroke="white" 
            strokeWidth="0.5"
            strokeDasharray="4 4"
            className="opacity-10"
          />
          <motion.ellipse 
            cx="500" cy="-80" rx="460" ry="340"
            fill="none" 
            stroke="white" 
            strokeWidth="1"
            className="opacity-30"
          />
          
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
            style={{ originX: "500px", originY: "-80px" }}
          >
            {[...Array(20)].map((_, i) => {
              const angle = (i * (360 / 20)) * (Math.PI / 180);
              const x = 500 + 460 * Math.cos(angle);
              const y = -80 + 340 * Math.sin(angle);
              return (
                <motion.circle
                  key={i}
                  cx={x} cy={y}
                  r={i % 4 === 0 ? "4" : "2"}
                  fill="white"
                  stroke="white"
                  strokeWidth="0.5"
                  animate={{
                    opacity: [0.1, 0.6, 0.1],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              );
            })}
          </motion.g>
       </motion.svg>
    </div>
  );
};

const CalmBreathingGrid = () => {
  const breathDuration = 19;
  const breathTimes = [0, 4 / breathDuration, 11 / breathDuration, 1];

  return (
    <div className="grid grid-cols-6 gap-3.5 md:gap-4">
      {[...Array(36)].map((_, i) => {
        const delay = (i % 6) * 0.08 + Math.floor(i / 6) * 0.03;

        return (
          <motion.div
            key={i}
            className="w-4 h-4 md:w-5 md:h-5 rounded-sm hex-dot-glow"
            animate={{
              opacity: [0.06, 0.92, 0.92, 0.08],
              scale: [0.92, 1.02, 1.02, 0.95],
            }}
            transition={{
              duration: breathDuration,
              times: breathTimes,
              repeat: Infinity,
              repeatType: 'loop',
              ease: 'easeInOut',
              delay,
            }}
          />
        );
      })}
    </div>
  );
};


export default function App() {
  const [appState, setAppState] = useState<AppState>('CONNECTION');
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [question, setQuestion] = useState('');
  const [hexagram, setHexagram] = useState<HexagramData>({ count: 0, results: [] });
  const [isTossing, setIsTossing] = useState(false);
  const [interpretation, setInterpretation] = useState('');
  const [isInterpreting, setIsInterpreting] = useState(false);
  const [error, setError] = useState('');
  const [time, setTime] = useState(new Date());
  const [webShakeMode, setWebShakeMode] = useState(false);
  const interpretationAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (appState !== 'RESULT') return;

    const timer = window.setTimeout(() => {
      interpretationAnchorRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 220);

    return () => window.clearTimeout(timer);
  }, [appState]);

  const proceedToGuide = () => setAppState('GUIDE');
  const proceedToCalm = () => setAppState('CALM');
  const proceedToInput = () => setAppState('INPUT');
  const startTossing = () => question.trim() && setAppState('TOSSING');

  const simulateToss = useCallback(() => {
    if (hexagram.count >= 6 || isTossing) return;
    setIsTossing(true);
    setTimeout(() => {
      const result = Math.random() > 0.5 ? 1 : 0;
      setHexagram(prev => ({
        count: prev.count + 1,
        results: [...prev.results, result]
      }));
      setIsTossing(false);
    }, 1000);
  }, [hexagram.count, isTossing]);

  const shakeEnabled =
    appState === 'TOSSING' && hexagram.count < 6 && !isTossing;

  const {
    isSupported: shakeSupported,
    permission: shakePermission,
    requestPermission: requestShakePermission,
    isListening: shakeListening,
  } = useShake({
    enabled: shakeEnabled && webShakeMode,
    onShake: simulateToss,
  });

  /** 在用户点击瞬间请求「动作与方向」权限，须保持同步手势链 */
  const handleConnectDice = async () => {
    if (connecting) return;
    setConnecting(true);
    setWebShakeMode(true);

    await requestShakePermission();

    setTimeout(() => {
      setConnecting(false);
      setConnected(true);
    }, 1200);
  };

  const interpretHexagram = async () => {
    setError('');
    setInterpretation('');
    setIsInterpreting(true);
    setAppState('RESULT');

    try {
      const response = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, hexagram: hexagram.results }),
      });

      const contentType = response.headers.get('content-type') ?? '';

      if (!response.ok) {
        let message = `Request failed (${response.status})`;
        if (contentType.includes('application/json')) {
          const errData = await response.json().catch(() => ({}));
          if (typeof errData.error === 'string') message = errData.error;
        } else {
          const text = await response.text().catch(() => '');
          if (text) {
            message = text.slice(0, 160);
          }
        }
        throw new Error(message);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        if (chunk) {
          setInterpretation(fullText);
        }
      }

      fullText += decoder.decode();

      if (!fullText.trim()) {
        throw new Error('Empty response from DeepSeek. Check API key or balance.');
      }

      setInterpretation(fullText);
      setIsInterpreting(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Interpretation failed.';
      console.error('[interpret]', err);
      setIsInterpreting(false);
      if (message.includes('DEEPSEEK_API_KEY')) {
        setError('DEEPSEEK_API_KEY 未配置。请在 Vercel 项目环境变量中添加它。');
      } else {
        setError(message);
      }
      setAppState('TOSSING');
    }
  };

  const resetAll = () => {
    setAppState('CONNECTION');
    setConnected(false);
    setWebShakeMode(false);
    setQuestion('');
    setHexagram({ count: 0, results: [] });
    setInterpretation('');
    setIsInterpreting(false);
    setError('');
  };

  const currentTimeStr = useMemo(() => {
    return time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  }, [time]);

  return (
    <div className="min-h-screen bg-[var(--color-brand-bg)] text-slate-100 flex flex-col items-center justify-between p-6 md:p-12 font-mono overflow-hidden relative">
      <ArcHeader />
      
      <div className="z-10 flex flex-col items-center justify-center flex-1 w-full max-w-lg mt-16 md:mt-24">
        <AnimatePresence mode="wait">
          {/* 1. Connection Stage */}
          {appState === 'CONNECTION' && (
            <motion.div 
              key="conn"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center text-center w-full"
            >
              <HexagramLogo />
              
              <div className="mt-16 mb-20 px-4 space-y-6">
                <p className="text-lg md:text-xl font-medium tracking-tight text-white/90">
                  Connect The Dice, Raise A Question, Toss The Dice, Receive Insight.
                </p>
                <p className="text-[11px] font-bold tracking-[0.2em] opacity-40">连接骰子，提出问题，抛掷骰子，获得启示</p>
              </div>

              {!connected ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full max-w-md space-y-4"
                >
                  <AppButton 
                    id="btn-connect" 
                    onClick={() => void handleConnectDice()} 
                    disabled={connecting}
                    variant="outline"
                    className="w-full border-white/20"
                  >
                    {connecting ? <Loader2 className="animate-spin w-5 h-5" /> : "Connect Dice"}
                  </AppButton>
                  <AppButton
                    onClick={proceedToCalm}
                    variant="secondary"
                    className="w-full"
                  >
                    Calm Mode
                  </AppButton>
                  <p className="text-[10px] text-white/30 tracking-widest leading-relaxed px-2">
                    点击 Connect Dice 将弹出系统授权「动作与方向」；允许后，每晃动手机投掷一爻
                  </p>
                </motion.div>
              ) : (
                <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-black">
                    MODULE V.2.04 / FIRMWARE_READY
                  </div>
                  <div className="space-y-4 w-full">
                    <AppButton 
                      variant="ghost"
                      className="w-full pointer-events-none text-sm py-3"
                    >
                      {shakePermission === 'granted'
                        ? '传感器已激活 · 摇动模式就绪'
                        : shakePermission === 'denied'
                          ? '已连接（未授权运动传感器）'
                          : 'Connected Successfully.'}
                    </AppButton>
                    <AppButton 
                      onClick={proceedToGuide}
                      className="w-full"
                    >
                      Input Your Confusion <ChevronRight className="w-5 h-5" />
                    </AppButton>
                    <AppButton
                      onClick={proceedToCalm}
                      variant="secondary"
                      className="w-full"
                    >
                      Calm Mode
                    </AppButton>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {appState === 'CALM' && (
            <motion.div
              key="calm"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="w-full min-h-[72vh] flex flex-col items-center justify-between"
            >
              <div className="w-full flex flex-col items-center pt-6">
                <HexagramLogo size="sm" glow={false} />
                <div className="mt-10 text-center space-y-3 normal-case font-sans">
                  <p className="text-[12px] tracking-[0.32em] uppercase text-white/35">
                    Calm Mode
                  </p>
                  <p className="text-white/55 text-[14px] leading-relaxed max-w-sm">
                    Follow the light. Inhale for 4, hold for 7, exhale for 8.
                  </p>
                </div>
              </div>

              <div className="flex-1 w-full flex items-center justify-center py-12">
                <div className="rounded-[36px] border border-white/10 bg-white/[0.03] px-8 py-10 md:px-12 md:py-12 shadow-[0_0_40px_rgba(255,255,255,0.04)]">
                  <CalmBreathingGrid />
                </div>
              </div>

              <div className="w-full pb-8">
                <AppButton
                  onClick={() => setAppState('CONNECTION')}
                  variant="primary"
                  className="w-full py-4 text-lg font-bold normal-case"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </AppButton>
              </div>
            </motion.div>
          )}

          {/* 2. Question Guide */}
          {appState === 'GUIDE' && (
            <QuestionGuide onContinue={proceedToInput} />
          )}

          {/* 3. Input Stage */}
          {appState === 'INPUT' && (
            <motion.div 
              key="input"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center w-full"
            >
              <HexagramLogo size="sm" glow={false} />
              
              <div className="w-full mt-10">
                <h2 className="text-xl font-black text-white mb-2 tracking-tight normal-case font-sans">
                  What&apos;s On Your Mind Today?
                </h2>
                <p className="text-white/50 text-[14px] mb-6 leading-relaxed normal-case font-sans">
                  Describe your situation or decision in 1–2 sentences. Be specific.
                </p>
                <textarea
                  id="question-input"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Type your question here..."
                  className="w-full h-[260px] bg-white/5 border border-white/10 rounded-[32px] p-8 text-lg focus:outline-none focus:border-white/30 transition-all resize-none placeholder:text-white/15 leading-relaxed normal-case font-sans"
                />
                <div className="mt-6 p-5 rounded-2xl border border-white/10 bg-white/[0.03] text-[13px] text-white/45 leading-relaxed normal-case font-sans">
                  <p className="font-bold text-white/60 mb-2">Example:</p>
                  <p className="italic">
                    &ldquo;Should I take the startup offer or stay for stability?&rdquo;
                  </p>
                </div>
              </div>
              
              <AppButton 
                onClick={startTossing} 
                disabled={!question.trim()}
                variant="outline"
                className="w-full mt-10 border-white/20"
              >
                Send
              </AppButton>
            </motion.div>
          )}

          {/* 3. Tossing Stage */}
          {appState === 'TOSSING' && (
            <motion.div 
              key="toss"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center w-full"
            >
              <HexagramLogo size="sm" glow={false} />

              {webShakeMode && hexagram.count < 6 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full mt-6 mb-2 min-h-[72px] flex items-center justify-center"
                >
                  {shakePermission === 'denied' ? (
                    <AppButton
                      onClick={() => void requestShakePermission()}
                      variant="secondary"
                      className="w-full py-3 text-sm"
                    >
                      <Vibrate className="w-4 h-4" />
                      重新授权「动作与方向」
                    </AppButton>
                  ) : shakeListening ? (
                    <motion.div
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      className="flex flex-col items-center gap-2 text-white/50"
                    >
                      <Smartphone className="w-6 h-6" />
                      <p className="text-[11px] font-bold tracking-[0.25em] uppercase">
                        {isTossing ? '骰子滚动中…' : '摇动手机 · 每晃一次投一爻'}
                      </p>
                    </motion.div>
                  ) : !shakeSupported ? (
                    <p className="text-center text-[11px] text-white/40 tracking-widest">
                      当前浏览器不支持摇动检测，请使用下方按钮
                    </p>
                  ) : null}
                </motion.div>
              )}

              <ResultCard
                question={question}
                results={hexagram.results}
                count={hexagram.count}
                isTossing={isTossing}
              />
              
              <div className="w-full space-y-8">
                {error && (
                  <div className="w-full px-4 py-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 text-amber-200/90 text-[11px] leading-relaxed tracking-wide text-left">
                    {error}
                  </div>
                )}
                <div className="text-center space-y-1 opacity-40">
                   <div className="text-[10px] font-black tracking-widest leading-loose">
                     {webShakeMode ? 'MODE: SHAKE_SIM / STATUS: LISTENING' : 'DEVICE: DICE_1 / STATUS: CONNECTED'}
                   </div>
                </div>

                {hexagram.count < 6 ? (
                  <AppButton 
                    onClick={simulateToss} 
                    disabled={isTossing}
                    variant="outline"
                    className="w-full border-white/20 py-5"
                  >
                    {isTossing
                      ? '投掷中…'
                      : webShakeMode
                        ? '或点击手动投掷'
                        : hexagram.count === 0
                          ? 'Please Roll Your Dice...'
                          : 'Next Roll...'}
                  </AppButton>
                ) : (
                  <AppButton 
                    onClick={() => void interpretHexagram()} 
                    variant="primary"
                    className="w-full py-5 text-xl font-bold"
                  >
                    View Truth
                  </AppButton>
                )}
              </div>
            </motion.div>
          )}

          {/* 4–5. Interpreting / Result */}
          {appState === 'RESULT' && (
            <motion.div
              key="insight"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full flex flex-col items-center"
            >
              <HexagramLogo size="sm" glow={false} />

              <div className="w-full mt-4 overflow-y-auto max-h-[70vh] pb-36 px-1 scrollbar-hide">
                <ResultCard question={question} results={hexagram.results} count={6} />

                <div ref={interpretationAnchorRef} className="mt-8 border-t border-white/10 pt-8 scroll-mt-6">
                  <InterpretationPanel raw={interpretation} thinking={isInterpreting} />
                </div>
              </div>

              <div className="fixed bottom-14 left-0 w-full px-8 max-w-lg mx-auto left-1/2 -translate-x-1/2 z-30">
                <AppButton
                  onClick={resetAll}
                  variant="primary"
                  className="w-full py-4 text-lg font-bold normal-case"
                >
                  Try Again
                </AppButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {appState !== 'CALM' && (
        <footer className="z-20 w-full flex justify-center pb-6">
          <div className="flex items-center gap-3 text-[10px] text-white/20 font-black tracking-[0.2em] bg-black/20 px-4 py-2 rounded-full border border-white/5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            <span>ORE_SYNCED EST_TIME: {currentTimeStr}</span>
          </div>
        </footer>
      )}
    </div>
  );
}
