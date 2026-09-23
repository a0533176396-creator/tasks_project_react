import React from 'react'
import './Pricing.css'

function Card({ title, subtitle, price, features, ctaText, onCta }) {
  return (
    <div className="pricing-card">
      <h3>{title}</h3>
      <p className="subtitle">{subtitle}</p>
      <div className="price">{price}</div>
      <ul className="features">
        {features.map((f, i) => <li key={i}>{f}</li>)}
      </ul>
      <button className="card-cta" onClick={onCta}>{ctaText}</button>
    </div>
  )
}

export default function Pricing({ onSignIn }) {
  return (
    <main className="pricing-root" dir="rtl">
      <div className="pricing-intro">
        <h1>💳 בחר את החבילה המתאימה לך</h1>
        <p>סדר ויעילות מתחילים בבחירת המסלול הנכון. בחר את החבילה שמתאימה לקצב העבודה שלך ושדרג בכל עת.</p>
      </div>
      <div className="pricing-grid">
        <Card
          title="🔹 חבילה בסיסית"
          subtitle="למתחילים שרוצים לעשות סדר ביום-יום"
          price="₪0 / חינם"
          features={[
            'כמות משימות: עד 5 משימות פעילות',
            'העלאת קבצים: עד 10 קבצים',
            "צ'אט AI מובנה: כלול (בסיסי)",
            'התחברות מהירה: דרך Google'
          ]}
          ctaText="התחל בחינם"
          onCta={() => onSignIn && onSignIn()}
        />

        <Card
          title="⚡ חבילה מתקדמת"
          subtitle="למשתמשים קבועים שצריכים יותר מקום וגמישות"
          price="₪29 / לחודש"
          features={[
            'כמות משימות: עד 30 משימות',
            'העלאת קבצים: עד 50 קבצים',
            "צ'אט AI מובנה: כלול (עם זיכרון מורחב)",
            'התחברות מהירה: דרך Google',
            'תמיכה במייל: מענה מועדף'
          ]}
          ctaText="בחרו במסלול המתקדם"
          onCta={() => onSignIn && onSignIn()}
        />

        <Card
          title="👑 חבילת פרימיום"
          subtitle="למקצוענים שרוצים שקט נפשי ועבודה ללא גבולות"
          price="₪59 / לחודש"
          features={[
            'כמות משימות: ללא הגבלה',
            'העלאת קבצים: ללא הגבלה',
            "צ'אט AI מובנה: ללא הגבלת הודעות + התאמה אישית מלאה",
            'התחברות מהירה: דרך Google',
            'תמיכה VIP: מענה מהיר בראש סדר העדיפויות'
          ]}
          ctaText="שדרגו לפרימיום"
          onCta={() => onSignIn && onSignIn()}
        />
      </div>
    </main>
  )
}
