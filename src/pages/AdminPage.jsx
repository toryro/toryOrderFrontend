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

// 📦 2. 여러 개 묶어둔 설정 컴포넌트들 몽땅 불러오기! (매출, 유저 추가됨)
import { 
    AdminStoreInfo, 
    AdminCallOptionManagement, 
    AdminHours, 
    AdminTables,
    AdminSales,
    AdminUsers
} from "../components/admin/StoreSettings";

// ==========================================
// 1. [직원용] Staff View (너무 작아서 뼈대에 둡니다)
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
    
    // 수신된 안읽은 공지사항 목록 배열
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

    // 로그인(화면 진입) 시 안읽은 공지 가져오기
    useEffect(() => {
        if (user && ["STORE_OWNER", "STAFF"].includes(user.role)) {
            axios.get(`${API_BASE_URL}/notices/unread`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setUnreadNotices(res.data))
                .catch(()=>{});
        }
    }, [user, token]);

    // 공지사항 "확인(읽음)" 처리 함수
    const handleReadNotice = async (noticeId) => {
        try {
            await axios.post(`${API_BASE_URL}/notices/${noticeId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setUnreadNotices(prev => prev.slice(1));
        } catch(e) {
            toast.error("공지사항 확인 처리 중 오류가 발생했습니다.");
        }
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
    
    // 본사/슈퍼 관리자이고 매장 선택 전이면 HeadquartersView 렌더링
    if (["SUPER_ADMIN", "GROUP_ADMIN", "BRAND_ADMIN"].includes(user.role) && !storeId) return <HeadquartersView user={user} token={token} />;
    
    if (!store) return <div className="p-10 text-center">매장 정보 로딩중...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* 사이드바 */}
            <div className="w-64 bg-white border-r flex flex-col fixed h-full z-10">
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
                    <MenuButton icon="📢" label="공지 사항" active={activeTab==="store_notices"} onClick={()=>setActiveTab("store_notices")} />
                    <MenuButton icon="🏠" label="영업장 정보" active={activeTab==="info"} onClick={()=>setActiveTab("info")} />
                    <MenuButton icon="🍽️" label="메뉴 관리" active={activeTab==="menu"} onClick={()=>setActiveTab("menu")} />
                    <MenuButton icon="🔔" label="호출 옵션" active={activeTab==="callOptions"} onClick={()=>setActiveTab("callOptions")} />
                    <MenuButton icon="⏰" label="영업 시간" active={activeTab==="hours"} onClick={()=>setActiveTab("hours")} />
                    <MenuButton icon="🪑" label="테이블 관리" active={activeTab==="tables"} onClick={()=>setActiveTab("tables")} />
                    <MenuButton icon="💰" label="매출 관리" active={activeTab==="sales"} onClick={()=>setActiveTab("sales")} />
                    <MenuButton icon="👤" label="계정 관리" active={activeTab==="users"} onClick={()=>setActiveTab("users")} />
                    
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
            
            {/* ✨ 메인 컨텐츠 영역: 밖에서 가져온 부품들을 조립만 합니다! */}
            <div className="flex-1 ml-64 p-4 lg:p-6 overflow-y-auto relative">
                {activeTab === "store_notices" && <StoreNoticeBoard token={token} />}
                {activeTab === "info" && <AdminStoreInfo store={store} token={token} fetchStore={fetchStore} user={user} />}
                {activeTab === "menu" && <AdminMenuManagement store={store} token={token} fetchStore={fetchStore} user={user} />}
                {activeTab === "callOptions" && <AdminCallOptionManagement store={store} token={token} />}
                {activeTab === "hours" && <AdminHours store={store} token={token} fetchStore={fetchStore} />}
                {activeTab === "tables" && <AdminTables store={store} token={token} fetchStore={fetchStore} />}
                {activeTab === "sales" && <AdminSales store={store} token={token} />}
                {activeTab === "users" && <AdminUsers store={store} token={token} />}
                
                {/* 🚫 이 부분에 있던 유령 코드 <HQNoticeSend /> 는 삭제되었습니다! */}
            </div>

            {/* 스마트 공지사항 팝업 모달 */}
            {unreadNotices.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform animate-slideUp relative">
                        {unreadNotices.length > 1 && (
                            <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 font-bold text-xs px-3 py-1 rounded-full z-10 shadow-sm animate-pulse">
                                안 읽은 공지 {unreadNotices.length}개 남음
                            </div>
                        )}
                        <div className="bg-indigo-600 p-5 text-white text-center relative overflow-hidden">
                            <span className="text-4xl mb-1 block">📢</span>
                            <h2 className="text-xl font-black">새로운 공지사항 도착</h2>
                        </div>
                        <div className="p-8">
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-4">{unreadNotices[0].title}</h3>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px] bg-slate-50 p-4 rounded-xl border border-slate-100">
                                {unreadNotices[0].content}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50">
                            <button onClick={() => handleReadNotice(unreadNotices[0].id)} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-black transition shadow-md">
                                ✅ 확인했습니다
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function MenuButton({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition flex items-center gap-2 ${active ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}><span>{icon}</span> {label}</button>
    );
}

export default AdminPage;