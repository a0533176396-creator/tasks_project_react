import { useState } from 'react'
import './App.css'
import Signin from './Signin'
import NewTask from './NewTask'
import Register from './Register'

function App() {
  const [currentUser, setCurrentUser] = useState(null)
  const [registerData, setRegisterData] = useState(null)

  return (
    <>
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
          <Signin 
            onSignInSuccess={(user) => setCurrentUser(user)} 
            onNavigateToRegister={(data) => setRegisterData(data)} 
          />
        )
      ) : (
        <div>
          <header style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', backgroundColor: '#f8f9fa', marginBottom: '20px' }}>
            <span>מחובר כ: {currentUser.name || currentUser.title || currentUser.userName || currentUser.email || 'משתמש לא ידוע'}</span>
            <button onClick={() => setCurrentUser(null)}>התנתק</button>
          </header>
          <NewTask user={currentUser} />
        </div>
      )}
    </>
  )
}

export default App
