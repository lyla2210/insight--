import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { parseInterpretation } from '../lib/parseInterpretation';
import { AiThinking } from './AiThinking';

const DISCLAIMER =
  'The yi jing offers perspectives and suggestions, not a predetermined future. Please consider your actual situation and seek professional advice when necessary.';

export function InterpretationPanel({
  raw,
  thinking = false,
}: {
  raw: string;
  thinking?: boolean;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { title, details, timeline, protocols, advice, preview } = parseInterpretation(raw);
  const showStructuredSections = Boolean(timeline || protocols || advice);
  const detailPreview = details || preview;

  return (
    <div className="w-full space-y-4 normal-case font-sans">
      <h3 className="text-xl font-black text-white tracking-tight">Interpretation</h3>

      {showStructuredSections ? (
        <>
          {title && (
            <div className="text-[12px] text-white/45 tracking-[0.14em] uppercase whitespace-pre-wrap leading-relaxed">
              {title}
            </div>
          )}

          {detailPreview && (
            <div className="border-t border-white/10 pt-2">
              <button
                type="button"
                onClick={() => setDetailsOpen((o) => !o)}
                className="w-full flex items-center justify-between py-3 text-left text-white/70 hover:text-white transition-colors"
              >
                <span className="text-[13px] tracking-wide">
                  View Details / 卦相详解
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${detailsOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {!detailsOpen && (
                <div className="relative overflow-hidden rounded-xl border border-white/8 bg-white/[0.05] px-4 py-3">
                  <div className="max-h-[72px] overflow-hidden text-white/78 text-[14px] leading-[1.55] whitespace-pre-wrap">
                    {detailPreview}
                  </div>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[var(--color-brand-bg)] to-transparent" />
                </div>
              )}

              <AnimatePresence>
                {detailsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-xl border border-white/8 bg-white/[0.05] px-4 py-4 text-white/78 text-[14px] leading-[1.7] whitespace-pre-wrap">
                      {detailPreview}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {timeline && (
            <section className="pt-2">
              <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mb-3">
                {timeline.title || 'Timeline Simulation'}
              </p>
              <div className="text-white/85 text-[15px] leading-[1.8] whitespace-pre-wrap">
                {timeline.body}
              </div>
            </section>
          )}

          {protocols && (
            <section className="pt-2">
              <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mb-3">
                {protocols.title || 'Actionable Protocols'}
              </p>
              <div className="text-white/85 text-[15px] leading-[1.8] whitespace-pre-wrap">
                {protocols.body}
              </div>
            </section>
          )}

          {advice && (
            <section className="pt-2">
              <p className="text-[11px] text-white/40 uppercase tracking-[0.2em] mb-3">
                {advice.title || 'Final Recommendation / 最终建议'}
              </p>
              <div className="text-white/85 text-[15px] leading-[1.8] whitespace-pre-wrap">
                {advice.body}
              </div>
            </section>
          )}

          <p className="text-[11px] text-white/30 leading-relaxed pt-6 pb-2">
            {DISCLAIMER}
          </p>
        </>
      ) : (
        <>
          <div className="text-white/85 text-[15px] leading-[1.8] whitespace-pre-wrap">
            {preview || raw}
          </div>
          {thinking ? <AiThinking /> : null}
          {!thinking && (
            <p className="text-[11px] text-white/30 leading-relaxed pt-6 pb-2">
              {DISCLAIMER}
            </p>
          )}
        </>
      )}
    </div>
  );
}

export { DISCLAIMER };
