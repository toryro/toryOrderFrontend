import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import toast from "react-hot-toast";

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
                    <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-400">
                        * 메뉴 수정이나 매출 확인은 점주님 권한이 필요합니다.
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==========================================
// 2. [본사/슈퍼 관리자용] Headquarters View
// ==========================================
function HeadquartersView({ user, token }) {
    const [stores, setStores] = useState([]);
    const [activeTab, setActiveTab] = useState("stores");
    const navigate = useNavigate();

    const fetchStores = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/groups/my/stores`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setStores(res.data);
        } catch (err) { console.error("매장 목록 로딩 실패"); }
    };

    useEffect(() => { fetchStores(); }, [activeTab]);

    const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* 사이드바 */}
            <div className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-20">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-xl font-extrabold tracking-tight">🏢 HQ. Admin</h1>
                    <p className="text-xs text-slate-400 mt-1">{user.role === "SUPER_ADMIN" ? "슈퍼 관리자" : "브랜드 본사"}</p>
                    <p className="text-xs text-indigo-400 font-bold">{user.name}님</p>
                </div>
                
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-bold text-slate-500 mb-2 px-2 mt-2">현황 파악</div>
                    <HQMenuButton icon="🏪" label="가맹점 목록" active={activeTab==="stores"} onClick={()=>setActiveTab("stores")} />
                    <HQMenuButton icon="📈" label="통합 매출 현황" active={activeTab==="hq_sales"} onClick={()=>setActiveTab("hq_sales")} />
                    
                    {/* 공통 기능 (슈퍼 + 브랜드) */}
                    <div className="text-xs font-bold text-slate-500 mb-2 px-2 mt-6">운영 관리</div>
                    
                    {/* ✨ [신규 추가] 여기에 공지사항 발송 버튼이 들어갑니다! */}
                    <HQMenuButton icon="📢" label="공지사항 발송" active={activeTab==="notice"} onClick={()=>setActiveTab("notice")} />
                    {/* ✨ [추가] 발송 내역 게시판 버튼 */}
                    <HQMenuButton icon="📋" label="공지 발송 내역" active={activeTab==="notice_history"} onClick={()=>setActiveTab("notice_history")} />
                    
                    <HQMenuButton icon="➕" label="가맹점 생성" active={activeTab==="create_store"} onClick={()=>setActiveTab("create_store")} />
                    <HQMenuButton icon="🚀" label="메뉴 일괄 배포" active={activeTab==="distribution"} onClick={()=>setActiveTab("distribution")} />
                    <HQMenuButton icon="👥" label={user.role==="SUPER_ADMIN"?"전체 계정 관리":"점주 계정 관리"} active={activeTab==="users"} onClick={()=>setActiveTab("users")} />
                    
                    {/* 슈퍼 관리자 전용 */}
                    {user.role === "SUPER_ADMIN" && (
                        <>
                            <div className="text-xs font-bold text-slate-500 mb-2 px-2 mt-6">시스템 설정</div>
                            <HQMenuButton icon="👑" label="브랜드 생성" active={activeTab==="brand"} onClick={()=>setActiveTab("brand")} />
                        </>
                    )}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} className="w-full text-left text-sm text-red-400 hover:bg-slate-800 px-4 py-3 rounded-lg font-bold transition flex items-center gap-2">
                        🚪 로그아웃
                    </button>
                </div>
            </div>

            {/* 메인 컨텐츠 */}
            <div className="flex-1 ml-64 p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto">
                    {/* 1. 가맹점 목록 */}
                    {activeTab === "stores" && (
                        <div className="animate-fadeIn">
                            <div className="flex justify-between items-end mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">가맹점 현황</h2>
                                    <p className="text-gray-500">{user.role === "BRAND_ADMIN" ? "우리 브랜드 소속 매장입니다." : "플랫폼 전체 매장입니다."}</p>
                                </div>
                                <span className="bg-indigo-100 text-indigo-700 font-bold px-3 py-1 rounded-full">{stores.length}개 매장</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {stores.map(store => (
                                    <div key={store.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:border-indigo-300 transition group cursor-default">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-gray-800 group-hover:text-indigo-600 transition">{store.name}</h3>
                                            <span className={`px-2 py-1 rounded-full font-bold text-xs ${store.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {store.is_open ? "영업중" : "마감"}
                                            </span>
                                        </div>
                                        <p className="text-gray-500 text-sm mb-6 truncate">{store.address || "주소 미등록"}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button onClick={() => navigate(`/admin/${store.id}`)} className="bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-black">관리 접속</button>
                                            <a href={`/kitchen/${store.id}`} target="_blank" className="border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 text-center">주방 화면</a>
                                        </div>
                                    </div>
                                ))}
                                {stores.length === 0 && <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border border-dashed">등록된 매장이 없습니다.</div>}
                            </div>
                        </div>
                    )}

                    {/* 기능 탭들 */}
                    {activeTab === "hq_sales" && <HQSalesDashboard token={token} currentUser={user} />}
                    {activeTab === "brand" && <AdminBrandManagement token={token} />}
                    {activeTab === "distribution" && <AdminMenuDistribution stores={stores} token={token} />}
                    {activeTab === "create_store" && <HQStoreCreate token={token} onSuccess={()=>setActiveTab("stores")} />}
                    {activeTab === "users" && <HQUserManage token={token} currentUser={user} />}
                    
                    {/* ✨ [신규 추가] 공지사항 발송 컴포넌트 연결! */}
                    {activeTab === "notice" && <HQNoticeSend token={token} currentUser={user} />}
                    {/* ✨ [추가] 게시판 화면 연결! */}
                    {activeTab === "notice_history" && <HQNoticeHistory token={token} currentUser={user} />}
                </div>
            </div>
        </div>
    );
}

function HQMenuButton({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full text-left px-4 py-2.5 rounded-lg font-bold text-sm transition flex items-center gap-3 ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <span className="text-base">{icon}</span> {label}
        </button>
    );
}

// 2-1. 브랜드 관리 (🔥 수정됨: onst -> const)
function AdminBrandManagement({ token }) {
    const [brands, setBrands] = useState([]); // ✅ const로 수정 완료!
    const [newBrandName, setNewBrandName] = useState("");
    const [newBrandLogo, setNewBrandLogo] = useState("");

    useEffect(() => { fetchBrands(); }, []);
    const fetchBrands = async () => { axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setBrands(res.data)).catch(()=>{}); };

    const handleCreateBrand = async () => {
        if (!newBrandName) return toast.error("브랜드명 필수");
        try { await axios.post(`${API_BASE_URL}/brands/`, { name: newBrandName, logo_url: newBrandLogo }, { headers: { Authorization: `Bearer ${token}` } }); toast.success("생성 완료"); setNewBrandName(""); fetchBrands(); } 
        catch (err) { toast.error("생성 실패"); }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">👑 브랜드 관리</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex gap-4 items-end">
                <input className="border p-3 rounded-lg flex-1" placeholder="브랜드 이름" value={newBrandName} onChange={e=>setNewBrandName(e.target.value)} />
                <input className="border p-3 rounded-lg flex-1" placeholder="로고 URL" value={newBrandLogo} onChange={e=>setNewBrandLogo(e.target.value)} />
                <button onClick={handleCreateBrand} className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700">생성</button>
            </div>
            <div className="grid grid-cols-3 gap-4">
                {brands.map(b => (<div key={b.id} className="bg-white p-4 rounded-xl border font-bold text-center">{b.name}</div>))}
            </div>
        </div>
    );
}

// 2-2. 가맹점 생성
// 2-2. 가맹점 생성
function HQStoreCreate({ token, onSuccess }) {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [brandId, setBrandId] = useState("");
    // ✨ 상태 추가
    const [region, setRegion] = useState("서울"); 
    const [isDirectManage, setIsDirectManage] = useState(false);
    const [brands, setBrands] = useState([]);

    useEffect(() => { axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setBrands(res.data)).catch(()=>{}); }, []);

    const handleCreate = async () => {
        if (!name) return toast.error("매장명 필수");
        try { 
            // ✨ 요청 데이터에 region, is_direct_manage 포함
            await axios.post(`${API_BASE_URL}/stores/`, { name, address, brand_id: brandId ? parseInt(brandId) : null, region, is_direct_manage: isDirectManage }, { headers: { Authorization: `Bearer ${token}` } }); 
            toast.success("성공!"); onSuccess(); 
        } 
        catch (err) { toast.error("실패: " + (err.response?.data?.detail || "오류")); }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">🏪 가맹점 생성</h2>
            <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-4">
                <select className="w-full border p-3 rounded-lg" value={brandId} onChange={e=>setBrandId(e.target.value)}>
                    <option value="">독립 매장</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {/* ✨ 지역 및 운영 타입 선택 UI 추가 */}
                <div className="flex gap-4">
                    <select className="w-1/3 border p-3 rounded-lg font-bold" value={region} onChange={e=>setRegion(e.target.value)}>
                        <option value="서울">서울</option><option value="경기">경기</option><option value="인천">인천</option>
                        <option value="강원">강원</option><option value="충청">충청</option><option value="전라">전라</option>
                        <option value="경상">경상</option><option value="부산">부산</option><option value="제주">제주</option>
                    </select>
                    <select className="w-2/3 border p-3 rounded-lg font-bold text-indigo-700 bg-indigo-50" value={isDirectManage} onChange={e=>setIsDirectManage(e.target.value === 'true')}>
                        <option value={false}>🤝 가맹점 (Franchise)</option>
                        <option value={true}>🏢 본사 직영점 (Direct)</option>
                    </select>
                </div>
                <input className="w-full border p-3 rounded-lg" placeholder="매장 이름" value={name} onChange={e=>setName(e.target.value)} />
                <input className="w-full border p-3 rounded-lg" placeholder="주소" value={address} onChange={e=>setAddress(e.target.value)} />
                <button onClick={handleCreate} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold">생성하기</button>
            </div>
        </div>
    );
}

