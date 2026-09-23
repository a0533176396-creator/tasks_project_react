import React, { useState, useEffect } from 'react'
import './NavBar.css'

function NavBar({ onShowSignin, onNavigateHome, onShowBlog, onShowPackages, onShowTips, onShowFavorites, currentView = 'home', currentUser, onSignOut, showSignin }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    onScroll()
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`top-nav ${scrolled ? 'scrolled' : ''}`} dir="rtl">
      <div className="nav-left">
        {currentUser ? (
          <div className="user-block">
            <span className="user-name">מחובר כ: { (currentUser.name || currentUser.userName || currentUser.email || '').split(' ')[0] || 'משתמש' }</span>
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
        <li>
          <button
            type="button"
            className={`nav-link-button ${currentView === 'tips' ? 'active' : ''}`}
            onClick={onShowTips}
          >
            טיפים לניהול משימות
          </button>
        </li>
        <li>
          <button
            type="button"
            className={`nav-link-button ${currentView === 'favorites' ? 'active' : ''}`}
            onClick={onShowFavorites}
          >
            הקטגוריות המועדפות
          </button>
        </li>
      </ul>
    </nav>
  )
}

export default NavBar
