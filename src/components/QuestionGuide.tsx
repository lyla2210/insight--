import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import { HexagramLogo } from './HexagramLogo';
import { AppButton } from './AppButton';

export function QuestionGuide({ onContinue }: { onContinue: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center w-full max-w-md"
    >
      <HexagramLogo size="sm" glow={false} />

      <div className="w-full mt-10 text-left space-y-6 px-1">
        <h2 className="text-2xl font-black text-white tracking-tight normal-case">
          Before You Start...
        </h2>

        <div className="space-y-3 text-white/85 text-[15px] leading-relaxed normal-case font-sans">
          <p className="font-bold text-white">
            Focus On Specific Contexts, Reject Vagueness.
          </p>
          <p className="font-bold text-white">
            Seek Actionable Insights, Not Fate Prophecies.
          </p>
          <p>Formulate Your Question As A Yes/No Or Choice-Based Query.</p>
        </div>

        <div className="space-y-2 text-[14px] text-white/70 normal-case font-sans leading-relaxed">
          <p className="font-bold text-white/90">Guidelines:</p>
          <ul className="space-y-1 list-none pl-0">
            <li>— Be Specific About The Decision You&apos;re Facing</li>
            <li>— Include The Options If It&apos;s A Choice</li>
            <li>— Focus On What YOU Can Do, Not What Others Will Do</li>
          </ul>
        </div>

        <div className="space-y-2 text-[14px] normal-case font-sans leading-relaxed">
          <p className="font-bold text-white/90">Examples:</p>
          <p className="text-white/75">✓ Should I Invest In This Startup?</p>
          <p className="text-white/75">
            ✓ Which Apartment Should I Choose: The Downtown One Or The Suburban One?
          </p>
          <p className="text-white/75">✓ Is Now The Right Time To Ask For A Promotion?</p>
          <p className="text-white/40">✗ Will I Be Rich? (Too Vague)</p>
        </div>
      </div>

      <AppButton onClick={onContinue} className="w-full mt-12 py-4 text-base font-bold normal-case">
        I See, I&apos;m Ready To Ask Questions
        <ChevronRight className="w-5 h-5" />
      </AppButton>
    </motion.div>
  );
}
