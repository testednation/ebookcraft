import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  WordRepetitionItem,
  ParagraphMeta,
  RepetitiveWordReport,
} from '../services/repetitiveWordDetector';
import {
  Flame,
  Filter,
  Sparkles,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
  BookOpen,
  Info,
  CheckCircle,
  Hash,
} from 'lucide-react';

interface WordRepetitionHeatmapProps {
  report: RepetitiveWordReport;
  onClose?: () => void;
  onSelectWord?: (word: string) => void;
}

type FilterCategory = 'all' | 'crutch' | 'action-verb' | 'adverb' | 'high-severity';

export const WordRepetitionHeatmap: React.FC<WordRepetitionHeatmapProps> = ({
  report,
  onClose,
  onSelectWord,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [filterCategory, setFilterCategory] = useState<FilterCategory>('all');
  const [selectedWord, setSelectedWord] = useState<WordRepetitionItem | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    word: string;
    paragraphIndex: number;
    count: number;
    snippet: string;
  } | null>(null);

  // Filter words based on selected tab
  const filteredWords = useMemo(() => {
    let list = report.allDetectedWords;
    if (filterCategory === 'crutch') {
      list = list.filter((w) => w.category === 'crutch');
    } else if (filterCategory === 'action-verb') {
      list = list.filter((w) => w.category === 'action-verb');
    } else if (filterCategory === 'adverb') {
      list = list.filter((w) => w.category === 'adverb');
    } else if (filterCategory === 'high-severity') {
      list = list.filter((w) => w.severity === 'high');
    }
    // Limit to top 14 rows for clean readability in the heatmap
    return list.slice(0, 14);
  }, [report.allDetectedWords, filterCategory]);

  // Set default selected word if none is selected
  useEffect(() => {
    if (filteredWords.length > 0 && (!selectedWord || !filteredWords.some((w) => w.word === selectedWord.word))) {
      setSelectedWord(filteredWords[0]);
    } else if (filteredWords.length === 0) {
      setSelectedWord(null);
    }
  }, [filteredWords]);

  // -------------------------------------------------------------
  // D3 HEATMAP RENDERING
  // -------------------------------------------------------------
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (filteredWords.length === 0 || report.paragraphs.length === 0) {
      return;
    }

    const numRows = filteredWords.length;
    const numCols = Math.min(24, report.paragraphs.length); // limit columns if chapter is huge

    const rowLabelWidth = 95;
    const colHeaderHeight = 24;
    const cellMargin = 2.5;

    // Responsive width calculation
    const containerWidth = containerRef.current?.clientWidth || 600;
    const availableWidth = Math.max(340, containerWidth - 30);
    const cellSizeX = Math.max(16, Math.min(32, Math.floor((availableWidth - rowLabelWidth) / numCols)));
    const cellSizeY = 22;

    const width = rowLabelWidth + numCols * cellSizeX + 20;
    const height = colHeaderHeight + numRows * cellSizeY + 20;

    svg.attr('viewBox', `0 0 ${width} ${height}`);
    svg.attr('width', '100%');
    svg.attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${rowLabelWidth}, ${colHeaderHeight})`);

    // Column Headers (Paragraph numbers)
    const colG = svg.append('g').attr('transform', `translate(${rowLabelWidth}, 16)`);
    for (let c = 0; c < numCols; c++) {
      colG
        .append('text')
        .attr('x', c * cellSizeX + cellSizeX / 2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('fill', '#78716c')
        .text(`P${c + 1}`);
    }

    // Row Labels (Word names)
    const rowG = svg.append('g').attr('transform', `translate(10, ${colHeaderHeight})`);
    filteredWords.forEach((item, rIdx) => {
      const rowY = rIdx * cellSizeY + cellSizeY / 2 + 4;
      const isSelected = selectedWord?.word === item.word;

      const label = rowG
        .append('text')
        .attr('x', rowLabelWidth - 16)
        .attr('y', rowY)
        .attr('text-anchor', 'end')
        .attr('font-size', '11px')
        .attr('font-family', 'serif')
        .attr('font-weight', isSelected ? 'bold' : 'normal')
        .attr('fill', isSelected ? '#fbbf24' : item.severity === 'high' ? '#f87171' : '#d6d3d1')
        .style('cursor', 'pointer')
        .text(item.word);

      // Total count indicator next to word
      rowG
        .append('text')
        .attr('x', rowLabelWidth - 6)
        .attr('y', rowY)
        .attr('text-anchor', 'end')
        .attr('font-size', '8px')
        .attr('font-family', 'monospace')
        .attr('fill', '#78716c')
        .text(`${item.totalCount}`);

      label.on('click', () => {
        setSelectedWord(item);
        if (onSelectWord) onSelectWord(item.word);
      });
    });

    // Heatmap Color Scale
    // 0: very dark stone, 1: warm rust/amber, 2: vibrant amber, >=3: bright crimson
    const getCellColor = (count: number) => {
      if (count === 0) return '#1c1917';
      if (count === 1) return '#78350f'; // warm amber
      if (count === 2) return '#d97706'; // vibrant amber flare
      return '#ef4444'; // crimson high alert hotspot
    };

    // Render Heatmap Cells
    filteredWords.forEach((wordItem, rIdx) => {
      for (let c = 0; c < numCols; c++) {
        const count = wordItem.paragraphCounts[c] || 0;
        const x = c * cellSizeX + cellMargin;
        const y = rIdx * cellSizeY + cellMargin;
        const cellW = cellSizeX - cellMargin * 2;
        const cellH = cellSizeY - cellMargin * 2;
        const pMeta = report.paragraphs[c];

        const rect = g
          .append('rect')
          .attr('x', x)
          .attr('y', y)
          .attr('width', cellW)
          .attr('height', cellH)
          .attr('rx', 2.5)
          .attr('fill', getCellColor(count))
          .attr('stroke', count > 0 ? (count >= 3 ? '#b91c1c' : '#92400e') : '#292524')
          .attr('stroke-width', count > 0 ? 1 : 0.6)
          .style('cursor', 'pointer');

        // Optional numeric count inside cell if cell is wide enough and count > 0
        if (cellSizeX >= 22 && count > 0) {
          g.append('text')
            .attr('x', x + cellW / 2)
            .attr('y', y + cellH / 2 + 3.5)
            .attr('text-anchor', 'middle')
            .attr('font-size', '9px')
            .attr('font-family', 'monospace')
            .attr('font-weight', 'bold')
            .attr('fill', count >= 2 ? '#ffffff' : '#fef3c7')
            .attr('pointer-events', 'none')
            .text(`${count}`);
        }

        // Cell hover and click interactions
        rect
          .on('mouseenter', (event: MouseEvent) => {
            d3.select(event.currentTarget as SVGRectElement)
              .attr('stroke', '#fbbf24')
              .attr('stroke-width', 1.8);

            setHoveredCell({
              word: wordItem.word,
              paragraphIndex: c + 1,
              count,
              snippet: pMeta?.previewSnippet || 'Paragraph snippet',
            });
          })
          .on('mouseleave', (event: MouseEvent) => {
            d3.select(event.currentTarget as SVGRectElement)
              .attr('stroke', count > 0 ? (count >= 3 ? '#b91c1c' : '#92400e') : '#292524')
              .attr('stroke-width', count > 0 ? 1 : 0.6);
            setHoveredCell(null);
          })
          .on('click', () => {
            setSelectedWord(wordItem);
            if (onSelectWord) onSelectWord(wordItem.word);
          });
      }
    });

  }, [filteredWords, selectedWord, report.paragraphs]);

  return (
    <div
      ref={containerRef}
      className="border-b border-stone-800 bg-stone-950/95 p-4 shrink-0 text-xs text-stone-300 animate-fade-in shadow-xl select-none"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-3 border-b border-stone-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-stone-100 text-sm">
                Word Repetition Heatmap & Vocabulary Refinement
              </h4>
              <span className="text-[10px] font-mono text-stone-400">
                {report.totalWords.toLocaleString()} words · {report.uniqueWords.toLocaleString()} unique
              </span>
            </div>
            <p className="text-[10px] text-stone-400">
              D3-powered paragraph density grid identifying repetitive echoes, filter words, and crutch habits.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 p-0.5 bg-stone-900 border border-stone-800 rounded-lg">
            <button
              type="button"
              onClick={() => setFilterCategory('all')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filterCategory === 'all'
                  ? 'bg-stone-800 text-amber-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All ({report.allDetectedWords.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('crutch')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filterCategory === 'crutch'
                  ? 'bg-stone-800 text-rose-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Crutch Words
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('action-verb')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filterCategory === 'action-verb'
                  ? 'bg-stone-800 text-indigo-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              Sensory Verbs
            </button>
            <button
              type="button"
              onClick={() => setFilterCategory('adverb')}
              className={`px-2 py-1 text-[11px] font-medium rounded-md transition-colors ${
                filterCategory === 'adverb'
                  ? 'bg-stone-800 text-sky-300 shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              -ly Adverbs
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-stone-400 hover:text-stone-200 p-1 hover:bg-stone-850 rounded"
              title="Close Heatmap Panel"
            >
              &times; Close
            </button>
          )}
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: D3 Heatmap Canvas */}
        <div className="lg:col-span-8 flex flex-col justify-between p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-stone-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Paragraph Occurrence Heatmap</span>
            </div>

            {/* Heatmap Legend */}
            <div className="flex items-center gap-2 text-[10px] text-stone-400 font-mono">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#1c1917] border border-stone-800" /> 0
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#78350f] border border-amber-900" /> 1
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#d97706]" /> 2
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-[#ef4444]" /> 3+ (Cluster)
              </span>
            </div>
          </div>

          {/* D3 Heatmap SVG Container */}
          <div className="w-full overflow-x-auto bg-stone-950/70 rounded-lg p-2 border border-stone-800/60 no-scrollbar">
            {filteredWords.length === 0 ? (
              <div className="py-8 text-center text-stone-500 text-xs">
                No repetitive words detected under this filter category.
              </div>
            ) : (
              <svg ref={svgRef} className="block mx-auto min-w-[320px]" />
            )}
          </div>

          {/* Hovered Cell Live Inspector */}
          {hoveredCell ? (
            <div className="p-2 rounded bg-stone-900 border border-amber-500/30 text-[10px] flex items-center justify-between animate-fade-in">
              <div className="flex-1 mr-3 truncate">
                <span className="font-bold text-amber-300 mr-2">
                  "{hoveredCell.word}" in Paragraph {hoveredCell.paragraphIndex}:
                </span>
                <span className="text-stone-300 italic">"{hoveredCell.snippet}"</span>
              </div>
              <div className="shrink-0 font-mono text-[10px]">
                <span
                  className="font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: hoveredCell.count >= 2 ? '#ef444422' : '#d9770622',
                    color: hoveredCell.count >= 2 ? '#f87171' : '#fbbf24',
                  }}
                >
                  {hoveredCell.count === 0 ? 'Not present' : `${hoveredCell.count}x in scene`}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-[10px] text-stone-500 italic text-center py-0.5">
              Hover over any heatmap block to see paragraph preview and local repetition count. Click word to view synonyms.
            </div>
          )}
        </div>

        {/* Right Column: Selected Word Vocabulary Assistant & Synonyms */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-3">
          {/* Lexical Diversity Card */}
          <div className="p-3 rounded-xl bg-stone-900/70 border border-stone-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                Lexical Diversity (TTR)
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {(report.lexicalDiversityTTR * 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-stone-800 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, report.lexicalDiversityTTR * 150)}%` }}
              />
            </div>
            <div className="text-[10px] text-stone-400 flex justify-between">
              <span>{report.lexicalDiversityRating}</span>
              <span className="font-mono text-stone-500">{report.paragraphs.length} Paragraphs</span>
            </div>
          </div>

          {/* Selected Word Assistant */}
          {selectedWord ? (
            <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800/80 space-y-2.5 flex-1">
              <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                <div>
                  <span className="text-base font-serif font-bold text-amber-300">
                    "{selectedWord.word}"
                  </span>
                  <span className="text-[10px] font-mono text-stone-400 ml-2">
                    {selectedWord.totalCount}x in chapter ({selectedWord.frequencyPercent}%)
                  </span>
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    selectedWord.severity === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {selectedWord.severity} Alert
                </span>
              </div>

              {/* Craft Tip */}
              {selectedWord.craftTip && (
                <div className="p-2 rounded-lg bg-stone-950/80 border border-stone-800/80 text-[10px] text-stone-300 space-y-1">
                  <div className="flex items-center gap-1 font-semibold text-sky-400">
                    <Lightbulb className="w-3 h-3" />
                    <span>Editorial Craft Suggestion:</span>
                  </div>
                  <p className="leading-relaxed">{selectedWord.craftTip}</p>
                </div>
              )}

              {/* Curated Synonyms */}
              {selectedWord.synonyms.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">
                    Recommended Alternatives:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedWord.synonyms.map((syn, sIdx) => (
                      <span
                        key={sIdx}
                        className="px-2 py-0.5 rounded-md bg-stone-950 border border-stone-800 text-stone-200 text-[11px] font-medium"
                      >
                        {syn}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Local Cluster Warning */}
              {selectedWord.maxSingleParagraphCount >= 2 && (
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Auditory echo alert: "{selectedWord.word}" occurs {selectedWord.maxSingleParagraphCount} times in Paragraph {selectedWord.peakParagraphIndex + 1}. Consider varying phrasing within this scene.
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-stone-900/60 border border-stone-800 text-center text-stone-500 text-xs">
              Select any word from the heatmap grid to view craft suggestions and synonym substitutions.
            </div>
          )}

          {/* Highest Local Echo Notice */}
          {report.highestLocalEcho && (
            <div className="p-2.5 rounded-lg bg-stone-900/60 border border-stone-800 text-[10px] text-stone-400">
              <span className="font-bold text-rose-400">Dense Cluster: </span>
              <span>
                "{report.highestLocalEcho.word}" repeated {report.highestLocalEcho.count}x in Paragraph {report.highestLocalEcho.paragraphIndex}.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
