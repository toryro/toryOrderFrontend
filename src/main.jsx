import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import axios from 'axios'
import { API_BASE_URL } from './config.js'

// ── 전역 axios 인터셉터 설정 ──────────────────────────────────────────────────
// 모든 axios 요청에 토큰 자동 첨부
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// 401 응답 처리: refresh 시도 → 실패 시 자동 로그아웃
let isRefreshing = false
let pendingQueue = []

const processQueue = (error, newToken = null) => {
    pendingQueue.forEach(({ resolve, reject }) =>
        error ? reject(error) : resolve(newToken)
    )
    pendingQueue = []
}

axios.interceptors.response.use(
    response => response,
    async error => {
        const original = error.config
        if (error.response?.status !== 401 || original._retry) {
            return Promise.reject(error)
        }

        const refreshToken = localStorage.getItem('refreshToken')
        if (!refreshToken) {
            forceLogout()
            return Promise.reject(error)
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                pendingQueue.push({ resolve, reject })
            }).then(token => {
                original.headers.Authorization = `Bearer ${token}`
                return axios(original)
            })
        }

        original._retry = true
        isRefreshing = true

        try {
            const res = await axios.post(
                `${API_BASE_URL}/token/refresh`,
                { refresh_token: refreshToken },
                { _retry: true }   // 재발급 요청 자체는 인터셉터 재진입 방지
            )
            const newToken = res.data.access_token
            localStorage.setItem('token', newToken)
            axios.defaults.headers.common.Authorization = `Bearer ${newToken}`
            processQueue(null, newToken)
            original.headers.Authorization = `Bearer ${newToken}`
            return axios(original)
        } catch (refreshError) {
            processQueue(refreshError, null)
            forceLogout()
            return Promise.reject(refreshError)
        } finally {
            isRefreshing = false
        }
    }
)

function forceLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    sessionStorage.setItem('sessionExpired', '세션이 만료되었습니다. 다시 로그인해주세요.')
    window.location.href = '/'
}
// ─────────────────────────────────────────────────────────────────────────────

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
