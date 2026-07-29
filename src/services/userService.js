export const API_BASE_URL = 'https://localhost:44354/api';

/**
 * Fetches a user by their ID from the backend controller.
 * @param {string|number} id - The ID of the user to fetch.
 * @returns {Promise<Object>} The user object.
 */
export const getUserById = async (id) => {
  try {
    // שים לב: אם ה-API שלך מקבל את ה-ID כ-Query Parameter (למשל: ?id=123)
    // יש לשנות את השורה הבאה ל: 
    // const response = await fetch(`${API_BASE_URL}/Users/GetUserById?id=${id}`);
    
    // כאן אנו מניחים שה-ID מועבר כנתיב (Path Parameter)
    const response = await fetch(`${API_BASE_URL}/Users/GetUserById/${id}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Adds a new user to the backend.
 * @param {Object} userData - The user details to add.
 * @returns {Promise<Object>} The created user object.
 */
export const addNewUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Users/AddNewUser`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // בחלק מהשרתים לא חוזר JSON בפעולת POST, אבל אם כן:
    const newUserData = await response.json().catch(() => ({})); 
    return newUserData;
  } catch (error) {
    console.error('Error adding new user:', error);
    throw error;
  }
};

/**
 * Logins a user.
 */
export const loginUser = async (username, password) => {
  try {
    // פיצול רצף השם לשם פרטי ושם משפחה
    const nameParts = (username || '').trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const response = await fetch(`${API_BASE_URL}/Users/ValidateUserFullNameAndPassword`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // השרת דורש במפורש את השדות FirstName ו-LastName בלי קו תחתון
      body: JSON.stringify({ 
        Id: 0,
        FirstName: firstName, 
        LastName: lastName,
        First_name: firstName, 
        Last_name: lastName,   
        Password: password,
        Email: 'dummy@email.com',
        sub: 'dummy-sub',
        Wont_help: true
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Server returned status:', response.status, 'Body:', errorText);
      throw new Error(`Failed to validate user. Server says: ${errorText}`);
    }

    const isValid = await response.json();
    
    // אם השרת החזיר false אז המשתמש לא נמצא או שהסיסמה שגויה
    if (!isValid) {
      throw new Error('User not found or incorrect credentials');
    }

    // ה-API מחזיר בוליאני, לכן נחזיר אובייקט בסיסי לטובת האפליקציה
    return { name: username, isAuthenticated: true };
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};
