import { CheckCircle2, Clock3, Database, RadioTower } from 'lucide-react'

export default function DataSourceStatus({ sources }) {
  return (
    <section className="panel source-panel" id="system-status">
      <div className="panel-heading"><div><span className="section-eyebrow"><Database size={14} /> INTEGRATION READINESS</span><h2>Data Sources & Signal Status</h2></div></div>
      <div className="source-grid">
        {sources.map((source) => (
          <div className="source-item" key={source.source}>
            <span className={`source-icon source-icon--${source.type}`}>{source.type === 'available' ? <CheckCircle2 size={18} /> : source.type === 'demo' ? <RadioTower size={18} /> : <Clock3 size={18} />}</span>
            <span>{source.source}<strong>{source.status}</strong></span>
          </div>
        ))}
      </div>
    </section>
  )
}
