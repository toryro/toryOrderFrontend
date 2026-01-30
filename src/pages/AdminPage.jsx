import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function AdminPage() {
  const { storeId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [storeOptionGroups, setStoreOptionGroups] = useState([]); 
  
  // --- Create States ---
  const [categoryName, setCategoryName] = useState("");
  const [categoryDesc, setCategoryDesc] = useState(""); // [신규] 카테고리 설명 상태
  
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [menuDesc, setMenuDesc] = useState(""); 
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [menuImage, setMenuImage] = useState(null);
  const [tableName, setTableName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isSingleSelect, setIsSingleSelect] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");

  const [selectedMenu, setSelectedMenu] = useState(null); 
  const [activeOptionGroupId, setActiveOptionGroupId] = useState(null); 

  // --- Edit States ---
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [editingCategoryDesc, setEditingCategoryDesc] = useState(""); // [신규]
  const [editingCategoryHidden, setEditingCategoryHidden] = useState(false);

  // [신규] 테이블 수정 상태
  const [editingTableId, setEditingTableId] = useState(null);
  const [editingTableName, setEditingTableName] = useState("");

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

  const fetchStore = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/stores/${storeId}`, { headers: { Authorization: `Bearer ${token}` } });
      setStore(res.data);
      const groupRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/option-groups/`);
      setStoreOptionGroups(groupRes.data);
      setLoading(false);
    } catch (err) { alert("데이터 로딩 실패"); setLoading(false); }
  };

  useEffect(() => { if (!token) navigate("/"); fetchStore(); }, [storeId]);

  useEffect(() => {
    if (activeOptionGroupId) {
      setTimeout(() => {
        const element = document.getElementById(`option-form-${activeOptionGroupId}`);
        if (element) element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 100);
    }
  }, [activeOptionGroupId]);

  // === Handlers: Create ===
  const handleCreateCategory = async () => {
    if (!categoryName) return;
    const nextOrder = store.categories.length > 0 ? Math.max(...store.categories.map(c => c.order_index)) + 1 : 1;
    await axios.post(`${API_BASE_URL}/stores/${storeId}/categories/`, 
        {
            name: categoryName, 
            description: categoryDesc, // [신규] 설명 전송
            order_index: nextOrder 
        }, 
        {headers:{Authorization:`Bearer ${token}`}}
    ); 
    setCategoryName(""); setCategoryDesc(""); fetchStore(); 
  };
  
  const handleCreateMenu = async () => {
    if (!selectedCategoryId) return alert("카테고리를 선택해주세요!");
    if (!menuName || !menuPrice) return alert("이름과 가격을 입력해주세요.");
    
    const category = store.categories.find(c => c.id == selectedCategoryId);
    const nextOrder = category && category.menus.length > 0 ? Math.max(...category.menus.map(m => m.order_index)) + 1 : 1;

    await axios.post(`${API_BASE_URL}/categories/${selectedCategoryId}/menus/`, 
        { name: menuName, price: parseInt(menuPrice), description: menuDesc, image_url: menuImage, order_index: nextOrder }, 
        {headers:{Authorization:`Bearer ${token}`}}
    ); 
    setMenuName(""); setMenuPrice(""); setMenuDesc(""); setMenuImage(null); fetchStore(); 
  };

  const handleCreateOptionGroup = async () => {
    if (!newGroupName) return;
    const nextOrder = storeOptionGroups.length > 0 ? Math.max(...storeOptionGroups.map(g => g.order_index)) + 1 : 1;
    await axios.post(`${API_BASE_URL}/stores/${storeId}/option-groups/`, { name: newGroupName, is_single_select: isSingleSelect, order_index: nextOrder }, { headers: { Authorization: `Bearer ${token}` } });
    setNewGroupName(""); setIsSingleSelect(false); fetchStore();
  };
  const handleCreateOption = async (groupId) => {
    if (!newOptionName) return;
    const group = storeOptionGroups.find(g => g.id === groupId);
    const nextOrder = group && group.options.length > 0 ? Math.max(...group.options.map(o => o.order_index)) + 1 : 1;
    await axios.post(`${API_BASE_URL}/option-groups/${groupId}/options/`, { name: newOptionName, price: parseInt(newOptionPrice)||0, order_index: nextOrder }, { headers: { Authorization: `Bearer ${token}` } });
    setNewOptionName(""); setNewOptionPrice(""); setActiveOptionGroupId(null); fetchStore();
  };
  const handleImageUpload = async (e, setFunc) => {
    const formData = new FormData(); formData.append("file", e.target.files[0]);
    const res = await axios.post(`${API_BASE_URL}/upload/`, formData); setFunc(res.data.url);
  };
  const handleCreateTable = async () => {
    if(!tableName) return;
    await axios.post(`${API_BASE_URL}/stores/${storeId}/tables/`, {name:tableName}, {headers:{Authorization:`Bearer ${token}`}}); setTableName(""); fetchStore();
  };

  // === Handlers: Table Edit ===
  const startEditTable = (t) => { setEditingTableId(t.id); setEditingTableName(t.name); };
  const saveTable = async () => {
      await axios.patch(`${API_BASE_URL}/tables/${editingTableId}`, { name: editingTableName });
      setEditingTableId(null); fetchStore();
  };
  const deleteTable = async (tableId) => {
      if(!window.confirm("테이블을 삭제하시겠습니까?")) return;
      await axios.delete(`${API_BASE_URL}/tables/${tableId}`);
      fetchStore();
  };
  const cancelEditTable = () => { setEditingTableId(null); };

  // === Handlers: Update ===
  const handleUpdateCategoryOrder = async (catId, newOrder) => {
      await axios.patch(`${API_BASE_URL}/categories/${catId}`, { order_index: parseInt(newOrder) });
      fetchStore();
  };
  const handleUpdateMenuOrder = async (menuId, newOrder) => {
      await axios.patch(`${API_BASE_URL}/menus/${menuId}`, { order_index: parseInt(newOrder) });
      fetchStore();
  };

  const startEditCategory = (cat) => { 
      setEditingCategoryId(cat.id); 
      setEditingCategoryName(cat.name);
      setEditingCategoryDesc(cat.description || ""); // 설명 불러오기
      setEditingCategoryHidden(cat.is_hidden);
  };
  const saveCategory = async (catId) => {
    await axios.patch(`${API_BASE_URL}/categories/${catId}`, { 
        name: editingCategoryName,
        description: editingCategoryDesc, // 설명 저장
        is_hidden: editingCategoryHidden 
    });
    setEditingCategoryId(null); fetchStore();
  };
  const deleteCategory = async (catId) => {
      if(!window.confirm("카테고리를 삭제하시겠습니까?\n포함된 메뉴도 모두 삭제됩니다!")) return;
      try {
        await axios.delete(`${API_BASE_URL}/categories/${catId}`);
        setEditingCategoryId(null); fetchStore();
      } catch(err) { alert("삭제 실패"); }
  };

  const openMenuEditModal = (menu, e) => {
    e.stopPropagation(); 
    setEditingMenuId(menu.id);
    setEditMenuCategoryId(menu.category_id); 
    setEditMenuName(menu.name);
    setEditMenuPrice(menu.price);
    setEditMenuDesc(menu.description || ""); 
    setEditMenuSoldOut(menu.is_sold_out);
    setEditMenuHidden(menu.is_hidden); 
    setEditMenuImage(menu.image_url);
    setIsMenuEditModalOpen(true);
  };
  const saveMenu = async () => {
    await axios.patch(`${API_BASE_URL}/menus/${editingMenuId}`, {
        category_id: parseInt(editMenuCategoryId), 
        name: editMenuName,
        price: parseInt(editMenuPrice),
        description: editMenuDesc, 
        is_sold_out: editMenuSoldOut,
        is_hidden: editMenuHidden,
        image_url: editMenuImage
    });
    setIsMenuEditModalOpen(false); fetchStore();
  };
  const deleteMenu = async () => {
      if(!window.confirm("정말 이 메뉴를 삭제하시겠습니까?")) return;
      try {
        await axios.delete(`${API_BASE_URL}/menus/${editingMenuId}`);
        setIsMenuEditModalOpen(false); fetchStore();
      } catch(err) { alert("삭제 실패"); }
  };

  const startEditGroup = (group) => { setEditingGroupId(group.id); setEditingGroupName(group.name); setEditingGroupSingle(group.is_single_select); };
  const saveGroup = async (groupId) => {
    await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { name: editingGroupName, is_single_select: editingGroupSingle });
    setEditingGroupId(null); fetchStore();
  };

  const startEditOption = (opt) => { setEditingOptionId(opt.id); setEditingOptionName(opt.name); setEditingOptionPrice(opt.price); };
  const saveOption = async (optId) => {
    await axios.patch(`${API_BASE_URL}/options/${optId}`, { name: editingOptionName, price: parseInt(editingOptionPrice) });
    setEditingOptionId(null); fetchStore();
  };
  
  const handleUpdateOptionDefault = async (optionId) => { await axios.patch(`${API_BASE_URL}/options/${optionId}`, { is_default: true }); fetchStore(); };
  const handleUpdateGroupOrder = async (groupId, newOrder) => {
    if (selectedMenu) await axios.patch(`${API_BASE_URL}/menus/${selectedMenu.id}/option-groups/${groupId}/reorder`, { order_index: parseInt(newOrder) });
    else await axios.patch(`${API_BASE_URL}/option-groups/${groupId}`, { order_index: parseInt(newOrder) });
    fetchStore();
  };
  const handleUpdateOptionOrder = async (optionId, newOrder) => { await axios.patch(`${API_BASE_URL}/options/${optionId}`, { order_index: parseInt(newOrder) }); fetchStore(); };
  const handleLinkGroup = async (groupId) => {
    if (!selectedMenu) return alert("메뉴를 먼저 선택하세요!");
    try { await axios.post(`${API_BASE_URL}/menus/${selectedMenu.id}/link-option-group/${groupId}`); fetchStore(); } 
    catch { alert("이미 연결됨"); }
  };
  const handleUnlinkGroup = async (groupId, e) => {
    e.stopPropagation();
    if (window.confirm("옵션 연결을 해제하시겠습니까?")) {
        await axios.delete(`${API_BASE_URL}/menus/${selectedMenu.id}/option-groups/${groupId}`); fetchStore();
    }
  };

  const handleMenuClick = (menu) => { if (selectedMenu?.id === menu.id) setSelectedMenu(null); else setSelectedMenu(menu); };

  if (loading || !store) return <div className="p-10 text-center font-bold">⏳ 로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-100 overflow-hidden">
      
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20 h-[70px] flex items-center">
        <div className="w-full max-w-7xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-gray-800">{store.name} <span className="text-sm font-normal text-gray-500">관리자</span></h1>
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
            <span className="text-sm font-bold text-gray-600 pl-1">🪑 테이블:</span>
            
            {/* [수정] 테이블 목록 및 편집 UI */}
            <div className="flex gap-1 overflow-x-auto max-w-[300px] scrollbar-hide">
                {store.tables.map(t => (
                    <div key={t.id} className="flex items-center bg-indigo-50 border border-indigo-200 rounded-lg px-2 py-1 shrink-0">
                        {editingTableId === t.id ? (
                            <div className="flex items-center gap-1">
                                <input className="w-12 text-xs border rounded p-1" value={editingTableName} onChange={e=>setEditingTableName(e.target.value)} autoFocus />
                                <button onClick={saveTable} className="text-blue-600 font-bold text-xs hover:text-blue-800">V</button>
                                <button onClick={cancelEditTable} className="text-gray-500 font-bold text-xs hover:text-gray-700">X</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1">
                                <a href={`${window.location.origin}/order/${t.qr_token}`} target="_blank" rel="noreferrer" className="text-indigo-700 text-xs font-bold whitespace-nowrap">{t.name} 🔗</a>
                                <button onClick={() => startEditTable(t)} className="text-gray-400 hover:text-blue-500 text-[10px]">✏️</button>
                                <button onClick={() => deleteTable(t.id)} className="text-gray-400 hover:text-red-500 text-[10px] ml-1">×</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="flex gap-1 ml-2 border-l pl-2">
                <input className="border p-1.5 rounded text-sm w-16" placeholder="번호" value={tableName} onChange={e=>setTableName(e.target.value)} />
                <button onClick={handleCreateTable} className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm font-bold shrink-0">추가</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-70px)]">
        
        {/* 왼쪽: 메뉴 관리 */}
        <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto pr-2 space-y-6 pb-20">
                {/* 메뉴 등록 폼 */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold mb-4">Step 1. 메뉴 등록</h2>
                    <div className="flex flex-col gap-4">
                        <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                            <select className="border p-2 rounded flex-1" value={selectedCategoryId} onChange={e=>setSelectedCategoryId(e.target.value)}>
                                <option value="">카테고리 선택</option>
                                {store.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className="border p-2 rounded w-32" placeholder="새 카테고리" value={categoryName} onChange={e=>setCategoryName(e.target.value)}/>
                            
                            {/* [신규] 카테고리 설명 입력 (작게) */}
                            <input className="border p-2 rounded w-48 text-sm" placeholder="카테고리 설명 (선택)" value={categoryDesc} onChange={e=>setCategoryDesc(e.target.value)}/>
                            
                            <button onClick={handleCreateCategory} className="bg-indigo-500 text-white px-3 py-2 rounded text-sm font-bold shrink-0">추가</button>
                        </div>
                        <div className="flex gap-2">
                            <input className="border p-2 rounded flex-1" placeholder="메뉴 이름 (예: 짜장면)" value={menuName} onChange={e=>setMenuName(e.target.value)} />
                            <input className="border p-2 rounded w-32" type="number" placeholder="가격" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)} />
                        </div>
                        <input className="border p-2 rounded w-full" placeholder="메뉴 상세 설명 (예: 달콤짭짤한 춘장 소스)" value={menuDesc} onChange={e=>setMenuDesc(e.target.value)} />
                        
                        <div className="flex items-center gap-2">
                             <input type="file" onChange={(e)=>handleImageUpload(e, setMenuImage)} className="text-sm py-2" />
                             {menuImage && <span className="text-xs text-green-600 font-bold">이미지 업로드됨</span>}
                        </div>
                        
                        <button onClick={handleCreateMenu} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold hover:bg-green-700 shadow-md">등록 완료</button>
                    </div>
                </div>

                {/* 카테고리 & 메뉴 리스트 */}
                <div className="space-y-6">
                    {store.categories.map(cat => (
                    <div key={cat.id} className={`bg-white p-5 rounded-xl shadow-sm border border-gray-200 ${cat.is_hidden ? 'opacity-60 bg-gray-100' : ''}`}>
                        {/* 카테고리 헤더 */}
                        <div className="flex items-center gap-2 mb-4 border-b pb-2">
                            <input type="number" className="w-10 border rounded text-center font-bold bg-gray-50" defaultValue={cat.order_index} onBlur={e=>handleUpdateCategoryOrder(cat.id, e.target.value)} />
                            
                            {editingCategoryId === cat.id ? (
                                <div className="flex flex-col flex-1 gap-2">
                                    <div className="flex items-center gap-2">
                                        <input className="border p-1 rounded text-lg font-bold flex-1" value={editingCategoryName} onChange={e=>setEditingCategoryName(e.target.value)} placeholder="카테고리명" />
                                        <label className="text-sm flex items-center gap-1 cursor-pointer">
                                            <input type="checkbox" checked={editingCategoryHidden} onChange={e=>setEditingCategoryHidden(e.target.checked)} />
                                            숨김
                                        </label>
                                        <button onClick={()=>saveCategory(cat.id)} className="bg-blue-500 text-white px-2 py-1 rounded text-xs">저장</button>
                                        <button onClick={()=>deleteCategory(cat.id)} className="bg-red-500 text-white px-2 py-1 rounded text-xs">삭제</button>
                                        <button onClick={()=>setEditingCategoryId(null)} className="bg-gray-300 px-2 py-1 rounded text-xs">취소</button>
                                    </div>
                                    {/* [신규] 카테고리 설명 수정 */}
                                    <input className="border p-1 rounded text-sm w-full" value={editingCategoryDesc} onChange={e=>setEditingCategoryDesc(e.target.value)} placeholder="카테고리 설명 수정" />
                                </div>
                            ) : (
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-xl text-gray-800 flex items-center gap-2">
                                            {cat.name}
                                            {cat.is_hidden && <span className="text-xs bg-gray-500 text-white px-1.5 py-0.5 rounded">숨김</span>}
                                        </h3>
                                        <button onClick={()=>startEditCategory(cat)} className="text-gray-400 hover:text-blue-500 text-sm">✏️</button>
                                    </div>
                                    {/* [신규] 카테고리 설명 표시 */}
                                    {cat.description && <p className="text-sm text-gray-500 mt-1">{cat.description}</p>}
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {cat.menus.map(menu => {
                            const isSelected = selectedMenu?.id === menu.id;
                            return (
                            <div key={menu.id} onClick={() => handleMenuClick(menu)} className={`p-3 rounded-xl border-2 cursor-pointer transition relative flex gap-3 overflow-hidden 
                                ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-100 hover:border-indigo-300'}
                                ${menu.is_hidden ? 'opacity-50 grayscale' : ''}
                            `}>
                                <div className="flex flex-col items-center justify-center pr-2 border-r gap-1">
                                    <span className="text-[10px] text-gray-400">순서</span>
                                    <input type="number" className="w-8 border rounded text-center text-xs p-0.5" defaultValue={menu.order_index} onClick={e=>e.stopPropagation()} onBlur={e=>handleUpdateMenuOrder(menu.id, e.target.value)} />
                                </div>
                                
                                <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                                   {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">🥘</div>}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-lg truncate">
                                            {menu.name}
                                            {menu.is_hidden && <span className="text-xs bg-gray-600 text-white px-1 ml-1 rounded">숨김</span>}
                                        </p>
                                        <button onClick={(e)=>openMenuEditModal(menu, e)} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded hover:bg-blue-100 hover:text-blue-600 shrink-0">수정</button>
                                    </div>
                                    <p className="text-gray-600">{menu.price.toLocaleString()}원</p>
                                    
                                    {menu.description && <p className="text-xs text-gray-500 truncate mt-1">{menu.description}</p>}

                                    {menu.is_sold_out && <span className="text-xs bg-red-100 text-red-600 px-1 rounded font-bold">품절</span>}
                                    
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {menu.option_groups.length>0 ? menu.option_groups.map(g => (
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
            </div>
        </div>

        {/* 오른쪽: 옵션 라이브러리 (기존 유지) */}
        <div className="lg:col-span-1 flex flex-col h-full overflow-hidden">
            <div className="shrink-0 mb-4">
                <div className={`p-4 rounded-xl text-center border-2 transition-colors ${selectedMenu ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                    {selectedMenu ? (<div><p className="font-bold text-lg">"{selectedMenu.name}" 선택됨</p><p className="text-sm opacity-90">아래에서 연결할 옵션을 누르세요 👇</p></div>) : (<p className="font-bold">메뉴를 먼저 선택하세요 👈</p>)}
                </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300 flex flex-col flex-1 overflow-hidden">
                <h2 className="text-lg font-bold mb-3 shrink-0">📚 옵션 라이브러리</h2>
                
                <div className="mb-4 border-b pb-4 bg-gray-50 p-3 rounded-lg shrink-0">
                    <input className="border p-2 rounded w-full text-sm mb-2" placeholder="새 그룹명 (예: 맵기)" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} />
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={isSingleSelect} onChange={e=>setIsSingleSelect(e.target.checked)} className="w-4 h-4"/> 1개만 선택 (라디오)</label>
                        <button onClick={handleCreateOptionGroup} className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm font-bold">생성</button>
                    </div>
                </div>

                <div className="space-y-3 overflow-y-auto flex-1 pr-1 pb-4">
                    {storeOptionGroups.map(group => {
                        const linkedGroup = selectedMenu?.option_groups.find(g => g.id === group.id);
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
                                <ul className="text-sm space-y-1 mb-3 bg-white p-2 rounded border text-gray-600">
                                    {group.options.map(opt => (
                                        <li key={opt.id} className="flex justify-between items-center p-1 hover:bg-gray-50 rounded">
                                            {editingOptionId === opt.id ? (
                                                <div className="flex gap-1 w-full">
                                                    <input className="border w-20 text-xs" value={editingOptionName} onChange={e=>setEditingOptionName(e.target.value)} />
                                                    <input className="border w-12 text-xs" type="number" value={editingOptionPrice} onChange={e=>setEditingOptionPrice(e.target.value)} />
                                                    <button onClick={()=>saveOption(opt.id)} className="text-xs bg-blue-500 text-white px-1 rounded">V</button>
                                                    <button onClick={()=>setEditingOptionId(null)} className="text-xs bg-gray-300 px-1 rounded">X</button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-2">
                                                        <input type="number" className="w-8 border rounded text-center text-xs p-0.5" defaultValue={opt.order_index} onBlur={(e)=>handleUpdateOptionOrder(opt.id, e.target.value)} />
                                                        {group.is_single_select && (opt.is_default ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 rounded font-bold border border-green-200">기본</span> : <button onClick={()=>handleUpdateOptionDefault(opt.id)} className="text-[10px] bg-gray-100 text-gray-400 px-1.5 rounded border hover:bg-gray-200">기본설정</button>)}
                                                        <span className="cursor-pointer hover:text-blue-600 hover:underline" onClick={()=>startEditOption(opt)}>- {opt.name}</span>
                                                    </div>
                                                    <span className="font-bold">+{opt.price}</span>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                    {group.options.length===0 && <li className="text-xs text-gray-400 text-center">옵션 없음</li>}
                                </ul>
                                {activeOptionGroupId === group.id ? (
                                    <div id={`option-form-${group.id}`} className="flex flex-col gap-2 bg-gray-100 p-2 rounded animate-fadeIn">
                                        <div className="flex gap-1"><input className="border p-1 rounded text-xs flex-1" placeholder="옵션명" value={newOptionName} onChange={e=>setNewOptionName(e.target.value)} /><input className="border p-1 rounded text-xs w-14" type="number" placeholder="원" value={newOptionPrice} onChange={e=>setNewOptionPrice(e.target.value)} /></div>
                                        <div className="flex gap-1"><button onClick={()=>handleCreateOption(group.id)} className="bg-indigo-600 text-white text-xs py-1 rounded flex-1">저장</button><button onClick={()=>setActiveOptionGroupId(null)} className="bg-gray-300 text-gray-700 text-xs py-1 rounded flex-1">취소</button></div>
                                    </div>
                                ) : (<button onClick={() => { setActiveOptionGroupId(group.id); setNewOptionName(""); setNewOptionPrice(""); }} className="w-full bg-white border border-dashed border-gray-400 text-gray-500 text-xs py-1.5 rounded hover:bg-gray-50">+ 상세 옵션 추가</button>)}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
      </div>

      {/* 메뉴 수정 모달 */}
      {isMenuEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-slideUp">
                <h2 className="text-xl font-bold mb-4">메뉴 수정</h2>
                <div className="space-y-3">
                    {/* [신규] 카테고리 이동 */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700">카테고리</label>
                        <select className="border w-full p-2 rounded" value={editMenuCategoryId} onChange={e=>setEditMenuCategoryId(e.target.value)}>
                            {store.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div><label className="block text-sm font-bold text-gray-700">이름</label><input className="border w-full p-2 rounded" value={editMenuName} onChange={e=>setEditMenuName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-700">가격</label><input className="border w-full p-2 rounded" type="number" value={editMenuPrice} onChange={e=>setEditMenuPrice(e.target.value)} /></div>
                    
                    <div><label className="block text-sm font-bold text-gray-700">상세 설명</label><textarea className="border w-full p-2 rounded resize-none" rows="2" value={editMenuDesc} onChange={e=>setEditMenuDesc(e.target.value)} /></div>
                    
                    <div><label className="block text-sm font-bold text-gray-700">이미지 변경</label><input type="file" className="text-sm" onChange={(e)=>handleImageUpload(e, setEditMenuImage)} />
                        {editMenuImage && <div className="mt-2 w-20 h-20 rounded overflow-hidden bg-gray-100"><img src={editMenuImage} className="w-full h-full object-cover"/></div>}
                    </div>
                    
                    {/* 체크박스 그룹 */}
                    <div className="flex gap-4 pt-2">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="soldout" checked={editMenuSoldOut} onChange={e=>setEditMenuSoldOut(e.target.checked)} className="w-5 h-5 text-red-600"/>
                            <label htmlFor="soldout" className="text-sm font-bold text-red-600 cursor-pointer">품절 처리</label>
                        </div>
                        {/* [신규] 메뉴 숨김 체크박스 */}
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="hidden" checked={editMenuHidden} onChange={e=>setEditMenuHidden(e.target.checked)} className="w-5 h-5 text-gray-600"/>
                            <label htmlFor="hidden" className="text-sm font-bold text-gray-600 cursor-pointer">메뉴 숨김</label>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-2 mt-6">
                    <button onClick={saveMenu} className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold">수정 완료</button>
                    {/* [신규] 메뉴 삭제 버튼 */}
                    <button onClick={deleteMenu} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold">삭제</button>
                    <button onClick={()=>setIsMenuEditModalOpen(false)} className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg font-bold">취소</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

export default AdminPage;