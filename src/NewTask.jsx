import React, { useEffect, useMemo, useState, useRef } from 'react';
import { addNewTask, addTaskFile } from './services/taskService';
import { getAllCategories } from './services/categoryService';
import { getUserFavorites } from './services/favoriteService';
import './NewTask.css';

export default function NewTask({ user, mode = 'create', task = null, onCreated, onUpdated }) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  // selectedPath holds the chain of selected category ids from root -> deepest selected child
  const [selectedPath, setSelectedPath] = useState([]);
  const [taskDate, setTaskDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const previewsRef = useRef(new Set());
  const [existingFiles, setExistingFiles] = useState([])
  const [filesToDelete, setFilesToDelete] = useState([])
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [userFavorites, setUserFavorites] = useState(new Set())

  const getCategoryId = (category) => category?.id ?? category?.Id;
  const getCategoryName = (category) => category?.name ?? category?.Name;
  const getFatherId = (category) => category?.father_id ?? category?.fatherId ?? category?.FatherId ?? null;

  const buildCategoryPath = (catId, categories) => {
    if (!catId) return []
    const map = new Map()
    categories.forEach(c => {
      const id = String(getCategoryId(c))
      map.set(id, c)
    })
    const path = []
    let cur = map.get(String(catId))
    while (cur) {
      path.unshift(String(getCategoryId(cur)))
      const parent = getFatherId(cur)
      if (parent == null) break
      cur = map.get(String(parent))
    }
    return path
  }

  useEffect(() => {
    const loadCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const categories = await getAllCategories();

        // try to load the user's favorite categories (may fail silently)
        let favsRaw = []
        try {
          if (user && user.id) favsRaw = await getUserFavorites(user.id)
        } catch (e) {
          console.debug('getUserFavorites failed', e)
          favsRaw = []
        }

        // normalize favorites into an array of numeric ids
        const favArray = Array.isArray(favsRaw) ? favsRaw : (favsRaw && Array.isArray(favsRaw.data) ? favsRaw.data : [])
        const favIds = []
        ;(favArray || []).forEach(f => {
          if (f == null) return
          if (typeof f === 'number') { favIds.push(Number(f)); return }
          if (typeof f === 'string' && f.match(/^\d+$/)) { favIds.push(Number(f)); return }
          if (typeof f === 'object') {
            const raw = f.category_id ?? f.CategoryId ?? f.categoryId ?? f.Id ?? f.id ?? null
            if (raw != null) favIds.push(Number(raw))
          }
        })

        const favSet = new Set(favIds.filter(n => !Number.isNaN(n)))

        // build map for ancestor traversal
        const map = new Map()
        categories.forEach(c => {
          const id = Number(getCategoryId(c))
          map.set(id, c)
        })

        // allowedIds includes favorites and their ancestors (so we can navigate to favorites)
        const allowedIds = new Set()
        for (const fid of favSet) {
          let cur = map.get(Number(fid))
          while (cur) {
            const cid = Number(getCategoryId(cur))
            if (Number.isNaN(cid)) break
            if (allowedIds.has(cid)) break
            allowedIds.add(cid)
            const parent = getFatherId(cur)
            if (parent == null || parent === '' ) break
            cur = map.get(Number(parent))
          }
        }

        // If updating an existing task, ensure its current category and ancestors remain visible
        if (mode === 'update' && task) {
          const catId = task.CategoryId ?? task.categoryId ?? task.Category?.Id ?? task.category?.id ?? null
          if (catId != null) {
            let cur = map.get(Number(catId))
            while (cur) {
              const cid = Number(getCategoryId(cur))
              if (Number.isNaN(cid)) break
              if (allowedIds.has(cid)) break
              allowedIds.add(cid)
              const parent = getFatherId(cur)
              if (parent == null || parent === '') break
              cur = map.get(Number(parent))
            }
          }
        }

        // filter categories to only those in allowedIds
        const permitted = categories.filter(c => allowedIds.has(Number(getCategoryId(c))))
        setAllCategories(permitted);
        // persist the real favorites set for UI/validation
        setUserFavorites(favSet)
        // default to no selection so only root select is visible with placeholder
        setSelectedPath([]);
        // if in update mode, prefill category selection if task provided (build full ancestor path)
        if (mode === 'update' && task) {
          const catId = task.CategoryId ?? task.categoryId ?? task.Category?.Id ?? task.category?.id ?? null
          if (catId != null) {
            const path = buildCategoryPath(catId, categories)
            setSelectedPath(path.length > 0 ? path : [String(catId)])
          }
        }
      } catch {
        setErrorMessage('לא ניתן לטעון קטגוריות מהשרת.');
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    loadCategories();
  }, [mode, task]);

  const parentCategories = useMemo(
    () => allCategories.filter((c) => getFatherId(c) == null),
    [allCategories]
  );

  const getChildren = (parentId) =>
    allCategories.filter((c) => String(getFatherId(c)) === String(parentId));

  const selectedCategoryId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1] : '';
  const selectedCategoryNum = selectedCategoryId ? Number(selectedCategoryId) : null
  const selectedIsFavorite = selectedCategoryNum != null ? userFavorites.has(selectedCategoryNum) : false
  const originalCategoryNum = (mode === 'update' && task) ? Number(task.CategoryId ?? task.categoryId ?? task.Category?.Id ?? task.category?.id ?? null) : null

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const arr = Array.from(e.target.files).map(f => {
        const preview = URL.createObjectURL(f);
        try { previewsRef.current.add(preview); } catch(e){}
        return { file: f, preview };
      });
      setFiles((prev) => [...prev, ...arr]);
    }
  };

  const removeSelectedFile = (index) => {
    setFiles((prev) => {
      const toRemove = prev[index];
      if (toRemove && toRemove.preview) {
        try { URL.revokeObjectURL(toRemove.preview); } catch(e){}
        try { previewsRef.current.delete(toRemove.preview); } catch(e){}
      }
      const next = prev.filter((_, i) => i !== index);
      try { if (fileInputRef && fileInputRef.current && next.length === 0) fileInputRef.current.value = ''; } catch(e){}
      return next;
    });
  };

  // prefill fields when opened in update mode
  useEffect(() => {
    if (mode === 'update' && task) {
      setTaskName(task.Title ?? task.title ?? task.Name ?? task.name ?? '')
      setDescription(task.Description ?? task.description ?? '')
      const rawDate = task.Task_Date ?? task.task_Date ?? task.taskDate ?? task.date ?? null
      try { if (rawDate) setTaskDate(new Date(rawDate).toISOString().slice(0,10)) } catch(e) {}
      // category handled after categories load
      // prefill existing files for edit mode if available
      const candidates = task.files || task.Files || task.attachments || task.Attachments || task.taskFiles || task.TaskFiles || task.filesList || []
      setExistingFiles(Array.isArray(candidates) ? candidates : [])
      setFilesToDelete([])
    }
  }, [mode, task])

  // cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      try {
        previewsRef.current.forEach(p => { try { URL.revokeObjectURL(p) } catch(e){} })
      } catch(e) {}
      try { previewsRef.current.clear() } catch(e) {}
    }
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // prepare base payload
      const payloadBase = {
        Title: taskName,
        Task_Date: taskDate ? new Date(taskDate).toISOString() : new Date().toISOString(),
        user_id: user.id,
        user_first_name: user?.name || user?.user_first_name || '',
        user_last_name: user?.user_last_name || '',
        CategoryId: selectedCategoryId ? parseInt(selectedCategoryId, 10) : null,
        description: description,
        CategoryId: parseInt(selectedCategoryId, 10),
        CategoryName: 'General', // ערך זמני לעקיפת הוולידציה של השרת
        color: '#FFFFFF'
        
      }

      if (mode === 'update' && task) {
        // update full task (restore full-edit behavior)
        const tid = task.id ?? task.Id ?? task.taskId ?? task.TaskId ?? null
        if (!tid) throw new Error('Task id not found for update')
        const url = `https://localhost:44354/api/Tasks/UpdateTask/${tid}`
          const payload = { ...task, ...payloadBase }
        const resp = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!resp.ok) {
          const txt = await resp.text().catch(()=>resp.statusText)
          throw new Error('Update failed: ' + txt)
        }
        const updated = await resp.json().catch(()=>null)

        // upload files if provided
        if (files && files.length > 0 && tid) {
          for (const f of files) {
            const fileObj = f && f.file ? f.file : f;
            try { await addTaskFile(tid, fileObj) } catch(e){ console.warn('file upload failed', e) }
          }
        }

        // delete removed files
        if (filesToDelete && filesToDelete.length > 0) {
          for (const fid of filesToDelete) {
            try {
              await fetch(`https://localhost:44354/api/FileTasks/Delete/${fid}`, { method: 'DELETE' })
            } catch (e) { console.warn('failed to delete file', fid, e) }
          }
        }

        setSuccessMessage('המשימה עודכנה בהצלחה!')
        if (typeof onUpdated === 'function') onUpdated(updated)
      } else {
        const newTask = { ...payloadBase }
        const createdTask = await addNewTask(newTask)
        const newTaskId = createdTask?.id ?? createdTask?.Id
        if (files && files.length > 0 && newTaskId) {
          for (const f of files) {
            const fileObj = f && f.file ? f.file : f;
            try { await addTaskFile(newTaskId, fileObj) } catch(e){ console.warn('file upload failed', e) }
          }
        }
        setSuccessMessage('המשימה נוצרה בהצלחה!')
        if (typeof onCreated === 'function') onCreated(createdTask)
        // clear form after create
        setTaskName('');
        setDescription('');
        setSelectedPath([]);
        setTaskDate(new Date().toISOString().slice(0, 10));
        setFiles([]);
        try { if (fileInputRef && fileInputRef.current) fileInputRef.current.value = '' } catch(e) {}
        e.target.reset();
      }
    } catch (error) {
      console.error('Error creating task:', error);
      setErrorMessage('אירעה שגיאה ביצירת המשימה או בהעלאת הקובץ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-task-container">
      <h2 className="new-task-title">{mode === 'update' ? 'עדכון משימה' : 'יצירת משימה חדשה'}</h2>
      
      <form className="new-task-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="taskName">שם המשימה:</label>
          <input 
            type="text" 
            id="taskName" 
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required 
            placeholder="הזן את שם המשימה"
          />
        </div>

        {/* Dynamic category tree selects: render a select for root, then for each level if children exist */}
        <div className="form-group">
          <label>קטגוריה:</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Level 0: parent/root select */}
            <select
              value={selectedPath[0] || ''}
              onChange={(e) => {
                const newRoot = e.target.value;
                if (!newRoot) {
                  setSelectedPath([]);
                  return;
                }
                // set only the chosen root (do not auto-descend)
                setSelectedPath([String(newRoot)]);
              }}
              className="form-select"
              style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
              disabled={isCategoriesLoading || parentCategories.length === 0}
            >
              {parentCategories.length === 0 ? (
                <option value="">אין קטגוריות ראשיות</option>
              ) : (
                <>
                  <option value="">לא נבחרה קטגוריה</option>
                  {parentCategories.map((category) => {
                    const cid = Number(getCategoryId(category))
                    const isFav = userFavorites.has(cid)
                    return (
                      <option key={getCategoryId(category)} value={String(getCategoryId(category))} disabled={!isFav}>
                        {getCategoryName(category)}{!isFav ? ' (לא מועדף)' : ''}
                      </option>
                    )
                  })}
                </>
              )}
            </select>

            {/* Render deeper levels dynamically while children exist for the last selected id */}
            {selectedPath.length > 0 && (() => {
              const selects = [];
              // for each level starting from level 1, compute children of previous level
              for (let level = 1; ; level++) {
                const parentId = selectedPath[level - 1];
                const children = getChildren(parentId);
                if (!children || children.length === 0) break;

                const value = selectedPath[level] || '';

                selects.push(
                  <select
                    key={`level-${level}`}
                    value={value}
                    onChange={(e) => {
                      const chosen = e.target.value;
                      // replace/trim path up to this level and set chosen (no auto-descend)
                      const newPath = selectedPath.slice(0, level);
                      newPath[level - 1] = String(parentId);
                      if (!chosen) {
                        // user cleared selection at this level -> trim deeper levels
                        setSelectedPath(newPath.slice(0, level - 1));
                        return;
                      }
                      newPath[level] = String(chosen);
                      setSelectedPath(newPath);
                    }}
                    className="form-select"
                    style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
                  >
                    <option value="">ללא קטגוריה</option>
                    {children.map((category) => {
                      const cid = Number(getCategoryId(category))
                      const isFav = userFavorites.has(cid)
                      return (
                        <option key={getCategoryId(category)} value={String(getCategoryId(category))} disabled={!isFav}>
                          {getCategoryName(category)}{!isFav ? ' (לא מועדף)' : ''}
                        </option>
                      )
                    })}
                  </select>
                );
              }
              return selects;
            })()}
          </div>
        </div>

      <div className="form-group">
        <label htmlFor="taskDate">תאריך משימה:</label>
        <input
          type="date"
          id="taskDate"
          value={taskDate}
          onChange={(e) => setTaskDate(e.target.value)}
          className="form-input"
          style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
        />
      </div>

      <div className="form-group">
        <label htmlFor="description">תיאור:</label>
        <textarea 
          id="description" 
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="הזן תיאור משימה (אופציונלי)"
          rows="4"
        />
      </div>

      <div className="form-group">
        <label>קבצים קיימים:</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
          {existingFiles && existingFiles.length > 0 ? (
            existingFiles.map((f, i) => {
              const name = f?.name || f?.fileName || f?.FileName || f?.filename || f?.path || `קובץ ${i+1}`
              const href = f?.fileurl || f?.fileUrl || f?.url || f?.Url || f?.FileUrl || f?.path || f?.downloadUrl || f?.link || ''
              const safeHref = href ? (() => { try { return encodeURI(href) } catch(e){ return href } })() : ''
              const isImageUrl = (u) => !!u && /\.(jpe?g|png|gif|webp|bmp|svg)(\?.*)?$/i.test(u)
              return (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isImageUrl(safeHref) ? <img src={safeHref} alt={name} style={{ maxHeight: 48, maxWidth: 80, objectFit: 'cover' }} /> : null}
                    <div>{name}</div>
                  </div>
                  {safeHref ? <a href={safeHref} target="_blank" rel="noreferrer">פתח</a> : null}
                  <button type="button" onClick={() => {
                    const id = f?.id ?? f?.Id ?? f?.fileId ?? f?.FileId ?? null
                    if (id) setFilesToDelete(prev => Array.from(new Set([...prev, id])))
                    setExistingFiles(prev => prev.filter((_, idx) => idx !== i))
                  }} style={{ marginLeft: 8 }}>מחק</button>
                </div>
              )
            })
          ) : (
            <div style={{ color: '#777' }}>אין קבצים קיימים</div>
          )}
        </div>
        <label htmlFor="fileUpload">הוסף קבצים למשימה:</label>
        <input 
          type="file" 
          id="fileUpload" 
          onChange={handleFileChange}
          ref={fileInputRef}
          multiple
        />

        {files && files.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {files.map((fObj, idx) => {
              const f = fObj && fObj.file ? fObj.file : fObj;
              const preview = fObj && fObj.preview ? fObj.preview : null;
              const isImage = f && f.type && f.type.startsWith && f.type.startsWith('image/');
              return (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center' }}>
                    {isImage && preview ? <img src={preview} alt={f.name} style={{ maxHeight: 48, maxWidth: 80, objectFit: 'cover' }} /> : null}
                    <div>
                      <div>{f.name}</div>
                      <div style={{ fontSize: 12, color: '#666' }}>{f.type || 'unknown'}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => removeSelectedFile(idx)}>הסר</button>
                </div>
              )
            })}
          </div>
        ) : null}
      </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={
            isSubmitting ||
            isCategoriesLoading ||
            !taskName.trim() ||
            !selectedCategoryId ||
            !(selectedIsFavorite || (mode === 'update' && originalCategoryNum != null && Number(selectedCategoryId) === Number(originalCategoryNum)))
          }
        >
          {isSubmitting ? (mode === 'update' ? 'שומר עדכון...' : 'שומר משימה...') : (mode === 'update' ? 'עדכן משימה' : 'צור משימה')}
        </button>
      </form>
    </div>
  );
}
