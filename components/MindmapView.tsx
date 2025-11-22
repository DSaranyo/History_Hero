
import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { MindmapNode } from '../types';
import * as geminiService from '../services/geminiService';
import { LoadingSpinner } from './common/LoadingSpinner';
import { GenerateButton } from './common/GenerateButton';
import { ErrorMessage } from './common/ErrorMessage';

interface MindmapViewProps {
  text: string;
  data: MindmapNode | null;
  setData: (data: MindmapNode | null) => void;
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const MindmapView: React.FC<MindmapViewProps> = ({ text, data, setData, isLoading, setLoading }) => {
  const [error, setError] = React.useState<string | null>(null);
  const d3Container = useRef<SVGSVGElement | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!text) return;
    setLoading(true);
    setError(null);
    const result = await geminiService.generateMindmap(text);
    if (result) {
      setData(result);
    } else {
      setError("Failed to generate mindmap. Please try again.");
    }
    setLoading(false);
  }, [text, setLoading, setData]);

  useEffect(() => {
    if (text && !data && !isLoading) {
      handleGenerate();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (data && d3Container.current) {
      const svg = d3.select(d3Container.current);
      svg.selectAll("*").remove(); // Clear previous render

      const width = d3Container.current.parentElement?.clientWidth || 800;
      const height = 600;

      svg.attr("width", width).attr("height", height)
         .attr("viewBox", [-width / 2, -height / 2, width, height]);

      const root = d3.hierarchy(data);
      const treeLayout = d3.tree().size([2 * Math.PI, Math.min(width, height) / 2 - 60]);
      treeLayout(root);

      const g = svg.append("g");
      
      const linkGenerator = d3.linkRadial()
        .angle((d: any) => d.x)
        .radius((d: any) => d.y);

      g.selectAll("path")
        .data(root.links())
        .enter()
        .append("path")
        .attr("d", linkGenerator as any)
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);
      
      const node = g.selectAll("g.node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d: any) => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

      node.append("circle")
        .attr("r", 5)
        .attr("fill", (d) => d.children ? "#555" : "#999");
      
      node.append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => d.x < Math.PI ? 8 : -8)
        .attr("text-anchor", (d) => d.x < Math.PI ? "start" : "end")
        .attr("transform", (d) => d.x >= Math.PI ? "rotate(180)" : null)
        .text((d: any) => d.data.name)
        .clone(true).lower()
        .attr("stroke", "white");
      
      const zoom = d3.zoom<SVGSVGElement, unknown>().on('zoom', (event) => {
        g.attr('transform', event.transform.toString());
      });

      svg.call(zoom);
    }
  }, [data]);

  if (isLoading) return <LoadingSpinner message="Visualizing your mindmap..." />;
  if (error) return <ErrorMessage message={error}/>;

  if (!data) {
    return <GenerateButton onClick={handleGenerate} disabled={!text || isLoading} text="Generate Mindmap" />;
  }

  return (
    <div className="animate-fade-in">
        <h2 className="text-xl font-bold text-center mb-4">Topic Mindmap</h2>
        <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800/50">
            <svg ref={d3Container} />
        </div>
        <p className="text-center text-sm text-gray-500 mt-2">Use your mouse wheel or trackpad to zoom and pan.</p>
    </div>
  );
};
