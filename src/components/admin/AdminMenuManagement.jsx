import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config"; 
import toast from "react-hot-toast";

export default function AdminMenuManagement({ store, token, fetchStore, user }) {
    const isHQ = ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN"].includes(user?.role); 
    const [mainTab, setMainTab] = useState("menu"); 

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

    // ✨ 필수/1택 그룹의 첫 항목은 자동 기본값 설정
    const handleCreateOption = async (groupId) => {
        if (!newOptionName) return;
        const group = storeOptionGroups.find(g => g.id === groupId);
        const nextOrder = group && group.options.length > 0 ? Math.max(...group.options.map(o => o.order_index)) + 1 : 1;
        
        const isFirstOption = group && (!group.options || group.options.length === 0);
        const shouldBeDefault = (group.is_single_select || group.is_required) && isFirstOption;

        try {
            const res = await axios.post(`${API_BASE_URL}/option-groups/${groupId}/options/`, 
                { 
                    name: newOptionName, 
                    price: parseInt(newOptionPrice) || 0, 
                    order_index: nextOrder,
                    is_default: shouldBeDefault 
                }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (shouldBeDefault && res.data && !res.data.is_default) {
                await axios.patch(`${API_BASE_URL}/options/${res.data.id}`, { is_default: true }, { headers: { Authorization: `Bearer ${token}` } });
            }

            setNewOptionName(""); 
            setNewOptionPrice(""); 
            refreshAll();
        } catch (err) {
            toast.error("항목 추가에 실패했습니다.");
        }
    };

    const handleImageUpload = async (e, setFunc) => {
        const formData = new FormData();
        formData.append("file", e.target.files[0]);
        try {
            const res = await axios.post(`${API_BASE_URL}/upload/`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFunc(res.data.url);
        } catch {
            toast.error("이미지 업로드에 실패했습니다.");
        }
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
            is_price_fixed: editingMenu.is_price_fixed,
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

    const handleToggleCategoryHidden = async (categoryId, currentHiddenStatus) => {
        try {
            await axios.patch(`${API_BASE_URL}/categories/${categoryId}`, {
                is_hidden: !currentHiddenStatus
            }, { headers: { Authorization: `Bearer ${token}` } });
            
            toast.success(!currentHiddenStatus ? "카테고리가 숨김 처리되었습니다." : "카테고리 숨김이 해제되었습니다.");
            refreshAll();
        } catch (err) { toast.error("카테고리 상태 변경에 실패했습니다."); }
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

    const handleReorderOption = async (groupId, index, direction) => {
        const groupIndex = storeOptionGroups.findIndex(g => g.id === groupId);
        if (groupIndex === -1) return;
        
        const groups = [...storeOptionGroups];
        const options = [...groups[groupIndex].options];
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= options.length) return;

        const item1 = options[index];
        const item2 = options[targetIndex];

        options[index] = item2;
        options[targetIndex] = item1;
        groups[groupIndex] = { ...groups[groupIndex], options };
        setStoreOptionGroups(groups);

        try {
            await axios.patch(`${API_BASE_URL}/options/${item1.id}`, { order_index: targetIndex + 1 }, { headers: { Authorization: `Bearer ${token}` } });
            await axios.patch(`${API_BASE_URL}/options/${item2.id}`, { order_index: index + 1 }, { headers: { Authorization: `Bearer ${token}` } });
            refreshAll();
        } catch (err) { toast.error("순서 변경 실패"); refreshAll(); }
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
        } catch (err) { toast.error("기본 설정 변경에 실패했습니다."); }
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
        <div className="flex flex-col h-[calc(100vh-110px)]">
            
            <div className="flex border-b border-gray-200 shrink-0 bg-white rounded-xl shadow-sm overflow-hidden mb-4">
                <button 
                    onClick={() => setMainTab("menu")} 
                    className={`flex-1 py-4 font-bold text-lg transition ${mainTab === "menu" ? "text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/20" : "text-gray-500 hover:bg-gray-50"}`}
                >
                    🍔 메뉴 등록 및 카테고리 관리
                </button>
                <button 
                    onClick={() => setMainTab("option")} 
                    className={`flex-1 py-4 font-bold text-lg transition ${mainTab === "option" ? "text-indigo-600 border-b-4 border-indigo-600 bg-indigo-50/20" : "text-gray-500 hover:bg-gray-50"}`}
                >
                    📚 옵션 관리 라이브러리
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">

                {/* 1️⃣ [왼쪽 탭] 메뉴 관리 영역 */}
                {mainTab === "menu" && (
                    <div className="h-full overflow-y-auto space-y-6 pr-2 pb-20 animate-fadeIn">
                        
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                            <h3 className="font-bold mb-4 text-lg">✨ 메뉴 등록</h3>
                            <div className="flex flex-col md:flex-row gap-2 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <select className="border p-2 rounded flex-1 min-w-[200px] font-bold text-gray-700" value={selectedCategoryId} onChange={e=>setSelectedCategoryId(e.target.value)}>
                                    <option value="">카테고리 선택</option>
                                    {store.categories?.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <div className="flex gap-2 w-full md:w-auto">
                                    <input className="border p-2 rounded flex-1 md:w-48" placeholder="새 카테고리명" value={categoryName} onChange={e=>setCategoryName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateCategory()} />
                                    <button onClick={handleCreateCategory} className="bg-gray-800 text-white px-4 py-2 rounded font-bold whitespace-nowrap shadow-sm hover:bg-black">카테고리 추가</button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                                <input className="col-span-1 md:col-span-3 border p-3 rounded-lg font-bold" placeholder="메뉴 이름 (예: 치즈버거 세트)" value={menuName} onChange={e=>setMenuName(e.target.value)}/>
                                <input className="border p-3 rounded-lg font-bold" placeholder="가격 (숫자만)" type="number" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)}/>
                            </div>
                            <input className="border p-3 rounded-lg w-full mb-3" placeholder="메뉴 상세 설명 (손님에게 보여질 내용)" value={menuDesc} onChange={e=>setMenuDesc(e.target.value)}/>
                            
                            {isHQ && (
                                <label className="flex items-center gap-2 mb-4 bg-red-50 p-3 rounded-lg border border-red-100 cursor-pointer">
                                    <input type="checkbox" checked={isPriceFixed} onChange={e=>setIsPriceFixed(e.target.checked)} className="w-5 h-5 accent-red-600"/>
                                    <span className="text-sm font-bold text-red-700">🔒 이 메뉴의 가격을 전 지점에서 강제 고정합니다 (점주 수정 불가)</span>
                                </label>
                            )}
                            
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-2">
                                <div className="flex items-center gap-3">
                                    <label className="bg-gray-100 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold cursor-pointer hover:bg-gray-200 transition text-sm">
                                        📸 메뉴 사진 업로드
                                        <input type="file" onChange={e=>handleImageUpload(e, setMenuImage)} className="hidden" />
                                    </label>
                                    {menuImage && <span className="text-sm text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full border border-green-200">✅ 첨부 완료</span>}
                                </div>
                                <button onClick={handleCreateMenu} className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-3 rounded-lg font-extrabold hover:bg-indigo-700 shadow-md transition text-lg">메뉴 등록하기</button>
                            </div>
                        </div>

                        {store.categories?.map(cat => (
                            <div key={cat.id} className={`bg-white p-5 rounded-xl shadow-sm border transition ${cat.is_hidden ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}>
                                <h3 className="font-bold text-xl mb-4 border-b pb-3 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <span className={cat.is_hidden ? "text-gray-400 line-through" : "text-gray-800"}>
                                            {cat.name}
                                        </span>
                                        <label className="flex items-center gap-1.5 cursor-pointer text-sm font-normal bg-gray-100 px-2 py-1 rounded-lg hover:bg-gray-200 transition shadow-sm border border-gray-200">
                                            <input type="checkbox" checked={cat.is_hidden || false} onChange={() => handleToggleCategoryHidden(cat.id, cat.is_hidden)} className="w-4 h-4 text-gray-600 rounded cursor-pointer"/>
                                            <span className={cat.is_hidden ? "text-red-500 font-bold text-xs" : "text-gray-600 text-xs font-bold"}>
                                                {cat.is_hidden ? "숨김 상태" : "메뉴판에서 숨기기"}
                                            </span>
                                        </label>
                                    </div>
                                    <button onClick={() => handleDeleteCategory(cat.id)} className="text-xs text-red-500 hover:text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-2 rounded-lg transition font-bold shadow-sm">🗑️ 카테고리 삭제</button>
                                </h3>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                    {cat.menus?.map(menu => (
                                        <div key={menu.id} onClick={() => openEditModal(menu)} className="flex gap-4 p-4 rounded-xl border-2 border-gray-100 hover:border-indigo-400 hover:shadow-lg cursor-pointer transition bg-white items-center relative group">
                                            
                                            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative border border-gray-200 shadow-inner">
                                                {menu.is_discounted && <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-br-lg z-10 shadow-sm">SALE</div>}
                                                {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/> : <div className="flex items-center justify-center h-full text-2xl opacity-30">🍽️</div>}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-extrabold text-gray-900 text-lg truncate group-hover:text-indigo-700 transition">{menu.name}</span>
                                                    {menu.is_sold_out && <span className="text-xs font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded shadow-sm shrink-0 ml-2">품절</span>}
                                                </div>
                                                
                                                <p className="text-base mt-0.5 font-bold">
                                                    {menu.is_discounted ? (
                                                        <span className="flex items-center gap-1.5">
                                                            <span className="line-through text-gray-400 text-sm">{menu.price.toLocaleString()}원</span>
                                                            <span className="text-red-600 text-lg">{menu.discount_price?.toLocaleString()}원</span>
                                                        </span>
                                                    ) : (
                                                        <span className="text-indigo-600">{menu.price.toLocaleString()}원</span>
                                                    )}
                                                </p>

                                                <div className="flex gap-1.5 mt-2 overflow-x-auto scrollbar-hide pb-1">
                                                    {menu.option_groups?.sort((a,b)=>a.order_index-b.order_index).map(g => <span key={g.id} className="text-xs font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-md border border-indigo-100 whitespace-nowrap shadow-sm">{g.name}</span>)}
                                                    {(!menu.option_groups || menu.option_groups.length === 0) && <span className="text-xs font-bold text-gray-300">연결된 옵션 없음</span>}
                                                </div>
                                            </div>
                                            <div className="absolute top-4 right-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">✏️</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2️⃣ [오른쪽 탭] 옵션 관리 라이브러리 */}
                {mainTab === "option" && (
                    <div className="bg-white p-5 sm:p-8 rounded-xl shadow-md border border-gray-200 flex flex-col h-full overflow-hidden max-w-5xl mx-auto w-full animate-fadeIn">
                        
                        <div className="flex items-center gap-2 mb-6 shrink-0">
                            <span className="text-2xl">📚</span>
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">옵션 그룹 마스터 라이브러리</h2>
                                <p className="text-xs text-gray-500 mt-1">이곳에서 만들어진 옵션은 '메뉴 수정 팝업'에서 원하는 메뉴에 언제든 연결할 수 있습니다.</p>
                            </div>
                        </div>
                        
                        <div className="mb-6 bg-gray-50 p-5 rounded-2xl shrink-0 border border-gray-200 shadow-inner">
                            <input className="border border-gray-300 p-3 rounded-xl w-full text-base mb-4 font-bold focus:border-indigo-500 focus:bg-white outline-none transition" placeholder="새로운 옵션 그룹명 (예: 맵기 조절, 토핑 추가)" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCreateOptionGroup()} />
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex flex-wrap gap-4 bg-white p-2 rounded-lg border border-gray-200 w-full sm:w-auto">
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-bold text-gray-700 hover:text-indigo-600 transition"><input type="checkbox" checked={isSingleSelect} onChange={e=>setIsSingleSelect(e.target.checked)} className="w-4 h-4 accent-indigo-600"/> 1개만 선택 (라디오버튼)</label>
                                    <label className="flex items-center gap-2 text-sm cursor-pointer font-bold text-gray-700 hover:text-indigo-600 transition border-l pl-4"><input type="checkbox" checked={isRequired} onChange={e=>setIsRequired(e.target.checked)} className="w-4 h-4 accent-indigo-600"/> 필수 선택</label>
                                </div>
                                
                                {!isSingleSelect && (
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white p-2 rounded-lg border border-gray-200">
                                        <span>최대 선택 개수:</span>
                                        <input type="number" className="border border-gray-300 rounded-md w-16 p-1 text-center font-black focus:border-indigo-500 outline-none" value={maxSelect} onChange={e=>setMaxSelect(e.target.value)} min="0" placeholder="무제한"/>
                                    </div>
                                )}
                                <button onClick={handleCreateOptionGroup} className="w-full sm:w-auto bg-slate-800 text-white px-8 py-3 rounded-xl text-sm font-black hover:bg-black transition shadow-md whitespace-nowrap">새 그룹 생성하기</button>
                            </div>
                        </div>
                        
                        <div className="space-y-4 overflow-y-auto flex-1 pr-2 pb-10" ref={optionListRef}>
                            {storeOptionGroups.map((group) => (
                                <div key={group.id} className={`p-4 rounded-2xl border-2 transition duration-200 shadow-sm ${activeOptionGroupId === group.id ? 'border-indigo-400 bg-indigo-50/20' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                    
                                    <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-3">
                                        <div className="flex-1 min-w-0 pr-4">
                                            {editingGroupId === group.id ? (
                                                <div className="flex flex-col sm:flex-row gap-3 w-full">
                                                    <input className="border border-indigo-300 p-2 rounded-lg text-sm font-bold flex-1 focus:border-indigo-500 outline-none" value={editingGroupName} onChange={e=>setEditingGroupName(e.target.value)} />
                                                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-200 shrink-0">
                                                        <label className="text-xs flex items-center gap-1 font-bold cursor-pointer"><input type="checkbox" checked={editingGroupSingle} onChange={e=>setEditingGroupSingle(e.target.checked)} className="accent-indigo-600"/>1택</label>
                                                        <label className="text-xs flex items-center gap-1 font-bold cursor-pointer border-l pl-2"><input type="checkbox" checked={editingGroupRequired} onChange={e=>setEditingGroupRequired(e.target.checked)} className="accent-indigo-600"/>필수</label>
                                                        {!editingGroupSingle && <input type="number" className="w-12 border border-gray-300 rounded p-1 text-xs text-center font-bold" value={editingGroupMax} onChange={e=>setEditingGroupMax(e.target.value)} placeholder="Max"/>}
                                                    </div>
                                                    <div className="flex gap-1 shrink-0">
                                                        <button onClick={()=>saveGroup(group.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm">저장</button>
                                                        <button onClick={()=>setEditingGroupId(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg text-xs font-bold">취소</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 flex-wrap pt-1">
                                                    <span className="font-extrabold text-gray-900 text-lg">{group.name}</span>
                                                    {group.is_required && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md font-black border border-red-200">필수</span>}
                                                    {group.is_single_select && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md font-black border border-yellow-200">1택(라디오)</span>}
                                                    {!group.is_single_select && group.max_select > 0 && <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-black border border-purple-200">최대 {group.max_select}개</span>}
                                                    <button onClick={()=>startEditGroup(group)} className="text-xs text-gray-400 hover:text-indigo-600 ml-2 font-bold flex items-center gap-1 bg-gray-50 px-2 py-1 rounded hover:bg-indigo-50 transition">✏️ 수정</button>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button onClick={() => setActiveOptionGroupId(activeOptionGroupId === group.id ? null : group.id)} className={`text-xs border px-4 py-2 rounded-lg font-bold transition shadow-sm ${activeOptionGroupId === group.id ? "bg-gray-200 text-gray-800 border-gray-300" : "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"}`}>
                                                {activeOptionGroupId === group.id ? "닫기" : "세부 항목 관리 👇"}
                                            </button>
                                            <button onClick={() => handleDeleteOptionGroup(group.id)} className="text-xs text-red-500 hover:text-red-700 bg-red-50 border border-red-100 hover:bg-red-100 px-3 py-2 rounded-lg font-bold shadow-sm">
                                                삭제
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-2 pl-2 border-l-2 border-gray-100">
                                        <ul className="space-y-1.5">
                                            {group.options.map((opt, optIdx) => (
                                                <li key={opt.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-gray-50/50 hover:bg-gray-100 p-2.5 rounded-xl border border-transparent hover:border-gray-200 transition group/opt">
                                                    
                                                    {editingOptionId === opt.id ? (
                                                        <div className="flex flex-col sm:flex-row gap-2 w-full bg-white p-2 rounded-lg shadow-sm border border-indigo-200">
                                                            <input className="border border-gray-300 p-2 rounded-lg text-sm font-bold flex-1 focus:border-indigo-500 outline-none" value={editingOptionName} onChange={e=>setEditingOptionName(e.target.value)} placeholder="항목명 (예: 아주 맵게)" />
                                                            <div className="flex gap-2">
                                                                <input className="border border-gray-300 p-2 rounded-lg text-sm font-black text-indigo-600 text-right w-28 focus:border-indigo-500 outline-none" type="number" value={editingOptionPrice} onChange={e=>setEditingOptionPrice(e.target.value)} placeholder="가격(원)" />
                                                                <button onClick={()=>saveOption(opt.id)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-bold text-xs shrink-0 shadow-sm">저장</button>
                                                                <button onClick={()=>setEditingOptionId(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-bold text-xs shrink-0">취소</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-between w-full gap-3">
                                                            
                                                            <div className="flex items-center gap-2 min-w-0 flex-1">
                                                                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-md border border-gray-200 shrink-0">
                                                                    <button onClick={(e) => {e.stopPropagation(); handleReorderOption(group.id, optIdx, -1);}} disabled={optIdx === 0} className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 shadow-sm text-[10px]">⬆️</button>
                                                                    <button onClick={(e) => {e.stopPropagation(); handleReorderOption(group.id, optIdx, 1);}} disabled={optIdx === group.options.length - 1} className="w-6 h-6 flex items-center justify-center rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-30 shadow-sm text-[10px]">⬇️</button>
                                                                </div>
                                                                
                                                                <span className="text-[15px] font-extrabold text-gray-800 truncate ml-1">{opt.name}</span>
                                                                
                                                                {(group.is_single_select || group.is_required) && (
                                                                    <div className="ml-2 shrink-0">
                                                                        {opt.is_default 
                                                                        ? <span className="bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-sm">기본 선택됨</span> 
                                                                        : <button onClick={()=>handleUpdateOptionDefault(group.id, opt.id)} className="border border-gray-300 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300 text-[10px] font-bold px-2 py-1 rounded-md transition bg-white">기본으로 지정</button>
                                                                        }
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-3 shrink-0">
                                                                <span className="text-sm font-black text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm">
                                                                    +{opt.price.toLocaleString()}원
                                                                </span>
                                                                <div className="flex gap-1 opacity-0 group-hover/opt:opacity-100 transition-opacity duration-200 bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                                                                    <button onClick={()=>startEditOption(opt)} className="w-6 h-6 flex items-center justify-center hover:bg-gray-100 rounded text-xs" title="수정">✏️</button>
                                                                    <button onClick={()=>handleDeleteOption(opt.id)} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 text-red-500 rounded text-xs" title="삭제">🗑️</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </li>
                                            ))}
                                            {group.options.length === 0 && <li className="text-sm font-bold text-gray-400 text-center py-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">아직 등록된 세부 항목이 없습니다.</li>}
                                        </ul>

                                        {activeOptionGroupId === group.id && (
                                            <div className="flex flex-col sm:flex-row gap-2 mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl animate-fadeIn shadow-inner">
                                                <input className="border border-gray-300 p-2.5 rounded-lg text-sm flex-1 font-bold focus:border-indigo-500 outline-none bg-white shadow-sm" placeholder={`'${group.name}'의 새로운 세부 항목명`} value={newOptionName} onChange={e=>setNewOptionName(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateOption(group.id)} autoFocus />
                                                <div className="flex gap-2">
                                                    <input className="border border-gray-300 p-2.5 rounded-lg text-sm w-full sm:w-32 text-right font-black focus:border-indigo-500 outline-none bg-white shadow-sm" type="number" placeholder="추가 금액" value={newOptionPrice} onChange={e=>setNewOptionPrice(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleCreateOption(group.id)} />
                                                    <button onClick={()=>handleCreateOption(group.id)} className="bg-indigo-600 text-white px-5 rounded-lg font-bold text-sm hover:bg-indigo-700 shadow-md shrink-0">항목 추가</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {storeOptionGroups.length === 0 && (
                                <div className="text-center py-20 text-gray-400">
                                    <span className="text-5xl block mb-4 opacity-50">🗂️</span>
                                    <p className="font-bold text-lg">옵션 그룹이 없습니다.</p>
                                    <p className="text-sm mt-1">상단에서 첫 번째 옵션 그룹을 생성해보세요.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>

            {isEditModalOpen && editingMenu && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slideUp">
                        <div className="p-5 border-b bg-slate-800 text-white flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold flex items-center gap-2"><span>🛠️</span> '{editingMenu.name}' 수정</h2>
                            <button onClick={()=>setIsEditModalOpen(false)} className="text-gray-400 hover:text-white text-3xl font-light leading-none">&times;</button>
                        </div>
                        
                        <div className="flex border-b shrink-0 bg-gray-50 overflow-x-auto scrollbar-hide">
                            <button onClick={()=>setEditTab("basic")} className={`flex-1 py-4 font-bold transition text-sm px-4 whitespace-nowrap ${editTab==="basic" ? "text-indigo-600 border-b-2 border-indigo-600 bg-white" : "text-gray-500 hover:bg-white"}`}>📝 기본 정보</button>
                            <button onClick={()=>setEditTab("discount")} className={`flex-1 py-4 font-bold transition text-sm px-4 whitespace-nowrap ${editTab==="discount" ? "text-red-600 border-b-2 border-red-600 bg-white" : "text-gray-500 hover:bg-white"}`}>💸 할인/타임세일</button>
                            <button onClick={()=>setEditTab("options")} className={`flex-1 py-4 font-bold transition text-sm px-4 whitespace-nowrap ${editTab==="options" ? "text-indigo-600 border-b-2 border-indigo-600 bg-white" : "text-gray-500 hover:bg-white"}`}>🔗 옵션 연결 ({editingMenu.option_groups?.length || 0})</button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 bg-gray-50/30">
                            {editTab === "basic" ? (
                                <div className="space-y-5">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div><label className="block text-sm font-bold text-gray-700 mb-1.5">메뉴 이름</label><input className="border border-gray-300 w-full p-2.5 rounded-lg focus:border-indigo-500 outline-none font-bold" value={editingMenu.name} onChange={e=>setEditingMenu({...editingMenu, name: e.target.value})} disabled={!isHQ && editingMenu.is_price_fixed} /></div>
                                        <div>
                                            <label className="block text-sm font-bold text-gray-700 mb-1.5 flex justify-between">가격 {(!isHQ && editingMenu.is_price_fixed) && <span className="text-xs text-red-500 font-bold">본사 고정 가격</span>}</label>
                                            <input className={`border border-gray-300 w-full p-2.5 rounded-lg font-bold focus:border-indigo-500 outline-none ${(!isHQ && editingMenu.is_price_fixed) ? "bg-gray-100 text-gray-400" : ""}`} type="number" disabled={!isHQ && editingMenu.is_price_fixed} value={editingMenu.price} onChange={e=>setEditingMenu({...editingMenu, price: e.target.value})} />
                                        </div>
                                    </div>
                                    <div><label className="block text-sm font-bold text-gray-700 mb-1.5">메뉴 설명 (손님 화면 노출)</label><textarea className="border border-gray-300 w-full p-3 rounded-lg resize-none focus:border-indigo-500 outline-none text-sm" rows="3" value={editingMenu.description || ""} onChange={e=>setEditingMenu({...editingMenu, description: e.target.value})} disabled={!isHQ && editingMenu.is_price_fixed} /></div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-1.5 flex justify-between">
                                            메뉴 이미지 {(!isHQ && editingMenu.is_price_fixed) && <span className="text-xs text-red-500 font-bold">본사 고정</span>}
                                        </label>
                                        <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-gray-200">
                                            <div className="w-16 h-16 bg-gray-100 rounded-lg border border-gray-200 shrink-0 overflow-hidden shadow-inner">
                                                {editingMenu.image_url ? (
                                                    <img src={editingMenu.image_url} alt="menu" className="w-full h-full object-cover"/>
                                                ) : (
                                                    <span className="flex items-center justify-center h-full text-xs text-gray-400 font-bold">없음</span>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <input 
                                                    type="file" 
                                                    disabled={!isHQ && editingMenu.is_price_fixed}
                                                    onChange={(e) => handleImageUpload(e, (url) => setEditingMenu({...editingMenu, image_url: url}))} 
                                                    className="text-sm w-full text-gray-600 font-bold cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition disabled:opacity-50"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-gray-50 flex-1 bg-white shadow-sm transition">
                                            <input type="checkbox" checked={editingMenu.is_sold_out} onChange={e=>setEditingMenu({...editingMenu, is_sold_out: e.target.checked})} className="w-5 h-5 accent-red-600"/> 
                                            <span className="font-bold text-red-600">품절 처리</span>
                                        </label>
                                        <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl hover:bg-gray-50 flex-1 bg-white shadow-sm transition">
                                            <input type="checkbox" checked={editingMenu.is_hidden} onChange={e=>setEditingMenu({...editingMenu, is_hidden: e.target.checked})} className="w-5 h-5 accent-gray-600"/> 
                                            <span className="font-bold text-gray-600">메뉴판에서 숨김</span>
                                        </label>
                                        
                                        {isHQ && (
                                            <label className="flex items-center gap-3 cursor-pointer p-3 border rounded-xl border-red-200 bg-red-50 hover:bg-red-100 flex-1 shadow-sm transition">
                                                <input type="checkbox" checked={editingMenu.is_price_fixed} onChange={e=>setEditingMenu({...editingMenu, is_price_fixed: e.target.checked})} className="w-5 h-5 accent-red-600"/> 
                                                <span className="font-bold text-red-800">본사 가격 고정</span>
                                            </label>
                                        )}
                                    </div>
                                    
                                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                                        <button onClick={handleUpdateMenuBasic} className="flex-1 bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg text-lg">수정 내용 저장</button>
                                        <button onClick={handleDeleteMenu} className="bg-white border-2 border-red-100 text-red-500 px-6 py-4 rounded-xl font-bold hover:bg-red-50 transition shadow-sm whitespace-nowrap">메뉴 삭제</button>
                                    </div>
                                </div>
                                
                            ) : editTab === "discount" ? (
                                <div className="space-y-5">
                                    <div className="bg-white p-6 rounded-2xl border border-red-100 shadow-sm">
                                        <label className="flex items-center gap-3 cursor-pointer mb-6 pb-5 border-b border-gray-100">
                                            <input 
                                                type="checkbox" 
                                                checked={editingMenu.is_discounted || false} 
                                                onChange={e=>setEditingMenu({...editingMenu, is_discounted: e.target.checked})} 
                                                className="w-6 h-6 accent-red-600 rounded cursor-pointer"
                                            />
                                            <span className="font-extrabold text-red-800 text-xl">이 메뉴에 할인 이벤트 적용하기</span>
                                        </label>

                                        {editingMenu.is_discounted ? (
                                            <div className="space-y-6 animate-fadeIn">
                                                <div className="bg-red-50 p-5 rounded-xl border border-red-200">
                                                    <label className="block text-sm font-bold text-red-900 mb-2">할인된 최종 판매가 (원) <span className="text-red-500">*</span></label>
                                                    <input 
                                                        type="number" 
                                                        className="w-full p-4 rounded-xl text-2xl font-black text-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 border border-red-200 shadow-inner" 
                                                        placeholder="예: 4000" 
                                                        value={editingMenu.discount_price || ""} 
                                                        onChange={e=>setEditingMenu({...editingMenu, discount_price: e.target.value})} 
                                                    />
                                                </div>
                                                
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">타임세일 시작 시간 (선택)</label>
                                                        <input 
                                                            type="datetime-local" 
                                                            className="border border-gray-300 w-full p-3 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none" 
                                                            value={editingMenu.time_sale_start || ""} 
                                                            onChange={e=>setEditingMenu({...editingMenu, time_sale_start: e.target.value})} 
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-sm font-bold text-gray-700 mb-1.5">타임세일 종료 시간 (선택)</label>
                                                        <input 
                                                            type="datetime-local" 
                                                            className="border border-gray-300 w-full p-3 rounded-lg text-sm font-bold focus:border-indigo-500 outline-none" 
                                                            value={editingMenu.time_sale_end || ""} 
                                                            onChange={e=>setEditingMenu({...editingMenu, time_sale_end: e.target.value})} 
                                                        />
                                                    </div>
                                                </div>
                                                <p className="text-sm text-gray-600 font-bold bg-gray-100 p-3 rounded-lg border border-gray-200 flex items-center gap-2">
                                                    <span className="text-lg">💡</span> 시작/종료 시간을 비워두면 상시 할인으로 적용됩니다.
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                                <span className="text-4xl block mb-2 opacity-50">🏷️</span>
                                                <p className="text-gray-500 font-bold">상단 체크박스를 선택하면 할인 설정을 시작할 수 있습니다.</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2 mt-4 pt-4">
                                        <button onClick={handleUpdateMenuBasic} className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-black transition shadow-lg text-lg">할인 설정 저장하기</button>
                                    </div>
                                </div>

                            ) : (
                                <div className="space-y-8">
                                    <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 shadow-sm">
                                        <h4 className="font-extrabold text-indigo-900 mb-4 flex items-center gap-2 text-lg"><span>🔗</span> 이 메뉴에 적용된 옵션</h4>
                                        <div className="space-y-2">
                                            {editingMenu.option_groups?.length > 0 ? (
                                                editingMenu.option_groups.map((group, idx) => (
                                                    <div key={group.id} className="flex justify-between items-center bg-white p-3.5 rounded-xl shadow-sm border border-indigo-100">
                                                        <span className="font-bold text-base text-gray-800"><span className="text-indigo-400 mr-2">{idx+1}</span> {group.name}</span>
                                                        <div className="flex gap-1.5 bg-gray-50 p-1 rounded-lg border border-gray-200">
                                                            <button onClick={(e) => {e.stopPropagation(); handleReorderLinkedGroup(idx, -1);}} disabled={idx === 0} className="w-8 h-8 flex items-center justify-center rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 font-bold transition disabled:opacity-30 shadow-sm">▲</button>
                                                            <button onClick={(e) => {e.stopPropagation(); handleReorderLinkedGroup(idx, 1);}} disabled={idx === editingMenu.option_groups.length - 1} className="w-8 h-8 flex items-center justify-center rounded bg-white hover:bg-indigo-50 hover:text-indigo-600 font-bold transition disabled:opacity-30 shadow-sm">▼</button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-center py-6 bg-white rounded-xl border border-dashed border-indigo-200">
                                                    <p className="text-sm font-bold text-indigo-400">아직 연결된 옵션이 없습니다.<br/>아래 마스터 라이브러리에서 체크하여 추가해주세요.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-gray-800 mb-4 text-base flex items-center gap-2"><span>📚</span> 옵션 마스터 라이브러리 <span className="text-xs font-normal text-gray-500 ml-auto">클릭하여 체크</span></h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {storeOptionGroups.map(group => {
                                                const isLinked = editingMenu.option_groups?.some(g => g.id === group.id);
                                                return (
                                                    <div key={group.id} onClick={() => toggleOptionGroupLink(group.id, isLinked)} className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between shadow-sm ${isLinked ? "border-indigo-500 bg-white" : "border-gray-200 hover:border-gray-400 bg-gray-50 hover:bg-white"}`}>
                                                        <div className="min-w-0 flex-1 pr-2">
                                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                                <span className={`font-extrabold text-base truncate ${isLinked ? "text-indigo-800" : "text-gray-700"}`}>{group.name}</span>
                                                                {group.is_required && <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-black shrink-0">필수</span>}
                                                            </div>
                                                            <p className="text-xs text-gray-500 truncate font-medium">
                                                                {group.options && group.options.length > 0 ? group.options.map(o => o.name).join(", ") : "항목 없음"}
                                                            </p>
                                                        </div>
                                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition shadow-inner ${isLinked ? "bg-indigo-600 border-indigo-600" : "border-gray-300 bg-white"}`}>
                                                            {isLinked && <span className="text-white text-sm font-bold">✓</span>}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {storeOptionGroups.length === 0 && (
                                                <div className="col-span-full text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                                                    <p className="text-gray-500 font-bold">생성된 옵션이 없습니다.<br/>메인 화면의 '옵션 라이브러리 탭'에서 먼저 옵션을 만들어주세요.</p>
                                                </div>
                                            )}
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