// 2-3. 메뉴 배포
function AdminMenuDistribution({ stores, token }) {
    const [step, setStep] = useState(1);
    const [selectedStoreId, setSelectedStoreId] = useState("");
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [targetStoreIds, setTargetStoreIds] = useState(new Set());
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (selectedStoreId) {
            axios.get(`${API_BASE_URL}/stores/${selectedStoreId}`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setCategories(res.data.categories))
                .catch(console.error);
        }
    }, [selectedStoreId, token]);

    // ✨ [핵심 수정 1] 원본 매장을 제외한 '배포 가능한 대상 매장' 목록 만들기
    const availableTargetStores = stores.filter(s => s.id.toString() !== selectedStoreId.toString());

    const toggleTargetStore = (id) => {
        const newSet = new Set(targetStoreIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setTargetStoreIds(newSet);
    };

    // ✨ [핵심 수정 2] 전체 선택 시에도 '원본 매장'은 제외하고 선택하기
    const handleSelectAll = () => {
        if (targetStoreIds.size === availableTargetStores.length) setTargetStoreIds(new Set());
        else setTargetStoreIds(new Set(availableTargetStores.map(s => s.id)));
    };

    const handleDistribute = async () => {
        if (!selectedCategoryId || targetStoreIds.size === 0) return toast.error("대상과 메뉴를 선택해주세요.");
        if (!window.confirm(`정말 ${targetStoreIds.size}개 매장에 메뉴를 배포하시겠습니까?`)) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/brands/distribute-menu`, 
                { source_category_id: parseInt(selectedCategoryId), target_store_ids: Array.from(targetStoreIds) }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("배포 완료!"); 
            setStep(1); 
            setSelectedStoreId(""); 
            setTargetStoreIds(new Set());
        } catch (err) { 
            toast.error("배포 실패: " + (err.response?.data?.detail || "오류")); 
        } finally { 
            setLoading(false); 
        }
    };

    return (
        <div className="space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">🚀 메뉴 일괄 배포 (MDM)</h2>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-8 px-10">
                    <div className={`flex flex-col items-center ${step>=1 ? "text-indigo-600" : "text-gray-300"}`}><div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mb-1 border-current">1</div><span className="text-xs font-bold">원본 선택</span></div>
                    <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>
                    <div className={`flex flex-col items-center ${step>=2 ? "text-indigo-600" : "text-gray-300"}`}><div className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold mb-1 border-current">2</div><span className="text-xs font-bold">대상 선택</span></div>
                </div>

                {step === 1 && (
                    <div className="space-y-4 max-w-lg mx-auto">
                        <h3 className="text-xl font-bold text-center mb-6">배포할 '원본 메뉴' 선택</h3>
                        <select className="w-full border p-3 rounded-xl bg-gray-50" value={selectedStoreId} onChange={e=>setSelectedStoreId(e.target.value)}>
                            <option value="">1. 원본 매장 선택...</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        {selectedStoreId && (
                            <select className="w-full border p-3 rounded-xl bg-gray-50" value={selectedCategoryId} onChange={e=>setSelectedCategoryId(e.target.value)}>
                                <option value="">2. 배포할 카테고리 선택...</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.menus.length}개 메뉴)</option>)}
                            </select>
                        )}
                        <button disabled={!selectedCategoryId} onClick={()=>setStep(2)} className="w-full bg-indigo-600 disabled:bg-gray-300 text-white py-4 rounded-xl font-bold text-lg mt-4">다음 👉</button>
                    </div>
                )}

                {step === 2 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center mb-4">
                            {/* ✨ [핵심 수정 3] 전체 매장 수가 아닌 필터링된 배포 가능 매장 수를 보여줌 */}
                            <h3 className="text-xl font-bold">배포할 매장 선택 ({availableTargetStores.length}개 중 {targetStoreIds.size}개 선택됨)</h3>
                            <button onClick={handleSelectAll} className="text-sm font-bold text-indigo-600 border px-3 py-1 rounded hover:bg-indigo-50">전체 선택/해제</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
                            {/* ✨ [핵심 수정 4] stores 대신 availableTargetStores를 맵핑 */}
                            {availableTargetStores.map(store => (
                                <div key={store.id} onClick={()=>toggleTargetStore(store.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${targetStoreIds.has(store.id) ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                                    <span className="font-bold text-gray-800">{store.name}</span>
                                    {targetStoreIds.has(store.id) && <span className="text-indigo-600 font-bold">✓</span>}
                                </div>
                            ))}
                            {availableTargetStores.length === 0 && (
                                <div className="col-span-full py-8 text-center text-gray-400">배포할 다른 대상 매장이 없습니다.</div>
                            )}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={()=>setStep(1)} className="flex-1 bg-gray-200 text-gray-700 py-4 rounded-xl font-bold">이전</button>
                            <button onClick={handleDistribute} disabled={loading || targetStoreIds.size===0} className="flex-[2] bg-indigo-600 disabled:bg-gray-400 text-white py-4 rounded-xl font-bold text-lg">{loading ? "배포 중..." : "일괄 배포 시작 🚀"}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// 2-4. 계정 관리 컴포넌트 (currentUser 오류 해결)
function HQUserManage({ token, currentUser }) { 
    const [users, setUsers] = useState([]);
    const [brands, setBrands] = useState([]);
    const [stores, setStores] = useState([]);
    
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [role, setRole] = useState("STORE_OWNER");
    const [targetBrandId, setTargetBrandId] = useState("");
    const [targetStoreId, setTargetStoreId] = useState("");

    useEffect(() => { 
        fetchUsers(); 
        // ✨ 권한 상관없이 브랜드와 매장 목록을 모두 가져와서 이름을 매칭할 준비를 합니다!
        axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setBrands(res.data)).catch(()=>{});
        axios.get(`${API_BASE_URL}/groups/my/stores`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setStores(res.data)).catch(()=>{});
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (err) { toast.error("사용자 목록 조회 실패"); }
    };

    const handleCreate = async () => {
        if (!email || !password) return toast.error("필수 정보 누락");
        let finalBrandId = null;
        if (currentUser.role === "BRAND_ADMIN") finalBrandId = currentUser.brand_id;
        else if (role === "BRAND_ADMIN") finalBrandId = parseInt(targetBrandId);

        try {
            await axios.post(`${API_BASE_URL}/admin/users/`, 
                { email, password, name, role, brand_id: finalBrandId, store_id: (role==="STORE_OWNER"||role==="STAFF")?parseInt(targetStoreId):null }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("생성 완료"); fetchUsers(); setEmail(""); setPassword("");
        } catch (err) { toast.error("실패"); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("삭제?")) return;
        try { await axios.delete(`${API_BASE_URL}/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(); } catch { toast.error("삭제 실패"); }
    };

    if (!currentUser) return <div>로딩 중...</div>;

    return (
        <div className="space-y-8 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">👥 계정 관리</h2>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input className="border p-2 rounded" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} />
                    <input className="border p-2 rounded" type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} />
                    <input className="border p-2 rounded" placeholder="이름" value={name} onChange={e=>setName(e.target.value)} />
                    <select className="border p-2 rounded bg-indigo-50 font-bold" value={role} onChange={e=>setRole(e.target.value)}>
                        <option value="STORE_OWNER">점주</option>
                        <option value="STAFF">직원</option>
                        {currentUser.role === "SUPER_ADMIN" && <option value="BRAND_ADMIN">브랜드 관리자</option>}
                    </select>
                </div>
                {role === "BRAND_ADMIN" && currentUser.role === "SUPER_ADMIN" && (
                    <select className="w-full border p-2 rounded mb-4" value={targetBrandId} onChange={e=>setTargetBrandId(e.target.value)}>
                        <option value="">브랜드 선택</option>
                        {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                )}
                {(role === "STORE_OWNER" || role === "STAFF") && (
                    <select className="w-full border p-2 rounded mb-4" value={targetStoreId} onChange={e=>setTargetStoreId(e.target.value)}>
                        <option value="">매장 선택</option>
                        {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                )}
                <button onClick={handleCreate} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold">계정 생성</button>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b bg-gray-50 text-gray-500 text-sm">
                            <th className="p-3">이름</th>
                            <th className="p-3">이메일</th>
                            <th className="p-3">권한</th>
                            <th className="p-3">소속</th>
                            <th className="p-3">상태</th>
                            <th className="p-3 text-right">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} className="border-b hover:bg-gray-50">
                                <td className="p-3 font-bold">{u.name}</td>
                                <td className="p-3 text-gray-600">{u.email}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                        u.role==='SUPER_ADMIN'?'bg-red-100 text-red-700':
                                        u.role==='BRAND_ADMIN'?'bg-purple-100 text-purple-700':
                                        u.role==='STORE_OWNER'?'bg-blue-100 text-blue-700':'bg-gray-100'
                                    }`}>{u.role}</span>
                                </td>
                                <td className="p-3 text-sm">
                                    {/* ✨ 점주/직원처럼 매장 ID가 있으면 무조건 매장 이름부터 보여줍니다! */}
                                    {u.store_id 
                                        ? <span className="text-blue-700 font-bold">🏪 {stores.find(s => s.id === u.store_id)?.name || `매장(${u.store_id})`}</span>
                                        : u.brand_id 
                                            ? <span className="text-purple-700 font-bold">🏢 {brands.find(b => b.id === u.brand_id)?.name || `브랜드(${u.brand_id})`}</span>
                                            : <span className="text-gray-400 font-bold">시스템 / 최고 관리자</span>}
                                </td>
                                <td className="p-3 text-sm">
                                    {u.is_active ? <span className="text-green-600 font-bold">🟢 활성</span> : <span className="text-red-500 font-bold">🔴 정지</span>}
                                </td>
                                <td className="p-3 text-right">
                                    <button onClick={()=>handleDelete(u.id)} className="text-red-500 hover:underline text-sm">삭제</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// 2-5. 본사 통합 매출 대시보드 (브랜드/매장 드릴다운 기능 포함)(로열티 방식별 자동 계산 기능 포함)(다중 그룹핑 기능 포함)
function HQSalesDashboard({ token, currentUser }) {
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // ✨ 뷰 모드 확장: brand, region, type, store
    const [viewMode, setViewMode] = useState(currentUser?.role === "SUPER_ADMIN" ? "brand" : "store"); 
    const [selectedGroup, setSelectedGroup] = useState(null); // 클릭한 그룹 이름 저장
    const [selectedStore, setSelectedStore] = useState(null);

    const fetchHQStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/hq/stats?start_date=${startDate}&end_date=${endDate}`, { headers: { Authorization: `Bearer ${token}` } });
            setStats(res.data);
        } catch (err) { toast.error("매출 데이터 로딩 실패"); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchHQStats(); }, [startDate, endDate]);

    if (selectedStore) {
        return (
            <div className="animate-fadeIn pb-20">
                <button onClick={() => setSelectedStore(null)} className="mb-6 flex items-center gap-2 text-indigo-600 font-bold hover:bg-indigo-50 px-4 py-2 rounded-lg w-fit transition border border-indigo-100">← 대시보드로 돌아가기</button>
                <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2"><span className="text-3xl">🏪</span> {selectedStore.name} 상세 매출 분석</h2>
                <AdminSales store={{ id: selectedStore.id }} token={token} />
            </div>
        );
    }

    // ✨ 데이터 그룹화 공통 함수
    const groupDataBy = (keyFn, labelName) => {
        if (!stats) return [];
        const grouped = stats.store_stats.reduce((acc, curr) => {
            const key = keyFn(curr);
            if (!acc[key]) acc[key] = { group_name: key, revenue: 0, order_count: 0, royalty_fee: 0, label: labelName };
            acc[key].revenue += curr.revenue;
            acc[key].order_count += curr.order_count;
            acc[key].royalty_fee += (curr.royalty_fee || 0);
            return acc;
        }, {});
        return Object.values(grouped).sort((a, b) => b.revenue - a.revenue);
    };

    let displayStats = [];
    let isGroupMode = ["brand", "region", "type"].includes(viewMode);

    if (stats) {
        if (selectedGroup) {
            // 그룹을 클릭해서 들어온 경우, 해당 그룹에 속한 매장들만 필터링하여 보여줌
            displayStats = stats.store_stats.filter(s => {
                if (viewMode === "brand") return (s.brand_name || "독립 매장") === selectedGroup;
                if (viewMode === "region") return (s.region || "미지정") === selectedGroup;
                if (viewMode === "type") return (s.is_direct_manage ? "🏢 본사 직영점" : "🤝 가맹점") === selectedGroup;
                return true;
            });
            isGroupMode = false; // 리스트 모양을 '매장' 뷰로 바꿈
        } else {
            // 메인 대시보드 뷰
            if (viewMode === "brand") displayStats = groupDataBy(s => s.brand_name || "독립 매장", "브랜드");
            else if (viewMode === "region") displayStats = groupDataBy(s => s.region || "미지정", "지역");
            else if (viewMode === "type") displayStats = groupDataBy(s => s.is_direct_manage ? "🏢 본사 직영점" : "🤝 가맹점", "운영타입");
            else displayStats = stats.store_stats; // store 모드
        }
    }

    return (
        <div className="space-y-6 animate-fadeIn pb-20">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">📈 통합 매출 대시보드</h2>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent font-bold text-sm outline-none" />
                    <span className="text-gray-400">~</span>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent font-bold text-sm outline-none" />
                    <button onClick={fetchHQStats} className="bg-indigo-600 text-white px-4 py-1.5 rounded-md text-sm font-bold shadow-sm hover:bg-indigo-700 ml-2">조회</button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-indigo-400 font-bold animate-pulse">데이터를 집계하는 중입니다...</div>
            ) : stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-8 rounded-3xl shadow-lg">
                            <p className="text-indigo-200 font-bold mb-2">전 지점 누적 총 매출액</p>
                            <p className="text-5xl font-black">{stats.total_revenue.toLocaleString()}원</p>
                            <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                                <span className="text-indigo-200 font-bold text-sm">본사 예상 로열티 수익</span>
                                <span className="text-2xl font-black text-yellow-300">+{stats.total_royalty_fee?.toLocaleString() || 0}원</span>
                            </div>
                        </div>
                        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                            <p className="text-gray-500 font-bold mb-2">전 지점 누적 주문 건수</p>
                            <p className="text-5xl font-black text-gray-800">{stats.total_order_count}건</p>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-200">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b pb-4">
                            <h3 className="font-bold text-xl flex items-center gap-2">
                                🏆 {selectedGroup ? `[${selectedGroup}] 상세 목록` : "매출 순위 리더보드"}
                            </h3>
                            
                            <div className="flex gap-2">
                                {selectedGroup && (
                                    <button onClick={()=>setSelectedGroup(null)} className="text-sm font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200">← 뒤로 가기</button>
                                )}
                                {!selectedGroup && (
                                    <div className="flex bg-gray-100 p-1 rounded-lg flex-wrap gap-1">
                                        {currentUser?.role === "SUPER_ADMIN" && <button onClick={()=>setViewMode("brand")} className={`px-3 py-1.5 text-sm font-bold rounded-md transition ${viewMode==="brand" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>브랜드별</button>}
                                        <button onClick={()=>setViewMode("region")} className={`px-3 py-1.5 text-sm font-bold rounded-md transition ${viewMode==="region" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>지역별</button>
                                        <button onClick={()=>setViewMode("type")} className={`px-3 py-1.5 text-sm font-bold rounded-md transition ${viewMode==="type" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>운영타입별</button>
                                        <button onClick={()=>setViewMode("store")} className={`px-3 py-1.5 text-sm font-bold rounded-md transition ${viewMode==="store" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}>전체 매장별</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {displayStats.map((item, idx) => {
                                const maxRevenue = displayStats[0]?.revenue || 1; 
                                const percent = (item.revenue / maxRevenue) * 100;
                                
                                return (
                                    <div 
                                        key={isGroupMode ? item.group_name : item.store_id} 
                                        onClick={() => {
                                            if (isGroupMode) setSelectedGroup(item.group_name);
                                            else setSelectedStore({ id: item.store_id, name: item.store_name });
                                        }}
                                        className="relative p-4 rounded-2xl border border-gray-100 bg-gray-50 overflow-hidden group cursor-pointer hover:border-indigo-400 hover:shadow-md transition"
                                    >
                                        <div className="absolute top-0 left-0 h-full bg-indigo-100/40 transition-all duration-1000 ease-out" style={{ width: `${percent}%` }}></div>
                                        
                                        <div className="relative z-10 flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${idx === 0 ? "bg-yellow-400 text-white shadow-md" : idx === 1 ? "bg-gray-300 text-white shadow-sm" : idx === 2 ? "bg-orange-300 text-white shadow-sm" : "bg-white text-gray-400 border"}`}>
                                                    {idx + 1}
                                                </div>
                                                <div>
                                                    <span className="font-bold text-gray-800 text-lg flex items-center gap-2">
                                                        {isGroupMode ? <span className="text-xl">📊</span> : <span className="text-xl">🏪</span>}
                                                        {isGroupMode ? item.group_name : item.store_name}
                                                        <span className="text-xs font-bold text-indigo-500 bg-white px-2 py-0.5 rounded-full border border-indigo-100 opacity-0 group-hover:opacity-100 transition shadow-sm ml-2">
                                                            {isGroupMode ? "소속 매장 보기 👉" : "상세 분석 보기 👉"}
                                                        </span>
                                                    </span>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        총 {item.order_count}건 결제됨 
                                                        {!isGroupMode && ` | ${item.region} · ${item.is_direct_manage ? '직영' : '가맹'} · ${item.brand_name}`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-black text-2xl text-indigo-700">{item.revenue.toLocaleString()}원</span>
                                                <span className="text-sm font-bold text-gray-500">로열티 정산 <span className="text-red-500">{(item.royalty_fee || 0).toLocaleString()}원</span></span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {displayStats.length === 0 && <p className="text-center text-gray-400 py-10">해당 기간에 발생한 매출이 없습니다.</p>}
                        </div>
                    </div>
                </>
            ) : null}
        </div>
    );
}

// 2-6. 타겟팅 공지사항 발송 컴포넌트
function HQNoticeSend({ token, currentUser }) {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [targetType, setTargetType] = useState(currentUser.role === "SUPER_ADMIN" ? "ALL" : "BRAND");
    const [targetBrandId, setTargetBrandId] = useState("");
    const [targetStoreId, setTargetStoreId] = useState("");
    
    const [brands, setBrands] = useState([]);
    const [stores, setStores] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setBrands(res.data)).catch(()=>{});
        axios.get(`${API_BASE_URL}/groups/my/stores`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setStores(res.data)).catch(()=>{});
    }, []);

    const handleSend = async () => {
        if(!title || !content) return toast.error("제목과 내용을 입력해주세요.");
        if(targetType === "BRAND" && !targetBrandId && currentUser.role === "SUPER_ADMIN") return toast.error("브랜드를 선택해주세요.");
        if(targetType === "STORE" && !targetStoreId) return toast.error("매장을 선택해주세요.");

        let finalBrandId = targetType === "BRAND" ? (currentUser.role === "SUPER_ADMIN" ? targetBrandId : currentUser.brand_id) : null;
        let finalStoreId = targetType === "STORE" ? targetStoreId : null;

        if(!window.confirm("공지를 발송하시겠습니까? 로그인하지 않은 대상도 다음 접속 시 확인하게 됩니다.")) return;
        try {
            await axios.post(`${API_BASE_URL}/admin/notices`, 
                { title, content, target_type: targetType, target_brand_id: finalBrandId ? parseInt(finalBrandId) : null, target_store_id: finalStoreId ? parseInt(finalStoreId) : null }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("타겟팅 공지 발송 완료!");
            setTitle(""); setContent("");
        } catch(e) { toast.error("발송 실패"); }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn pb-20">
            <h2 className="text-2xl font-bold text-gray-800">📢 공지사항 발송</h2>
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 space-y-6">
                
                {/* 타겟 설정 영역 */}
                <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                    <label className="block text-sm font-bold text-indigo-900 mb-3">누구에게 발송할까요? 🎯</label>
                    <div className="flex gap-4 mb-4">
                        {currentUser.role === "SUPER_ADMIN" && <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="radio" name="target" checked={targetType==="ALL"} onChange={()=>setTargetType("ALL")} />플랫폼 전체</label>}
                        <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="radio" name="target" checked={targetType==="BRAND"} onChange={()=>setTargetType("BRAND")} />{currentUser.role==="SUPER_ADMIN"?"특정 브랜드":"우리 브랜드 전체"}</label>
                        <label className="flex items-center gap-2 font-bold cursor-pointer"><input type="radio" name="target" checked={targetType==="STORE"} onChange={()=>setTargetType("STORE")} />특정 매장</label>
                    </div>

                    {targetType === "BRAND" && currentUser.role === "SUPER_ADMIN" && (
                        <select className="w-full border p-3 rounded-lg" value={targetBrandId} onChange={e=>setTargetBrandId(e.target.value)}><option value="">브랜드 선택</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
                    )}
                    {targetType === "STORE" && (
                        <select className="w-full border p-3 rounded-lg" value={targetStoreId} onChange={e=>setTargetStoreId(e.target.value)}><option value="">매장 선택</option>{stores.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select>
                    )}
                </div>

                {/* 내용 입력 영역 */}
                <div><label className="block text-sm font-bold text-gray-700 mb-1">제목</label><input className="w-full border-2 p-3 rounded-lg font-bold outline-none" value={title} onChange={e=>setTitle(e.target.value)} /></div>
                <div><label className="block text-sm font-bold text-gray-700 mb-1">내용</label><textarea className="w-full border-2 p-3 rounded-lg h-40 resize-none outline-none" value={content} onChange={e=>setContent(e.target.value)} /></div>
                
                <button onClick={handleSend} className="w-full bg-slate-800 text-white py-4 rounded-xl font-bold text-lg hover:bg-black shadow-md transition">🚀 공지 발송하기</button>
            </div>
        </div>
    );
}

// 2-7. 공지사항 발송 내역 (게시판 형태)
function HQNoticeHistory({ token, currentUser }) {
    const [notices, setNotices] = useState([]);
    const [selectedNotice, setSelectedNotice] = useState(null);
    
    // ✨ [추가] ID를 이름으로 바꾸기 위해 브랜드와 매장 목록을 담을 공간
    const [brands, setBrands] = useState([]);
    const [stores, setStores] = useState([]);

    useEffect(() => {
        fetchNotices();
        // ✨ [추가] 화면이 열릴 때 브랜드와 매장 목록도 함께 불러옵니다.
        axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setBrands(res.data)).catch(()=>{});
        axios.get(`${API_BASE_URL}/groups/my/stores`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setStores(res.data)).catch(()=>{});
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/notices/history`, { headers: { Authorization: `Bearer ${token}` } });
            setNotices(res.data);
        } catch (e) { toast.error("내역을 불러오지 못했습니다."); }
    };

    // ✨ [핵심 수정] 타겟(대상)을 한글 이름으로 똑똑하게 변환해 주는 함수
    const formatTarget = (n) => {
        if (n.target_type === "ALL") {
            return <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-lg text-xs font-black whitespace-nowrap shadow-sm">전체 공지</span>;
        }
        
        if (n.target_type === "BRAND") {
            const targetBrand = brands.find(b => b.id === n.target_brand_id);
            const brandName = targetBrand ? targetBrand.name : `알수없음`;
            return <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm">🏢 {brandName} (전체)</span>;
        }
        
        if (n.target_type === "STORE") {
            const targetStore = stores.find(s => s.id === n.target_store_id);
            if (targetStore) {
                // 이 매장이 속한 브랜드를 찾거나, 없으면 '단독 매장'으로 표시
                const parentBrand = brands.find(b => b.id === targetStore.brand_id);
                const prefix = parentBrand ? parentBrand.name : "독립/단독";
                return <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm">🏪 [{prefix}] {targetStore.name}</span>;
            }
            return <span className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shadow-sm">삭제된 매장</span>;
        }
        return "-";
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📋 공지사항 발송 내역</h2>
                <button onClick={fetchNotices} className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition text-sm flex items-center gap-2 shadow-sm">
                    🔄 새로고침
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                        <tr className="bg-slate-800 text-white text-sm">
                            <th className="p-4 font-bold w-16 text-center">No</th>
                            {/* 글씨가 잘리지 않도록 넓이를 넉넉하게 잡았습니다 */}
                            <th className="p-4 font-bold text-center">발송 대상</th>
                            <th className="p-4 font-bold w-1/2">공지 제목</th>
                            <th className="p-4 font-bold w-40 text-center">발송 일시</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notices.map((n, idx) => (
                            <tr key={n.id} onClick={() => setSelectedNotice(n)} className="border-b border-gray-100 hover:bg-indigo-50/50 cursor-pointer transition group">
                                <td className="p-4 text-center text-gray-400 font-bold">{notices.length - idx}</td>
                                <td className="p-4 text-center">{formatTarget(n)}</td>
                                <td className="p-4 font-bold text-gray-800 group-hover:text-indigo-600 transition truncate">{n.title}</td>
                                <td className="p-4 text-center text-xs text-gray-500 font-medium whitespace-nowrap">
                                    {new Date(n.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                            </tr>
                        ))}
                        {notices.length === 0 && (
                            <tr>
                                <td colSpan="4" className="p-10 text-center text-gray-400 font-bold bg-gray-50">발송된 공지사항 내역이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* 상세 내용 확인 팝업 모달 */}
            {selectedNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedNotice(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b bg-slate-800 text-white flex justify-between items-center">
                            <h3 className="font-bold flex items-center gap-2">📄 발송 공지 상세</h3>
                            <button onClick={() => setSelectedNotice(null)} className="text-gray-400 hover:text-white text-xl transition">×</button>
                        </div>
                        <div className="p-6 space-y-5">
                            {/* 팝업 안에서도 누구한테 보낸 건지 다시 명확하게 보여줍니다! */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
                                <span className="text-xs font-bold text-gray-500 shrink-0">발송 대상</span>
                                <div>{formatTarget(selectedNotice)}</div>
                            </div>
                            
                            <div>
                                <span className="text-xs font-bold text-gray-400 mb-1 block">제목</span>
                                <h4 className="font-extrabold text-lg text-gray-900">{selectedNotice.title}</h4>
                            </div>
                            <div>
                                <span className="text-xs font-bold text-gray-400 mb-1 block">발송 내용</span>
                                <p className="text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-xl border border-gray-200 text-sm leading-relaxed shadow-inner h-48 overflow-y-auto">
                                    {selectedNotice.content}
                                </p>
                            </div>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex justify-end">
                            <button onClick={() => setSelectedNotice(null)} className="bg-gray-800 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-black transition shadow-sm">닫기</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ==========================================
// 3. [점주/본사용] 영업장 정보 관리 컴포넌트
// ==========================================
function AdminStoreInfo({ store, token, fetchStore, user }) { 
    const [name, setName] = useState(store.name);
    const [address, setAddress] = useState(store.address || "");
    const [phone, setPhone] = useState(store.phone || "");
    const [desc, setDesc] = useState(store.description || "");
    const [notice, setNotice] = useState(store.notice || "");
    const [originInfo, setOriginInfo] = useState(store.origin_info || "");
    const [ownerName, setOwnerName] = useState(store.owner_name || "");
    const [businessName, setBusinessName] = useState(store.business_name || "");
    const [businessAddress, setBusinessAddress] = useState(store.business_address || "");
    const [businessNumber, setBusinessNumber] = useState(store.business_number || "");
    
    const [brandId, setBrandId] = useState(store.brand_id || "");
    const [priceMarkup, setPriceMarkup] = useState(store.price_markup || 0); 
    const [brands, setBrands] = useState([]);
    
    // ✨ 로열티 관련 상태
    const [royaltyType, setRoyaltyType] = useState(store.royalty_type || "PERCENTAGE"); 
    const [royaltyAmount, setRoyaltyAmount] = useState(store.royalty_amount || 0); 

    // ✨ [신규] 지역 및 직영/가맹 운영 타입 상태
    const [region, setRegion] = useState(store.region || "미지정");
    const [isDirectManage, setIsDirectManage] = useState(store.is_direct_manage || false);

    const isHQ = ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN"].includes(user?.role); // 본사 권한 확인

    useEffect(() => {
        axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setBrands(res.data)).catch(()=>{});
    }, []);

    const handleSave = async () => {
        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, 
                { 
                    name, address, phone, description: desc, notice, origin_info: originInfo, 
                    owner_name: ownerName, business_name: businessName, business_address: businessAddress, 
                    business_number: businessNumber, 
                    brand_id: brandId ? parseInt(brandId) : null,
                    price_markup: parseInt(priceMarkup),
                    royalty_type: royaltyType,                 // ✨ 로열티 타입 저장
                    royalty_amount: parseFloat(royaltyAmount), // ✨ 로열티 금액 저장
                    region: region,                            // ✨ [신규] 지역 정보 저장
                    is_direct_manage: isDirectManage           // ✨ [신규] 직영/가맹 여부 저장
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("가게 정보가 성공적으로 저장되었습니다."); 
            fetchStore();
        } catch(err) { 
            toast.error("저장 실패"); 
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">🏠 기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">소속 브랜드</label>
                        <select className="w-full border p-3 rounded-lg bg-indigo-50" value={brandId} onChange={e=>setBrandId(e.target.value)} disabled={!isHQ}>
                            <option value="">독립 매장</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1 flex justify-between">
                            지점 기본 가격 할증 (원) {!isHQ && <span className="text-red-500 text-xs">본사 전용</span>}
                        </label>
                        <input className={`w-full border p-3 rounded-lg ${!isHQ ? "bg-gray-100" : ""}`} type="number" value={priceMarkup} onChange={e=>setPriceMarkup(e.target.value)} disabled={!isHQ} placeholder="예: 강남점 500" />
                    </div>

                    {/* ✨ [신규] 매장 운영 분류 설정 (본사 전용) */}
                    <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                        <label className="block text-sm font-bold text-gray-800 mb-2 flex justify-between">
                            🗺️ 매장 운영 분류 설정 {!isHQ && <span className="text-red-500 text-xs">본사 전용</span>}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select 
                                className={`w-full sm:w-1/3 border p-3 rounded-lg font-bold ${!isHQ ? "bg-gray-100" : "bg-white"}`} 
                                value={region} onChange={e=>setRegion(e.target.value)} disabled={!isHQ}
                            >
                                <option value="미지정">지역 선택 안함</option>
                                <option value="서울">서울</option>
                                <option value="경기">경기</option>
                                <option value="인천">인천</option>
                                <option value="강원">강원</option>
                                <option value="충청">충청</option>
                                <option value="전라">전라</option>
                                <option value="경상">경상</option>
                                <option value="부산">부산</option>
                                <option value="제주">제주</option>
                            </select>
                            <select 
                                className={`w-full sm:w-2/3 border p-3 rounded-lg font-bold ${!isHQ ? "bg-gray-100" : "text-indigo-700 bg-indigo-50"}`} 
                                value={isDirectManage} onChange={e=>setIsDirectManage(e.target.value === 'true')} disabled={!isHQ}
                            >
                                <option value={false}>🤝 가맹점 (Franchise)</option>
                                <option value={true}>🏢 본사 직영점 (Direct)</option>
                            </select>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                        <label className="block text-sm font-bold text-gray-800 mb-2 flex justify-between">
                            👑 본사 로열티 (수수료) 정책 설정 {!isHQ && <span className="text-red-500 text-xs">본사 전용</span>}
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <select 
                                className={`border p-3 rounded-lg flex-1 font-bold ${!isHQ ? "bg-gray-100" : "bg-white"}`}
                                value={royaltyType} onChange={e=>setRoyaltyType(e.target.value)} disabled={!isHQ}
                            >
                                <option value="PERCENTAGE">매출 비례 방식 (%)</option>
                                <option value="FIXED">고정 금액 방식 (원)</option>
                            </select>
                            <div className="flex-1 relative">
                                <input 
                                    className={`w-full border p-3 rounded-lg text-right pr-8 font-bold ${!isHQ ? "bg-gray-100" : ""}`} 
                                    type="number" step={royaltyType === "PERCENTAGE" ? "0.1" : "1000"} 
                                    value={royaltyAmount} onChange={e=>setRoyaltyAmount(e.target.value)} disabled={!isHQ} 
                                    placeholder={royaltyType === "PERCENTAGE" ? "예: 3.5" : "예: 300000"} 
                                />
                                <span className="absolute right-3 top-3.5 text-gray-400 font-bold">{royaltyType === "PERCENTAGE" ? "%" : "원"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 이름</label><input className="w-full border p-3 rounded-lg" value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">전화번호</label><input className="w-full border p-3 rounded-lg" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 주소</label><input className="w-full border p-3 rounded-lg" value={address} onChange={e=>setAddress(e.target.value)} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 소개</label><textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
                </div>
            </div>
            
            <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md">저장하기</button>
        </div>
    );
}

// 3-1. [점주/직원용] 본사 공지사항 수신함 컴포넌트
function StoreNoticeBoard({ token }) {
    const [notices, setNotices] = useState([]);
    const [selectedNotice, setSelectedNotice] = useState(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/notices/my`, { headers: { Authorization: `Bearer ${token}` } });
            setNotices(res.data);
        } catch (e) { toast.error("공지사항 목록을 불러오지 못했습니다."); }
    };

    // ✨ 공지사항 "확인(읽음)" 처리 함수
    const handleReadNotice = async (noticeId) => {
        try {
            await axios.post(`${API_BASE_URL}/notices/${noticeId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("공지를 확인했습니다.");
            setSelectedNotice(null);
            fetchNotices(); // 목록 새로고침해서 뱃지(안읽음->읽음) 업데이트
        } catch(e) { toast.error("처리 중 오류가 발생했습니다."); }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📢 본사 공지사항 수신함</h2>
                <button onClick={fetchNotices} className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition text-sm flex items-center gap-2 shadow-sm">
                    🔄 새로고침
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr className="bg-indigo-50/50 text-indigo-900 text-sm border-b border-indigo-100">
                            <th className="p-4 font-bold w-24 text-center">상태</th>
                            <th className="p-4 font-bold w-1/2">제목</th>
                            <th className="p-4 font-bold text-center">수신 일시</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notices.map((n) => (
                            <tr key={n.id} onClick={() => setSelectedNotice(n)} className={`border-b border-gray-100 cursor-pointer transition group ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-red-50/30 hover:bg-red-50'}`}>
                                <td className="p-4 text-center">
                                    {/* ✨ 안읽음 / 읽음 상태 명확히 표시 */}
                                    {n.is_read 
                                        ? <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[11px] font-bold">읽음</span>
                                        : <span className="bg-red-500 text-white px-2 py-1 rounded text-[11px] font-bold shadow-sm animate-pulse">🔴 안읽음</span>
                                    }
                                </td>
                                <td className={`p-4 font-bold transition truncate ${n.is_read ? 'text-gray-600' : 'text-gray-900 group-hover:text-red-600'}`}>
                                    {n.title}
                                </td>
                                <td className="p-4 text-center text-xs text-gray-500 font-medium">
                                    {new Date(n.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                            </tr>
                        ))}
                        {notices.length === 0 && (
                            <tr>
                                <td colSpan="3" className="p-10 text-center text-gray-400 font-bold bg-gray-50">수신된 공지사항이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ✨ 공지사항 상세 읽기 모달 */}
            {selectedNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedNotice(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className={`${selectedNotice.is_read ? 'bg-slate-800' : 'bg-red-600'} p-5 text-white flex justify-between items-center`}>
                            <h3 className="font-bold flex items-center gap-2">
                                {selectedNotice.is_read ? '📄 공지사항 확인' : '🚨 새로운 공지사항'}
                            </h3>
                            <button onClick={() => setSelectedNotice(null)} className="text-white/70 hover:text-white text-xl transition">×</button>
                        </div>
                        <div className="p-8 space-y-4">
                            <h4 className="font-extrabold text-2xl text-gray-900 mb-2">{selectedNotice.title}</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-5 rounded-xl border border-gray-100 text-[15px] leading-relaxed h-48 overflow-y-auto">
                                {selectedNotice.content}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex gap-2">
                            {/* ✨ 안 읽은 공지면 '확인했습니다' 버튼, 읽은 공지면 단순 '닫기' 버튼 노출 */}
                            {!selectedNotice.is_read ? (
                                <button onClick={() => handleReadNotice(selectedNotice.id)} className="w-full bg-red-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-md active:scale-95">
                                    ✅ 확인했습니다 (읽음 처리)
                                </button>
                            ) : (
                                <button onClick={() => setSelectedNotice(null)} className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-400 transition">
                                    닫기
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminMenuManagement({ store, token, fetchStore, user }) {
    const isHQ = ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN"].includes(user?.role); // 👈 본사 권한 확인 추가
    const [storeOptionGroups, setStoreOptionGroups] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [menuName, setMenuName] = useState("");
    const [menuPrice, setMenuPrice] = useState("");
    const [isPriceFixed, setIsPriceFixed] = useState(false); // ✨ 신규 생성용 '가격 고정' 상태 추가
    const [menuDesc, setMenuDesc] = useState("");
    const [menuImage, setMenuImage] = useState(null);
    const [newGroupName, setNewGroupName] = useState("");
    const [isSingleSelect, setIsSingleSelect] = useState(false);
    const [isRequired, setIsRequired] = useState(false); 
    const [maxSelect, setMaxSelect] = useState(0);
    const [activeOptionGroupId, setActiveOptionGroupId] = useState(null);
    const [newOptionName, setNewOptionName] = useState("");
    const [newOptionPrice, setNewOptionPrice] = useState("");
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState("");
    const [editingGroupSingle, setEditingGroupSingle] = useState(false);
    const [editingGroupRequired, setEditingGroupRequired] = useState(false);
    const [editingGroupMax, setEditingGroupMax] = useState(0);
    const [editingOptionId, setEditingOptionId] = useState(null);
    const [editingOptionName, setEditingOptionName] = useState("");
    const [editingOptionPrice, setEditingOptionPrice] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingMenu, setEditingMenu] = useState(null);
    const [editTab, setEditTab] = useState("basic"); 
    const optionListRef = useRef(null);
    
    useEffect(() => { refreshOptionGroups(); }, [store.id]);

    const refreshOptionGroups = () => {
        axios.get(`${API_BASE_URL}/stores/${store.id}/option-groups/`, {
            headers: { Authorization: `Bearer ${token}` } // 👈 핵심: 신분증(토큰) 제시!
        })
        .then(res => setStoreOptionGroups(res.data))
        .catch(console.error);
    };

    const refreshAll = () => { fetchStore(); refreshOptionGroups(); };

    const handleCreateCategory = async () => {
        if (!categoryName) return;
        const nextOrder = store.categories.length > 0 ? Math.max(...store.categories.map(c => c.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/stores/${store.id}/categories/`, { name: categoryName, order_index: nextOrder }, {headers:{Authorization:`Bearer ${token}`}});
        setCategoryName(""); refreshAll();
    };

    const handleCreateMenu = async () => {
        if (!selectedCategoryId || !menuName || !menuPrice) return toast.error("카테고리, 이름, 가격은 필수입니다.");
        const category = store.categories.find(c => c.id == selectedCategoryId);
        const nextOrder = category && category.menus.length > 0 ? Math.max(...category.menus.map(m => m.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/categories/${selectedCategoryId}/menus/`, 
            { name: menuName, price: parseInt(menuPrice), description: menuDesc, image_url: menuImage, order_index: nextOrder, is_price_fixed: isPriceFixed }, // 👈 추가됨
            {headers:{Authorization:`Bearer ${token}`}}
        );
        setMenuName(""); setMenuPrice(""); setMenuDesc(""); setMenuImage(null); setIsPriceFixed(false); refreshAll(); // 👈 초기화 추가됨
    };

    const handleCreateOptionGroup = async () => {
        if (!newGroupName) return;
        const nextOrder = storeOptionGroups.length > 0 ? Math.max(...storeOptionGroups.map(g => g.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/stores/${store.id}/option-groups/`, 
            { name: newGroupName, is_single_select: isSingleSelect, is_required: isRequired, max_select: parseInt(maxSelect), order_index: nextOrder }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setNewGroupName(""); setIsSingleSelect(false); setIsRequired(false); setMaxSelect(0); refreshAll();

        // ✨ [추가] 새 그룹이 생성되면 목록 맨 아래로 부드럽게 스크롤!
        setTimeout(() => {
            if (optionListRef.current) optionListRef.current.scrollTo({ top: optionListRef.current.scrollHeight, behavior: 'smooth' });
        }, 100);
    };

    const handleCreateOption = async (groupId) => {
        if (!newOptionName) return;
        const group = storeOptionGroups.find(g => g.id === groupId);
        const nextOrder = group && group.options.length > 0 ? Math.max(...group.options.map(o => o.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/option-groups/${groupId}/options/`, 
            { name: newOptionName, price: parseInt(newOptionPrice)||0, order_index: nextOrder }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // ✨ [수정 완료] 창을 닫는 코드(setActiveOptionGroupId(null))를 완전히 제거했습니다.
        // 이제 이름과 가격을 치고 엔터를 누르면 창이 닫히지 않고 바로바로 연속 추가가 가능합니다!
        setNewOptionName(""); setNewOptionPrice(""); refreshAll();
    };

    const handleImageUpload = async (e, setFunc) => {
        const formData = new FormData(); formData.append("file", e.target.files[0]);
        const res = await axios.post(`${API_BASE_URL}/upload/`, formData); setFunc(res.data.url);
    };

    const openEditModal = (menu) => {
        const sortedGroups = menu.option_groups ? [...menu.option_groups].sort((a, b) => a.order_index - b.order_index) : [];
        setEditingMenu({ ...menu, option_groups: sortedGroups });
        setEditTab("basic");
        setIsEditModalOpen(true);
    };

    const handleUpdateMenuBasic = async () => {
        await axios.patch(`${API_BASE_URL}/menus/${editingMenu.id}`, {
            name: editingMenu.name,
            price: parseInt(editingMenu.price),
            description: editingMenu.description,
            is_sold_out: editingMenu.is_sold_out,
            is_hidden: editingMenu.is_hidden,
            image_url: editingMenu.image_url,
            is_price_fixed: editingMenu.is_price_fixed // 👈 추가됨
        }, { headers: { Authorization: `Bearer ${token}` } }); 
        toast.success("수정되었습니다."); setIsEditModalOpen(false); refreshAll();
    };

    const handleDeleteMenu = async () => {
        if(!window.confirm("정말 삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/menus/${editingMenu.id}`, { headers: { Authorization: `Bearer ${token}` } }); // 👈 토큰 추가됨!
        setIsEditModalOpen(false); refreshAll();
    };

    // ✨ [신규 추가] 카테고리 삭제 함수
    const handleDeleteCategory = async (categoryId) => {
        if(!window.confirm("카테고리를 삭제하면 안에 있는 '모든 메뉴'가 함께 삭제됩니다! 정말 삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/categories/${categoryId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("카테고리가 삭제되었습니다.");
            refreshAll();
        } catch(err) { toast.error("카테고리 삭제 실패"); }
    };

    // ✨ [신규 추가] 옵션 그룹 삭제 함수
    const handleDeleteOptionGroup = async (groupId) => {
        if(!window.confirm("이 옵션 그룹을 삭제하면 모든 세부 옵션이 사라지며, 연결된 메뉴에서도 해제됩니다. 정말 삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/option-groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("옵션 그룹이 삭제되었습니다.");
            refreshAll();
        } catch(err) { toast.error("옵션 그룹 삭제 실패"); }
    };

    const saveGroup = async (groupId) => {
        await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { 
            name: editingGroupName, 
            is_single_select: editingGroupSingle, 
            is_required: editingGroupRequired,
            max_select: parseInt(editingGroupMax)
        }, { headers: { Authorization: `Bearer ${token}` } }); // 👈 토큰 추가됨!
        setEditingGroupId(null); refreshAll();
    };
    
    const handleUpdateGroupOrder = async (groupId, newOrder) => {
        await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { order_index: parseInt(newOrder) }, { headers: { Authorization: `Bearer ${token}` } });
        refreshAll();
    };

    const saveOption = async (optId) => {
        await axios.patch(`${API_BASE_URL}/options/${optId}`, { name: editingOptionName, price: parseInt(editingOptionPrice) }, { headers: { Authorization: `Bearer ${token}` } });
        setEditingOptionId(null); refreshAll();
    };
    
    // 💡 [추가] 옵션 그룹 수정 모드 켜기
    const startEditGroup = (group) => {
        setEditingGroupId(group.id);
        setEditingGroupName(group.name);
        setEditingGroupSingle(group.is_single_select);
        setEditingGroupRequired(group.is_required);
        setEditingGroupMax(group.max_select || 0);
    };

    // 💡 [추가] 세부 옵션 항목 수정 모드 켜기
    const startEditOption = (opt) => {
        setEditingOptionId(opt.id);
        setEditingOptionName(opt.name);
        setEditingOptionPrice(opt.price || 0);
    };

    const handleUpdateOptionOrder = async (optId, newOrder) => {
        await axios.patch(`${API_BASE_URL}/options/${optId}`, { order_index: parseInt(newOrder) }, { headers: { Authorization: `Bearer ${token}` } });
        refreshAll();
    };
    
    const handleUpdateOptionDefault = async (groupId, optId) => {
        try {
            const group = storeOptionGroups.find(g => g.id === groupId);
            
            // 💡 1택(단일 선택)이거나 필수인 경우, 그룹 내의 다른 '기본값'들을 찾아 모두 해제(false)시킴
            if (group && (group.is_single_select || group.is_required)) {
                const existingDefaults = group.options.filter(o => o.is_default && o.id !== optId);
                for (const oldOpt of existingDefaults) {
                    await axios.patch(`${API_BASE_URL}/options/${oldOpt.id}`, { is_default: false }, { headers: { Authorization: `Bearer ${token}` } });
                }
            }
            
            // 클릭한 옵션을 새로운 기본값(true)으로 설정
            await axios.patch(`${API_BASE_URL}/options/${optId}`, { is_default: true }, { headers: { Authorization: `Bearer ${token}` } });
            refreshAll();
        } catch (err) {
            toast.error("기본 설정 변경에 실패했습니다.");
        }
    };
    
    const handleDeleteOption = async (optId) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/options/${optId}`, { headers: { Authorization: `Bearer ${token}` } });
        refreshAll();
    };

    const toggleOptionGroupLink = async (groupId, isLinked) => {
        try {
            if (isLinked) {
                await axios.delete(`${API_BASE_URL}/menus/${editingMenu.id}/option-groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } });
            } else {
                await axios.post(`${API_BASE_URL}/menus/${editingMenu.id}/link-option-group/${groupId}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            }
            
            let updatedGroups = [];
            if (isLinked) {
                updatedGroups = editingMenu.option_groups.filter(g => g.id !== groupId);
            } else {
                const groupToAdd = storeOptionGroups.find(g => g.id === groupId);
                updatedGroups = [...(editingMenu.option_groups || []), groupToAdd];
            }
            setEditingMenu({ ...editingMenu, option_groups: updatedGroups });
            refreshAll(); 
        } catch (err) { toast.error("연결 실패"); }
    };

    const handleReorderLinkedGroup = async (index, direction) => {
        const groups = [...editingMenu.option_groups];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= groups.length) return;

        const temp = groups[index];
        groups[index] = groups[targetIndex];
        groups[targetIndex] = temp;

        setEditingMenu({ ...editingMenu, option_groups: groups });

        try {
            const item1 = groups[index];
            const item2 = groups[targetIndex];
            await axios.patch(`${API_BASE_URL}/menus/${editingMenu.id}/option-groups/${item1.id}/reorder`, { order_index: index + 1 }, { headers: { Authorization: `Bearer ${token}` } });
            await axios.patch(`${API_BASE_URL}/menus/${editingMenu.id}/option-groups/${item2.id}/reorder`, { order_index: targetIndex + 1 }, { headers: { Authorization: `Bearer ${token}` } });
            refreshAll();
        } catch (err) { console.error("순서 변경 실패", err); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 h-full pb-20">
            
            {/* 왼쪽: 메뉴 관리 (기존 코드와 동일) */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-1">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4 text-lg">✨ 메뉴 등록</h3>
                    <div className="flex gap-2 mb-2 bg-gray-50 p-3 rounded-lg">
                        <select className="border p-2 rounded flex-1" value={selectedCategoryId} onChange={e=>setSelectedCategoryId(e.target.value)}>
                            <option value="">카테고리 선택</option>
                            {store.categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input className="border p-2 rounded w-40" placeholder="새 카테고리명" value={categoryName} onChange={e=>setCategoryName(e.target.value)}/>
                        <button onClick={handleCreateCategory} className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-bold">카테고리 추가</button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        <input className="col-span-3 border p-2 rounded" placeholder="메뉴 이름" value={menuName} onChange={e=>setMenuName(e.target.value)}/>
                        <input className="border p-2 rounded" placeholder="가격" type="number" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)}/>
                    </div>
                    <input className="border p-2 rounded w-full mb-2" placeholder="메뉴 상세 설명" value={menuDesc} onChange={e=>setMenuDesc(e.target.value)}/>
                    
                    {isHQ && (
                        <label className="flex items-center gap-2 mb-3 bg-red-50 p-2 rounded border border-red-100 cursor-pointer">
                            <input type="checkbox" checked={isPriceFixed} onChange={e=>setIsPriceFixed(e.target.checked)}/>
                            <span className="text-sm font-bold text-red-700">🔒 이 메뉴의 가격을 전 지점에서 강제 고정합니다 (점주 수정 불가)</span>
                        </label>
                    )}
                    
                    <div className="flex items-center gap-2 mb-3">
                        <input type="file" onChange={e=>handleImageUpload(e, setMenuImage)} className="text-sm py-2 text-gray-500"/>
                        {menuImage && <span className="text-xs text-green-600 font-bold">이미지 업로드됨</span>}
                    </div>
                    <button onClick={handleCreateMenu} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md">메뉴 등록하기</button>
                </div>

                {store.categories?.map(cat => (
                    <div key={cat.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2 flex justify-between items-center">
                            <span>{cat.name}</span>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition font-bold">🗑️ 카테고리 삭제</button>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {cat.menus?.map(menu => (
                                <div key={menu.id} onClick={() => openEditModal(menu)} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-300 hover:shadow-md cursor-pointer transition bg-white items-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                                        {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-xl">🥘</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-800 truncate">{menu.name}</span>
                                            {menu.is_sold_out && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">품절</span>}
                                        </div>
                                        <p className="text-sm text-gray-500">{menu.price.toLocaleString()}원</p>
                                        <div className="flex gap-1 mt-1 overflow-x-auto scrollbar-hide">
                                            {menu.option_groups?.sort((a,b)=>a.order_index-b.order_index).map(g => <span key={g.id} className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 rounded border border-indigo-100 whitespace-nowrap">{g.name}</span>)}
                                            {(!menu.option_groups || menu.option_groups.length === 0) && <span className="text-[10px] text-gray-300">옵션없음</span>}
                                        </div>
                                    </div>
                                    <div className="text-gray-300">⚙️</div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 오른쪽: 옵션 라이브러리 */}
            {/* ✨ p-5를 p-3 sm:p-4로 줄여서 내부 여백을 좁혔습니다 */}
            <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-gray-300 flex flex-col h-full overflow-hidden">
                <h2 className="text-lg font-bold mb-3 shrink-0">📚 옵션 관리 라이브러리</h2>
                
                <div className="mb-4 bg-gray-50 p-3 rounded-xl shrink-0 border border-gray-200">
                    <input className="border p-2 rounded-lg w-full text-sm mb-3 font-bold" placeholder="새 그룹명 (예: 맵기 조절)" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCreateOptionGroup()} />
                    <div className="flex flex-col gap-2 mb-3">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer font-bold text-gray-600"><input type="checkbox" checked={isSingleSelect} onChange={e=>setIsSingleSelect(e.target.checked)} className="w-4 h-4"/> 1개만 선택</label>
                            <label className="flex items-center gap-1.5 text-xs sm:text-sm cursor-pointer font-bold text-gray-600"><input type="checkbox" checked={isRequired} onChange={e=>setIsRequired(e.target.checked)} className="w-4 h-4"/> 필수 선택</label>
                        </div>
                        {!isSingleSelect && (
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                <span>최대 선택:</span>
                                <input type="number" className="border rounded-lg w-14 p-1 text-center" value={maxSelect} onChange={e=>setMaxSelect(e.target.value)} min="0" placeholder="0"/>
                            </div>
                        )}
                    </div>
                    <button onClick={handleCreateOptionGroup} className="w-full bg-slate-800 text-white py-2.5 rounded-lg text-sm font-bold hover:bg-black transition shadow-md">새 그룹 생성</button>
                </div>
                
                <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4" ref={optionListRef}>
                    {storeOptionGroups.map(group => (
                        <div key={group.id} className={`p-3 rounded-xl border-2 transition duration-200 shadow-sm ${activeOptionGroupId === group.id ? 'border-indigo-400 bg-indigo-50/30' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                            
                            <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-2">
                                <div className="flex-1 min-w-0 pr-2">
                                    {editingGroupId === group.id ? (
                                        <div className="flex flex-col gap-2">
                                            <input className="border p-1.5 rounded-lg w-full text-sm font-bold" value={editingGroupName} onChange={e=>setEditingGroupName(e.target.value)} />
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <label className="text-[10px] flex items-center gap-0.5 font-bold"><input type="checkbox" checked={editingGroupSingle} onChange={e=>setEditingGroupSingle(e.target.checked)}/>1택</label>
                                                <label className="text-[10px] flex items-center gap-0.5 font-bold"><input type="checkbox" checked={editingGroupRequired} onChange={e=>setEditingGroupRequired(e.target.checked)}/>필수</label>
                                                {!editingGroupSingle && <input type="number" className="w-10 border rounded p-1 text-[10px] text-center" value={editingGroupMax} onChange={e=>setEditingGroupMax(e.target.value)} placeholder="Max"/>}
                                                <button onClick={()=>saveGroup(group.id)} className="text-[10px] bg-indigo-600 text-white px-2 py-1 rounded-lg ml-auto font-bold">저장</button>
                                                <button onClick={()=>setEditingGroupId(null)} className="text-[10px] bg-gray-300 text-gray-700 px-2 py-1 rounded-lg font-bold">취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <span className="font-extrabold text-gray-900 text-base">{group.name}</span>
                                                {group.is_required && <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">필수</span>}
                                                {group.is_single_select && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold">1택</span>}
                                                <button onClick={()=>startEditGroup(group)} className="text-[10px] text-gray-400 hover:text-indigo-600 ml-1">✏️수정</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                
                                <div className="flex flex-col gap-1 shrink-0">
                                    <button onClick={() => setActiveOptionGroupId(activeOptionGroupId === group.id ? null : group.id)} className={`text-[11px] border px-2 py-1.5 rounded-lg font-bold transition shadow-sm ${activeOptionGroupId === group.id ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50"}`}>
                                        {activeOptionGroupId === group.id ? "접기" : "옵션추가"}
                                    </button>
                                    <button onClick={() => handleDeleteOptionGroup(group.id)} className="text-[10px] text-red-500 hover:text-red-700 bg-red-50 border border-red-100 px-2 py-1 rounded-lg font-bold">
                                        삭제
                                    </button>
                                </div>
                            </div>
                            
                            {/* ✨ 세부 옵션 목록 (글씨 안 짤리도록 보완) */}
                            <div className="mt-2">
                                <ul className="border-t border-gray-100">
                                    {group.options.map(opt => (
                                        <li key={opt.id} className="flex flex-col py-2 border-b border-gray-100 group/opt relative hover:bg-gray-50/50 transition-colors">
                                            
                                            {editingOptionId === opt.id ? (
                                                <div className="flex flex-col gap-1.5 w-full bg-indigo-50/50 p-2 rounded-lg border border-indigo-100">
                                                    <input className="border border-indigo-200 p-1.5 rounded-md text-sm font-bold w-full bg-white" value={editingOptionName} onChange={e=>setEditingOptionName(e.target.value)} placeholder="옵션명" />
                                                    <div className="flex gap-1.5 w-full">
                                                        <input className="border border-indigo-200 p-1.5 rounded-md flex-1 min-w-0 text-sm text-right font-bold text-indigo-600 bg-white" type="number" value={editingOptionPrice} onChange={e=>setEditingOptionPrice(e.target.value)} placeholder="가격" />
                                                        <button onClick={()=>saveOption(opt.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md font-bold text-[11px] shrink-0">저장</button>
                                                        <button onClick={()=>setEditingOptionId(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1.5 rounded-md font-bold text-[11px] shrink-0">취소</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col w-full gap-1">
                                                    <div className="flex items-center justify-between w-full gap-1.5">
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                            {/* 순서칸 크기를 w-8에서 w-7로 살짝 더 줄였습니다 */}
                                                            <input type="number" className="w-7 border border-gray-200 rounded text-center text-xs py-1 bg-gray-50 text-gray-400 hover:bg-white focus:bg-white transition shrink-0 outline-none" defaultValue={opt.order_index} onBlur={(e)=>handleUpdateOptionOrder(opt.id, e.target.value)} />
                                                            
                                                            {/* ✨ 핵심: truncate 삭제하고 whitespace-normal과 break-keep 추가해서 글씨가 자연스럽게 줄바꿈 되도록 했습니다. */}
                                                            <span className="text-[13px] font-extrabold text-slate-800 flex-1 whitespace-normal break-keep leading-snug">{opt.name}</span>
                                                        </div>
                                                        
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                                                                +{opt.price.toLocaleString()}원
                                                            </span>
                                                            <div className="flex gap-0 opacity-0 group-hover/opt:opacity-100 transition-opacity duration-200 shrink-0 bg-white shadow-sm rounded border border-gray-200">
                                                                <button onClick={()=>startEditOption(opt)} className="w-5 h-5 flex items-center justify-center hover:bg-gray-100 transition text-[10px] rounded-l" title="수정">✏️</button>
                                                                <button onClick={()=>handleDeleteOption(opt.id)} className="w-5 h-5 flex items-center justify-center hover:bg-red-50 text-red-500 transition text-[10px] rounded-r border-l border-gray-200" title="삭제">🗑️</button>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {(group.is_single_select || group.is_required) && (
                                                        <div className="pl-8 pt-0.5">
                                                            {opt.is_default 
                                                            ? <span className="bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm inline-block">기본 옵션</span> 
                                                            : <button onClick={()=>handleUpdateOptionDefault(group.id, opt.id)} className="border border-gray-300 text-gray-400 hover:text-indigo-600 hover:border-indigo-300 text-[9px] font-bold px-1.5 py-0.5 rounded transition inline-block bg-white">기본 지정</button>
                                                            }
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                    {group.options.length === 0 && <li className="text-[11px] font-bold text-gray-400 text-center py-3 border-b border-gray-100">등록된 옵션 없음</li>}
                                </ul>

                                {/* 옵션 추가 영역 */}
                                {activeOptionGroupId === group.id && (
                                    <div className="flex flex-col gap-1.5 mt-2 p-2 bg-indigo-50/50 rounded-lg animate-fadeIn border border-indigo-100">
                                        <input className="border border-indigo-200 p-1.5 rounded-md text-sm w-full font-bold focus:border-indigo-400 outline-none bg-white" placeholder="새 옵션명" value={newOptionName} onChange={e=>setNewOptionName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateOption(group.id)} autoFocus />
                                        <div className="flex gap-1.5">
                                            <input className="border border-indigo-200 p-1.5 rounded-md text-sm flex-1 min-w-0 text-right font-bold focus:border-indigo-400 outline-none bg-white" type="number" placeholder="가격" value={newOptionPrice} onChange={e=>setNewOptionPrice(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateOption(group.id)} />
                                            <button onClick={()=>handleCreateOption(group.id)} className="bg-indigo-600 text-white px-3 rounded-md font-bold text-xs hover:bg-indigo-700 shadow-sm shrink-0">추가</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 수정 모달 */}
            {isEditModalOpen && editingMenu && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b bg-gray-800 text-white flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold">🛠️ '{editingMenu.name}' 수정</h2>
                            <button onClick={()=>setIsEditModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">×</button>
                        </div>
                        <div className="flex border-b shrink-0">
                            <button onClick={()=>setEditTab("basic")} className={`flex-1 py-3 font-bold transition ${editTab==="basic" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-50"}`}>📝 기본 정보</button>
                            <button onClick={()=>setEditTab("options")} className={`flex-1 py-3 font-bold transition ${editTab==="options" ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50" : "text-gray-500 hover:bg-gray-50"}`}>🔗 옵션 연결 ({editingMenu.option_groups?.length || 0})</button>
                        </div>
                        <div className="p-6 overflow-y-auto flex-1">
                            {editTab === "basic" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* ✨ 본사가 가격 고정 시 메뉴명과 설명란도 함께 잠깁니다. */}
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">메뉴 이름</label><input className="border w-full p-2 rounded" value={editingMenu.name} onChange={e=>setEditingMenu({...editingMenu, name: e.target.value})} disabled={!isHQ && editingMenu.is_price_fixed} /></div>
                                        <div>
                                            {/* ✨ 고정된 메뉴라면 점주에게는 입력창을 잠그고 안내문을 띄움 */}
                                            <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">가격 {(!isHQ && editingMenu.is_price_fixed) && <span className="text-xs text-red-500 font-bold">본사 고정 가격</span>}</label>
                                            <input className={`border w-full p-2 rounded ${(!isHQ && editingMenu.is_price_fixed) ? "bg-gray-100 text-gray-400" : ""}`} type="number" disabled={!isHQ && editingMenu.is_price_fixed} value={editingMenu.price} onChange={e=>setEditingMenu({...editingMenu, price: e.target.value})} />
                                        </div>
                                    </div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">설명</label><textarea className="border w-full p-2 rounded resize-none" rows="3" value={editingMenu.description || ""} onChange={e=>setEditingMenu({...editingMenu, description: e.target.value})} disabled={!isHQ && editingMenu.is_price_fixed} /></div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">이미지 URL</label><input className="border w-full p-2 rounded text-sm text-gray-500" value={editingMenu.image_url || ""} disabled placeholder="이미지 변경은 삭제 후 재등록이 필요합니다." /></div>
                                    <div className="flex gap-6 pt-2 flex-wrap">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50 flex-1 min-w-[120px]"><input type="checkbox" checked={editingMenu.is_sold_out} onChange={e=>setEditingMenu({...editingMenu, is_sold_out: e.target.checked})} className="w-5 h-5 text-red-600"/> <span className="font-bold text-red-600">품절 처리</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50 flex-1 min-w-[120px]"><input type="checkbox" checked={editingMenu.is_hidden} onChange={e=>setEditingMenu({...editingMenu, is_hidden: e.target.checked})} className="w-5 h-5 text-gray-600"/> <span className="font-bold text-gray-600">메뉴 숨김</span></label>
                                        
                                        {/* ✨ 여기에 추가되었습니다! 본사 권한(isHQ)일 때만 수정 모달에서 고정 설정 체크박스 노출 */}
                                        {isHQ && (
                                            <label className="flex items-center gap-2 cursor-pointer p-2 border rounded border-red-200 bg-red-50 hover:bg-red-100 flex-1 min-w-[150px]">
                                                <input type="checkbox" checked={editingMenu.is_price_fixed} onChange={e=>setEditingMenu({...editingMenu, is_price_fixed: e.target.checked})} className="w-5 h-5 text-red-600"/> 
                                                <span className="font-bold text-red-800 text-sm">본사 가격 고정</span>
                                            </label>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <button onClick={handleUpdateMenuBasic} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">수정 저장</button>
                                        <button onClick={handleDeleteMenu} className="bg-red-100 text-red-600 px-4 py-3 rounded-lg font-bold hover:bg-red-200">삭제</button>
                                    </div>
                                </div>

                            ) : (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                                        <h4 className="font-bold text-indigo-900 mb-3 text-sm flex items-center gap-2">🔗 현재 연결된 옵션 (순서 변경 가능)</h4>
                                        <div className="space-y-2">
                                            {editingMenu.option_groups?.length > 0 ? (
                                                editingMenu.option_groups.map((group, idx) => (
                                                    <div key={group.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm border border-indigo-100">
                                                        <span className="font-bold text-sm text-gray-700">{idx+1}. {group.name}</span>
                                                        <div className="flex gap-1">
                                                            <button onClick={(e) => {e.stopPropagation(); handleReorderLinkedGroup(idx, -1);}} disabled={idx === 0} className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">⬆️</button>
                                                            <button onClick={(e) => {e.stopPropagation(); handleReorderLinkedGroup(idx, 1);}} disabled={idx === editingMenu.option_groups.length - 1} className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30">⬇️</button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-xs text-gray-500 text-center py-2">아직 연결된 옵션이 없습니다.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-700 mb-3 text-sm">📚 전체 옵션 라이브러리 (체크하여 연결)</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {storeOptionGroups.map(group => {
                                                const isLinked = editingMenu.option_groups?.some(g => g.id === group.id);
                                                return (
                                                    <div key={group.id} onClick={() => toggleOptionGroupLink(group.id, isLinked)} className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${isLinked ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-400 bg-white"}`}>
                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold truncate ${isLinked ? "text-indigo-800" : "text-gray-700"}`}>{group.name}</span>
                                                                {group.is_required && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold shrink-0">필수</span>}
                                                                {group.is_single_select && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold shrink-0">1택</span>}
                                                                {!group.is_single_select && group.max_select > 0 && <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold shrink-0">Max {group.max_select}</span>}
                                                            </div>
                                                            {/* ✨ 핵심: 체크하는 곳에서도 상세 옵션을 미리 볼 수 있습니다! */}
                                                            <p className="text-[11px] text-gray-500 mt-1 truncate">
                                                                {group.options && group.options.length > 0 ? group.options.map(o => o.name).join(", ") : "비어있음"}
                                                            </p>
                                                        </div>
                                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition ${isLinked ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"}`}>
                                                            {isLinked && <span className="text-white text-sm font-bold">✓</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminCallOptionManagement({ store, token }) {
    const [options, setOptions] = useState([]);
    const [newName, setNewName] = useState("");

    const fetchOptions = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/call-options`, { headers: { Authorization: `Bearer ${token}` } });
            setOptions(res.data);
        } catch (err) { console.error("옵션 로딩 실패"); }
    };

    useEffect(() => { fetchOptions(); }, [store.id]);

    const handleAdd = async () => {
        if (!newName) return;
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/call-options`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
            setNewName(""); fetchOptions();
        } catch (err) { toast.error("추가 실패"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/call-options/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchOptions(); }
        catch (err) { toast.error("삭제 실패"); }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔔 직원 호출 옵션 관리</h2>
            <div className="flex gap-2 mb-6">
                <input className="border p-3 rounded-lg flex-1 text-lg" placeholder="새로운 요청 항목 (예: 물티슈)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdd()} />
                <button onClick={handleAdd} className="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700 shadow-md">추가하기</button>
            </div>
            <div className="space-y-3">
                {options.map(opt => (
                    <div key={opt.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-bold text-gray-700 text-lg">{opt.name}</span>
                        <button onClick={()=>handleDelete(opt.id)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-white border border-red-100 px-3 py-1 rounded-lg">삭제</button>
                    </div>
                ))}
                {options.length === 0 && <p className="text-center text-gray-400 py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">등록된 옵션이 없습니다.</p>}
            </div>
            <div className="mt-8 p-5 bg-yellow-50 rounded-xl text-sm text-yellow-800 border border-yellow-200 flex items-start gap-3"><span className="text-xl">💡</span><div><p className="font-bold text-lg mb-1">알아두세요</p><p><b>'직원만 호출 🙋'</b> 버튼은 시스템 기본값으로 항상 표시됩니다.</p></div></div>
        </div>
    );
}

function AdminHours({ store, token, fetchStore }) {
    const [hours, setHours] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [newHolidayDate, setNewHolidayDate] = useState("");
    const [newHolidayDesc, setNewHolidayDesc] = useState("");

    const days = ["월", "화", "수", "목", "금", "토", "일"];

    useEffect(() => {
        if (store.operating_hours && store.operating_hours.length > 0) {
            const sorted = [...store.operating_hours].sort((a, b) => a.day_of_week - b.day_of_week);
            const fullHours = Array.from({ length: 7 }, (_, i) => {
                const exist = sorted.find(h => h.day_of_week === i);
                return exist || { day_of_week: i, open_time: "09:00", close_time: "22:00", is_closed: false };
            });
            setHours(fullHours);
        } else {
            setHours(Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, open_time: "09:00", close_time: "22:00", is_closed: false })));
        }
        setHolidays(store.holidays || []);
    }, [store]);

    const handleHourChange = (index, field, value) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const handleSaveHours = async () => {
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/hours`, hours, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("영업시간이 저장되었습니다.");
            fetchStore();
        } catch (err) { toast.error("저장 실패"); }
    };

    const handleAddHoliday = async () => {
        if (!newHolidayDate) return;
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/holidays`, 
                { date: newHolidayDate, description: newHolidayDesc }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewHolidayDate(""); setNewHolidayDesc(""); fetchStore();
        } catch (err) { toast.error("휴일 추가 실패"); }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/holidays/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchStore(); } 
        catch (err) { toast.error("삭제 실패"); }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-xl mb-4">⏰ 요일별 영업 시간</h3>
                <div className="space-y-3">
                    {hours.map((h, idx) => (
                        <div key={idx} className={`flex items-center gap-2 p-2 rounded ${h.is_closed ? "bg-gray-100 opacity-50" : ""}`}>
                            <span className="w-8 font-bold text-center">{days[h.day_of_week]}</span>
                            <input type="time" className="border rounded p-1" value={h.open_time} onChange={e=>handleHourChange(idx, "open_time", e.target.value)} disabled={h.is_closed}/>
                            <span>~</span>
                            <input type="time" className="border rounded p-1" value={h.close_time} onChange={e=>handleHourChange(idx, "close_time", e.target.value)} disabled={h.is_closed}/>
                            <label className="flex items-center gap-1 ml-auto text-sm cursor-pointer">
                                <input type="checkbox" checked={h.is_closed} onChange={e=>handleHourChange(idx, "is_closed", e.target.checked)}/> 휴무
                            </label>
                        </div>
                    ))}
                </div>
                <button onClick={handleSaveHours} className="mt-6 w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">시간표 저장</button>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-xl mb-4">📅 휴일 설정</h3>
                <div className="flex gap-2 mb-4">
                    <input type="date" className="border p-2 rounded" value={newHolidayDate} onChange={e=>setNewHolidayDate(e.target.value)} />
                    <input type="text" className="border p-2 rounded flex-1" placeholder="사유 (예: 설날)" value={newHolidayDesc} onChange={e=>setNewHolidayDesc(e.target.value)} />
                    <button onClick={handleAddHoliday} className="bg-gray-800 text-white px-4 rounded font-bold">추가</button>
                </div>
                <ul className="space-y-2">
                    {holidays.map(h => (
                        <li key={h.id} className="flex justify-between items-center p-3 bg-gray-50 rounded border">
                            <span>{h.date} <span className="text-gray-500 text-sm">({h.description})</span></span>
                            <button onClick={()=>handleDeleteHoliday(h.id)} className="text-red-500 text-sm hover:underline">삭제</button>
                        </li>
                    ))}
                    {holidays.length === 0 && <li className="text-gray-400 text-center py-4">등록된 휴일이 없습니다.</li>}
                </ul>
            </div>
        </div>
    );
}

function AdminTables({ store, token, fetchStore }) {
    const [newTableName, setNewTableName] = useState("");
    const [editingTableId, setEditingTableId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [zoomQrTable, setZoomQrTable] = useState(null);

    const handleCreateTable = async () => {
        if (!newTableName) return;
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/tables/`, { name: newTableName }, { headers: { Authorization: `Bearer ${token}` } });
            setNewTableName(""); fetchStore();
        } catch (err) { toast.error("테이블 생성 실패"); }
    };

    const handleDeleteTable = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까? QR코드도 무효화됩니다.")) return;
        try { await axios.delete(`${API_BASE_URL}/tables/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchStore(); } 
        catch (err) { toast.error("삭제 실패"); }
    };

    const startEdit = (table) => { setEditingTableId(table.id); setEditingName(table.name); };

    const saveEdit = async (tableId) => {
        try {
            await axios.patch(`${API_BASE_URL}/tables/${tableId}`, { name: editingName }, { headers: { Authorization: `Bearer ${token}` } });
            setEditingTableId(null); fetchStore();
        } catch (err) { toast.error("수정 실패"); }
    };

    const getQrImageUrl = (token, size = 150) => {
        const targetUrl = `${window.location.protocol}//${window.location.host}/order/${token}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
    };

    const handleDownloadQR = async (table) => {
        const imageUrl = getQrImageUrl(table.qr_token, 500); 
        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `${dateStr}_${store.name}_${table.name}.png`;

        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) { console.error(err); toast.error("다운로드 중 오류가 발생했습니다."); }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🪑 테이블 & QR 관리</h2>
                <div className="flex gap-2">
                    <input className="border p-2 rounded w-40" placeholder="테이블명 (예: 1번)" value={newTableName} onChange={e=>setNewTableName(e.target.value)} />
                    <button onClick={handleCreateTable} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700">추가</button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {store.tables?.map(table => (
                    <div key={table.id} className="border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center hover:border-indigo-300 transition bg-white shadow-sm">
                        <div className="w-24 h-24 bg-gray-100 mb-3 cursor-zoom-in overflow-hidden rounded-lg border" onClick={() => setZoomQrTable(table)}>
                            <img src={getQrImageUrl(table.qr_token)} alt="QR Code" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                        </div>
                        {editingTableId === table.id ? (
                            <div className="flex gap-1 w-full mb-2">
                                <input className="border p-1 text-xs w-full rounded text-center" value={editingName} onChange={e=>setEditingName(e.target.value)} autoFocus />
                                <button onClick={()=>saveEdit(table.id)} className="bg-blue-500 text-white px-1 rounded text-xs">V</button>
                                <button onClick={()=>setEditingTableId(null)} className="bg-gray-300 text-gray-700 px-1 rounded text-xs">X</button>
                            </div>
                        ) : (
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-1 cursor-pointer hover:text-indigo-600" onClick={()=>startEdit(table)}>
                                {table.name} <span className="text-xs text-gray-400">✏️</span>
                            </h3>
                        )}
                        <div className="flex justify-between w-full mt-auto pt-2 border-t gap-2">
                            <button onClick={()=>handleDeleteTable(table.id)} className="text-red-400 text-xs hover:text-red-600 hover:underline">삭제</button>
                            <button onClick={()=>setZoomQrTable(table)} className="text-indigo-500 text-xs hover:text-indigo-700 font-bold">QR 확대</button>
                        </div>
                    </div>
                ))}
                {store.tables?.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">등록된 테이블이 없습니다.</div>}
            </div>

            {zoomQrTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setZoomQrTable(null)}>
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-extrabold text-gray-800 mb-2">{zoomQrTable.name}</h3>
                        <p className="text-gray-500 mb-6 text-sm">QR코드를 스캔하여 주문하세요</p>
                        <div className="p-4 border-4 border-black rounded-xl mb-6 bg-white">
                            <img src={getQrImageUrl(zoomQrTable.qr_token, 300)} alt="Large QR" className="w-64 h-64" />
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => handleDownloadQR(zoomQrTable)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2">📥 QR 저장</button>
                            <button onClick={() => setZoomQrTable(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300">닫기</button>
                        </div>
                        <p className="mt-4 text-xs text-gray-400 text-center">파일명: {new Date().toISOString().slice(0,10)}_{store.name}_{zoomQrTable.name}.png</p>
                    </div>
                </div>
            )}
        </div>
    );
}

function AdminSales({ store, token }) {
    const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [stats, setStats] = useState(null);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/stats?start_date=${startDate}&end_date=${endDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) { toast.error("매출 데이터 로딩 실패"); }
    };

    useEffect(() => { fetchStats(); }, [startDate, endDate]);

    return (
        <div className="space-y-6 pb-20">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">💰 매출 통계</h2>
                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-transparent font-bold" />
                    <span>~</span>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-transparent font-bold" />
                    <button onClick={fetchStats} className="bg-black text-white px-3 py-1 rounded text-sm font-bold ml-2">조회</button>
                </div>
            </div>

            {stats ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                            <p className="text-indigo-200 font-bold mb-1">총 매출액</p>
                            <p className="text-4xl font-black">{stats.total_revenue.toLocaleString()}원</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <p className="text-gray-500 font-bold mb-1">총 주문 건수</p>
                            <p className="text-4xl font-black text-gray-800">{stats.order_count}건</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">🔥 인기 메뉴 순위</h3>
                            <ul className="space-y-3">
                                {stats.menu_stats.map((m, idx) => (
                                    <li key={idx} className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 bg-gray-100 rounded text-center text-sm font-bold text-gray-600">{idx+1}</span>
                                            <span className="font-bold text-gray-700">{m.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="block font-bold text-indigo-600">{m.revenue.toLocaleString()}원</span>
                                            <span className="text-xs text-gray-400">{m.count}개 판매</span>
                                        </div>
                                    </li>
                                ))}
                                {stats.menu_stats.length === 0 && <p className="text-center text-gray-400 py-10">데이터 없음</p>}
                            </ul>
                        </div>

                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-lg mb-4 border-b pb-2">⏰ 시간대별 매출</h3>
                            <div className="space-y-2">
                                {stats.hourly_stats.map((h, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-sm">
                                        <span className="w-12 font-bold text-gray-500">{h.hour}시</span>
                                        <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                                            <div className="h-full bg-indigo-400" style={{ width: `${(h.sales / stats.total_revenue) * 100}%` }}></div>
                                        </div>
                                        <span className="w-20 text-right font-bold">{h.sales.toLocaleString()}원</span>
                                    </div>
                                ))}
                                {stats.hourly_stats.length === 0 && <p className="text-center text-gray-400 py-10">데이터 없음</p>}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="text-center py-20 text-gray-400">데이터를 불러오는 중...</div>
            )}
        </div>
    );
}

function AdminUsers({ store, token }) {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [newUserRole, setNewUserRole] = useState("STAFF");

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (err) { toast.error("목록 로딩 실패"); }
    };

    const handleCreateUser = async () => {
        if(!newUserEmail || !newUserPassword) return toast.error("이메일, 비밀번호 필수");
        try {
            await axios.post(`${API_BASE_URL}/admin/users/`, 
                { email: newUserEmail, password: newUserPassword, name: newUserName, role: newUserRole, store_id: store.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("생성 완료"); setNewUserEmail(""); setNewUserPassword(""); setNewUserName(""); setIsModalOpen(false); fetchUsers();
        } catch(err) { toast.error(err.response?.data?.detail || "실패"); }
    };

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(); } catch(err) { toast.error("삭제 실패"); }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800">👤 계정 관리</h2><button onClick={()=>setIsModalOpen(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-black">+ 계정 추가</button></div>
            <table className="w-full text-left border-collapse">
                <thead><tr className="border-b bg-gray-50 text-gray-500 text-sm"><th className="p-3">이름</th><th className="p-3">이메일</th><th className="p-3">권한</th><th className="p-3">상태</th><th className="p-3 text-right">관리</th></tr></thead>
                <tbody>{users.map(u => (<tr key={u.id} className="border-b hover:bg-gray-50"><td className="p-3 font-bold">{u.name || "-"}</td><td className="p-3 text-gray-600">{u.email}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role==='SUPER_ADMIN'?'bg-red-100 text-red-700':u.role==='STORE_OWNER'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`}>{u.role}</span></td><td className="p-3 text-sm">{u.is_active ? "🟢 활성" : "🔴 정지"}</td><td className="p-3 text-right"><button onClick={()=>handleDeleteUser(u.id)} className="text-red-500 hover:underline text-sm">삭제</button></td></tr>))}</tbody>
            </table>
            {isModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-xl w-96 shadow-2xl"><h3 className="text-xl font-bold mb-4">새 계정</h3><div className="space-y-3"><input className="border w-full p-2 rounded" placeholder="이름" value={newUserName} onChange={e=>setNewUserName(e.target.value)} /><input className="border w-full p-2 rounded" placeholder="이메일" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} /><input className="border w-full p-2 rounded" type="password" placeholder="비밀번호" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} /><select className="border w-full p-2 rounded" value={newUserRole} onChange={e=>setNewUserRole(e.target.value)}><option value="STAFF">직원 (STAFF)</option><option value="STORE_OWNER">점주 (STORE_OWNER)</option></select></div><div className="flex gap-2 mt-6"><button onClick={handleCreateUser} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold">생성</button><button onClick={()=>setIsModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded font-bold">취소</button></div></div></div>)}
        </div>
    );
}

// ==========================================
// 6. [메인] Admin Page Router (권한 분기)
// ==========================================
function AdminPage() {
    const { storeId } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [user, setUser] = useState(null);
    const [store, setStore] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("info");
    
    // ✨ 수신된 안읽은 공지사항 목록 배열
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

    // ✨ [신규 추가] 로그인(화면 진입) 시 안읽은 공지 가져오기
    useEffect(() => {
        if (user && ["STORE_OWNER", "STAFF"].includes(user.role)) {
            axios.get(`${API_BASE_URL}/notices/unread`, { headers: { Authorization: `Bearer ${token}` } })
                .then(res => setUnreadNotices(res.data))
                .catch(()=>{});
        }
    }, [user, token]);

    // ✨ [신규 추가] 공지사항 "확인(읽음)" 처리 함수
    const handleReadNotice = async (noticeId) => {
        try {
            // 1. 서버에 "나 이거 읽었음!" 보고
            await axios.post(`${API_BASE_URL}/notices/${noticeId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            // 2. 화면에 떠있는 배열에서 맨 앞의 1개 삭제 (그 다음 공지가 있으면 자동으로 올라옴)
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
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, 
                { is_open: newStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStore({ ...store, is_open: newStatus }); 
        } catch (err) {
            toast.error("상태 변경 실패");
        }
    };

    const handleLogout = () => {
        if(window.confirm("로그아웃 하시겠습니까?")) {
            localStorage.removeItem("token");
            navigate("/");
        }
    };

    if (loading || !user) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">🔒 권한 확인 중...</div>;
    if (user.role === "STAFF") return <StaffView user={user} storeId={user.store_id} />;
    
    // 본사/슈퍼 관리자이고 매장 선택 전이면 HeadquartersView
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
                        <button 
                            onClick={toggleStoreStatus}
                            className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${store.is_open ? "bg-green-500" : "bg-gray-300"}`}
                        >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${store.is_open ? "translate-x-6" : "translate-x-0"}`}></div>
                        </button>
                    </div>

                    {["GROUP_ADMIN", "SUPER_ADMIN", "BRAND_ADMIN"].includes(user.role) && (<button onClick={() => navigate("/admin")} className="text-xs text-indigo-600 font-bold mt-4 hover:underline block w-full text-left">← 본사 대시보드</button>)}
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {/* ✨ [신규 추가] 점주용 본사 공지사항 게시판 버튼 */}
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
            
            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 ml-64 p-4 lg:p-6 overflow-y-auto relative">
                {/* ✨ [신규 추가] 점주용 공지사항 게시판 렌더링 */}
                {activeTab === "store_notices" && <StoreNoticeBoard token={token} />}
                {activeTab === "info" && <AdminStoreInfo store={store} token={token} fetchStore={fetchStore} user={user} />}
                {activeTab === "menu" && <AdminMenuManagement store={store} token={token} fetchStore={fetchStore} user={user} />}
                {activeTab === "callOptions" && <AdminCallOptionManagement store={store} token={token} />}
                {activeTab === "hours" && <AdminHours store={store} token={token} fetchStore={fetchStore} />}
                {activeTab === "tables" && <AdminTables store={store} token={token} fetchStore={fetchStore} />}
                {activeTab === "sales" && <AdminSales store={store} token={token} />}
                {activeTab === "users" && <AdminUsers store={store} token={token} />}
                {activeTab === "notice" && <HQNoticeSend token={token} currentUser={user} />}
            </div>

            {/* ✨ [신규 추가] 스마트 공지사항 팝업 모달 */}
            {unreadNotices.length > 0 && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden transform animate-slideUp relative">
                        {/* 남은 공지 개수 표시 뱃지 */}
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