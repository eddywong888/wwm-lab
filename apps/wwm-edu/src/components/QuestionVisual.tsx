import type { Lang, QuestionVisual as Visual } from '../engine/types';
import { t } from '../engine/i18n';

interface Props { visual: Visual; lang: Lang }

export default function QuestionVisual({ visual, lang }: Props) {
  const label = t(visual.label, lang);
  if (visual.type === 'bar-chart') {
    const max = Math.max(...visual.values);
    return (
      <svg className="question-visual" viewBox="0 0 420 230" role="img" aria-label={label}>
        <title>{label}</title>
        <line x1="55" y1="15" x2="55" y2="190" /><line x1="55" y1="190" x2="405" y2="190" />
        {visual.values.map((value, index) => {
          const height = value / max * 140;
          const x = 80 + index * 105;
          return <g key={visual.categories[index]}><rect x={x} y={190 - height} width="56" height={height} /><text x={x + 28} y={181 - height} textAnchor="middle">{value}</text><text x={x + 28} y="214" textAnchor="middle">{visual.categories[index]}</text></g>;
        })}
        <text x="12" y="18">{t(visual.unit, lang)}</text>
      </svg>
    );
  }
  if (visual.type === 'clock') {
    const minuteAngle = visual.minute * 6;
    const hourAngle = (visual.hour % 12) * 30 + visual.minute / 2;
    const hand = (angle: number, length: number) => ({ x: 110 + Math.sin(angle * Math.PI / 180) * length, y: 110 - Math.cos(angle * Math.PI / 180) * length });
    const minute = hand(minuteAngle, 70); const hour = hand(hourAngle, 48);
    return <svg className="question-visual question-visual--compact" viewBox="0 0 220 220" role="img" aria-label={label}><title>{label}</title><circle cx="110" cy="110" r="94" />{[12, 3, 6, 9].map((n, i) => <text key={n} x={[110, 190, 110, 30][i]} y={[31, 116, 202, 116][i]} textAnchor="middle">{n}</text>)}<line className="question-visual__hour" x1="110" y1="110" x2={hour.x} y2={hour.y} /><line className="question-visual__minute" x1="110" y1="110" x2={minute.x} y2={minute.y} /><circle cx="110" cy="110" r="5" /></svg>;
  }
  if (visual.type === 'angle') {
    const radians = visual.degrees * Math.PI / 180;
    const end = { x: 65 + Math.cos(radians) * 115, y: 170 - Math.sin(radians) * 115 };
    return <svg className="question-visual question-visual--compact" viewBox="0 0 230 205" role="img" aria-label={label}><title>{label}</title><line x1="65" y1="170" x2="200" y2="170" /><line x1="65" y1="170" x2={end.x} y2={end.y} /><path d={`M 100 170 A 35 35 0 0 0 ${65 + Math.cos(radians) * 35} ${170 - Math.sin(radians) * 35}`} /><text x="108" y="148">{visual.degrees}°</text></svg>;
  }
  const ticks = Array.from({ length: visual.rulerCm * 10 + 1 }, (_, i) => i);
  return <svg className="question-visual" viewBox={`0 0 ${visual.rulerCm * 40 + 50} 155`} role="img" aria-label={label}><title>{label}</title><line className="question-visual__object" x1={20 + visual.startCm * 40} y1="18" x2={20 + visual.endCm * 40} y2="18" /><circle className="question-visual__object" cx={20 + visual.startCm * 40} cy="18" r="5" /><path className="question-visual__object" d={`M ${20 + visual.endCm * 40} 18 l -13 -7 l 0 14 z`} /><rect x="20" y="38" width={visual.rulerCm * 40} height="78" />{ticks.map((i) => <line key={i} x1={20 + i * 4} y1="38" x2={20 + i * 4} y2={i % 10 === 0 ? 77 : i % 5 === 0 ? 66 : 58} />)}{Array.from({ length: visual.rulerCm + 1 }, (_, i) => <text key={i} x={20 + i * 40} y="100" textAnchor="middle">{i}</text>)}<text x={20 + visual.rulerCm * 20} y="138" textAnchor="middle">cm</text></svg>;
}
