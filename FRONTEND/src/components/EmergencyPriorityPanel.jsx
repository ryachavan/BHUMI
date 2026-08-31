import { ArrowRight, ShieldAlert } from 'lucide-react'
import SeverityBadge from './SeverityBadge'

export default function EmergencyPriorityPanel({ priorities }) {
  return (
    <section className="panel priority-panel">
      <div className="panel-heading"><div><span className="section-eyebrow"><ShieldAlert size={14} /> ACTION QUEUE</span><h2>Emergency Response Priority</h2><p>Decision-support recommendations for administrator review</p></div></div>
      <div className="priority-list">
        {priorities.map((item) => (
          <article className="priority-item" key={item.priority}>
            <div className="priority-rank"><span>PRIORITY</span><strong>{item.priority}</strong></div>
            <div className="priority-content">
              <div className="priority-title"><SeverityBadge level={item.risk_level} subtle /><strong>{item.location}</strong></div>
              <div className="priority-exposure">Potential exposure: <strong>{item.exposure}</strong></div>
              <p>{item.reason}</p>
              <div className="recommended-action"><ArrowRight size={15} /><span><small>RECOMMENDED ACTION</small>{item.recommended_action}</span></div>
            </div>
          </article>
        ))}
      </div>
      <p className="panel-note">Recommendations support human decision-making and are not automatic government orders.</p>
    </section>
  )
}
