import { HexagramGrid } from './HexagramGrid';

export function ResultCard({
  question,
  results,
  count,
  isTossing,
}: {
  question: string;
  results: number[];
  count: number;
  isTossing?: boolean;
}) {
  return (
  <>
      <div className="w-full px-6 py-4 border border-white/10 rounded-2xl mb-6 bg-white/5 text-sm text-center italic text-white/50 font-medium normal-case">
        &ldquo;{question}&rdquo;
      </div>

      <div className="w-full bg-white/5 border border-white/10 rounded-[40px] p-10 mb-6 flex flex-col items-center relative min-h-[320px]">
        <div className="mb-8 font-black tracking-[0.4em] text-white/30 text-xs uppercase">
          Result
        </div>
        <HexagramGrid results={results} />
        <div className="mt-auto w-full flex justify-between items-end border-t border-white/5 pt-6">
          <div className="space-y-1">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
              Progress
            </div>
            <div className="text-3xl font-black text-white/90 leading-none">{count}/6</div>
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-black">
              State
            </div>
            <div className="text-xl font-black text-white/90 leading-none">
              {isTossing ? 'Rolling...' : count === 6 ? 'Done' : 'Waiting'}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
