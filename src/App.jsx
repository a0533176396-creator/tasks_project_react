import { useState, useEffect } from 'react'
import './App.css'
import Signin from './Signin'
import NewTask from './NewTask'
import Register from './Register'
import VirtualAssistant from './VirtualAssistant'
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

  const getUserDisplayName = () =>
    currentUser?.name || currentUser?.title || currentUser?.userName || currentUser?.email || 'משתמש לא ידוע'

  // load persisted user on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser')
      if (raw) {
        setCurrentUser(JSON.parse(raw))
        setShowJournal(true)
      }
    } catch (e) {
      // ignore
    }
  }, [])

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
        currentView={currentView}
        showSignin={showSignin}
        currentUser={currentUser}
        onSignOut={() => { setCurrentUser(null); localStorage.removeItem('currentUser'); setShowJournal(false); setShowBlog(false); setShowPackages(false); setShowSignin(false); setShowFavorites(false); }}
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
              <Tips />
            ) : (
              <Homepage onSignInClick={() => setShowSignin(true)} />
            )}
            {showSignin && (
              <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:60}}>
                <div style={{width:'90%',maxWidth:800,background:'#fff',borderRadius:10,padding:16,position:'relative'}}>
                  <button onClick={() => { setShowSignin(false); setShowBlog(false); }} style={{position:'absolute',right:12,top:8,border:'none',background:'transparent',fontSize:18,cursor:'pointer'}}>✕</button>
                  <Signin 
                    onSignInSuccess={(user) => { setCurrentUser(user); try { localStorage.setItem('currentUser', JSON.stringify(user)) } catch(e) {} setShowSignin(false); setShowBlog(false); setShowJournal(true); }} 
                    onNavigateToRegister={(data) => { setRegisterData(data); setShowSignin(false); }} 
                  />
                </div>
              </div>
            )}
          </>
        )
      ) : (
        <div>
            {showFavorites ? (
              <FavoriteCategories user={currentUser} />
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
