/**
 * WorkflowBuilder — Visual drag-and-drop workflow canvas
 * No external DnD library; uses React state + mouse events.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Clock, TrendingUp, Rss, Webhook, UserPlus,
  Sparkles, Calendar, Send, Bell, Timer, GitMerge, Filter,
  Trash2, Link2, X, ChevronDown, ChevronUp,
  Play, Save, RotateCcw, ArrowLeft, Info,
} from 'lucide-react';
import api from '../lib/api';

// ── Node type definitions ──────────────────────────────────────
const NODE_TYPES = {
  // Triggers
  schedule:         { label: 'Schedule',         icon: Clock,      category: 'trigger',   color: 'border-[#00d4aa]' },
  performance:      { label: 'Performance',       icon: TrendingUp, category: 'trigger',   color: 'border-[#00d4aa]' },
  rss_feed:         { label: 'RSS Feed',          icon: Rss,        category: 'trigger',   color: 'border-[#00d4aa]' },
  webhook:          { label: 'Webhook',           icon: Webhook,    category: 'trigger',   color: 'border-[#00d4aa]' },
  new_follower:     { label: 'New Follower',      icon: UserPlus,   category: 'trigger',   color: 'border-[#00d4aa]' },
  // Actions
  generate_content: { label: 'Generate Content',  icon: Sparkles,   category: 'action',    color: 'border-[#6366f1]' },
  schedule_post:    { label: 'Schedule Post',      icon: Calendar,   category: 'action',    color: 'border-[#6366f1]' },
  publish_now:      { label: 'Publish Now',        icon: Send,       category: 'action',    color: 'border-[#6366f1]' },
  send_notification:{ label: 'Send Notification', icon: Bell,       category: 'action',    color: 'border-[#6366f1]' },
  wait_delay:       { label: 'Wait / Delay',       icon: Timer,      category: 'action',    color: 'border-[#6366f1]' },
  if_else:          { label: 'If / Else',          icon: GitMerge,   category: 'condition', color: 'border-amber-400' },
  filter:           { label: 'Filter',             icon: Filter,     category: 'condition', color: 'border-amber-400' },
};

const CATEGORY_COLORS = {
  trigger:   { icon: 'text-[#00d4aa]', bg: 'bg-[#00d4aa]/10' },
  action:    { icon: 'text-[#6366f1]', bg: 'bg-[#6366f1]/10' },
  condition: { icon: 'text-amber-400',  bg: 'bg-amber-400/10'  },
};

// Node dimensions
const NODE_W = 140;
const NODE_H = 80;

let _idCounter = 0;
const genId = () => `node_${Date.now()}_${_idCounter++}`;

// ── Helper: centre point of a node for line drawing ────────────
function nodeCenter(node) {
  return { x: node.x + NODE_W / 2, y: node.y + NODE_H / 2 };
}

// ── WorkflowNode card ──────────────────────────────────────────
function WorkflowNode({ node, selected, connectMode, onMouseDown, onDelete, onConnectClick }) {
  const def = NODE_TYPES[node.type];
  const Icon = def?.icon || Sparkles;
  const catColor = CATEGORY_COLORS[def?.category] || CATEGORY_COLORS.action;

  const borderClass = connectMode
    ? selected
      ? 'border-white ring-2 ring-white/30'
      : 'border-dashed border-gray-500 hover:border-white cursor-crosshair'
    : `${def?.color || 'border-[#6366f1]'} hover:brightness-110 cursor-grab active:cursor-grabbing`;

  return (
    <div
      className={`absolute select-none rounded-xl border-2 bg-[#252b3f] shadow-lg transition-shadow ${borderClass}`}
      style={{ left: node.x, top: node.y, width: NODE_W, height: NODE_H }}
      onMouseDown={(e) => {
        if (connectMode) { onConnectClick(node.id); return; }
        onMouseDown(e, node.id);
      }}
    >
      {/* Delete button */}
      {!connectMode && (
        <button
          className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-red-500/80 hover:bg-red-500 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
          style={{ opacity: 1 }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
        >
          <X size={10} />
        </button>
      )}

      <div className="flex flex-col items-center justify-center h-full gap-1.5 px-2">
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${catColor.bg}`}>
          <Icon size={14} className={catColor.icon} />
        </div>
        <p className="text-[11px] text-white font-medium text-center leading-tight line-clamp-2">
          {def?.label || node.type}
        </p>
      </div>
    </div>
  );
}

// ── Connection lines SVG layer ─────────────────────────────────
function ConnectionLayer({ nodes, connections, connectingFrom }) {
  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]));

  return (
    <svg
      className="absolute inset-0 pointer-events-none overflow-visible"
      style={{ width: '100%', height: '100%' }}
    >
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#6b7280" />
        </marker>
        <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#00d4aa" />
        </marker>
      </defs>

      {connections.map((conn, i) => {
        const from = nodeMap[conn.from];
        const to   = nodeMap[conn.to];
        if (!from || !to) return null;
        const f = nodeCenter(from);
        const t = nodeCenter(to);
        // Cubic bezier for a nice curve
        const cx = (f.x + t.x) / 2;
        const d = `M ${f.x} ${f.y} C ${cx} ${f.y}, ${cx} ${t.y}, ${t.x} ${t.y}`;
        return (
          <path
            key={i}
            d={d}
            stroke="#6b7280"
            strokeWidth="2"
            fill="none"
            strokeDasharray="none"
            markerEnd="url(#arrowhead)"
            opacity="0.7"
          />
        );
      })}

      {/* Ghost line when connecting */}
      {connectingFrom && nodeMap[connectingFrom] && (
        <circle
          cx={nodeCenter(nodeMap[connectingFrom]).x}
          cy={nodeCenter(nodeMap[connectingFrom]).y}
          r="6"
          fill="#00d4aa"
          opacity="0.8"
        />
      )}
    </svg>
  );
}

// ── Sidebar palette ────────────────────────────────────────────
function SidebarPalette({ onDragStart }) {
  const triggers   = Object.entries(NODE_TYPES).filter(([, v]) => v.category === 'trigger');
  const actions    = Object.entries(NODE_TYPES).filter(([, v]) => v.category === 'action');
  const conditions = Object.entries(NODE_TYPES).filter(([, v]) => v.category === 'condition');

  const renderGroup = (title, entries, accent) => (
    <div className="mb-5">
      <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 ${accent}`}>{title}</p>
      <div className="space-y-1.5">
        {entries.map(([type, def]) => {
          const Icon = def.icon;
          const cat  = CATEGORY_COLORS[def.category];
          return (
            <div
              key={type}
              draggable
              onDragStart={(e) => onDragStart(e, type)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-dark-border bg-[#1a1f2e] hover:border-gray-500 cursor-grab active:cursor-grabbing select-none transition-colors"
              title={`Drag to canvas`}
            >
              <div className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 ${cat.bg}`}>
                <Icon size={12} className={cat.icon} />
              </div>
              <span className="text-xs text-gray-300 truncate">{def.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <aside className="w-52 flex-shrink-0 flex flex-col border-r border-dark-border bg-[#1a1f2e] overflow-y-auto">
      <div className="p-4 border-b border-dark-border">
        <p className="text-xs font-semibold text-white">Node Palette</p>
        <p className="text-[10px] text-gray-500 mt-0.5">Drag nodes onto the canvas</p>
      </div>
      <div className="p-4 flex-1">
        {renderGroup('Triggers', triggers, 'text-[#00d4aa]')}
        {renderGroup('Actions', actions, 'text-[#6366f1]')}
        {renderGroup('Conditions', conditions, 'text-amber-400')}
      </div>
    </aside>
  );
}

// ── Main page component ────────────────────────────────────────
export default function WorkflowBuilder() {
  const navigate = useNavigate();

  // Workflow metadata
  const [workflowName, setWorkflowName] = useState('My Workflow');

  // Canvas state
  const [nodes, setNodes]             = useState([]);
  const [connections, setConnections] = useState([]);

  // Interaction state
  const [connectMode, setConnectMode]       = useState(false);
  const [connectingFrom, setConnectingFrom] = useState(null); // nodeId awaiting second click
  const [dragging, setDragging]             = useState(null); // { nodeId, offsetX, offsetY }

  // UI state
  const [jsonOpen, setJsonOpen] = useState(true);
  const [saving, setSaving]     = useState(false);

  const canvasRef = useRef(null);

  // ── Drag-from-palette (HTML5 drag) ──────────────────────────
  const handlePaletteDragStart = (e, type) => {
    e.dataTransfer.setData('nodeType', type);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleCanvasDrop = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('nodeType');
    if (!type || !NODE_TYPES[type]) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - NODE_W / 2;
    const y = e.clientY - rect.top  - NODE_H / 2;

    setNodes(prev => [...prev, { id: genId(), type, x: Math.max(0, x), y: Math.max(0, y) }]);
  };

  const handleCanvasDragOver = (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; };

  // ── Node drag-on-canvas (mouse events) ──────────────────────
  const handleNodeMouseDown = (e, nodeId) => {
    if (connectMode) return;
    e.preventDefault();
    e.stopPropagation();

    const rect = canvasRef.current.getBoundingClientRect();
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    setDragging({
      nodeId,
      offsetX: e.clientX - rect.left - node.x,
      offsetY: e.clientY - rect.top  - node.y,
    });
  };

  const handleCanvasMouseMove = useCallback((e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - dragging.offsetX;
    const y = e.clientY - rect.top  - dragging.offsetY;

    setNodes(prev => prev.map(n =>
      n.id === dragging.nodeId
        ? { ...n, x: Math.max(0, x), y: Math.max(0, y) }
        : n
    ));
  }, [dragging]);

  const handleCanvasMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // ── Connect mode ─────────────────────────────────────────────
  const handleNodeConnectClick = (nodeId) => {
    if (!connectMode) return;

    if (!connectingFrom) {
      setConnectingFrom(nodeId);
      return;
    }

    if (connectingFrom === nodeId) {
      setConnectingFrom(null);
      return;
    }

    // Avoid duplicate connections
    const exists = connections.some(c => c.from === connectingFrom && c.to === nodeId);
    if (!exists) {
      setConnections(prev => [...prev, { from: connectingFrom, to: nodeId }]);
    }
    setConnectingFrom(null);
  };

  // Exit connect mode clears pending
  const toggleConnectMode = () => {
    setConnectMode(prev => !prev);
    setConnectingFrom(null);
  };

  // ── Delete node ──────────────────────────────────────────────
  const deleteNode = (nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
    setConnections(prev => prev.filter(c => c.from !== nodeId && c.to !== nodeId));
  };

  // ── Clear canvas ─────────────────────────────────────────────
  const clearCanvas = () => {
    setNodes([]);
    setConnections([]);
    setConnectingFrom(null);
    setConnectMode(false);
  };

  // ── Workflow definition for preview / save ───────────────────
  const firstTrigger = nodes.find(n => NODE_TYPES[n.type]?.category === 'trigger');
  const workflowDef = {
    name: workflowName,
    nodes: nodes.map(n => ({ id: n.id, type: n.type, x: n.x, y: n.y })),
    connections,
    trigger_type: firstTrigger?.type || 'schedule',
  };

  // ── Save ─────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!workflowName.trim()) { toast.error('Please enter a workflow name'); return; }
    if (nodes.length === 0)   { toast.error('Add at least one node before saving'); return; }

    setSaving(true);
    try {
      await api.post('/automation/workflows', workflowDef);
      toast.success('Workflow saved!');
      navigate('/automation');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  // ── Global mouseup to stop drag even if cursor leaves canvas ─
  useEffect(() => {
    const up = () => setDragging(null);
    window.addEventListener('mouseup', up);
    return () => window.removeEventListener('mouseup', up);
  }, []);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-[#0f1117] overflow-hidden">

      {/* ── Top toolbar ──────────────────────────────────────── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-dark-border bg-[#252b3f] flex-shrink-0">
        <button
          onClick={() => navigate('/automation')}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          title="Back to Automation"
        >
          <ArrowLeft size={16} />
        </button>

        <input
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          className="bg-transparent border-b border-gray-600 focus:border-[#00d4aa] text-white text-sm font-medium px-1 py-0.5 outline-none w-48 transition-colors"
          placeholder="Workflow name…"
        />

        <div className="h-4 w-px bg-dark-border" />

        {/* Connect toggle */}
        <button
          onClick={toggleConnectMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
            connectMode
              ? 'bg-[#00d4aa]/20 border-[#00d4aa]/50 text-[#00d4aa]'
              : 'border-dark-border text-gray-400 hover:text-white hover:border-gray-500'
          }`}
        >
          <Link2 size={13} />
          {connectMode
            ? connectingFrom
              ? 'Click target node…'
              : 'Click source node…'
            : 'Connect'}
        </button>

        {/* Clear */}
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dark-border text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
        >
          <RotateCcw size={13} /> Clear
        </button>

        <div className="flex-1" />

        {/* Run Now (disabled) */}
        <div className="relative group">
          <button
            disabled
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-dark-border text-gray-600 cursor-not-allowed"
          >
            <Play size={13} /> Run Now
          </button>
          <div className="absolute bottom-full right-0 mb-2 w-52 px-2.5 py-1.5 bg-gray-800 text-gray-300 text-[10px] rounded-lg hidden group-hover:block border border-gray-700 z-20 leading-snug">
            <Info size={10} className="inline mr-1 text-gray-500" />
            Run will execute when saved and activated
          </div>
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium bg-[#00d4aa] hover:bg-[#00d4aa]/90 text-white transition-colors disabled:opacity-60"
        >
          <Save size={13} /> {saving ? 'Saving…' : 'Save Workflow'}
        </button>
      </header>

      {/* ── Body: sidebar + canvas ────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        <SidebarPalette onDragStart={handlePaletteDragStart} />

        {/* Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          <div
            ref={canvasRef}
            className="relative flex-1 overflow-hidden"
            style={{
              background: '#0f1117',
              backgroundImage: `
                radial-gradient(circle, #1e2535 1px, transparent 1px)
              `,
              backgroundSize: '28px 28px',
              cursor: connectMode ? 'crosshair' : dragging ? 'grabbing' : 'default',
            }}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
          >
            {/* SVG connections */}
            <ConnectionLayer
              nodes={nodes}
              connections={connections}
              connectingFrom={connectingFrom}
            />

            {/* Nodes */}
            {nodes.map((node) => (
              <WorkflowNode
                key={node.id}
                node={node}
                selected={connectingFrom === node.id}
                connectMode={connectMode}
                onMouseDown={handleNodeMouseDown}
                onDelete={deleteNode}
                onConnectClick={handleNodeConnectClick}
              />
            ))}

            {/* Empty state hint */}
            {nodes.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
                <div className="flex flex-col items-center gap-3 opacity-40">
                  <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-gray-600 flex items-center justify-center">
                    <GitMerge size={28} className="text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500 text-center max-w-xs leading-snug">
                    Drag a trigger from the left panel<br />to start your workflow
                  </p>
                </div>
              </div>
            )}

            {/* Connect mode overlay hint */}
            {connectMode && nodes.length > 0 && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#00d4aa]/10 border border-[#00d4aa]/30 rounded-full text-[11px] text-[#00d4aa] pointer-events-none select-none">
                {connectingFrom ? '→ Now click the destination node' : 'Click a source node to start a connection'}
              </div>
            )}
          </div>

          {/* ── JSON preview ──────────────────────────────────── */}
          <div className="flex-shrink-0 border-t border-dark-border bg-[#1a1f2e]">
            <button
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium text-gray-400 hover:text-white transition-colors"
              onClick={() => setJsonOpen(prev => !prev)}
            >
              <span>Workflow Definition (JSON)</span>
              {jsonOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </button>

            {jsonOpen && (
              <div
                className="px-4 pb-3 overflow-auto"
                style={{ maxHeight: 180 }}
              >
                <pre className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-wrap break-all font-mono">
                  {JSON.stringify(workflowDef, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
