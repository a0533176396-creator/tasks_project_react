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
