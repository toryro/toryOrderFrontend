// src/pages/AdminPage.jsx
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import toast from "react-hot-toast";

// 📦 1. 덩치 큰 단일 컴포넌트 불러오기
import HeadquartersView from "../components/admin/HeadquartersView";
import AdminMenuManagement from "../components/admin/AdminMenuManagement";
import StoreNoticeBoard from "../components/admin/StoreNoticeBoard";

// 📦 2. 여러 개 묶어둔 설정 컴포넌트들 몽땅 불러오기!
import { 
    AdminStoreInfo, 
    AdminCallOptionManagement, 
    AdminHours, 
    AdminTables,
    AdminSales,
    AdminUsers,
    AdminOrders
} from "../components/admin/StoreSettings";


const MENU_ITEMS = [
    { id: "store_notices", icon: "📢", label: "공지 사항", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    { id: "orders", icon: "🧾", label: "주문 결제 내역", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    { id: "info", icon: "🏠", label: "영업장 정보", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    { id: "menu", icon: "🍽️", label: "메뉴 관리", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    { id: "callOptions", icon: "🔔", label: "호출 옵션", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    { id: "hours", icon: "⏰", label: "영업 시간", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    { id: "tables", icon: "🪑", label: "테이블 관리", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    { id: "sales", icon: "💰", label: "매출 관리", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] },
    
    // 💡 예시: '계정 관리'를 본사(SUPER_ADMIN, BRAND_ADMIN, GROUP_ADMIN)만 보게 하려면 아래처럼 STORE_OWNER를 빼면 됩니다.
    { id: "users", icon: "👤", label: "계정 관리", roles: ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN", "STORE_OWNER"] } 
];

// ==========================================
// 1. [직원용] Staff View 
// ==========================================
function StaffView({ user, storeId }) {
    const navigate = useNavigate();
    const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
            <div className="absolute top-4 right-4">
                <button onClick={handleLogout} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-sm">
                    로그아웃
                </button>
            </div>
            <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">👩‍🍳</div>
                <h1 className="text-2xl font-extrabold text-gray-800 mb-2">안녕하세요, {user.name}님!</h1>
                <p className="text-gray-500 mb-8">오늘도 활기찬 하루 되세요.<br/>주문 처리는 주방 화면을 이용해주세요.</p>
                <div className="space-y-4">
                    <a href={`/kitchen/${storeId}`} className="block w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md transition transform hover:scale-105">
                        🍳 주방(KDS) 화면으로 이동
                    </a>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// [메인] Admin Page Router 
// ==========================================
function AdminPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [user, setUser] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("info");
    
    // 사이드바 메뉴 열림/닫힘 상태 관리
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [unreadNotices, setUnreadNotices] = useState([]);

    useEffect(() => {
        if (!token) { navigate("/"); return; }
        axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setUser(res.data);
                if (res.data.role === "STORE_OWNER" && !storeId && res.data.store_id) navigate(`/admin/${res.data.store_id}`);
            })
            .catch(() => { navigate("/"); });
    }, [token, storeId]);

    useEffect(() => {
        if (user && ["STORE_OWNER", "STAFF"].includes(user.role)) {
            axios.get(`${API_BASE_URL}/notices/unread`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setUnreadNotices(res.data))
                .catch(()=>{});
        }
    }, [user, token]);

    const handleReadNotice = async (noticeId) => {
        try {
            await axios.post(`${API_BASE_URL}/notices/${noticeId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setUnreadNotices(prev => prev.slice(1));
        } catch(e) { toast.error("공지사항 확인 처리 중 오류가 발생했습니다."); }
    };

    const fetchStore = async () => {
        if (storeId && ["SUPER_ADMIN", "GROUP_ADMIN", "STORE_OWNER", "BRAND_ADMIN"].includes(user?.role)) {
            try {
                const res = await axios.get(`${API_BASE_URL}/stores/${storeId}`, { headers: { Authorization: `Bearer ${token}` } });
                setStore(res.data);
            } catch { toast.error("가게 정보 로딩 실패"); }
        }
    };

    useEffect(() => { if (user) fetchStore().then(() => setLoading(false)); }, [user, storeId]);

    const toggleStoreStatus = async () => {
        if (!store) return;
        const newStatus = !store.is_open;
        if (!window.confirm(newStatus ? "영업을 시작하시겠습니까?" : "영업을 종료하시겠습니까?")) return;

        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, { is_open: newStatus }, { headers: { Authorization: `Bearer ${token}` } });
            setStore({ ...store, is_open: newStatus }); 
        } catch (err) { toast.error("상태 변경 실패"); }
    };

    const handleLogout = () => {
        if(window.confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem("token");
            navigate("/");
        }
    };

    if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">🔒 권한 확인 중...</div>;
    if (user.role === "STAFF") return <StaffView user={user} storeId={user.store_id} />;
    
    if (["SUPER_ADMIN", "GROUP_ADMIN", "BRAND_ADMIN"].includes(user.role) && !storeId) return <HeadquartersView user={user} token={token} />;
    if (!store) return <div className="p-10 text-center">매장 정보 로딩중...</div>;

    // ✨ 2. 현재 로그인한 사용자의 권한이 있는 메뉴만 쏙 골라냅니다!
    const visibleMenus = MENU_ITEMS.filter(menu => menu.roles.includes(user.role));

    return (
        <div className="h-screen bg-gray-100 flex overflow-hidden">
            
            <div className={`w-64 bg-white border-r flex flex-col fixed h-full z-20 transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="p-6 border-b">
                    <h1 className="text-xl font-extrabold text-gray-800 truncate">{store.name}</h1>
                    <p className="text-xs text-gray-500 mt-1 mb-4">{user.role === "GROUP_ADMIN" ? "본사 관리 모드" : "사장님 모드"}</p>
                    
                    <div className="flex items-center justify-between bg-gray-100 p-3 rounded-lg">
                        <span className={`text-sm font-bold ${store.is_open ? "text-green-600" : "text-gray-500"}`}>
                            {store.is_open ? "🟢 영업중" : "🔴 종료"}
                        </span>
                        <button onClick={toggleStoreStatus} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${store.is_open ? "bg-green-500" : "bg-gray-300"}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${store.is_open ? "translate-x-6" : "translate-x-0"}`}></div>
                        </button>
                    </div>

                    {["GROUP_ADMIN", "SUPER_ADMIN", "BRAND_ADMIN"].includes(user.role) && (<button onClick={() => navigate("/admin")} className="text-xs text-indigo-600 font-bold mt-4 hover:underline block w-full text-left">← 본사 대시보드</button>)}
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* ✨ 3. 권한이 확인된 메뉴들만 렌더링합니다 */}
                    {visibleMenus.map(menu => (
                        <MenuButton 
                            key={menu.id}
                            icon={menu.icon} 
                            label={menu.label} 
                            active={activeTab === menu.id} 
                            onClick={() => setActiveTab(menu.id)} 
                        />
                    ))}
                    
                    <div className="pt-3 mt-3 border-t border-gray-100">
                        <a href={`/kitchen/${store.id}`} target="_blank" rel="noopener noreferrer" className="w-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-4 py-2.5 rounded-lg font-bold transition flex items-center gap-2 text-sm">
                            <span>🍳</span> 주방 KDS 화면 열기
                        </a>
                    </div>
                </nav>
                
                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="w-full text-left text-sm text-red-500 hover:bg-red-50 px-4 py-3 rounded-lg font-bold transition flex items-center gap-2">
                        🚪 로그아웃
                    </button>
                </div>
            </div>
            
            {/* 메인 컨텐츠 영역 */}
            <div className={`flex-1 flex flex-col h-full overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
                <div className="bg-white h-14 border-b flex items-center px-4 shrink-0 shadow-sm z-10">
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-gray-50 hover:bg-gray-200 rounded-lg text-gray-700 transition focus:outline-none">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                    </button>
                    <span className="ml-3 font-bold text-gray-700 text-sm">{isSidebarOpen ? '메뉴 숨기기' : '메뉴 보기'}</span>
                </div>

                <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-gray-50 relative">
                    {/* 화면을 그릴 때도 권한 체크를 한 번 더 걸어주는 것이 안전합니다 */}
                    {activeTab === "store_notices" && <StoreNoticeBoard token={token} />}
                    {activeTab === "orders" && <AdminOrders store={store} token={token} />}
                    {activeTab === "info" && <AdminStoreInfo store={store} token={token} fetchStore={fetchStore} user={user} />}
                    {activeTab === "menu" && <AdminMenuManagement store={store} token={token} fetchStore={fetchStore} user={user} />}
                    {activeTab === "callOptions" && <AdminCallOptionManagement store={store} token={token} />}
                    {activeTab === "hours" && <AdminHours store={store} token={token} fetchStore={fetchStore} />}
                    {activeTab === "tables" && <AdminTables store={store} token={token} fetchStore={fetchStore} />}
                    {activeTab === "sales" && <AdminSales store={store} token={token} />}
                    {activeTab === "users" && <AdminUsers store={store} token={token} />}
                </div>
            </div>

            {/* 공지사항 팝업 모달 */}
            {unreadNotices.length > 0 && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
                        <div className="flex items-center gap-3 mb-4 text-indigo-600">
                            <span className="text-3xl">📢</span>
                            <h3 className="font-extrabold text-2xl">본사 긴급 공지</h3>
                        </div>
                        <h4 className="font-bold text-xl text-gray-900 mb-2">{unreadNotices[0].title}</h4>
                        <div className="bg-gray-50 p-4 rounded-xl text-gray-700 mb-6 min-h-[100px] whitespace-pre-wrap text-sm border border-gray-200">
                            {unreadNotices[0].content}
                        </div>
                        <button onClick={() => handleReadNotice(unreadNotices[0].id)} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md transition">
                            확인했습니다
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// [컴포넌트] 좌측 사이드바 메뉴 버튼 UI (✨ 이게 빠져있었습니다!)
// ==========================================
const MenuButton = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full text-left px-4 py-3 rounded-xl font-bold flex items-center gap-3 transition-all duration-200 ${
            active 
                ? "bg-indigo-50 text-indigo-700 shadow-sm" 
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-800"
        }`}
    >
        <span className="text-xl">{icon}</span>
        <span>{label}</span>
    </button>
);


export default AdminPage;