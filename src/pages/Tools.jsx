import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2,
  Calculator,
  CheckCircle2,
  ClipboardList,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Stethoscope,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import CoverageBadge from '../components/CoverageBadge'
import { EmptyState, SkeletonCard } from '../components/ui/shared'
import { COVERAGE_OPTIONS, getCoverageSortRank, normalizeCoverage } from '../lib/coverage'
import { supabase } from '../lib/supabase'

const PUBLIC_SERVICE_SELECT =
  'id,name,description,price,covered,clinic_id,clinics!inner(id,name,city,is_active,verification_status)'

const COVERAGE_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'hmo', label: 'HMO' },
  { value: 'philhealth', label: 'PhilHealth' },
  { value: 'none', label: 'None' },
]

function formatPrice(price) {
  const value = Number.parseFloat(price)
  if (!Number.isFinite(value)) return 'Price not set'
  return `₱${value.toLocaleString()}`
}

function getNumericPrice(price) {
  const value = Number.parseFloat(price)
  return Number.isFinite(value) ? value : Number.MAX_SAFE_INTEGER
}

function normalizeServiceRow(row) {
  const clinic = Array.isArray(row.clinics) ? row.clinics[0] : row.clinics
  return {
    id: row.id,
    clinicId: row.clinic_id || clinic?.id,
    clinicName: clinic?.name || 'Unnamed clinic',
    city: clinic?.city || 'Location not set',
    serviceName: row.name || 'Unnamed service',
    description: row.description || '',
    price: row.price,
    covered: normalizeCoverage(row.covered),
  }
}

function sortByPriceThenClinic(a, b) {
  const priceDiff = getNumericPrice(a.price) - getNumericPrice(b.price)
  if (priceDiff !== 0) return priceDiff
  return a.clinicName.localeCompare(b.clinicName)
}

function ToolShell({ icon: Icon, title, description, children }) {
  return (
    <section className="card overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100 bg-white">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <h2 className="font-display font-bold text-slate-900 text-xl">{title}</h2>
            <p className="text-slate-500 text-sm leading-relaxed mt-1">{description}</p>
          </div>
        </div>
      </div>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  )
}

