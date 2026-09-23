import React, { useState, useEffect } from 'react';
import './VirtualAssistant.css';

const VirtualAssistant = ({ currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  
  // sessionId מנהל את מזהה השיחה (0 מורה לשרת ליצור שיחה חדשה)
  const [sessionId, setSessionId] = useState(0);

  const getGreeting = () => {
    const d = new Date();
    const time = d.getHours() * 60 + d.getMinutes();
    let greeting = 'שלום';
    
    if (time >= 330 && time <= 779) { // 05:30 - 12:59
      greeting = 'בוקר טוב';
    } else if (time >= 780 && time <= 899) { // 13:00 - 14:59
      greeting = 'צהריים טובים';
    } else if (time >= 900 && time <= 1109) { // 15:00 - 18:29
      greeting = 'אחר הצהרים טובים';
    } else if (time >= 1110 && time <= 1319) { // 18:30 - 21:59
      greeting = 'ערב טוב';
    } else { // 22:00 - 05:29
      greeting = 'לילה טוב';
    }

    if (currentUser) {
      const firstName = (currentUser.name || currentUser.userName || currentUser.title || currentUser.email || '').split(' ')[0];
      if (firstName) {
        return `${greeting} ${firstName}! איך אוכל לעזור לך היום?`;
      }
    }
    return `${greeting}! איך אוכל לעזור לך היום?`;
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ id: 1, text: getGreeting(), sender: 'bot' }]);
    }
  }, [currentUser]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && messages.length <= 1) {
      setMessages([{ id: 1, text: getGreeting(), sender: 'bot' }]);
    }
  };

  const handleSend = async () => {
    if (inputValue.trim() === '' && !selectedFile) return;

    const currentText = inputValue;
    const currentFile = selectedFile;
    
    const displayMsg = currentFile ? `${currentText} (קובץ: ${currentFile.name})` : currentText;
    const newMessage = { id: Date.now(), text: displayMsg, sender: 'user' };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setSelectedFile(null);
    setIsLoading(true);

    // מזהה המשתמש: נלקח מ-currentUser, במידה ולא מחובר מועבר 0
    const activeUserId = (currentUser && (currentUser.id || currentUser.userId)) ? (currentUser.id || currentUser.userId) : 0;

    try {
      const response = await fetch('https://localhost:44354/api/Messages/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionId || 0,
          userId: Number(activeUserId),
          text: currentText
        })
      });

      if (!response.ok) {
        throw new Error(`Network response status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // במידה והשרת מחזיר את מזהה השיחה שנוצר/התעדכן
      if (data.sessionId || data.SessionId) {
        setSessionId(data.sessionId || data.SessionId);
      }
      
      setMessages(prev => [
        ...prev,
        { 
          id: Date.now() + 1, 
          text: data.reply || data.text || data.message || data.contentURL || "קיבלתי את ההודעה.", 
          sender: 'bot' 
        }
      ]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev,
        { id: Date.now() + 1, text: "אופס, אירעה שגיאה בתקשורת עם השרת.", sender: 'bot' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // התחלת שיחה חדשה: בקשת POST לשרת ליצירת סשן חדש ושמירת sessionId
  const handleNewConversation = async () => {
    const activeUserId = currentUser && (currentUser.id || currentUser.userId) ? Number(currentUser.id || currentUser.userId) : 0;
    const title = encodeURIComponent('ניסיון 1');
    setIsCreatingSession(true);
    try {
      const resp = await fetch(`https://localhost:44354/api/ChatSessions/CreateNewSession?userId=${activeUserId}&title=${title}`, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: ''
      });
      if (!resp.ok) throw new Error(`Network response status: ${resp.status}`);
      const data = await resp.json();
      // השרת עשוי להחזיר מספר פשוט או אובייקט עם שדות שונים
      const newSessionId = typeof data === 'number' ? data : (data.sessionId || data.SessionId || data.id || 0);
      setSessionId(Number(newSessionId) || 0);
      setMessages([{ id: Date.now(), text: getGreeting(), sender: 'bot' }]);
      setInputValue('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Error creating new session:', err);
      setMessages([{ id: Date.now(), text: 'לא ניתן ליצור שיחה חדשה כרגע.', sender: 'bot' }]);
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <div className="virtual-assistant-container" dir="rtl">
      {!isOpen && (
        <button className="assistant-toggle-btn" onClick={handleToggle}>
           אני רוצה שהנציג שלי יעזור לי
        </button>
      )}

      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <span>בוטי כאן בשבילך!</span>
            <button
              className="new-convo-btn"
              onClick={handleNewConversation}
              title="שיחה חדשה"
              style={{ marginInlineStart: '8px', fontSize: '18px' }}
              disabled={isCreatingSession}
              aria-busy={isCreatingSession}
            >
              {isCreatingSession ? '⏳' : '➕'}
            </button>
            <button className="close-btn" onClick={handleToggle}>&times;</button>
          </div>
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id} className={`message ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                הבוט מקליד...
              </div>
            )}
          </div>
          <div className="chat-input-area">
            <input
              type="file"
              id="file-upload"
              style={{ display: 'none' }}
              onChange={(e) => setSelectedFile(e.target.files[0])}
            />
            <label htmlFor="file-upload" className="file-upload-btn" style={{ cursor: 'pointer', padding: '0 5px', fontSize: '20px' }} title="צרף קובץ">
              📎
            </label>
            <input
              type="text"
              placeholder="הקלד כאן..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button onClick={handleSend} disabled={isLoading}>שלח</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualAssistant;