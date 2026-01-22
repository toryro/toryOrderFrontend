import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

function OrderPage() {
  const { token } = useParams(); 
  const [store, setStore] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [cart, setCart] = useState({}); 

  // 1. 초기 데이터 로드
  useEffect(() => {
    async function fetchData() {
      try {
        const tableRes = await axios.get(`http://127.0.0.1:8000/tables/by-token/${token}`);
        setTableInfo(tableRes.data);

        const storeRes = await axios.get(`http://127.0.0.1:8000/stores/${tableRes.data.store_id}`);
        setStore(storeRes.data);
      } catch (error) {
        alert("유효하지 않은 QR 코드이거나 가게 정보를 불러올 수 없습니다.");
        console.error(error);
      }
    }
    fetchData();
  }, [token]);

  // 2. 장바구니 담기
  const addToCart = (menuId) => {
    setCart(prev => ({
      ...prev,
      [menuId]: (prev[menuId] || 0) + 1
    }));
  };

  // 3. 주문하기 (Step 4: 서버 전송 로직 포함!)
  const placeOrder = async () => {
    console.log("👉 버튼 눌림! 함수 시작!"); 

    // 장바구니 데이터 변환
    const orderItems = Object.entries(cart).map(([menuId, qty]) => ({
        menu_id: parseInt(menuId),
        quantity: qty,
        options: {} 
    }));
    
    // 유효성 검사
    if (orderItems.length === 0) return alert("메뉴를 선택해주세요!");
    if (!tableInfo) return alert("테이블 정보가 없습니다.");

    try {
        const payload = {
            store_id: tableInfo.store_id,
            table_id: tableInfo.table_id,
            items: orderItems
        };
        
        console.log("📡 서버로 보낼 데이터:", payload);

        // --- 여기가 핵심! 실제 서버로 요청 보내기 ---
        const response = await axios.post('http://127.0.0.1:8000/orders/', payload);
        
        // 성공 시
        if (response.status === 200) {
            console.log("✅ 서버 응답 성공:", response.data);
            alert(`주문이 완료되었습니다!\n주문번호: ${response.data.id}`);
            setCart({}); // 장바구니 비우기
        }
    } catch (error) {
        console.error("❌ 주문 에러:", error);
        alert("주문에 실패했습니다. 백엔드가 켜져있는지 확인해주세요.");
    }
  };

  if (!store || !tableInfo) return <div>메뉴판 로딩중...</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', paddingBottom: '100px' }}>
      <h1>🏠 {store.name}</h1>
      <p>📍 좌석: {tableInfo.label}</p>
      <hr />
      
      {store.categories.map(cat => (
        <div key={cat.id}>
          <h3>📂 {cat.name}</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {cat.menus.map(menu => (
              <li key={menu.id} style={{ borderBottom: '1px solid #ddd', padding: '10px 0', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <strong>{menu.name}</strong>
                  <div style={{ color: '#888' }}>{menu.price}원</div>
                </div>
                <div>
                  <button onClick={() => addToCart(menu.id)} style={{ padding: '5px 10px', cursor: 'pointer' }}>
                    담기 (+{cart[menu.id] || 0})
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div style={{ position: 'fixed', bottom: 0, left: 0, width: '100%', padding: '20px', background: 'white', borderTop: '1px solid #ccc', boxSizing: 'border-box' }}>
        <button 
            onClick={placeOrder} 
            style={{ 
              width: '100%', 
              padding: '15px', 
              background: 'orange', 
              color: 'white', 
              border: 'none', 
              fontSize: '18px', 
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
        >
          주문하기
        </button>
      </div>
    </div>
  );
}

export default OrderPage;