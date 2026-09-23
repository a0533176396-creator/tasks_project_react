import { API_BASE_URL } from './userService';

/**
 * Fetches all categories from the backend.
 * @returns {Promise<Array>} Categories list.
 */
export const getAllCategories = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/Categories/GetAllCategories`);

    if (!response.ok) {
      const text = await response.text().catch(() => '')
      console.error('getAllCategories error', response.status, text)
      throw new Error(`HTTP error! status: ${response.status} - ${text}`);
    }

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
};

/**
 * Create a new category. If parentId is provided, creates a subcategory.
 * Tries several common server endpoints/payload shapes for compatibility.
 * @param {string} name
 * @param {number|null} parentId
 * @returns {Promise<Object>} created category
 */
export const createCategory = async (name, parentId = null) => {
  const payloads = [
    { Name: name, father_id: parentId },
    { Name: name, fatherId: parentId },
    { name, father_id: parentId },
    { name, fatherId: parentId }
  ]
  const endpoints = [
    `${API_BASE_URL}/Categories/Add`,
    `${API_BASE_URL}/Categories`,
    `${API_BASE_URL}/Categories/AddCategory`
  ]

  for (const ep of endpoints) {
    for (const payload of payloads) {
      try {
        const resp = await fetch(ep, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const text = await resp.text().catch(() => '')
        let body
        try { body = text ? JSON.parse(text) : null } catch { body = text }
        if (!resp.ok) {
          // try next
          console.debug('createCategory attempt failed', ep, resp.status, body)
          continue
        }
        return body
      } catch (e) {
        console.debug('createCategory network error', ep, e)
        continue
      }
    }
  }
  throw new Error('Failed to create category on server')
}
