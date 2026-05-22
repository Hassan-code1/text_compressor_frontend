import { useMemo } from 'react';

function calcEntropy(freqs, total) {
    if (!freqs || total === 0) return 0;
    return Object.values(freqs).reduce((h, f) => {
        if (f === 0) return h;
        const p = f / total;
        return h - p * Math.log2(p);
    }, 0);
}

function Gauge({ value, max, label, color = '#24E0F5' }) {
    const pct = Math.min(value / max, 1);
    const r = 52, cx = 64, cy = 64;
    const circumference = Math.PI * r; // half-circle
    const dashOffset = circumference * (1 - pct);
    return (
        <div className="flex flex-col items-center gap-2">
            <svg width="128" height="74" viewBox="0 0 128 74">
                {/* Track */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="12" strokeLinecap="round"
                />
                {/* Fill */}
                <path
                    d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={dashOffset}
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                />
                <text x={cx} y={cy - 4} textAnchor="middle" fontSize="15" fontWeight="bold"
                    fill="white" fontFamily="monospace">
                    {value.toFixed(2)}
                </text>
                <text x={cx} y={cy + 12} textAnchor="middle" fontSize="9" fill="rgba(255,255,255,0.4)">
                    {label}
                </text>
            </svg>
        </div>
    );
}

export default function EntropyDashboard({ stats }) {
    const { originalSize, compressedSize, freqs, codes } = stats || {};

    const total = originalSize || 0;

    const entropy = useMemo(() => calcEntropy(freqs, total), [freqs, total]);

    // Huffman average bits per symbol = compressedBits / totalChars
    // compressedSize is in bytes; subtract 4 bytes header + tree overhead (approx)
    const huffBitsPerSymbol = total > 0 && codes
        ? Object.entries(freqs || {}).reduce((acc, [ch, freq]) => {
            const code = codes[ch];
            return acc + (code ? code.length * freq : 0);
        }, 0) / total
        : 0;

    const originalBitsTotal = total * 8;
    const theoreticalBitsTotal = total * entropy;
    const huffBitsTotal = total * huffBitsPerSymbol;

    const efficiency = entropy > 0 ? (entropy / huffBitsPerSymbol) * 100 : 0;

    const rows = [
        { label: 'Original', bits: originalBitsTotal, color: 'bg-gray-500', pct: 100 },
        { label: 'Huffman', bits: huffBitsTotal, color: 'bg-[#24E0F5]', pct: (huffBitsTotal / originalBitsTotal) * 100 },
        { label: 'Theory Limit', bits: theoreticalBitsTotal, color: 'bg-purple-400', pct: (theoreticalBitsTotal / originalBitsTotal) * 100 },
    ];

    if (!stats) return <p className="text-gray-500 text-center py-8">Compress a file to see entropy data.</p>;

    return (
        <div className="space-y-8">
            {/* Gauges row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-white font-mono">{entropy.toFixed(4)}</div>
                    <div className="text-xs text-gray-400 mt-1">Shannon Entropy (H)</div>
                    <div className="text-xs text-gray-600 mt-1">bits / symbol</div>
                </div>
                <div className="p-4 rounded-2xl bg-[#24E0F5]/10 border border-[#24E0F5]/30">
                    <div className="text-2xl font-bold text-[#24E0F5] font-mono">{huffBitsPerSymbol.toFixed(4)}</div>
                    <div className="text-xs text-gray-400 mt-1">Huffman Avg</div>
                    <div className="text-xs text-gray-600 mt-1">bits / symbol</div>
                </div>
                <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30">
                    <div className="text-2xl font-bold text-purple-400 font-mono">{efficiency.toFixed(1)}%</div>
                    <div className="text-xs text-gray-400 mt-1">Coding Efficiency</div>
                    <div className="text-xs text-gray-600 mt-1">vs. Shannon limit</div>
                </div>
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-white font-mono">{Object.keys(freqs || {}).length}</div>
                    <div className="text-xs text-gray-400 mt-1">Unique Symbols</div>
                    <div className="text-xs text-gray-600 mt-1">alphabet size</div>
                </div>
            </div>

            {/* Bit comparison bars */}
            <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Total Bits Required</h3>
                {rows.map(({ label, bits, color, pct }) => (
                    <div key={label} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-300">{label}</span>
                            <span className="font-mono text-gray-400">{Math.round(bits).toLocaleString()} bits</span>
                        </div>
                        <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className={`h-full rounded-full ${color} transition-all duration-700`}
                                style={{ width: `${pct}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Explanation */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 leading-relaxed space-y-2">
                <p>
                    <span className="text-white font-semibold">Shannon Entropy H(X)</span> is the theoretical lower bound — the minimum average bits needed to encode each symbol. Huffman coding uses <span className="text-[#24E0F5]">integer</span> bit-lengths, so it cannot reach the entropy limit exactly. The gap between the purple and cyan bars shows this overhead.
                </p>
                <p className="font-mono text-gray-500">
                    H(X) = −∑ P(xᵢ) · log₂ P(xᵢ)
                </p>
            </div>
        </div>
    );
}
