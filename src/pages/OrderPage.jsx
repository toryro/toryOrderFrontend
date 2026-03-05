import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import toast from "react-hot-toast";

function OrderPage() {
  const { token } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [store, setStore] = useState(null);
  const [tableInfo, setTableInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [cart, setCart] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState(new Set());
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCallModalOpen, setIsCallModalOpen] = useState(false);

  // 🔥 [신규] 관리자가 설정한 호출 옵션 목록
  const [callOptions, setCallOptions] = useState([]);

  // 주문 완료 모달 상태
  const [completedOrder, setCompletedOrder] = useState(null);

  const isProcessing = useRef(false);

  // 직원 호출 핸들러
  const handleStaffCall = async (message) => {
      try {
          await axios.post(`${API_BASE_URL}/stores/${store.id}/calls`, {
              table_id: tableInfo.id,
              message: message
          });
          toast.success(`🔔 '${message}' 요청을 보냈습니다.`);
          setIsCallModalOpen(false);
      } catch (err) {
          console.error(err);
          toast.error("호출 실패");
      }
  };

  // 🔥 [신규] 직원 호출 모달 열릴 때 옵션 가져오기
  const openCallModal = async () => {
      if (!store) return;
      try {
          const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/call-options`);
          setCallOptions(res.data);
          setIsCallModalOpen(true);
      } catch (err) {
          console.error("옵션 불러오기 실패, 기본값 사용", err);
          setCallOptions([]); // 실패 시 빈 배열 (직원만 호출은 항상 뜸)
          setIsCallModalOpen(true);
      }
  };

  // 모바일 결제 복귀 처리
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const impUid = query.get("imp_uid");
    const merchantUid = query.get("merchant_uid");
    const isSuccess = (query.get("success") === "true") || (query.get("imp_success") === "true");

    if (impUid && !isProcessing.current) {
      isProcessing.current = true;

      if (isSuccess) {
        axios.post(`${API_BASE_URL}/payments/complete`, { imp_uid: impUid, merchant_uid: merchantUid })
          .then((res) => {
            const dailyNum = res.data.daily_number || "확인중";
            setCompletedOrder(dailyNum);
            setCart([]);
            navigate(`/order/${token}`, { replace: true });
          })
          .catch((err) => {
             if (err.response?.data?.status === "already_paid") {
                setCompletedOrder("완료");
                setCart([]);
                navigate(`/order/${token}`, { replace: true });
             } else {
                toast.error(`결제 실패: ${err.response?.data?.detail || "오류 발생"}`);
             }
          })
          .finally(() => {
             isProcessing.current = false;
          });
      } else {
        toast.error("결제가 취소되었습니다.");
        isProcessing.current = false;
        navigate(`/order/${token}`, { replace: true });
      }
    }
  }, [location, token, navigate]);

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/tables/by-token/${token}`);
        setTableInfo({ id: res.data.table_id, name: res.data.label });
        const storeRes = await axios.get(`${API_BASE_URL}/stores/${res.data.store_id}`);
        setStore(storeRes.data);
      } catch (err) { toast.error("유효하지 않은 QR 코드입니다."); }
      finally { setLoading(false); }
    };
    fetchInfo();
  }, [token]);

  const updateQuantity = (itemId, delta) => {
    setCart(prev => prev.map(item => {
        if (item.id === itemId) return { ...item, quantity: Math.max(0, item.quantity + delta) };
        return item;
    }).filter(item => item.quantity > 0));
    if (cart.length === 1 && cart[0].quantity + delta <= 0) setIsCartOpen(false);
  };

  const toggleOption = (group, optionId) => {
    const newOptions = new Set(selectedOptions);
    if (group.is_single_select) {
      group.options.forEach(opt => { if (newOptions.has(opt.id)) newOptions.delete(opt.id); });
      newOptions.add(optionId);
    } else {
      if (newOptions.has(optionId)) newOptions.delete(optionId);
      else {
          if (group.max_select > 0) {
              const count = Array.from(newOptions).filter(id => group.options.some(opt => opt.id === id)).length;
              if (count >= group.max_select) return toast.error(`최대 ${group.max_select}개 선택 가능`);
          }
          newOptions.add(optionId);
      }
    }
    setSelectedOptions(newOptions);
  };

  const handleConfirmOptions = () => {
    for (const group of selectedMenu.option_groups) {
      if (group.is_required && !group.options.some(opt => selectedOptions.has(opt.id))) return toast.error(`'${group.name}' 필수 선택`);
    }
    const optionsList = [];
    selectedMenu.option_groups.forEach(g => g.options.forEach(o => { if (selectedOptions.has(o.id)) optionsList.push({ ...o, group_name: g.name }); }));
    
    const unitPrice = selectedMenu.price + optionsList.reduce((s,o)=>s+o.price,0);
    const newItem = { id: Date.now(), menuId: selectedMenu.id, name: selectedMenu.name, price: unitPrice, quantity: 1, options: optionsList };
    
    setCart(prev => [...prev, newItem]);
    setIsModalOpen(false);
  };

  const handleOrder = async (e) => {
    e.stopPropagation();
    if (cart.length === 0) return toast.error("장바구니가 비어있습니다.");
    if (isProcessing.current) return;
    isProcessing.current = true;

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // 백엔드 스키마에 맞게 데이터 변환
    const itemsData = cart.map(item => ({
      menu_id: item.menuId, 
      quantity: item.quantity,
      options: item.options.map(o => ({ name: o.name, price: o.price })), // 상세 옵션 정보
      options_desc: item.options.map(o => o.name).join(", "),
      price: item.price
    }));

    try {
      // 1. 주문 생성 요청 (여기서 재고 체크가 일어남!)
      const orderRes = await axios.post(`${API_BASE_URL}/orders/`, { store_id: store.id, table_id: tableInfo.id, items: itemsData });
      const tempDailyNumber = orderRes.data.daily_number;

      // 2. 결제 프로세스 시작
      const { IMP } = window;
      IMP.init("imp75163120"); // 본인의 가맹점 식별코드로 변경 필요

      IMP.request_pay({
        pg: "html5_inicis", 
        pay_method: "card",
        merchant_uid: `order_${orderRes.data.id}_${Date.now()}`,
        name: `${orderRes.data.items[0].menu_name} 외`,
        amount: totalAmount,
        m_redirect_url: window.location.href
      }, async (rsp) => {
        if (rsp.success) {
          try {
              await axios.post(`${API_BASE_URL}/payments/complete`, { imp_uid: rsp.imp_uid, merchant_uid: rsp.merchant_uid });
              setCompletedOrder(tempDailyNumber); 
              setCart([]);
              setIsCartOpen(false);
          } catch (err) {
              toast.error(`결제 검증 실패: ${err.response?.data?.detail || "오류 발생"}`);
          }
        } else {
          toast.error(`결제 실패: ${rsp.error_msg}`);
        }
        isProcessing.current = false;
      });
    } catch (err) { 
        // 🔥 [수정됨] 백엔드에서 보낸 구체적인 에러 메시지(재고 부족 등)를 표시
        const errorMsg = err.response?.data?.detail || "주문 생성 실패";
        toast.error(`🚫 주문을 진행할 수 없습니다.\n사유: ${errorMsg}`); 
        isProcessing.current = false;
    }
  };

  if (loading || !store) return <div className="p-10 text-center">⏳ 로딩 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* 상단 헤더 */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex justify-between items-center">
        <div>
            <h1 className="font-extrabold text-xl text-gray-800">{store.name}</h1>
            <p className="text-sm text-indigo-600 font-bold">📍 {tableInfo?.name} 테이블</p>
        </div>
      </div>

      {/* 메뉴 리스트 */}
      <div className="p-4 space-y-8 max-w-lg mx-auto">
        {store.categories.filter(c=>!c.is_hidden).map(cat => (
             <div key={cat.id}>
                <h2 className="font-extrabold text-xl mb-4 text-gray-800 pl-2 border-l-4 border-indigo-600">{cat.name}</h2>
                <div className="grid gap-4">
                  {cat.menus.filter(m=>!m.is_hidden).map(menu => (
                    <div key={menu.id} onClick={() => {
                        if(menu.is_sold_out) return;
                        if(menu.option_groups?.length > 0) {
                            setSelectedMenu(menu); setSelectedOptions(new Set()); setIsModalOpen(true);
                        } else {
                            const newItem = { id: Date.now(), menuId: menu.id, name: menu.name, price: menu.price, quantity: 1, options: [] };
                            setCart(prev => [...prev, newItem]);
                        }
                    }} className={`bg-white p-4 rounded-xl border shadow-sm flex gap-4 ${menu.is_sold_out ? 'opacity-50' : ''}`}>
                      <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative">
                         {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="text-3xl flex items-center justify-center h-full">🍽️</div>}
                         {menu.is_sold_out && <div className="absolute inset-0 bg-black/50 text-white flex items-center justify-center font-bold">품절</div>}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                         <h3 className="font-bold text-lg">{menu.name}</h3>
                         <span className="font-bold text-gray-900">{menu.price.toLocaleString()}원</span>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
        ))}
      </div>

      {/* 장바구니 버튼 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 w-full bg-white border-t p-4 z-30">
            <button onClick={handleOrder} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-xl shadow-lg">
                {cart.reduce((s,i)=>s+(i.price*i.quantity),0).toLocaleString()}원 결제하기
            </button>
        </div>
      )}

      {/* 메뉴 옵션 모달 */}
      {isModalOpen && selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="bg-white w-full max-w-lg rounded-t-2xl p-5">
                <h3 className="text-xl font-bold mb-4">{selectedMenu.name}</h3>
                {selectedMenu.option_groups.map(group => (
                    <div key={group.id} className="mb-4">
                        <h4 className="font-bold mb-2 text-sm">{group.name} {group.is_required && <span className="text-red-500 text-[10px]">필수</span>}</h4>
                        <div className="space-y-2">
                            {group.options.map(opt => {
                                const isChecked = selectedOptions.has(opt.id);
                                return (
                                    <label key={opt.id} className={`flex justify-between p-3 border rounded-lg ${isChecked ? 'bg-indigo-50 border-indigo-300' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <input type={group.is_single_select ? "radio" : "checkbox"} checked={isChecked} onChange={() => toggleOption(group, opt.id)} className="w-4 h-4"/>
                                            <span>{opt.name}</span>
                                        </div>
                                        <span>+{opt.price}원</span>
                                    </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
                <button onClick={handleConfirmOptions} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold mt-2">담기</button>
            </div>
        </div>
      )}

      {/* 직원호출 버튼 (클릭 시 openCallModal 실행) */}
      <button onClick={openCallModal} className="fixed bottom-24 right-4 bg-yellow-500 text-white w-14 h-14 rounded-full shadow-lg z-40 flex items-center justify-center text-2xl animate-bounce-slow">🔔</button>
      
      {/* 🔥 [변경됨] 동적 직원호출 모달 */}
      {isCallModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
                  <div className="bg-gray-800 text-white p-4 font-bold text-lg flex justify-between items-center">
                      <span>🔔 직원 호출</span>
                      <button onClick={() => setIsCallModalOpen(false)} className="p-1 hover:bg-gray-700 rounded">✕</button>
                  </div>
                  <div className="p-6">
                      <p className="text-center text-gray-500 mb-6">필요하신 서비스를 선택해주세요.</p>
                      <div className="grid grid-cols-2 gap-3">
                          
                          {/* 1. 관리자가 추가한 커스텀 옵션들 */}
                          {callOptions.map((opt) => (
                              <CallOptionButton key={opt.id} label={opt.name} onClick={() => handleStaffCall(opt.name)} />
                          ))}

                          {/* 2. 절대 삭제 불가능한 고정 버튼 (항상 마지막에 표시) */}
                          <CallOptionButton label="직원만 호출 🙋" onClick={() => handleStaffCall("직원 호출")} isPrimary />
                          
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 주문 완료(번호표) 모달 */}
      {completedOrder && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
              <div className="bg-white rounded-3xl w-[90%] max-w-sm p-8 text-center shadow-2xl transform scale-100">
                  <div className="text-6xl mb-4">🎫</div>
                  <h2 className="text-2xl font-extrabold text-gray-800 mb-2">주문이 접수되었습니다!</h2>
                  <p className="text-gray-500 mb-6">아래 번호를 확인해주세요.</p>
                  
                  <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 mb-8">
                      <p className="text-sm text-indigo-500 font-bold mb-1">나의 주문 번호</p>
                      <p className="text-6xl font-black text-indigo-600 tracking-tighter">#{completedOrder}</p>
                  </div>

                  <button onClick={() => setCompletedOrder(null)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition">확인했습니다 👍</button>
              </div>
          </div>
      )}
    </div>
  );
}

function CallOptionButton({ label, onClick, isPrimary }) {
    return (
        <button onClick={onClick} className={`border rounded-xl p-4 font-bold transition flex items-center justify-center text-center h-20 shadow-sm ${isPrimary ? "bg-yellow-50 border-yellow-400 text-yellow-800 hover:bg-yellow-100" : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-400"}`}>{label}</button>
    );
}

export default OrderPage;