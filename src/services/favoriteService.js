export const API_BASE_URL = 'https://localhost:44354/api'

export const getUserFavorites = async (userId) => {
  try {
    const resp = await fetch(`${API_BASE_URL}/FavoriteUserCategories/GetAllFavoriteUserCategoriesByUserId/${userId}`)
    if (!resp.ok) {
      const text = await resp.text().catch(() => '')
      console.error('getUserFavorites error', resp.status, text)
      throw new Error(`Failed to load favorites ${resp.status} - ${text}`)
    }
    return await resp.json()
  } catch (e) {
    console.error('getUserFavorites error', e)
    throw e
  }
}

export const addFavorite = async (userId, categoryId) => {
  // server expects favoriet_users_categoriesDTO { user_id, category_id }
  const payload = { user_id: userId, category_id: categoryId }
  const resp = await fetch(`${API_BASE_URL}/FavoriteUserCategories/AddNewFavoriteUserCategory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error('addFavorite error', resp.status, text)
    throw new Error(`Failed to add favorite ${resp.status} - ${text}`)
  }
  return resp.json().catch(() => ({}))
}

// removeFavorite expects favoriteId
export const removeFavorite = async (favoriteId) => {
  // call controller DeleteFavoriteUserCategory with favoriteId in URL
  const resp = await fetch(`${API_BASE_URL}/FavoriteUserCategories/DeleteFavoriteUserCategory/${favoriteId}`, {
    method: 'DELETE'
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error('removeFavorite error', resp.status, text)
    throw new Error(`Failed to remove favorite ${resp.status} - ${text}`)
  }
  return resp.json().catch(() => ({}))
}

export const addCustomFavorite = async (userId, name) => {
  const resp = await fetch(`${API_BASE_URL}/FavoriteUserCategories/AddCustom`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, name })
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error('addCustomFavorite error', resp.status, text)
    throw new Error(`Failed to add custom favorite ${resp.status} - ${text}`)
  }
  return resp.json().catch(() => ({}))
}

/**
 * Create a new category and link it as a favorite for the user.
 * Calls server endpoint CreateAndLinkNewFavoriteCategory which expects:
 * { UserId, CategoryName, FatherId, Color }
 */
export const createAndLinkFavoriteCategory = async (userId, categoryName, fatherId = null, color = null) => {
  const payload = { UserId: userId, CategoryName: categoryName, FatherId: fatherId, Color: color }
  const resp = await fetch(`${API_BASE_URL}/FavoriteUserCategories/CreateAndLinkNewFavoriteCategory`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    console.error('createAndLinkFavoriteCategory error', resp.status, text)
    throw new Error(`Failed to create and link favorite category ${resp.status} - ${text}`)
  }
  return resp.json().catch(() => ({}))
}

export default {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  addCustomFavorite
}
