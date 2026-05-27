import { motion } from 'motion/react';

export function HexagramLogo({
  size = 'lg',
  glow = true,
}: {
  size?: 'sm' | 'lg';
  glow?: boolean;
}) {
  const lines = [1, 0, 1, 1, 1, 1];
  const scale = size === 'lg' ? 1 : 0.25;

  return (
    <motion.div
      className={`flex flex-col items-center select-none ${size === 'lg' ? 'gap-4' : 'gap-0 transform scale-75'}`}
    >
      <div
        className={`flex flex-col gap-2 p-4 transition-all duration-1000 ${glow ? 'opacity-100' : 'opacity-40'}`}
        style={{ transform: `scale(${scale})` }}
      >
        {[...lines].reverse().map((type, i) => (
          <motion.div key={i} className="flex gap-2">
            {type === 1 ? (
              <motion.div
                className={`h-2.5 w-32 bg-white rounded-full ${glow ? 'shadow-[0_0_15px_rgba(255,255,255,0.9)]' : ''}`}
              />
            ) : (
              <div className="flex gap-4">
                <div
                  className={`h-2.5 w-14 bg-white rounded-full ${glow ? 'shadow-[0_0_15px_rgba(255,255,255,0.9)]' : ''}`}
                />
                <div
                  className={`h-2.5 w-14 bg-white rounded-full ${glow ? 'shadow-[0_0_15px_rgba(255,255,255,0.9)]' : ''}`}
                />
              </div>
            )}
          </motion.div>
        ))}
      </div>
      <div className="flex flex-col items-center">
        <div
          className={`${size === 'lg' ? 'text-2xl' : 'text-[10px]'} font-bold tracking-[0.3em] text-white opacity-90`}
        >
          Insight
        </div>
        <div className={`${size === 'lg' ? 'text-3xl' : 'text-xs'} font-black text-white`}>
          六爻
        </div>
      </div>
    </motion.div>
  );
}
