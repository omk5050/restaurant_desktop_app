import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "/api"

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Inject auth token and adminId if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pos_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  
  // Impersonate adminId if selected_admin_id exists, else use current_admin_id
  const selectedAdminId = localStorage.getItem("selected_admin_id")
  const currentAdminId = localStorage.getItem("current_admin_id")
  const targetAdminId = selectedAdminId || currentAdminId
  if (targetAdminId) {
    config.params = {
      ...config.params,
      adminId: targetAdminId,
    }
  }
  return config
})

// Handle 401 / 403 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("pos_token")
    }
    return Promise.reject(error)
  }
)
