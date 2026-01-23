import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// [설정] 본인 컴퓨터 IP 확인 (로컬 테스트 시 localhost 추천)
const API_BASE_URL = "http://127.0.0.1:8000";

function KitchenPage() {
  const { storeId } = useParams();
  const [orders, setOrders] = useState([]);

  // 1. 주문 목록 가져오기 (API 연동)
  const fetchOrders = async () => {
    try {
      // is_completed=false (미완료) 주문만 가져오기
      const res = await axios.get(`${API_BASE_URL}/stores/${storeId}/orders?is_completed=false`);
      setOrders(res.data);
    } catch (error) {
      console.error("주문 불러오기 실패:", error);
    }
  };

  // 2. 주기적으로 주문 확인 (5초마다 자동 갱신 - 가장 안정적)
  useEffect(() => {
    fetchOrders(); // 접속하자마자 1회 실행
    const interval = setInterval(fetchOrders, 5000); // 5초마다 반복 실행
    return () => clearInterval(interval); // 페이지 나가면 중단
  }, [storeId]);

  // 3. 조리 완료 처리 (API 연동)
  const handleComplete = async (orderId) => {
    if(!window.confirm("조리를 완료 처리하시겠습니까?")) return;
    
    try {
      // 서버에 '완료' 신호 보내기
      await axios.patch(`${API_BASE_URL}/orders/${orderId}/complete`);
      
      // 성공하면 화면 목록에서 즉시 제거
      setOrders(prev => prev.filter(o => o.id !== orderId));
    } catch (err) {
      alert("처리 중 오류가 발생했습니다.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-100 p-4">
      {/* 상단 헤더 */}
      <header className="flex justify-between items-center mb-6 px-2">
        <div className="flex items-center gap-3">
            {/* 깜빡이는 초록 불빛 (작동중 표시) */}
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></span>
            <h1 className="text-2xl font-bold tracking-wider">KITCHEN DISPLAY</h1>
        </div>
        <div className="text-gray-400 font-mono text-xl">
            대기 주문: <span className="text-yellow-400 font-bold text-2xl ml-1">{orders.length}</span>
        </div>
      </header>

      {/* 주문 카드 리스트 */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {orders.length === 0 ? (
           <div className="col-span-full h-96 flex flex-col items-center justify-center text-gray-600">
             <div className="text-6xl mb-4">👨‍🍳</div>
             <p className="text-xl">현재 대기 중인 주문이 없습니다.</p>
             <p className="text-sm mt-2">주문이 들어오면 이곳에 카드가 뜹니다.</p>
           </div>
        ) : (
          orders.map((order) => (
            <div 
                key={order.id} 
                className="bg-slate-800 border-l-4 border-pink-500 rounded-r-lg shadow-lg overflow-hidden flex flex-col animate-fade-in-up"
            >
              {/* 카드 헤더 */}
              <div className="bg-slate-700 p-3 flex justify-between items-center border-b border-slate-600">
                {/* table_id 표시 부분 (이전 코드에 맞게 수정) */}
                <span className="text-2xl font-extrabold text-white">No. {order.table_id}</span>
                {/* 시간 표시 (created_at이 없으면 에러 안나게 처리) */}
                <span className="text-xs text-gray-400 font-mono">
                    {order.created_at ? order.created_at.substring(11, 16) : ""}
                </span>
              </div>

              {/* 메뉴 리스트 */}
              <div className="p-4 flex-1 space-y-3">
                {order.items && order.items.map((item, i) => (
                    <div key={i} className="flex flex-col border-b border-slate-700 pb-2 last:border-0">
                        <div className="flex justify-between items-center">
                            <span className="text-lg text-gray-200 font-medium">{item.menu_name}</span>
                            <span className="bg-slate-900 text-yellow-400 text-xl font-bold px-3 py-1 rounded border border-slate-600">
                                {item.quantity}
                            </span>
                        </div>
                        {/* 옵션 표시 (있을 경우에만) */}
                        {item.options_desc && (
                            <span className="text-sm text-pink-400 mt-1 pl-2">
                                └ {item.options_desc}
                            </span>
                        )}
                    </div>
                ))}
              </div>

              {/* 하단 완료 버튼 */}
              <button 
                onClick={() => handleComplete(order.id)}
                className="w-full bg-slate-600 hover:bg-blue-600 text-white font-bold py-4 transition-colors duration-200 flex items-center justify-center gap-2"
              >
                <span>조리 완료</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default KitchenPage;