import React, { useEffect, useState } from 'react'
import './PersonalJournal.css'
import WeeklyCalendar from './WeeklyCalendar'

export default function PersonalJournal({ user, onGoToTasks }) {
console.log(user)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  // אתחול תאריך ההתחלה של השבוע עם איפוס שעות למניעת בעיות אזור זמן
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })

  // fetchTasks is exposed so we can re-use it after adding a new task
  const fetchTasks = async () => {
    debugger // הדיבאגר ייעצר כאן ברגע שהקומפוננטה תעלה ויש אובייקט user תקין

    if (!user) {
      console.log('Fetch skipped: user is null or undefined')
      return
    }

    const userId = user.id || user.userId || user.sub || 0
    if (!userId) {
      console.log('Fetch skipped: userId is missing', user)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const url = `https://localhost:44354/api/Tasks/GetTasksByUserId/${userId}`
      console.log('Fetching tasks URL:', url, 'userId:', userId)

      const resp = await fetch(url)
      if (!resp.ok) throw new Error(`Network response ${resp.status}`)

      const data = await resp.json()
      console.log('Tasks fetch status:', resp.status, 'raw payload:', data)

      // Normalize tasks: pick the likely date field and create a single local-midnight dateKey
      const normalized = (Array.isArray(data) ? data : []).map(t => {
        const raw = t.task_Date || t.taskDate || t.date || t.dueDate || t.due || t.TaskDate
        const d = raw ? new Date(raw) : null
        if (!d || isNaN(d.getTime())) return { ...t, _rawDate: raw, _dateObj: null, dateKey: null }
        const localDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()) // local midnight
        return { ...t, _rawDate: raw, _dateObj: d, dateKey: localDay.toDateString() }
      })

      // Remove duplicates by id if present (some payloads might include same task in different date forms)
      const uniqueByIdMap = normalized.reduce((acc, t) => {
        const id = t.id ?? t.ID ?? t.taskId ?? t.TaskId
        if (id != null) {
          if (!acc[id]) acc[id] = t
        } else {
          // keep items without id using a generated key
          const key = JSON.stringify([t._rawDate, t.title || t.Name || t.name || ''])
          if (!acc[key]) acc[key] = t
        }
        return acc
      }, {})

      const unique = Object.values(uniqueByIdMap)
      console.log('Normalized tasks (first 10):', unique.slice(0, 10))

      setTasks(unique)
    } catch (err) {
      console.error('Error fetching tasks:', err)
      setError('לא ניתן לטעון משימות כעת.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTasks() }, [user])

  // Provide a simple refresh handler for when child components create a task
  const handleAddTask = async () => {
    await fetchTasks()
  }

  const prevWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() - 7)
    setWeekStart(d)
  }

  const nextWeek = () => {
    const d = new Date(weekStart)
    d.setDate(d.getDate() + 7)
    setWeekStart(d)
  }

  const currentWeek = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    setWeekStart(d)
  }

  return (
    <main className="personal-journal" dir="rtl">
      <div style={{ maxWidth: 1200, margin: '18px auto 60px' }}>
        {loading && <div style={{ textAlign: 'center' }}>טוען משימות...</div>}
        {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
        {!loading && !error && (
          <WeeklyCalendar
            tasks={tasks}
            weekStart={weekStart}
            onPrevWeek={prevWeek}
            onNextWeek={nextWeek}
            onCurrentWeek={currentWeek}
          />
        )}
      </div>
    </main>
  )
}