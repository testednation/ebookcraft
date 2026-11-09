import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  ChapterSentimentReport,
  ParagraphSlice,
} from '../services/sentimentAnalyzer';
import {
  Activity,
  Gauge,
  Waves,
  HeartPulse,
  Info,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
  BookOpen,
  Sliders,
} from 'lucide-react';

interface WritingSentimentGaugeProps {
  report: ChapterSentimentReport;
  onClose?: () => void;
  isCompact?: boolean;
}

export const WritingSentimentGauge: React.FC<WritingSentimentGaugeProps> = ({
  report,
  onClose,
  isCompact = false,
}) => {
  const gaugeSvgRef = useRef<SVGSVGElement | null>(null);
  const waveSvgRef = useRef<SVGSVGElement | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<ParagraphSlice | null>(null);
  const [activeTab, setActiveTab] = useState<'gauge' | 'arc' | 'pacing'>('gauge');

  // Color mapping based on score
  const getScoreColor = (score: number) => {
    if (score <= -0.4) return '#f43f5e'; // rose-500
    if (score <= -0.15) return '#fb923c'; // orange-400
    if (score < 0.15) return '#94a3b8'; // slate-400
    if (score < 0.45) return '#34d399'; // emerald-400
    return '#fbbf24'; // amber-400
  };

  const currentColor = getScoreColor(report.overallScore);

  // -------------------------------------------------------------
  // D3 GAUGE RENDERING (Semicircular Radial Gauge)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!gaugeSvgRef.current) return;

    const svg = d3.select(gaugeSvgRef.current);
    svg.selectAll('*').remove();

    const width = 240;
    const height = 135;
    const margin = { top: 10, right: 15, bottom: 10, left: 15 };
    const radius = Math.min(width - margin.left - margin.right, (height - margin.top) * 2) / 2;

    const g = svg
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height - margin.bottom})`);

    // Define Arc Generator
    const arcGenerator = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(radius - 18)
      .outerRadius(radius)
      .cornerRadius(4);

    // Background track segments representing emotional spectrum
    // Semicircle: -Math.PI / 2 (-90 deg) to Math.PI / 2 (+90 deg)
    const arcSegments = [
      { startAngle: -Math.PI / 2, endAngle: -Math.PI / 4, color: '#e11d48', label: 'Dark' },
      { startAngle: -Math.PI / 4, endAngle: -Math.PI / 12, color: '#f97316', label: 'Tense' },
      { startAngle: -Math.PI / 12, endAngle: Math.PI / 12, color: '#64748b', label: 'Neutral' },
      { startAngle: Math.PI / 12, endAngle: Math.PI / 4, color: '#10b981', label: 'Warm' },
      { startAngle: Math.PI / 4, endAngle: Math.PI / 2, color: '#f59e0b', label: 'Luminous' },
    ];

    // Background track glow
    g.selectAll('.segment-bg')
      .data(arcSegments)
      .enter()
      .append('path')
      .attr('class', 'segment-bg')
      .attr('d', (d) => arcGenerator(d))
      .attr('fill', (d) => d.color)
      .attr('opacity', 0.25);

    // Active fill up to current score
    // Map overallScore (-1.0 to +1.0) to angle (-Math.PI/2 to Math.PI/2)
    const angleScale = d3.scaleLinear().domain([-1, 1]).range([-Math.PI / 2, Math.PI / 2]);
    const targetAngle = angleScale(report.overallScore);

    // Active arc path
    const activeArcGen = d3
      .arc<{ startAngle: number; endAngle: number }>()
      .innerRadius(radius - 17)
      .outerRadius(radius - 1)
      .cornerRadius(3);

    // Determine active segment range from neutral (0) to targetAngle
    const isPositive = targetAngle >= 0;
    const activeStart = 0;
    const activeEnd = targetAngle;

    g.append('path')
      .datum({
        startAngle: Math.min(activeStart, activeEnd),
        endAngle: Math.max(activeStart, activeEnd),
      })
      .attr('d', (d) => activeArcGen(d))
      .attr('fill', currentColor)
      .attr('opacity', 0.95)
      .style('filter', `drop-shadow(0 0 6px ${currentColor}66)`);

    // Ticks & Reference markers
    const tickAngles = [-Math.PI / 2, -Math.PI / 4, 0, Math.PI / 4, Math.PI / 2];
    tickAngles.forEach((angle) => {
      const x1 = Math.sin(angle) * (radius - 22);
      const y1 = -Math.cos(angle) * (radius - 22);
      const x2 = Math.sin(angle) * (radius - 26);
      const y2 = -Math.cos(angle) * (radius - 26);

      g.append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', '#78716c')
        .attr('stroke-width', 1.5)
        .attr('stroke-linecap', 'round');
    });

    // Needle indicator using D3
    const needleLength = radius - 12;
    const needleG = g.append('g').attr('class', 'needle');

    const needleLine = needleG
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', 0)
      .attr('y2', -needleLength)
      .attr('stroke', '#f5f5f4')
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .style('filter', 'drop-shadow(0 1px 3px rgba(0,0,0,0.8))');

    // Pivot center circle
    g.append('circle')
      .attr('r', 8)
      .attr('fill', '#1c1917')
      .attr('stroke', '#a8a29e')
      .attr('stroke-width', 2);

    g.append('circle')
      .attr('r', 3.5)
      .attr('fill', currentColor);

    // Initial rotation animation
    const initialRotation = -90;
    const targetDeg = (targetAngle * 180) / Math.PI;

    needleG
      .attr('transform', `rotate(${initialRotation})`)
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('transform', `rotate(${targetDeg})`);

  }, [report.overallScore, currentColor]);

  // -------------------------------------------------------------
  // D3 EMOTIONAL ARC & PACING WAVEFORM RENDERING
  // -------------------------------------------------------------
  useEffect(() => {
    if (!waveSvgRef.current) return;
    const slices = report.paragraphSlices;
    if (!slices || slices.length === 0) return;

    const svg = d3.select(waveSvgRef.current);
    svg.selectAll('*').remove();

    const containerWidth = waveSvgRef.current.parentElement?.clientWidth || 460;
    const width = Math.max(300, containerWidth);
    const height = 110;
    const margin = { top: 12, right: 16, bottom: 22, left: 32 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X Scale across paragraph slices
    const xScale = d3
      .scaleLinear()
      .domain([1, slices.length])
      .range([0, innerWidth]);

    // Y Scale from -1.0 to +1.0
    const yScale = d3
      .scaleLinear()
      .domain([-1.0, 1.0])
      .range([innerHeight, 0]);

    // Zero baseline (Neutral tone)
    const zeroY = yScale(0);

    g.append('line')
      .attr('x1', 0)
      .attr('y1', zeroY)
      .attr('x2', innerWidth)
      .attr('y2', zeroY)
      .attr('stroke', '#44403c')
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-width', 1);

    // Gradient definitions
    const defs = svg.append('defs');

    // Positive area gradient
    const posGrad = defs
      .append('linearGradient')
      .attr('id', 'pos-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    posGrad.append('stop').attr('offset', '0%').attr('stop-color', '#10b981').attr('stop-opacity', 0.4);
    posGrad.append('stop').attr('offset', '100%').attr('stop-color', '#10b981').attr('stop-opacity', 0.0);

    // Area generator for emotional progression
    const areaGenerator = d3
      .area<ParagraphSlice>()
      .x((d) => xScale(d.index))
      .y0(zeroY)
      .y1((d) => yScale(d.sentimentScore))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(slices)
      .attr('d', areaGenerator)
      .attr('fill', 'url(#pos-gradient)');

    // Line generator
    const lineGenerator = d3
      .line<ParagraphSlice>()
      .x((d) => xScale(d.index))
      .y((d) => yScale(d.sentimentScore))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(slices)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2.5)
      .attr('stroke-linecap', 'round')
      .style('filter', 'drop-shadow(0 2px 4px rgba(56, 189, 248, 0.3))');

    // Interactive Data points
    const pointsG = g.append('g').attr('class', 'points');

    pointsG
      .selectAll('.data-point')
      .data(slices)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', (d) => xScale(d.index))
      .attr('cy', (d) => yScale(d.sentimentScore))
      .attr('r', (d) => (d.hasDialogue ? 4.5 : 3.5))
      .attr('fill', (d) => (d.sentimentScore >= 0 ? '#34d399' : '#f43f5e'))
      .attr('stroke', '#1c1917')
      .attr('stroke-width', 1.5)
      .style('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d: ParagraphSlice) => {
        d3.select(event.currentTarget as SVGCircleElement).attr('r', 6.5);
        setHoveredSlice(d);
      })
      .on('mouseleave', (event: MouseEvent, d: ParagraphSlice) => {
        d3.select(event.currentTarget as SVGCircleElement).attr('r', d.hasDialogue ? 4.5 : 3.5);
        setHoveredSlice(null);
      });

    // Axis Labels
    g.append('text')
      .attr('x', 0)
      .attr('y', innerHeight + 15)
      .attr('font-size', '9px')
      .attr('fill', '#78716c')
      .text('Scene Start');

    g.append('text')
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + 15)
      .attr('text-anchor', 'middle')
      .attr('font-size', '9px')
      .attr('fill', '#78716c')
      .text('Midpoint');

    g.append('text')
      .attr('x', innerWidth)
      .attr('y', innerHeight + 15)
      .attr('text-anchor', 'end')
      .attr('font-size', '9px')
      .attr('fill', '#78716c')
      .text('Scene Climax / End');

    // Y Axis indicators
    g.append('text')
      .attr('x', -6)
      .attr('y', yScale(0.8))
      .attr('text-anchor', 'end')
      .attr('font-size', '8px')
      .attr('fill', '#34d399')
      .text('+1');

    g.append('text')
      .attr('x', -6)
      .attr('y', zeroY + 3)
      .attr('text-anchor', 'end')
      .attr('font-size', '8px')
      .attr('fill', '#78716c')
      .text('0');

    g.append('text')
      .attr('x', -6)
      .attr('y', yScale(-0.8))
      .attr('text-anchor', 'end')
      .attr('font-size', '8px')
      .attr('fill', '#f43f5e')
      .text('-1');

  }, [report.paragraphSlices, activeTab]);

  return (
    <div className="border-b border-stone-800 bg-stone-950/95 p-4 shrink-0 text-xs text-stone-300 animate-fade-in shadow-xl select-none">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-3 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-stone-100 text-sm">Writing Sentiment & Narrative Pacing</h4>
              <span
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${currentColor}15`,
                  color: currentColor,
                  border: `1px solid ${currentColor}33`,
                }}
              >
                {report.overallScore > 0 ? `+${report.overallScore}` : report.overallScore} Polarity
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              D3-powered emotional valence, sentence rhythm variety, and dramatic tension analysis.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-900 border border-stone-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('gauge')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                activeTab === 'gauge'
                  ? 'bg-stone-800 text-amber-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Gauge & Tone
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('arc')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'arc'
                  ? 'bg-stone-800 text-sky-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Waves className="w-3 h-3" />
              <span>Emotional Arc</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pacing')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'pacing'
                  ? 'bg-stone-800 text-emerald-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>Pacing & Rhythm</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 p-1 hover:bg-stone-850 rounded"
              title="Close Sentiment Panel"
            >
              &times; Close
            </button>
          )}
        </div>
      </div>

      {/* Main Analysis Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: D3 Gauge Visual & Primary Tone */}
        <div className="lg:col-span-4 flex flex-col items-center justify-between p-3 rounded-xl bg-stone-900/70 border border-stone-800/80">
          <div className="text-center w-full">
            <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500 mb-1">
              Chapter Emotional Valence
            </div>
            <div
              className="text-base font-serif font-bold transition-colors"
              style={{ color: currentColor }}
            >
              {report.toneLabel}
            </div>
            <div className="text-[10px] text-stone-400 mt-0.5 line-clamp-2 px-2">
              {report.toneDescription}
            </div>
          </div>

          {/* D3 Semicircular SVG Gauge */}
          <div className="my-1 relative flex items-center justify-center">
            <svg
              ref={gaugeSvgRef}
              width={240}
              height={135}
              className="overflow-visible"
            />
            {/* Center Readout */}
            <div className="absolute bottom-2 text-center">
              <span className="text-xs font-mono font-bold text-stone-200">
                {report.normalizedScore}
              </span>
              <span className="text-[9px] text-stone-500 block">/ 100</span>
            </div>
          </div>

          {/* Scale labels */}
          <div className="w-full flex items-center justify-between text-[9px] text-stone-500 font-mono px-4 border-t border-stone-800/60 pt-1.5">
            <span className="text-rose-400">Dark / Tragic</span>
            <span className="text-stone-400">Atmospheric</span>
            <span className="text-amber-400">Triumphant</span>
          </div>
        </div>

        {/* Right / Middle: Dynamic View Panels */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-3">
          {activeTab === 'gauge' && (
            <div className="space-y-3">
              {/* Quick Stat Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800">
                  <div className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold">
                    Emotional Variance
                  </div>
                  <div className="text-sm font-bold text-sky-400 mt-0.5">
                    {report.emotionalVariance.toFixed(2)}
                  </div>
                  <div className="text-[9px] text-stone-400 truncate">
                    {report.varianceRating}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800">
                  <div className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold">
                    Pacing Cadence
                  </div>
                  <div className="text-sm font-bold text-emerald-400 mt-0.5">
                    {report.avgSentenceLength} w/sent
                  </div>
                  <div className="text-[9px] text-stone-400 truncate">
                    {report.pacingRating}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800">
                  <div className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold">
                    Sentence Diversity
                  </div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    ±{report.sentenceLengthVariance} words
                  </div>
                  <div className="text-[9px] text-stone-400">Rhythm spread</div>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800">
                  <div className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold">
                    Dialogue Ratio
                  </div>
                  <div className="text-sm font-bold text-indigo-400 mt-0.5">
                    {Math.round(report.dialogueRatio * 100)}%
                  </div>
                  <div className="text-[9px] text-stone-400">
                    {report.dialogueRatio > 0.35 ? 'Dialogue Rich' : 'Narrative Dense'}
                  </div>
                </div>
              </div>

              {/* Feedback cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-2.5 rounded-lg bg-stone-900/50 border border-stone-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300 font-semibold text-[11px]">
                    <HeartPulse className="w-3.5 h-3.5 text-sky-400" />
                    <span>Emotional Variance Feedback</span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    {report.varianceFeedback}
                  </p>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-900/50 border border-stone-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-stone-300 font-semibold text-[11px]">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pacing & Rhythm Feedback</span>
                  </div>
                  <p className="text-[10px] text-stone-400 leading-relaxed">
                    {report.pacingFeedback}
                  </p>
                </div>
              </div>

              {/* Editorial Suggestions */}
              <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/20 text-stone-300 text-[11px] leading-relaxed">
                <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Editorial Prose Recommendation</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-[10px] text-stone-300">
                  {report.editorialRecommendations.map((rec, rIdx) => (
                    <li key={rIdx}>{rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'arc' && (
            <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-stone-200 text-xs">
                    Chapter Emotional Trajectory (D3 Waveform)
                  </h5>
                  <p className="text-[10px] text-stone-400">
                    Traces paragraph-by-paragraph tone shifts from opening to conclusion. Hover points for scene details.
                  </p>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Uplifting
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Tension / Grief
                  </span>
                </div>
              </div>

              {/* D3 Waveform SVG Container */}
              <div className="w-full overflow-hidden bg-stone-950/60 rounded-lg p-2 border border-stone-800/60">
                <svg ref={waveSvgRef} className="w-full h-28" />
              </div>

              {/* Hovered Slice Inspector */}
              {hoveredSlice ? (
                <div className="p-2 rounded bg-stone-900 border border-stone-700/80 text-[10px] flex items-center justify-between animate-fade-in">
                  <div className="flex-1 mr-3">
                    <span className="font-bold text-amber-300 mr-2">
                      Paragraph #{hoveredSlice.index}:
                    </span>
                    <span className="text-stone-300 italic">"{hoveredSlice.snippet}"</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 font-mono text-[9px]">
                    <span
                      className="font-bold"
                      style={{ color: getScoreColor(hoveredSlice.sentimentScore) }}
                    >
                      {hoveredSlice.sentimentScore > 0 ? `+${hoveredSlice.sentimentScore}` : hoveredSlice.sentimentScore} tone
                    </span>
                    <span className="text-stone-400">{hoveredSlice.wordCount} words</span>
                    <span className="text-stone-400">{hoveredSlice.avgSentenceLength} w/sent</span>
                    {hoveredSlice.hasDialogue && (
                      <span className="text-indigo-400 font-semibold">[Dialogue]</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-stone-500 italic text-center py-1">
                  Hover over any node along the curve to inspect scene paragraphs and local pacing.
                </div>
              )}
            </div>
          )}

          {activeTab === 'pacing' && (
            <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-3">
              <div>
                <h5 className="font-semibold text-stone-200 text-xs">
                  Pacing & Narrative Cadence Breakdown
                </h5>
                <p className="text-[10px] text-stone-400">
                  Detailed analysis of sentence structure diversity, dialogue distribution, and emotional tension.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Dialogue Bar */}
                <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 space-y-2">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-stone-400 font-medium">Dialogue vs Narrative Exposition</span>
                    <span className="font-bold text-indigo-400">{Math.round(report.dialogueRatio * 100)}% Spoken</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden flex">
                    <div
                      className="h-full bg-indigo-500 rounded-l-full transition-all duration-300"
                      style={{ width: `${Math.round(report.dialogueRatio * 100)}%` }}
                    />
                    <div
                      className="h-full bg-stone-700 rounded-r-full transition-all duration-300"
                      style={{ width: `${100 - Math.round(report.dialogueRatio * 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-stone-500">
                    <span>Dialogue: {Math.round(report.dialogueRatio * 100)}%</span>
                    <span>Narrative: {100 - Math.round(report.dialogueRatio * 100)}%</span>
                  </div>
                </div>

                {/* Literary Tone Keyword Density */}
                <div className="p-2.5 rounded-lg bg-stone-950/80 border border-stone-800 space-y-1.5">
                  <div className="text-[10px] text-stone-400 font-medium">Literary Keyword Density</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex justify-between p-1 rounded bg-stone-900 border border-stone-850">
                      <span className="text-emerald-400">Uplift / Hope</span>
                      <span className="font-mono font-bold text-stone-200">{report.positiveWordCount}</span>
                    </div>
                    <div className="flex justify-between p-1 rounded bg-stone-900 border border-stone-850">
                      <span className="text-rose-400">Grief / Dread</span>
                      <span className="font-mono font-bold text-stone-200">{report.negativeWordCount}</span>
                    </div>
                    <div className="flex justify-between p-1 rounded bg-stone-900 border border-stone-850">
                      <span className="text-amber-400">Tension & Pulse</span>
                      <span className="font-mono font-bold text-stone-200">{report.tensionWordCount}</span>
                    </div>
                    <div className="flex justify-between p-1 rounded bg-stone-900 border border-stone-850">
                      <span className="text-sky-400">Awe & Wonder</span>
                      <span className="font-mono font-bold text-stone-200">{report.wonderWordCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pacing Advice Box */}
              <div className="p-2.5 rounded-lg bg-stone-950/90 border border-stone-800 text-[10px] text-stone-300 space-y-1">
                <span className="font-semibold text-emerald-400">Pacing Recommendation: </span>
                <span>{report.pacingFeedback}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
