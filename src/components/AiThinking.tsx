import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const THOUGHTS = [
  'Mapping hexagram topology…',
  'Translating symbol into psychological state…',
  'Tracing line-by-line narrative arc…',
  'Compressing insight into actionable advice…',
];

export function AiThinking() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % THOUGHTS.length), 2400);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="w-full py-8 flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-white/70"
            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={index}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          className="text-[11px] text-white/45 uppercase tracking-[0.28em] text-center min-h-[1.25rem]"
        >
          {THOUGHTS[index]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
