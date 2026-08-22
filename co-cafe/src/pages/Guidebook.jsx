import { useState, useEffect, useRef } from 'react'
import { BookOpen, Sun, Moon, RotateCcw, Pencil, Plus, Trash2, Check, GripVertical, Wrench, ChefHat, ChevronLeft, ChevronRight, Maximize2, X, ClipboardList, ListChecks, FileText, Upload, Coffee, Leaf, Thermometer, Snowflake, AlertTriangle } from 'lucide-react'
import NavBar from '../components/NavBar'
import { useApp } from '../context/AppContext'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PREVIEW_LIMIT = 6

export default function Guidebook() {
  const { checklists: lists, setChecklists: setLists, isGuest } = useApp()
  const [tab, setTab] = useState('open')
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) setEditing(false)
  }, [expanded])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const currentList = lists[tab]
  const doneCount = currentList.filter(i => i.done).length
  const progress = currentList.length > 0 ? doneCount / currentList.length : 0
  const hiddenCount = Math.max(0, currentList.length - PREVIEW_LIMIT)

  function toggle(id) {
    setLists(prev => ({
      ...prev,
      [tab]: prev[tab].map(i => i.id === id ? { ...i, done: !i.done } : i),
    }))
  }

  function reset() {
    setLists(prev => ({
      ...prev,
      [tab]: prev[tab].map(i => ({ ...i, done: false })),
    }))
  }

  function addItem() {
    const text = draft.trim()
    if (!text) return
    setLists(prev => ({
      ...prev,
      [tab]: [...prev[tab], { id: crypto.randomUUID(), text, done: false }],
    }))
    setDraft('')
  }

  function removeItem(id) {
    setLists(prev => ({
      ...prev,
      [tab]: prev[tab].filter(i => i.id !== id),
    }))
  }

  function editItem(id, text) {
    setLists(prev => ({
      ...prev,
      [tab]: prev[tab].map(i => i.id === id ? { ...i, text } : i),
    }))
  }

  function handleDragEnd({ active, over }) {
    if (!over || active.id === over.id) return
    setLists(prev => {
      const items = prev[tab]
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      return { ...prev, [tab]: arrayMove(items, oldIndex, newIndex) }
    })
  }

  const tabs = (
    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
      {[
        { key: 'open', label: 'Opening', Icon: Sun },
        { key: 'close', label: 'Closing', Icon: Moon },
      ].map(({ key, label, Icon }) => (
        <button
          key={key}
          onClick={() => setTab(key)}
          style={{
            flex: 1,
            padding: 'var(--s3) var(--s4)',
            background: tab === key ? 'var(--surface-2)' : 'transparent',
            border: 'none',
            borderBottom: tab === key ? '2px solid var(--mahogany)' : '2px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--s2)',
            fontWeight: tab === key ? 600 : 400,
            color: tab === key ? 'var(--mahogany)' : 'var(--text-muted)',
            fontSize: '0.875rem',
            transition: 'color var(--t-fast), background var(--t-fast)',
          }}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  )

  const progressBar = currentList.length > 0 && (
    <div style={{
      padding: 'var(--s3) var(--s5)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--s3)',
    }}>
      <div style={{ flex: 1, height: 5, background: 'var(--latte)', borderRadius: 99 }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: progress === 1 ? 'var(--success)' : 'var(--mahogany)',
          borderRadius: 99,
          transition: 'width var(--t-base), background var(--t-base)',
        }} />
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>
        {doneCount}/{currentList.length}
      </span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <NavBar />

      <div className="page">

        <div style={{ marginBottom: 'var(--s6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s2)' }}>
            <BookOpen size={22} color="var(--mahogany)" />
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Guidebook</h2>
          </div>
        </div>

        {/* 2×2 grid */}
        <div className="guidebook-grid">

          {/* — Checklist card (condensed) — */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r3)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}>
            <div style={{
              padding: 'var(--s4) var(--s5)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Open & Close Checklists</span>
              <IconBtn onClick={() => setExpanded(true)} title="Open full view">
                <Maximize2 size={14} />
              </IconBtn>
            </div>

            {tabs}
            {progressBar}

            {/* Preview: first PREVIEW_LIMIT tasks */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
              {currentList.length === 0 && (
                <div style={{
                  padding: 'var(--s5)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}>
                  No tasks yet open to add some.
                </div>
              )}

              {currentList.slice(0, PREVIEW_LIMIT).map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--s3)',
                    padding: 'var(--s3) var(--s5)',
                    borderBottom: idx < PREVIEW_LIMIT - 1 && idx < currentList.length - 1
                      ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <button
                    onClick={() => toggle(item.id)}
                    style={{
                      width: 20, height: 20,
                      borderRadius: 6,
                      border: item.done ? 'none' : '2px solid var(--fog)',
                      background: item.done ? 'var(--mahogany)' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all var(--t-fast)',
                    }}
                  >
                    {item.done && <Check size={11} color="white" strokeWidth={3} />}
                  </button>
                  <span style={{
                    flex: 1,
                    fontSize: '0.875rem',
                    color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
                    textDecoration: item.done ? 'line-through' : 'none',
                    transition: 'color var(--t-fast)',
                  }}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>

            {hiddenCount > 0 && (
              <button
                onClick={() => setExpanded(true)}
                style={{
                  width: '100%',
                  flexShrink: 0,
                  padding: 'var(--s3) var(--s5)',
                  background: 'transparent',
                  border: 'none',
                  borderTop: '1px solid var(--border)',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  color: 'var(--mahogany)',
                  textAlign: 'center',
                }}
              >
                +{hiddenCount} more — open to see all
              </button>
            )}
          </div>

          {/* — Order list card — */}
          <OrderListCard />
          <CleaningCard />
          <RecipeBookCard />

        </div>

        {/* — Log Sheets — full width */}
        <div style={{ marginTop: 'var(--s4)' }}>
          <LogSheetsCard />
        </div>

        {/* — Resident Tally — full width */}
        <div style={{ marginTop: 'var(--s4)' }}>
          <TallyCard />
        </div>

        {/* — Quick To-Do — full width below grid */}
        <div style={{ marginTop: 'var(--s4)' }}>
          <TodoCard />
        </div>

      </div>

      {/* — Expanded modal — */}
      {expanded && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setExpanded(false) }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26,15,10,0.45)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--s5)',
          }}
        >
          <div style={{
            width: '100%',
            maxWidth: 520,
            maxHeight: '85vh',
            background: 'var(--surface)',
            borderRadius: 'var(--r3)',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: 'var(--s4) var(--s5)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Open & Close Checklists</span>
              <div style={{ display: 'flex', gap: 'var(--s2)' }}>
                {!isGuest && (
                  <>
                    <IconBtn onClick={reset} title="Reset checklist">
                      <RotateCcw size={14} />
                    </IconBtn>
                    <IconBtn
                      onClick={() => setEditing(e => !e)}
                      title={editing ? 'Done editing' : 'Edit tasks'}
                      active={editing}
                    >
                      <Pencil size={14} />
                    </IconBtn>
                  </>
                )}
                <IconBtn onClick={() => setExpanded(false)} title="Close">
                  <X size={14} />
                </IconBtn>
              </div>
            </div>

            {/* Tabs + progress inside modal */}
            <div style={{ flexShrink: 0 }}>
              {tabs}
              {progressBar}
            </div>

            {/* Scrollable task list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={currentList.map(i => i.id)} strategy={verticalListSortingStrategy}>
                  <div>
                    {currentList.length === 0 && !editing && (
                      <div style={{
                        padding: 'var(--s7) var(--s5)',
                        textAlign: 'center',
                        color: 'var(--text-muted)',
                        fontSize: '0.875rem',
                      }}>
                        No tasks yet click <Pencil size={12} style={{ display: 'inline', marginBottom: -2 }} /> to add some.
                      </div>
                    )}

                    {currentList.map((item, idx) => (
                      <SortableTask
                        key={item.id}
                        item={item}
                        isLast={idx === currentList.length - 1}
                        editing={editing}
                        onToggle={toggle}
                        onRemove={removeItem}
                        onEdit={editItem}
                      />
                    ))}

                    {editing && (
                      <div style={{ display: 'flex', gap: 'var(--s2)', padding: 'var(--s3) var(--s5)' }}>
                        <input
                          value={draft}
                          onChange={e => setDraft(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addItem()}
                          placeholder="Add a task…"
                          autoFocus
                          style={{
                            flex: 1,
                            padding: 'var(--s2) var(--s3)',
                            borderRadius: 'var(--r2)',
                            border: '1px solid var(--border-strong)',
                            background: 'var(--bg)',
                            color: 'var(--text-primary)',
                            fontSize: '0.875rem',
                            outline: 'none',
                          }}
                        />
                        <button
                          onClick={addItem}
                          style={{
                            padding: 'var(--s2) var(--s4)',
                            borderRadius: 'var(--r2)',
                            border: 'none',
                            background: 'var(--mahogany)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 'var(--s2)',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                          }}
                        >
                          <Plus size={14} /> Add
                        </button>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function companyInitials(name) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  { bg: 'var(--avatar-0-bg)', color: 'var(--avatar-0-fg)' },
  { bg: 'var(--avatar-1-bg)', color: 'var(--avatar-1-fg)' },
  { bg: 'var(--avatar-2-bg)', color: 'var(--avatar-2-fg)' },
  { bg: 'var(--avatar-3-bg)', color: 'var(--avatar-3-fg)' },
  { bg: 'var(--avatar-4-bg)', color: 'var(--avatar-4-fg)' },
]

function avatarColor(idx) { return AVATAR_COLORS[idx % AVATAR_COLORS.length] }

function OrderListCard() {
  const { orders, setOrders, isGuest } = useApp()
  const [openId,        setOpenId]        = useState(null)
  const [addingCompany, setAddingCompany] = useState(false)
  const [newName,       setNewName]       = useState('')

  const selectedCompany = orders.find(c => c.id === openId) ?? null

  function addCompany() {
    const name = newName.trim()
    if (!name) return
    setOrders(prev => [...prev, {
      id: crypto.randomUUID(), name,
      items: [], file: null, fileName: null, fileType: null,
    }])
    setNewName('')
    setAddingCompany(false)
  }

  function updateCompany(id, updates) {
    setOrders(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  function clearCompanyOrder(id) {
    setOrders(prev => prev.map(c =>
      c.id === id ? { ...c, items: [] } : c
    ))
  }

  return (
    <>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r3)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '100%',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <ClipboardList size={16} color="var(--mahogany)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Suppliers</span>
            {orders.length > 0 && (
              <span style={{
                fontSize: '0.68rem', fontWeight: 700,
                background: 'var(--latte)', color: 'var(--text-secondary)',
                padding: '2px 7px', borderRadius: 'var(--r-pill)',
              }}>
                {orders.length}
              </span>
            )}
          </div>
          {!isGuest && (
            <button
              onClick={() => setAddingCompany(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 'var(--r2)',
                border: addingCompany ? 'none' : '1px solid var(--border)',
                background: addingCompany ? 'var(--mahogany)' : 'transparent',
                color: addingCompany ? 'white' : 'var(--text-secondary)',
                fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all var(--t-fast)',
              }}
            >
              <Plus size={12} /> Add Supplier
            </button>
          )}
        </div>

        {/* Add company input */}
        {addingCompany && (
          <div style={{
            padding: 'var(--s3) var(--s4)', borderBottom: '1px solid var(--border)',
            background: 'var(--latte)',
          }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 'var(--s2)', fontWeight: 500 }}>
              Supplier / company name
            </p>
            <div style={{ display: 'flex', gap: 'var(--s2)' }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') addCompany()
                  if (e.key === 'Escape') { setAddingCompany(false); setNewName('') }
                }}
                placeholder="e.g. Meadow Fresh Dairy"
                style={{
                  flex: 1, padding: 'var(--s2) var(--s3)',
                  borderRadius: 'var(--r2)', border: '1px solid var(--border-strong)',
                  background: 'var(--bg)', color: 'var(--text-primary)',
                  fontSize: '0.875rem', outline: 'none',
                }}
              />
              <button
                onClick={addCompany}
                disabled={!newName.trim()}
                style={{
                  padding: 'var(--s2) var(--s4)', borderRadius: 'var(--r2)',
                  border: 'none', background: 'var(--mahogany)', color: 'white',
                  cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                  opacity: newName.trim() ? 1 : 0.4, transition: 'opacity var(--t-fast)',
                }}
              >
                Add
              </button>
            </div>
          </div>
        )}

        {/* Company list */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {orders.length === 0 ? (
            <div style={{
              padding: 'var(--s7) var(--s5)', textAlign: 'center',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s2)',
            }}>
              <ClipboardList size={28} color="var(--fog)" />
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
                No suppliers yet
              </p>
              {!isGuest && (
                <p style={{ color: 'var(--fog)', fontSize: '0.78rem', margin: 0 }}>
                  Add your suppliers above to get started
                </p>
              )}
            </div>
          ) : orders.map((company, idx) => {
            const total = company.items.length
            const av    = avatarColor(idx)

            return (
              <button
                key={company.id}
                onClick={() => setOpenId(company.id)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  gap: 'var(--s3)', padding: 'var(--s3) var(--s4)',
                  background: 'transparent', border: 'none',
                  borderTop: idx === 0 ? 'none' : '1px solid var(--border)',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'background var(--t-fast)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--latte)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: av.bg, color: av.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '0.75rem', letterSpacing: '0.03em',
                }}>
                  {companyInitials(company.name)}
                </div>

                {/* Name + item count */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', margin: 0 }} className="truncate">
                    {company.name}
                  </p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--fog)', margin: '2px 0 0' }}>
                    {total === 0 ? 'No items' : `${total} item${total !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Icons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)', flexShrink: 0 }}>
                  {company.file && (
                    <FileText size={13} color="var(--text-muted)" title="Order form attached" />
                  )}
                  <ChevronRight size={13} color="var(--fog)" />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {selectedCompany && (
        <CompanyOrderModal
          company={selectedCompany}
          isGuest={isGuest}
          onClose={() => setOpenId(null)}
          onUpdate={updates => updateCompany(selectedCompany.id, updates)}
          onClear={() => clearCompanyOrder(selectedCompany.id)}
        />
      )}
    </>
  )
}

function CompanyOrderModal({ company, isGuest, onClose, onUpdate, onClear }) {
  const [activeTab,     setActiveTab]     = useState('items')
  const [draft,         setDraft]         = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const inputRef = useRef(null)
  const fileRef  = useRef(null)

  const items = company.items
  const total = items.length

  function addItem() {
    const text = draft.trim()
    if (!text) return
    onUpdate({ items: [...items, { id: crypto.randomUUID(), text }] })
    setDraft('')
    inputRef.current?.focus()
  }

  function removeItem(id) {
    onUpdate({ items: items.filter(i => i.id !== id) })
  }

  function handleFile(file) {
    const reader = new FileReader()
    reader.onload = e => onUpdate({
      file: e.target.result,
      fileName: file.name,
      fileType: file.type.startsWith('image/') ? 'image' : 'pdf',
    })
    reader.readAsDataURL(file)
  }

  function removeFile() {
    onUpdate({ file: null, fileName: null, fileType: null })
  }

  const TAB_STYLE = (active) => ({
    flex: 1, padding: 'var(--s2) var(--s3)',
    border: 'none', background: 'transparent', cursor: 'pointer',
    fontSize: '0.8rem', fontWeight: active ? 600 : 400,
    color: active ? 'var(--mahogany)' : 'var(--text-muted)',
    borderBottom: active ? '2px solid var(--mahogany)' : '2px solid transparent',
    transition: 'all var(--t-fast)',
  })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,15,10,0.5)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--s5)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 560, maxHeight: '90vh',
        background: 'var(--surface)', borderRadius: 'var(--r3)',
        boxShadow: '0 24px 80px rgba(0,0,0,0.22)', display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>

        {/* Modal header */}
        <div style={{
          padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 'var(--s3)', flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: avatarColor(0).bg, color: avatarColor(0).color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem',
          }}>
            {companyInitials(company.name)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }} className="truncate">
              {company.name}
            </p>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              {total === 0 ? 'No items yet' : `${total} item${total !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--s1)' }}>
            {!isGuest && (
              <IconBtn onClick={() => setConfirmDelete(true)} title="Clear order list">
                <Trash2 size={14} />
              </IconBtn>
            )}
            <IconBtn onClick={onClose} title="Close"><X size={14} /></IconBtn>
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', borderBottom: '1px solid var(--border)',
          padding: '0 var(--s3)', flexShrink: 0,
        }}>
          <button style={TAB_STYLE(activeTab === 'items')} onClick={() => setActiveTab('items')}>
            Order Items
          </button>
          <button style={TAB_STYLE(activeTab === 'form')} onClick={() => setActiveTab('form')}>
            Order Form {company.file ? '· Attached' : ''}
          </button>
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>

          {activeTab === 'items' && (
            <div style={{ padding: 'var(--s4) var(--s5)' }}>

              {/* Add item row — admin only */}
              {!isGuest && (
                <div style={{
                  display: 'flex', gap: 'var(--s2)', marginBottom: 'var(--s4)',
                  padding: 'var(--s3)', background: 'var(--latte)',
                  borderRadius: 'var(--r2)', border: '1px solid var(--border)',
                }}>
                  <input
                    ref={inputRef}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()}
                    placeholder="Add item to order…"
                    autoFocus
                    style={{
                      flex: 1, padding: 'var(--s2) var(--s3)',
                      borderRadius: 'var(--r2)', border: '1px solid var(--border-strong)',
                      background: 'var(--bg)', color: 'var(--text-primary)',
                      fontSize: '0.875rem', outline: 'none',
                    }}
                  />
                  <button
                    onClick={addItem}
                    disabled={!draft.trim()}
                    style={{
                      padding: 'var(--s2) var(--s4)', borderRadius: 'var(--r2)',
                      border: 'none', background: 'var(--mahogany)', color: 'white',
                      cursor: draft.trim() ? 'pointer' : 'not-allowed',
                      fontSize: '0.8rem', fontWeight: 600,
                      opacity: draft.trim() ? 1 : 0.4,
                      transition: 'opacity var(--t-fast)',
                    }}
                  >
                    Add
                  </button>
                </div>
              )}

              {items.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--s6) 0', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.875rem', margin: 0 }}>
                    {isGuest ? 'No items on this order.' : 'Add items using the field above.'}
                  </p>
                </div>
              ) : (
                <div style={{
                  border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden',
                }}>
                  {items.map((item, idx) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 'var(--s3)',
                        padding: 'var(--s3) var(--s4)',
                        borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                      }}
                    >
                      <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {item.text}
                      </span>
                      {!isGuest && (
                        <button
                          onClick={() => removeItem(item.id)}
                          style={{
                            width: 24, height: 24, border: 'none', background: 'transparent',
                            color: 'var(--fog)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            opacity: 0, borderRadius: 'var(--r1)', transition: 'opacity var(--t-fast)',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)' }}
                          onMouseLeave={e => { e.currentTarget.style.opacity = '0'; e.currentTarget.style.color = 'var(--fog)' }}
                          onFocus={e => e.currentTarget.style.opacity = '1'}
                          onBlur={e => e.currentTarget.style.opacity = '0'}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'form' && (
            <div style={{ padding: 'var(--s4) var(--s5)' }}>
              {company.file ? (
                <>
                  {company.fileName && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 'var(--s2)',
                      marginBottom: 'var(--s3)',
                      padding: 'var(--s2) var(--s3)',
                      background: 'var(--latte)', borderRadius: 'var(--r2)',
                      border: '1px solid var(--border)',
                    }}>
                      <FileText size={13} color="var(--mahogany)" />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }} className="truncate">
                        {company.fileName}
                      </span>
                      {!isGuest && (
                        <div style={{ display: 'flex', gap: 'var(--s2)', flexShrink: 0 }}>
                          <button
                            onClick={() => fileRef.current?.click()}
                            style={{
                              padding: '3px 10px', borderRadius: 'var(--r2)',
                              border: '1px solid var(--border)', background: 'transparent',
                              color: 'var(--text-secondary)', fontSize: '0.72rem', cursor: 'pointer',
                              transition: 'all var(--t-fast)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-strong)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                          >
                            Replace
                          </button>
                          <button
                            onClick={removeFile}
                            style={{
                              padding: '3px 10px', borderRadius: 'var(--r2)',
                              border: '1px solid transparent', background: 'transparent',
                              color: 'var(--danger)', fontSize: '0.72rem', cursor: 'pointer',
                              transition: 'all var(--t-fast)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(184,64,64,0.3)'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{
                    borderRadius: 'var(--r2)', overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}>
                    {company.fileType === 'image'
                      ? <img src={company.file} alt="Order form" style={{ width: '100%', display: 'block' }} />
                      : <iframe src={company.file} title="Order form" style={{ width: '100%', height: 440, display: 'block', border: 'none' }} />
                    }
                  </div>
                </>
              ) : isGuest ? (
                <div style={{ textAlign: 'center', padding: 'var(--s6) 0' }}>
                  <FileText size={28} color="var(--fog)" style={{ margin: '0 auto var(--s2)' }} />
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No order form attached.</p>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--mahogany)'; e.currentTarget.style.background = 'rgba(107,58,36,0.04)' }}
                  onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
                  onDrop={e => {
                    e.preventDefault()
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.background = 'transparent'
                    const f = e.dataTransfer.files[0]
                    if (f) handleFile(f)
                  }}
                  onClick={() => fileRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)', borderRadius: 'var(--r3)',
                    padding: 'var(--s7) var(--s5)', textAlign: 'center',
                    cursor: 'pointer', transition: 'all var(--t-fast)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--mahogany)'; e.currentTarget.style.background = 'rgba(107,58,36,0.03)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 48, height: 48, borderRadius: 14,
                    background: 'var(--latte)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto var(--s3)',
                  }}>
                    <Upload size={20} color="var(--text-muted)" />
                  </div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', margin: '0 0 4px' }}>
                    Attach order form
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    Drop a PDF or image here, or click to browse
                  </p>
                  <p style={{ color: 'var(--fog)', fontSize: '0.72rem', marginTop: 6 }}>
                    PDF · JPG · PNG
                  </p>
                </div>
              )}

              <input
                ref={fileRef}
                type="file"
                accept=".pdf,image/*"
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files[0]) handleFile(e.target.files[0]); e.target.value = '' }}
              />
            </div>
          )}
        </div>

        {/* Confirm delete footer */}
        {confirmDelete && (
          <div style={{
            padding: 'var(--s3) var(--s5)', borderTop: '1px solid rgba(184,64,64,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: 'rgba(184,64,64,0.04)', flexShrink: 0,
          }}>
            <span style={{ fontSize: '0.83rem', color: 'var(--danger)', fontWeight: 500 }}>
              Clear all order items for "{company.name}"?
            </span>
            <div style={{ display: 'flex', gap: 'var(--s2)' }}>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{
                  padding: '5px 14px', borderRadius: 'var(--r2)',
                  border: '1px solid var(--border)', background: 'transparent',
                  color: 'var(--text-secondary)', fontSize: '0.8rem', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { onClear(); setConfirmDelete(false) }}
                style={{
                  padding: '5px 14px', borderRadius: 'var(--r2)',
                  border: 'none', background: 'var(--danger)', color: 'white',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Clear Order
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
const DAY_MAP = { 0: 'Sun', 1: 'Mon', 2: 'Tue', 3: 'Wed', 4: 'Thu', 5: 'Fri', 6: 'Sat' }

function TaskInline({ task, onToggle, onEdit }) {
  const [editing, setEditing] = useState(false)
  const [text,    setText]    = useState(task.text)

  function commit() {
    const val = text.trim()
    onEdit(val || task.text)
    setEditing(false)
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
      <button
        onClick={onToggle}
        style={{
          width: 16, height: 16, flexShrink: 0,
          borderRadius: 4,
          border: task.done ? 'none' : '2px solid var(--fog)',
          background: task.done ? 'var(--success)' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all var(--t-fast)',
        }}
      >
        {task.done && <Check size={9} color="white" strokeWidth={3} />}
      </button>

      {editing ? (
        <input
          value={text}
          autoFocus
          onChange={e => setText(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setText(task.text); setEditing(false) } }}
          style={{
            flex: 1, minWidth: 0,
            padding: '1px 4px',
            borderRadius: 'var(--r1)',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            fontSize: '0.75rem',
            outline: 'none',
          }}
        />
      ) : (
        <span
          onClick={() => { setEditing(true); setText(task.text) }}
          title="Click to edit"
          style={{
            flex: 1, minWidth: 0,
            fontSize: '0.75rem',
            color: task.done ? 'var(--text-muted)' : 'var(--text-secondary)',
            textDecoration: task.done ? 'line-through' : 'none',
            cursor: 'text',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color var(--t-fast)',
          }}
        >
          {task.text}
        </span>
      )}
    </div>
  )
}

function CleaningCard() {
  const { cleaningSchedule, setCleaningSchedule, isGuest } = useApp()
  const todayDay = DAY_MAP[new Date().getDay()]

  function toggleTask(day, id) {
    setCleaningSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(t => t.id === id ? { ...t, done: !t.done } : t),
    }))
  }

  function updateText(day, id, text) {
    setCleaningSchedule(prev => ({
      ...prev,
      [day]: prev[day].map(t => t.id === id ? { ...t, text } : t),
    }))
  }

  function resetAll() {
    setCleaningSchedule(prev =>
      Object.fromEntries(
        Object.entries(prev).map(([day, tasks]) => [day, tasks.map(t => ({ ...t, done: false }))])
      )
    )
  }

  const totalDone  = DAYS.flatMap(d => cleaningSchedule[d] || []).filter(t => t.done).length
  const totalTasks = DAYS.flatMap(d => cleaningSchedule[d] || []).length

  return (
    <div style={{
      background:    'var(--surface)',
      borderRadius:  'var(--r3)',
      border:        '1px solid var(--border)',
      boxShadow:     'var(--shadow-sm)',
      overflow:      'hidden',
      display:       'flex',
      flexDirection: 'column',
      height:        '100%',
    }}>
      {/* Header */}
      <div style={{
        padding:        'var(--s4) var(--s5)',
        borderBottom:   '1px solid var(--border)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        flexShrink:     0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
          <Wrench size={16} color="var(--mahogany)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Weekly Cleaning Schedule</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {totalDone}/{totalTasks}
          </span>
          {!isGuest && (
            <button
              onClick={resetAll}
              title="Reset all checkboxes"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 10px',
                borderRadius: 'var(--r2)',
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                cursor: 'pointer',
                transition: 'all var(--t-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(184,64,64,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '0 var(--s5) var(--s2)', paddingTop: 'var(--s2)', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div style={{ height: 3, background: 'var(--latte)', borderRadius: 99 }}>
          <div style={{
            height: '100%',
            width: `${totalTasks ? (totalDone / totalTasks) * 100 : 0}%`,
            background: totalDone === totalTasks && totalTasks > 0 ? 'var(--success)' : 'var(--mahogany)',
            borderRadius: 99,
            transition: 'width 0.3s ease, background 0.3s ease',
          }} />
        </div>
      </div>

      {/* Day rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {DAYS.map((day, idx) => {
          const tasks   = cleaningSchedule[day] || []
          const isToday = day === todayDay
          return (
            <div
              key={day}
              style={{
                display:      'flex',
                alignItems:   'center',
                gap:          'var(--s3)',
                padding:      'var(--s3) var(--s4)',
                borderBottom: idx < DAYS.length - 1 ? '1px solid var(--border)' : 'none',
                background:   isToday ? 'rgba(107,58,36,0.05)' : 'transparent',
              }}
            >
              {/* Day label */}
              <span style={{
                width:      36,
                flexShrink: 0,
                fontSize:   '0.72rem',
                fontWeight: isToday ? 700 : 500,
                color:      isToday ? 'var(--mahogany)' : 'var(--text-muted)',
                letterSpacing: '0.04em',
              }}>
                {day}
                {isToday && (
                  <span style={{ display: 'block', fontSize: '0.6rem', fontWeight: 400, color: 'var(--mahogany)', opacity: 0.7 }}>today</span>
                )}
              </span>

              {/* Divider */}
              <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />

              {/* Two tasks */}
              {tasks.map((task, ti) => (
                <>
                  <TaskInline
                    key={task.id}
                    task={task}
                    onToggle={() => toggleTask(day, task.id)}
                    onEdit={text => updateText(day, task.id, text)}
                  />
                  {ti === 0 && <div style={{ width: 1, height: 28, background: 'var(--border)', flexShrink: 0 }} />}
                </>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const RECIPE_CATEGORIES = ['Syrup', 'Food', 'Drink', 'Other']

function useMobile(breakpoint = 700) {
  const [mobile, setMobile] = useState(() => window.innerWidth < breakpoint)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [breakpoint])
  return mobile
}

function RecipeBookCard() {
  const { recipes, setRecipes, isGuest } = useApp()
  const [expanded, setExpanded] = useState(false)

  const preview = recipes.slice(0, 6)
  const hiddenCount = Math.max(0, recipes.length - 6)

  return (
    <>
      <div style={{
        background: 'var(--surface)',
        borderRadius: 'var(--r3)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}>
        <div style={{
          padding: 'var(--s4) var(--s5)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <ChefHat size={16} color="var(--mahogany)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Recipe Book</span>
            {recipes.length > 0 && (
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                background: 'var(--latte)', color: 'var(--text-secondary)',
                padding: '2px 7px', borderRadius: 'var(--r-pill)',
              }}>
                {recipes.length}
              </span>
            )}
          </div>
          <IconBtn onClick={() => setExpanded(true)} title="Open recipe book">
            <Maximize2 size={14} />
          </IconBtn>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {recipes.length === 0 ? (
            <div style={{ padding: 'var(--s5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No recipes yet open to add some.
            </div>
          ) : (
            preview.map((recipe, idx) => (
              <div
                key={recipe.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: 'var(--s3) var(--s5)',
                  borderBottom: idx < preview.length - 1 ? '1px solid var(--border)' : 'none',
                  gap: 'var(--s3)',
                }}
              >
                <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {recipe.name}
                </span>
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  background: 'var(--latte)', color: 'var(--text-muted)',
                  padding: '2px 7px', borderRadius: 'var(--r-pill)',
                  flexShrink: 0,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                }}>
                  {recipe.category}
                </span>
              </div>
            ))
          )}
        </div>
        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              width: '100%',
              flexShrink: 0,
              padding: 'var(--s3) var(--s5)',
              background: 'transparent',
              border: 'none',
              borderTop: '1px solid var(--border)',
              cursor: 'pointer',
              fontSize: '0.8rem',
              color: 'var(--mahogany)',
              textAlign: 'center',
            }}
          >
            +{hiddenCount} more
          </button>
        )}
      </div>

      {expanded && (
        <RecipeModal
          recipes={recipes}
          setRecipes={setRecipes}
          isGuest={isGuest}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  )
}

function RecipeModal({ recipes, setRecipes, isGuest, onClose }) {
  const isMobile = useMobile()
  const [filterCat, setFilterCat] = useState('All')
  const [selectedId, setSelectedId] = useState(null)
  const [mode, setMode] = useState('view')
  const [form, setForm] = useState({ name: '', category: 'Syrup', notes: '' })

  const showingDetail = selectedId !== null || mode !== 'view'
  const filtered = filterCat === 'All' ? recipes : recipes.filter(r => r.category === filterCat)
  const selected = recipes.find(r => r.id === selectedId) ?? null

  function startAdd() {
    setMode('add')
    setSelectedId(null)
    setForm({ name: '', category: filterCat === 'All' ? 'Syrup' : filterCat, notes: '' })
  }

  function startEdit() {
    if (!selected) return
    setForm({ name: selected.name, category: selected.category, notes: selected.notes })
    setMode('edit')
  }

  function saveAdd() {
    const name = form.name.trim()
    if (!name) return
    const id = `recipe-${Date.now()}`
    setRecipes(prev => [...prev, { id, name, category: form.category, notes: form.notes }])
    setSelectedId(id)
    setMode('view')
  }

  function saveEdit() {
    const name = form.name.trim()
    if (!name) return
    setRecipes(prev => prev.map(r => r.id === selectedId ? { ...r, name, category: form.category, notes: form.notes } : r))
    setMode('view')
  }

  function deleteRecipe() {
    const idx = recipes.findIndex(r => r.id === selectedId)
    const remaining = recipes.filter(r => r.id !== selectedId)
    setRecipes(remaining)
    setSelectedId(remaining[Math.min(idx, remaining.length - 1)]?.id ?? null)
    setMode('view')
  }

  function goBack() { setSelectedId(null); setMode('view') }

  const pillStyle = (active) => ({
    padding: '2px 8px',
    borderRadius: 'var(--r-pill)',
    border: 'none',
    background: active ? 'var(--mahogany)' : 'var(--latte)',
    color: active ? 'white' : 'var(--text-secondary)',
    fontSize: '0.7rem', fontWeight: 600,
    cursor: 'pointer',
    transition: 'all var(--t-fast)',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  })

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(26,15,10,0.45)',
        zIndex: 200,
        display: 'flex',
        alignItems: isMobile ? 'flex-end' : 'center',
        justifyContent: 'center',
        padding: isMobile ? 0 : 'var(--s5)',
      }}
    >
      <div style={{
        width: '100%',
        maxWidth: isMobile ? '100%' : 700,
        height: isMobile ? '93%' : 'auto',
        maxHeight: isMobile ? '93%' : '85vh',
        background: 'var(--surface)',
        borderRadius: isMobile ? 'var(--r3) var(--r3) 0 0' : 'var(--r3)',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s4) var(--s5)',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            {isMobile && showingDetail ? (
              <IconBtn onClick={goBack} title="Back to list">
                <ChevronLeft size={14} />
              </IconBtn>
            ) : (
              <ChefHat size={16} color="var(--mahogany)" />
            )}
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Recipe Book</span>
          </div>
          <IconBtn onClick={onClose} title="Close"><X size={14} /></IconBtn>
        </div>

        {/* Body: two-pane on desktop, single-pane on mobile */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* Left pane — list (hidden on mobile when detail is showing) */}
          {(!isMobile || !showingDetail) && (
            <div style={{
              width: isMobile ? '100%' : 210,
              flexShrink: 0,
              borderRight: isMobile ? 'none' : '1px solid var(--border)',
              display: 'flex', flexDirection: 'column',
              overflow: 'hidden',
            }}>
              {/* Category filter */}
              <div style={{
                padding: 'var(--s2) var(--s3)',
                borderBottom: '1px solid var(--border)',
                display: 'flex', flexWrap: 'wrap', gap: 4,
                flexShrink: 0,
              }}>
                {['All', ...RECIPE_CATEGORIES].map(cat => (
                  <button key={cat} onClick={() => setFilterCat(cat)} style={pillStyle(filterCat === cat)}>
                    {cat}
                  </button>
                ))}
              </div>

              {/* Recipe list */}
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {filtered.length === 0 ? (
                  <div style={{ padding: 'var(--s4)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    {recipes.length === 0 ? 'No recipes yet.' : 'None in this category.'}
                  </div>
                ) : filtered.map((recipe, idx) => (
                  <button
                    key={recipe.id}
                    onClick={() => { setSelectedId(recipe.id); setMode('view') }}
                    style={{
                      width: '100%',
                      padding: 'var(--s3) var(--s4)',
                      background: selectedId === recipe.id ? 'var(--surface-2)' : 'transparent',
                      border: 'none',
                      borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                      borderLeft: `2px solid ${selectedId === recipe.id ? 'var(--mahogany)' : 'transparent'}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex', flexDirection: 'column', gap: 2,
                      transition: 'background var(--t-fast)',
                    }}
                  >
                    <span style={{ fontSize: '0.85rem', fontWeight: selectedId === recipe.id ? 600 : 400, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {recipe.name}
                    </span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {recipe.category}
                    </span>
                  </button>
                ))}
              </div>

              {/* Add button — admin only */}
              {!isGuest && (
                <div style={{ padding: 'var(--s3)', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                  <button
                    onClick={startAdd}
                    style={{
                      width: '100%',
                      padding: 'var(--s2) var(--s3)',
                      borderRadius: 'var(--r2)',
                      border: 'none',
                      background: 'var(--mahogany)',
                      color: 'white',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s2)',
                      fontSize: '0.8rem', fontWeight: 600,
                      transition: 'opacity var(--t-fast)',
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    <Plus size={13} /> New Recipe
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Right pane — detail / form (hidden on mobile when list is showing) */}
          {(!isMobile || showingDetail) && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
              {mode === 'add' || mode === 'edit' ? (
                <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s5)', display: 'flex', flexDirection: 'column', gap: 'var(--s4)' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--s1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Name
                    </label>
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. Vanilla Syrup, Bagel Toast"
                      autoFocus
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: 'var(--s2) var(--s3)',
                        borderRadius: 'var(--r2)',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem', fontWeight: 600,
                        outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--s2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Category
                    </label>
                    <div style={{ display: 'flex', gap: 'var(--s2)', flexWrap: 'wrap' }}>
                      {RECIPE_CATEGORIES.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setForm(f => ({ ...f, category: cat }))}
                          style={{
                            padding: 'var(--s1) var(--s3)',
                            borderRadius: 'var(--r-pill)',
                            border: '1px solid',
                            borderColor: form.category === cat ? 'var(--mahogany)' : 'var(--border)',
                            background: form.category === cat ? 'rgba(107,58,36,0.1)' : 'transparent',
                            color: form.category === cat ? 'var(--mahogany)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            fontSize: '0.8rem', fontWeight: form.category === cat ? 600 : 400,
                            transition: 'all var(--t-fast)',
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 'var(--s1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Instructions / Notes
                    </label>
                    <textarea
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Ingredients, steps, temperatures, times..."
                      rows={10}
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        padding: 'var(--s3)',
                        borderRadius: 'var(--r2)',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--bg)',
                        color: 'var(--text-primary)',
                        fontSize: '0.875rem', lineHeight: 1.6,
                        resize: 'vertical', outline: 'none',
                        fontFamily: 'inherit', minHeight: 160,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 'var(--s2)', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => { setMode('view'); if (mode === 'add') goBack() }}
                      style={{
                        padding: 'var(--s2) var(--s4)',
                        borderRadius: 'var(--r2)',
                        border: '1px solid var(--border)',
                        background: 'transparent',
                        color: 'var(--text-muted)',
                        cursor: 'pointer', fontSize: '0.875rem',
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={mode === 'add' ? saveAdd : saveEdit}
                      disabled={!form.name.trim()}
                      style={{
                        padding: 'var(--s2) var(--s4)',
                        borderRadius: 'var(--r2)',
                        border: 'none',
                        background: form.name.trim() ? 'var(--mahogany)' : 'var(--latte)',
                        color: form.name.trim() ? 'white' : 'var(--fog)',
                        cursor: form.name.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '0.875rem', fontWeight: 600,
                        transition: 'all var(--t-fast)',
                      }}
                    >
                      {mode === 'add' ? 'Add Recipe' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : selected ? (
                <>
                  <div style={{
                    padding: 'var(--s4) var(--s5)',
                    borderBottom: '1px solid var(--border)',
                    flexShrink: 0,
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--s3)',
                  }}>
                    <div>
                      <h3 style={{ margin: 0, marginBottom: 2, fontSize: '1.05rem', fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
                        {selected.name}
                      </h3>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--mahogany)', opacity: 0.8 }}>
                        {selected.category}
                      </span>
                    </div>
                    {!isGuest && (
                      <div style={{ display: 'flex', gap: 'var(--s2)', flexShrink: 0 }}>
                        <IconBtn onClick={startEdit} title="Edit recipe"><Pencil size={14} /></IconBtn>
                        <IconBtn onClick={deleteRecipe} title="Delete recipe"><Trash2 size={14} /></IconBtn>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1, overflowY: 'auto', padding: 'var(--s5)' }}>
                    {selected.notes ? (
                      <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.75, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', fontFamily: 'inherit' }}>
                        {selected.notes}
                      </p>
                    ) : (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        No notes yet — click Edit to add instructions.
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'var(--s3)', padding: 'var(--s6)', color: 'var(--text-muted)' }}>
                  <ChefHat size={32} color="var(--fog)" />
                  <p style={{ margin: 0, fontSize: '0.875rem', textAlign: 'center' }}>
                    {recipes.length === 0 ? 'Add your first recipe using the button below.' : 'Select a recipe from the list.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SortableTask({ item, isLast, editing, onToggle, onRemove, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const [inlineEditing, setInlineEditing] = useState(false)
  const [text, setText] = useState(item.text)

  function commitEdit() {
    const trimmed = text.trim()
    if (trimmed && trimmed !== item.text) onEdit(item.id, trimmed)
    else setText(item.text)
    setInlineEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s3)',
        padding: 'var(--s3) var(--s5)',
        borderBottom: !isLast || editing ? '1px solid var(--border)' : 'none',
        background: isDragging ? 'var(--surface-2)' : 'transparent',
        position: 'relative',
        zIndex: isDragging ? 10 : 'auto',
      }}
    >
      {editing ? (
        <span
          {...listeners}
          {...attributes}
          style={{
            color: 'var(--fog)',
            cursor: isDragging ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <GripVertical size={14} />
        </span>
      ) : null}

      <button
        onClick={() => onToggle(item.id)}
        style={{
          width: 20, height: 20,
          borderRadius: 6,
          border: item.done ? 'none' : '2px solid var(--fog)',
          background: item.done ? 'var(--mahogany)' : 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          transition: 'all var(--t-fast)',
        }}
      >
        {item.done && <Check size={11} color="white" strokeWidth={3} />}
      </button>

      {editing && inlineEditing ? (
        <input
          value={text}
          autoFocus
          onChange={e => setText(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={e => {
            if (e.key === 'Enter') commitEdit()
            if (e.key === 'Escape') { setText(item.text); setInlineEditing(false) }
          }}
          style={{
            flex: 1,
            padding: '2px var(--s2)',
            borderRadius: 'var(--r1)',
            border: '1px solid var(--border-strong)',
            background: 'var(--bg)',
            color: 'var(--text-primary)',
            fontSize: '0.875rem',
            outline: 'none',
          }}
        />
      ) : (
        <span
          onClick={() => editing && setInlineEditing(true)}
          title={editing ? 'Click to edit' : undefined}
          style={{
            flex: 1,
            fontSize: '0.875rem',
            color: item.done ? 'var(--text-muted)' : 'var(--text-primary)',
            textDecoration: item.done ? 'line-through' : 'none',
            cursor: editing ? 'text' : 'default',
            transition: 'color var(--t-fast)',
          }}
        >
          {item.text}
        </span>
      )}

      {editing && (
        <button
          onClick={() => onRemove(item.id)}
          style={{
            width: 26, height: 26,
            borderRadius: 'var(--r1)',
            border: 'none',
            background: 'transparent',
            color: 'var(--danger)',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: 0.7,
            flexShrink: 0,
          }}
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  )
}

function TallyGroup({ n }) {
  return (
    <svg width={34} height={40} style={{ flexShrink: 0, color: 'var(--mahogany)' }}>
      {n >= 1 && <line x1={5}  y1={2} x2={5}  y2={38} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />}
      {n >= 2 && <line x1={12} y1={2} x2={12} y2={38} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />}
      {n >= 3 && <line x1={19} y1={2} x2={19} y2={38} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />}
      {n >= 4 && <line x1={26} y1={2} x2={26} y2={38} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />}
      {n >= 5 && <line x1={0}  y1={38} x2={34} y2={2} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />}
    </svg>
  )
}

function TallyMarks({ count }) {
  const groups = Math.floor(count / 5)
  const rem    = count % 5
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', minHeight: 40 }}>
      {Array.from({ length: groups }, (_, i) => <TallyGroup key={i} n={5} />)}
      {rem > 0 && <TallyGroup n={rem} />}
      {count === 0 && (
        <span style={{ color: 'var(--fog)', fontSize: '0.8rem', fontStyle: 'italic' }}>none yet</span>
      )}
    </div>
  )
}

function TallyCard() {
  const { tally, setTally, isGuest } = useApp()
  const today  = new Date().toDateString()
  const isToday = tally.date === today
  const coffee  = isToday ? tally.coffee : 0
  const tea     = isToday ? tally.tea    : 0

  function adjust(type, delta) {
    const base = isToday ? tally : { date: today, coffee: 0, tea: 0 }
    setTally({ ...base, date: today, [type]: Math.max(0, base[type] + delta) })
  }

  function resetTally() {
    setTally({ date: today, coffee: 0, tea: 0 })
  }

  const ROWS = [
    { key: 'coffee', label: 'Coffee', Icon: Coffee, count: coffee },
    { key: 'tea',    label: 'Tea',    Icon: Leaf,   count: tea    },
  ]

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 'var(--r3)',
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
          <Coffee size={16} color="var(--mahogany)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Resident Tally</span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'var(--s1)' }}>
            complimentary drinks · resets each day
          </span>
        </div>
        {!isGuest && (coffee > 0 || tea > 0) && (
          <button
            onClick={resetTally}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px', borderRadius: 'var(--r2)',
              border: '1px solid var(--border)', background: 'transparent',
              color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(184,64,64,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <RotateCcw size={11} /> Reset
          </button>
        )}
      </div>

      {/* Tally columns */}
      <div style={{ display: 'flex' }}>
        {ROWS.map(({ key, label, Icon, count }, idx) => (
          <div
            key={key}
            style={{
              flex: 1,
              padding: 'var(--s4) var(--s5)',
              borderRight: idx === 0 ? '1px solid var(--border)' : 'none',
            }}
          >
            {/* Label + big number */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--s3)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
                <Icon size={14} color="var(--text-muted)" />
                <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</span>
              </div>
              <span style={{
                fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700,
                color: count > 0 ? 'var(--mahogany)' : 'var(--fog)', lineHeight: 1,
              }}>
                {count}
              </span>
            </div>

            {/* Tally marks */}
            <div style={{ marginBottom: 'var(--s4)', minHeight: 44 }}>
              <TallyMarks count={count} />
            </div>

            {/* + / − buttons */}
            {!isGuest && (
              <div style={{ display: 'flex', gap: 'var(--s2)' }}>
                <button
                  onClick={() => adjust(key, -1)}
                  disabled={count === 0}
                  style={{
                    flex: 1, padding: 'var(--s2) 0',
                    borderRadius: 'var(--r2)', border: '1px solid var(--border)',
                    background: 'transparent',
                    color: count === 0 ? 'var(--fog)' : 'var(--text-secondary)',
                    cursor: count === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '1.25rem', fontWeight: 300,
                    transition: 'all var(--t-fast)',
                    opacity: count === 0 ? 0.35 : 1,
                  }}
                  onMouseEnter={e => count > 0 && (e.currentTarget.style.background = 'var(--latte)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  −
                </button>
                <button
                  onClick={() => adjust(key, 1)}
                  style={{
                    flex: 2, padding: 'var(--s2) 0',
                    borderRadius: 'var(--r2)', border: 'none',
                    background: 'var(--mahogany)', color: 'white',
                    cursor: 'pointer', fontSize: '1.25rem', fontWeight: 600,
                    transition: 'opacity var(--t-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  +
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Total footer */}
      {(coffee + tea) > 0 && (
        <div style={{
          padding: 'var(--s3) var(--s5)', borderTop: '1px solid var(--border)',
          background: 'var(--latte)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total complimentary today</span>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--mahogany)' }}>
            {coffee + tea}
          </span>
        </div>
      )}
    </div>
  )
}

function TodoCard() {
  const { todos, setTodos, isGuest } = useApp()
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  const pending   = todos.filter(t => !t.done)
  const completed = todos.filter(t => t.done)

  function addTodo() {
    const text = draft.trim()
    if (!text) return
    setTodos(prev => [{ id: crypto.randomUUID(), text, done: false }, ...prev])
    setDraft('')
    inputRef.current?.focus()
  }

  function toggleTodo(id) {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function deleteTodo(id) {
    setTodos(prev => prev.filter(t => t.id !== id))
  }

  function clearDone() {
    setTodos(prev => prev.filter(t => !t.done))
  }

  const rowStyle = (done, isLast) => ({
    display:      'flex',
    alignItems:   'center',
    gap:          'var(--s3)',
    padding:      'var(--s3) var(--s5)',
    borderBottom: !isLast ? '1px solid var(--border)' : 'none',
    background:   done ? 'rgba(74,124,89,0.03)' : 'transparent',
    transition:   'background var(--t-fast)',
  })

  return (
    <div style={{
      background:    'var(--surface)',
      borderRadius:  'var(--r3)',
      border:        '1px solid var(--border)',
      boxShadow:     'var(--shadow-sm)',
      overflow:      'hidden',
    }}>
      {/* Header */}
      <div style={{
        padding:        'var(--s4) var(--s5)',
        borderBottom:   '1px solid var(--border)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
          <ListChecks size={16} color="var(--mahogany)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Quick To-Do</span>
          {pending.length > 0 && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700,
              background: 'rgba(107,58,36,0.12)',
              color: 'var(--mahogany)',
              padding: '2px 8px', borderRadius: 'var(--r-pill)',
            }}>
              {pending.length} left
            </span>
          )}
        </div>
        {completed.length > 0 && (
          <button
            onClick={clearDone}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 10px',
              borderRadius: 'var(--r2)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontSize: '0.72rem',
              cursor: 'pointer',
              transition: 'all var(--t-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.borderColor = 'rgba(184,64,64,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)' }}
          >
            <Trash2 size={11} /> Clear done
          </button>
        )}
      </div>

      {/* Add input */}
      {!isGuest && (
        <div style={{
          display: 'flex', gap: 'var(--s2)',
          padding: 'var(--s3) var(--s4)',
          borderBottom: '1px solid var(--border)',
        }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="Add a task and press Enter…"
            style={{
              flex: 1,
              padding: 'var(--s2) var(--s3)',
              borderRadius: 'var(--r2)',
              border: '1px solid var(--border-strong)',
              background: 'var(--bg)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
          <button
            onClick={addTodo}
            style={{
              padding: 'var(--s2) var(--s3)',
              borderRadius: 'var(--r2)',
              border: 'none',
              background: 'var(--mahogany)',
              color: 'white',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center',
              transition: 'opacity var(--t-fast)',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            <Plus size={15} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {todos.length === 0 && (
        <div style={{ padding: 'var(--s6) var(--s5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No tasks yet add something above.
        </div>
      )}

      {/* Pending items */}
      {pending.map((t, idx) => (
        <div key={t.id} style={rowStyle(false, idx === pending.length - 1 && completed.length === 0)}>
          <button
            onClick={() => toggleTodo(t.id)}
            style={{
              width: 20, height: 20, flexShrink: 0,
              borderRadius: 6,
              border: '2px solid var(--fog)',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--t-fast)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--mahogany)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--fog)' }}
          />
          <span style={{ flex: 1, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
            {t.text}
          </span>
          {!isGuest && (
            <button
              onClick={() => deleteTodo(t.id)}
              style={{
                width: 24, height: 24,
                borderRadius: 'var(--r1)', border: 'none',
                background: 'transparent', color: 'var(--fog)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.4,
                transition: 'opacity var(--t-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--fog)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      ))}

      {/* Separator between pending and done */}
      {pending.length > 0 && completed.length > 0 && (
        <div style={{
          padding: '4px var(--s5)',
          background: 'var(--latte)',
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          fontSize: '0.68rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          color: 'var(--text-muted)',
        }}>
          Completed
        </div>
      )}

      {/* Done items */}
      {completed.map((t, idx) => (
        <div key={t.id} style={rowStyle(true, idx === completed.length - 1)}>
          <button
            onClick={() => toggleTodo(t.id)}
            style={{
              width: 20, height: 20, flexShrink: 0,
              borderRadius: 6,
              border: 'none',
              background: 'var(--success)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all var(--t-fast)',
            }}
          >
            <Check size={11} color="white" strokeWidth={3} />
          </button>
          <span style={{
            flex: 1, fontSize: '0.875rem',
            color: 'var(--text-muted)',
            textDecoration: 'line-through',
          }}>
            {t.text}
          </span>
          {!isGuest && (
            <button
              onClick={() => deleteTodo(t.id)}
              style={{
                width: 24, height: 24,
                borderRadius: 'var(--r1)', border: 'none',
                background: 'transparent', color: 'var(--fog)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0.4,
                transition: 'opacity var(--t-fast)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.4'; e.currentTarget.style.color = 'var(--fog)' }}
            >
              <X size={13} />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

const WASTE_REASONS = ['Spoiled', 'Expired', 'Overproduction', 'Prep mistake', 'Customer return', 'Dropped/damaged', 'Other']

const inputStyle = {
  padding: 'var(--s2) var(--s3)',
  borderRadius: 'var(--r2)',
  border: '1px solid var(--border-strong)',
  background: 'var(--bg)',
  color: 'var(--text-primary)',
  fontSize: '0.8rem',
  outline: 'none',
  width: '100%',
}

function LogSheetsCard() {
  const { fridgeLog, freezerLog, wasteLog, isGuest } = useApp()
  const [tab, setTab] = useState('fridge')
  const [expanded, setExpanded] = useState(false)

  const LOG_TABS = [
    { key: 'fridge',  label: 'Fridge',  Icon: Thermometer },
    { key: 'freezer', label: 'Freezer', Icon: Snowflake },
    { key: 'waste',   label: 'Waste',   Icon: Trash2 },
  ]

  const tempLog = tab === 'fridge' ? fridgeLog : tab === 'freezer' ? freezerLog : null
  const previewEntries = tab === 'waste' ? wasteLog.slice(0, 5) : tempLog.entries.slice(0, 5)
  const hiddenCount = Math.max(0, (tab === 'waste' ? wasteLog.length : tempLog.entries.length) - 5)

  return (
    <>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--r3)',
        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
            <Thermometer size={16} color="var(--mahogany)" />
            <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Log Sheets</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'var(--s1)' }}>
              fridge · freezer · waste
            </span>
          </div>
          <IconBtn onClick={() => setExpanded(true)} title="Open full log sheets">
            <Maximize2 size={14} />
          </IconBtn>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {LOG_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: 'var(--s3) var(--s4)',
                background: tab === key ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                borderBottom: tab === key ? '2px solid var(--mahogany)' : '2px solid transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s2)',
                fontWeight: tab === key ? 600 : 400,
                color: tab === key ? 'var(--mahogany)' : 'var(--text-muted)',
                fontSize: '0.875rem', transition: 'color var(--t-fast), background var(--t-fast)',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div>
          {previewEntries.length === 0 ? (
            <div style={{ padding: 'var(--s5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No entries yet open to add some.
            </div>
          ) : previewEntries.map((e, idx) => (
            <div
              key={e.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 'var(--s3)',
                padding: 'var(--s3) var(--s5)',
                borderBottom: idx < previewEntries.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', width: 74, flexShrink: 0 }}>{e.date}</span>
              {tab === 'waste' ? (
                <>
                  <span style={{ flex: 1, fontSize: '0.875rem' }} className="truncate">{e.item}</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--fog)', flexShrink: 0 }}>{e.qty} {e.unit}</span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '0.72rem', color: 'var(--fog)', width: 48, flexShrink: 0 }}>{e.time}</span>
                  <span style={{
                    flex: 1, fontWeight: 600, fontSize: '0.875rem',
                    color: e.temp > tempLog.maxTemp ? 'var(--danger)' : 'var(--text-primary)',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {e.temp}°F {e.temp > tempLog.maxTemp && <AlertTriangle size={12} />}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--fog)', flexShrink: 0 }}>{e.initials}</span>
                </>
              )}
            </div>
          ))}
        </div>

        {hiddenCount > 0 && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              width: '100%', padding: 'var(--s3) var(--s5)',
              background: 'transparent', border: 'none', borderTop: '1px solid var(--border)',
              cursor: 'pointer', fontSize: '0.8rem', color: 'var(--mahogany)', textAlign: 'center',
            }}
          >
            +{hiddenCount} more — open to see all
          </button>
        )}
      </div>

      {expanded && (
        <LogSheetsModal
          tab={tab} setTab={setTab}
          isGuest={isGuest}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  )
}

function LogSheetsModal({ tab, setTab, isGuest, onClose }) {
  const LOG_TABS = [
    { key: 'fridge',  label: 'Fridge Log',  Icon: Thermometer },
    { key: 'freezer', label: 'Freezer Log', Icon: Snowflake },
    { key: 'waste',   label: 'Waste Log',   Icon: Trash2 },
  ]

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(26,15,10,0.45)',
        zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--s5)',
      }}
    >
      <div style={{
        width: '100%', maxWidth: 680, maxHeight: '88vh',
        background: 'var(--surface)', borderRadius: 'var(--r3)', boxShadow: 'var(--shadow-xl)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: 'var(--s4) var(--s5)', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Log Sheets</span>
          <IconBtn onClick={onClose} title="Close"><X size={14} /></IconBtn>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          {LOG_TABS.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={{
                flex: 1, padding: 'var(--s3) var(--s4)',
                background: tab === key ? 'var(--surface-2)' : 'transparent',
                border: 'none',
                borderBottom: tab === key ? '2px solid var(--mahogany)' : '2px solid transparent',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--s2)',
                fontWeight: tab === key ? 600 : 400,
                color: tab === key ? 'var(--mahogany)' : 'var(--text-muted)',
                fontSize: '0.875rem', transition: 'color var(--t-fast), background var(--t-fast)',
              }}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {tab === 'waste' ? <WastePanel isGuest={isGuest} /> : <TempLogPanel type={tab} isGuest={isGuest} />}
        </div>
      </div>
    </div>
  )
}

function TempLogPanel({ type, isGuest }) {
  const { fridgeLog, setFridgeLog, freezerLog, setFreezerLog } = useApp()
  const log    = type === 'fridge' ? fridgeLog : freezerLog
  const setLog = type === 'fridge' ? setFridgeLog : setFreezerLog
  const unitLabel = type === 'fridge' ? 'Fridge' : 'Freezer'

  const now = new Date()
  const [draft, setDraft] = useState({
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    temp: '',
    initials: '',
    action: '',
  })
  const [editingMax, setEditingMax] = useState(false)
  const [maxDraft, setMaxDraft] = useState(String(log.maxTemp))

  function addEntry() {
    const temp = parseFloat(draft.temp)
    if (Number.isNaN(temp) || !draft.initials.trim()) return
    setLog(prev => ({
      ...prev,
      entries: [
        { id: crypto.randomUUID(), date: draft.date, time: draft.time, temp, initials: draft.initials.trim(), action: draft.action.trim() },
        ...prev.entries,
      ],
    }))
    setDraft({ date: now.toISOString().slice(0, 10), time: now.toTimeString().slice(0, 5), temp: '', initials: '', action: '' })
  }

  function removeEntry(id) {
    setLog(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }))
  }

  function saveMax() {
    const val = parseFloat(maxDraft)
    if (!Number.isNaN(val)) setLog(prev => ({ ...prev, maxTemp: val }))
    setEditingMax(false)
  }

  return (
    <div style={{ padding: 'var(--s4) var(--s5)' }}>
      {/* Safe max */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--s2)', marginBottom: 'var(--s4)',
        padding: 'var(--s2) var(--s3)', background: 'var(--latte)', borderRadius: 'var(--r2)',
        border: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-secondary)',
      }}>
        <AlertTriangle size={13} color="var(--mahogany)" />
        <span>Safe max for {unitLabel.toLowerCase()}:</span>
        {editingMax ? (
          <>
            <input
              autoFocus
              type="number"
              value={maxDraft}
              onChange={e => setMaxDraft(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveMax()}
              style={{ width: 60, ...inputStyle, padding: '2px 6px' }}
            />
            <button onClick={saveMax} style={{ border: 'none', background: 'var(--mahogany)', color: 'white', borderRadius: 'var(--r1)', padding: '2px 10px', fontSize: '0.72rem', cursor: 'pointer', fontWeight: 600 }}>Save</button>
          </>
        ) : (
          <>
            <strong>{log.maxTemp}°F</strong>
            {!isGuest && (
              <button onClick={() => { setMaxDraft(String(log.maxTemp)); setEditingMax(true) }} style={{ border: 'none', background: 'transparent', color: 'var(--mahogany)', cursor: 'pointer', fontSize: '0.72rem', textDecoration: 'underline' }}>
                edit
              </button>
            )}
          </>
        )}
      </div>

      {/* Add entry */}
      {!isGuest && (
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 1.4fr auto',
          gap: 'var(--s2)', marginBottom: 'var(--s4)',
          padding: 'var(--s3)', background: 'var(--latte)', borderRadius: 'var(--r2)', border: '1px solid var(--border)',
        }}>
          <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} style={inputStyle} />
          <input type="time" value={draft.time} onChange={e => setDraft(d => ({ ...d, time: e.target.value }))} style={inputStyle} />
          <input type="number" step="0.1" placeholder="°F" value={draft.temp} onChange={e => setDraft(d => ({ ...d, temp: e.target.value }))} style={inputStyle} />
          <input placeholder="Initials" value={draft.initials} onChange={e => setDraft(d => ({ ...d, initials: e.target.value }))} style={inputStyle} />
          <input placeholder="Corrective action (optional)" value={draft.action} onChange={e => setDraft(d => ({ ...d, action: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addEntry()} style={inputStyle} />
          <button
            onClick={addEntry}
            disabled={draft.temp === '' || !draft.initials.trim()}
            style={{
              padding: '0 var(--s3)', borderRadius: 'var(--r2)', border: 'none',
              background: 'var(--mahogany)', color: 'white', cursor: 'pointer', fontWeight: 600,
              opacity: (draft.temp === '' || !draft.initials.trim()) ? 0.4 : 1, display: 'flex', alignItems: 'center',
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      {log.entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--s6) 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No {unitLabel.toLowerCase()} temperatures logged yet.
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 1.4fr auto',
            gap: 'var(--s2)', padding: 'var(--s2) var(--s3)', background: 'var(--surface-2)',
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            <span>Date</span><span>Time</span><span>Temp</span><span>Initials</span><span>Action</span><span />
          </div>
          {log.entries.map((e, idx) => {
            const outOfRange = e.temp > log.maxTemp
            return (
              <div
                key={e.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1fr 80px 90px 1.4fr auto',
                  gap: 'var(--s2)', alignItems: 'center', padding: 'var(--s2) var(--s3)',
                  borderTop: idx > 0 ? '1px solid var(--border)' : 'none',
                  background: outOfRange ? 'rgba(184,64,64,0.05)' : 'transparent',
                  fontSize: '0.8rem',
                }}
              >
                <span>{e.date}</span>
                <span>{e.time}</span>
                <span style={{ fontWeight: 600, color: outOfRange ? 'var(--danger)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {e.temp}°F {outOfRange && <AlertTriangle size={12} />}
                </span>
                <span>{e.initials}</span>
                <span style={{ color: 'var(--text-muted)' }} className="truncate">{e.action || '—'}</span>
                {!isGuest ? (
                  <button
                    onClick={() => removeEntry(e.id)}
                    style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'var(--fog)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={ev => ev.currentTarget.style.color = 'var(--danger)'}
                    onMouseLeave={ev => ev.currentTarget.style.color = 'var(--fog)'}
                  >
                    <X size={13} />
                  </button>
                ) : <span />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function WastePanel({ isGuest }) {
  const { wasteLog, setWasteLog } = useApp()
  const now = new Date()
  const [draft, setDraft] = useState({
    date: now.toISOString().slice(0, 10),
    category: 'Food',
    item: '',
    qty: '',
    unit: 'each',
    reason: 'Spoiled',
    cost: '',
    initials: '',
  })

  const totalCost = wasteLog.reduce((sum, e) => sum + (Number(e.cost) || 0), 0)

  function addEntry() {
    const item = draft.item.trim()
    const qty = parseFloat(draft.qty)
    if (!item || Number.isNaN(qty) || !draft.initials.trim()) return
    setWasteLog(prev => [
      {
        id: crypto.randomUUID(),
        date: draft.date, category: draft.category, item, qty,
        unit: draft.unit.trim() || 'each', reason: draft.reason,
        cost: draft.cost === '' ? 0 : parseFloat(draft.cost) || 0,
        initials: draft.initials.trim(),
      },
      ...prev,
    ])
    setDraft(d => ({ ...d, item: '', qty: '', cost: '', initials: '' }))
  }

  function removeEntry(id) {
    setWasteLog(prev => prev.filter(e => e.id !== id))
  }

  return (
    <div style={{ padding: 'var(--s4) var(--s5)' }}>
      {/* Add entry */}
      {!isGuest && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 90px 1.3fr 70px 80px 1.1fr 80px 90px auto',
          gap: 'var(--s2)', marginBottom: 'var(--s4)',
          padding: 'var(--s3)', background: 'var(--latte)', borderRadius: 'var(--r2)', border: '1px solid var(--border)',
        }}>
          <input type="date" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} style={inputStyle} />
          <select value={draft.category} onChange={e => setDraft(d => ({ ...d, category: e.target.value }))} style={inputStyle}>
            <option>Food</option>
            <option>Drink</option>
          </select>
          <input placeholder="Item" value={draft.item} onChange={e => setDraft(d => ({ ...d, item: e.target.value }))} style={inputStyle} />
          <input type="number" step="0.1" placeholder="Qty" value={draft.qty} onChange={e => setDraft(d => ({ ...d, qty: e.target.value }))} style={inputStyle} />
          <input placeholder="Unit" value={draft.unit} onChange={e => setDraft(d => ({ ...d, unit: e.target.value }))} style={inputStyle} />
          <select value={draft.reason} onChange={e => setDraft(d => ({ ...d, reason: e.target.value }))} style={inputStyle}>
            {WASTE_REASONS.map(r => <option key={r}>{r}</option>)}
          </select>
          <input type="number" step="0.01" placeholder="$ cost" value={draft.cost} onChange={e => setDraft(d => ({ ...d, cost: e.target.value }))} style={inputStyle} />
          <input placeholder="Initials" value={draft.initials} onChange={e => setDraft(d => ({ ...d, initials: e.target.value }))} onKeyDown={e => e.key === 'Enter' && addEntry()} style={inputStyle} />
          <button
            onClick={addEntry}
            disabled={!draft.item.trim() || draft.qty === '' || !draft.initials.trim()}
            style={{
              padding: '0 var(--s3)', borderRadius: 'var(--r2)', border: 'none',
              background: 'var(--mahogany)', color: 'white', cursor: 'pointer', fontWeight: 600,
              opacity: (!draft.item.trim() || draft.qty === '' || !draft.initials.trim()) ? 0.4 : 1,
              display: 'flex', alignItems: 'center',
            }}
          >
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Table */}
      {wasteLog.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--s6) 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No waste logged yet.
        </div>
      ) : (
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r2)', overflow: 'hidden' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 70px 1.3fr 70px 1.1fr 70px 80px auto',
            gap: 'var(--s2)', padding: 'var(--s2) var(--s3)', background: 'var(--surface-2)',
            fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            <span>Date</span><span>Cat.</span><span>Item</span><span>Qty</span><span>Reason</span><span>Cost</span><span>Initials</span><span />
          </div>
          {wasteLog.map((e, idx) => (
            <div
              key={e.id}
              style={{
                display: 'grid', gridTemplateColumns: '1fr 70px 1.3fr 70px 1.1fr 70px 80px auto',
                gap: 'var(--s2)', alignItems: 'center', padding: 'var(--s2) var(--s3)',
                borderTop: idx > 0 ? '1px solid var(--border)' : 'none', fontSize: '0.8rem',
              }}
            >
              <span>{e.date}</span>
              <span style={{ color: 'var(--text-muted)' }}>{e.category}</span>
              <span className="truncate">{e.item}</span>
              <span>{e.qty} {e.unit}</span>
              <span style={{ color: 'var(--text-muted)' }} className="truncate">{e.reason}</span>
              <span>{e.cost ? `$${Number(e.cost).toFixed(2)}` : '—'}</span>
              <span>{e.initials}</span>
              {!isGuest ? (
                <button
                  onClick={() => removeEntry(e.id)}
                  style={{ width: 22, height: 22, border: 'none', background: 'transparent', color: 'var(--fog)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onMouseEnter={ev => ev.currentTarget.style.color = 'var(--danger)'}
                  onMouseLeave={ev => ev.currentTarget.style.color = 'var(--fog)'}
                >
                  <X size={13} />
                </button>
              ) : <span />}
            </div>
          ))}
        </div>
      )}

      {totalCost > 0 && (
        <div style={{
          marginTop: 'var(--s3)', padding: 'var(--s2) var(--s3)', background: 'var(--latte)',
          borderRadius: 'var(--r2)', display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem',
        }}>
          <span style={{ color: 'var(--text-muted)' }}>Total waste cost logged</span>
          <strong style={{ color: 'var(--mahogany)' }}>${totalCost.toFixed(2)}</strong>
        </div>
      )}
    </div>
  )
}

function IconBtn({ onClick, title, active, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30, height: 30,
        borderRadius: 'var(--r2)',
        border: '1px solid var(--border)',
        background: active ? 'var(--mahogany)' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--t-fast)',
      }}
    >
      {children}
    </button>
  )
}
