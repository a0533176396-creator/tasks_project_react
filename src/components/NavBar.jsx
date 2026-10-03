import React, { useState, useEffect } from 'react'
import './NavBar.css'

function NavBar({ onShowSignin, onNavigateHome, onShowBlog, onShowPackages, onShowTips, onShowFavorites, onShowJournal, onShowProfile, onToggleDrawer, currentView = 'home', currentUser, onSignOut, showSignin }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const displayName = (() => {
    if (!currentUser) return ''
    // prefer DB fields: first_name / last_name, then variants, then email
    const first = currentUser.first_name || currentUser.FirstName || currentUser.firstName || ''
    const last = currentUser.last_name || currentUser.LastName || currentUser.lastName || ''
    const full = (first || last) ? `${first}${last ? ' ' + last : ''}`.trim() : (currentUser.userName || currentUser.name || currentUser.email || '')
    return full || 'משתמש'
  })()

  return (
    <nav className={`top-nav ${scrolled ? 'scrolled' : ''}`} dir="rtl">
      <div className="nav-left">
        {currentUser ? (
          <div className="user-block">
            <span className="user-name">הנך מחובר/ת כ: {displayName}</span>
            <button className="signout-link" onClick={onSignOut}>התנתקות</button>
          </div>
        ) : (
          <button className={`signin-link ${showSignin ? 'active' : ''}`} onClick={onShowSignin}>הזדהות</button>
        )}
      </div>
      <ul className="nav-links">
        <li>
          <button
            type="button"
            className={`nav-link-button ${currentView === 'home' ? 'active' : ''}`}
            onClick={onNavigateHome}
          >
            ראשי
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`nav-link-button ${currentView === 'blog' ? 'active' : ''}`}
            onClick={onShowBlog}
          >
            בלוג
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`nav-link-button ${currentView === 'packages' ? 'active' : ''}`}
            onClick={onShowPackages}
          >
            החבילות שלנו
          </button>
        </li>
        {/* Removed: journal and profile links — moved to side drawer */}
        <li>
          <button
            type="button"
            className={`nav-link-button ${currentView === 'tips' ? 'active' : ''}`}
            onClick={onShowTips}
          >
            טיפים לניהול משימות
          </button>
        </li>
        {/* Removed: favorites link — moved to side drawer */}
      </ul>
      {currentUser && (
        <button className="drawer-toggle" onClick={onToggleDrawer} aria-label="פתח תפריט">☰</button>
      )}
    </nav>
  )
}

export default NavBar
