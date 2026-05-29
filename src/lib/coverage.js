export const COVERAGE_VALUES = ['hmo', 'philhealth', 'none']

export const COVERAGE_OPTIONS = [
  { value: 'none', label: 'None', displayLabel: 'No Coverage' },
  { value: 'hmo', label: 'HMO', displayLabel: 'HMO' },
  { value: 'philhealth', label: 'PhilHealth', displayLabel: 'PhilHealth' },
]

export function normalizeCoverage(value) {
  const normalized = String(value || 'none').trim().toLowerCase().replace(/\s+/g, '')
  if (normalized === 'hmo') return 'hmo'
  if (normalized === 'philhealth') return 'philhealth'
  return 'none'
}

export function getCoverageLabel(value) {
  const normalized = normalizeCoverage(value)
  if (normalized === 'hmo') return 'HMO'
  if (normalized === 'philhealth') return 'PhilHealth'
  return 'No Coverage'
}

export function getCoverageClass(value) {
  const normalized = normalizeCoverage(value)
  if (normalized === 'hmo') return 'badge-info'
  if (normalized === 'philhealth') return 'badge-success'
  return 'badge-gray'
}

export function getCoverageSortRank(value) {
  const normalized = normalizeCoverage(value)
  if (normalized === 'hmo') return 0
  if (normalized === 'philhealth') return 1
  return 2
}
