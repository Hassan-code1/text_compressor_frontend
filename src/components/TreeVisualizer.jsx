import { useMemo, useState } from 'react';

const charLabel = (ch) => {
    if (ch == null || ch === -1) return '?';
    if (ch === 32) return 'SPC';
    if (ch === 10) return '\\n';
    if (ch === 9) return '\\t';
    if (ch === 13) return '\\r';
    if (ch >= 32 && ch <= 126) return String.fromCharCode(ch);
    return `x${ch.toString(16).toUpperCase().padStart(2, '0')}`;
};

// Assign x/y layout positions to every node recursively
function computeLayout(node, depth = 0, counter = { val: 0 }) {
    if (!node) return null;
    const n = { ...node };
    if (n.isLeaf) {
        n._x = counter.val++;
        n._y = depth;
        n._left = null;
        n._right = null;
    } else {
        n._left = n.left ? computeLayout(n.left, depth + 1, counter) : null;
        n._right = n.right ? computeLayout(n.right, depth + 1, counter) : null;
        const lx = n._left?._x ?? 0;
        const rx = n._right?._x ?? lx;
        n._x = (lx + rx) / 2;
        n._y = depth;
    }
    return n;
}

function collectNodesLinks(node, nodes = [], links = []) {
    if (!node) return;
    nodes.push(node);
    if (node._left) {
        links.push({ source: node, target: node._left, bit: '0' });
        collectNodesLinks(node._left, nodes, links);
    }
    if (node._right) {
        links.push({ source: node, target: node._right, bit: '1' });
        collectNodesLinks(node._right, nodes, links);
    }
}

function getHighlightPath(root, code) {
    const nodeKeys = new Set();
    const linkKeys = new Set();
    if (!root || !code) return { nodeKeys, linkKeys };
    let curr = root;
    nodeKeys.add(`${curr._x}-${curr._y}`);
    for (const bit of code) {
        const next = bit === '0' ? curr._left : curr._right;
        if (!next) break;
        linkKeys.add(`${curr._x}-${curr._y}|${next._x}-${next._y}`);
        curr = next;
        nodeKeys.add(`${curr._x}-${curr._y}`);
    }
    return { nodeKeys, linkKeys };
}

