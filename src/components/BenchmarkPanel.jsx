export default function BenchmarkPanel({ stats }) {
    const { originalSize, compressedSize, gzipSize, rle } = stats || {};

    if (!stats) return <p className="text-gray-500 text-center py-8">Compress a file to see the benchmark.</p>;

    const entries = [
        { label: 'Raw (uncompressed)', size: originalSize, color: 'bg-gray-500', pct: 100 },
        { label: rle ? 'Huffman + RLE' : 'Huffman (Canonical)', size: compressedSize, color: 'bg-[#24E0F5]', pct: (compressedSize / originalSize) * 100 },
        ...(gzipSize != null ? [{ label: 'Gzip (Node built-in)', size: gzipSize, color: 'bg-purple-400', pct: (gzipSize / originalSize) * 100 }] : []),
    ];

    const best = entries.reduce((a, b) => a.size < b.size ? a : b);

    return (
        <div className="space-y-8">
            {/* Bar chart */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Output Size Comparison</h3>
                {entries.map(({ label, size, color, pct }) => {
                    const isBest = label === best.label;
                    return (
                        <div key={label} className="space-y-1.5">
                            <div className="flex justify-between items-center text-xs">
                                <span className={`font-medium ${isBest ? 'text-white' : 'text-gray-400'}`}>
                                    {label} {isBest && <span className="text-green-400 ml-1">✓ smallest</span>}
                                </span>
                                <span className="font-mono text-gray-400">
                                    {size.toLocaleString()} B ({pct.toFixed(1)}% of original)
                                </span>
                            </div>
                            <div className="h-4 bg-white/5 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${color} transition-all duration-700 flex items-center justify-end pr-2`}
                                    style={{ width: `${pct}%` }}
                                >
                                    {pct > 15 && (
                                        <span className="text-black text-xs font-bold">{pct.toFixed(0)}%</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Savings table */}
            <div className="rounded-xl overflow-hidden border border-white/10">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                            <th className="text-left p-3">Method</th>
                            <th className="text-right p-3">Size (bytes)</th>
                            <th className="text-right p-3">Savings</th>
                            <th className="text-right p-3">Ratio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {entries.map(({ label, size }) => {
                            const saved = originalSize - size;
                            const ratio = (originalSize / size).toFixed(2);
                            return (
                                <tr key={label} className="border-t border-white/5 hover:bg-white/5 transition-colors">
                                    <td className="p-3 text-gray-300 font-medium">{label}</td>
                                    <td className="p-3 text-right font-mono text-gray-400">{size.toLocaleString()}</td>
                                    <td className={`p-3 text-right font-mono ${saved > 0 ? 'text-green-400' : saved < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                                        {saved > 0 ? '-' : saved < 0 ? '+' : ''}{Math.abs(saved).toLocaleString()} B
                                    </td>
                                    <td className="p-3 text-right font-mono text-gray-400">{ratio}x</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Context note */}
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 leading-relaxed">
                <span className="text-white font-semibold">Note: </span>
                Gzip uses DEFLATE (LZ77 + Huffman). It achieves better ratios on most text because it eliminates repeated <em>sequences</em> (phrases), while this Huffman implementation only eliminates repeated <em>bytes</em>
                {rle ? ', with RLE additionally eliminating byte runs before Huffman encoding' : ''}.
                For highly-repetitive data (BMP, log files), enable the <span className="text-[#24E0F5]">RLE toggle</span> to see Huffman close the gap.
            </div>
        </div>
    );
}
