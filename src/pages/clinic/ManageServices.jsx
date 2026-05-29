import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'
import { Wrench, Clock, Plus, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react'
import { PageHeader, EmptyState, Modal, Field, Alert, SkeletonRows, TableWrapper, TableHead } from '../../components/ui/shared'
import CoverageBadge from '../../components/CoverageBadge'
import { COVERAGE_OPTIONS, normalizeCoverage } from '../../lib/coverage'

const EMPTY = { name:'', description:'', duration_minutes:60, price:'', covered:'none' }

function ServiceForm({ service, onClose, onSaved }) {
  const [form, setForm]   = useState(service ? {
    name: service.name, description: service.description||'',
    duration_minutes: service.duration_minutes, price: service.price||'',
    covered: normalizeCoverage(service.covered),
  } : EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  function set(k){ return e => setForm(p=>({...p,[k]:e.target.value})) }

  async function handleSave() {
    if (!form.name.trim()) { setError('Service name is required'); return }
    setSaving(true); setError('')
    const payload = {
      ...form,
      duration_minutes: parseInt(form.duration_minutes, 10) || 30,
      price: form.price ? parseFloat(form.price) : null,
      covered: normalizeCoverage(form.covered),
    }
    try {
      if (service) {
        const { error:err } = await supabase.from('services').update(payload).eq('id', service.id)
        if (err) throw err
      } else {
        // clinic_id added by caller via onSaved
        const res = await onSaved(payload, false)
        if (res?.error) throw res.error
        return
      }
      await onSaved(payload, true)
    } catch(err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title={service ? 'Edit Service' : 'Add New Service'}>
      <div className="space-y-4">
        <Field label="Service Name" required>
          <input value={form.name} onChange={set('name')} placeholder="e.g. Dental Cleaning" className="input" autoFocus/>
        </Field>
        <Field label="Description">
          <textarea value={form.description} onChange={set('description')}
            placeholder="Brief description..." rows={2} className="input resize-none"/>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Duration (mins)">
            <input type="number" value={form.duration_minutes} onChange={set('duration_minutes')}
              min={15} step={15} className="input"/>
          </Field>
          <Field label="Price (₱)">
            <input type="number" value={form.price} onChange={set('price')}
              placeholder="0.00" min={0} step={0.01} className="input"/>
          </Field>
        </div>
        <Field label="Coverage">
          <div className="grid grid-cols-3 gap-2">
            {COVERAGE_OPTIONS.map(option => {
              const active = normalizeCoverage(form.covered) === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, covered: option.value }))}
                  className={`rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    active
                      ? 'border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-100'
                      : 'border-slate-200 text-slate-500 hover:border-sky-200 hover:text-sky-600'
                  }`}
                >
                  {option.label}
                </button>
              )
            })}
          </div>
        </Field>
        {error && <Alert type="error">{error}</Alert>}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="btn btn-secondary btn-md flex-1">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn btn-primary btn-md flex-1">
            {saving ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"/>Saving...</> : service ? 'Save Changes' : 'Add Service'}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default function ManageServices() {
  const { user } = useAuth()
  const [clinic, setClinic]     = useState(null)
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [editing, setEditing]   = useState(null)   // null = closed, 'new' = add, obj = edit
  const [deleteId, setDeleteId] = useState(null)

  useEffect(()=>{
    async function load() {
      const { data:c } = await supabase.from('clinics').select('*').eq('owner_id',user.id).single()
      setClinic(c)
      if (c) {
        const { data:s } = await supabase.from('services').select('*').eq('clinic_id',c.id).order('created_at')
        setServices(s||[])
      }
      setLoading(false)
    }
    load()
  },[user])

  async function reload() {
    const { data:s } = await supabase.from('services').select('*').eq('clinic_id',clinic.id).order('created_at')
    setServices(s||[])
  }

  async function handleSaved(payload, isEdit) {
    if (isEdit) {
      await reload(); setEditing(null); toast.success('Service updated!')
    } else {
      const { error } = await supabase.from('services').insert({...payload, clinic_id:clinic.id})
      if (error) return { error }
      await reload(); setEditing(null); toast.success('Service added!')
    }
  }

  async function toggleActive(svc) {
    await supabase.from('services').update({is_active:!svc.is_active}).eq('id',svc.id)
    setServices(p=>p.map(s=>s.id===svc.id?{...s,is_active:!s.is_active}:s))
    toast.success(svc.is_active ? 'Service deactivated' : 'Service activated')
  }

  async function confirmDelete() {
    await supabase.from('services').delete().eq('id',deleteId)
    setServices(p=>p.filter(s=>s.id!==deleteId))
    setDeleteId(null); toast.success('Service deleted')
  }

  if (loading) return (
    <div>
      <div className="skeleton h-8 w-32 mb-6"/>
      <TableWrapper>
        <TableHead cols={['Name','Duration','Price','Coverage','Status','']}/>
        <tbody><SkeletonRows n={4} cols={6}/></tbody>
      </TableWrapper>
    </div>
  )

  return (
    <div>
      <PageHeader
        title="Services"
        subtitle={`${services.length} service${services.length!==1?'s':''} configured`}
        action={
          <button onClick={()=>setEditing('new')} className="btn btn-primary btn-md flex items-center gap-2">
            <Plus className="w-4 h-4"/> Add Service
          </button>
        }
      />

      {services.length===0 ? (
        <EmptyState
          icon={<Wrench className="w-7 h-7 text-slate-300"/>}
          title="No services yet"
          description="Add your first service so patients can book appointments with you"
          action={<button onClick={()=>setEditing('new')} className="btn btn-primary btn-sm">Add Service</button>}
        />
      ) : (
        <TableWrapper>
          <TableHead cols={['Service','Duration','Price','Coverage','Status','']}/>
          <tbody className="divide-y divide-slate-100">
            {services.map(s=>(
              <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-4 py-3">
                  <p className="font-semibold text-slate-800 text-sm">{s.name}</p>
                  {s.description && <p className="text-slate-400 text-xs mt-0.5 max-w-xs truncate">{s.description}</p>}
                </td>
                <td className="px-4 py-3 text-slate-500 text-sm">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5"/>{s.duration_minutes} min</span>
                </td>
                <td className="px-4 py-3 font-bold text-slate-800 text-sm">
                  {s.price ? `₱${parseFloat(s.price).toLocaleString()}` : '—'}
                </td>
                <td className="px-4 py-3">
                  <CoverageBadge value={s.covered} />
                </td>
                <td className="px-4 py-3">
                  <button onClick={()=>toggleActive(s)} className="flex items-center gap-1.5 text-xs font-semibold transition-colors">
                    {s.is_active
                      ? <><ToggleRight className="w-5 h-5 text-emerald-500"/><span className="text-emerald-600">Active</span></>
                      : <><ToggleLeft className="w-5 h-5 text-slate-300"/><span className="text-slate-400">Inactive</span></>
                    }
                  </button>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={()=>setEditing(s)} className="text-xs text-sky-600 hover:underline flex items-center gap-1">
                      <Pencil className="w-3 h-3"/>Edit
                    </button>
                    <button onClick={()=>setDeleteId(s.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                      <Trash2 className="w-3 h-3"/>Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrapper>
      )}

      {/* Add/Edit modal */}
      {editing && (
        <ServiceForm
          service={editing==='new' ? null : editing}
          onClose={()=>setEditing(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Delete confirm modal */}
      {deleteId && (
        <Modal open onClose={()=>setDeleteId(null)} title="Delete Service">
          <p className="text-slate-600 text-sm mb-5">This will permanently delete this service. Any existing appointments using it won't be affected.</p>
          <Alert type="warning">This cannot be undone.</Alert>
          <div className="flex gap-3 mt-5">
            <button onClick={()=>setDeleteId(null)} className="btn btn-secondary btn-md flex-1">Cancel</button>
            <button onClick={confirmDelete} className="btn btn-danger btn-md flex-1">Delete</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
