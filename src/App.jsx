import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OrderPage from './pages/OrderPage';
import KitchenPage from './pages/KitchenPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage'; // [새로 추가됨]
import SuperAdminPage from "./pages/SuperAdminPage"; // [추가] 불러오기

// [보안 요원] 토큰(출입증)이 없으면 로그인 페이지로 쫓아냄
function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <div className="antialiased text-gray-900"> {/* 기존 스타일 유지 */}
      <BrowserRouter>
        <Routes>
          {/* ============================== */}
          {/* 1. 누구나 접속 가능한 페이지 */}
          {/* ============================== */}
          <Route path="/login" element={<LoginPage />} />
          {/*<Route path="/order/:qr_token" element={<OrderPage />} />*/}
          <Route path="/order/:token" element={<OrderPage />} />

          {/* ============================== */}
          {/* 2. 로그인해야 접속 가능한 페이지 (보안 적용) */}
          {/* ============================== */}
          
          {/* 슈퍼 관리자 페이지 (보안 적용!) */}
          <Route 
            path="/super-admin" 
            element={
              <PrivateRoute>
                <SuperAdminPage />
              </PrivateRoute>
            } 
          />
          
          {/* 사장님 가게 관리 페이지 (보안 적용!) */}
          <Route 
            path="/admin/:storeId" 
            element={
              <PrivateRoute>
                <AdminPage />
              </PrivateRoute>
            } 
          />

          {/* 주방 화면 (외부인이 보면 안되니까 보호) */}
          <Route 
            path="/kitchen/:storeId" 
            element={
              <PrivateRoute>
                <KitchenPage />
              </PrivateRoute>
            } 
          />

          {/* 슈퍼 관리자 (당연히 보호) */}
          <Route 
            path="/super-admin" 
            element={
              <PrivateRoute>
                <SuperAdminPage />
              </PrivateRoute>
            } 
          />
          
          {/* ============================== */}
          {/* 3. 기본 경로 처리 */}
          {/* ============================== */}
          {/* 주소 없이 들어오면 로그인 화면으로 보냄 */}
          <Route path="/" element={<Navigate to="/login" />} />

        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;