import React, { useMemo, useState, useEffect } from 'react'
import './WeeklyCalendar.css'
import NewTask from '../NewTask'
import { getAllCategories } from '../services/categoryService'

function startOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() // 0 Sunday
  // make Sunday start: subtract current weekday number
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function formatWeekday(date) {
  return date.toLocaleDateString('he-IL', { weekday: 'long' })
}

function formatDateByCalendar(date, calendarType) {
  try {
    if (calendarType === 'hebrew') {
      // use Intl with Hebrew calendar if supported (returns numeric day/year)
      return date.toLocaleDateString('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
    }
  } catch (e) {
    // fall through to gregorian
  }
  return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
}

function formatShortDate(date, calendarType) {
  try {
    if (calendarType === 'hebrew') return date.toLocaleDateString('he-IL-u-ca-hebrew')
  } catch (e) {}
  return date.toLocaleDateString('he-IL')
}

export default function WeeklyCalendar({ user, tasks = [], weekStart, onPrevWeek, onNextWeek, onCurrentWeek, onAddTask, onGoToDate }) {
  // weekStart expected as Date
const weekStartDate = useMemo(() => {
  const baseDate = weekStart ? new Date(weekStart) : new Date();
  
  // איפוס השעות כדי למנוע זליגת ימים בגלל אזור זמן (UTC vs Local)
  baseDate.setHours(0, 0, 0, 0);
  
  return startOfWeek(baseDate, { weekStartsOn: 0 });
}, [weekStart]);
  // group tasks by date string
  const tasksByDate = useMemo(() => {
    debugger
    const map = {}
    const dateFields = ['task_Date','taskDate','dueDate','targetDate','date','createdAt','due','deadline']
    tasks.forEach(task => {
      // find the first available date-like field
      let dateVal = null
      for (const f of dateFields) {
        if (task[f]) { dateVal = task[f]; break }
      }
      if (!dateVal) return
      // handle numeric timestamps or strings
      const d = (typeof dateVal === 'number') ? new Date(dateVal) : new Date(dateVal)
      if (isNaN(d)) return

      // compute two keys: local date key and UTC date key
      const localKeyDate = new Date(d.getFullYear(), d.getMonth(), d.getDate())
      const utcKeyDate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      const localKey = localKeyDate.toDateString()
      const utcKey = utcKeyDate.toDateString()

      const pushIfMissing = (k) => {
        if (!map[k]) map[k] = []
        // avoid duplicates (by id when available)
        const exists = map[k].some(existing => (task.id && existing.id && existing.id === task.id) || (existing === task))
        if (!exists) map[k].push(task)
      }

      pushIfMissing(localKey)
      if (utcKey !== localKey) pushIfMissing(utcKey)
    })
    return map
  }, [tasks])

  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStartDate, i))

  const [showAddModal, setShowAddModal] = useState(false)
  const [addMode, setAddMode] = useState('create')
  const [taskToEdit, setTaskToEdit] = useState(null)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editPayload, setEditPayload] = useState(null)
  const [categories, setCategories] = useState([])
  const [failedImages, setFailedImages] = useState(() => new Set())
  const localDateISO = (d = new Date()) => {
    const yy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yy}-${mm}-${dd}`
  }

  const [gotoDate, setGotoDate] = useState(() => localDateISO())

  useEffect(() => {
    let mounted = true
    const loadCats = async () => {
      try {
        const cats = await getAllCategories()
        if (mounted) setCategories(Array.isArray(cats) ? cats : [])
      } catch (e) { console.error('Failed to load categories for calendar', e) }
    }
    loadCats()
    return () => { mounted = false }
  }, [])

  // when a task is selected, fetch its files from the server and attach to selectedTask.files
  useEffect(() => {
    let mounted = true
    const loadFiles = async () => {
      if (!selectedTask) return
      const tid = selectedTask.id ?? selectedTask.Id ?? selectedTask.taskId ?? selectedTask.TaskId ?? selectedTask.taskid ?? null
      if (!tid) return
      try {
        const resp = await fetch(`https://localhost:44354/api/FileTasks/GetTaskFilesByTaskId/${tid}`)
        if (!resp.ok) throw new Error('Failed to load files: ' + resp.status)
        const data = await resp.json().catch(() => [])
        if (!mounted) return
        setSelectedTask(prev => prev ? { ...prev, files: Array.isArray(data) ? data : [] } : prev)
      } catch (err) {
        console.error('Failed to load task files', err)
      }
    }
    loadFiles()
    return () => { mounted = false }
  }, [selectedTask?.id, selectedTask?.Id, selectedTask?.taskId, selectedTask?.TaskId, selectedTask?.taskid])

  // update gotoDate at local midnight (so a page left open flips to the new day)
  useEffect(() => {
    let midnightTimer = null
    let dailyInterval = null
    const scheduleMidnight = () => {
      const now = new Date()
      const next = new Date(now)
      next.setDate(now.getDate() + 1)
      next.setHours(0, 0, 0, 0)
      const ms = next.getTime() - now.getTime()
      midnightTimer = setTimeout(() => {
        setGotoDate(localDateISO())
        // after first fire, set daily interval at 24h
        dailyInterval = setInterval(() => setGotoDate(localDateISO()), 24 * 60 * 60 * 1000)
      }, ms)
    }
    scheduleMidnight()
    return () => {
      if (midnightTimer) clearTimeout(midnightTimer)
      if (dailyInterval) clearInterval(dailyInterval)
    }
  }, [])

  function numberToHebrew(num) {
    const ones = ['', 'א','ב','ג','ד','ה','ו','ז','ח','ט']
    const tens = ['', 'י','כ','ל','מ','נ','ס','ע','פ','צ']
    const hundreds = ['', 'ק','ר','ש','ת']

    // handle special cases 15 and 16
    if (num === 15) return 'טו'
    if (num === 16) return 'טז'

    let out = ''
    // hundreds (including multiples of 400)
    while (num >= 400) { out += 'ת'; num -= 400 }
    if (num >= 100) {
      const h = Math.floor(num / 100)
      if (h > 0 && h < hundreds.length) { out += hundreds[h]; num -= h*100 }
    }
    if (num >= 10) {
      const t = Math.floor(num / 10)
      if (t > 0) { out += tens[t]; num -= t*10 }
    }
    if (num > 0) {
      out += ones[num]
    }
    return out || 'א'
  }

  function formatHebrewFull(date) {
    try {
      const fmt = new Intl.DateTimeFormat('he-IL-u-ca-hebrew', { day: 'numeric', month: 'long', year: 'numeric' })
      if (fmt.formatToParts) {
        const parts = fmt.formatToParts(date)
        const dayPart = parts.find(p => p.type === 'day')?.value
        const monthPart = parts.find(p => p.type === 'month')?.value
        const yearPart = parts.find(p => p.type === 'year')?.value
        if (dayPart && monthPart && yearPart) {
          const dayNum = parseInt(dayPart, 10)
          const yearNum = parseInt(yearPart, 10)
          // convert day to hebrew letters, year subtract 5000 for common era Hebrew year notation
          const dayHeb = numberToHebrew(dayNum)
          const yearHebNum = yearNum > 5000 ? yearNum - 5000 : yearNum
          const yearHeb = numberToHebrew(yearHebNum)
          // add gershayim before last char for year if length >1
          const yearHebWithQuotes = yearHeb.length > 1 ? yearHeb.slice(0, -1) + '״' + yearHeb.slice(-1) : yearHeb + '׳'
          return `${dayHeb} ב${monthPart} ${yearHebWithQuotes}`
        }
      }
    } catch (e) {
      // ignore
    }
    // fallback
    return date.toLocaleDateString('he-IL-u-ca-hebrew')
  }

  return (
    <div className="weekly-calendar" dir="rtl">
      <div className="calendar-header">
        <div className="left-controls">
          <button className="nav-week" onClick={onPrevWeek}>שבוע קודם</button>
          <button className="nav-week" onClick={onNextWeek}>שבוע הבא</button>
          <button className="nav-week today-btn" onClick={() => { if (typeof onCurrentWeek === 'function') onCurrentWeek(); }}>השבוע הנוכחי</button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
         <button
            className="nav-week"
            onClick={() => {
              if (!gotoDate) return
              try {
                const d = new Date(gotoDate)
                d.setHours(0,0,0,0)
                if (typeof onGoToDate === 'function') onGoToDate(d)
              } catch(e) { console.error('Invalid date', e) }
            }}
          >עבור לתאריך</button>   
                 <input
            type="date"
            value={gotoDate}
            onChange={(e) => setGotoDate(e.target.value)}
            style={{ padding: '8px', borderRadius: 4, border: '1px solid #ccc' }}
          />
 
        </div>
        <div className="week-range">
          <div>{formatShortDate(days[0], 'gregorian')} — {formatShortDate(days[6], 'gregorian')}</div>
          <div style={{fontSize:12,color:'#666',marginTop:4}}>{formatHebrewFull(days[0])} — {formatHebrewFull(days[6])}</div>
        </div>
      </div>

      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }}>
          <div style={{ width: 'min(920px,96%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
            <button style={{ float: 'right', marginBottom: 8 }} onClick={() => setShowAddModal(false)}>✕</button>
            <NewTask
              user={user}
              mode={addMode}
              task={taskToEdit}
              onCreated={async (created) => { try { if (typeof onAddTask === 'function') await onAddTask(); } catch(e){console.error(e)} setShowAddModal(false); setTaskToEdit(null); }}
              onUpdated={async (updated) => { try { if (typeof onAddTask === 'function') await onAddTask(); } catch(e){console.error(e)} setShowAddModal(false); setTaskToEdit(null); }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 16 }}>
        <div className="calendar-rows" style={{ flex: 1 }}>
        {days.map((day) => {
          const key = day.toDateString()
          const dayTasks = tasksByDate[key] || []
          const gregShort = formatShortDate(day, 'gregorian')
          const hebShort = formatHebrewFull(day)
          return (
            <div className="calendar-row" key={key}>
              <div className="day-label-col">
                <div className="weekday">{formatWeekday(day)}</div>
                <div className="date-lines">
                  <div className="greg-date">{gregShort}</div>
                  <div className="heb-date">{hebShort}</div>
                </div>
              </div>
              <div className="day-tasks-col">
                {dayTasks.length === 0 ? (
                  <div className="no-tasks">אין משימות</div>
                ) : (
                  dayTasks.map(t => {
                    // determine category id and color
                    const rawCatId = t.CategoryId ?? t.categoryId ?? t.category_id ?? t.Category?.Id ?? t.category?.id ?? null
                    const catId = rawCatId != null ? String(rawCatId) : null
                    const taskColor = (t.color ?? t.Color) || (
                      (() => {
                        const found = categories.find(c => String(c.id ?? c.Id) === catId)
                        return found ? (found.color ?? found.Color ?? found.ColorCode ?? found.ColorHex ?? null) : null
                      })()
                    ) || ''

                    const cardStyle = taskColor ? { borderLeft: `6px solid ${taskColor}` } : {}

                    return (
                      <div
                        className="task-card"
                        key={t.id || t.taskId || JSON.stringify(t)}
                        style={{ ...cardStyle, cursor: 'pointer' }}
                        role="button"
                        tabIndex={0}
                        onClick={() => { setSelectedTask(t); setShowTaskModal(true); }}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { setSelectedTask(t); setShowTaskModal(true); } }}
                      >
                        <div className="task-title">{t.title || t.name || t.subject || 'משימה'}</div>
                        {t.description && <div className="task-desc">{t.description}</div>}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}
        </div>
        {/* Side panel with big Add Task button */}
        <div style={{ width: 160, display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 12 }}>
          <button
            className="add-task-side-btn"
            onClick={() => { setAddMode('create'); setTaskToEdit(null); setShowAddModal(true); }}
            style={{ padding: '14px 10px', fontSize: 16, borderRadius: 8, background: 'var(--primary-500)', color: 'var(--primary-contrast)', border: 'none', cursor: 'pointer' }}
          >הוסף משימה</button>
        </div>
      </div>
      {/* Task details modal */}
      {showTaskModal && selectedTask && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 120 }}>
          <div style={{ width: 'min(820px,96%)', maxHeight: '90vh', overflow: 'auto', background: '#fff', borderRadius: 8, padding: 18 }}>
            <button style={{ float: 'right', marginBottom: 8 }} onClick={() => { setShowTaskModal(false); setSelectedTask(null); }}>✕</button>
            <h3 style={{ marginTop: 6 }}>{selectedTask.title || selectedTask.Title || selectedTask.name || selectedTask.Name || 'פרטי משימה'}</h3>
            <div style={{ color: '#666', marginBottom: 8 }}>{selectedTask.description || selectedTask.Description || ''}</div>
            {isEditing ? (
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input value={editPayload?.title ?? (selectedTask.title || selectedTask.Title || '')} onChange={(e)=>setEditPayload(p=>({...p, title: e.target.value}))} />
                <textarea value={editPayload?.description ?? (selectedTask.description || selectedTask.Description || '')} onChange={(e)=>setEditPayload(p=>({...p, description: e.target.value}))} />
                <input type="date" value={editPayload?.date ?? ((selectedTask.Task_Date || selectedTask.task_Date || selectedTask.taskDate || selectedTask.date) ? new Date(selectedTask.Task_Date || selectedTask.task_Date || selectedTask.taskDate || selectedTask.date).toISOString().slice(0,10) : '')} onChange={(e)=>setEditPayload(p=>({...p, date: e.target.value}))} />
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={async ()=>{
                    // send update to API
                    try {
                      const url = 'https://localhost:44354/api/Tasks/UpdateTask'
                      const payload = {
                        ...selectedTask,
                        Title: editPayload?.title ?? selectedTask.Title ?? selectedTask.title,
                        description: editPayload?.description ?? selectedTask.description,
                        Task_Date: editPayload?.date ? new Date(editPayload.date).toISOString() : (selectedTask.Task_Date || selectedTask.task_Date || selectedTask.taskDate || selectedTask.date)
                      }
                      const resp = await fetch(url, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        //   'Task-Code': String(selectedTask.id ?? selectedTask.Id ?? selectedTask.taskId ?? selectedTask.TaskId || '')
                        },
                        body: JSON.stringify(payload)
                      })
                      if (!resp.ok) throw new Error('Network response ' + resp.status)
                      // optionally refresh the page data by closing and invoking parent handler if provided
                      setIsEditing(false)
                      setShowTaskModal(false)
                      setSelectedTask(null)
                      if (typeof window !== 'undefined' && window.location) {
                        // best-effort: ask user to refresh data or we could call a refresh callback if available
                        console.log('Task update succeeded')
                      }
                    } catch (err) {
                      console.error('Failed to update task', err)
                      alert('שגיאה בעדכון המשימה')
                    }
                  }} style={{ padding: '8px 10px' }}>שמור</button>
                  <button onClick={()=>{ setIsEditing(false); setEditPayload(null) }} style={{ padding: '8px 10px' }}>ביטול</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                <div><strong>תאריך:</strong> {selectedTask.Task_Date || selectedTask.task_Date || selectedTask.taskDate || selectedTask.date || selectedTask.dueDate || ''}</div>
                <div><strong>קטגוריה:</strong> {selectedTask.CategoryName || selectedTask.categoryName || selectedTask.Category?.Name || selectedTask.Category?.name || (selectedTask.CategoryId ?? selectedTask.categoryId ?? '')}</div>
              </div>
            )}
            {/* <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
              <div><strong>תאריך:</strong> {selectedTask.Task_Date || selectedTask.task_Date || selectedTask.taskDate || selectedTask.date || selectedTask.dueDate || ''}</div>
              <div><strong>קטגוריה:</strong> {selectedTask.CategoryName || selectedTask.categoryName || selectedTask.Category?.Name || selectedTask.Category?.name || (selectedTask.CategoryId ?? selectedTask.categoryId ?? '')}</div>
            </div> */}

            <div style={{ marginTop: 8 }}>
              <strong>קבצים מצורפים</strong>
              <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {(() => {
                  const rawCandidates = selectedTask.files || selectedTask.Files || selectedTask.attachments || selectedTask.Attachments || selectedTask.taskFiles || selectedTask.TaskFiles || selectedTask.filesList || selectedTask.AttachmentsList || []
                  if (!rawCandidates || rawCandidates.length === 0) return <div style={{ color: '#777' }}>אין קבצים מצורפים</div>
                  let apiBase = window.location.origin || 'https://localhost:44354'
                  try { if (import.meta && import.meta.env && import.meta.env.VITE_API_BASE) apiBase = import.meta.env.VITE_API_BASE } catch(e) {}
                  const candidates = (Array.isArray(rawCandidates) ? rawCandidates : []).map(f => {
                    const hrefRaw = f?.fileurl || f?.fileUrl || f?.url || f?.Url || f?.FileUrl || f?.path || f?.downloadUrl || f?.link || ''
                    let href = hrefRaw || ''
                    try {
                      if (href && href.startsWith('/')) href = apiBase.replace(/\/$/, '') + href
                      else if (href && !/^https?:\/\//i.test(href) && !href.startsWith('data:')) href = apiBase.replace(/\/$/, '') + '/' + href.replace(/^\/+/, '')
                    } catch(e){}
                    return { ...f, _href: href }
                  })
                  console.debug('WeeklyCalendar: normalized attachments', candidates)
                  return candidates.map((f, idx) => {
                    const name = f?.name || f?.fileName || f?.FileName || f?.filename || f?.file || f?.filename || f?.path || `קובץ ${idx + 1}`
                    const href = f?._href || ''
                    const safeHref = href ? (() => { try { return encodeURI(href) } catch(e){ return href } })() : ''
                    const isImage = safeHref && /\.(jpe?g|png|gif|bmp|webp|svg)(\?.*)?$/i.test(safeHref)
                    const isPdf = safeHref && /\.pdf(\?.*)?$/i.test(safeHref)
                    return (
                      <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <div style={{ fontWeight: 500 }}>{name}</div>
                        {isImage ? (
                          failedImages.has(safeHref) ? (
                            <div style={{ color: '#666', fontSize: 13 }}>לא ניתן להציג תמונה זו</div>
                          ) : (
                            <img
                              src={safeHref}
                              alt={name}
                              style={{ maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: 6, border: '1px solid #eee' }}
                              onError={(e) => {
                                try {
                                  const src = e && e.currentTarget && e.currentTarget.src ? e.currentTarget.src : safeHref
                                  setFailedImages(s => new Set(Array.from(s).concat([src])))
                                } catch (err) { try { setFailedImages(s => new Set(Array.from(s).concat([safeHref]))) } catch(e){} }
                              }}
                            />
                          )
                        ) : isPdf ? (
                          <iframe src={safeHref} title={name} style={{ width: '100%', height: 420, border: '1px solid #eee', borderRadius: 6 }} />
                        ) : (
                          <div style={{ color: '#666', fontSize: 13 }}>{safeHref ? 'תצוגה מקדימה לא זמינה לסוג קובץ זה' : 'אין קישור תצוגה'}</div>
                        )}
                      </div>
                    )
                  })
                })()}
              </div>
            </div>
            <div style={{ marginTop: 16, textAlign: 'right', display:'flex', gap:8, justifyContent:'flex-end' }}>
              {!isEditing && <button onClick={()=>{ setShowTaskModal(false); setAddMode('update'); setTaskToEdit(selectedTask); setShowAddModal(true); setIsEditing(false); setEditPayload(null); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#fff' }}>ערוך</button>}
              <button onClick={() => { setShowTaskModal(false); setSelectedTask(null); setIsEditing(false); setEditPayload(null); }} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #ddd', background: '#f5f5f5' }}>סגור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
