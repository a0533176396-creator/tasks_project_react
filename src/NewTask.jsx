import React, { useEffect, useState, useRef } from 'react'
import './NewTask.css'
import { getAllCategories, createCategory } from './services/categoryService'

export default function NewTask({ user, onCreated }) {
  const [taskName, setTaskName] = useState('')
  const [description, setDescription] = useState('')
  const [allCategories, setAllCategories] = useState([])
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().slice(0,16))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [addingMain, setAddingMain] = useState('')
  const [addingSubFor, setAddingSubFor] = useState(null)
  const [addingSubName, setAddingSubName] = useState('')
  const [createMessage, setCreateMessage] = useState('')
  const tempIdRef = useRef(-1)

  const API_BASE = 'https://localhost:44354/api'

  const loadCategories = async () => {
    try {
      const cats = await getAllCategories()
      setAllCategories(cats || [])
    } catch (e) { console.error('load categories', e); setAllCategories([]) }
  }

  useEffect(() => { loadCategories() }, [])

  const handleCreateMain = async () => {
    if (!addingMain.trim()) return
    // optimistic add: show immediately with temporary negative id
    const tempId = tempIdRef.current--
    const tempCat = { Id: tempId, Name: addingMain, father_id: null }
    setAllCategories(prev => [tempCat, ...prev])
    setSelectedCategoryId(String(tempId))
    setAddingMain('')
    setCreateMessage('נוסף זמנית ברשימה...')
    try {
      const created = await createCategory(addingMain.trim(), null)
      // replace temp with created (if created returned)
      const newId = created?.Id ?? created?.id
      setAllCategories(prev => prev.map(c => ((c.Id ?? c.id) === tempId ? (created || { Id: newId, Name: addingMain }) : c)))
      if (newId) setSelectedCategoryId(String(newId))
      setCreateMessage('הקטגוריה הראשית נוספה בהצלחה')
    } catch (e) {
      console.error('create main category failed', e)
      // remove temp
      setAllCategories(prev => prev.filter(c => (c.Id ?? c.id) !== tempId))
      setError('שגיאה ביצירת קטגוריה ראשית: ' + (e.message || e))
    }
  }

  const handleCreateSub = async (parentId) => {
    if (!addingSubName.trim()) return
    // optimistic add for subcategory
    const tempId = tempIdRef.current--
    const tempCat = { Id: tempId, Name: addingSubName, father_id: parentId }
    setAllCategories(prev => [tempCat, ...prev])
    setSelectedCategoryId(String(tempId))
    setAddingSubName('')
    setAddingSubFor(null)
    setCreateMessage('תת-הקטגוריה נוספה זמנית...')
    try {
      const created = await createCategory(addingSubName.trim(), parentId)
      const newId = created?.Id ?? created?.id
      setAllCategories(prev => prev.map(c => ((c.Id ?? c.id) === tempId ? (created || { Id: newId, Name: addingSubName, father_id: parentId }) : c)))
      if (newId) setSelectedCategoryId(String(newId))
      setCreateMessage('תת-הקטגוריה נוספה בהצלחה')
    } catch (e) {
      console.error('create subcategory failed', e)
      setAllCategories(prev => prev.filter(c => (c.Id ?? c.id) !== tempId))
      setError('שגיאה ביצירת תת קטגוריה: ' + (e.message || e))
    }
  }

  const parentList = allCategories.filter(c => (c.father_id ?? c.fatherId) == null)
  const childrenOf = (pid) => allCategories.filter(c => String(c.father_id ?? c.fatherId) === String(pid))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!user || (!user.id && !user.Id)) { setError('אין מזהה משתמש'); return }
    const uid = user.id ?? user.Id
    const cat = allCategories.find(c => (c.Id ?? c.id)?.toString() === selectedCategoryId?.toString()) || {}
    const dto = {
      Id: 0,
      Title: taskName || 'משימה',
      Task_Date: new Date(taskDate).toISOString(),
      user_id: uid,
      user_first_name: user.user_first_name ?? user.firstName ?? user.name?.split?.(' ')?.[0] ?? '',
      user_last_name: user.user_last_name ?? user.lastName ?? user.name?.split?.(' ')?.slice(1).join(' ') ?? '',
      CategoryId: parseInt(selectedCategoryId || (cat.Id ?? cat.id) || 0),
      CategoryName: cat.Name ?? cat.name ?? '',
      color: cat.Color ?? cat.color ?? ''
    }

    try {
      setLoading(true)
      const resp = await fetch(`${API_BASE}/Tasks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto)
      })
      const text = await resp.text()
      let body
      try { body = text ? JSON.parse(text) : null } catch { body = text }
      if (!resp.ok) throw new Error(`${resp.status} - ${typeof body === 'string' ? body : JSON.stringify(body)}`)
      if (typeof onCreated === 'function') onCreated(body)
      setTaskName('')
      setDescription('')
      setSelectedCategoryId('')
    } catch (err) {
      console.error('create task error', err)
      setError(err.message || 'שגיאה ביצירת המשימה')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ direction: 'rtl' }}>
      <div className="new-category-panel" style={{ padding: 12, border: '1px dashed #ccc', marginBottom: 12 }}>
        <div style={{ fontSize: 14, color: '#666' }}>הוסף קטגוריה ראשית</div>
        <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
          <input placeholder="שם קטגוריה" value={addingMain} onChange={e => setAddingMain(e.target.value)} />
          <button type="button" onClick={handleCreateMain}>הוסף</button>
        </div>
        {createMessage && <div style={{ color: 'green', marginTop: 8 }}>{createMessage}</div>}
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 8 }}><strong>קטגוריות</strong></div>
          <div className="category-tree">
            {parentList.map(p => (
              <div key={p.Id ?? p.id} style={{ marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div>{p.Name ?? p.name}</div>
                </div>
                <div style={{ marginLeft: 16 }}>
                  {childrenOf(p.Id ?? p.id).map(ch => (
                    <div key={ch.Id ?? ch.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div>{ch.Name ?? ch.name}</div>
                    </div>
                  ))}
                </div>
                {addingSubFor === (p.Id ?? p.id) && (
                  <div style={{ marginTop: 6, marginLeft: 16, display: 'flex', gap: 8 }}>
                    <input placeholder="שם תת קטגוריה" value={addingSubName} onChange={e => setAddingSubName(e.target.value)} />
                    <button type="button" onClick={() => handleCreateSub(p.Id ?? p.id)}>הוסף</button>
                    <button type="button" onClick={() => { setAddingSubFor(null); setAddingSubName('') }}>ביטול</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <form onSubmit={handleSubmit}>
            <div>
              <label>כותרת</label>
              <input value={taskName} onChange={e => setTaskName(e.target.value)} required />
            </div>
            <div>
              <label>תיאור</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} />
            </div>
            <div>
              <label>תאריך/שעה</label>
              <input type="datetime-local" value={taskDate} onChange={e => setTaskDate(e.target.value)} />
            </div>
            <div>
              <label>קטגוריה</label>
              <select value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)}>
                <option value=''>— בחר —</option>
                {allCategories.map(c => (
                  <option key={c.Id ?? c.id} value={c.Id ?? c.id}>{c.Name ?? c.name}</option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <button type="submit" disabled={loading}>{loading ? 'שומר...' : 'צור משימה'}</button>
              {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