function ResultCard({ row, showCoverage = true }) {
  return (
    <Link
      to={`/clinic/${row.clinicId}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold text-slate-900 text-base leading-tight">{row.clinicName}</p>
          <p className="text-slate-500 text-xs mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-sky-400 shrink-0" />
            {row.city}
          </p>
        </div>
        {showCoverage && <CoverageBadge value={row.covered} className="shrink-0" />}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Service</p>
          <p className="font-semibold text-slate-800 text-sm mt-0.5">{row.serviceName}</p>
          {row.description && (
            <p className="text-slate-400 text-xs leading-relaxed mt-1 line-clamp-2">{row.description}</p>
          )}
        </div>
        <p className="font-display font-bold text-sky-600 text-lg shrink-0">{formatPrice(row.price)}</p>
      </div>
    </Link>
  )
}

export default function Tools() {
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [optionError, setOptionError] = useState('')
  const [serviceOptions, setServiceOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])
  const [selectedService, setSelectedService] = useState('')
  const [selectedCity, setSelectedCity] = useState('')

  const [estimatorLoading, setEstimatorLoading] = useState(false)
  const [estimatorRows, setEstimatorRows] = useState([])
  const [hasEstimated, setHasEstimated] = useState(false)

  const [coverageFilter, setCoverageFilter] = useState('all')
  const [coverageLoading, setCoverageLoading] = useState(true)
  const [coverageRows, setCoverageRows] = useState([])
  const [coverageCount, setCoverageCount] = useState(0)

  useEffect(() => {
    let active = true

    async function loadOptions() {
      setLoadingOptions(true)
      const { data, error } = await supabase
        .from('services')
        .select(PUBLIC_SERVICE_SELECT)
        .eq('is_active', true)
        .eq('clinics.is_active', true)
        .eq('clinics.verification_status', 'approved')
        .limit(2000)

      if (!active) return

      if (error) {
        setOptionError(error.message)
        setLoadingOptions(false)
        return
      }

      const rows = (data || []).map(normalizeServiceRow)
      const services = [...new Set(rows.map(row => row.serviceName).filter(Boolean))].sort((a, b) => a.localeCompare(b))
      const cities = [...new Set(rows.map(row => row.city).filter(city => city && city !== 'Location not set'))].sort((a, b) => a.localeCompare(b))

      setServiceOptions(services)
      setCityOptions(cities)
      setSelectedService(current => current || services[0] || '')
      setSelectedCity(current => current || cities[0] || '')
      setLoadingOptions(false)
    }

    loadOptions()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true

    async function loadCoverageRows() {
      setCoverageLoading(true)
      let query = supabase
        .from('services')
        .select(PUBLIC_SERVICE_SELECT, { count: 'exact' })
        .eq('is_active', true)
        .eq('clinics.is_active', true)
        .eq('clinics.verification_status', 'approved')
        .limit(250)

      if (coverageFilter !== 'all') query = query.eq('covered', coverageFilter)

      const { data, count } = await query

      if (!active) return

      const rows = (data || [])
        .map(normalizeServiceRow)
        .sort((a, b) => {
          const coverageDiff = getCoverageSortRank(a.covered) - getCoverageSortRank(b.covered)
          if (coverageDiff !== 0) return coverageDiff
          const clinicDiff = a.clinicName.localeCompare(b.clinicName)
          if (clinicDiff !== 0) return clinicDiff
          return a.serviceName.localeCompare(b.serviceName)
        })

      setCoverageRows(rows)
      setCoverageCount(count || rows.length)
      setCoverageLoading(false)
    }

    loadCoverageRows()
    return () => { active = false }
  }, [coverageFilter])

  const estimatorSummary = useMemo(() => {
    if (!hasEstimated) return 'Choose a service and city to compare public clinic prices.'
    if (estimatorRows.length === 0) return 'No matching clinic services found yet.'
    return `${estimatorRows.length} clinic service${estimatorRows.length === 1 ? '' : 's'} found in ${selectedCity}.`
  }, [estimatorRows.length, hasEstimated, selectedCity])

  async function runEstimator() {
    if (!selectedService || !selectedCity) return

    setEstimatorLoading(true)
    setHasEstimated(true)

    const { data } = await supabase
      .from('services')
      .select(PUBLIC_SERVICE_SELECT)
      .eq('is_active', true)
      .eq('name', selectedService)
      .eq('clinics.city', selectedCity)
      .eq('clinics.is_active', true)
      .eq('clinics.verification_status', 'approved')
      .limit(100)

    const rows = (data || []).map(normalizeServiceRow).sort(sortByPriceThenClinic)
    setEstimatorRows(rows)
    setEstimatorLoading(false)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 sm:py-10">
        <section className="mb-8">
          <div className="rounded-[2rem] overflow-hidden border border-sky-100 bg-[radial-gradient(circle_at_12%_18%,rgba(186,230,253,0.95),transparent_34%),linear-gradient(135deg,#ffffff_0%,#f0f9ff_48%,#e0f2fe_100%)] p-6 sm:p-8 shadow-sm">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-sky-100 px-3 py-1 text-xs font-bold text-sky-700 mb-4">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Dental cost and coverage tools
                </div>
                <h1 className="font-display font-bold text-slate-900 text-3xl sm:text-5xl tracking-[-0.03em] leading-tight">
                  Compare prices and coverage before you book.
                </h1>
                <p className="text-slate-500 text-base sm:text-lg leading-relaxed mt-4 max-w-2xl">
                  Check dental service prices by city, then scan which clinics list HMO, PhilHealth, or no coverage for each service.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Prices', Icon: Calculator, cls: 'text-sky-600 bg-white' },
                  { label: 'HMO', Icon: ShieldCheck, cls: 'text-blue-700 bg-blue-50' },
                  { label: 'PhilHealth', Icon: CheckCircle2, cls: 'text-emerald-700 bg-emerald-50' },
                ].map(item => (
                  <div key={item.label} className={`rounded-2xl border border-white/80 p-4 text-center shadow-sm ${item.cls}`}>
                    <item.Icon className="w-6 h-6 mx-auto mb-2" />
                    <p className="text-xs font-bold">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {optionError && (
          <div className="mb-6 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            Unable to load service tools right now: {optionError}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_0.95fr] gap-6">
          <ToolShell
            icon={Calculator}
            title="Service Cost Estimator"
            description="Select a dental service and city to see clinics sorted from lowest to highest listed price."
          >
            <div className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Dental service</label>
                <select
                  value={selectedService}
                  onChange={e => setSelectedService(e.target.value)}
                  className="input"
                  disabled={loadingOptions || serviceOptions.length === 0}
                >
                  {serviceOptions.map(service => <option key={service} value={service}>{service}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">City / location</label>
                <select
                  value={selectedCity}
                  onChange={e => setSelectedCity(e.target.value)}
                  className="input"
                  disabled={loadingOptions || cityOptions.length === 0}
                >
                  {cityOptions.map(city => <option key={city} value={city}>{city}</option>)}
                </select>
              </div>
              <button
                type="button"
                onClick={runEstimator}
                disabled={loadingOptions || estimatorLoading || !selectedService || !selectedCity}
                className="btn btn-primary btn-md justify-center"
              >
                {estimatorLoading ? 'Checking...' : 'Estimate'}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <p className="text-sm font-semibold text-slate-700">{estimatorSummary}</p>
                {hasEstimated && estimatorRows.length > 0 && (
                  <span className="badge badge-teal">Lowest first</span>
                )}
              </div>

              {loadingOptions || estimatorLoading ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {[1, 2].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : !hasEstimated ? (
                <EmptyState
                  icon={<Search className="w-7 h-7 text-slate-300" />}
                  title="Ready when you are"
                  description="Pick a service and city, then run the estimator."
                />
              ) : estimatorRows.length === 0 ? (
                <EmptyState
                  icon={<Stethoscope className="w-7 h-7 text-slate-300" />}
                  title="No matching clinics found"
                  description="Try another city or service. Clinics may still be adding their coverage and prices."
                />
              ) : (
                <div className="grid sm:grid-cols-2 gap-3">
                  {estimatorRows.map(row => <ResultCard key={row.id} row={row} />)}
                </div>
              )}
            </div>
          </ToolShell>

          <ToolShell
            icon={ShieldCheck}
            title="HMO / PhilHealth Coverage"
            description="Filter services by HMO, PhilHealth, or no listed coverage and jump straight to the clinic profile."
          >
            <div className="flex flex-wrap gap-2 mb-4">
              {COVERAGE_FILTERS.map(filter => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setCoverageFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    coverageFilter === filter.value
                      ? 'bg-sky-500 text-white border-sky-500 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-200 hover:border-sky-200 hover:text-sky-600'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {coverageFilter === 'all'
                      ? 'All public service coverage'
                      : `${COVERAGE_OPTIONS.find(option => option.value === coverageFilter)?.displayLabel || 'Coverage'} services`}
                  </p>
                  <p className="text-xs text-slate-400">
                    Showing {coverageRows.length} of {coverageCount} matching service{coverageCount === 1 ? '' : 's'}
                  </p>
                </div>
                <ClipboardList className="w-5 h-5 text-sky-300" />
              </div>

              {coverageLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                </div>
              ) : coverageRows.length === 0 ? (
                <EmptyState
                  icon={<ShieldCheck className="w-7 h-7 text-slate-300" />}
                  title="No coverage records found"
                  description="Try a different coverage filter."
                />
              ) : (
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                  {coverageRows.map(row => (
                    <Link
                      key={row.id}
                      to={`/clinic/${row.clinicId}`}
                      className="block rounded-2xl border border-slate-200 bg-white p-4 hover:border-sky-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                            {row.clinicName}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {row.city}
                          </p>
                        </div>
                        <CoverageBadge value={row.covered} className="shrink-0" />
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-slate-700">{row.serviceName}</p>
                        <p className="text-sm font-display font-bold text-sky-600">{formatPrice(row.price)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </ToolShell>
        </div>
      </main>
    </div>
  )
}
