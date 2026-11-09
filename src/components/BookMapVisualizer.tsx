import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Chapter } from '../types/book';
import {
  BookMapReport,
  ChapterPacingNode,
  analyzeBookMap,
} from '../services/bookMapAnalyzer';
import {
  Map,
  Compass,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight,
  Sparkles,
  Info,
  Clock,
  BookOpen,
  ArrowRight,
  Maximize2,
} from 'lucide-react';

interface BookMapVisualizerProps {
  chapters: Chapter[];
  currentChapterId: string;
  onSelectChapter?: (chapterId: string) => void;
  onClose?: () => void;
}

export const BookMapVisualizer: React.FC<BookMapVisualizerProps> = ({
  chapters,
  currentChapterId,
  onSelectChapter,
  onClose,
}) => {
  const timelineSvgRef = useRef<SVGSVGElement | null>(null);
  const ribbonSvgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<'timeline' | 'parts'>('timeline');
  const [hoveredNode, setHoveredNode] = useState<ChapterPacingNode | null>(null);

  // Compute Book Map analysis
  const report: BookMapReport = useMemo(() => {
    return analyzeBookMap(chapters, currentChapterId);
  }, [chapters, currentChapterId]);

  // Active selected chapter node
  const currentNode = useMemo(() => {
    return report.nodes.find((n) => n.id === currentChapterId);
  }, [report.nodes, currentChapterId]);

  // Color generator based on node type and current state
  const getNodeColor = (node: ChapterPacingNode) => {
    if (node.isCurrent) return '#f59e0b'; // amber-500
    if (node.isPartDivider) return '#d97706'; // amber-600
    if (node.group === 'front-matter') return '#8b5cf6'; // violet-500
    if (node.group === 'back-matter') return '#a8a29e'; // stone-400
    if (node.pacingCategory === 'expansive') return '#6366f1'; // indigo-500
    if (node.pacingCategory === 'brisk') return '#06b6d4'; // cyan-500
    if (node.pacingCategory === 'interlude') return '#ec4899'; // pink-500
    return '#3b82f6'; // blue-500 default body
  };

  // -------------------------------------------------------------
  // D3 TIMELINE HORIZON & PACING SPLINE RENDERING
  // -------------------------------------------------------------
  useEffect(() => {
    if (!timelineSvgRef.current) return;
    const svg = d3.select(timelineSvgRef.current);
    svg.selectAll('*').remove();

    const nodes = report.nodes;
    if (nodes.length === 0) return;

    const containerWidth = containerRef.current?.clientWidth || 760;
    const width = Math.max(500, containerWidth - 36);
    const height = 185;
    const margin = { top: 22, right: 28, bottom: 32, left: 44 };

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.attr('width', '100%');
    svg.attr('height', height);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left}, ${margin.top})`);

    // X Scale: Discrete band for each chapter
    const xScale = d3
      .scaleBand<string>()
      .domain(nodes.map((n) => n.id))
      .range([0, innerWidth])
      .padding(0.24);

    // Y Scale: Max word count + headroom
    const maxWords = Math.max(
      1000,
      report.meanBodyWordCount * 1.5,
      ...nodes.map((n) => n.wordCount)
    );
    const yScale = d3.scaleLinear().domain([0, maxWords]).nice().range([innerHeight, 0]);

    // Horizontal gridlines & Y Axis Ticks
    const yTicks = yScale.ticks(4);
    yTicks.forEach((tickVal) => {
      const y = yScale(tickVal);
      g.append('line')
        .attr('x1', 0)
        .attr('y1', y)
        .attr('x2', innerWidth)
        .attr('y2', y)
        .attr('stroke', '#292524')
        .attr('stroke-dasharray', '2 3')
        .attr('stroke-width', 1);

      g.append('text')
        .attr('x', -8)
        .attr('y', y + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#78716c')
        .text(tickVal >= 1000 ? `${Math.round(tickVal / 1000)}k` : `${tickVal}`);
    });

    // Reference Line: Mean Body Chapter Word Count
    if (report.meanBodyWordCount > 0 && report.bodyChapterCount >= 2) {
      const meanY = yScale(report.meanBodyWordCount);
      g.append('line')
        .attr('x1', 0)
        .attr('y1', meanY)
        .attr('x2', innerWidth)
        .attr('y2', meanY)
        .attr('stroke', '#f59e0b')
        .attr('stroke-dasharray', '4 4')
        .attr('stroke-width', 1.2)
        .attr('opacity', 0.6);

      g.append('text')
        .attr('x', innerWidth)
        .attr('y', meanY - 4)
        .attr('text-anchor', 'end')
        .attr('font-size', '8.5px')
        .attr('font-family', 'monospace')
        .attr('fill', '#f59e0b')
        .attr('opacity', 0.85)
        .text(`Avg: ${report.meanBodyWordCount.toLocaleString()} w`);
    }

    // D3 Pacing Horizon Spline Curve (sweeping through chapter lengths)
    const lineGenerator = d3
      .line<ChapterPacingNode>()
      .x((d) => (xScale(d.id) || 0) + xScale.bandwidth() / 2)
      .y((d) => yScale(d.wordCount))
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(nodes)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', '#38bdf8')
      .attr('stroke-width', 2)
      .attr('stroke-opacity', 0.45)
      .attr('stroke-linecap', 'round');

    // Chapter Bars
    nodes.forEach((node) => {
      const x = xScale(node.id) || 0;
      const y = yScale(node.wordCount);
      const barHeight = Math.max(4, innerHeight - y);
      const isCurrent = node.isCurrent;
      const barColor = getNodeColor(node);

      // Part Divider visual card or standard chapter bar
      if (node.isPartDivider) {
        // Special vertical milestone marker for Part Divider
        g.append('line')
          .attr('x1', x + xScale.bandwidth() / 2)
          .attr('y1', 0)
          .attr('x2', x + xScale.bandwidth() / 2)
          .attr('y2', innerHeight)
          .attr('stroke', '#d97706')
          .attr('stroke-dasharray', '2 2')
          .attr('stroke-width', 1.2)
          .attr('opacity', 0.7);

        g.append('circle')
          .attr('cx', x + xScale.bandwidth() / 2)
          .attr('cy', innerHeight - 8)
          .attr('r', 5)
          .attr('fill', '#d97706')
          .attr('stroke', '#1c1917')
          .attr('stroke-width', 1.5)
          .style('cursor', 'pointer')
          .on('click', () => {
            if (onSelectChapter) onSelectChapter(node.id);
          });
      } else {
        // Standard Chapter Bar
        const rect = g
          .append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', xScale.bandwidth())
          .attr('height', barHeight)
          .attr('rx', 3)
          .attr('fill', barColor)
          .attr('opacity', isCurrent ? 1.0 : 0.78)
          .attr('stroke', isCurrent ? '#fef08a' : '#1c1917')
          .attr('stroke-width', isCurrent ? 2 : 1)
          .style('cursor', 'pointer');

        if (isCurrent) {
          rect.style('filter', 'drop-shadow(0 0 6px rgba(245, 158, 11, 0.6))');
        }

        // Hover & Click Handlers
        rect
          .on('mouseenter', (event: MouseEvent) => {
            d3.select(event.currentTarget as SVGRectElement)
              .attr('opacity', 1.0)
              .attr('stroke', '#fbbf24')
              .attr('stroke-width', 2);
            setHoveredNode(node);
          })
          .on('mouseleave', (event: MouseEvent) => {
            d3.select(event.currentTarget as SVGRectElement)
              .attr('opacity', isCurrent ? 1.0 : 0.78)
              .attr('stroke', isCurrent ? '#fef08a' : '#1c1917')
              .attr('stroke-width', isCurrent ? 2 : 1);
            setHoveredNode(null);
          })
          .on('click', () => {
            if (onSelectChapter) onSelectChapter(node.id);
          });
      }

      // Current Chapter Beacon Indicator
      if (isCurrent) {
        g.append('polygon')
          .attr(
            'points',
            `${x + xScale.bandwidth() / 2 - 4},${y - 9} ${
              x + xScale.bandwidth() / 2 + 4
            },${y - 9} ${x + xScale.bandwidth() / 2},${y - 3}`
          )
          .attr('fill', '#f59e0b')
          .style('filter', 'drop-shadow(0 1px 2px rgba(0,0,0,0.8))');
      }

      // X-Axis Labels (Chapter number / code)
      const labelText = node.isPartDivider
        ? `P${node.partNumber || 'I'}`
        : `${node.order}`;

      g.append('text')
        .attr('x', x + xScale.bandwidth() / 2)
        .attr('y', innerHeight + 14)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('font-weight', isCurrent ? 'bold' : 'normal')
        .attr('fill', isCurrent ? '#f59e0b' : node.isPartDivider ? '#d97706' : '#78716c')
        .style('cursor', 'pointer')
        .text(labelText)
        .on('click', () => {
          if (onSelectChapter) onSelectChapter(node.id);
        });
    });

  }, [report, currentChapterId, onSelectChapter]);

  // -------------------------------------------------------------
  // D3 PROPORTIONAL BOOK TAPE / RIBBON STREAM
  // -------------------------------------------------------------
  useEffect(() => {
    if (!ribbonSvgRef.current) return;
    const svg = d3.select(ribbonSvgRef.current);
    svg.selectAll('*').remove();

    const nodes = report.nodes;
    if (nodes.length === 0) return;

    const containerWidth = ribbonSvgRef.current.parentElement?.clientWidth || 700;
    const width = Math.max(400, containerWidth);
    const height = 24;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.attr('width', '100%');
    svg.attr('height', height);

    const totalWords = report.totalWords || 1;
    let currentX = 0;

    nodes.forEach((node) => {
      const sliceWidth = Math.max(3, (node.wordCount / totalWords) * width);
      const isCurrent = node.isCurrent;
      const color = getNodeColor(node);

      svg
        .append('rect')
        .attr('x', currentX)
        .attr('y', 4)
        .attr('width', sliceWidth)
        .attr('height', 16)
        .attr('fill', color)
        .attr('opacity', isCurrent ? 1.0 : 0.8)
        .attr('stroke', isCurrent ? '#ffffff' : '#1c1917')
        .attr('stroke-width', isCurrent ? 1.5 : 0.6)
        .style('cursor', 'pointer')
        .on('mouseenter', () => setHoveredNode(node))
        .on('mouseleave', () => setHoveredNode(null))
        .on('click', () => {
          if (onSelectChapter) onSelectChapter(node.id);
        });

      // Needle / Pointer on active chapter
      if (isCurrent) {
        svg
          .append('line')
          .attr('x1', currentX + sliceWidth / 2)
          .attr('y1', 0)
          .attr('x2', currentX + sliceWidth / 2)
          .attr('y2', height)
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
      }

      currentX += sliceWidth;
    });

  }, [report, currentChapterId, onSelectChapter]);

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs} hr ${mins > 0 ? `${mins} min` : ''}`;
  };

  return (
    <div
      ref={containerRef}
      className="border-b border-stone-800 bg-stone-950/95 p-4 shrink-0 text-xs text-stone-300 animate-fade-in shadow-2xl select-none"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Map className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-stone-100 text-sm">
                Book Map & Pacing Timeline
              </h4>
              <span className="text-[10px] font-mono text-stone-400">
                {report.totalWords.toLocaleString()} total words · {report.totalChapters} sections · {formatReadingTime(report.totalReadingTimeMinutes)} read
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              D3-powered chapter length distribution, narrative pacing horizon, and manuscript structural proportions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Tab Selector */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-900 border border-stone-800 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('timeline')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                activeTab === 'timeline'
                  ? 'bg-stone-800 text-sky-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Timeline Horizon
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('parts')}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 ${
                activeTab === 'parts'
                  ? 'bg-stone-800 text-amber-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Part Distribution</span>
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 p-1 hover:bg-stone-850 rounded"
              title="Close Book Map"
            >
              &times; Close
            </button>
          )}
        </div>
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: D3 Horizon Timeline & Ribbon */}
        <div className="lg:col-span-8 flex flex-col justify-between p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-2">
          {activeTab === 'timeline' ? (
            <>
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-stone-200">
                    Chapter Length & Pacing Horizon (D3 Spline)
                  </span>
                  <span className="text-[10px] text-stone-500 font-mono">
                    (Click any chapter bar to navigate)
                  </span>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-3 text-[10px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Active
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Body
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-amber-600" /> Part Divider
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-sm bg-violet-500" /> Matter
                  </span>
                </div>
              </div>

              {/* D3 Timeline SVG Container */}
              <div className="w-full bg-stone-950/70 rounded-lg p-2 border border-stone-800/60 overflow-hidden">
                <svg ref={timelineSvgRef} className="w-full h-44" />
              </div>

              {/* Continuous Book Ribbon Stream */}
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[9px] text-stone-500 font-mono uppercase tracking-wider">
                  <span>Start (0%)</span>
                  <span>Manuscript Continuous Word Progression</span>
                  <span>End (100%)</span>
                </div>
                <div className="w-full bg-stone-950 rounded-md p-1 border border-stone-800">
                  <svg ref={ribbonSvgRef} className="w-full h-6" />
                </div>
              </div>
            </>
          ) : (
            /* Part Distribution View */
            <div className="space-y-3 py-1">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold text-stone-200 text-xs">
                    Multi-Part Structural Weight
                  </h5>
                  <p className="text-[10px] text-stone-400">
                    Comparison of volume partitions and word count balance across the novel.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {report.partSummaries.map((p, pIdx) => (
                  <div
                    key={pIdx}
                    className="p-3 rounded-xl bg-stone-950 border border-stone-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-400 font-serif text-sm">
                        {p.title}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400">
                        {p.percentageOfBook}% of manuscript
                      </span>
                    </div>

                    <div className="w-full h-2 rounded-full bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-300"
                        style={{ width: `${p.percentageOfBook}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[10px] text-stone-400">
                      <span>{p.chapterCount} Chapters</span>
                      <span className="font-mono text-stone-300">{p.totalWords.toLocaleString()} words</span>
                      <span>~{formatReadingTime(Math.round(p.totalWords / 200))}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hovered / Active Chapter Node Live Inspector */}
          {hoveredNode || currentNode ? (
            <div className="p-2 rounded bg-stone-900 border border-stone-700/80 text-[10px] flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2 truncate mr-3">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: getNodeColor(hoveredNode || currentNode!) }}
                />
                <span className="font-bold text-stone-100">
                  {(hoveredNode || currentNode!).title}
                </span>
                <span className="text-stone-400 italic">
                  {(hoveredNode || currentNode!).subtitle || (hoveredNode || currentNode!).type}
                </span>
              </div>

              <div className="flex items-center gap-3 shrink-0 font-mono text-[10px]">
                <span className="text-amber-400 font-bold">
                  {(hoveredNode || currentNode!).wordCount.toLocaleString()} words
                </span>
                <span className="text-stone-400">
                  ~{(hoveredNode || currentNode!).readingTimeMinutes} min read
                </span>
                <span className="text-stone-400">
                  {(hoveredNode || currentNode!).percentageOfBook}% of book
                </span>
                <span className="text-sky-400 font-semibold">
                  {(hoveredNode || currentNode!).pacingCategory.toUpperCase()}
                </span>
                {hoveredNode && hoveredNode.id !== currentChapterId && onSelectChapter && (
                  <button
                    onClick={() => onSelectChapter(hoveredNode.id)}
                    className="text-amber-400 hover:underline flex items-center gap-0.5 ml-1"
                  >
                    <span>Jump</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-stone-500 italic text-center py-0.5">
              Hover over any chapter node to inspect relative length, read time, and pacing metrics.
            </div>
          )}
        </div>

        {/* Right Column: Pacing Analytics & Editorial Diagnosis */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
          {/* Pacing Cadence Card */}
          <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                Pacing Cadence Consistency
              </span>
              <span className="text-xs font-mono font-bold text-sky-400">
                {report.pacingConsistencyScore}/100
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-sky-500 rounded-full transition-all duration-300"
                style={{ width: `${report.pacingConsistencyScore}%` }}
              />
            </div>
            <div className="text-[10px] text-stone-400 flex justify-between">
              <span>{report.pacingConsistencyRating}</span>
              <span className="font-mono text-stone-500">Avg {report.meanBodyWordCount.toLocaleString()} w/ch</span>
            </div>
          </div>

          {/* High / Low Chapter Length Extremes */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 space-y-1">
              <div className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold">
                Longest Chapter
              </div>
              <div className="text-xs font-bold text-indigo-300 truncate">
                {report.longestChapter?.title || 'None'}
              </div>
              <div className="text-[10px] font-mono text-stone-400">
                {report.longestChapter?.wordCount.toLocaleString() || 0} words
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 space-y-1">
              <div className="text-[9px] text-stone-500 uppercase tracking-wider font-semibold">
                Shortest Chapter
              </div>
              <div className="text-xs font-bold text-cyan-300 truncate">
                {report.shortestChapter?.title || 'None'}
              </div>
              <div className="text-[10px] font-mono text-stone-400">
                {report.shortestChapter?.wordCount.toLocaleString() || 0} words
              </div>
            </div>
          </div>

          {/* Current Chapter Location Context */}
          {currentNode && (
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] text-stone-300 space-y-1">
              <div className="flex items-center gap-1 font-semibold text-amber-400">
                <Compass className="w-3.5 h-3.5" />
                <span>Current Location in Manuscript</span>
              </div>
              <p className="text-[10px] text-stone-300 leading-relaxed">
                You are currently working in <strong className="text-amber-300">{currentNode.title}</strong>, positioned at ~{currentNode.cumulativePercentage}% of the manuscript timeline ({currentNode.wordCount.toLocaleString()} words).
              </p>
            </div>
          )}

          {/* Editorial Pacing Advice */}
          <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800 space-y-1.5 flex-1">
            <div className="flex items-center gap-1 font-semibold text-emerald-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editorial Pacing Diagnosis</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[10px] text-stone-300 leading-relaxed">
              {report.pacingRecommendations.map((rec, rIdx) => (
                <li key={rIdx}>{rec}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
