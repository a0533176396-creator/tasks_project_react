import React, { useState } from 'react';
import { addNewUser } from './services/userService';
import './Register.css';

export default function Register({ registerData, onRegisterSuccess, onBack }) {
  const isFree = registerData?.type === 'חינמי';
  const pendingGoogleUser = registerData?.pendingGoogleUser || null;

  // פיצול אוטומטי של השם במידה והגיע מגוגל
  const defaultFirstName = pendingGoogleUser?.name?.split(' ')[0] || '';
  const defaultLastName = pendingGoogleUser?.name?.split(' ').slice(1).join(' ') || '';
  
  const [firstName, setFirstName] = useState(defaultFirstName);
  const [lastName, setLastName] = useState(defaultLastName);
  const [email, setEmail] = useState(pendingGoogleUser?.email || '');
  const [password, setPassword] = useState('');
  
  // שדות אשראי
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // תואם למבנה ה-usersDTO בשרת לצורך יצירה של המשתמש דרך הפונקציה הקיימת בקובץ השירות
      const newUser = {
        Id: 0,
        First_name: firstName,
        Last_name: lastName,
        Email: email,
        Password: password,
        sub: pendingGoogleUser?.googleId || "local-sub",
        Wont_help: true
      };

      // במידה ויש אשראי (חבילה רגילה/פרימיום), כאן יהיה המקום לשמור אותו לפי הצרכים
      if (!isFree) {
        // ... (הנחת שמירת אשראי למערכת סליקה)
      }

      const createdUser = await addNewUser(newUser);

      // במקרה ש-addNewUser מחזיר אובייקט ריק נשתמש באובייקט שיצרנו, או במבנה המתאים
      const finalUser = Object.keys(createdUser).length > 0 ? createdUser : {
          name: `${firstName} ${lastName}`.trim(),
          ...newUser
      };
      
      onRegisterSuccess(finalUser);
    } catch (err) {
      console.error(err);
      setError('אירעה שגיאה בעת ההרשמה למערכת. ודא שכל הפרטים תקינים.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-root">
      <div className="register-container">
        <button className="back-btn" onClick={onBack}>&rarr; חזור למסך הכניסה</button>
        <h1>הרשמה למערכת</h1>
        <p className="package-info">חבילה נבחרת: <strong>{registerData?.type}</strong></p>

        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-group">
            <label>שם פרטי</label>
            <input 
              type="text" 
              value={firstName} 
              onChange={(e) => setFirstName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>שם משפחה</label>
            <input 
              type="text" 
              value={lastName} 
              onChange={(e) => setLastName(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>אימייל</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>
          <div className="form-group">
            <label>סיסמה תאפשר כניסה גם ללא חשבון גוגל</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          {!isFree && (
            <div className="credit-card-section">
              <h3>פרטי תשלום</h3>
              <div className="form-group">
                <label>מספר כרטיס אשראי</label>
                <input 
                  type="text" 
                  maxLength="16"
                  placeholder="0000 0000 0000 0000"
                  value={cardNumber} 
                  onChange={(e) => setCardNumber(e.target.value)} 
                  required 
                />
              </div>
              <div className="card-details-row">
                <div className="form-group">
                  <label>תוקף</label>
                  <input 
                    type="text" 
                    placeholder="MM/YY" 
                    maxLength="5"
                    value={expiry} 
                    onChange={(e) => setExpiry(e.target.value)} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>CVV</label>
                  <input 
                    type="text" 
                    placeholder="123" 
                    maxLength="3"
                    value={cvv} 
                    onChange={(e) => setCvv(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? 'מבצע הרשמה...' : 'הירשם עכשיו'}
          </button>
        </form>
      </div>
    </div>
  );
}