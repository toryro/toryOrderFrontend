import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

// === 1. 영업장 정보 ===
function AdminStoreInfo({ store, token, fetchStore }) {
    // 기본 정보
    const [name, setName] = useState(store.name);
    const [address, setAddress] = useState(store.address || "");
    const [phone, setPhone] = useState(store.phone || "");
    const [desc, setDesc] = useState(store.description || "");
    
    // [신규] 추가 정보
    const [notice, setNotice] = useState(store.notice || "");
    const [originInfo, setOriginInfo] = useState(store.origin_info || "");
    
    // [신규] 사업자 정보
    const [ownerName, setOwnerName] = useState(store.owner_name || "");
    const [businessName, setBusinessName] = useState(store.business_name || "");
    const [businessAddress, setBusinessAddress] = useState(store.business_address || "");
    const [businessNumber, setBusinessNumber] = useState(store.business_number || "");

    const handleSave = async () => {
        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, 
                { 
                    name, address, phone, description: desc,
                    notice, origin_info: originInfo,
                    owner_name: ownerName, business_name: businessName,
                    business_address: businessAddress, business_number: businessNumber
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("저장되었습니다.");
            fetchStore();
        } catch(err) { alert("저장 실패"); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* 1. 기본 정보 카드 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">🏠 기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 이름</label><input className="w-full border p-3 rounded-lg" value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">전화번호</label><input className="w-full border p-3 rounded-lg" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="02-1234-5678" /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 주소 (위치)</label><input className="w-full border p-3 rounded-lg" value={address} onChange={e=>setAddress(e.target.value)} placeholder="손님이 찾아올 주소" /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 소개</label><textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="우리 가게를 소개해주세요" /></div>
                </div>
            </div>

            {/* 2. 알림 및 원산지 카드 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">📢 알림 & 정보</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">가게 알림 (공지사항)</label>
                        <textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={notice} onChange={e=>setNotice(e.target.value)} placeholder="예: 재료 소진 시 조기 마감합니다." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-600 mb-1">원산지 표시</label>
                        <textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={originInfo} onChange={e=>setOriginInfo(e.target.value)} placeholder="예: 쌀(국내산), 김치(중국산)" />
                    </div>
                </div>
            </div>

            {/* 3. 사업자 정보 카드 */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">💼 사업자 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">상호명</label><input className="w-full border p-3 rounded-lg" value={businessName} onChange={e=>setBusinessName(e.target.value)} placeholder="사업자등록증상 상호" /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">대표자명</label><input className="w-full border p-3 rounded-lg" value={ownerName} onChange={e=>setOwnerName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">사업자 등록번호</label><input className="w-full border p-3 rounded-lg" value={businessNumber} onChange={e=>setBusinessNumber(e.target.value)} placeholder="000-00-00000" /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">사업장 소재지</label><input className="w-full border p-3 rounded-lg" value={businessAddress} onChange={e=>setBusinessAddress(e.target.value)} placeholder="사업자등록증상 주소" /></div>
                </div>
            </div>

            <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md transition transform hover:scale-[1.01]">
                모든 정보 저장하기
            </button>
        </div>
    );
}

// === 2. 메뉴 관리 (풀버전) ===
function AdminMenuManagement({ store, token, fetchStore }) {
    // 옵션 그룹 상태
    const [storeOptionGroups, setStoreOptionGroups] = useState([]);
    
    // 메뉴 생성 States
    const [categoryName, setCategoryName] = useState("");
    const [categoryDesc, setCategoryDesc] = useState("");
    const [menuName, setMenuName] = useState("");
    const [menuPrice, setMenuPrice] = useState("");
    const [menuDesc, setMenuDesc] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [menuImage, setMenuImage] = useState(null);

    // 옵션 생성 States
    const [newGroupName, setNewGroupName] = useState("");
    const [isSingleSelect, setIsSingleSelect] = useState(false);
    const [newOptionName, setNewOptionName] = useState("");
    const [newOptionPrice, setNewOptionPrice] = useState("");
    const [activeOptionGroupId, setActiveOptionGroupId] = useState(null);

    // 선택 및 수정 States
    const [selectedMenu, setSelectedMenu] = useState(null);
    
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingCategoryName, setEditingCategoryName] = useState("");
    const [editingCategoryDesc, setEditingCategoryDesc] = useState("");
    const [editingCategoryHidden, setEditingCategoryHidden] = useState(false);

    const [editingGroupId, setEditingGroupId] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState("");
    const [editingGroupSingle, setEditingGroupSingle] = useState(false);

    const [editingOptionId, setEditingOptionId] = useState(null);
    const [editingOptionName, setEditingOptionName] = useState("");
    const [editingOptionPrice, setEditingOptionPrice] = useState("");

    // 메뉴 수정 모달
    const [isMenuEditModalOpen, setIsMenuEditModalOpen] = useState(false);
    const [editingMenuId, setEditingMenuId] = useState(null);
    const [editMenuCategoryId, setEditMenuCategoryId] = useState("");
    const [editMenuName, setEditMenuName] = useState("");
    const [editMenuPrice, setEditMenuPrice] = useState("");
    const [editMenuDesc, setEditMenuDesc] = useState("");
    const [editMenuSoldOut, setEditMenuSoldOut] = useState(false);
    const [editMenuHidden, setEditMenuHidden] = useState(false);
    const [editMenuImage, setEditMenuImage] = useState(null);

    // 옵션 그룹 가져오기
    useEffect(() => {
        const fetchOptionGroups = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/option-groups/`);
                setStoreOptionGroups(res.data);
            } catch (err) { console.error(err); }
        };
        fetchOptionGroups();
    }, [store.id]);

    const refreshAll = () => {
        fetchStore();
        // 옵션 그룹도 다시 로드
        axios.get(`${API_BASE_URL}/stores/${store.id}/option-groups/`)
             .then(res => setStoreOptionGroups(res.data));
    };

    // --- Handlers ---
    const handleCreateCategory = async () => {
        if (!categoryName) return;
        const nextOrder = store.categories.length > 0 ? Math.max(...store.categories.map(c => c.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/stores/${store.id}/categories/`, { name: categoryName, description: categoryDesc, order_index: nextOrder }, {headers:{Authorization:`Bearer ${token}`}}); 
        setCategoryName(""); setCategoryDesc(""); refreshAll(); 
    };
    const handleCreateMenu = async () => {
        if (!selectedCategoryId) return alert("카테고리를 선택해주세요!");
        if (!menuName || !menuPrice) return alert("이름과 가격을 입력해주세요.");
        
        // [수정] 현재 카테고리 내에서 가장 큰 순서 번호를 찾아 +1 (없으면 1)
        const category = store.categories.find(c => c.id == selectedCategoryId);
        const nextOrder = category && category.menus.length > 0 
            ? Math.max(...category.menus.map(m => m.order_index)) + 1 
            : 1;

        await axios.post(`${API_BASE_URL}/categories/${selectedCategoryId}/menus/`, 
            { 
                name: menuName, 
                price: parseInt(menuPrice), 
                description: menuDesc, 
                image_url: menuImage,
                order_index: nextOrder // [중요] 순서 번호 전송
            }, 
            {headers:{Authorization:`Bearer ${token}`}}
        ); 
        setMenuName(""); setMenuPrice(""); setMenuDesc(""); setMenuImage(null); refreshAll();
    };
    const handleImageUpload = async (e, setFunc) => {
        const formData = new FormData(); formData.append("file", e.target.files[0]);
        const res = await axios.post(`${API_BASE_URL}/upload/`, formData); setFunc(res.data.url);
    };

    // 카테고리 수정/삭제
    const startEditCategory = (cat) => { setEditingCategoryId(cat.id); setEditingCategoryName(cat.name); setEditingCategoryDesc(cat.description||""); setEditingCategoryHidden(cat.is_hidden); };
    const saveCategory = async (catId) => {
        await axios.patch(`${API_BASE_URL}/categories/${catId}`, { name: editingCategoryName, description: editingCategoryDesc, is_hidden: editingCategoryHidden });
        setEditingCategoryId(null); refreshAll();
    };
    const deleteCategory = async (catId) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/categories/${catId}`); setEditingCategoryId(null); refreshAll();
    };
    const handleUpdateCategoryOrder = async (catId, newOrder) => {
        await axios.patch(`${API_BASE_URL}/categories/${catId}`, { order_index: parseInt(newOrder) }); refreshAll();
    };

    // 메뉴 수정/삭제
    const openMenuEditModal = (menu, e) => {
        e.stopPropagation(); 
        setEditingMenuId(menu.id); setEditMenuCategoryId(menu.category_id); setEditMenuName(menu.name);
        setEditMenuPrice(menu.price); setEditMenuDesc(menu.description || ""); setEditMenuSoldOut(menu.is_sold_out);
        setEditMenuHidden(menu.is_hidden); setEditMenuImage(menu.image_url);
        setIsMenuEditModalOpen(true);
    };
    const saveMenu = async () => {
        await axios.patch(`${API_BASE_URL}/menus/${editingMenuId}`, {
            category_id: parseInt(editMenuCategoryId), name: editMenuName, price: parseInt(editMenuPrice),
            description: editMenuDesc, is_sold_out: editMenuSoldOut, is_hidden: editMenuHidden, image_url: editMenuImage
        });
        setIsMenuEditModalOpen(false); refreshAll();
    };
    const deleteMenu = async () => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/menus/${editingMenuId}`); setIsMenuEditModalOpen(false); refreshAll();
    };
    const handleUpdateMenuOrder = async (menuId, newOrder) => {
        await axios.patch(`${API_BASE_URL}/menus/${menuId}`, { order_index: parseInt(newOrder) }); refreshAll();
    };
    const handleMenuClick = (menu) => { if (selectedMenu?.id === menu.id) setSelectedMenu(null); else setSelectedMenu(menu); };

    // 옵션 그룹 및 옵션 관리
    const handleCreateOptionGroup = async () => {
        if (!newGroupName) return;
        const nextOrder = storeOptionGroups.length > 0 ? Math.max(...storeOptionGroups.map(g => g.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/stores/${store.id}/option-groups/`, { name: newGroupName, is_single_select: isSingleSelect, order_index: nextOrder }, { headers: { Authorization: `Bearer ${token}` } });
        setNewGroupName(""); setIsSingleSelect(false); refreshAll();
    };
    const handleCreateOption = async (groupId) => {
        if (!newOptionName) return;
        const group = storeOptionGroups.find(g => g.id === groupId);
        const nextOrder = group && group.options.length > 0 ? Math.max(...group.options.map(o => o.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/option-groups/${groupId}/options/`, { name: newOptionName, price: parseInt(newOptionPrice)||0, order_index: nextOrder }, { headers: { Authorization: `Bearer ${token}` } });
        setNewOptionName(""); setNewOptionPrice(""); setActiveOptionGroupId(null); refreshAll();
    };
    const startEditGroup = (group) => { setEditingGroupId(group.id); setEditingGroupName(group.name); setEditingGroupSingle(group.is_single_select); };
    const saveGroup = async (groupId) => {
        await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { name: editingGroupName, is_single_select: editingGroupSingle });
        setEditingGroupId(null); refreshAll();
    };
    const startEditOption = (opt) => { setEditingOptionId(opt.id); setEditingOptionName(opt.name); setEditingOptionPrice(opt.price); };
    const saveOption = async (optId) => {
        await axios.patch(`${API_BASE_URL}/options/${optId}`, { name: editingOptionName, price: parseInt(editingOptionPrice) });
        setEditingOptionId(null); refreshAll();
    };
    const handleUpdateOptionDefault = async (optionId) => { await axios.patch(`${API_BASE_URL}/options/${optionId}`, { is_default: true }); refreshAll(); };
    const handleUpdateGroupOrder = async (groupId, newOrder) => {
        if (selectedMenu) await axios.patch(`${API_BASE_URL}/menus/${selectedMenu.id}/option-groups/${groupId}/reorder`, { order_index: parseInt(newOrder) });
        else await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { order_index: parseInt(newOrder) });
        refreshAll();
    };
    const handleUpdateOptionOrder = async (optionId, newOrder) => { await axios.patch(`${API_BASE_URL}/options/${optionId}`, { order_index: parseInt(newOrder) }); refreshAll(); };
    const handleLinkGroup = async (groupId) => {
        if (!selectedMenu) return alert("메뉴를 먼저 선택하세요!");
        try { await axios.post(`${API_BASE_URL}/menus/${selectedMenu.id}/link-option-group/${groupId}`); refreshAll(); } catch { alert("이미 연결됨"); }
    };
    const handleUnlinkGroup = async (groupId, e) => {
        e.stopPropagation();
        if (window.confirm("해제하시겠습니까?")) { await axios.delete(`${API_BASE_URL}/menus/${selectedMenu.id}/option-groups/${groupId}`); refreshAll(); }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* 왼쪽: 메뉴 리스트 */}
            <div className="lg:col-span-2 space-y-6 overflow-y-auto pr-2 pb-20">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="font-bold mb-4">Step 1. 메뉴 등록</h3>
                    <div className="flex gap-2 mb-2 bg-gray-50 p-3 rounded-lg">
                        <select className="border p-2 rounded flex-1" value={selectedCategoryId} onChange={e=>setSelectedCategoryId(e.target.value)}>
                            <option value="">카테고리 선택</option>
                            {store.categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input className="border p-2 rounded w-32" placeholder="새 카테고리" value={categoryName} onChange={e=>setCategoryName(e.target.value)}/>
                        <input className="border p-2 rounded w-48 text-sm" placeholder="설명 (선택)" value={categoryDesc} onChange={e=>setCategoryDesc(e.target.value)}/>
                        <button onClick={handleCreateCategory} className="bg-indigo-500 text-white px-3 py-2 rounded text-sm font-bold">추가</button>
                    </div>
                    <div className="flex gap-2 mb-2">
                        <input className="border p-2 rounded flex-1" placeholder="메뉴 이름" value={menuName} onChange={e=>setMenuName(e.target.value)}/>
                        <input className="border p-2 rounded w-32" placeholder="가격" type="number" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)}/>
                    </div>
                    <input className="border p-2 rounded w-full mb-2" placeholder="메뉴 상세 설명" value={menuDesc} onChange={e=>setMenuDesc(e.target.value)}/>
                    <div className="flex items-center gap-2">
                        <input type="file" onChange={e=>handleImageUpload(e, setMenuImage)} className="text-sm py-2"/>
                        {menuImage && <span className="text-xs text-green-600 font-bold">이미지 업로드됨</span>}
                    </div>
                    <button onClick={handleCreateMenu} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md">등록 완료</button>
                </div>

                {store.categories?.map(cat => (
                    <div key={cat.id} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 ${cat.is_hidden ? 'opacity-60 bg-gray-100' : ''}`}>
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <input type="number" className="w-10 border rounded text-center font-bold bg-gray-50" defaultValue={cat.order_index} onBlur={e=>handleUpdateCategoryOrder(cat.id, e.target.value)} />
                            {editingCategoryId === cat.id ? (
                                <div className="flex flex-col flex-1 gap-2">
                                    <div className="flex items-center gap-2">
                                        <input className="border p-1 rounded text-lg font-bold flex-1" value={editingCategoryName} onChange={e=>setEditingCategoryName(e.target.value)} />
                                        <label className="text-sm flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={editingCategoryHidden} onChange={e=>setEditingCategoryHidden(e.target.checked)} /> 숨김</label>
                                        <button onClick={()=>saveCategory(cat.id)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">저장</button>
                                        <button onClick={()=>deleteCategory(cat.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">삭제</button>
                                        <button onClick={()=>setEditingCategoryId(null)} className="bg-gray-300 px-2 py-1 rounded text-xs">취소</button>
                                    </div>
                                    <input className="border p-1 rounded text-sm w-full" value={editingCategoryDesc} onChange={e=>setEditingCategoryDesc(e.target.value)} placeholder="카테고리 설명 수정" />
                                </div>
                            ) : (
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">{cat.name} {cat.is_hidden && <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded">숨김</span>}</h3>
                                        <button onClick={()=>startEditCategory(cat)} className="text-gray-400 hover:text-blue-500 text-sm">✏️</button>
                                    </div>
                                    {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {cat.menus?.map(menu => {
                                const isSelected = selectedMenu?.id === menu.id;
                                return (
                                <div key={menu.id} onClick={() => handleMenuClick(menu)} className={`p-3 rounded-xl border-2 cursor-pointer transition relative flex gap-3 overflow-hidden ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-100 hover:border-indigo-300'} ${menu.is_hidden ? 'opacity-50 grayscale' : ''}`}>
                                    <div className="flex flex-col items-center justify-center pr-2 border-r gap-1">
                                        <span className="text-[10px] text-gray-400">순서</span>
                                        <input type="number" className="w-8 border rounded text-center text-xs p-0.5" defaultValue={menu.order_index} onClick={e=>e.stopPropagation()} onBlur={e=>handleUpdateMenuOrder(menu.id, e.target.value)} />
                                    </div>
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                        {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">🥘</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <p className="font-bold text-lg truncate">{menu.name} {menu.is_hidden && <span className="text-xs bg-gray-600 text-white px-1 ml-1 rounded">숨김</span>}</p>
                                            <button onClick={(e)=>openMenuEditModal(menu, e)} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600 shrink-0">수정</button>
                                        </div>
                                        <p className="text-gray-600">{menu.price.toLocaleString()}원</p>
                                        {menu.description && <p className="text-xs text-gray-500 truncate mt-1">{menu.description}</p>}
                                        {menu.is_sold_out && <span className="text-xs bg-red-100 text-red-600 px-1 rounded font-bold">품절</span>}
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {menu.option_groups?.length>0 ? menu.option_groups.map(g => (
                                                <span key={g.id} className="text-xs bg-white border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                    {g.name}
                                                    {isSelected && <button onClick={(e) => handleUnlinkGroup(g.id, e)} className="text-red-500 font-bold px-1 hover:bg-red-50 rounded">×</button>}
                                                </span>
                                            )) : <span className="text-xs text-gray-400">옵션 없음</span>}
                                        </div>
                                    </div>
                                    {isSelected && <div className="absolute top-0 right-0 bg-indigo-600 text-white px-2 py-1 text-xs font-bold rounded-bl-xl">선택됨</div>}
                                </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* 오른쪽: 옵션 라이브러리 */}
            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300 flex flex-col h-full overflow-hidden">
                <h2 className="text-lg font-bold mb-3 shrink-0">📚 옵션 라이브러리</h2>
                
                <div className="shrink-0 mb-4">
                    <div className={`p-4 rounded-xl text-center border-2 transition-colors ${selectedMenu ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                        {selectedMenu ? (<div><p className="font-bold text-lg">"{selectedMenu.name}" 선택됨</p><p className="text-sm opacity-90">아래에서 연결할 옵션을 누르세요 👇</p></div>) : (<p className="font-bold">메뉴를 먼저 선택하세요 👈</p>)}
                    </div>
                </div>

                <div className="mb-4 border-b pb-4 bg-gray-50 p-3 rounded-lg shrink-0">
                    <input className="border p-2 rounded w-full text-sm mb-2" placeholder="새 그룹명 (예: 맵기)" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} />
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isSingleSelect} onChange={e=>setIsSingleSelect(e.target.checked)} className="w-4 h-4"/> 1개만 선택 (라디오)</label>
                        <button onClick={handleCreateOptionGroup} className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm font-bold">생성</button>
                    </div>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 pb-4">
                    {storeOptionGroups.map(group => {
                        const linkedGroup = selectedMenu?.option_groups?.find(g => g.id === group.id);
                        const isLinked = !!linkedGroup;
                        const displayOrder = (selectedMenu && isLinked) ? linkedGroup.order_index : group.order_index;

                        return (
                            <div key={group.id} className={`p-3 rounded-lg border transition ${isLinked ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:border-gray-400'}`}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                                        <input type="number" className="w-8 border rounded text-center text-sm p-0.5 bg-gray-50" key={`${group.id}-${displayOrder}`} defaultValue={displayOrder} onBlur={(e)=>handleUpdateGroupOrder(group.id, e.target.value)}/>
                                        {editingGroupId === group.id ? (
                                            <div className="flex items-center gap-1">
                                                <input className="border p-0.5 w-24 text-sm" value={editingGroupName} onChange={e=>setEditingGroupName(e.target.value)} />
                                                <input type="checkbox" checked={editingGroupSingle} onChange={e=>setEditingGroupSingle(e.target.checked)} title="1개만 선택" />
                                                <button onClick={()=>saveGroup(group.id)} className="text-xs bg-blue-500 text-white px-1 rounded">V</button>
                                                <button onClick={()=>setEditingGroupId(null)} className="text-xs bg-gray-300 px-1 rounded">X</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 overflow-hidden">
                                                <span className="font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600" onClick={()=>startEditGroup(group)}>📌 {group.name}</span>
                                                {group.is_single_select && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200 shrink-0">1개만</span>}
                                            </div>
                                        )}
                                    </div>
                                    {selectedMenu && (isLinked ? <button disabled className="text-gray-400 text-xs font-bold px-2">연결됨 v</button> : <button onClick={()=>handleLinkGroup(group.id)} className="bg-indigo-600 text-white text-xs px-2 py-1.5 rounded font-bold hover:bg-indigo-700 shadow-sm shrink-0">연결 🔗</button>)}
                                </div>
                                <ul className="text-sm space-y-2 mb-3 bg-white p-2 rounded border text-gray-600">
                                    {group.options.map(opt => (
                                        <li key={opt.id} className={`p-2 rounded transition ${editingOptionId === opt.id ? 'bg-indigo-50 border border-indigo-200 shadow-sm' : 'hover:bg-gray-50 flex items-center justify-between'}`}>
                                            
                                            {/* [A] 수정 모드 */}
                                            {editingOptionId === opt.id ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    {/* 윗줄: 순서 + 이름 */}
                                                    <div className="flex items-center gap-2 w-full">
                                                        <span className="text-[10px] text-gray-400 shrink-0 w-6">순서</span>
                                                        <input 
                                                            type="number" 
                                                            className="w-10 border rounded text-center text-xs p-1 bg-white shrink-0" 
                                                            defaultValue={opt.order_index} 
                                                            onBlur={(e)=>handleUpdateOptionOrder(opt.id, e.target.value)} 
                                                        />
                                                        {/* min-w-0을 추가해야 부모 영역을 넘어가지 않고 줄어듭니다! */}
                                                        <input 
                                                            className="border p-1 rounded text-xs flex-1 bg-white min-w-0" 
                                                            value={editingOptionName} 
                                                            onChange={e=>setEditingOptionName(e.target.value)} 
                                                            placeholder="옵션명" 
                                                            autoFocus 
                                                        />
                                                    </div>
                                                    
                                                    {/* 아랫줄: 가격 + 버튼들 */}
                                                    <div className="flex items-center gap-2 w-full">
                                                        <span className="text-[10px] text-gray-400 shrink-0 w-6">가격</span>
                                                        <input 
                                                            className="border p-1 rounded text-xs flex-1 bg-white min-w-0" 
                                                            type="number" 
                                                            value={editingOptionPrice} 
                                                            onChange={e=>setEditingOptionPrice(e.target.value)} 
                                                            placeholder="가격" 
                                                        />
                                                        <div className="flex gap-1 shrink-0">
                                                            <button onClick={()=>saveOption(opt.id)} className="bg-blue-600 text-white text-xs px-2 py-1 rounded font-bold hover:bg-blue-700">저장</button>
                                                            <button onClick={()=>setEditingOptionId(null)} className="bg-gray-300 text-gray-700 text-xs px-2 py-1 rounded font-bold hover:bg-gray-400">취소</button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                // [B] 조회 모드 (기존 유지)
                                                <>
                                                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                                                        <div className="w-6 h-6 flex items-center justify-center bg-gray-100 rounded text-[10px] font-bold text-gray-500 shrink-0">
                                                            {opt.order_index}
                                                        </div>
                                                        
                                                        {group.is_single_select && (
                                                            opt.is_default 
                                                            ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold border border-green-200 shrink-0">기본</span> 
                                                            : <button onClick={()=>handleUpdateOptionDefault(opt.id)} className="text-[10px] text-gray-400 hover:text-blue-500 underline shrink-0 whitespace-nowrap">기본설정</button>
                                                        )}

                                                        <span 
                                                            className="cursor-pointer hover:text-blue-600 font-medium truncate" 
                                                            onClick={()=>startEditOption(opt)}
                                                            title="눌러서 수정"
                                                        >
                                                            {opt.name}
                                                        </span>
                                                    </div>
                                                    
                                                    <span className="font-bold text-gray-800 shrink-0 ml-2">+{opt.price.toLocaleString()}</span>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                    {group.options.length === 0 && <li className="text-xs text-gray-400 text-center py-2">등록된 옵션이 없습니다.</li>}
                                </ul>
                                {activeOptionGroupId === group.id ? (
                                    <div className="flex flex-col gap-2 bg-gray-100 p-2 rounded">
                                        <div className="flex gap-1"><input className="border p-1 rounded text-xs flex-1" placeholder="옵션명" value={newOptionName} onChange={e=>setNewOptionName(e.target.value)} /><input className="border p-1 rounded text-xs w-14" type="number" placeholder="원" value={newOptionPrice} onChange={e=>setNewOptionPrice(e.target.value)} /></div>
                                        <div className="flex gap-1"><button onClick={()=>handleCreateOption(group.id)} className="bg-indigo-600 text-white text-xs py-1 rounded flex-1">저장</button><button onClick={()=>setActiveOptionGroupId(null)} className="bg-gray-300 text-gray-700 text-xs py-1 rounded flex-1">취소</button></div>
                                    </div>
                                ) : (<button onClick={() => { setActiveOptionGroupId(group.id); setNewOptionName(""); setNewOptionPrice(""); }} className="w-full bg-white border border-dashed border-gray-400 text-gray-500 text-xs py-1.5 rounded hover:bg-gray-50">+ 상세 옵션 추가</button>)}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 메뉴 수정 모달 */}
            {isMenuEditModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-slideUp">
                        <h2 className="text-xl font-bold mb-4">메뉴 수정</h2>
                        <div className="space-y-3">
                            <div><label className="block text-sm font-bold text-gray-700">카테고리</label><select className="border w-full p-2 rounded" value={editMenuCategoryId} onChange={e=>setEditMenuCategoryId(e.target.value)}>{store.categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                            <div><label className="block text-sm font-bold text-gray-700">이름</label><input className="border w-full p-2 rounded" value={editMenuName} onChange={e=>setEditMenuName(e.target.value)} /></div>
                            <div><label className="block text-sm font-bold text-gray-700">가격</label><input className="border w-full p-2 rounded" type="number" value={editMenuPrice} onChange={e=>setEditMenuPrice(e.target.value)} /></div>
                            <div><label className="block text-sm font-bold text-gray-700">상세 설명</label><textarea className="border w-full p-2 rounded resize-none" rows="2" value={editMenuDesc} onChange={e=>setEditMenuDesc(e.target.value)} /></div>
                            <div><label className="block text-sm font-bold text-gray-700">이미지 변경</label><input type="file" className="text-sm" onChange={(e)=>handleImageUpload(e, setEditMenuImage)} />{editMenuImage && <div className="mt-2 w-20 h-20 rounded overflow-hidden bg-gray-100"><img src={editMenuImage} className="w-full h-full object-cover"/></div>}</div>
                            <div className="flex gap-4 pt-2">
                                <div className="flex items-center gap-2"><input type="checkbox" checked={editMenuSoldOut} onChange={e=>setEditMenuSoldOut(e.target.checked)} className="w-5 h-5 text-red-600"/><label className="text-sm font-bold text-red-600">품절 처리</label></div>
                                <div className="flex items-center gap-2"><input type="checkbox" checked={editMenuHidden} onChange={e=>setEditMenuHidden(e.target.checked)} className="w-5 h-5 text-gray-600"/><label className="text-sm font-bold text-gray-600">메뉴 숨김</label></div>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-6">
                            <button onClick={saveMenu} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">수정 완료</button>
                            <button onClick={deleteMenu} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">삭제</button>
                            <button onClick={()=>setIsMenuEditModalOpen(false)} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-bold">취소</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// === 3. 영업 시간 관리 ===
function AdminHours({ store, token, fetchStore }) {
    const days = ["월", "화", "수", "목", "금", "토", "일"];
    const [hours, setHours] = useState(Array(7).fill({ open_time: "09:00", close_time: "22:00", is_closed: false }));
    const [holidayDate, setHolidayDate] = useState("");
    const [holidayDesc, setHolidayDesc] = useState("");

    useEffect(() => {
        if (store.operating_hours && store.operating_hours.length > 0) {
            const newHours = Array(7).fill(null).map((_, i) => {
                const found = store.operating_hours.find(h => h.day_of_week === i);
                return found ? { ...found } : { day_of_week: i, open_time: "09:00", close_time: "22:00", is_closed: false };
            });
            setHours(newHours);
        }
    }, [store]);

    const handleHourChange = (idx, field, value) => {
        const newHours = [...hours];
        newHours[idx] = { ...newHours[idx], day_of_week: idx, [field]: value };
        setHours(newHours);
    };
    const saveHours = async () => {
        try { await axios.post(`${API_BASE_URL}/stores/${store.id}/hours`, hours, { headers: { Authorization: `Bearer ${token}` } }); alert("저장되었습니다."); fetchStore(); } catch(err) { alert("저장 실패"); }
    };
    const addHoliday = async () => {
        if (!holidayDate) return;
        try { await axios.post(`${API_BASE_URL}/stores/${store.id}/holidays`, { date: holidayDate, description: holidayDesc }, { headers: { Authorization: `Bearer ${token}` } }); setHolidayDate(""); setHolidayDesc(""); fetchStore(); } catch(err) { alert("추가 실패"); }
    };
    const deleteHoliday = async (id) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/holidays/${id}`); fetchStore();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="font-bold text-lg mb-4">⏰ 요일별 영업시간</h3>
                <div className="space-y-3">
                    {days.map((day, idx) => (
                        <div key={idx} className="flex items-center gap-3 py-2 border-b last:border-0">
                            <span className="w-8 font-bold text-gray-700">{day}</span>
                            <input type="checkbox" checked={hours[idx].is_closed} onChange={e=>handleHourChange(idx, 'is_closed', e.target.checked)} className="w-5 h-5"/>
                            <span className="text-sm text-gray-500 w-10">{hours[idx].is_closed ? "휴무" : "영업"}</span>
                            {!hours[idx].is_closed && (<><input type="time" className="border p-1 rounded" value={hours[idx].open_time || ""} onChange={e=>handleHourChange(idx, 'open_time', e.target.value)} /><span>~</span><input type="time" className="border p-1 rounded" value={hours[idx].close_time || ""} onChange={e=>handleHourChange(idx, 'close_time', e.target.value)} /></>)}
                        </div>
                    ))}
                </div>
                <button onClick={saveHours} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold mt-6 hover:bg-blue-700">시간표 저장</button>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
                <h3 className="font-bold text-lg mb-4">🏖️ 임시 휴일 지정</h3>
                <div className="flex gap-2 mb-4">
                    <input type="date" className="border p-2 rounded" value={holidayDate} onChange={e=>setHolidayDate(e.target.value)} />
                    <input className="border p-2 rounded flex-1" placeholder="사유" value={holidayDesc} onChange={e=>setHolidayDesc(e.target.value)} />
                    <button onClick={addHoliday} className="bg-indigo-600 text-white px-3 rounded font-bold">+</button>
                </div>
                <ul className="space-y-2">{store.holidays?.map(h => (<li key={h.id} className="flex justify-between items-center bg-gray-50 p-3 rounded"><span>{h.date} <span className="text-sm text-gray-500">({h.description})</span></span><button onClick={()=>deleteHoliday(h.id)} className="text-red-500 text-sm">삭제</button></li>))}</ul>
            </div>
        </div>
    );
}

// === 4. 테이블 관리 ===
function AdminTables({ store, token, fetchStore }) {
    const [tableName, setTableName] = useState("");
    const [editingTableId, setEditingTableId] = useState(null);
    const [editingTableName, setEditingTableName] = useState("");

    const handleCreateTable = async () => {
        if(!tableName) return;
        await axios.post(`${API_BASE_URL}/stores/${store.id}/tables/`, {name:tableName}, {headers:{Authorization:`Bearer ${token}`}}); setTableName(""); fetchStore();
    };
    const saveTable = async () => { await axios.patch(`${API_BASE_URL}/tables/${editingTableId}`, { name: editingTableName }); setEditingTableId(null); fetchStore(); };
    const deleteTable = async (id) => { if(!window.confirm("삭제하시겠습니까?")) return; await axios.delete(`${API_BASE_URL}/tables/${id}`); fetchStore(); };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">🪑 테이블 관리</h2>
            <div className="flex gap-2 mb-8 max-w-md">
                <input className="border p-3 rounded-lg flex-1" placeholder="새 테이블 이름" value={tableName} onChange={e=>setTableName(e.target.value)} />
                <button onClick={handleCreateTable} className="bg-gray-800 text-white px-6 rounded-lg font-bold">추가</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {store.tables?.map(t => (
                    <div key={t.id} className="border rounded-xl p-4 flex flex-col items-center gap-3 bg-gray-50">
                        {editingTableId === t.id ? (
                            <div className="flex gap-1 w-full"><input className="border rounded p-1 text-center w-full" value={editingTableName} onChange={e=>setEditingTableName(e.target.value)} autoFocus /><button onClick={saveTable} className="text-blue-600 font-bold">V</button></div>
                        ) : (<span className="font-bold text-xl">{t.name}</span>)}
                        <div className="w-full h-32 bg-white rounded flex items-center justify-center border"><span className="text-xs text-gray-400">QR Code</span></div>
                        <div className="flex gap-2 w-full justify-center">
                            <a href={`${window.location.origin}/order/${t.qr_token}`} target="_blank" className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">주문창</a>
                            <button onClick={()=>{setEditingTableId(t.id); setEditingTableName(t.name);}} className="text-xs border px-2 py-1 rounded hover:bg-gray-200">수정</button>
                            <button onClick={()=>deleteTable(t.id)} className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded hover:bg-red-200">삭제</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

// === 메인 페이지 ===
function AdminPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");

  const fetchStore = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/stores/${storeId}`, { headers: { Authorization: `Bearer ${token}` } });
      setStore(res.data); setLoading(false);
    } catch (err) { alert("로딩 실패"); setLoading(false); }
  };

  useEffect(() => { if (!token) navigate("/"); fetchStore(); }, [storeId]);

  if (loading || !store) return <div className="p-10 text-center font-bold">⏳ 로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <div className="w-64 bg-white border-r flex flex-col fixed h-full z-10">
        <div className="p-6 border-b"><h1 className="text-xl font-extrabold text-gray-800">{store.name}</h1><p className="text-xs text-gray-500 mt-1">관리자 모드</p></div>
        <nav className="flex-1 p-4 space-y-2">
            <button onClick={()=>setActiveTab("info")} className={`w-full text-left px-4 py-3 rounded-lg font-bold transition ${activeTab==="info" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}>🏠 영업장 정보</button>
            <button onClick={()=>setActiveTab("menu")} className={`w-full text-left px-4 py-3 rounded-lg font-bold transition ${activeTab==="menu" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}>🍽️ 메뉴 관리</button>
            <button onClick={()=>setActiveTab("hours")} className={`w-full text-left px-4 py-3 rounded-lg font-bold transition ${activeTab==="hours" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}>⏰ 영업 시간</button>
            <button onClick={()=>setActiveTab("tables")} className={`w-full text-left px-4 py-3 rounded-lg font-bold transition ${activeTab==="tables" ? "bg-indigo-50 text-indigo-600" : "text-gray-600 hover:bg-gray-50"}`}>🪑 테이블 관리</button>
        </nav>
      </div>
      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        {activeTab === "info" && <AdminStoreInfo store={store} token={token} fetchStore={fetchStore} />}
        {activeTab === "menu" && <AdminMenuManagement store={store} token={token} fetchStore={fetchStore} />}
        {activeTab === "hours" && <AdminHours store={store} token={token} fetchStore={fetchStore} />}
        {activeTab === "tables" && <AdminTables store={store} token={token} fetchStore={fetchStore} />}
      </div>
    </div>
  );
}

export default AdminPage;