import axios from 'axios'

const API_BASE_URL = '/api'

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000
})

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// API方法
export const authApi = {
  login: (credentials) => apiClient.post('/user/login', credentials),
  register: (userData) => apiClient.post('/user/register', userData),
  getUserInfo: () => apiClient.get('/user/info'),
  updateUserInfo: (userData) => apiClient.put('/user/info', userData)
}

export const roomApi = {
  getAvailableRooms: () => apiClient.get('/room/available'),
  createRoom: (roomData) => apiClient.post('/room/create', null, {
    params: roomData
  }),
  joinRoom: (roomId) => apiClient.post(`/room/${roomId}/join`),
  leaveRoom: (roomId) => apiClient.post(`/room/${roomId}/leave`),
  getRoomDetail: (roomId) => apiClient.get(`/room/${roomId}`),
  startRoom: (roomId) => apiClient.post(`/room/${roomId}/start`),
  completeRoom: (roomId) => apiClient.post(`/room/${roomId}/complete`)
}

export const messageApi = {
  getRoomMessages: (roomId, page, size) => 
    apiClient.get(`/message/${roomId}`, { params: { page, size } })
}