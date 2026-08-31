import { AlertTriangle, CloudRain, Home, Route, ShieldAlert } from 'lucide-react'

const cardConfig = [
  { key: 'severe_risk_cells', label: 'Severe risk cells', icon: ShieldAlert, tone: 'severe' },
  { key: 'high_risk_cells', label: 'High risk cells', icon: AlertTriangle, tone: 'high' },
  { key: 'roads_at_risk', label: 'Roads at risk', icon: Route, tone: 'roads' },
  { key: 'settlements_at_risk', label: 'Settlements at risk', icon: Home, tone: 'settlements' },
  { key: 'weather_trigger', label: 'Current weather trigger', icon: CloudRain, tone: 'weather' },
]

export default function SummaryCards({ summary }) {
  return (
    <section className="summary-grid" aria-label="Current operational summary">
      {cardConfig.map(({ key, label, icon: Icon, tone }) => (
        <article className={`summary-card summary-card--${tone}`} key={key}>
          <div className="summary-card__icon"><Icon size={20} /></div>
          <div>
            <p>{label}</p>
            <strong className={key === 'weather_trigger' ? 'is-text' : ''}>{summary[key]}</strong>
            <span>OPERATIONAL ML</span>
          </div>
        </article>
      ))}
    </section>
  )
}
