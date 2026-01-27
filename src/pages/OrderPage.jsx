import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config"; // IP 설정 가져오기

function OrderPage() {
  const { token } = useParams();
  const [tableInfo, setTableInfo] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 장바구니 상태
  const [cart, setCart] = useState([]);

  useEffect(() => {
    const fetchTableAndMenu = async () => {
      try {
        setLoading(true);
        // 1. IP 주소 확인용 로그 (화면에 띄움)
        console.log("요청 보내는 주소:", API_BASE_URL);

        // 2. 테이블 정보 조회 (타임아웃 5초 설정)
        const tableRes = await axios.get(`${API_BASE_URL}/tables/by-token/${token}`, {
            timeout: 5000 // 5초 동안 응답 없으면 에러 발생시킴
        });
        setTableInfo(tableRes.data);

        // 3. 가게(메뉴) 정보 조회
        const storeRes = await axios.get(`${API_BASE_URL}/stores/${tableRes.data.store_id}`, {
            timeout: 5000
        });
        setStore(storeRes.data);
        
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        
        // 🚨 에러 내용을 화면에 팝업으로 띄움 (디버깅용)
        if (err.code === "ECONNABORTED") {
            alert(`시간 초과! 핸드폰이 컴퓨터(${API_BASE_URL})에 닿지 못했습니다.\n와이파이가 같은지 확인하세요.`);
        } else if (err.message === "Network Error") {
             alert(`네트워크 에러!\nIP주소(${API_BASE_URL})가 틀렸거나 방화벽 문제입니다.`);
        } else {
            alert(`에러 발생: ${err.message}\n${err.response?.data?.detail || ""}`);
        }
        
        setError("서버 연결 실패. 다시 시도해주세요.");
      }
    };

    if (token) {
        fetchTableAndMenu();
    } else {
        // [추가된 부분] 토큰이 없으면 로딩을 끄고 에러를 띄움
        setLoading(false);
        setError("잘못된 접속 경로입니다. (QR코드를 다시 찍어주세요)");
    }
  }, [token]);

  // --- 장바구니 로직 ---

  // 1. 메뉴별 현재 담긴 개수 확인
  const getQuantity = (menuId) => {
    const item = cart.find(i => i.id === menuId);
    return item ? item.quantity : 0;
  };

  // 2. 담기 (+)
  const addToCart = (menu) => {
    const existing = cart.find(item => item.id === menu.id);
    if (existing) {
      setCart(cart.map(item => item.id === menu.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { ...menu, quantity: 1 }]);
    }
  };

  // 3. 빼기 (-)
  const removeFromCart = (menu) => {
    const existing = cart.find(item => item.id === menu.id);
    if (!existing) return;

    if (existing.quantity === 1) {
      // 1개일 때 빼면 장바구니에서 삭제
      setCart(cart.filter(item => item.id !== menu.id));
    } else {
      // 개수 감소
      setCart(cart.map(item => item.id === menu.id ? { ...item, quantity: item.quantity - 1 } : item));
    }
  };

  // 4. 주문하기
  const handleOrder = async () => {
    if (cart.length === 0) return alert("메뉴를 담아주세요!");
    if (!window.confirm(`${cart.reduce((acc, cur) => acc + (cur.price * cur.quantity), 0).toLocaleString()}원 주문하시겠습니까?`)) return;

    try {
      const orderPayload = {
        store_id: tableInfo.store_id,
        table_id: tableInfo.table_id,
        items: cart.map(item => ({
          menu_id: item.id,
          quantity: item.quantity,
          options: [] 
        }))
      };

      await axios.post(`${API_BASE_URL}/orders/`, orderPayload);
      alert("✅ 주문이 접수되었습니다! 잠시만 기다려주세요.");
      setCart([]); // 장바구니 초기화
    } catch (err) {
      alert("주문 전송 실패");
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-500">⏳ 메뉴판 불러오는 중...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold p-4 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* 상단 헤더 */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <h1 className="text-lg font-bold text-center text-gray-800">{store?.name}</h1>
        <p className="text-center text-xs text-indigo-600 font-bold mt-1 px-2 py-0.5 bg-indigo-50 rounded-full inline-block mx-auto">
          {tableInfo?.label}
        </p>
      </div>

      {/* 메뉴 리스트 */}
      <div className="p-4 space-y-8 max-w-lg mx-auto">
        {store?.categories.map(cat => (
          <div key={cat.id}>
            <h2 className="font-extrabold text-xl mb-4 text-gray-800 pl-2 border-l-4 border-indigo-600">
              {cat.name}
            </h2>
            
            <div className="grid gap-4">
              {cat.menus.map(menu => {
                const quantity = getQuantity(menu.id);
                const isSoldOut = menu.is_sold_out;

                return (
                  <div 
                    key={menu.id} 
                    className={`bg-white p-4 rounded-xl shadow-sm flex gap-4 border border-gray-100 transition
                      ${isSoldOut ? 'opacity-60 grayscale bg-gray-50' : ''}`}
                  >
                    {/* 1. 이미지 영역 */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                      {menu.image_url ? (
                        <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🥘</div>
                      )}
                      {/* 품절 오버레이 */}
                      {isSoldOut && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">SOLD OUT</span>
                        </div>
                      )}
                    </div>

                    {/* 2. 정보 및 버튼 영역 */}
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-lg text-gray-800 leading-tight mb-1">{menu.name}</h3>
                        <p className="text-gray-500 text-sm line-clamp-1">{menu.description || "설명 없음"}</p>
                        <p className="font-bold text-lg text-gray-900 mt-1">{menu.price.toLocaleString()}원</p>
                      </div>

                      {/* 3. 수량 조절 버튼 (우측 하단) */}
                      <div className="flex justify-end mt-2">
                        {isSoldOut ? (
                          <button disabled className="bg-gray-300 text-white px-4 py-2 rounded-lg text-sm font-bold cursor-not-allowed">
                            품절
                          </button>
                        ) : (
                          quantity === 0 ? (
                            // (1) 담기 버튼
                            <button 
                              onClick={() => addToCart(menu)}
                              className="bg-indigo-50 text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-100 transition active:scale-95"
                            >
                              + 담기
                            </button>
                          ) : (
                            // (2) 수량 조절 버튼 (- 1 +)
                            <div className="flex items-center bg-indigo-600 rounded-lg text-white shadow-md">
                              <button 
                                onClick={() => removeFromCart(menu)}
                                className="w-9 h-9 flex items-center justify-center font-bold active:bg-indigo-700 rounded-l-lg"
                              >
                                −
                              </button>
                              <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                              <button 
                                onClick={() => addToCart(menu)}
                                className="w-9 h-9 flex items-center justify-center font-bold active:bg-indigo-700 rounded-r-lg"
                              >
                                +
                              </button>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* 하단 장바구니 플로팅 바 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 w-full max-w-lg left-1/2 -translate-x-1/2 bg-white border-t border-gray-200 p-4 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] rounded-t-2xl z-20">
          <div className="flex justify-between items-center mb-1">
            <span className="text-gray-600 font-medium">
              총 <span className="text-indigo-600 font-bold">{cart.reduce((acc, cur) => acc + cur.quantity, 0)}</span>개 메뉴
            </span>
            <span className="text-xl font-extrabold text-gray-900">
              {cart.reduce((acc, cur) => acc + (cur.price * cur.quantity), 0).toLocaleString()}원
            </span>
          </div>
          <button 
            onClick={handleOrder}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 transition active:scale-95 flex items-center justify-center gap-2"
          >
            주문하기
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderPage;