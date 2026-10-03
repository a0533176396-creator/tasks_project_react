import { useState, useEffect } from 'react'
import './App.css'
import Signin from './Signin'
import NewTask from './NewTask'
import Register from './Register'
import VirtualAssistant from './VirtualAssistant'
import Profile from './Profile'
import SideDrawer from './components/SideDrawer'
import NavBar from './components/NavBar'
import HomeLanding from './components/HomeLanding'
import Homepage from './components/Homepage'
import Pricing from './components/Pricing'
import PersonalJournal from './components/PersonalJournal'
import Tips from './components/Tips'
import FavoriteCategories from './components/FavoriteCategories'
import React from 'react'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [registerData, setRegisterData] = useState(null)
  const [showSignin, setShowSignin] = useState(false)
  const [showBlog, setShowBlog] = useState(false)
  const [showPackages, setShowPackages] = useState(false)
  const [showTips, setShowTips] = useState(false)
  const [showJournal, setShowJournal] = useState(false)
  const [showFavorites, setShowFavorites] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showDrawer, setShowDrawer] = useState(false)

  const getUserDisplayName = () =>
    currentUser?.name || currentUser?.title || currentUser?.userName || currentUser?.email || 'משתמש לא ידוע'

  // load persisted user on mount (session-only so closing tab signs out)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('currentUser')
      if (raw) {
        setCurrentUser(JSON.parse(raw))
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // initialize showFavorites from sessionStorage so it won't persist across closed tabs
  useEffect(() => {
    try {
      const v = sessionStorage.getItem('showFavorites')
      if (v === 'true') setShowFavorites(true)
      else setShowFavorites(false)
    } catch (e) {
      // ignore
    }
  }, [])

  // restore other UI flags from sessionStorage so refresh stays on the same view
  useEffect(() => {
    try {
      const sSignin = sessionStorage.getItem('showSignin')
      setShowSignin(sSignin === 'true')

      const sBlog = sessionStorage.getItem('showBlog')
      setShowBlog(sBlog === 'true')

      const sPackages = sessionStorage.getItem('showPackages')
      setShowPackages(sPackages === 'true')

      const sTips = sessionStorage.getItem('showTips')
      setShowTips(sTips === 'true')

      const sJournal = sessionStorage.getItem('showJournal')
      setShowJournal(sJournal === 'true')

      const sProfile = sessionStorage.getItem('showProfile')
      setShowProfile(sProfile === 'true')

      const sDrawer = sessionStorage.getItem('showDrawer')
      setShowDrawer(sDrawer === 'true')

      const reg = sessionStorage.getItem('registerData')
      if (reg) setRegisterData(JSON.parse(reg))
    } catch (e) {
      // ignore
    }
  }, [])

  // persist UI flags so refresh keeps the active view (session-only)
  useEffect(() => {
    try {
      sessionStorage.setItem('showSignin', showSignin ? 'true' : 'false')
      sessionStorage.setItem('showBlog', showBlog ? 'true' : 'false')
      sessionStorage.setItem('showPackages', showPackages ? 'true' : 'false')
      sessionStorage.setItem('showTips', showTips ? 'true' : 'false')
      sessionStorage.setItem('showJournal', showJournal ? 'true' : 'false')
      sessionStorage.setItem('showFavorites', showFavorites ? 'true' : 'false')
      sessionStorage.setItem('showProfile', showProfile ? 'true' : 'false')
      sessionStorage.setItem('showDrawer', showDrawer ? 'true' : 'false')
      if (registerData) sessionStorage.setItem('registerData', JSON.stringify(registerData))
      else sessionStorage.removeItem('registerData')
    } catch (e) {
      // ignore
    }
  }, [showSignin, showBlog, showPackages, showTips, showJournal, showFavorites, showProfile, showDrawer, registerData])

  // persist whether favorites editor is open so refresh stays on it (session-only)
  useEffect(() => {
    try {
      sessionStorage.setItem('showFavorites', showFavorites ? 'true' : 'false')
    } catch (e) {
      // ignore
    }
  }, [showFavorites])

  const isRTL = (text) => typeof text === 'string' && /[\u0590-\u05FF\u0600-\u06FF]/.test(text)

  let currentView
  if (!currentUser) {
    currentView = showPackages ? 'packages' : (showBlog ? 'blog' : (showTips ? 'tips' : 'home'))
  } else {
    currentView = showFavorites ? 'favorites' : (showJournal ? 'journal' : 'app')
  }

  return (
    <>
        <NavBar 
        onShowSignin={() => { setShowSignin(true); setRegisterData(null); }}
        onNavigateHome={() => { setShowSignin(false); setRegisterData(null); setShowBlog(false); setShowPackages(false); setShowJournal(false); setShowFavorites(false); }}
        onShowBlog={() => { setShowSignin(false); setRegisterData(null); setShowBlog(true); setShowPackages(false); setShowJournal(false); setShowFavorites(false); }}
        onShowPackages={() => { setShowSignin(false); setRegisterData(null); setShowPackages(true); setShowBlog(false); setShowJournal(false); setShowTips(false); setShowFavorites(false); }}
        onShowTips={() => { setShowSignin(false); setRegisterData(null); setShowTips(true); setShowBlog(false); setShowPackages(false); setShowJournal(false); setShowFavorites(false); }}
        onShowFavorites={() => { setShowSignin(false); setRegisterData(null); setShowFavorites(true); setShowBlog(false); setShowPackages(false); setShowJournal(false); setShowTips(false); }}
        onShowJournal={() => { setShowSignin(false); setRegisterData(null); setShowJournal(true); setShowFavorites(false); setShowBlog(false); setShowPackages(false); setShowTips(false); setShowDrawer(false); }}
        onShowProfile={() => { setShowProfile(true); setShowJournal(false); setShowFavorites(false); setShowBlog(false); setShowPackages(false); setShowTips(false); setShowDrawer(false); }}
        onToggleDrawer={() => setShowDrawer((s) => !s)}
        currentView={currentView}
        showSignin={showSignin}
        currentUser={currentUser}
        onSignOut={() => { setCurrentUser(null); sessionStorage.removeItem('currentUser'); setShowJournal(false); setShowBlog(false); setShowPackages(false); setShowSignin(false); setShowFavorites(false); }}
      />
      {!currentUser ? (
        registerData ? (
          <Register 
            registerData={registerData} 
            onRegisterSuccess={(user) => {
              setCurrentUser(user);
              setRegisterData(null);
            }} 
            onBack={() => setRegisterData(null)} 
          />
        ) : (
          <>
            {showPackages ? (
              // Pricing / packages view
              <React.Suspense fallback={<div>טוען...</div>}>
                <Pricing onSignIn={() => setShowSignin(true)} />
              </React.Suspense>
            ) : showBlog ? (
              <HomeLanding onSignInClick={() => { setShowSignin(true); setShowBlog(false); }} />
            ) : showTips ? (
              <Tips onSignIn={() => setShowSignin(true)} />
            ) : (
              <Homepage onSignInClick={() => setShowSignin(true)} />
            )}
            {showSignin && (
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
                <div style={{width:'90%',maxWidth:800,background:'#fff',borderRadius:10,padding:16,position:'relative'}}>
                  <button onClick={() => { setShowSignin(false); setShowBlog(false); }} style={{position:'absolute',right:12,top:8,border:'none',background:'transparent',fontSize:18,cursor:'pointer'}}>✕</button>
                  <Signin 
                    onSignInSuccess={(user) => { setCurrentUser(user); try { sessionStorage.setItem('currentUser', JSON.stringify(user)) } catch(e) {} setShowSignin(false); setShowBlog(false); setShowJournal(true); }} 
                    onNavigateToRegister={(data) => { setRegisterData(data); setShowSignin(false); }} 
                  />
                </div>
              </div>
            )}
          </>
        )
      ) : (
        <div>
            <SideDrawer
              visible={showDrawer}
              onClose={() => setShowDrawer(false)}
              onShowFavorites={() => { setShowFavorites(true); setShowProfile(false); setShowJournal(false); setShowDrawer(false); }}
              onShowJournal={() => { setShowJournal(true); setShowFavorites(false); setShowProfile(false); setShowDrawer(false); }}
              onShowProfile={() => { setShowProfile(true); setShowJournal(false); setShowFavorites(false); setShowDrawer(false); }}
              currentUser={currentUser}
            />
            {showFavorites ? (
              <FavoriteCategories user={currentUser} />
            ) : showProfile ? (
              <Profile currentUser={currentUser} onProfileSaved={(u) => { setCurrentUser(u); setShowProfile(false); setShowJournal(true); }} />
            ) : showJournal ? (
              <PersonalJournal user={currentUser} onGoToTasks={() => setShowJournal(false)} />
            ) : (
              <NewTask user={currentUser} />
            )}
        </div>
      )}
      <VirtualAssistant currentUser={currentUser} />
    </>
  )
}

export default App
