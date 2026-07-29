import React, { useEffect, useMemo, useState } from 'react';
import { addNewTask, addTaskFile } from './services/taskService';
import { getAllCategories } from './services/categoryService';
import './NewTask.css';

export default function NewTask({ user }) {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [allCategories, setAllCategories] = useState([]);
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [childCategoryId, setChildCategoryId] = useState('');
  const [file, setFile] = useState(null);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const getCategoryId = (category) => category?.id ?? category?.Id;
  const getCategoryName = (category) => category?.name ?? category?.Name;
  const getFatherId = (category) => category?.father_id ?? category?.fatherId ?? category?.FatherId ?? null;

  useEffect(() => {
    const loadCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        const categories = await getAllCategories();
        setAllCategories(categories);

        const parents = categories.filter((c) => getFatherId(c) == null);
        if (parents.length > 0) {
          const firstParentId = String(getCategoryId(parents[0]));
          setParentCategoryId(firstParentId);

          const firstChild = categories.find(
            (c) => String(getFatherId(c)) === firstParentId
          );
          setChildCategoryId(firstChild ? String(getCategoryId(firstChild)) : '');
        }
      } catch {
        setErrorMessage('לא ניתן לטעון קטגוריות מהשרת.');
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    loadCategories();
  }, []);

  const parentCategories = useMemo(
    () => allCategories.filter((c) => getFatherId(c) == null),
    [allCategories]
  );

  const childCategories = useMemo(
    () => allCategories.filter((c) => String(getFatherId(c)) === String(parentCategoryId)),
    [allCategories, parentCategoryId]
  );

  const selectedCategoryId = childCategoryId || parentCategoryId;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // 1. צור את המשימה קודם כל
      // התאמה למבנה tasks מה-DAL: Id, Title, Task_Date, user_id, CategoryId
      const newTask = {
        Title: taskName,
        Task_Date: new Date().toISOString(), // תאריך יצירת המשימה
        user_id: user?.id ?? user?.Id ?? user?.userId ?? user?.UserId ?? 0,
        user_first_name: user?.name || user?.user_first_name || '',
        user_last_name: user?.user_last_name || '',
        CategoryId: parseInt(selectedCategoryId, 10), // מזהה הקטגוריה שנבחרה
        CategoryName: '',
        color: ''
      };

      const createdTask = await addNewTask(newTask);
      console.log('Task creation results:', createdTask);
      
      const newTaskId = createdTask?.id ?? createdTask?.Id;

      // 2. אם נבחר קובץ ונוצרה המשימה, נעלה את הקובץ
      if (file && newTaskId) {
        await addTaskFile(newTaskId, file);
        console.log('File uploaded successfully');
      }

      setSuccessMessage('המשימה נוצרה בהצלחה!');
      // ניקוי הטופס
      setTaskName('');
      setDescription('');
      if (parentCategories.length > 0) {
        const firstParentId = String(getCategoryId(parentCategories[0]));
        setParentCategoryId(firstParentId);
        const firstChild = allCategories.find(
          (c) => String(getFatherId(c)) === firstParentId
        );
        setChildCategoryId(firstChild ? String(getCategoryId(firstChild)) : '');
      } else {
        setParentCategoryId('');
        setChildCategoryId('');
      }
      setFile(null);
      e.target.reset(); // לאיפוס שדה הקובץ
      
    } catch (error) {
      console.error('Error creating task:', error);
      setErrorMessage('אירעה שגיאה ביצירת המשימה או בהעלאת הקובץ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="new-task-container">
      <h2 className="new-task-title">יצירת משימה חדשה</h2>
      
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

        <div className="form-group">
          <label htmlFor="parentCategoryId">קטגוריה ראשית:</label>
          <select
            id="parentCategoryId"
            value={parentCategoryId}
            onChange={(e) => {
              const selectedParent = e.target.value;
              setParentCategoryId(selectedParent);

              const firstChild = allCategories.find(
                (c) => String(getFatherId(c)) === String(selectedParent)
              );
              setChildCategoryId(firstChild ? String(getCategoryId(firstChild)) : '');
            }}
            className="form-select"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
            disabled={isCategoriesLoading || parentCategories.length === 0}
          >
            {parentCategories.length === 0 ? (
              <option value="">אין קטגוריות ראשיות</option>
            ) : (
              parentCategories.map((category) => (
                <option key={getCategoryId(category)} value={String(getCategoryId(category))}>
                  {getCategoryName(category)}
                </option>
              ))
            )}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="childCategoryId">קטגוריה משנית:</label>
          <select
            id="childCategoryId"
            value={childCategoryId}
            onChange={(e) => setChildCategoryId(e.target.value)}
            className="form-select"
            style={{ padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '16px' }}
            disabled={isCategoriesLoading || !parentCategoryId || childCategories.length === 0}
          >
            <option value="">ללא קטגוריה משנית</option>
            {childCategories.map((category) => (
              <option key={getCategoryId(category)} value={String(getCategoryId(category))}>
                {getCategoryName(category)}
              </option>
            ))}
          </select>
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
          <label htmlFor="fileUpload">הוסף קובץ למשימה:</label>
          <input 
            type="file" 
            id="fileUpload" 
            onChange={handleFileChange}
          />
        </div>

        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}

        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isSubmitting || isCategoriesLoading || !taskName.trim() || !selectedCategoryId}
        >
          {isSubmitting ? 'שומר משימה...' : 'צור משימה'}
        </button>
      </form>
    </div>
  );
}
