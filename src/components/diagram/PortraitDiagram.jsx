const WALLS = [
  { id: 'purpose', title: 'Purpose', line: "What's yours to solve?", x: 16, y: 16 },
  { id: 'people', title: 'People', line: "Who's this for, specifically?", x: 336, y: 16 },
  { id: 'principle', title: 'Principle', line: "What won't you betray?", x: 16, y: 132 },
  { id: 'tenyear', title: 'Ten-year test', line: 'Worth it if uncertain?', x: 336, y: 132 },
]

function Arrow({ x1, y1, x2, y2 }) {
  return <line x1={x1} y1={y1} x2={x2} y2={y2} className="portraitArrow" markerEnd="url(#portrait-arrow)" />
}

export default function PortraitDiagram() {
  return (
    <figure className="portraitDiagram">
      <svg viewBox="0 0 640 308" role="img" aria-label="The builder's portrait. Four walls stand on the foundation.">
        <defs>
          <marker id="portrait-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 1.2 L 9 5 L 0 8.8 z" className="portraitArrowHead" />
          </marker>
        </defs>
        <Arrow x1={308} y1={58} x2={332} y2={58} />
        <Arrow x1={478} y1={100} x2={478} y2={128} />
        <Arrow x1={332} y1={174} x2={308} y2={174} />
        <Arrow x1={158} y1={128} x2={158} y2={100} />
        <Arrow x1={320} y1={220} x2={320} y2={236} />
        {WALLS.map((wall) => (
          <g key={wall.id}>
            <rect className="portraitWall" x={wall.x} y={wall.y} width="288" height="84" rx="8" />
            <text className="portraitTitle" x={wall.x + 144} y={wall.y + 36} textAnchor="middle">{wall.title}</text>
            <text className="portraitLine" x={wall.x + 144} y={wall.y + 58} textAnchor="middle">{wall.line}</text>
          </g>
        ))}
        <rect className="portraitFoundation" x="96" y="240" width="448" height="56" rx="8" />
        <text className="portraitFoundationTitle" x="320" y="262" textAnchor="middle">The builder's portrait</text>
        <text className="portraitFoundationLine" x="320" y="282" textAnchor="middle">The foundation everything else rests on</text>
      </svg>
    </figure>
  )
}
