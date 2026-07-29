import { API_BASE_URL } from './userService';

/**
 * Creates a new task in the database.
 * @param {Object} taskData - The task details.
 * @returns {Promise<Object>} The created task object.
 */
export const addNewTask = async (taskData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/Tasks`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Message: ${errorText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error adding new task:', error);
    throw error;
  }
};

/**
 * Uploads a file for a specific task.
 * @param {number|string} taskId - The ID of the task to attach the file to.
 * @param {File} file - The file object from an input element.
 * @returns {Promise<Object>} The server response after upload.
 */
export const addTaskFile = async (taskId, file) => {
  try {
    const formData = new FormData();
    // חייב להיות זהה לשם הפרמטר בשרת: IFormFile file
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/FileTasks/${taskId}/upload-file`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}. Message: ${errorText}`);
    }

    const data = await response.json().catch(() => ({ message: 'Upload successful' }));
    return data;
  } catch (error) {
    console.error('Error uploading task file:', error);
    throw error;
  }
};
