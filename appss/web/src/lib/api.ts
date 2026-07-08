import axios from "axios"

const BASE_URL = import.meta.env.VITE_API_URL || "/api"

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
})

// Inject auth token if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pos_token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
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
