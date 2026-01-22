import { BrowserRouter, Routes, Route } from 'react-router-dom';
import OrderPage from './OrderPage';
import KitchenPage from './KitchenPage'; // <--- [확인 1] 이 줄이 있나요?
import AdminPage from './AdminPage'; // [추가 1] 파일 불러오기

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/order/:token" element={<OrderPage />} />
        
        {/* [확인 2] 아래 줄이 정확히 있나요? (오타 확인: kitchen) */}
        <Route path="/kitchen/:storeId" element={<KitchenPage />} />
        {/* [추가 2] 관리자 페이지 경로 설정 */}
        <Route path="/admin/:storeId" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;