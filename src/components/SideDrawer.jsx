import React from 'react'
import './SideDrawer.css'

export default function SideDrawer({ visible, onClose, onShowFavorites, onShowJournal, onShowProfile, currentUser }) {
  if (!visible) return null

  const stop = (e) => e.stopPropagation()

  return (
    <div className="drawer-overlay" onClick={onClose} dir="rtl">
      <div className="side-drawer" onClick={stop}>
        <div className="drawer-header">
          <h3>תפריט</h3>
          <button className="drawer-close" onClick={onClose}>✕</button>
        </div>

        <div className="drawer-links">
          <button className="drawer-link" onClick={() => { onShowFavorites(); onClose(); }}>קטגוריות מותאמות אישית</button>
          <button className="drawer-link" onClick={() => { onShowJournal(); onClose(); }}>לוח משימות</button>
          {currentUser && (
            <button className="drawer-link" onClick={() => { onShowProfile(); onClose(); }}>עריכת פרופיל</button>
          )}
        </div>
      </div>
    </div>
  )
}
