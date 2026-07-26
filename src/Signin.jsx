import React, { useEffect } from 'react'
import { getUserById, addNewUser } from './services/userService'
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

export default function Signin() {
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
            debugger
            console.log("Decoded user:", user); // הדפסה לדיבאגינג
            console.log("response.credential:", response.credential); // הדפסה של ה-Token גם כן
            if (user) {
              try {
                // הזדהות מול השרת מתבצעת כעת לפי המזהה הייחודי של גוגל (sub)
                console.log("Attempting to fetch user with sub:", user.sub);
                const userFromDb = await getUserById(user.sub);
                console.log("Response from getUserById:", userFromDb);
                console.log("Type of userFromDb:", typeof userFromDb);
                console.log("Is userFromDb truthy?", !!userFromDb);
                
                if (userFromDb) {
                  alert(`ברוך הבא ${user.name}`);
                } else {
                  throw new Error('User not found');
                }
              } catch (error) {
                console.error("Error in try block:", error);
                // המשתמש לא נמצא (השרת החזיר 404 או שגיאה דומה), אז ניצור אותו כעת
                try {
                  const newUser = {
                    googleId: user.sub,
                    email: user.email,
                    name: user.name
                    // תוכל להוסיף כאן שדות נוספים אם השרת דורש (למשל תמונת פרופיל: user.picture)
                  };
                  await addNewUser(newUser);
                  alert(`נרשמת בהצלחה! ברוך הבא ${user.name}`);
                } catch (addError) {
                  alert('אירעה שגיאה בעת ההרשמה למערכת');
                }
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
      <div className="signin-card">
        <h1>Sign in with Google</h1>
        <div id="g_id_signin" />
        {/* <p className="signin-note">Replace the CLIENT_ID in <strong>src/Signin.jsx</strong> with your Google OAuth client ID.</p> */}
      </div>
    </div>
  )
}
