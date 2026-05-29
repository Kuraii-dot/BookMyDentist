import { getCoverageClass, getCoverageLabel } from '../lib/coverage'

export default function CoverageBadge({ value, className = '' }) {
  return (
    <span className={`badge ${getCoverageClass(value)} ${className}`.trim()}>
      {getCoverageLabel(value)}
    </span>
  )
}
