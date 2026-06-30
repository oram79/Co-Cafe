import { useState, useEffect, useRef } from 'react'
import { BookOpen, Sun, Moon, RotateCcw, Pencil, Plus, Trash2, Check, GripVertical, Wrench, ChefHat, ChevronLeft, Maximize2, X, ClipboardList } from 'lucide-react'
import NavBar from '../components/NavBar'
import { useApp } from '../context/AppContext'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const PREVIEW_LIMIT = 4

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

      <div className="page" style={{ maxWidth: 860 }}>

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

          {/* — Order list card — */}
          <OrderListCard />
          <CleaningCard />
          <RecipeBookCard />

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

function OrderListCard() {
  const { orderList, setOrderList, isGuest } = useApp()
  const [draft, setDraft]           = useState('')
  const inputRef                    = useRef(null)

  function addItem() {
    const text = draft.trim()
    if (!text) return
    setOrderList(prev => [...prev, { id: crypto.randomUUID(), text, checked: false }])
    setDraft('')
    inputRef.current?.focus()
  }

  function toggleItem(id) {
    setOrderList(prev => prev.map(i => i.id === id ? { ...i, checked: !i.checked } : i))
  }

  function removeItem(id) {
    setOrderList(prev => prev.filter(i => i.id !== id))
  }

  function resetList() {
    setOrderList([])
  }

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
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s2)' }}>
          <ClipboardList size={16} color="var(--mahogany)" />
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Order List</span>
          {orderList.length > 0 && (
            <span style={{
              fontSize: '0.7rem', fontWeight: 700,
              background: 'var(--latte)', color: 'var(--text-secondary)',
              padding: '2px 7px', borderRadius: 'var(--r-pill)',
            }}>
              {orderList.length}
            </span>
          )}
        </div>
        {!isGuest && orderList.length > 0 && (
          <button
            onClick={resetList}
            title="Clear list"
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

      {/* Add input — admin only */}
      {!isGuest && (
        <div style={{ display: 'flex', gap: 'var(--s2)', padding: 'var(--s3) var(--s4)', borderBottom: '1px solid var(--border)' }}>
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addItem()}
            placeholder="Add item to order…"
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

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {orderList.length === 0 ? (
          <div style={{ padding: 'var(--s6) var(--s5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Your order list is empty.
          </div>
        ) : (
          orderList.map((item, idx) => (
            <div
              key={item.id}
              style={{
                display:     'flex',
                alignItems:  'center',
                gap:         'var(--s3)',
                padding:     'var(--s3) var(--s4)',
                borderBottom: idx < orderList.length - 1 ? '1px solid var(--border)' : 'none',
                background:  item.checked ? 'rgba(74,124,89,0.04)' : 'transparent',
              }}
            >
              <button
                onClick={() => toggleItem(item.id)}
                style={{
                  width: 20, height: 20,
                  borderRadius: 6,
                  border: item.checked ? 'none' : '2px solid var(--fog)',
                  background: item.checked ? 'var(--success)' : 'transparent',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all var(--t-fast)',
                }}
              >
                {item.checked && <Check size={11} color="white" strokeWidth={3} />}
              </button>
              <span style={{
                flex: 1,
                fontSize: '0.875rem',
                color: item.checked ? 'var(--text-muted)' : 'var(--text-primary)',
                textDecoration: item.checked ? 'line-through' : 'none',
                transition: 'all var(--t-fast)',
              }}>
                {item.text}
              </span>
              {!isGuest && (
                <button
                  onClick={() => removeItem(item.id)}
                  style={{
                    width: 24, height: 24,
                    borderRadius: 'var(--r1)',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--fog)',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    opacity: 0.5,
                    transition: 'opacity var(--t-fast)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--danger)' }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '0.5'; e.currentTarget.style.color = 'var(--fog)' }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ))
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

  const preview = recipes.slice(0, 4)
  const hiddenCount = Math.max(0, recipes.length - 4)

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
      }}>
        <div style={{
          padding: 'var(--s4) var(--s5)',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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

        <div>
          {recipes.length === 0 ? (
            <div style={{ padding: 'var(--s5)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No recipes yet — open to add some.
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
          {hiddenCount > 0 && (
            <button
              onClick={() => setExpanded(true)}
              style={{
                width: '100%',
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
