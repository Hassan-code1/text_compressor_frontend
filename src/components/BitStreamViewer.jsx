import { useState } from 'react';

const charLabel = (ch) => {
    if (ch == null) return '?';
    if (ch === 32) return '·';   // visible space
    if (ch === 10) return '↵';
    if (ch === 9) return '→';
    if (ch >= 32 && ch <= 126) return String.fromCharCode(ch);
    return `·`;
};

export default function BitStreamViewer({ bitPreview }) {
    const [hoveredIdx, setHoveredIdx] = useState(null);

    if (!bitPreview || bitPreview.length === 0) {
        return <p className="text-gray-500 text-center py-8">Compress a file to see the bit-stream preview.</p>;
    }

    // Flatten into an array of {bitChar, charIdx, ch, bits}
    const flatBits = [];
    bitPreview.forEach(({ ch, bits }, charIdx) => {
        for (const b of bits) {
            flatBits.push({ bitChar: b, charIdx, ch, bits });
        }
    });

    const hovered = hoveredIdx !== null ? flatBits[hoveredIdx] : null;

    return (
        <div className="space-y-6">
            {/* Info box */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 leading-relaxed">
                This shows the actual binary output for the first <span className="text-white">{bitPreview.length}</span> characters.
                Hover over any bit to see which character it belongs to.
            </div>

            {/* Hovered character info */}
            <div className={`p-3 rounded-xl border text-sm transition-all duration-200 min-h-[56px] flex items-center gap-4 ${hovered
                    ? 'bg-[#24E0F5]/10 border-[#24E0F5]/30'
                    : 'bg-white/5 border-white/5 text-gray-600'
                }`}>
                {hovered ? (
                    <>
                        <span className="text-2xl font-mono font-bold text-[#24E0F5] w-10 text-center">
                            {charLabel(hovered.ch)}
                        </span>
                        <div className="space-y-0.5">
                            <div className="text-white text-xs">
                                char code <span className="font-mono">{hovered.ch}</span> → Huffman code:{' '}
                                <span className="font-mono text-[#24E0F5] tracking-widest">{hovered.bits}</span>
                                <span className="text-gray-500"> ({hovered.bits.length} bits)</span>
                            </div>
                            <div className="text-gray-500 text-xs font-mono">
                                char #{hovered.charIdx + 1} in the preview
                            </div>
                        </div>
                    </>
                ) : (
                    <span className="text-gray-600 text-xs">Hover over a bit below ↓</span>
                )}
            </div>

            {/* Bit stream ribbon */}
            <div className="rounded-xl bg-black/40 border border-white/10 p-4 overflow-x-auto">
                <div className="flex flex-wrap gap-px" style={{ fontFamily: 'monospace' }}>
                    {flatBits.map(({ bitChar, charIdx, ch }, i) => {
                        const isHovered = hoveredIdx === i;
                        const isSameChar = hovered && hovered.charIdx === charIdx;
                        return (
                            <span
                                key={i}
                                onMouseEnter={() => setHoveredIdx(i)}
                                onMouseLeave={() => setHoveredIdx(null)}
                                className={`
                  inline-flex items-center justify-center w-5 h-6 text-xs rounded cursor-default
                  transition-all duration-100 select-none
                  ${isHovered
                                        ? 'bg-[#24E0F5] text-black font-bold scale-125 z-10 relative'
                                        : isSameChar
                                            ? 'bg-[#24E0F5]/20 text-[#24E0F5]'
                                            : bitChar === '1'
                                                ? 'text-white/70'
                                                : 'text-white/25'
                                    }
                `}
                            >
                                {bitChar}
                            </span>
                        );
                    })}
                </div>
            </div>

            {/* Character legend */}
            <div className="space-y-2">
                <h3 className="text-xs text-gray-500 uppercase tracking-wider">Character breakdown</h3>
                <div className="flex flex-wrap gap-2">
                    {bitPreview.map(({ ch, bits }, i) => (
                        <div
                            key={i}
                            onMouseEnter={() => {
                                // highlight first bit of this char
                                const startIdx = bitPreview.slice(0, i).reduce((acc, b) => acc + b.bits.length, 0);
                                setHoveredIdx(startIdx);
                            }}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className="flex items-center gap-1.5 px-2 py-1 bg-white/5 border border-white/10 rounded-lg hover:border-[#24E0F5]/30 cursor-default transition-colors"
                        >
                            <span className="text-[#24E0F5] font-mono font-bold text-xs w-6 text-center">
                                {charLabel(ch)}
                            </span>
                            <span className="text-gray-600 text-xs">→</span>
                            <span className="text-gray-300 font-mono text-xs tracking-widest">{bits}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
