import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';

const charLabel = (ch) => {
    if (ch == null || ch === -1) return '[ ]';
    if (ch === 32) return 'SPC';
    if (ch === 10) return '\\n';
    if (ch === 9) return '\\t';
    if (ch >= 32 && ch <= 126) return String.fromCharCode(ch);
    return `x${ch.toString(16).toUpperCase().padStart(2, '0')}`;
};

export default function TreeAnimation({ steps }) {
    const [currentStep, setCurrentStep] = useState(0);
    const [playing, setPlaying] = useState(false);
    const intervalRef = useRef(null);
    const nodeRefs = useRef({});

    const totalSteps = steps?.length ?? 0;

    useEffect(() => {
        if (playing) {
            intervalRef.current = setInterval(() => {
                setCurrentStep(prev => {
                    if (prev >= totalSteps - 1) {
                        setPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, 900);
        }
        return () => clearInterval(intervalRef.current);
    }, [playing, totalSteps]);

    // Animate new step node in
    useEffect(() => {
        const el = nodeRefs.current[`merged-${currentStep}`];
        if (el) {
            gsap.fromTo(el, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.4, ease: 'back.out(1.7)' });
        }
    }, [currentStep]);

    if (!steps || steps.length === 0) {
        return <p className="text-gray-500 text-center py-8">Compress a file to see the step-by-step animation.</p>;
    }

    const visibleSteps = steps.slice(0, currentStep + 1);
    const step = steps[currentStep];

    return (
        <div className="space-y-6">
            {/* Controls */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => { setCurrentStep(0); setPlaying(false); }}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white transition-colors"
                >
                    ↩ Reset
                </button>
                <button
                    onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                    disabled={currentStep === 0}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                    ← Prev
                </button>
                <button
                    onClick={() => setPlaying(p => !p)}
                    className={`px-5 py-1.5 rounded-lg text-xs font-bold border transition-all ${playing
                            ? 'bg-red-500/20 border-red-500/40 text-red-400'
                            : 'bg-[#24E0F5]/10 border-[#24E0F5]/30 text-[#24E0F5]'
                        }`}
                >
                    {playing ? '⏸ Pause' : '▶ Play'}
                </button>
                <button
                    onClick={() => setCurrentStep(s => Math.min(totalSteps - 1, s + 1))}
                    disabled={currentStep >= totalSteps - 1}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
                >
                    Next →
                </button>
                <span className="ml-auto text-xs text-gray-500 font-mono">
                    Step {currentStep + 1} / {totalSteps}
                </span>

                {/* Progress bar */}
                <div className="flex-1 max-w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-[#24E0F5] rounded-full transition-all duration-300"
                        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            {/* Current step explanation */}
            {step && (
                <div className="p-4 rounded-xl bg-[#24E0F5]/5 border border-[#24E0F5]/20 text-sm text-gray-300">
                    <span className="text-[#24E0F5] font-bold">Step {currentStep + 1}: </span>
                    Merging{' '}
                    <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">
                        {step.l.ch === -1 ? `[node, freq=${step.l.freq}]` : `'${charLabel(step.l.ch)}' (freq=${step.l.freq})`}
                    </span>
                    {' '}+{' '}
                    <span className="font-mono text-white bg-white/10 px-1.5 py-0.5 rounded">
                        {step.r.ch === -1 ? `[node, freq=${step.r.freq}]` : `'${charLabel(step.r.ch)}' (freq=${step.r.freq})`}
                    </span>
                    {' '}→ combined freq = <span className="text-[#24E0F5] font-bold">{step.combined}</span>.{' '}
                    {step.l.ch !== -1 && step.r.ch !== -1
                        ? `These are the two rarest symbols, so they receive the longest bit-codes.`
                        : `One side is already an internal node — deeper merges produce longer codes.`}
                </div>
            )}

            {/* Step Cards */}
            <div className="flex flex-wrap gap-3">
                {visibleSteps.map((s, i) => {
                    const isLatest = i === currentStep;
                    return (
                        <div
                            key={i}
                            ref={el => nodeRefs.current[`merged-${i}`] = el}
                            onClick={() => setCurrentStep(i)}
                            className={`flex flex-col items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${isLatest
                                    ? 'bg-[#24E0F5]/10 border-[#24E0F5]/50 shadow-[0_0_12px_rgba(36,224,245,0.2)]'
                                    : 'bg-white/5 border-white/10 hover:border-white/20'
                                }`}
                            style={{ minWidth: 120 }}
                        >
                            <div className="flex items-center gap-2 text-xs">
                                <span className={`font-mono px-1.5 py-0.5 rounded text-xs ${s.l.ch === -1 ? 'bg-purple-500/20 text-purple-300' : 'bg-[#24E0F5]/20 text-[#24E0F5]'
                                    }`}>
                                    {s.l.ch === -1 ? `⊕${s.l.freq}` : `${charLabel(s.l.ch)}:${s.l.freq}`}
                                </span>
                                <span className="text-gray-600">+</span>
                                <span className={`font-mono px-1.5 py-0.5 rounded text-xs ${s.r.ch === -1 ? 'bg-purple-500/20 text-purple-300' : 'bg-[#24E0F5]/20 text-[#24E0F5]'
                                    }`}>
                                    {s.r.ch === -1 ? `⊕${s.r.freq}` : `${charLabel(s.r.ch)}:${s.r.freq}`}
                                </span>
                            </div>
                            <div className="text-white font-bold text-sm mt-1.5 font-mono">
                                → {s.combined}
                            </div>
                            <div className="text-gray-600 text-xs mt-0.5">step {i + 1}</div>
                        </div>
                    );
                })}
            </div>

            {currentStep === totalSteps - 1 && (
                <div className="p-4 rounded-xl bg-green-900/20 border border-green-500/30 text-sm text-green-300 text-center">
                    🎉 Tree construction complete! The final node is the root with all frequencies summed.
                </div>
            )}
        </div>
    );
}
