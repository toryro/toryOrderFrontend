import { useState, useEffect } from "react";
import axios from "axios";

import { API_BASE_URL } from "../config"; // 경로 주의! pages 폴더 안에 있으니 ..로 나가야 함


function SuperAdminPage() {
  const [groups, setGroups] = useState([]);
  const [stores, setStores] = useState([]);
  
  // 입력 폼 상태들
  const [newGroupName, setNewGroupName] = useState("");
  const [newStoreName, setNewStoreName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  
  // [신규] 사장님 계정 생성용 상태
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [targetStoreId, setTargetStoreId] = useState(""); // 어떤 가게 사장님인지

  const token = localStorage.getItem("token");

  // 데이터 로딩
  const fetchData = async () => {
    try {
      const authHeader = { headers: { Authorization: `Bearer ${token}` } };
      const groupRes = await axios.get(`${API_BASE_URL}/groups/`, authHeader);
      const storeRes = await axios.get(`${API_BASE_URL}/admin/stores/`, authHeader);
      
      setGroups(groupRes.data);
      setStores(storeRes.data);
    } catch (err) {
      console.error(err);
      alert("데이터 로딩 실패! (슈퍼 관리자 권한 확인 필요)");
    }
  };

  useEffect(() => { fetchData(); }, []);

  // 1. 그룹 생성
  const handleCreateGroup = async () => {
    if (!newGroupName) return alert("그룹 이름을 입력하세요.");
    try {
      await axios.post(`${API_BASE_URL}/groups/`, { name: newGroupName }, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ 그룹 생성 완료!");
      setNewGroupName("");
      fetchData();
    } catch (err) { alert("그룹 생성 실패"); }
  };

  // 2. 가게 생성
  const handleCreateStore = async () => {
    if (!newStoreName) return alert("가게 이름을 입력하세요.");
    try {
      const payload = {
        name: newStoreName,
        group_id: selectedGroupId ? parseInt(selectedGroupId) : null
      };
      await axios.post(`${API_BASE_URL}/stores/`, payload, { headers: { Authorization: `Bearer ${token}` } });
      alert("✅ 가게 생성 완료!");
      setNewStoreName("");
      fetchData();
    } catch (err) { alert("가게 생성 실패"); }
  };

  // 3. [신규] 사장님 계정 생성 (핵심!)
  const handleCreateOwner = async () => {
    if (!ownerEmail || !ownerPassword || !targetStoreId) {
      return alert("이메일, 비밀번호, 가게 선택은 필수입니다.");
    }
    try {
      const payload = {
        email: ownerEmail,
        password: ownerPassword,
        role: "STORE_OWNER", // 역할을 사장님으로 고정
        store_id: parseInt(targetStoreId),
        group_id: null // 필요시 그룹 관리자 로직 추가 가능
      };

      await axios.post(`${API_BASE_URL}/admin/users/`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert(`🎉 사장님 계정 생성 완료!\nID: ${ownerEmail}\n가게: ${targetStoreId}번`);
      setOwnerEmail("");
      setOwnerPassword("");
      setTargetStoreId("");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "계정 생성 실패");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">👑 슈퍼 관리자 대시보드</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* 패널 1: 그룹 관리 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">🏢 1. 그룹(본사) 생성</h2>
          <div className="flex gap-2 mb-4">
            <input 
              className="border p-2 rounded flex-1"
              placeholder="예: 백종원컴퍼니"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
            />
            <button onClick={handleCreateGroup} className="bg-blue-600 text-white px-3 rounded font-bold hover:bg-blue-700">생성</button>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            {groups.map(g => <li key={g.id}>• #{g.id} {g.name}</li>)}
          </ul>
        </div>

        {/* 패널 2: 가게 관리 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">🏪 2. 가게(지점) 생성</h2>
          <div className="flex flex-col gap-2 mb-4">
            <input 
              className="border p-2 rounded"
              placeholder="예: 홍콩반점 강남점"
              value={newStoreName}
              onChange={(e) => setNewStoreName(e.target.value)}
            />
            <select 
              className="border p-2 rounded"
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
            >
              <option value="">(선택) 개인 가게 (그룹 없음)</option>
              {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
            <button onClick={handleCreateStore} className="bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700">가게 생성</button>
          </div>
          <ul className="text-sm text-gray-600 space-y-1 max-h-40 overflow-y-auto">
            {stores.map(s => <li key={s.id}>• #{s.id} {s.name}</li>)}
          </ul>
        </div>

        {/* 패널 3: 사장님 계정 발급 (신규) */}
        <div className="bg-white p-6 rounded-lg shadow-md border-2 border-indigo-100">
          <h2 className="text-xl font-bold mb-4 border-b pb-2 text-indigo-900">👤 3. 사장님 계정 발급</h2>
          <div className="flex flex-col gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500">배정할 가게</label>
              <select 
                className="w-full border p-2 rounded"
                value={targetStoreId}
                onChange={(e) => setTargetStoreId(e.target.value)}
              >
                <option value="">가게를 선택하세요</option>
                {stores.map(s => <option key={s.id} value={s.id}>#{s.id} {s.name}</option>)}
              </select>
            </div>
            
            <input 
              type="email"
              className="border p-2 rounded"
              placeholder="사장님 이메일 (예: owner@store.com)"
              value={ownerEmail}
              onChange={(e) => setOwnerEmail(e.target.value)}
            />
            <input 
              type="password"
              className="border p-2 rounded"
              placeholder="비밀번호"
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
            />
            <button 
              onClick={handleCreateOwner}
              className="bg-indigo-600 text-white py-2 rounded font-bold hover:bg-indigo-700"
            >
              사장님 계정 생성 & 연결
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default SuperAdminPage;