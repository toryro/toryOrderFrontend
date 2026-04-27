import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import * as Sentry from "@sentry/react";
import { API_BASE_URL } from "./config";
import { Toaster } from "react-hot-toast";

import LoginPage from "./pages/LoginPage";
import AdminPage from "./pages/AdminPage";
import KitchenPage from "./pages/KitchenPage";
import TableDashboard from "./pages/TableDashboard";
import OrderPage from "./pages/OrderPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

// JWT payload를 디코딩해서 만료 여부를 클라이언트에서 사전 확인
function isTokenExpired(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 < Date.now();
    } catch {
        return true;
    }
}

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

        // 클라이언트 사이드 만료 사전 체크 (서버 요청 전에 확인)
        if (isTokenExpired(token)) {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            sessionStorage.setItem("sessionExpired", "세션이 만료되었습니다. 다시 로그인해주세요.");
            Sentry.setUser(null);
            setIsLoading(false);
            return;
        }

        // 내 정보 조회하여 권한 확인 (인터셉터가 Authorization 헤더 자동 첨부)
        axios.get(`${API_BASE_URL}/users/me`)
        .then(res => {
            const user = res.data;
            if (allowedRoles.includes(user.role)) {
                setIsAllowed(true);
            }
            // Sentry에 유저 컨텍스트 등록 — 에러 발생 시 어느 계정에서 났는지 보임
            Sentry.setUser({
                id: String(user.id),
                email: user.email,
                username: user.name,
                role: user.role,
            });
            setIsLoading(false);
        })
        .catch((err) => {
            console.error("Auth Error:", err);
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
                    onClick={() => {
                        localStorage.removeItem("token");
                        Sentry.setUser(null);
                        window.location.href = "/";
                    }}
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
        // Sentry ErrorBoundary: 렌더링 중 발생하는 React 에러를 캡처
        <Sentry.ErrorBoundary
            fallback={({ error, resetError }) => (
                <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
                    <h1 className="text-2xl font-bold text-red-600 mb-2">예상치 못한 오류가 발생했습니다</h1>
                    <p className="text-gray-500 text-sm mb-6 text-center max-w-md">
                        오류가 자동으로 보고되었습니다. 문제가 지속되면 관리자에게 문의하세요.
                    </p>
                    <button
                        onClick={resetError}
                        className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700"
                    >
                        다시 시도
                    </button>
                </div>
            )}
        >
            <BrowserRouter>
                <Toaster
                    position="top-center"
                    toastOptions={{
                        duration: 3000,
                        style: { background: '#333', color: '#fff', fontWeight: 'bold' }
                    }}
                />

                <Routes>
                    {/* 1. 로그인 페이지 (누구나 접근 가능) */}
                    <Route path="/" element={<LoginPage />} />

                    {/* 비밀번호 찾기 / 재설정 (인증 불필요) */}
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password" element={<ResetPasswordPage />} />

                    {/* 2. 손님용 주문 페이지 (QR 토큰으로 접근) */}
                    <Route path="/order/:token" element={<OrderPage />} />

                    {/* 3. 관리자 페이지 (통합) */}
                    <Route
                        path="/admin/:storeId?"
                        element={
                            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'BRAND_ADMIN', 'GROUP_ADMIN', 'STORE_OWNER', 'STAFF']}>
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

                    {/* 5. 실시간 테이블 현황판 (Dashboard) */}
                    <Route
                        path="/admin/dashboard/:storeId"
                        element={
                            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'GROUP_ADMIN', 'STORE_OWNER', 'STAFF']}>
                                <TableDashboard />
                            </ProtectedRoute>
                        }
                    />
                </Routes>
            </BrowserRouter>
        </Sentry.ErrorBoundary>
    );
}

export default App;
