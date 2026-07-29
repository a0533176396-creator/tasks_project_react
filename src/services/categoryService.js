import { API_BASE_URL } from './userService';

/**
 * Fetches all categories from the backend.
 * @returns {Promise<Array>} Categories list.
 */
export const getAllCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/Categories/GetAllCategories`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};
