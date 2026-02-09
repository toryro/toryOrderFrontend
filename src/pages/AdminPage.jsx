import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

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
                <nav className="flex-1 p-4 space-y-2">
                    <div className="text-xs font-bold text-slate-500 mb-2 px-2 mt-2">현황 파악</div>
                    <HQMenuButton icon="🏪" label="가맹점 목록" active={activeTab==="stores"} onClick={()=>setActiveTab("stores")} />
                    
                    {/* 공통 기능 (슈퍼 + 브랜드) */}
                    <div className="text-xs font-bold text-slate-500 mb-2 px-2 mt-6">운영 관리</div>
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
                    {activeTab === "brand" && <AdminBrandManagement token={token} />}
                    {activeTab === "distribution" && <AdminMenuDistribution stores={stores} token={token} />}
                    {activeTab === "create_store" && <HQStoreCreate token={token} onSuccess={()=>setActiveTab("stores")} />}
                    {activeTab === "users" && <HQUserManage token={token} currentUser={user} />}
                </div>
            </div>
        </div>
    );
}

function HQMenuButton({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full text-left px-4 py-3 rounded-lg font-bold transition flex items-center gap-3 ${active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/50" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
            <span className="text-lg">{icon}</span> {label}
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
        if (!newBrandName) return alert("브랜드명 필수");
        try { await axios.post(`${API_BASE_URL}/brands/`, { name: newBrandName, logo_url: newBrandLogo }, { headers: { Authorization: `Bearer ${token}` } }); alert("생성 완료"); setNewBrandName(""); fetchBrands(); } 
        catch (err) { alert("생성 실패"); }
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
function HQStoreCreate({ token, onSuccess }) {
    const [name, setName] = useState("");
    const [address, setAddress] = useState("");
    const [brandId, setBrandId] = useState("");
    const [brands, setBrands] = useState([]);

    useEffect(() => { axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setBrands(res.data)).catch(()=>{}); }, []);

    const handleCreate = async () => {
        if (!name) return alert("매장명 필수");
        try { await axios.post(`${API_BASE_URL}/stores/`, { name, address, brand_id: brandId ? parseInt(brandId) : null }, { headers: { Authorization: `Bearer ${token}` } }); alert("성공!"); onSuccess(); } 
        catch (err) { alert("실패: " + (err.response?.data?.detail || "오류")); }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold text-gray-800">🏪 가맹점 생성</h2>
            <div className="bg-white p-8 rounded-2xl shadow-sm border space-y-4">
                <select className="w-full border p-3 rounded-lg" value={brandId} onChange={e=>setBrandId(e.target.value)}>
                    <option value="">독립 매장</option>
                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
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
    }, [selectedStoreId]);

    const toggleTargetStore = (id) => {
        const newSet = new Set(targetStoreIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setTargetStoreIds(newSet);
    };

    const handleSelectAll = () => {
        if (targetStoreIds.size === stores.length) setTargetStoreIds(new Set());
        else setTargetStoreIds(new Set(stores.map(s => s.id)));
    };

    const handleDistribute = async () => {
        if (!selectedCategoryId || targetStoreIds.size === 0) return alert("대상과 메뉴를 선택해주세요.");
        if (!window.confirm(`정말 ${targetStoreIds.size}개 매장에 메뉴를 배포하시겠습니까?`)) return;
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/brands/distribute-menu`, 
                { source_category_id: parseInt(selectedCategoryId), target_store_ids: Array.from(targetStoreIds) }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("배포 완료!"); setStep(1); setSelectedStoreId(""); setTargetStoreIds(new Set());
        } catch (err) { alert("배포 실패: " + (err.response?.data?.detail || "오류")); } finally { setLoading(false); }
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
                            <h3 className="text-xl font-bold">배포할 매장 선택 ({targetStoreIds.size}개)</h3>
                            <button onClick={handleSelectAll} className="text-sm font-bold text-indigo-600 border px-3 py-1 rounded hover:bg-indigo-50">전체 선택/해제</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2">
                            {stores.map(store => (
                                <div key={store.id} onClick={()=>toggleTargetStore(store.id)} className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${targetStoreIds.has(store.id) ? "border-indigo-500 bg-indigo-50" : "border-gray-200"}`}>
                                    <span className="font-bold text-gray-800">{store.name}</span>
                                    {targetStoreIds.has(store.id) && <span className="text-indigo-600 font-bold">✓</span>}
                                </div>
                            ))}
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
        if (currentUser && currentUser.role === "SUPER_ADMIN") axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setBrands(res.data)).catch(()=>{});
        axios.get(`${API_BASE_URL}/groups/my/stores`, { headers: { Authorization: `Bearer ${token}` } }).then(res=>setStores(res.data)).catch(()=>{});
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (err) { alert("사용자 목록 조회 실패"); }
    };

    const handleCreate = async () => {
        if (!email || !password) return alert("필수 정보 누락");
        let finalBrandId = null;
        if (currentUser.role === "BRAND_ADMIN") finalBrandId = currentUser.brand_id;
        else if (role === "BRAND_ADMIN") finalBrandId = parseInt(targetBrandId);

        try {
            await axios.post(`${API_BASE_URL}/admin/users/`, 
                { email, password, name, role, brand_id: finalBrandId, store_id: (role==="STORE_OWNER"||role==="STAFF")?parseInt(targetStoreId):null }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("생성 완료"); fetchUsers(); setEmail(""); setPassword("");
        } catch (err) { alert("실패"); }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("삭제?")) return;
        try { await axios.delete(`${API_BASE_URL}/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(); } catch { alert("삭제 실패"); }
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
                                <td className="p-3 text-sm text-gray-500">
                                    {u.brand_id ? `브랜드(${u.brand_id})` : u.store_id ? `매장(${u.store_id})` : "-"}
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

// ==========================================
// 3. [점주용] 관리 컴포넌트들 (기존 기능 복구)
// ==========================================

function AdminStoreInfo({ store, token, fetchStore }) {
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
    const [brands, setBrands] = useState([]);

    useEffect(() => {
        axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setBrands(res.data)).catch(()=>{});
    }, []);

    const handleSave = async () => {
        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, 
                { name, address, phone, description: desc, notice, origin_info: originInfo, owner_name: ownerName, business_name: businessName, business_address: businessAddress, business_number: businessNumber, brand_id: brandId ? parseInt(brandId) : null },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("저장되었습니다."); fetchStore();
        } catch(err) { alert("저장 실패"); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">🏠 기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2">
                        <label className="block text-sm font-bold text-gray-600 mb-1">소속 브랜드</label>
                        <select className="w-full border p-3 rounded-lg bg-indigo-50" value={brandId} onChange={e=>setBrandId(e.target.value)}>
                            <option value="">독립 매장</option>
                            {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                    </div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 이름</label><input className="w-full border p-3 rounded-lg" value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">전화번호</label><input className="w-full border p-3 rounded-lg" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 주소</label><input className="w-full border p-3 rounded-lg" value={address} onChange={e=>setAddress(e.target.value)} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 소개</label><textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
                </div>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">📢 알림 & 정보</h2>
                <div className="space-y-4">
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">공지사항</label><textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={notice} onChange={e=>setNotice(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">원산지 표시</label><textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={originInfo} onChange={e=>setOriginInfo(e.target.value)} /></div>
                </div>
            </div>
            
            <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md">저장하기</button>
        </div>
    );
}

function AdminInventory({ store, token }) {
    const [inventories, setInventories] = useState([]);
    const [newItemName, setNewItemName] = useState("");
    const [newItemUnit, setNewItemUnit] = useState("개");
    const [newItemQty, setNewItemQty] = useState("");
    const [newItemSafe, setNewItemSafe] = useState(10);

    const [selectedMenu, setSelectedMenu] = useState(null);
    const [recipeIngredientId, setRecipeIngredientId] = useState("");
    const [recipeAmount, setRecipeAmount] = useState("");

    useEffect(() => { fetchInventory(); }, [store.id]);

    const fetchInventory = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/inventories`, { headers: { Authorization: `Bearer ${token}` } });
            setInventories(res.data);
        } catch (err) { console.error("재고 로딩 실패"); }
    };

    const handleAddInventory = async () => {
        if (!newItemName || !newItemQty) return alert("필수 입력 누락");
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/inventories`, 
                { name: newItemName, quantity: parseInt(newItemQty), unit: newItemUnit, safe_quantity: parseInt(newItemSafe) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("입고 완료!"); setNewItemName(""); setNewItemQty(""); fetchInventory();
        } catch (err) { alert("등록 실패"); }
    };

    const handleUpdateQuantity = async (id, newQty) => {
        try {
            await axios.patch(`${API_BASE_URL}/inventories/${id}`, { quantity: parseInt(newQty) }, { headers: { Authorization: `Bearer ${token}` } });
            fetchInventory();
        } catch (err) { alert("수정 실패"); }
    };

    const handleAddRecipe = async () => {
        if (!selectedMenu || !recipeIngredientId || !recipeAmount) return alert("모든 항목을 선택해주세요.");
        try {
            await axios.post(`${API_BASE_URL}/menus/${selectedMenu.id}/recipes`, 
                { inventory_id: parseInt(recipeIngredientId), amount_needed: parseInt(recipeAmount) },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("레시피 연결 성공!");
            setRecipeIngredientId(""); setRecipeAmount("");
        } catch (err) { alert("연결 실패"); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20 animate-fadeIn">
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-xl mb-4 text-gray-800">📦 재고 등록 (입고)</h3>
                    <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                            <input className="border p-2 rounded flex-[2]" placeholder="재료명 (예: 삼겹살)" value={newItemName} onChange={e=>setNewItemName(e.target.value)} />
                            <select className="border p-2 rounded flex-1" value={newItemUnit} onChange={e=>setNewItemUnit(e.target.value)}>
                                <option value="개">개</option>
                                <option value="kg">kg</option>
                                <option value="g">g</option>
                                <option value="L">L</option>
                                <option value="ml">ml</option>
                            </select>
                        </div>
                        <div className="flex gap-2">
                            <input className="border p-2 rounded flex-1" type="number" placeholder="수량" value={newItemQty} onChange={e=>setNewItemQty(e.target.value)} />
                            <input className="border p-2 rounded flex-1" type="number" placeholder="안전재고" value={newItemSafe} onChange={e=>setNewItemSafe(e.target.value)} />
                            <button onClick={handleAddInventory} className="bg-indigo-600 text-white px-4 rounded font-bold hover:bg-indigo-700">입고</button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                    <h3 className="font-bold text-xl mb-4 text-gray-800">📋 현재 재고 현황</h3>
                    <ul className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {inventories.map(item => (
                            <li key={item.id} className={`flex justify-between items-center p-3 rounded-lg border ${item.quantity <= item.safe_quantity ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
                                <div>
                                    <span className="font-bold text-gray-800 text-lg">{item.name}</span>
                                    {item.quantity <= item.safe_quantity && <span className="ml-2 text-xs font-bold text-red-600 animate-pulse">⚠️ 부족</span>}
                                </div>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        className="w-20 border rounded p-1 text-right font-bold" 
                                        defaultValue={item.quantity} 
                                        onBlur={(e) => handleUpdateQuantity(item.id, e.target.value)}
                                    />
                                    <span className="text-gray-500 w-8">{item.unit}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 h-fit">
                <h3 className="font-bold text-xl mb-6 text-gray-800">🍳 메뉴별 레시피 설정</h3>
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">1. 대상 메뉴 선택</label>
                    <select 
                        className="w-full border p-3 rounded-xl bg-gray-50"
                        onChange={(e) => {
                            const menuId = parseInt(e.target.value);
                            const found = store.categories.flatMap(c => c.menus).find(m => m.id === menuId);
                            setSelectedMenu(found);
                        }}
                    >
                        <option value="">메뉴를 선택해주세요...</option>
                        {store.categories.map(cat => (
                            <optgroup key={cat.id} label={cat.name}>
                                {cat.menus.map(menu => <option key={menu.id} value={menu.id}>{menu.name}</option>)}
                            </optgroup>
                        ))}
                    </select>
                </div>

                {selectedMenu && (
                    <div className="animate-slideUp">
                        <div className="p-4 bg-indigo-50 rounded-xl mb-6 border border-indigo-100">
                            <h4 className="font-bold text-indigo-900 mb-2">'{selectedMenu.name}' 레시피 추가</h4>
                            <div className="flex gap-2 mb-2">
                                <select className="flex-[2] border p-2 rounded" value={recipeIngredientId} onChange={e=>setRecipeIngredientId(e.target.value)}>
                                    <option value="">재료 선택...</option>
                                    {inventories.map(inv => <option key={inv.id} value={inv.id}>{inv.name} (현재 {inv.quantity}{inv.unit})</option>)}
                                </select>
                                <input className="flex-1 border p-2 rounded" type="number" placeholder="차감량" value={recipeAmount} onChange={e=>setRecipeAmount(e.target.value)} />
                            </div>
                            <button onClick={handleAddRecipe} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">연결 저장</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function AdminMenuManagement({ store, token, fetchStore }) {
    const [storeOptionGroups, setStoreOptionGroups] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [menuName, setMenuName] = useState("");
    const [menuPrice, setMenuPrice] = useState("");
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

    useEffect(() => { refreshOptionGroups(); }, [store.id]);

    const refreshOptionGroups = () => {
        axios.get(`${API_BASE_URL}/stores/${store.id}/option-groups/`)
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
        if (!selectedCategoryId || !menuName || !menuPrice) return alert("카테고리, 이름, 가격은 필수입니다.");
        const category = store.categories.find(c => c.id == selectedCategoryId);
        const nextOrder = category && category.menus.length > 0 ? Math.max(...category.menus.map(m => m.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/categories/${selectedCategoryId}/menus/`, 
            { name: menuName, price: parseInt(menuPrice), description: menuDesc, image_url: menuImage, order_index: nextOrder }, 
            {headers:{Authorization:`Bearer ${token}`}}
        );
        setMenuName(""); setMenuPrice(""); setMenuDesc(""); setMenuImage(null); refreshAll();
    };

    const handleCreateOptionGroup = async () => {
        if (!newGroupName) return;
        const nextOrder = storeOptionGroups.length > 0 ? Math.max(...storeOptionGroups.map(g => g.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/stores/${store.id}/option-groups/`, 
            { name: newGroupName, is_single_select: isSingleSelect, is_required: isRequired, max_select: parseInt(maxSelect), order_index: nextOrder }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setNewGroupName(""); setIsSingleSelect(false); setIsRequired(false); setMaxSelect(0); refreshAll();
    };

    const handleCreateOption = async (groupId) => {
        if (!newOptionName) return;
        const group = storeOptionGroups.find(g => g.id === groupId);
        const nextOrder = group && group.options.length > 0 ? Math.max(...group.options.map(o => o.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/option-groups/${groupId}/options/`, 
            { name: newOptionName, price: parseInt(newOptionPrice)||0, order_index: nextOrder }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setNewOptionName(""); setNewOptionPrice(""); setActiveOptionGroupId(null); refreshAll();
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
            image_url: editingMenu.image_url
        });
        alert("수정되었습니다."); setIsEditModalOpen(false); refreshAll();
    };

    const handleDeleteMenu = async () => {
        if(!window.confirm("정말 삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/menus/${editingMenu.id}`);
        setIsEditModalOpen(false); refreshAll();
    };

    const startEditGroup = (group) => {
        setEditingGroupId(group.id);
        setEditingGroupName(group.name);
        setEditingGroupSingle(group.is_single_select);
        setEditingGroupRequired(group.is_required);
        setEditingGroupMax(group.max_select || 0);
    };
    const saveGroup = async (groupId) => {
        await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { 
            name: editingGroupName, 
            is_single_select: editingGroupSingle, 
            is_required: editingGroupRequired,
            max_select: parseInt(editingGroupMax)
        });
        setEditingGroupId(null); refreshAll();
    };
    const handleUpdateGroupOrder = async (groupId, newOrder) => {
        await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { order_index: parseInt(newOrder) });
        refreshAll();
    };

    const startEditOption = (opt) => {
        setEditingOptionId(opt.id);
        setEditingOptionName(opt.name);
        setEditingOptionPrice(opt.price);
    };
    const saveOption = async (optId) => {
        await axios.patch(`${API_BASE_URL}/options/${optId}`, { name: editingOptionName, price: parseInt(editingOptionPrice) });
        setEditingOptionId(null); refreshAll();
    };
    const handleUpdateOptionOrder = async (optId, newOrder) => {
        await axios.patch(`${API_BASE_URL}/options/${optId}`, { order_index: parseInt(newOrder) });
        refreshAll();
    };
    const handleUpdateOptionDefault = async (optId) => {
        await axios.patch(`${API_BASE_URL}/options/${optId}`, { is_default: true });
        refreshAll();
    };
    const handleDeleteOption = async (optId) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/options/${optId}`);
        refreshAll();
    };

    const toggleOptionGroupLink = async (groupId, isLinked) => {
        try {
            if (isLinked) {
                await axios.delete(`${API_BASE_URL}/menus/${editingMenu.id}/option-groups/${groupId}`);
            } else {
                await axios.post(`${API_BASE_URL}/menus/${editingMenu.id}/link-option-group/${groupId}`);
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
        } catch (err) { alert("연결 실패"); }
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
            await axios.patch(`${API_BASE_URL}/menus/${editingMenu.id}/option-groups/${item1.id}/reorder`, { order_index: index + 1 });
            await axios.patch(`${API_BASE_URL}/menus/${editingMenu.id}/option-groups/${item2.id}/reorder`, { order_index: targetIndex + 1 });
            refreshAll();
        } catch (err) { console.error("순서 변경 실패", err); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full pb-20">
            {/* 왼쪽: 메뉴 관리 */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2">
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
                    <div className="flex items-center gap-2 mb-3">
                        <input type="file" onChange={e=>handleImageUpload(e, setMenuImage)} className="text-sm py-2 text-gray-500"/>
                        {menuImage && <span className="text-xs text-green-600 font-bold">이미지 업로드됨</span>}
                    </div>
                    <button onClick={handleCreateMenu} className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md">메뉴 등록하기</button>
                </div>

                {store.categories?.map(cat => (
                    <div key={cat.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                        <h3 className="font-bold text-xl text-gray-800 mb-4 border-b pb-2">{cat.name}</h3>
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
            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300 flex flex-col h-full overflow-hidden">
                <h2 className="text-lg font-bold mb-3 shrink-0">📚 옵션 관리 라이브러리</h2>
                
                <div className="mb-4 bg-gray-50 p-3 rounded-lg shrink-0 border">
                    <input className="border p-2 rounded w-full text-sm mb-2" placeholder="새 그룹명 (예: 맵기 조절)" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} />
                    <div className="flex flex-col gap-2 mb-2">
                        <div className="flex gap-4">
                            <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={isSingleSelect} onChange={e=>setIsSingleSelect(e.target.checked)}/> 1개만 선택</label>
                            <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={isRequired} onChange={e=>setIsRequired(e.target.checked)}/> 필수 선택</label>
                        </div>
                        {!isSingleSelect && (
                            <div className="flex items-center gap-2 text-xs">
                                <span>최대 선택:</span>
                                <input type="number" className="border rounded w-12 p-0.5 text-center" value={maxSelect} onChange={e=>setMaxSelect(e.target.value)} min="0" placeholder="0"/>
                                <span className="text-gray-400">(0=무제한)</span>
                            </div>
                        )}
                    </div>
                    <button onClick={handleCreateOptionGroup} className="w-full bg-gray-800 text-white py-2 rounded text-sm font-bold hover:bg-black">옵션 그룹 생성</button>
                </div>
                
                <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-4">
                    {storeOptionGroups.map(group => (
                        <div key={group.id} className="p-3 rounded-lg border bg-white shadow-sm">
                            <div className="flex justify-between items-center mb-2 border-b pb-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <input type="number" className="w-7 border rounded text-center text-xs p-0.5 bg-gray-100 shrink-0" defaultValue={group.order_index} onBlur={(e)=>handleUpdateGroupOrder(group.id, e.target.value)}/>
                                    {editingGroupId === group.id ? (
                                        <div className="flex flex-col gap-2 flex-1 min-w-0">
                                            <input className="border p-0.5 w-full text-sm min-w-0" value={editingGroupName} onChange={e=>setEditingGroupName(e.target.value)} />
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={editingGroupSingle} onChange={e=>setEditingGroupSingle(e.target.checked)}/>1택</label>
                                                <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={editingGroupRequired} onChange={e=>setEditingGroupRequired(e.target.checked)}/>필수</label>
                                                {!editingGroupSingle && <input type="number" className="w-10 border rounded text-xs p-0.5" value={editingGroupMax} onChange={e=>setEditingGroupMax(e.target.value)} placeholder="Max"/>}
                                                <button onClick={()=>saveGroup(group.id)} className="text-xs bg-blue-500 text-white px-1 rounded shrink-0 ml-auto">V</button>
                                                <button onClick={()=>setEditingGroupId(null)} className="text-xs bg-gray-300 px-1 rounded shrink-0">X</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 rounded px-1 flex-1 min-w-0 flex-wrap" onClick={()=>startEditGroup(group)}>
                                            <span className="font-bold text-gray-800 text-sm truncate mr-1">{group.name}</span>
                                            {group.is_single_select && <span className="text-[9px] bg-yellow-100 text-yellow-800 px-1 rounded shrink-0">1택</span>}
                                            {group.is_required && <span className="text-[9px] bg-red-100 text-red-800 px-1 rounded shrink-0">필수</span>}
                                            {!group.is_single_select && group.max_select > 0 && <span className="text-[9px] bg-purple-100 text-purple-800 px-1 rounded shrink-0">Max {group.max_select}</span>}
                                            <span className="text-[10px] text-gray-400 ml-auto">✏️</span>
                                        </div>
                                    )}
                                </div>
                                <button onClick={() => setActiveOptionGroupId(activeOptionGroupId === group.id ? null : group.id)} className="text-xs border px-2 py-1 rounded hover:bg-gray-100 ml-1 shrink-0">
                                    {activeOptionGroupId === group.id ? "닫기" : "관리"}
                                </button>
                            </div>
                            
                            <ul className="text-sm space-y-1 mb-2">
                                {group.options.map(opt => (
                                    <li key={opt.id} className="flex items-center justify-between p-1 hover:bg-gray-50 rounded group">
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <input type="number" className="w-6 border rounded text-center text-[10px] p-0.5 bg-gray-50 text-gray-400 shrink-0" defaultValue={opt.order_index} onBlur={(e)=>handleUpdateOptionOrder(opt.id, e.target.value)} />
                                            {editingOptionId === opt.id ? (
                                                <div className="flex gap-1 flex-1 min-w-0">
                                                    <input className="border p-0.5 w-full text-xs min-w-0" value={editingOptionName} onChange={e=>setEditingOptionName(e.target.value)} />
                                                    <input className="border p-0.5 w-10 text-xs shrink-0" type="number" value={editingOptionPrice} onChange={e=>setEditingOptionPrice(e.target.value)} />
                                                    <button onClick={()=>saveOption(opt.id)} className="text-xs bg-blue-500 text-white px-1 rounded shrink-0">V</button>
                                                    <button onClick={()=>setEditingOptionId(null)} className="text-xs bg-gray-300 px-1 rounded shrink-0">X</button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-between w-full items-center min-w-0 gap-2">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        {(group.is_single_select || group.is_required) && (
                                                            opt.is_default 
                                                            ? <span className="text-[9px] bg-green-100 text-green-700 px-1 rounded border border-green-200 shrink-0">기본</span> 
                                                            : <button onClick={()=>handleUpdateOptionDefault(opt.id)} className="text-[9px] text-gray-300 hover:text-blue-500 shrink-0">기본설정</button>
                                                        )}
                                                        <span className="text-gray-700 truncate">{opt.name}</span>
                                                    </div>
                                                    <span className="text-gray-500 text-xs shrink-0">+{opt.price}</span>
                                                </div>
                                            )}
                                        </div>
                                        {!editingOptionId && (
                                            <div className="hidden group-hover:flex gap-1 ml-1 shrink-0">
                                                <button onClick={()=>startEditOption(opt)} className="text-xs text-blue-400 hover:text-blue-600">✏️</button>
                                                <button onClick={()=>handleDeleteOption(opt.id)} className="text-xs text-red-300 hover:text-red-500">🗑️</button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                                {group.options.length === 0 && <li className="text-xs text-gray-400 pl-2">옵션 없음</li>}
                            </ul>

                            {activeOptionGroupId === group.id && (
                                <div className="flex flex-col gap-2 mt-2 p-2 bg-gray-50 rounded animate-fadeIn border border-indigo-100">
                                    <input className="border p-2 rounded text-xs w-full" placeholder="옵션명 (예: 덜맵게)" value={newOptionName} onChange={e=>setNewOptionName(e.target.value)} autoFocus />
                                    <div className="flex gap-1">
                                        <input className="border p-2 rounded text-xs flex-1 min-w-0" type="number" placeholder="가격 (원)" value={newOptionPrice} onChange={e=>setNewOptionPrice(e.target.value)} />
                                        <button onClick={()=>handleCreateOption(group.id)} className="bg-indigo-600 text-white text-xs px-3 rounded font-bold shrink-0 hover:bg-indigo-700">추가</button>
                                    </div>
                                </div>
                            )}
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
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">메뉴 이름</label><input className="border w-full p-2 rounded" value={editingMenu.name} onChange={e=>setEditingMenu({...editingMenu, name: e.target.value})} /></div>
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">가격</label><input className="border w-full p-2 rounded" type="number" value={editingMenu.price} onChange={e=>setEditingMenu({...editingMenu, price: e.target.value})} /></div>
                                    </div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">설명</label><textarea className="border w-full p-2 rounded resize-none" rows="3" value={editingMenu.description || ""} onChange={e=>setEditingMenu({...editingMenu, description: e.target.value})} /></div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">이미지 URL</label><input className="border w-full p-2 rounded text-sm text-gray-500" value={editingMenu.image_url || ""} disabled placeholder="이미지 변경은 삭제 후 재등록이 필요합니다." /></div>
                                    <div className="flex gap-6 pt-2">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50 flex-1"><input type="checkbox" checked={editingMenu.is_sold_out} onChange={e=>setEditingMenu({...editingMenu, is_sold_out: e.target.checked})} className="w-5 h-5 text-red-600"/> <span className="font-bold text-red-600">품절 처리</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50 flex-1"><input type="checkbox" checked={editingMenu.is_hidden} onChange={e=>setEditingMenu({...editingMenu, is_hidden: e.target.checked})} className="w-5 h-5 text-gray-600"/> <span className="font-bold text-gray-600">메뉴 숨김</span></label>
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
                                                        <div className="min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`font-bold truncate ${isLinked ? "text-indigo-800" : "text-gray-700"}`}>{group.name}</span>
                                                                {group.is_required && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold shrink-0">필수</span>}
                                                                {group.is_single_select && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded font-bold shrink-0">1택</span>}
                                                                {!group.is_single_select && group.max_select > 0 && <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold shrink-0">Max {group.max_select}</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-400 mt-1">{group.options.length}개 항목</p>
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
        } catch (err) { alert("추가 실패"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/call-options/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchOptions(); }
        catch (err) { alert("삭제 실패"); }
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
            alert("영업시간이 저장되었습니다.");
            fetchStore();
        } catch (err) { alert("저장 실패"); }
    };

    const handleAddHoliday = async () => {
        if (!newHolidayDate) return;
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/holidays`, 
                { date: newHolidayDate, description: newHolidayDesc }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setNewHolidayDate(""); setNewHolidayDesc(""); fetchStore();
        } catch (err) { alert("휴일 추가 실패"); }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/holidays/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchStore(); } 
        catch (err) { alert("삭제 실패"); }
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
        } catch (err) { alert("테이블 생성 실패"); }
    };

    const handleDeleteTable = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까? QR코드도 무효화됩니다.")) return;
        try { await axios.delete(`${API_BASE_URL}/tables/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchStore(); } 
        catch (err) { alert("삭제 실패"); }
    };

    const startEdit = (table) => { setEditingTableId(table.id); setEditingName(table.name); };

    const saveEdit = async (tableId) => {
        try {
            await axios.patch(`${API_BASE_URL}/tables/${tableId}`, { name: editingName }, { headers: { Authorization: `Bearer ${token}` } });
            setEditingTableId(null); fetchStore();
        } catch (err) { alert("수정 실패"); }
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
        } catch (err) { console.error(err); alert("다운로드 중 오류가 발생했습니다."); }
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
        } catch (err) { alert("매출 데이터 로딩 실패"); }
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
        } catch (err) { alert("목록 로딩 실패"); }
    };

    const handleCreateUser = async () => {
        if(!newUserEmail || !newUserPassword) return alert("이메일, 비밀번호 필수");
        try {
            await axios.post(`${API_BASE_URL}/admin/users/`, 
                { email: newUserEmail, password: newUserPassword, name: newUserName, role: newUserRole, store_id: store.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("생성 완료"); setNewUserEmail(""); setNewUserPassword(""); setNewUserName(""); setIsModalOpen(false); fetchUsers();
        } catch(err) { alert(err.response?.data?.detail || "실패"); }
    };

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(); } catch(err) { alert("삭제 실패"); }
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

    useEffect(() => {
        if (!token) { navigate("/"); return; }
        axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setUser(res.data);
                if (res.data.role === "STORE_OWNER" && !storeId && res.data.store_id) navigate(`/admin/${res.data.store_id}`);
            })
            .catch(() => { navigate("/"); });
    }, [token, storeId]);

    const fetchStore = async () => {
        if (storeId && ["SUPER_ADMIN", "GROUP_ADMIN", "STORE_OWNER", "BRAND_ADMIN"].includes(user?.role)) {
            try {
                const res = await axios.get(`${API_BASE_URL}/stores/${storeId}`, { headers: { Authorization: `Bearer ${token}` } });
                setStore(res.data);
            } catch { alert("가게 정보 로딩 실패"); }
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
            alert("상태 변경 실패");
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
                <nav className="flex-1 p-4 space-y-2">
                    <MenuButton icon="🏠" label="영업장 정보" active={activeTab==="info"} onClick={()=>setActiveTab("info")} />
                    <MenuButton icon="🍽️" label="메뉴 관리" active={activeTab==="menu"} onClick={()=>setActiveTab("menu")} />
                    {/* 🔥 [신규 추가] 재고/레시피 관리 탭 */}
                    <MenuButton icon="📦" label="재고/레시피" active={activeTab==="inventory"} onClick={()=>setActiveTab("inventory")} />
                    <MenuButton icon="🔔" label="호출 옵션" active={activeTab==="callOptions"} onClick={()=>setActiveTab("callOptions")} />
                    <MenuButton icon="⏰" label="영업 시간" active={activeTab==="hours"} onClick={()=>setActiveTab("hours")} />
                    <MenuButton icon="🪑" label="테이블 관리" active={activeTab==="tables"} onClick={()=>setActiveTab("tables")} />
                    <MenuButton icon="💰" label="매출 관리" active={activeTab==="sales"} onClick={()=>setActiveTab("sales")} />
                    <MenuButton icon="👤" label="계정 관리" active={activeTab==="users"} onClick={()=>setActiveTab("users")} />
                </nav>
                <div className="p-4 border-t">
                    <button onClick={handleLogout} className="w-full text-left text-sm text-red-500 hover:bg-red-50 px-4 py-3 rounded-lg font-bold transition flex items-center gap-2">
                        🚪 로그아웃
                    </button>
                </div>
            </div>
            {/* 메인 컨텐츠 영역 */}
            <div className="flex-1 ml-64 p-8 overflow-y-auto">
                {activeTab === "info" && <AdminStoreInfo store={store} token={token} fetchStore={fetchStore} />}
                {activeTab === "menu" && <AdminMenuManagement store={store} token={token} fetchStore={fetchStore} />}
                
                {/* 🔥 [신규 추가] 재고/레시피 컴포넌트 렌더링 */}
                {activeTab === "inventory" && <AdminInventory store={store} token={token} />}
                
                {activeTab === "callOptions" && <AdminCallOptionManagement store={store} token={token} />}
                {activeTab === "hours" && <AdminHours store={store} token={token} fetchStore={fetchStore} />}
                {activeTab === "tables" && <AdminTables store={store} token={token} fetchStore={fetchStore} />}
                {activeTab === "sales" && <AdminSales store={store} token={token} />}
                {activeTab === "users" && <AdminUsers store={store} token={token} />}
            </div>
        </div>
    );
}

function MenuButton({ icon, label, active, onClick }) {
    return (
        <button onClick={onClick} className={`w-full text-left px-4 py-3 rounded-lg font-bold transition flex items-center gap-2 ${active ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}><span>{icon}</span> {label}</button>
    );
}

export default AdminPage;