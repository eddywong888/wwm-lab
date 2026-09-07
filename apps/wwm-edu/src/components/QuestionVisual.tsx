import type { Lang, QuestionVisual as Visual } from '../engine/types';
import { t } from '../engine/i18n';
import { angleGeometry, barGeometry, clockGeometry, rulerGeometry } from './visual-geometry';

interface Props { visual: Visual; lang: Lang }

export default function QuestionVisual({ visual, lang }: Props) {
  const label = t(visual.label, lang);
  if (visual.type === 'bar-chart') {
    const { width, height, bars } = barGeometry(visual.values);
    return (
      <svg className="question-visual" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}>
        <title>{label}</title>
        <line x1="55" y1="15" x2="55" y2="190" /><line x1="55" y1="190" x2="405" y2="190" />
        {bars.map((bar, index) => (
          <g key={visual.categories[index]}>
            <rect x={bar.x} y={bar.y} width={bar.width} height={bar.height} />
            <text x={bar.labelX} y={bar.valueY} textAnchor="middle">{visual.values[index]}</text>
            <text x={bar.labelX} y="214" textAnchor="middle">{visual.categories[index]}</text>
          </g>
        ))}
        <text x="12" y="18">{t(visual.unit, lang)}</text>
      </svg>
    );
  }
  if (visual.type === 'clock') {
    const { width, height, centre, hourHand, minuteHand } = clockGeometry(visual.hour, visual.minute);
    return <svg className="question-visual question-visual--compact" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}><title>{label}</title><circle cx={centre.x} cy={centre.y} r="94" />{[12, 3, 6, 9].map((n, i) => <text key={n} x={[110, 190, 110, 30][i]} y={[31, 116, 202, 116][i]} textAnchor="middle">{n}</text>)}<line className="question-visual__hour" x1={centre.x} y1={centre.y} x2={hourHand.x} y2={hourHand.y} /><line className="question-visual__minute" x1={centre.x} y1={centre.y} x2={minuteHand.x} y2={minuteHand.y} /><circle cx={centre.x} cy={centre.y} r="5" /></svg>;
  }
  if (visual.type === 'angle') {
    const { width, height, vertex, armEnd, ray, arcStart, arcEnd, label: labelPoint } = angleGeometry(visual.degrees);
    return <svg className="question-visual question-visual--compact" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}><title>{label}</title><line x1={vertex.x} y1={vertex.y} x2={armEnd.x} y2={armEnd.y} /><line x1={vertex.x} y1={vertex.y} x2={ray.x} y2={ray.y} /><path d={`M ${arcStart.x} ${arcStart.y} A 35 35 0 0 0 ${arcEnd.x} ${arcEnd.y}`} /><text x={labelPoint.x} y={labelPoint.y} textAnchor="middle">{visual.degrees}°</text></svg>;
  }
  const { width, height, objectStart, objectEnd, rulerWidth, ticks, marks } = rulerGeometry(visual.rulerCm, visual.startCm, visual.endCm);
  return <svg className="question-visual" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={label}><title>{label}</title><line className="question-visual__object" x1={objectStart} y1="18" x2={objectEnd} y2="18" /><circle className="question-visual__object" cx={objectStart} cy="18" r="5" /><path className="question-visual__object" d={`M ${objectEnd} 18 l -13 -7 l 0 14 z`} /><rect x="20" y="38" width={rulerWidth} height="78" />{ticks.map((x, i) => <line key={x} x1={x} y1="38" x2={x} y2={i % 10 === 0 ? 77 : i % 5 === 0 ? 66 : 58} />)}{marks.map((x, i) => <text key={x} x={x} y="100" textAnchor="middle">{i}</text>)}<text x={20 + rulerWidth / 2} y="138" textAnchor="middle">cm</text></svg>;
}
