// AdminPage.jsx (전체 덮어씌우기)

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
  
  // 입력 폼
  const [categoryName, setCategoryName] = useState("");
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [menuImage, setMenuImage] = useState(null);
  const [tableName, setTableName] = useState("");

  // 옵션 관리용
  const [newGroupName, setNewGroupName] = useState("");
  const [isSingleSelect, setIsSingleSelect] = useState(false); // [신규] 단일선택 여부
  const [selectedMenu, setSelectedMenu] = useState(null); 
  
  const [activeOptionGroupId, setActiveOptionGroupId] = useState(null); 
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionPrice, setNewOptionPrice] = useState("");

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

  // --- 옵션 라이브러리 관리 ---
  const handleCreateOptionGroup = async () => {
    if (!newGroupName) return;
    try {
      // [수정] is_single_select 값도 같이 보냄
      await axios.post(`${API_BASE_URL}/stores/${storeId}/option-groups/`, 
        { name: newGroupName, is_required: false, is_single_select: isSingleSelect }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewGroupName(""); 
      setIsSingleSelect(false); // 초기화
      fetchStore();
    } catch (err) { alert("그룹 생성 실패"); }
  };

  const handleCreateOption = async (groupId) => {
    if (!newOptionName) return;
    try {
      await axios.post(`${API_BASE_URL}/option-groups/${groupId}/options/`, { name: newOptionName, price: parseInt(newOptionPrice)||0 }, { headers: { Authorization: `Bearer ${token}` } });
      setNewOptionName(""); setNewOptionPrice(""); setActiveOptionGroupId(null); 
      fetchStore();
    } catch (err) { alert("옵션 생성 실패"); }
  };

  const handleMenuClick = (menu) => {
    if (selectedMenu?.id === menu.id) setSelectedMenu(null);
    else setSelectedMenu(menu);
  };

  const handleLinkGroup = async (groupId) => {
    if (!selectedMenu) return alert("먼저 왼쪽에서 메뉴를 선택해주세요!");
    try {
      await axios.post(`${API_BASE_URL}/menus/${selectedMenu.id}/link-option-group/${groupId}`);
      fetchStore(); 
    } catch (err) { alert("이미 연결되어 있거나 실패했습니다."); }
  };

  // [신규] 옵션 그룹 연결 해제 (삭제)
  const handleUnlinkGroup = async (groupId, event) => {
    event.stopPropagation(); // 부모 클릭 방지
    if (!selectedMenu) return;
    if (!window.confirm("정말 이 메뉴에서 옵션을 빼시겠습니까?")) return;

    try {
      await axios.delete(`${API_BASE_URL}/menus/${selectedMenu.id}/option-groups/${groupId}`);
      fetchStore();
    } catch (err) { alert("삭제 실패"); }
  };

  // ... (기존 이미지 업로드 등 함수 유지)
  const handleImageUpload = async (e) => {
      const formData = new FormData(); formData.append("file", e.target.files[0]);
      const res = await axios.post(`${API_BASE_URL}/upload/`, formData); setMenuImage(res.data.url);
  };
  const handleCreateCategory = async () => { await axios.post(`${API_BASE_URL}/stores/${storeId}/categories/`, {name:categoryName}, {headers:{Authorization:`Bearer ${token}`}}); setCategoryName(""); fetchStore(); };
  const handleCreateMenu = async () => { await axios.post(`${API_BASE_URL}/categories/${selectedCategoryId}/menus/`, {name:menuName, price:parseInt(menuPrice), image_url:menuImage}, {headers:{Authorization:`Bearer ${token}`}}); setMenuName(""); setMenuPrice(""); setMenuImage(null); fetchStore(); };
  const handleCreateTable = async () => {
      if(!tableName) return;
      await axios.post(`${API_BASE_URL}/stores/${storeId}/tables/`, {name:tableName}, {headers:{Authorization:`Bearer ${token}`}}); setTableName(""); fetchStore();
  };

  if (loading || !store) return <div className="p-10 text-center font-bold">⏳ 가게 정보를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-100 pb-20">
      
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold text-gray-800">{store.name} <span className="text-sm font-normal text-gray-500">관리자 페이지</span></h1>
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
            <span className="text-sm font-bold text-gray-600 pl-1">🪑 테이블:</span>
            <div className="flex gap-1 overflow-x-auto max-w-[200px] scrollbar-hide">
                {store.tables.map(t => (
                    <a key={t.id} href={`${window.location.origin}/order/${t.qr_token}`} target="_blank" rel="noreferrer" className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-indigo-100 flex items-center gap-1 transition">
                        {t.name} 🔗
                    </a>
                ))}
            </div>
            <div className="flex gap-1 ml-2 border-l pl-2">
                <input className="border p-1.5 rounded text-sm w-24" placeholder="예: 5번" value={tableName} onChange={e=>setTableName(e.target.value)} />
                <button onClick={handleCreateTable} className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm font-bold whitespace-nowrap shrink-0">추가</button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* 왼쪽 (메뉴 관리) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">Step 1. 메뉴 등록하기</h2>
            <div className="flex flex-col gap-4">
                <div className="flex gap-2 items-center bg-gray-50 p-3 rounded-lg">
                    <select className="border p-2 rounded flex-1 max-w-[200px]" value={selectedCategoryId} onChange={e=>setSelectedCategoryId(e.target.value)}>
                        <option value="">카테고리 선택</option>
                        {store.categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <input className="border p-2 rounded w-32" placeholder="새 카테고리" value={categoryName} onChange={e=>setCategoryName(e.target.value)}/>
                    <button onClick={handleCreateCategory} className="bg-indigo-500 text-white px-3 py-2 rounded text-sm font-bold whitespace-nowrap shrink-0">추가</button>
                </div>
                <div className="flex flex-col md:flex-row gap-2">
                    <input className="border p-2 rounded flex-1" placeholder="메뉴 이름" value={menuName} onChange={e=>setMenuName(e.target.value)} />
                    <input className="border p-2 rounded w-full md:w-32" type="number" placeholder="가격" value={menuPrice} onChange={e=>setMenuPrice(e.target.value)} />
                    <input type="file" onChange={handleImageUpload} className="text-sm py-2" />
                </div>
                <button onClick={handleCreateMenu} className="w-full bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 shadow-md">메뉴 등록 완료</button>
            </div>
          </div>

          <div className="space-y-6">
            {store.categories.map(cat => (
              <div key={cat.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h3 className="font-bold text-xl mb-4 border-b pb-2 text-gray-800">{cat.name}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {cat.menus.map(menu => {
                    const isSelected = selectedMenu?.id === menu.id;
                    return (
                      <div key={menu.id} onClick={() => handleMenuClick(menu)} className={`p-3 rounded-xl border-2 cursor-pointer transition relative flex gap-3 overflow-hidden ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-100 hover:border-indigo-300'}`}>
                        <div className="w-20 h-20 bg-gray-200 rounded-lg overflow-hidden shrink-0">
                           {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-2xl">🥘</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg truncate">{menu.name}</p>
                          <p className="text-gray-600">{menu.price.toLocaleString()}원</p>
                          
                          {/* [신규] 연결된 옵션 그룹 뱃지 표시 + 삭제 버튼 */}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {menu.option_groups.length > 0 ? (
                                menu.option_groups.map(g => (
                                    <span key={g.id} className="text-xs bg-white border border-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        {g.name}
                                        {isSelected && (
                                            <button 
                                                onClick={(e) => handleUnlinkGroup(g.id, e)}
                                                className="text-red-500 hover:text-red-700 font-bold px-1" title="연결 해제"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </span>
                                ))
                            ) : (<span className="text-xs text-gray-400">옵션 없음</span>)}
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

        {/* 오른쪽 (옵션 라이브러리) */}
        <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
                <div className={`p-4 rounded-xl text-center border-2 transition-colors ${selectedMenu ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-200 border-gray-300 text-gray-500'}`}>
                    {selectedMenu ? (
                        <div>
                            <p className="font-bold text-lg">"{selectedMenu.name}" 선택됨</p>
                            <p className="text-sm opacity-90">아래에서 연결할 옵션을 누르세요 👇</p>
                        </div>
                    ) : (<p className="font-bold">메뉴를 먼저 선택하세요 👈</p>)}
                </div>

                <div className="bg-white p-5 rounded-xl shadow-md border border-gray-300">
                    <h2 className="text-lg font-bold mb-3">📚 옵션 라이브러리</h2>
                    
                    {/* 그룹 생성 폼 수정 */}
                    <div className="mb-6 border-b pb-4 bg-gray-50 p-3 rounded-lg">
                        <input className="border p-2 rounded w-full text-sm mb-2" placeholder="새 그룹명 (예: 맵기)" value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} />
                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                                <input type="checkbox" checked={isSingleSelect} onChange={e => setIsSingleSelect(e.target.checked)} className="w-4 h-4 text-indigo-600"/>
                                <span>1개만 선택 (라디오)</span>
                            </label>
                            <button onClick={handleCreateOptionGroup} className="bg-gray-800 text-white px-3 py-1.5 rounded text-sm font-bold shrink-0">생성</button>
                        </div>
                    </div>

                    <div className="space-y-3 max-h-[calc(100vh-350px)] overflow-y-auto pr-1">
                        {storeOptionGroups.map(group => {
                            // 이미 연결되었는지 확인
                            const isLinked = selectedMenu?.option_groups.some(g => g.id === group.id);
                            
                            return (
                                <div key={group.id} className={`p-3 rounded-lg border transition ${isLinked ? 'bg-indigo-50 border-indigo-300' : 'bg-white hover:border-gray-400'}`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <span className="font-bold text-gray-800 truncate">📌 {group.name}</span>
                                            {group.is_single_select && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1 rounded border border-yellow-200 shrink-0">1개만</span>}
                                        </div>
                                        
                                        {selectedMenu && (
                                            isLinked ? (
                                                <button disabled className="text-gray-400 text-xs font-bold px-2">연결됨 v</button>
                                            ) : (
                                                <button onClick={() => handleLinkGroup(group.id)} className="bg-indigo-600 text-white text-xs px-2 py-1.5 rounded font-bold hover:bg-indigo-700 shadow-sm shrink-0">
                                                    연결 🔗
                                                </button>
                                            )
                                        )}
                                    </div>
                                    
                                    <ul className="text-sm space-y-1 mb-3 bg-white p-2 rounded border text-gray-600">
                                        {group.options.map(opt => (
                                            <li key={opt.id} className="flex justify-between"><span>- {opt.name}</span><span className="font-bold">+{opt.price}</span></li>
                                        ))}
                                        {group.options.length === 0 && <li className="text-xs text-gray-400 text-center">옵션 없음</li>}
                                    </ul>

                                    {activeOptionGroupId === group.id ? (
                                        <div className="flex flex-col gap-2 bg-gray-100 p-2 rounded animate-fadeIn">
                                            <div className="flex gap-1">
                                                <input className="border p-1 rounded text-xs flex-1" placeholder="옵션명" value={newOptionName} onChange={e=>setNewOptionName(e.target.value)} />
                                                <input className="border p-1 rounded text-xs w-14" type="number" placeholder="원" value={newOptionPrice} onChange={e=>setNewOptionPrice(e.target.value)} />
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={()=>handleCreateOption(group.id)} className="bg-indigo-600 text-white text-xs py-1 rounded flex-1">저장</button>
                                                <button onClick={()=>setActiveOptionGroupId(null)} className="bg-gray-300 text-gray-700 text-xs py-1 rounded flex-1">취소</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button onClick={() => { setActiveOptionGroupId(group.id); setNewOptionName(""); setNewOptionPrice(""); }} className="w-full bg-white border border-dashed border-gray-400 text-gray-500 text-xs py-1.5 rounded hover:bg-gray-50">
                                            + 상세 옵션 추가
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;