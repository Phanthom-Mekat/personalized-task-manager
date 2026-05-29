import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Network, Loader2, ZoomIn, ZoomOut, Maximize2, Info, X, Plus, Trash2, Link2, Check
} from 'lucide-react';

const GROUP_COLORS = {
    user:      '#8b5cf6',
    family:    '#f59e0b',
    friend:    '#3b82f6',
    work:      '#10b981',
    education: '#ec4899',
    hobby:     '#06b6d4',
    place:     '#f97316',
};

function SecondBrainGraph({ apiCall }) {
    const [graph, setGraph] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    // Mutation states
    const [showAddNodeModal, setShowAddNodeModal] = useState(false);
    const [nodeLabel, setNodeLabel] = useState('');
    const [nodeGroup, setNodeGroup] = useState('friend');
    const [nodeDetails, setNodeDetails] = useState('');
    
    const [edgeToNode, setEdgeToNode] = useState('');
    const [edgeRelation, setEdgeRelation] = useState('');
    const [edgeSentiment, setEdgeSentiment] = useState('Neutral');
    const [submittingEdge, setSubmittingEdge] = useState(false);

    const fetchGraph = async () => {
        try {
            const data = await apiCall('GET', '/graph');
            setGraph(data);
        } catch (err) {
            console.error('Graph fetch failed:', err);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchGraph().finally(() => setLoading(false));
    }, [apiCall]);

    const handleMouseDown = (e) => {
        if (e.target.closest('.graph-node')) return;
        setDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e) => {
        if (!dragging) return;
        setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };

    const handleMouseUp = () => setDragging(false);

    // Node & Edge mutations
    const handleAddNodeSubmit = async (e) => {
        e.preventDefault();
        const label = nodeLabel.trim();
        if (!label) return;
        
        const id = 'custom_' + label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
        const newNode = { id, label, group: nodeGroup, details: nodeDetails.trim() };

        try {
            const updated = await apiCall('POST', '/graph/node', newNode);
            setGraph(updated);
            setShowAddNodeModal(false);
            setNodeLabel('');
            setNodeDetails('');
        } catch (err) {
            console.error('Failed to add graph node:', err);
        }
    };

    const handleDeleteNode = async (nodeId) => {
        if (nodeId === 'me') return;
        if (!confirm('Are you sure you want to delete this entity? All relationships connected to it will also be pruned.')) return;
        try {
            const updated = await apiCall('DELETE', `/graph/node/${nodeId}`);
            setGraph(updated);
            if (selected?.id === nodeId) setSelected(null);
        } catch (err) {
            console.error('Failed to delete graph node:', err);
        }
    };

    const handleAddEdgeSubmit = async (e) => {
        e.preventDefault();
        if (!edgeToNode || !edgeRelation.trim() || !selected) return;
        
        setSubmittingEdge(true);
        const newEdge = {
            from: selected.id,
            to: edgeToNode,
            relation: edgeRelation.trim(),
            sentiment: edgeSentiment
        };

        try {
            const updated = await apiCall('POST', '/graph/edge', newEdge);
            setGraph(updated);
            setEdgeRelation('');
            setEdgeToNode('');
        } catch (err) {
            console.error('Failed to add graph edge:', err);
        } finally {
            setSubmittingEdge(false);
        }
    };

    const handleDeleteEdge = async (from, to, relation) => {
        if (!confirm('Prune this relationship link?')) return;
        try {
            const updated = await apiCall('DELETE', `/graph/edge?from=${from}&to=${to}&relation=${encodeURIComponent(relation)}`);
            setGraph(updated);
        } catch (err) {
            console.error('Failed to delete graph edge:', err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
        );
    }

    // Safety arrays fallback bindings
    const nodes = graph?.nodes || [];
    const edges = graph?.edges || [];

    if (!graph || nodes.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center border border-violet-500/10">
                    <Network className="w-6 h-6 text-violet-400" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs">
                    Your relationship graph is empty. Click "Add Entity" below to map your digital twin's universe.
                </p>
            </div>
        );
    }

    // ── Concentric Shell Layout Math (Collision Avoidance) ────────────
    const centerX = 300;
    const centerY = 250;
    const positions = { me: { x: centerX, y: centerY } };

    const nonUserNodes = nodes.filter(n => n.id !== 'me');
    const shells = { core: [], intermediate: [], outer: [] };

    nonUserNodes.forEach(node => {
        const connections = edges.filter(e => e.from === node.id || e.to === node.id).length;
        if (['family', 'friend'].includes(node.group) && connections >= 3) {
            shells.core.push(node);
        } else if (['work', 'education', 'place'].includes(node.group)) {
            shells.intermediate.push(node);
        } else {
            shells.outer.push(node);
        }
    });

    const arrangeShell = (nodesInShell, radius) => {
        nodesInShell.forEach((node, i) => {
            const angle = (2 * Math.PI * i) / nodesInShell.length - Math.PI / 2;
            positions[node.id] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle),
            };
        });
    };

    arrangeShell(shells.core, 110);
    arrangeShell(shells.intermediate, 200);
    arrangeShell(shells.outer, 290);

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold">Second Brain Graph</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {nodes.length} entities • {edges.length} connections
                    </p>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setShowAddNodeModal(true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Entity</span>
                    </button>
                    <button onClick={() => setZoom(z => Math.min(z + 0.2, 2))} className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground"><ZoomIn className="w-4 h-4" /></button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground"><ZoomOut className="w-4 h-4" /></button>
                    <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="p-1.5 rounded-md hover:bg-secondary/60 text-muted-foreground"><Maximize2 className="w-4 h-4" /></button>
                </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-3 px-1">
                {Object.entries(GROUP_COLORS).map(([group, color]) => (
                    <div key={group} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground capitalize">{group}</span>
                    </div>
                ))}
            </div>

            {/* Canvas */}
            <div
                ref={containerRef}
                className="relative bg-secondary/20 border border-border/40 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing select-none"
                style={{ height: '500px' }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 600 500"
                    style={{ transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)` }}
                >
                    {/* Edges */}
                    {edges.map((edge, i) => {
                        const from = positions[edge.from];
                        const to = positions[edge.to];
                        if (!from || !to) return null;
                        return (
                            <g key={`edge-${i}`}>
                                <line
                                    x1={from.x} y1={from.y}
                                    x2={to.x} y2={to.y}
                                    stroke="currentColor"
                                    className="text-border"
                                    strokeWidth="1.5"
                                    strokeOpacity="0.4"
                                />
                                <text
                                    x={(from.x + to.x) / 2}
                                    y={(from.y + to.y) / 2 - 6}
                                    textAnchor="middle"
                                    className="fill-muted-foreground text-[8px] font-medium select-none"
                                >
                                    {edge.relation}
                                </text>
                            </g>
                        );
                    })}

                    {/* Nodes */}
                    {nodes.map((node) => {
                        const pos = positions[node.id];
                        if (!pos) return null;
                        const color = GROUP_COLORS[node.group] || '#8b5cf6';
                        const isCenter = node.id === 'me';

                        return (
                            <g
                                key={node.id}
                                className="graph-node cursor-pointer"
                                onClick={() => setSelected(node)}
                            >
                                <circle
                                    cx={pos.x} cy={pos.y}
                                    r={isCenter ? 24 : 18}
                                    fill={color}
                                    fillOpacity={0.15}
                                    stroke={color}
                                    strokeWidth={isCenter ? 2.5 : 1.5}
                                />
                                <circle
                                    cx={pos.x} cy={pos.y}
                                    r={isCenter ? 10 : 7}
                                    fill={color}
                                />
                                <text
                                    x={pos.x}
                                    y={pos.y + (isCenter ? 36 : 30)}
                                    textAnchor="middle"
                                    className="fill-foreground text-[10px] font-bold select-none"
                                >
                                    {node.label}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Selected Node Details & Mutation Panel */}
            {selected && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-card border border-border/50 rounded-2xl p-5"
                >
                    {/* Basic Info & Relations */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: GROUP_COLORS[selected.group] || '#8b5cf6' }} />
                                <span className="text-sm font-black text-foreground">{selected.label}</span>
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-secondary/55 px-2 py-0.5 rounded">
                                    {selected.group}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                {selected.id !== 'me' && (
                                    <button
                                        onClick={() => handleDeleteNode(selected.id)}
                                        className="p-1 rounded hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-colors"
                                        title="Delete Entity"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                                <button onClick={() => setSelected(null)} className="p-1 rounded hover:bg-secondary/60 text-muted-foreground">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        {selected.details && (
                            <p className="text-xs text-muted-foreground border-l-2 border-border/50 pl-2 leading-relaxed">{selected.details}</p>
                        )}

                        <div className="pt-2 space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Active Relations:</span>
                            <div className="space-y-1.5 overflow-y-auto max-h-[140px] pr-1">
                                {edges.filter(e => e.from === selected.id || e.to === selected.id).length === 0 ? (
                                    <p className="text-[11px] text-muted-foreground italic">No connections established for this entity.</p>
                                ) : (
                                    edges
                                        .filter(e => e.from === selected.id || e.to === selected.id)
                                        .map((e, i) => {
                                            const otherId = e.from === selected.id ? e.to : e.from;
                                            const other = nodes.find(n => n.id === otherId);
                                            return (
                                                <div key={i} className="flex items-center justify-between text-xs text-muted-foreground bg-secondary/25 px-2 py-1.5 rounded-lg border border-border/30">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-foreground">{other?.label || otherId}</span>
                                                        <span className="text-[10px] opacity-60">({e.relation})</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteEdge(e.from, e.to, e.relation)}
                                                        className="hover:text-destructive p-0.5 rounded transition-colors"
                                                        title="Delete Connection"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            );
                                        })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Edge creation form (to establish relationships) */}
                    <div className="bg-secondary/15 p-4 rounded-xl border border-border/30 space-y-3">
                        <div className="flex items-center gap-1.5">
                            <Link2 className="w-3.5 h-3.5 text-violet-400" />
                            <span className="text-xs font-bold uppercase tracking-wider">Connect {selected.label} to...</span>
                        </div>
                        <form onSubmit={handleAddEdgeSubmit} className="space-y-2">
                            <div>
                                <select
                                    value={edgeToNode}
                                    onChange={(e) => setEdgeToNode(e.target.value)}
                                    className="w-full bg-background border border-border/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                                >
                                    <option value="">Select target entity...</option>
                                    {nodes
                                        .filter(n => n.id !== selected.id)
                                        .map(n => (
                                            <option key={n.id} value={n.id}>{n.label}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <input
                                    type="text"
                                    placeholder="Relation label (e.g. Sister, Advisor)"
                                    value={edgeRelation}
                                    onChange={(e) => setEdgeRelation(e.target.value)}
                                    className="w-full bg-background border border-border/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <select
                                    value={edgeSentiment}
                                    onChange={(e) => setEdgeSentiment(e.target.value)}
                                    className="flex-1 bg-background border border-border/50 rounded-lg p-2 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                                >
                                    <option value="Positive">Positive Sentiment</option>
                                    <option value="Neutral">Neutral Sentiment</option>
                                    <option value="Negative">Negative Sentiment</option>
                                </select>
                                <button
                                    type="submit"
                                    disabled={submittingEdge || !edgeToNode || !edgeRelation.trim()}
                                    className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:shadow-md disabled:opacity-40 hover:scale-[1.02] transition-all flex items-center gap-1"
                                >
                                    {submittingEdge ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                    Link
                                </button>
                            </div>
                        </form>
                    </div>
                </motion.div>
            )}

            {/* Floating FAB modal for Add Entity */}
            <AnimatePresence>
                {showAddNodeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-card border border-border/70 w-full max-w-md rounded-2xl overflow-hidden shadow-xl"
                        >
                            <div className="bg-secondary/40 border-b border-border/60 px-5 py-3 flex items-center justify-between">
                                <span className="text-xs font-black uppercase tracking-wider text-foreground">Add Custom Entity</span>
                                <button onClick={() => setShowAddNodeModal(false)} className="p-1 rounded-md hover:bg-secondary/60 text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                            </div>
                            <form onSubmit={handleAddNodeSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Entity Name / Label</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Stanford University, Emma"
                                        value={nodeLabel}
                                        onChange={(e) => setNodeLabel(e.target.value)}
                                        required
                                        className="w-full bg-secondary/35 border border-border/50 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-500/30"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Category Group</label>
                                    <select
                                        value={nodeGroup}
                                        onChange={(e) => setNodeGroup(e.target.value)}
                                        className="w-full bg-secondary/35 border border-border/50 rounded-lg p-2.5 text-xs focus:outline-none"
                                    >
                                        <option value="friend">Friend / Colleague</option>
                                        <option value="family">Family Member</option>
                                        <option value="work">Organization / Workplace</option>
                                        <option value="education">School / University</option>
                                        <option value="hobby">Hobby / Activity</option>
                                        <option value="place">City / Place</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-1">Brief details (optional)</label>
                                    <textarea
                                        placeholder="Brief notes about this connection..."
                                        value={nodeDetails}
                                        onChange={(e) => setNodeDetails(e.target.value)}
                                        rows={3}
                                        className="w-full bg-secondary/35 border border-border/50 rounded-lg p-2.5 text-xs focus:outline-none resize-none"
                                    />
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddNodeModal(false)}
                                        className="px-4 py-2 border border-border rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-secondary/40"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-lg hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        Create Entity
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default SecondBrainGraph;
