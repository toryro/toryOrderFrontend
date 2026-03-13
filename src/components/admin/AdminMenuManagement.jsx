import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config"; 
import toast from "react-hot-toast";

export default function AdminMenuManagement({ store, token, fetchStore, user }) {
    const isHQ = ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN"].includes(user?.role); 
    const [storeOptionGroups, setStoreOptionGroups] = useState([]);
    const [categoryName, setCategoryName] = useState("");
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [menuName, setMenuName] = useState("");
    const [menuPrice, setMenuPrice] = useState("");
    const [isPriceFixed, setIsPriceFixed] = useState(false); 
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

    // 할인 관련 상태값 (기존에 선언해두신 것 유지)
    const [isDiscounted, setIsDiscounted] = useState(false);
    const [discountPrice, setDiscountPrice] = useState("");
    const [timeSaleStart, setTimeSaleStart] = useState("");
    const [timeSaleEnd, setTimeSaleEnd] = useState("");
    
    useEffect(() => { refreshOptionGroups(); }, [store.id]);

    const refreshOptionGroups = () => {
        axios.get(`${API_BASE_URL}/stores/${store.id}/option-groups/`, {
            headers: { Authorization: `Bearer ${token}` } 
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
            { name: menuName, price: parseInt(menuPrice), description: menuDesc, image_url: menuImage, order_index: nextOrder, is_price_fixed: isPriceFixed }, 
            {headers:{Authorization:`Bearer ${token}`}}
        );
        setMenuName(""); setMenuPrice(""); setMenuDesc(""); setMenuImage(null); setIsPriceFixed(false); refreshAll(); 
    };

    const handleCreateOptionGroup = async () => {
        if (!newGroupName) return;
        const nextOrder = storeOptionGroups.length > 0 ? Math.max(...storeOptionGroups.map(g => g.order_index)) + 1 : 1;
        await axios.post(`${API_BASE_URL}/stores/${store.id}/option-groups/`, 
            { name: newGroupName, is_single_select: isSingleSelect, is_required: isRequired, max_select: parseInt(maxSelect), order_index: nextOrder }, 
            { headers: { Authorization: `Bearer ${token}` } }
        );
        setNewGroupName(""); setIsSingleSelect(false); setIsRequired(false); setMaxSelect(0); refreshAll();

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

    // ✨ 수정됨: 할인/타임세일 데이터도 함께 백엔드로 PATCH 하도록 항목 추가
    const handleUpdateMenuBasic = async () => {
        await axios.patch(`${API_BASE_URL}/menus/${editingMenu.id}`, {
            name: editingMenu.name,
            price: parseInt(editingMenu.price),
            description: editingMenu.description,
            is_sold_out: editingMenu.is_sold_out,
            is_hidden: editingMenu.is_hidden,
            image_url: editingMenu.image_url,
            is_price_fixed: editingMenu.is_price_fixed,
            // 👈 할인/타임세일 항목 추가됨
            is_discounted: editingMenu.is_discounted || false,
            discount_price: editingMenu.is_discounted ? parseInt(editingMenu.discount_price) || 0 : null,
            time_sale_start: editingMenu.time_sale_start || null,
            time_sale_end: editingMenu.time_sale_end || null
        }, { headers: { Authorization: `Bearer ${token}` } }); 
        toast.success("수정되었습니다."); setIsEditModalOpen(false); refreshAll();
    };

    const handleDeleteMenu = async () => {
        if(!window.confirm("정말 삭제하시겠습니까?")) return;
        await axios.delete(`${API_BASE_URL}/menus/${editingMenu.id}`, { headers: { Authorization: `Bearer ${token}` } }); 
        setIsEditModalOpen(false); refreshAll();
    };

    const handleDeleteCategory = async (categoryId) => {
        if(!window.confirm("카테고리를 삭제하면 안에 있는 '모든 메뉴'가 함께 삭제됩니다! 정말 삭제하시겠습니까?")) return;
        try {
            await axios.delete(`${API_BASE_URL}/categories/${categoryId}`, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("카테고리가 삭제되었습니다.");
            refreshAll();
        } catch(err) { toast.error("카테고리 삭제 실패"); }
    };

    // 카테고리 숨김 토글 함수
    const handleToggleCategoryHidden = async (categoryId, currentHiddenStatus) => {
        try {
            await axios.patch(`${API_BASE_URL}/categories/${categoryId}`, {
                is_hidden: !currentHiddenStatus
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success(!currentHiddenStatus ? "카테고리가 숨김 처리되었습니다." : "카테고리 숨김이 해제되었습니다.");
            refreshAll();
        } catch (err) {
            toast.error("카테고리 상태 변경에 실패했습니다.");
        }
    };

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
        }, { headers: { Authorization: `Bearer ${token}` } }); 
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
    
    const startEditGroup = (group) => {
        setEditingGroupId(group.id);
        setEditingGroupName(group.name);
        setEditingGroupSingle(group.is_single_select);
        setEditingGroupRequired(group.is_required);
        setEditingGroupMax(group.max_select || 0);
    };

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
            
            if (group && (group.is_single_select || group.is_required)) {
                const existingDefaults = group.options.filter(o => o.is_default && o.id !== optId);
                for (const oldOpt of existingDefaults) {
                    await axios.patch(`${API_BASE_URL}/options/${oldOpt.id}`, { is_default: false }, { headers: { Authorization: `Bearer ${token}` } });
                }
            }
            
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
            
            {/* 왼쪽: 메뉴 관리 */}
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
                    <div key={cat.id} className={`bg-white p-5 rounded-xl shadow-sm border ${cat.is_hidden ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
                        <h3 className="font-bold text-xl mb-4 border-b pb-2 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                {/* ✨ 숨김 상태면 글씨를 회색으로 만들고 취소선 표시 */}
                                <span className={cat.is_hidden ? "text-gray-400 line-through" : "text-gray-800"}>
                                    {cat.name}
                                </span>
                                
                                {/* ✨ [신규 추가] 숨김 체크박스 */}
                                <label className="flex items-center gap-1.5 cursor-pointer text-sm font-normal bg-gray-100 px-2 py-1 rounded-lg hover:bg-gray-200 transition">
                                    <input 
                                        type="checkbox" 
                                        checked={cat.is_hidden || false} 
                                        onChange={() => handleToggleCategoryHidden(cat.id, cat.is_hidden)} 
                                        className="w-4 h-4 text-gray-600 rounded"
                                    />
                                    <span className={cat.is_hidden ? "text-red-500 font-bold text-xs" : "text-gray-500 text-xs font-bold"}>
                                        {cat.is_hidden ? "숨김 상태" : "숨기기"}
                                    </span>
                                </label>
                            </div>
                            
                            <button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition font-bold">🗑️ 카테고리 삭제</button>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {cat.menus?.map(menu => (
                                <div key={menu.id} onClick={() => openEditModal(menu)} className="flex gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-300 hover:shadow-md cursor-pointer transition bg-white items-center">
                                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                                        {/* ✨ 추가됨: 할인 배지 표시 */}
                                        {menu.is_discounted && <div className="absolute top-0 left-0 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-lg z-10">SALE</div>}
                                        {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="flex items-center justify-center h-full text-xl">🥘</div>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-800 truncate">{menu.name}</span>
                                            {menu.is_sold_out && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded shrink-0 ml-1">품절</span>}
                                        </div>
                                        
                                        {/* ✨ 추가됨: 할인이 적용된 경우 취소선 처리 및 할인가 표시 */}
                                        <p className="text-sm mt-0.5">
                                            {menu.is_discounted ? (
                                                <>
                                                    <span className="line-through text-gray-400 text-xs mr-1">{menu.price.toLocaleString()}원</span>
                                                    <span className="text-red-600 font-bold">{menu.discount_price?.toLocaleString()}원</span>
                                                </>
                                            ) : (
                                                <span className="text-gray-500">{menu.price.toLocaleString()}원</span>
                                            )}
                                        </p>

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

            {/* 오른쪽: 옵션 라이브러리 (이전과 동일하여 내용 축약 없이 원본 그대로 유지) */}
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
                                                            <input type="number" className="w-7 border border-gray-200 rounded text-center text-xs py-1 bg-gray-50 text-gray-400 hover:bg-white focus:bg-white transition shrink-0 outline-none" defaultValue={opt.order_index} onBlur={(e)=>handleUpdateOptionOrder(opt.id, e.target.value)} />
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
                        
                        {/* ✨ 탭에 "할인/타임세일" 추가 */}
                        <div className="flex border-b shrink-0 bg-gray-50">
                            <button onClick={()=>setEditTab("basic")} className={`flex-1 py-3 font-bold transition text-sm ${editTab==="basic" ? "text-indigo-600 border-b-2 border-indigo-600 bg-white" : "text-gray-500 hover:bg-white"}`}>📝 기본 정보</button>
                            <button onClick={()=>setEditTab("discount")} className={`flex-1 py-3 font-bold transition text-sm ${editTab==="discount" ? "text-red-600 border-b-2 border-red-600 bg-white" : "text-gray-500 hover:bg-white"}`}>💸 할인/타임세일</button>
                            <button onClick={()=>setEditTab("options")} className={`flex-1 py-3 font-bold transition text-sm ${editTab==="options" ? "text-indigo-600 border-b-2 border-indigo-600 bg-white" : "text-gray-500 hover:bg-white"}`}>🔗 옵션 연결 ({editingMenu.option_groups?.length || 0})</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">
                            {editTab === "basic" ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1">메뉴 이름</label><input className="border w-full p-2 rounded" value={editingMenu.name} onChange={e=>setEditingMenu({...editingMenu, name: e.target.value})} disabled={!isHQ && editingMenu.is_price_fixed} /></div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1 flex justify-between">가격 {(!isHQ && editingMenu.is_price_fixed) && <span className="text-xs text-red-500 font-bold">본사 고정 가격</span>}</label>
                                            <input className={`border w-full p-2 rounded ${(!isHQ && editingMenu.is_price_fixed) ? "bg-gray-100 text-gray-400" : ""}`} type="number" disabled={!isHQ && editingMenu.is_price_fixed} value={editingMenu.price} onChange={e=>setEditingMenu({...editingMenu, price: e.target.value})} />
                                        </div>
                                    </div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">설명</label><textarea className="border w-full p-2 rounded resize-none" rows="3" value={editingMenu.description || ""} onChange={e=>setEditingMenu({...editingMenu, description: e.target.value})} disabled={!isHQ && editingMenu.is_price_fixed} /></div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1">이미지 URL</label><input className="border w-full p-2 rounded text-sm text-gray-500" value={editingMenu.image_url || ""} disabled placeholder="이미지 변경은 삭제 후 재등록이 필요합니다." /></div>
                                    <div className="flex gap-6 pt-2 flex-wrap">
                                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50 flex-1 min-w-[120px]"><input type="checkbox" checked={editingMenu.is_sold_out} onChange={e=>setEditingMenu({...editingMenu, is_sold_out: e.target.checked})} className="w-5 h-5 text-red-600"/> <span className="font-bold text-red-600">품절 처리</span></label>
                                        <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-gray-50 flex-1 min-w-[120px]"><input type="checkbox" checked={editingMenu.is_hidden} onChange={e=>setEditingMenu({...editingMenu, is_hidden: e.target.checked})} className="w-5 h-5 text-gray-600"/> <span className="font-bold text-gray-600">메뉴 숨김</span></label>
                                        
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
                                
                            ) : editTab === "discount" ? (
                                /* ✨ 추가됨: 할인/타임세일 설정 화면 */
                                <div className="space-y-4">
                                    <div className="bg-red-50 p-5 rounded-xl border border-red-100">
                                        <label className="flex items-center gap-3 cursor-pointer mb-5 pb-4 border-b border-red-200">
                                            <input 
                                                type="checkbox" 
                                                checked={editingMenu.is_discounted || false} 
                                                onChange={e=>setEditingMenu({...editingMenu, is_discounted: e.target.checked})} 
                                                className="w-6 h-6 text-red-600 rounded"
                                            />
                                            <span className="font-bold text-red-800 text-lg">이 메뉴에 할인 적용하기</span>
                                        </label>

                                        {editingMenu.is_discounted ? (
                                            <div className="space-y-5 animate-fadeIn">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-700 mb-1">할인된 최종 판매가 (원) <span className="text-red-500">*</span></label>
                                                    <input 
                                                        type="number" 
                                                        className="border border-red-300 w-full p-3 rounded-lg text-lg font-bold text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400" 
                                                        placeholder="예: 4000" 
                                                        value={editingMenu.discount_price || ""} 
                                                        onChange={e=>setEditingMenu({...editingMenu, discount_price: e.target.value})} 
                                                    />
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-red-100">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">타임세일 시작 시간 (선택)</label>
                                                        <input 
                                                            type="datetime-local" 
                                                            className="border w-full p-2 rounded text-sm" 
                                                            value={editingMenu.time_sale_start || ""} 
                                                            onChange={e=>setEditingMenu({...editingMenu, time_sale_start: e.target.value})} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1">타임세일 종료 시간 (선택)</label>
                                                        <input 
                                                            type="datetime-local" 
                                                            className="border w-full p-2 rounded text-sm" 
                                                            value={editingMenu.time_sale_end || ""} 
                                                            onChange={e=>setEditingMenu({...editingMenu, time_sale_end: e.target.value})} 
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-gray-500 font-bold bg-gray-100 p-2 rounded">
                                                    💡 시작/종료 시간을 비워두면 <span className="text-red-500">'상시 할인'</span>으로 노출됩니다.
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center py-4">체크박스를 선택하면 할인 설정을 입력할 수 있습니다.</p>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4 pt-4 border-t">
                                        <button onClick={handleUpdateMenuBasic} className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700">할인 설정 저장</button>
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