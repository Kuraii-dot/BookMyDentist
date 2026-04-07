import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import { format, parseISO, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import {
  FileSpreadsheet, FileText, Download, Calendar,
  Filter, Users, DollarSign, Stethoscope, Loader,
  ChevronDown, BarChart2, RefreshCw,
} from 'lucide-react'
import { PageHeader, Field } from '../../components/ui/shared'

// ── Quick date range presets ─────────────────────────────────────────────────
const PRESETS = [
  {
    label: 'This Month',
    from: () => format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    to:   () => format(new Date(), 'yyyy-MM-dd'),
  },
  {
    label: 'Last Month',
    from: () => format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    to:   () => format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
  },
  {
    label: 'Last 3 Months',
    from: () => format(subMonths(new Date(), 3), 'yyyy-MM-dd'),
    to:   () => format(new Date(), 'yyyy-MM-dd'),
  },
  {
    label: 'This Year',
    from: () => `${new Date().getFullYear()}-01-01`,
    to:   () => format(new Date(), 'yyyy-MM-dd'),
  },
  { label: 'Custom', from: null, to: null },
]

// ── Format currency ───────────────────────────────────────────────────────────
function peso(n) {
  return `₱${(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// ── Excel export via SheetJS ──────────────────────────────────────────────────
async function exportExcel({ rows, clinic, dateFrom, dateTo, procedure }) {
  // Load SheetJS from CDN
  const XLSX = await new Promise((resolve, reject) => {
    if (window.XLSX) { resolve(window.XLSX); return }
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
    script.onload  = () => resolve(window.XLSX)
    script.onerror = reject
    document.head.appendChild(script)
  })

  const wb = XLSX.utils.book_new()

  // ── Header metadata rows ──
  const title       = clinic?.name || 'Clinic'
  const periodLabel = `${format(parseISO(dateFrom), 'MMMM d, yyyy')} – ${format(parseISO(dateTo), 'MMMM d, yyyy')}`
  const procLabel   = procedure === 'all' ? 'All Procedures' : procedure

  const headerRows = [
    [title],
    [`Appointment Report — ${procLabel}`],
    [`Period: ${periodLabel}`],
    [`Generated: ${format(new Date(), 'MMMM d, yyyy h:mm a')}`],
    [],
    ['No.', 'Patient Name', 'Date', 'Time', 'Procedure', 'Amount (₱)'],
  ]

  const dataRows = rows.map((r, i) => [
    i + 1,
    r.patientName,
    r.date,
    r.time || '—',
    r.procedure,
    r.amount,
  ])

  const totalRow = [
    '', '', '', '',
    'TOTAL',
    rows.reduce((s, r) => s + r.amount, 0),
  ]
  const summaryRows = [
    [],
    ['', '', '', '', 'Total Patients:', rows.length],
    ['', '', '', '', 'Total Earnings:', rows.reduce((s, r) => s + r.amount, 0)],
  ]

  const allRows = [...headerRows, ...dataRows, [], totalRow, ...summaryRows]
  const ws      = XLSX.utils.aoa_to_sheet(allRows)

  // Column widths
  ws['!cols'] = [
    { wch: 5  },  // No.
    { wch: 28 },  // Patient
    { wch: 18 },  // Date
    { wch: 12 },  // Time
    { wch: 28 },  // Procedure
    { wch: 16 },  // Amount
  ]

  // Style the header rows (row indices 0-3 = title area, row 5 = column headers)
  const headerStyle = { font: { bold: true, sz: 14 }, alignment: { horizontal: 'left' } }
  const colHeaderStyle = {
    font: { bold: true, color: { rgb: 'FFFFFF' } },
    fill: { fgColor: { rgb: '0EA5E9' } },
    alignment: { horizontal: 'center' },
    border: {
      bottom: { style: 'thin', color: { rgb: '0284C7' } },
    },
  }

  // Apply styles to column header row (row index 5, 0-based)
  const colHeaderRow = 5
  ;['A', 'B', 'C', 'D', 'E', 'F'].forEach(col => {
    const cell = ws[`${col}${colHeaderRow + 1}`]
    if (cell) cell.s = colHeaderStyle
  })

  // Bold the title
  const titleCell = ws['A1']
  if (titleCell) titleCell.s = { font: { bold: true, sz: 16 } }

  // Format amount column as currency
  const amountColLetter = 'F'
  for (let i = 0; i < rows.length; i++) {
    const cellRef = `${amountColLetter}${colHeaderRow + 2 + i}`
    if (ws[cellRef]) ws[cellRef].z = '#,##0.00'
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Report')
  const filename = `${(clinic?.name || 'clinic').replace(/\s+/g, '_')}_report_${dateFrom}_${dateTo}.xlsx`
  XLSX.writeFile(wb, filename)
}

// ── PDF export via browser print ─────────────────────────────────────────────
function exportPDF({ rows, clinic, dateFrom, dateTo, procedure }) {
  const title       = clinic?.name || 'Clinic Report'
  const periodLabel = `${format(parseISO(dateFrom), 'MMMM d, yyyy')} – ${format(parseISO(dateTo), 'MMMM d, yyyy')}`
  const procLabel   = procedure === 'all' ? 'All Procedures' : procedure
  const totalAmount = rows.reduce((s, r) => s + r.amount, 0)
  const generatedAt = format(new Date(), 'MMMM d, yyyy h:mm a')

  const tableRows = rows.map((r, i) => `
    <tr style="background:${i % 2 === 0 ? '#f8fafc' : '#ffffff'}">
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;color:#64748b;font-size:12px;">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:13px;">${r.patientName}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:12px;">${r.date}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#475569;font-size:12px;">${r.time || '—'}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;color:#0369a1;font-size:12px;font-weight:500;">${r.procedure}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;font-size:12px;">₱${r.amount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</td>
    </tr>
  `).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>${title} — Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; color: #0f172a; background: white; }
        @page { margin: 20mm; }
        @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
      </style>
    </head>
    <body>
      <!-- Header -->
      <div style="border-bottom:3px solid #0ea5e9;padding-bottom:20px;margin-bottom:24px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;">
          <div>
            <h1 style="font-size:24px;font-weight:800;color:#0f172a;letter-spacing:-0.5px;">${title}</h1>
            <p style="color:#64748b;font-size:13px;margin-top:4px;">Appointment Report — ${procLabel}</p>
          </div>
          <div style="text-align:right;">
            <div style="background:#e0f2fe;border-radius:8px;padding:8px 16px;display:inline-block;">
              <p style="color:#0369a1;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Period</p>
              <p style="color:#0f172a;font-size:13px;font-weight:600;margin-top:2px;">${periodLabel}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Summary cards -->
      <div style="display:flex;gap:16px;margin-bottom:24px;">
        <div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px 18px;">
          <p style="color:#15803d;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Total Patients</p>
          <p style="color:#0f172a;font-size:24px;font-weight:800;margin-top:4px;">${rows.length}</p>
        </div>
        <div style="flex:1;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 18px;">
          <p style="color:#1d4ed8;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Total Earnings</p>
          <p style="color:#0f172a;font-size:24px;font-weight:800;margin-top:4px;">₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </div>
        ${rows.length > 0 ? `
        <div style="flex:1;background:#faf5ff;border:1px solid #e9d5ff;border-radius:10px;padding:14px 18px;">
          <p style="color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;">Avg per Patient</p>
          <p style="color:#0f172a;font-size:24px;font-weight:800;margin-top:4px;">₱${(totalAmount / rows.length).toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
        </div>` : ''}
      </div>

      <!-- Table -->
      <table style="width:100%;border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #e2e8f0;">
        <thead>
          <tr style="background:#0ea5e9;">
            <th style="padding:11px 12px;text-align:center;color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;width:40px;">#</th>
            <th style="padding:11px 12px;text-align:left;color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Patient Name</th>
            <th style="padding:11px 12px;text-align:left;color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Date</th>
            <th style="padding:11px 12px;text-align:left;color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Time</th>
            <th style="padding:11px 12px;text-align:left;color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Procedure</th>
            <th style="padding:11px 12px;text-align:right;color:white;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows || `<tr><td colspan="6" style="padding:32px;text-align:center;color:#94a3b8;font-size:13px;">No appointments found for this period.</td></tr>`}
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9;">
            <td colspan="4" style="padding:12px;border-top:2px solid #e2e8f0;"></td>
            <td style="padding:12px;border-top:2px solid #e2e8f0;font-weight:800;font-size:13px;color:#0f172a;">TOTAL</td>
            <td style="padding:12px;border-top:2px solid #e2e8f0;text-align:right;font-weight:800;font-size:14px;color:#0369a1;">
              ₱${totalAmount.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">
        <p style="color:#94a3b8;font-size:11px;">Generated by BookMyDentistPH · ${generatedAt}</p>
        <p style="color:#94a3b8;font-size:11px;">${title} — Confidential</p>
      </div>
    </body>
    </html>
  `

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => { win.print(); win.close() }, 500)
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ClinicReports() {
  const { user }  = useAuth()
  const [clinic, setClinic]           = useState(null)
  const [services, setServices]       = useState([])
  const [loading, setLoading]         = useState(true)
  const [generating, setGenerating]   = useState(false)
  const [reportRows, setReportRows]   = useState(null)
  const [hasGenerated, setHasGenerated] = useState(false)

  // Filters
  const [dateFrom, setDateFrom]       = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'))
  const [dateTo, setDateTo]           = useState(format(new Date(), 'yyyy-MM-dd'))
  const [procedure, setProcedure]     = useState('all')
  const [activePreset, setActivePreset] = useState(0)

  // Summary stats from generated report
  const totalPatients = reportRows?.length || 0
  const totalEarnings = reportRows?.reduce((s, r) => s + r.amount, 0) || 0

  useEffect(() => {
    async function load() {
      const { data: c } = await supabase.from('clinics').select('*').eq('owner_id', user.id).maybeSingle()
      setClinic(c)
      if (c) {
        const { data: svcs } = await supabase.from('services').select('id,name').eq('clinic_id', c.id).order('name')
        setServices(svcs || [])
      }
      setLoading(false)
    }
    load()
  }, [user])

  function applyPreset(idx) {
    const preset = PRESETS[idx]
    setActivePreset(idx)
    if (preset.from) {
      setDateFrom(preset.from())
      setDateTo(preset.to())
    }
  }

  async function generateReport() {
    if (!clinic) return
    if (!dateFrom || !dateTo) { toast.error('Please select a date range'); return }
    if (dateFrom > dateTo)    { toast.error('Start date must be before end date'); return }

    setGenerating(true)
    setHasGenerated(false)

    // Fetch completed appointments in range
    let query = supabase
      .from('appointments')
      .select('*, profiles!appointments_customer_id_fkey(full_name), services(id,name,price)')
      .eq('clinic_id', clinic.id)
      .eq('status', 'completed')
      .gte('appointment_date', dateFrom)
      .lte('appointment_date', dateTo)
      .order('appointment_date', { ascending: true })
      .order('appointment_time', { ascending: true })

    const { data: appts, error } = await query

    if (error) { toast.error('Failed to fetch appointments'); setGenerating(false); return }

    // Filter by procedure if selected, and build rows
    const rows = []
    for (const a of appts || []) {
      // A completed appointment may have performed_services (multiple procedures)
      // or fall back to the booked service
      const performed = a.performed_services?.length ? a.performed_services : null

      if (performed) {
        // If filtering by procedure, check if this appt includes it
        const filtered = procedure === 'all'
          ? performed
          : performed.filter(p => p.name === procedure || p.service_id === procedure)
        if (filtered.length === 0) continue

        // Each performed procedure becomes a row
        for (const p of filtered) {
          rows.push({
            patientName: a.profiles?.full_name || a.guest_name || 'Walk-in',
            date:        format(parseISO(a.appointment_date), 'MMMM d, yyyy'),
            time:        a.appointment_time ? formatTime(a.appointment_time) : '—',
            procedure:   p.name,
            amount:      parseFloat(p.price) || 0,
            apptId:      a.id,
          })
        }
      } else {
        // No performed_services — use booked service
        if (procedure !== 'all' && a.services?.id !== procedure && a.services?.name !== procedure) continue
        rows.push({
          patientName: a.profiles?.full_name || a.guest_name || 'Walk-in',
          date:        format(parseISO(a.appointment_date), 'MMMM d, yyyy'),
          time:        a.appointment_time ? formatTime(a.appointment_time) : '—',
          procedure:   a.services?.name || '—',
          amount:      parseFloat(a.services?.price) || 0,
          apptId:      a.id,
        })
      }
    }

    setReportRows(rows)
    setHasGenerated(true)
    setGenerating(false)

    if (rows.length === 0) {
      toast('No completed appointments found for this period.', { icon: '📋' })
    } else {
      toast.success(`Report generated — ${rows.length} record${rows.length !== 1 ? 's' : ''} found`)
    }
  }

  function formatTime(t) {
    if (!t) return '—'
    const [h, m] = t.split(':').map(Number)
    const ampm   = h >= 12 ? 'PM' : 'AM'
    const h12    = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${m.toString().padStart(2, '0')} ${ampm}`
  }

  async function handleExcelExport() {
    if (!reportRows) return
    try {
      await exportExcel({ rows: reportRows, clinic, dateFrom, dateTo, procedure })
      toast.success('Excel file downloaded!')
    } catch (err) {
      console.error(err)
      toast.error('Failed to export Excel. Try again.')
    }
  }

  function handlePDFExport() {
    if (!reportRows) return
    exportPDF({ rows: reportRows, clinic, dateFrom, dateTo, procedure })
  }

  if (loading) return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
        style={{ borderColor: 'var(--color-brand)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="max-w-4xl animate-fade-in">
      <PageHeader
        title="Reports"
        subtitle="Generate appointment and earnings reports"
      />

      {/* Filter card */}
      <div className="card p-6 mb-6">

        {/* Quick presets */}
        <div className="mb-5">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Quick Select</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, i) => (
              <button key={p.label} onClick={() => applyPreset(i)}
                className={`text-xs px-3 py-1.5 rounded-full font-semibold border transition-all ${activePreset === i ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-600 hover:border-sky-300'}`}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          {/* Date from */}
          <Field label="From Date" required>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateFrom}
                onChange={e => { setDateFrom(e.target.value); setActivePreset(4) }}
                max={dateTo}
                className="input pl-9"
              />
            </div>
          </Field>

          {/* Date to */}
          <Field label="To Date" required>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                value={dateTo}
                onChange={e => { setDateTo(e.target.value); setActivePreset(4) }}
                min={dateFrom}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="input pl-9"
              />
            </div>
          </Field>

          {/* Procedure filter */}
          <Field label="Procedure">
            <div className="relative">
              <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={procedure}
                onChange={e => setProcedure(e.target.value)}
                className="input pl-9"
              >
                <option value="all">All Procedures</option>
                {services.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </Field>
        </div>

        <button
          onClick={generateReport}
          disabled={generating}
          className="btn btn-primary btn-md w-full flex items-center justify-center gap-2"
        >
          {generating
            ? <><Loader className="w-4 h-4 animate-spin" />Generating Report...</>
            : <><RefreshCw className="w-4 h-4" />Generate Report</>}
        </button>
      </div>

      {/* Results */}
      {hasGenerated && reportRows && (
        <div className="animate-fade-in">

          {/* Summary stats */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-sky-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Patients</p>
                  <p className="font-display font-bold text-2xl text-slate-900">{totalPatients}</p>
                </div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total Earnings</p>
                  <p className="font-display font-bold text-2xl text-slate-900">{peso(totalEarnings)}</p>
                </div>
              </div>
            </div>
            {totalPatients > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                    <BarChart2 className="w-5 h-5 text-violet-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Avg per Patient</p>
                    <p className="font-display font-bold text-2xl text-slate-900">{peso(totalEarnings / totalPatients)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export buttons */}
          {reportRows.length > 0 && (
            <div className="flex gap-3 mb-5">
              <button
                onClick={handleExcelExport}
                className="btn btn-secondary btn-md flex items-center gap-2 flex-1 sm:flex-none"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Export Excel
              </button>
              <button
                onClick={handlePDFExport}
                className="btn btn-secondary btn-md flex items-center gap-2 flex-1 sm:flex-none"
              >
                <FileText className="w-4 h-4 text-red-500" />
                Export PDF
              </button>
            </div>
          )}

          {/* Preview table */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
              <p className="font-semibold text-slate-800 text-sm">
                {clinic?.name} — {procedure === 'all' ? 'All Procedures' : services.find(s => s.id === procedure)?.name || procedure}
              </p>
              <p className="text-xs text-slate-400">
                {format(parseISO(dateFrom), 'MMM d, yyyy')} – {format(parseISO(dateTo), 'MMM d, yyyy')}
              </p>
            </div>

            {reportRows.length === 0 ? (
              <div className="py-16 text-center">
                <BarChart2 className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No completed appointments found</p>
                <p className="text-slate-400 text-sm mt-1">Try a different date range or procedure filter</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide w-10">#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Patient Name</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">Procedure</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportRows.map((r, i) => (
                        <tr key={`${r.apptId}-${i}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-slate-400 text-xs">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-slate-800">{r.patientName}</td>
                          <td className="px-4 py-3 text-slate-500">{r.date}</td>
                          <td className="px-4 py-3 text-slate-500">{r.time}</td>
                          <td className="px-4 py-3 text-sky-600 font-medium">{r.procedure}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-800">{peso(r.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td colSpan={4} className="px-4 py-4" />
                        <td className="px-4 py-4 font-bold text-slate-700 text-sm">TOTAL</td>
                        <td className="px-4 py-4 text-right font-display font-bold text-sky-600 text-base">{peso(totalEarnings)}</td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td colSpan={4} className="px-4 pb-4" />
                        <td className="px-4 pb-4 text-xs text-slate-400">Total Patients</td>
                        <td className="px-4 pb-4 text-right text-xs font-bold text-slate-600">{totalPatients}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}