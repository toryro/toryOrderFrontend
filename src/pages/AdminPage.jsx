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
// 2. [본사 관리자용] Group Admin View
// ==========================================
function GroupAdminView({ user, token }) {
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // 매장 목록 불러오기 함수
    const fetchStores = async (isBackground = false) => {
        try {
            const res = await axios.get(`${API_BASE_URL}/groups/my/stores`, { 
                headers: { Authorization: `Bearer ${token}` } 
            });
            setStores(res.data);
        } catch (err) {
            console.error("매장 목록 로딩 실패"); 
        } finally {
            // 처음 로딩할 때만 로딩 화면을 보여주고, 자동 갱신 때는 안 보여줌 (깜빡임 방지)
            if (!isBackground) setLoading(false);
        }
    };

    useEffect(() => {
        // 1. 처음 접속 시 바로 실행
        fetchStores();

        // 2. 5초마다 자동으로 최신 데이터 가져오기 (실시간 감지 효과)
        const intervalId = setInterval(() => {
            fetchStores(true); // 백그라운드 실행
        }, 5000);

        // 3. 페이지를 떠나면 자동 갱신 중지 (청소)
        return () => clearInterval(intervalId);
    }, []);

    const handleLogout = () => { localStorage.removeItem("token"); navigate("/"); };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-6xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900">🏢 {user.group_id === 1 ? "백종원컴퍼니" : "프랜차이즈 본사"}</h1>
                        <p className="text-gray-500 mt-1">통합 관리 대시보드 (접속자: {user.name})</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="bg-white px-4 py-2 rounded-full shadow-sm border text-sm font-bold text-indigo-600">{user.role}</span>
                        <button onClick={handleLogout} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-black">로그아웃</button>
                    </div>
                </header>

                {loading ? <div className="text-center py-20">로딩 중...</div> : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {stores.map(store => (
                            <div key={store.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 hover:shadow-md transition">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-gray-800">{store.name}</h3>
                                    {/* 상태 배지에 애니메이션 효과 추가 (깜빡임으로 갱신 느낌 주기) */}
                                    <span className={`px-2 py-1 rounded-full font-bold text-xs transition-colors duration-500 ${store.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {store.is_open ? "🟢 영업중" : "🔴 영업종료"}
                                    </span>
                                </div>
                                <p className="text-gray-500 text-sm mb-6 truncate">{store.address || "주소 미등록"}</p>
                                <div className="grid grid-cols-2 gap-2">
                                    <button onClick={() => navigate(`/admin/${store.id}`)} className="bg-gray-900 text-white py-2 rounded-lg text-sm font-bold hover:bg-black">관리 접속</button>
                                    <a href={`/kitchen/${store.id}`} target="_blank" className="border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-bold hover:bg-gray-50 text-center">주방 화면</a>
                                </div>
                            </div>
                        ))}
                        {stores.length === 0 && <div className="col-span-full text-center py-20 text-gray-400">등록된 매장이 없습니다.</div>}
                    </div>
                )}
            </div>
        </div>
    );
}

// ==========================================
// 3. [점주용] 관리 컴포넌트 (중복 제거됨)
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

    const handleSave = async () => {
        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, 
                { name, address, phone, description: desc, notice, origin_info: originInfo, owner_name: ownerName, business_name: businessName, business_address: businessAddress, business_number: businessNumber },
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
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">💼 사업자 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">상호명</label><input className="w-full border p-3 rounded-lg" value={businessName} onChange={e=>setBusinessName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">대표자명</label><input className="w-full border p-3 rounded-lg" value={ownerName} onChange={e=>setOwnerName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">사업자 번호</label><input className="w-full border p-3 rounded-lg" value={businessNumber} onChange={e=>setBusinessNumber(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">소재지</label><input className="w-full border p-3 rounded-lg" value={businessAddress} onChange={e=>setBusinessAddress(e.target.value)} /></div>
                </div>
            </div>
            <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md">저장하기</button>
        </div>
    );
}

function AdminMenuManagement({ store, token, fetchStore }) {
    const [storeOptionGroups, setStoreOptionGroups] = useState([]);
    
    // 메뉴 생성 상태
    const [categoryName, setCategoryName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [menuName, setMenuName] = useState("");
    const [menuPrice, setMenuPrice] = useState("");
    const [menuDesc, setMenuDesc] = useState("");
    const [menuImage, setMenuImage] = useState(null);

    // 옵션 그룹 생성 상태
    const [newGroupName, setNewGroupName] = useState("");
    const [isSingleSelect, setIsSingleSelect] = useState(false);
    const [isRequired, setIsRequired] = useState(false); 
    const [maxSelect, setMaxSelect] = useState(0); // [신규] 최대 선택 개수
    
    // 옵션 상세 생성 상태
    const [activeOptionGroupId, setActiveOptionGroupId] = useState(null);
    const [newOptionName, setNewOptionName] = useState("");
    const [newOptionPrice, setNewOptionPrice] = useState("");

    // 수정 상태
    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState("");
    const [editingGroupSingle, setEditingGroupSingle] = useState(false);
    const [editingGroupRequired, setEditingGroupRequired] = useState(false);
    const [editingGroupMax, setEditingGroupMax] = useState(0); // [신규]

    const [editingOptionId, setEditingOptionId] = useState(null);
    const [editingOptionName, setEditingOptionName] = useState("");
    const [editingOptionPrice, setEditingOptionPrice] = useState("");

    // 메뉴 수정 모달 상태
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

    // --- [1] 생성 로직 ---
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

    // --- [2] 메뉴 수정 로직 ---
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

    // --- [3] 그룹 관리 ---
    const startEditGroup = (group) => {
        setEditingGroupId(group.id);
        setEditingGroupName(group.name);
        setEditingGroupSingle(group.is_single_select);
        setEditingGroupRequired(group.is_required);
        setEditingGroupMax(group.max_select || 0); // [신규]
    };
    const saveGroup = async (groupId) => {
        await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { 
            name: editingGroupName, 
            is_single_select: editingGroupSingle, 
            is_required: editingGroupRequired,
            max_select: parseInt(editingGroupMax) // [신규]
        });
        setEditingGroupId(null); refreshAll();
    };
    const handleUpdateGroupOrder = async (groupId, newOrder) => {
        await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { order_index: parseInt(newOrder) });
        refreshAll();
    };

    // --- [4] 상세 옵션 관리 ---
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

    // --- [5] 연결 로직 ---
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

    // --- [6] 연결된 옵션 순서 변경 ---
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

                {/* 메뉴 리스트 */}
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
                        {/* [신규] 최대 선택 개수 입력 (다중 선택일 때만 표시) */}
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

function AdminHours({ store, token, fetchStore }) {
    const [hours, setHours] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [newHolidayDate, setNewHolidayDate] = useState("");
    const [newHolidayDesc, setNewHolidayDesc] = useState("");

    const days = ["월", "화", "수", "목", "금", "토", "일"];

    useEffect(() => {
        if (store.operating_hours && store.operating_hours.length > 0) {
            // DB에 저장된 시간이 있으면 그거 사용 (요일 순서대로 정렬)
            const sorted = [...store.operating_hours].sort((a, b) => a.day_of_week - b.day_of_week);
            // 만약 빠진 요일이 있다면 기본값으로 채워줌 (안정성 확보)
            const fullHours = Array.from({ length: 7 }, (_, i) => {
                const exist = sorted.find(h => h.day_of_week === i);
                return exist || { day_of_week: i, open_time: "09:00", close_time: "22:00", is_closed: false };
            });
            setHours(fullHours);
        } else {
            // 없으면 기본값 초기화
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

// AdminPage.jsx 내부의 AdminTables 컴포넌트를 이것으로 교체하세요.

function AdminTables({ store, token, fetchStore }) {
    const [newTableName, setNewTableName] = useState("");
    
    // 수정 모드 상태
    const [editingTableId, setEditingTableId] = useState(null);
    const [editingName, setEditingName] = useState("");

    // QR 크게보기 모달 상태
    const [zoomQrTable, setZoomQrTable] = useState(null);

    // 테이블 생성
    const handleCreateTable = async () => {
        if (!newTableName) return;
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/tables/`, { name: newTableName }, { headers: { Authorization: `Bearer ${token}` } });
            setNewTableName(""); fetchStore();
        } catch (err) { alert("테이블 생성 실패"); }
    };

    // 테이블 삭제
    const handleDeleteTable = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까? QR코드도 무효화됩니다.")) return;
        try { await axios.delete(`${API_BASE_URL}/tables/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchStore(); } 
        catch (err) { alert("삭제 실패"); }
    };

    // 테이블 이름 수정 모드 진입
    const startEdit = (table) => {
        setEditingTableId(table.id);
        setEditingName(table.name);
    };

    // 테이블 이름 수정 저장
    const saveEdit = async (tableId) => {
        try {
            await axios.patch(`${API_BASE_URL}/tables/${tableId}`, { name: editingName }, { headers: { Authorization: `Bearer ${token}` } });
            setEditingTableId(null); fetchStore();
        } catch (err) { alert("수정 실패"); }
    };

    // QR 코드 이미지 URL 생성기 (QR Server API 활용)
    const getQrImageUrl = (token, size = 150) => {
        // 실제 접속할 주문 페이지 URL
        const targetUrl = `${window.location.protocol}//${window.location.host}/order/${token}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
    };

    // QR 코드 다운로드 (파일명: 날짜_가게명_테이블명.png)
    const handleDownloadQR = async (table) => {
        const imageUrl = getQrImageUrl(table.qr_token, 500); // 고화질 다운로드
        const dateStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
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
        } catch (err) {
            console.error(err);
            alert("다운로드 중 오류가 발생했습니다.");
        }
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
                        
                        {/* QR 코드 썸네일 (클릭 시 확대) */}
                        <div 
                            className="w-24 h-24 bg-gray-100 mb-3 cursor-zoom-in overflow-hidden rounded-lg border"
                            onClick={() => setZoomQrTable(table)}
                        >
                            <img 
                                src={getQrImageUrl(table.qr_token)} 
                                alt="QR Code" 
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                            />
                        </div>

                        {/* 테이블 이름 (수정 모드 지원) */}
                        {editingTableId === table.id ? (
                            <div className="flex gap-1 w-full mb-2">
                                <input 
                                    className="border p-1 text-xs w-full rounded text-center" 
                                    value={editingName} 
                                    onChange={e=>setEditingName(e.target.value)} 
                                    autoFocus
                                />
                                <button onClick={()=>saveEdit(table.id)} className="bg-blue-500 text-white px-1 rounded text-xs">V</button>
                                <button onClick={()=>setEditingTableId(null)} className="bg-gray-300 text-gray-700 px-1 rounded text-xs">X</button>
                            </div>
                        ) : (
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-1 cursor-pointer hover:text-indigo-600" onClick={()=>startEdit(table)}>
                                {table.name} <span className="text-xs text-gray-400">✏️</span>
                            </h3>
                        )}

                        {/* 관리 버튼 */}
                        <div className="flex justify-between w-full mt-auto pt-2 border-t gap-2">
                            <button onClick={()=>handleDeleteTable(table.id)} className="text-red-400 text-xs hover:text-red-600 hover:underline">삭제</button>
                            <button onClick={()=>setZoomQrTable(table)} className="text-indigo-500 text-xs hover:text-indigo-700 font-bold">QR 확대</button>
                        </div>
                    </div>
                ))}
                {store.tables?.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">등록된 테이블이 없습니다.</div>}
            </div>

            {/* QR 크게보기 모달 */}
            {zoomQrTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setZoomQrTable(null)}>
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-extrabold text-gray-800 mb-2">{zoomQrTable.name}</h3>
                        <p className="text-gray-500 mb-6 text-sm">QR코드를 스캔하여 주문하세요</p>
                        
                        <div className="p-4 border-4 border-black rounded-xl mb-6 bg-white">
                            <img 
                                src={getQrImageUrl(zoomQrTable.qr_token, 300)} 
                                alt="Large QR" 
                                className="w-64 h-64"
                            />
                        </div>

                        <div className="flex gap-3 w-full">
                            <button 
                                onClick={() => handleDownloadQR(zoomQrTable)}
                                className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2"
                            >
                                📥 QR 저장
                            </button>
                            <button 
                                onClick={() => setZoomQrTable(null)}
                                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300"
                            >
                                닫기
                            </button>
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
            {/* 날짜 선택 헤더 */}
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
                    {/* 요약 카드 */}
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
                        {/* 메뉴별 통계 */}
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

                        {/* 시간대별 통계 */}
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
        if (!token) { alert("로그인 필요"); navigate("/"); return; }
        axios.get(`${API_BASE_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => {
                setUser(res.data);
                if (res.data.role === "STORE_OWNER" && !storeId && res.data.store_id) {
                    navigate(`/admin/${res.data.store_id}`);
                }
            })
            .catch(() => { alert("세션 만료"); navigate("/"); });
    }, [token, storeId]);

    const fetchStore = async () => {
        if (storeId && ["SUPER_ADMIN", "GROUP_ADMIN", "STORE_OWNER"].includes(user?.role)) {
            try {
                const res = await axios.get(`${API_BASE_URL}/stores/${storeId}`, { headers: { Authorization: `Bearer ${token}` } });
                setStore(res.data);
            } catch { alert("가게 정보 로딩 실패"); }
        }
    };

    useEffect(() => {
        if (user) {
            fetchStore().then(() => setLoading(false));
        }
    }, [user, storeId]);

    // [신규] 영업 상태 토글 핸들러
    const toggleStoreStatus = async () => {
        if (!store) return;
        const newStatus = !store.is_open;
        if (!window.confirm(newStatus ? "영업을 시작하시겠습니까?" : "영업을 종료하시겠습니까?")) return;

        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, 
                { is_open: newStatus }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStore({ ...store, is_open: newStatus }); // 화면 즉시 반영
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
    if (["SUPER_ADMIN", "GROUP_ADMIN"].includes(user.role) && !storeId) return <GroupAdminView user={user} token={token} />;
    if (!store) return <div className="p-10 text-center">매장 정보 로딩중...</div>;

    return (
        <div className="min-h-screen bg-gray-100 flex">
            {/* 사이드바 */}
            <div className="w-64 bg-white border-r flex flex-col fixed h-full z-10">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-extrabold text-gray-800 truncate">{store.name}</h1>
                    <p className="text-xs text-gray-500 mt-1 mb-4">{user.role === "GROUP_ADMIN" ? "본사 관리 모드" : "사장님 모드"}</p>
                    
                    {/* [신규] 영업 토글 스위치 */}
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

                    {user.role === "GROUP_ADMIN" && (<button onClick={() => navigate("/admin")} className="text-xs text-indigo-600 font-bold mt-4 hover:underline block w-full text-left">← 본사 대시보드</button>)}
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <MenuButton icon="🏠" label="영업장 정보" active={activeTab==="info"} onClick={()=>setActiveTab("info")} />
                    <MenuButton icon="🍽️" label="메뉴 관리" active={activeTab==="menu"} onClick={()=>setActiveTab("menu")} />
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