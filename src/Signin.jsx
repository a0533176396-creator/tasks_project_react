import React, { useEffect, useState } from 'react'
import { getUserById, addNewUser, loginUser, getUserByFullName } from './services/userService'
import './Signin.css'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

function decodeJwt(credential) {
  try {
    const payload = credential.split('.')[1]
    return JSON.parse(decodeURIComponent(atob(payload).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join('')))
  } catch (e) {
    return null
  }
}

export default function Signin({ onSignInSuccess, onNavigateToRegister }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [showRegisterOptions, setShowRegisterOptions] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  const handleLocalLogin = async (e) => {
    e.preventDefault();
    try {
      setLoginError('');
      setShowRegisterOptions(false);
      setPendingGoogleUser(null);
      const user = await loginUser(username, password);
      // try to resolve full user record (id etc.) by name
      try {
        const nameParts = (username || '').trim().split(' ')
        const firstName = nameParts[0] || ''
        const lastName = nameParts.slice(1).join(' ') || ''
        const full = await getUserByFullName(firstName, lastName)
        if (full) {
          if (onSignInSuccess) onSignInSuccess({ ...full, name: username })
        } else {
          if (onSignInSuccess) onSignInSuccess(user)
        }
      } catch (e) {
        if (onSignInSuccess) onSignInSuccess(user)
      }
    } catch(err) {
      setLoginError('שם המשתמש או הסיסמה אינם קיימים במערכת.');
      setShowRegisterOptions(true);
    }
  };

  const handleRegisterOption = async (type) => {
     if (onNavigateToRegister) {
       onNavigateToRegister({ type, pendingGoogleUser });
     }
  };

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => {
      if (window.google && CLIENT_ID && CLIENT_ID.startsWith('REPLACE') === false) {
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response) => {
            const user = decodeJwt(response.credential)
            if (user) {
              try {
                const userFromDb = await getUserById(user.sub);
                if (userFromDb) {
                  setLoginError('');
                  setShowRegisterOptions(false);
                  if (onSignInSuccess) onSignInSuccess({ ...userFromDb, name: user.name });
                } else {
                  throw new Error('User not found');
                }
              } catch (error) {
                setPendingGoogleUser({
                  googleId: user.sub,
                  email: user.email,
                  name: user.name
                });
                setLoginError('המשתמש לא נמצא במערכת לאחר הזדהות בגוגל.');
                setShowRegisterOptions(true);
              }
            }
          }
        })
        window.google.accounts.id.renderButton(
          document.getElementById('g_id_signin'),
          { theme: 'outline', size: 'large' }
        )
      }
    }
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  return (
    <div className="signin-root">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="signin-container">
          <div className="signin-card local-signin">
            <h1>כניסה לאתר</h1>
            <form onSubmit={handleLocalLogin} className="local-login-form">
              <input 
                type="text" 
                placeholder="שם משתמש" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required
              />
              <input 
                type="password" 
                placeholder="סיסמה" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">היכנס</button>
            </form>
          </div>
          <div className="signin-divider">או</div>
          <div className="signin-card google-signin">
            <h1>כניסה עם גוגל</h1>
            <div id="g_id_signin" />
          </div>
        </div>
        
        {loginError && (
          <div className="login-error-message" style={{ marginTop: '20px', textAlign: 'center', background: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', width: '100%', maxWidth: '600px'}}>
            <p>{loginError}</p>
            {showRegisterOptions && (
              <div className="register-options">
                <p>אנא בחר אחת מהאפשרויות הבאות להרשמה:</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => handleRegisterOption('חינמי')}>חינמי</button>
                  <button onClick={() => handleRegisterOption('רגיל')}>רגיל</button>
                  <button onClick={() => handleRegisterOption('פרימיום')}>פרימיום</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
