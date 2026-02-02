import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "./config"; // config 파일 경로 확인 필요

// 페이지 컴포넌트 임포트 (파일 경로에 맞게 수정하세요)
import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import KitchenPage from "./pages/KitchenPage";
import OrderPage from "./pages/OrderPage"; // 모바일 주문 페이지

// === 🛡️ 보호된 라우트 (권한 체크) ===
function ProtectedRoute({ children, allowedRoles }) {
    const token = localStorage.getItem("token");
    const [isLoading, setIsLoading] = useState(true);
    const [isAllowed, setIsAllowed] = useState(false);

    useEffect(() => {
        if (!token) {
            setIsLoading(false);
            return;
        }

        // 내 정보 조회하여 권한 확인
        axios.get(`${API_BASE_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            const userRole = res.data.role;
            // 허용된 역할 목록에 내 역할이 있는지 확인
            if (allowedRoles.includes(userRole)) {
                setIsAllowed(true);
            }
            setIsLoading(false);
        })
        .catch((err) => {
            console.error("Auth Error:", err);
            localStorage.removeItem("token"); // 토큰 만료시 삭제
            setIsLoading(false);
        });
    }, [token, allowedRoles]);

    if (!token) return <Navigate to="/" replace />;
    if (isLoading) return <div className="min-h-screen flex items-center justify-center">🔒 권한 확인 중...</div>;
    
    // 권한이 없으면 에러 메시지 표시
    if (!isAllowed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
                <h1 className="text-2xl font-bold text-red-600 mb-4">⛔ 접근 권한이 없습니다.</h1>
                <p className="text-gray-600 mb-6">현재 계정으로는 이 페이지에 접근할 수 없습니다.</p>
                <button 
                    onClick={() => { localStorage.removeItem("token"); window.location.href = "/"; }}
                    className="bg-gray-800 text-white px-6 py-2 rounded-lg font-bold"
                >
                    로그인 화면으로 돌아가기
                </button>
            </div>
        );
    }

    return children;
}

// === 🚦 메인 앱 라우터 ===
function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* 1. 로그인 페이지 (누구나 접근 가능) */}
                <Route path="/" element={<LoginPage />} />

                {/* 2. 손님용 주문 페이지 (QR 토큰으로 접근) */}
                <Route path="/order/:token" element={<OrderPage />} />

                {/* 3. 관리자 페이지 (통합) */}
                {/* 기존엔 STAFF가 없어서 막혔던 부분입니다. allowedRoles에 'STAFF', 'GROUP_ADMIN'을 추가했습니다. */}
                <Route 
                    path="/admin/:storeId?" 
                    element={
                        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'GROUP_ADMIN', 'STORE_OWNER', 'STAFF']}>
                            <AdminPage />
                        </ProtectedRoute>
                    } 
                />

                {/* 4. 주방(KDS) 화면 */}
                <Route 
                    path="/kitchen/:storeId" 
                    element={
                        <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'GROUP_ADMIN', 'STORE_OWNER', 'STAFF']}>
                            <KitchenPage />
                        </ProtectedRoute>
                    } 
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;