export default function TreeVisualizer({ treeData, codes }) {
    const [hoveredChar, setHoveredChar] = useState(null);

    const { layoutRoot, nodes, links, maxX, maxY } = useMemo(() => {
        if (!treeData) return { layoutRoot: null, nodes: [], links: [], maxX: 1, maxY: 1 };
        const layoutRoot = computeLayout(treeData);
        const nodes = [], links = [];
        collectNodesLinks(layoutRoot, nodes, links);
        const maxX = Math.max(...nodes.map(n => n._x), 1);
        const maxY = Math.max(...nodes.map(n => n._y), 1);
        return { layoutRoot, nodes, links, maxX, maxY };
    }, [treeData]);

    const { nodeKeys, linkKeys } = useMemo(() => {
        if (!hoveredChar || !layoutRoot) return { nodeKeys: new Set(), linkKeys: new Set() };
        const code = codes?.[hoveredChar];
        return getHighlightPath(layoutRoot, code);
    }, [hoveredChar, layoutRoot, codes]);

    const PAD = 50;
    const W = Math.max((maxX + 1) * 50, 700);
    const H = Math.max((maxY + 1) * 70, 300);

    const sx = (x) => PAD + (x / Math.max(maxX, 1)) * (W - PAD * 2);
    const sy = (y) => PAD + (y / Math.max(maxY, 1)) * (H - PAD * 2);

    const nk = (n) => `${n._x}-${n._y}`;
    const lk = (s, t) => `${s._x}-${s._y}|${t._x}-${t._y}`;

    if (!treeData) {
        return <p className="text-gray-500 text-center py-8">Compress a file to see the Huffman tree.</p>;
    }

    return (
        <div className="w-full space-y-4">
            {/* Hover selectors */}
            <div>
                <p className="text-xs text-gray-500 mb-2">Hover a character to highlight its path in the tree:</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-1">
                    {codes && Object.entries(codes).map(([key]) => (
                        <button
                            key={key}
                            onMouseEnter={() => setHoveredChar(key)}
                            onMouseLeave={() => setHoveredChar(null)}
                            className={`px-2 py-0.5 rounded text-xs font-mono border transition-all duration-150 ${hoveredChar === key
                                    ? 'bg-[#24E0F5]/20 border-[#24E0F5] text-[#24E0F5]'
                                    : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/30'
                                }`}
                        >
                            {charLabel(parseInt(key))}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tree SVG */}
            <div className="w-full overflow-auto rounded-xl bg-black/30 border border-white/10 p-2">
                <svg width={W} height={H} style={{ minWidth: '100%' }}>
                    {/* Links */}
                    {links.map((link) => {
                        const key = lk(link.source, link.target);
                        const isHi = linkKeys.has(key);
                        const x1 = sx(link.source._x), y1 = sy(link.source._y);
                        const x2 = sx(link.target._x), y2 = sy(link.target._y);
                        const my = (y1 + y2) / 2;
                        return (
                            <g key={key}>
                                <path
                                    d={`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`}
                                    fill="none"
                                    stroke={isHi ? '#24E0F5' : 'rgba(255,255,255,0.12)'}
                                    strokeWidth={isHi ? 2.5 : 1}
                                    style={{ transition: 'stroke 0.2s' }}
                                />
                                <text
                                    x={(x1 + x2) / 2 + (link.bit === '0' ? -8 : 8)}
                                    y={(y1 + y2) / 2}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill={isHi ? '#24E0F5' : 'rgba(255,255,255,0.25)'}
                                    fontFamily="monospace"
                                >
                                    {link.bit}
                                </text>
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const key = nk(node);
                        const isHi = nodeKeys.has(key);
                        const cx = sx(node._x), cy = sy(node._y);
                        const r = node.isLeaf ? 20 : 14;
                        return (
                            <g
                                key={key}
                                transform={`translate(${cx},${cy})`}
                                onMouseEnter={() => node.isLeaf && setHoveredChar(String(node.ch))}
                                onMouseLeave={() => setHoveredChar(null)}
                                style={{ cursor: node.isLeaf ? 'pointer' : 'default' }}
                            >
                                <circle
                                    r={r}
                                    fill={node.isLeaf
                                        ? (isHi ? '#24E0F5' : 'rgba(36,224,245,0.12)')
                                        : (isHi ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)')}
                                    stroke={isHi ? '#24E0F5' : node.isLeaf ? 'rgba(36,224,245,0.4)' : 'rgba(255,255,255,0.18)'}
                                    strokeWidth={isHi ? 2 : 1}
                                    style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                                />
                                {node.isLeaf ? (
                                    <>
                                        <text textAnchor="middle" dy="-4" fontSize="9" fontWeight="bold"
                                            fill={isHi ? '#000' : '#24E0F5'} fontFamily="monospace">
                                            {charLabel(node.ch)}
                                        </text>
                                        <text textAnchor="middle" dy="8" fontSize="8"
                                            fill={isHi ? '#000' : 'rgba(255,255,255,0.5)'}>
                                            {node.freq}
                                        </text>
                                    </>
                                ) : (
                                    <text textAnchor="middle" dy="4" fontSize="9"
                                        fill="rgba(255,255,255,0.5)">
                                        {node.freq}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border border-[#24E0F5]/60 bg-[#24E0F5]/12" />
                    <span>Leaf (character)</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full border border-white/20 bg-white/6" />
                    <span>Internal node</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-5 h-0.5 bg-[#24E0F5]" />
                    <span>Highlighted path</span>
                </div>
                <span className="ml-auto font-mono">0 = left branch · 1 = right branch</span>
            </div>
        </div>
    );
}
