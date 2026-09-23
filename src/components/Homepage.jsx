import React from 'react'
import './Homepage.css'

function Homepage({ onSignInClick }) {
  return (
    <main className="homepage" dir="rtl">
      <div className="homepage-card">
        <h1>🎯 נהל את המשימות שלך בראש שקט – עם עוזר AI אישי</h1>
        <p className="lead">
          <strong>המקום שבו סדר, פרודוקטיביות וטכנולוגיה חכמה נפגשים. ארגן את סדר היום שלך, שמור את הקבצים
          החשובים וקבל סיוע מצ'אט AI המותאם בדיוק עבורך.</strong>
        </p>

        <h3>✨ למה דווקא אצלנו?</h3>
        <ul>
          <li>📋 <strong>ניהול משימות פשוט:</strong> ארגון וחלוקה לקטגוריות בקלות ובמהירות.</li>
          <li>🤖 <strong>סייע AI צמוד:</strong> צ'אט מובנה המכיר את העדפותיך ועוזר בניהול המשימות.</li>
          <li>📎 <strong>הכל במקום אחד:</strong> שמירה ומעקב אחר קבצים ומסמכים.</li>
          <li>🔒 <strong>התחברות בטוחה:</strong> כניסה מהירה בלחיצה אחת עם חשבון Google.</li>
        </ul>

        <div className="homepage-cta">
          <button className="google-cta" onClick={onSignInClick}>התחברות מהירה עם Google</button>
        </div>
      </div>
    </main>
  )
}

export default Homepage
