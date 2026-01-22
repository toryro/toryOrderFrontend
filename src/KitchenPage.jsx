import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

function KitchenPage() {
  const { storeId } = useParams(); // URL에서 가게 번호 가져오기
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("연결 중...");

  useEffect(() => {
    // 1. WebSocket 연결 시도 (ws:// 프로토콜 사용)
    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/${storeId}`);

    ws.onopen = () => {
      setStatus("🟢 실시간 연결됨 (주문 대기중)");
      console.log("WebSocket Connected");
    };

    ws.onmessage = (event) => {
      // 2. 서버에서 메시지가 오면 실행되는 곳
      const data = JSON.parse(event.data);
      console.log("새 주문 도착:", data);

      if (data.type === "NEW_ORDER") {
        // 알림음 재생 (선택사항)
        // new Audio('/ding.mp3').play().catch(()=>{});
        alert(`🔔 띵동! 새 주문이 들어왔습니다! (주문번호: ${data.order_id})`);
        
        // 주문 목록 맨 위에 추가
        setOrders(prev => [data, ...prev]);
      }
    };

    ws.onclose = () => {
      setStatus("🔴 연결 끊김");
    };

    return () => {
      ws.close(); // 화면 나가면 연결 종료
    };
  }, [storeId]);

  return (
    <div style={{ padding: '20px', background: '#222', minHeight: '100vh', color: 'white' }}>
      <h1>👨‍🍳 주방 모니터 (Store {storeId})</h1>
      <p>{status}</p>
      <hr style={{ borderColor: '#444' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
        {orders.map((order, index) => (
          <div key={index} style={{ 
              background: 'white', color: 'black', 
              width: '300px', padding: '20px', borderRadius: '10px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
            }}>
            <h2 style={{ margin: 0, color: 'orange' }}>#{order.order_id}번 주문</h2>
            <h3 style={{ marginTop: '10px' }}>테이블 {order.table_id}번</h3>
            <p style={{ fontSize: '20px', fontWeight: 'bold' }}>₩{order.total_price}</p>
            <p style={{ color: '#666' }}>{order.created_at}</p>
            <button style={{ width: '100%', padding: '10px', background: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
              조리 완료
            </button>
          </div>
        ))}
        {orders.length === 0 && <div style={{ color: '#888' }}>아직 주문이 없습니다.</div>}
      </div>
    </div>
  );
}

export default KitchenPage;