import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

// Example data structure:
// {
//   name: 'Root',
//   purpose: 'Root purpose',
//   children: [
//     { name: 'Sub1', purpose: '...', children: [...] },
//     ...
//   ]
// }

const COLORS = [
  '#4ecdc4', '#232946', '#f4d35e', '#ee6c4d', '#3a86ff', '#8338ec', '#ffbe0b', '#ff006e', '#fb5607', '#00b4d8'
];

function CirclePacking({ data, width = 600, height = 600 }) {
  const svgRef = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data) return;
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Create hierarchy and pack layout
    const root = d3.hierarchy(data).sum(() => 1).sort((a, b) => b.value - a.value);
    const padding = 40;
    const layoutSize = Math.min(width, height) - 2 * padding;
    const pack = d3.pack().size([layoutSize, layoutSize]).padding(8);
    pack(root);

    // Debug: log root position and SVG size
    console.log('root.x:', root.x, 'root.y:', root.y, 'root.r:', root.r, 'width:', width, 'height:', height);

    // Tooltip
    const tooltip = d3.select(tooltipRef.current);

    // Center the root circle in the middle of the SVG
    const centerX = width / 2;
    const centerY = height / 2;
    const layoutCenter = layoutSize / 2 + padding;
    const xOffset = centerX - layoutCenter;
    const yOffset = centerY - layoutCenter;
    const node = svg
      .selectAll('g')
      .data(root.descendants())
      .join('g')
      .attr('transform', d => `translate(${d.x + xOffset},${d.y + yOffset})`);

    node
      .append('circle')
      .attr('r', d => d.r)
      .attr('fill', d => COLORS[d.depth % COLORS.length])
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .on('mouseover', function (event, d) {
        const creator = d.data.creator ? `<br/><span style='font-size:12px;color:#4ecdc4;'>Creator: ${d.data.creator.slice(0, 6)}...${d.data.creator.slice(-4)}</span>` : '';
        const containerRect = svgRef.current.parentElement.getBoundingClientRect();
        const left = event.clientX - containerRect.left + 12;
        const top = event.clientY - containerRect.top - 24;
        tooltip.style('display', 'block')
          .style('left', `${left}px`)
          .style('top', `${top}px`)
          .html(`<strong>${d.data.name}</strong><br/><span style='font-size:13px;'>${d.data.purpose || ''}</span>${creator}`);
        d3.select(this).attr('stroke', '#ffbe0b').attr('stroke-width', 4);
      })
      .on('mousemove', function (event) {
        const containerRect = svgRef.current.parentElement.getBoundingClientRect();
        const left = event.clientX - containerRect.left + 12;
        const top = event.clientY - containerRect.top - 24;
        tooltip.style('left', `${left}px`).style('top', `${top}px`);
      })
      .on('mouseout', function () {
        tooltip.style('display', 'none');
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 2);
      });

    // Draw labels (only for top-level and root)
    node
      .filter(d => d.depth === 0 || d.depth === 1)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#fff')
      .attr('font-size', d => d.depth === 0 ? 22 : 16)
      .attr('font-weight', 600)
      .text(d => d.data.name);
  }, [data, width, height]);

  return (
    <div style={{
      position: 'relative',
      width,
      height,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      margin: '0 auto',
    }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{
          display: 'block',
          margin: '0 auto',
        }}
      />
      <div ref={tooltipRef} style={{
        position: 'absolute',
        display: 'none',
        pointerEvents: 'none',
        background: '#232946',
        color: '#f5f6fa',
        border: '1px solid #4ecdc4',
        borderRadius: 8,
        padding: '10px 18px',
        fontSize: 15,
        fontWeight: 500,
        zIndex: 10,
        boxShadow: '0 4px 16px rgba(44,62,80,0.18)'
      }} />
    </div>
  );
}

export default CirclePacking; 