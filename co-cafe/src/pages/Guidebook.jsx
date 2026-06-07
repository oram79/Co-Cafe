import { useState, useEffect } from 'react'
import { BookOpen, Sun, Moon, RotateCcw, Pencil, Plus, Trash2, Check, GripVertical, Coffee, Wrench, Phone, Maximize2, X } from 'lucide-react'
import NavBar from '../components/NavBar'
import { useApp } from '../context/AppContext'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PREVIEW_LIMIT = 4

export default function Guidebook() {
  const { checklists: lists, setChecklists: setLists } = useApp()
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

      <div className="page" style={{ maxWidth: 860 }}>

        <div style={{ marginBottom: 'var(--s6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s3)', marginBottom: 'var(--s2)' }}>
            <BookOpen size={22} color="var(--mahogany)" />
            <h2 style={{ fontFamily: 'var(--font-display)' }}>Guidebook</h2>
          </div>
        </div>

        {/* 2×2 grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 'var(--s4)',
          alignItems: 'start',
        }}>

          {/* — Checklist card (condensed) — */}
          <div style={{
            background: 'var(--surface)',
            borderRadius: 'var(--r3)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: 'var(--s4) var(--s5)',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Open & Close Checklists</span>
              <IconBtn onClick={() => setExpanded(true)} title="Open full view">
                <Maximize2 size={14} />
              </IconBtn>
            </div>

            {tabs}
            {progressBar}

            {/* Preview: first PREVIEW_LIMIT tasks */}
            <div>
              {currentList.length === 0 && (
                <div style={{
                  padding: 'var(--s5)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '0.875rem',
                }}>
                  No tasks yet — open to add some.
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

              {hiddenCount > 0 && (
                <button
                  onClick={() => setExpanded(true)}
                  style={{
                    width: '100%',
                    padding: 'var(--s3) var(--s5)',
                    borderTop: '1px solid var(--border)',
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
          </div>

          {/* — Coming soon cards — */}
          <ComingSoonCard icon={Coffee} title="Espresso Dialing-In Guide" />
          <ComingSoonCard icon={Wrench} title="Cleaning & Maintenance Log" />
          <ComingSoonCard icon={Phone} title="Emergency Contacts & Procedures" />

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
                        No tasks yet — click <Pencil size={12} style={{ display: 'inline', marginBottom: -2 }} /> to add some.
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

function ComingSoonCard({ icon: Icon, title }) {
  return (
    <div style={{
      background: 'var(--surface)',
      borderRadius: 'var(--r3)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: 'var(--s4) var(--s5)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--s3)',
      }}>
        <Icon size={16} color="var(--mahogany)" />
        <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</span>
      </div>
      <div style={{
        padding: 'var(--s6) var(--s5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 120,
      }}>
        <span style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: 'var(--fog)',
          background: 'var(--latte)',
          padding: '3px 10px',
          borderRadius: 'var(--r-pill)',
        }}>
          Coming soon
        </span>
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
