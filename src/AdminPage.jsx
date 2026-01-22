import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function AdminPage() {
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  
  // 새 메뉴 입력값 관리
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // 데이터 불러오기
  const fetchStoreData = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/stores/${storeId}`);
      setStore(res.data);
      // 첫 번째 카테고리를 기본 선택으로 설정
      if (res.data.categories.length > 0) {
        setCategoryId(res.data.categories[0].id);
      }
    } catch (err) {
      alert("가게 정보를 불러올 수 없습니다.");
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  // 메뉴 추가 함수
  const handleAddMenu = async () => {
    if (!menuName || !menuPrice) return alert("이름과 가격을 입력해주세요.");

    try {
      await axios.post(`http://127.0.0.1:8000/categories/${categoryId}/menus/`, {
        name: menuName,
        price: parseInt(menuPrice),
        description: "사장님이 추가함",
        is_sold_out: false
      });
      
      alert("메뉴가 추가되었습니다!");
      setMenuName("");
      setMenuPrice("");
      fetchStoreData(); // 목록 새로고침
    } catch (err) {
      console.error(err);
      alert("메뉴 추가 실패");
    }
  };

  if (!store) return <div>로딩중...</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>⚙️ 관리자 페이지 ({store.name})</h1>
      <p>여기서 메뉴를 추가하거나 관리하세요.</p>
      
      {/* 메뉴 추가 폼 */}
      <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '10px', marginBottom: '30px' }}>
        <h3>➕ 새 메뉴 등록</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <select 
            value={categoryId} 
            onChange={(e) => setCategoryId(e.target.value)}
            style={{ padding: '10px' }}
          >
            {store.categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <input 
            placeholder="메뉴 이름 (예: 라면)" 
            value={menuName}
            onChange={(e) => setMenuName(e.target.value)}
            style={{ padding: '10px', flex: 1 }}
          />
          <input 
            type="number"
            placeholder="가격 (예: 4000)" 
            value={menuPrice}
            onChange={(e) => setMenuPrice(e.target.value)}
            style={{ padding: '10px', width: '100px' }}
          />
        </div>
        <button 
          onClick={handleAddMenu}
          style={{ width: '100%', padding: '10px', background: 'black', color: 'white', border: 'none', cursor: 'pointer' }}
        >
          등록하기
        </button>
      </div>

      <hr />

      {/* 현재 메뉴 목록 */}
      <h3>📜 현재 메뉴판</h3>
      {store.categories.map(cat => (
        <div key={cat.id} style={{ marginBottom: '20px' }}>
          <h4 style={{ background: '#eee', padding: '10px' }}>📂 {cat.name}</h4>
          <ul style={{ paddingLeft: '20px' }}>
            {cat.menus.map(menu => (
              <li key={menu.id} style={{ marginBottom: '5px' }}>
                {menu.name} - <strong>{menu.price}원</strong>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default AdminPage;