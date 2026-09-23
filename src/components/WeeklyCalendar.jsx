import React, { useMemo, useState, useEffect } from 'react'
import './WeeklyCalendar.css'
import NewTask from '../NewTask'

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

export default function WeeklyCalendar({ user, tasks = [], weekStart, onPrevWeek, onNextWeek, onCurrentWeek, onAddTask }) {
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
          <button className="nav-week add-task-btn" onClick={() => setShowAddModal(true)}>הוסף משימה</button>
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
            <NewTask user={user} onCreated={async (created) => { try { if (typeof onAddTask === 'function') await onAddTask(); } catch(e){console.error(e)} setShowAddModal(false) }} />
          </div>
        </div>
      )}

      <div className="calendar-rows">
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
                  dayTasks.map(t => (
                    <div className="task-card" key={t.id || t.taskId || JSON.stringify(t)}>
                      <div className="task-title">{t.title || t.name || t.subject || 'משימה'}</div>
                      {t.description && <div className="task-desc">{t.description}</div>}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
