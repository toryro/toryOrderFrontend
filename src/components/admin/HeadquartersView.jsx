import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

// ✨ [신규 추가] StoreSettings에서 AdminSales 부품 가져오기!
import { AdminSales } from "./StoreSettings";
import HQAuditLog from "./HQAuditLog";

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
// 2. [본사/슈퍼 관리자용] Headquarters View
// ==========================================
export default function HeadquartersView({ user, token }) {
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
                    <div className="text-xs font-bold text-slate-500 mb-2 px-2 mt-6">운영 관리</div>
                    <HQMenuButton icon="📢" label="공지사항 발송" active={activeTab==="notice"} onClick={()=>setActiveTab("notice")} />
                    <HQMenuButton icon="📋" label="공지 발송 내역" active={activeTab==="notice_history"} onClick={()=>setActiveTab("notice_history")} />
                    <HQMenuButton icon="🕵️" label="시스템 감사 로그" active={activeTab==="audit"} onClick={()=>setActiveTab("audit")} />
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
                    {activeTab === "notice" && <HQNoticeSend token={token} currentUser={user} />}
                    {activeTab === "notice_history" && <HQNoticeHistory token={token} currentUser={user} />}
                    {activeTab === "audit" && <HQAuditLog token={token} />}
                </div>
            </div>
        </div>
    );
}