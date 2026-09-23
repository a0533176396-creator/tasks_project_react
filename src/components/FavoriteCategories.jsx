import React, { useEffect, useState, useRef } from 'react'
import './FavoriteCategories.css'
import { getAllCategories } from '../services/categoryService'
import { getUserFavorites, addFavorite, removeFavorite, createAndLinkFavoriteCategory } from '../services/favoriteService'

export default function FavoriteCategories({ user }) {
  const [allCategories, setAllCategories] = useState([])
  const [tree, setTree] = useState([])
  const [favorites, setFavorites] = useState(new Set())
  const [favoriteIdByCategory, setFavoriteIdByCategory] = useState({})
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [message, setMessage] = useState('')
  const [confirmRemove, setConfirmRemove] = useState({ show: false, id: null, name: '' })
  const [confirmAdd, setConfirmAdd] = useState({ show: false, id: null, name: '' })
  const [addingSubFor, setAddingSubFor] = useState(null)
  const [addingSubName, setAddingSubName] = useState('')
  const [addingMain, setAddingMain] = useState(false)
  const [addingMainName, setAddingMainName] = useState('')

  const refreshData = async () => {
    if (!user || !user.id) return
    setLoading(true)
    try {
      const [cats, favs] = await Promise.all([getAllCategories(), getUserFavorites(user.id)])
      setAllCategories(cats || [])
      buildTree(cats || [])
      // favs are favoriet_users_categoriesDTO { Id, user_id, category_id }
      const categorySet = new Set((favs || []).map(f => f.category_id ?? f.CategoryId ?? f.Category_id))
      const map = {}
      (favs || []).forEach(f => {
        const catId = f.category_id ?? f.CategoryId ?? f.Category_id
        const favId = f.Id ?? f.id
        if (catId != null && favId != null) map[Number(catId)] = favId
      })
      setFavorites(categorySet)
      setFavoriteIdByCategory(map)
    } catch (err) {
      console.error(err)
      setMessage('שגיאה בטעינת קטגוריות/מועדפים: ' + (err.message || err))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { refreshData() }, [user])

  const searchRef = useRef(null)

  const buildTree = (cats) => {
    const map = {}
    cats.forEach(c => {
      const id = c.Id ?? c.id
      const name = c.Name ?? c.name
      map[id] = { id, name, children: [] }
    })
    const roots = []
    cats.forEach(c => {
      const id = c.Id ?? c.id
      const parent = c.father_id ?? c.father_id ?? null
      if (parent == null) roots.push(map[id])
      else if (map[parent]) map[parent].children.push(map[id])
      else roots.push(map[id])
    })
    setTree(roots)
  }

  const toggleFavorite = async (category) => {
    if (!user || !user.id) { setMessage('אין מזהה משתמש'); return }
    const cid = category.id ?? category.Id
    // If it's currently a favorite, ask for confirmation before removing
    if (favorites.has(cid)) {
      const name = category.name ?? category.Name ?? ''
      const favId = favoriteIdByCategory[Number(cid)]
      setConfirmRemove({ show: true, favId: favId, categoryId: cid, name })
      return
    }

    // If it's not a favorite, ask for confirmation before adding
    const name = category.name ?? category.Name ?? ''
    setConfirmAdd({ show: true, id: Number(cid), name })
  }

  const handleConfirmRemove = async (confirmed) => {
    if (!confirmed) { setConfirmRemove({ show: false, id: null, name: '' }); return }
    const cid = confirmRemove.id
    if (!cid || !user || !user.id) { setConfirmRemove({ show: false, id: null, name: '' }); setMessage('אין מזהה משתמש'); return }
    try {
      await removeFavorite(user.id, cid)
      setFavorites(prev => {
        const s = new Set(prev)
        s.delete(cid)
        return s
      })
      setMessage('הקטגוריה הוסרה מהמועדפים')
      setConfirmRemove({ show: false, id: null, name: '' })
      await refreshData()
    } catch (err) {
      console.error('remove favorite failed', err)
      setMessage('שגיאה בהסרת המועדף')
      setConfirmRemove({ show: false, id: null, name: '' })
    }
  }

  const handleConfirmAdd = async (confirmed) => {
    if (!confirmed) { setConfirmAdd({ show: false, id: null, name: '' }); return }
    const cidRaw = confirmAdd.id
    const cid = Number(cidRaw)
    if (!cid || !user || !user.id) { setConfirmAdd({ show: false, id: null, name: '' }); setMessage('אין מזהה משתמש'); return }
    try {
      const created = await addFavorite(user.id, cid)
      // created should be favoriet_users_categoriesDTO with Id and category_id
      const favId = created?.Id ?? created?.id
      setFavorites(prev => {
        const s = new Set(prev)
        s.add(Number(cid))
        return s
      })
      setFavoriteIdByCategory(prev => ({ ...prev, [Number(cid)]: favId }))
      setMessage('הקטגוריה נוספה למועדפים')
      setConfirmAdd({ show: false, id: null, name: '' })
      await refreshData()
    } catch (err) {
      console.error('add favorite failed', err)
      setMessage('שגיאה בהוספת המועדף')
      setConfirmAdd({ show: false, id: null, name: '' })
    }
  }

  const handleAddByText = async () => {
    if (!query.trim() || !user || !user.id) return
    const match = allCategories.find(c => (c.Name || '').toLowerCase() === query.trim().toLowerCase())
    try {
      if (match) {
        const mid = Number(match.Id ?? match.id)
        const created = await addFavorite(user.id, mid)
        const favId = created?.Id ?? created?.id
        setFavorites(prev => {
          const s = new Set(prev)
          s.add(mid)
          return s
        })
        setFavoriteIdByCategory(prev => ({ ...prev, [mid]: favId }))
        setMessage('נוסף מהמבחר הקיים')
        await refreshData()
      } else {
        const created = await createAndLinkFavoriteCategory(user.id, query.trim(), null, null)
        const newId = Number(created?.Id ?? created?.id)
        if (newId) setFavorites(prev => {
          const s = new Set(prev)
          s.add(newId)
          return s
        })
        setMessage(newId ? 'קטגוריה מותאמת אישית נוספה כהעדפה' : 'השרת לא החזיר id')
        await refreshData()
      }
      setQuery('')
    } catch (err) { console.error(err); setMessage('שגיאה בהוספת קטגוריה') }
  }

  useEffect(() => {
    if (!query) return setSuggestions([])
    const q = query.toLowerCase()
    setSuggestions(allCategories.filter(c => (c.Name || '').toLowerCase().includes(q)).slice(0, 10))
  }, [query, allCategories])

  const renderNode = (node) => {
    const id = node.id
    const name = node.name
    return (
      <div key={`cat-${id}`} className="fc-node">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="fc-node-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              className={`fc-fav-btn ${favorites.has(id) ? 'fc-fav-on' : 'fc-fav-off'}`}
              aria-pressed={favorites.has(id)}
              title={favorites.has(id) ? 'הסר מהמועדפים' : 'הוסף למועדפים'}
              onClick={() => toggleFavorite(node)}
            >
              {favorites.has(id) ? '★' : '☆'}
            </button>
            <span className="fc-node-name">{name}</span>
          </label>
          <button
            type="button"
            onClick={() => { setAddingSubFor(id); setAddingSubName('') }}
            style={{
              fontSize: 12,
              background: '#f8f9fa',
              border: '1px solid #ddd',
              padding: '4px 8px',
              borderRadius: 4,
              color: '#222',
              cursor: 'pointer'
            }}
          >
            + <span style={{ fontSize: 11, marginLeft: 6 }}>הוספת קטגוריית משנה</span>
          </button>
        </div>
        {addingSubFor === id && (
          <div style={{ marginTop: 6, marginLeft: 16, display: 'flex', gap: 8 }}>
            <input placeholder="שם תת קטגוריה" value={addingSubName} onChange={e => setAddingSubName(e.target.value)} />
            <button
              type="button"
              disabled={!addingSubName.trim()}
              onClick={async () => {
                if (!addingSubName.trim()) return
                try {
                  // If parent is not currently a favorite, ask the user whether to add it
                  if (!favorites.has(id)) {
                    const parentObj = allCategories.find(c => (c.Id ?? c.id) === id)
                    const parentName = parentObj?.Name ?? parentObj?.name ?? ''
                    const confirmMsg = `האם ברצונך להוסיף את קטגוריית האב "${parentName}" למועדפים שלך?`
                    const addParent = window.confirm(confirmMsg)
                    if (addParent) {
                      try {
                        await addFavorite(user.id, id)
                        setFavorites(prev => new Set(prev).add(id))
                      } catch (err) {
                        console.error('failed to add parent favorite', err)
                        setMessage('שגיאה בהוספת קטגוריית האב למועדפים')
                      }
                    }
                  }

                  const created = await createAndLinkFavoriteCategory(user.id, addingSubName.trim(), id, null)
                  const newId = created?.Id ?? created?.id
                  if (newId) {
                    setMessage('תת-קטגוריה נוספה בהצלחה')
                    setAddingSubFor(null)
                    setAddingSubName('')
                    await refreshData()
                  } else {
                    setMessage('השרת לא החזיר id לאחר יצירת תת-קטגוריה')
                  }
                } catch (err) {
                  console.error('create sub failed', err)
                  setMessage('שגיאה ביצירת תת-קטגוריה: ' + (err.message || err))
                }
              }}
            >הוסף</button>
            <button type="button" onClick={() => { setAddingSubFor(null); setAddingSubName('') }}>ביטול</button>
          </div>
        )}
        {node.children && node.children.length > 0 && (
          <div className="fc-children">{node.children.map(child => renderNode(child))}</div>
        )}
      </div>
    )
  }

  return (
    <div className="favorite-page">
      {confirmRemove.show && (
        <div className="fc-modal-overlay" role="dialog" aria-modal="true">
          <div className="fc-modal">
            <h4>אימות הסרה</h4>
            <p>האם ברצונך להסיר את הקטגוריה "{confirmRemove.name}" מרשימת המועדפים שלך?</p>
            <div className="fc-modal-actions">
              <button className="fc-btn fc-btn-cancel" onClick={() => handleConfirmRemove(false)}>ביטול</button>
              <button className="fc-btn fc-btn-danger" onClick={() => handleConfirmRemove(true)}>הסר</button>
            </div>
          </div>
        </div>
      )}
      {confirmAdd.show && (
        <div className="fc-modal-overlay" role="dialog" aria-modal="true">
          <div className="fc-modal">
            <h4>אימות הוספה</h4>
            <p>האם אתה רוצה להוסיף את הקטגוריה "{confirmAdd.name}" לרשימת המועדפים שלך?</p>
            <div className="fc-modal-actions">
              <button className="fc-btn fc-btn-cancel" onClick={() => handleConfirmAdd(false)}>ביטול</button>
              <button className="fc-btn" onClick={() => handleConfirmAdd(true)}>הוסף</button>
            </div>
          </div>
        </div>
      )}
      {/* <h2>הקטגוריות המועדפות שלי</h2>
      {loading && <div>טוען...</div>}
      {message && <div className="fc-message">{message}</div>} */}

      {/* <div className="fc-top-row">
        <div className="fc-add">
          <input ref={searchRef} type="text" placeholder="הקלידו שם קטגוריה לבחירה או הוספה" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button onClick={handleAddByText}>הוסף</button>
          {suggestions.length > 0 && (
            <div className="fc-suggestions">
              {suggestions.map(s => (
                <div key={`s-${s.Id ?? s.id ?? (s.Name ?? s.name)}`} className="fc-suggestion" onClick={() => { setQuery(s.Name ?? s.name) }}>{s.Name ?? s.name}</div>
              ))}
            </div>
          )}
        </div>
        <div className="fc-existing-info"><small>ניתן לבחור מתוך העץ מצד שמאל או להקליד ולבחור מהצעות.</small></div>
      </div> */}

      <div className="fc-content">
        <div className="fc-tree" role="tree" dir="rtl">
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontWeight: 600 }}>עץ הקטגוריות</div>
            <div style={{ marginTop: 8 }}>
              {!addingMain ? (
                <button
                  type="button"
                  onClick={() => { setAddingMain(true); setAddingMainName('') }}
                  style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ccc', background: '#fff' }}
                >
                  הוסף קטגוריה ראשית
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input placeholder="שם קטגוריה ראשית" value={addingMainName} onChange={e => setAddingMainName(e.target.value)} />
                  <button
                    type="button"
                    disabled={!addingMainName.trim()}
                    onClick={async () => {
                      if (!addingMainName.trim()) return
                      try {
                        if (!user || !user.id) { setMessage('אין מזהה משתמש'); return }
                        const created = await createAndLinkFavoriteCategory(user.id, addingMainName.trim(), null, null)
                        const newId = created?.Id ?? created?.id
                        if (newId) {
                          setMessage('קטגוריה נוספה בהצלחה')
                          setAddingMain(false)
                          setAddingMainName('')
                          await refreshData()
                        } else {
                          setMessage('השרת לא החזיר id לאחר יצירת קטגוריה')
                        }
                      } catch (err) {
                        console.error('create main category failed', err)
                        setMessage('שגיאה ביצירת קטגוריה: ' + (err.message || err))
                      }
                    }}
                  >הוסף</button>
                  <button type="button" onClick={() => { setAddingMain(false); setAddingMainName('') }}>ביטול</button>
                </div>
              )}
            </div>
          </div>
          {tree.length === 0 ? <div>אין קטגוריות במערכת</div> : tree.map(root => renderNode(root))}
        </div>
        {/* <div className="fc-favs">
          <h4>העדפות נוכחיות</h4>
          <ul>{[...favorites].map(id => {
            const c = allCategories.find(x => (x.Id ?? x.id) === id)
            return <li key={`fav-${id}`}>{c ? (c.Name ?? c.name) : `קטגוריה ${id}`}</li>
          })}</ul>
        </div> */}
      </div>
    </div>
  )
}
