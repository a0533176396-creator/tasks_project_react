import React, { useState, useEffect } from 'react'
import './Profile.css'
import { getUserById, updateProfile } from './services/userService'

export default function Profile({ currentUser, onProfileSaved }) {
  const [user, setUser] = useState({})
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [aiHelp, setAiHelp] = useState(false)
  const [pkg, setPkg] = useState('Free')
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarDataUrl, setAvatarDataUrl] = useState(null)
  const [saving, setSaving] = useState(false)
  const userId = currentUser?.Id || currentUser?.id || currentUser?.Id || currentUser?.id || null

  useEffect(() => {
    const load = async () => {
      if (!currentUser) return
      try {
        // prefer full fetch by id if available
        if (userId) {
          const full = await getUserById(userId).catch(() => null)
          if (full) {
            setUser(full)
            setFirstName(full.FirstName || full.firstName || full.name?.split(' ')[0] || '')
            setLastName(full.LastName || full.lastName || full.name?.split(' ').slice(1).join(' ') || '')
            setAiHelp(Boolean(full.WantAI || full.Wont_help === false || full.WantHelp))
            setPkg(full.Package || full.package || 'Free')
            if (full.AvatarBase64) setAvatarDataUrl(full.AvatarBase64)
            return
          }
        }

        // fallback to provided object
        setUser(currentUser)
        setFirstName(currentUser.FirstName || currentUser.firstName || (currentUser.name || '').split(' ')[0] || '')
        setLastName(currentUser.LastName || currentUser.lastName || (currentUser.name || '').split(' ').slice(1).join(' ') || '')
        setAiHelp(Boolean(currentUser.WantAI || currentUser.Wont_help === false || currentUser.WantHelp))
        setPkg(currentUser.Package || currentUser.package || 'Free')
        if (currentUser.AvatarBase64) setAvatarDataUrl(currentUser.AvatarBase64)
      } catch (e) {
        // ignore
      }
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser])

  useEffect(() => {
    if (!avatarFile) return
    const reader = new FileReader()
    reader.onload = (e) => setAvatarDataUrl(e.target.result)
    reader.readAsDataURL(avatarFile)
  }, [avatarFile])

  const initials = () => {
    const a = (firstName || '').charAt(0) || ''
    const b = (lastName || '').charAt(0) || ''
    return (a + b).toUpperCase()
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...user,
        FirstName: firstName,
        LastName: lastName,
        WantAI: !!aiHelp,
        Package: pkg,
      }
      if (avatarDataUrl) payload.AvatarBase64 = avatarDataUrl

      const updated = await updateProfile(payload)
      // try to merge returned data
      const merged = { ...(user || {}), ...(updated || payload) }
      try { sessionStorage.setItem('currentUser', JSON.stringify(merged)) } catch(e) {}
      if (onProfileSaved) onProfileSaved(merged)
      alert('הפרופיל נשמר בהצלחה')
    } catch (e) {
      console.error(e)
      alert('שגיאה בשמירת הפרופיל')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-page" dir="rtl">
      <h2>ניהול פרופיל אישי</h2>
      <div className="profile-form">
        <div className="avatar-section">
          <div className="avatar-preview">
            {avatarDataUrl ? (
              <img src={avatarDataUrl} alt="avatar" />
            ) : (
              <div className="initials">{initials()}</div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={(e) => setAvatarFile(e.target.files[0])} />
          <div className="avatar-hint">ניתן להעלות תמונה או להשתמש באותיות השם</div>
        </div>

        <div className="fields">
          <label>שם פרטי</label>
          <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />

          <label>שם משפחה</label>
          <input value={lastName} onChange={(e) => setLastName(e.target.value)} />

          <label>רוצה עזרה מ-AI?</label>
          <div className="toggle-row">
            <label className="switch">
              <input type="checkbox" checked={aiHelp} onChange={(e) => setAiHelp(e.target.checked)} />
              <span className="slider" />
            </label>
            <span className="toggle-label">{aiHelp ? 'כן' : 'לא'}</span>
          </div>

          <label>חבילה</label>
          <select value={pkg} onChange={(e) => setPkg(e.target.value)}>
            <option>Free</option>
            <option>Pro</option>
            <option>Premium</option>
          </select>

          <div className="actions">
            <button onClick={handleSave} disabled={saving}>{saving ? 'שומר...' : 'שמור שינויים'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
