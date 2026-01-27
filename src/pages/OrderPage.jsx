import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function OrderPage() {
  const { token } = useParams();
  const [tableInfo, setTableInfo] = useState(null);
  const [store, setStore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 장바구니 상태
  const [cart, setCart] = useState([]);

  // [신규] 옵션 선택 모달용 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState(new Set()); // 선택된 옵션 ID 저장

  useEffect(() => {
    const fetchTableAndMenu = async () => {
      try {
        setLoading(true);
        const tableRes = await axios.get(`${API_BASE_URL}/tables/by-token/${token}`);
        setTableInfo(tableRes.data);
        const storeRes = await axios.get(`${API_BASE_URL}/stores/${tableRes.data.store_id}`);
        setStore(storeRes.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setLoading(false);
        setError("메뉴판을 불러오지 못했습니다. QR코드를 다시 확인해주세요.");
      }
    };
    if (token) fetchTableAndMenu();
    else { setLoading(false); setError("잘못된 접속 경로입니다."); }
  }, [token]);

  // --- 1. 모달 관련 로직 ---

  // 메뉴 클릭 시 (옵션 있으면 모달 열기, 없으면 바로 담기)
  const handleMenuClick = (menu) => {
    if (menu.is_sold_out) return;

    if (menu.option_groups && menu.option_groups.length > 0) {
      // 옵션이 있는 경우 -> 모달 열기
      setSelectedMenu(menu);
      setSelectedOptions(new Set()); // 옵션 초기화
      setIsModalOpen(true);
    } else {
      // 옵션이 없는 경우 -> 바로 장바구니
      addToCart(menu, []);
    }
  };

  // 옵션 선택 핸들러 (통합)
  const toggleOption = (group, optionId) => {
    const newOptions = new Set(selectedOptions);

    if (group.is_single_select) {
      // 1. 단일 선택(라디오)일 경우
      // 같은 그룹에 있는 다른 옵션들을 모두 찾아서 선택 해제(삭제)
      group.options.forEach(opt => {
        if (newOptions.has(opt.id)) {
          newOptions.delete(opt.id);
        }
      });
      // 그리고 지금 클릭한 것만 추가
      newOptions.add(optionId);
    } else {
      // 2. 다중 선택(체크박스)일 경우
      if (newOptions.has(optionId)) {
        newOptions.delete(optionId);
      } else {
        newOptions.add(optionId);
      }
    }
    setSelectedOptions(newOptions);
  };

  // 모달에서 "담기" 버튼 클릭
  const confirmModal = () => {
    // 선택된 옵션 객체들을 찾아서 리스트로 만듦
    const optionsToAdd = [];
    selectedMenu.option_groups.forEach(group => {
      group.options.forEach(opt => {
        if (selectedOptions.has(opt.id)) {
          optionsToAdd.push(opt);
        }
      });
    });

    addToCart(selectedMenu, optionsToAdd);
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedMenu(null);
    setSelectedOptions(new Set());
  };

  // --- 2. 장바구니 로직 ---

  // 장바구니에 추가 (메뉴 + 옵션 조합이 같으면 수량 증가, 다르면 새 항목)
  const addToCart = (menu, options) => {
    // 현재 담으려는 상품의 고유 ID 만들기 (예: "1-options:2,5")
    // 옵션 ID들을 정렬해서 문자열로 만듦 (순서 달라도 내용 같으면 같은 상품 취급)
    const optionIds = options.map(o => o.id).sort().join(",");
    const cartItemId = `${menu.id}-options:${optionIds}`;

    const existingItem = cart.find(item => item.cartItemId === cartItemId);

    if (existingItem) {
      setCart(cart.map(item => 
        item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, {
        cartItemId, // 비교용 고유 ID
        id: menu.id,
        name: menu.name,
        price: menu.price,
        selectedOptions: options, // 선택된 옵션 객체들 보관
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (cartItemId) => {
    const existing = cart.find(item => item.cartItemId === cartItemId);
    if (!existing) return;
    if (existing.quantity === 1) {
      setCart(cart.filter(item => item.cartItemId !== cartItemId));
    } else {
      setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity - 1 } : item));
    }
  };

  const increaseQuantity = (cartItemId) => {
    setCart(cart.map(item => item.cartItemId === cartItemId ? { ...item, quantity: item.quantity + 1 } : item));
  };

  // 총 가격 계산 (메뉴가격 + 옵션가격총합) * 수량
  const calculateTotal = () => {
    return cart.reduce((acc, item) => {
      const optionsPrice = item.selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
      return acc + ((item.price + optionsPrice) * item.quantity);
    }, 0);
  };

  // 주문 전송
  const handleOrder = async () => {
    if (cart.length === 0) return alert("메뉴를 담아주세요!");
    if (!window.confirm(`${calculateTotal().toLocaleString()}원 주문하시겠습니까?`)) return;

    try {
      const orderPayload = {
        store_id: tableInfo.store_id,
        table_id: tableInfo.table_id,
        items: cart.map(item => ({
          menu_id: item.id,
          quantity: item.quantity,
          options: item.selectedOptions.map(opt => ({ name: opt.name, price: opt.price }))
        }))
      };

      await axios.post(`${API_BASE_URL}/orders/`, orderPayload);
      alert("✅ 주문이 주방으로 전달되었습니다!");
      setCart([]); 
    } catch (err) {
      alert("주문 전송 실패");
      console.error(err);
    }
  };

  // 모달 가격 계산용
  const calculateModalPrice = () => {
    if (!selectedMenu) return 0;
    let total = selectedMenu.price;
    selectedMenu.option_groups.forEach(group => {
        group.options.forEach(opt => {
            if (selectedOptions.has(opt.id)) total += opt.price;
        });
    });
    return total;
  };
  

  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">⏳ 메뉴판 불러오는 중...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600 font-bold p-4 text-center">{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 상단 헤더 */}
      <div className="bg-white p-4 shadow-sm sticky top-0 z-10 border-b border-gray-100 flex flex-col items-center">
        <h1 className="text-lg font-bold text-gray-800">{store?.name}</h1>
        <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full mt-1">
          {tableInfo?.label || tableInfo?.name}
        </span>
      </div>

      {/* 메뉴 리스트 */}
      <div className="p-4 space-y-8 max-w-lg mx-auto">
        {store?.categories.map(cat => (
          <div key={cat.id}>
            <h2 className="font-extrabold text-xl mb-4 text-gray-800 pl-2 border-l-4 border-indigo-600">
              {cat.name}
            </h2>
            <div className="grid gap-4">
              {cat.menus.map(menu => (
                <div 
                  key={menu.id} 
                  onClick={() => handleMenuClick(menu)}
                  className={`bg-white p-4 rounded-xl shadow-sm flex gap-4 border border-gray-100 transition active:scale-95
                    ${menu.is_sold_out ? 'opacity-60 grayscale bg-gray-50 pointer-events-none' : 'cursor-pointer'}`}
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                    {menu.image_url ? (
                      <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🥘</div>
                    )}
                    {menu.is_sold_out && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><span className="text-white font-bold text-sm">품절</span></div>}
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <h3 className="font-bold text-lg text-gray-800 leading-tight">{menu.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{menu.price.toLocaleString()}원</p>
                    </div>
                    <div className="flex justify-end">
                        <button className="bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-lg text-sm font-bold">
                            + 담기
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* --- 옵션 선택 모달 (Overlay) --- */}
      {isModalOpen && selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">
            
            {/* 모달 헤더 */}
            <div className="p-5 border-b flex justify-between items-start bg-gray-50">
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{selectedMenu.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">기본 {selectedMenu.price.toLocaleString()}원</p>
                </div>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-2xl font-bold">&times;</button>
            </div>

            {/* 옵션 스크롤 영역 */}
            <div className="p-5 overflow-y-auto flex-1 space-y-6">
                {selectedMenu.option_groups.map(group => (
                    <div key={group.id}>
                        <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                            {group.name} 
                            {group.is_required && <span className="text-xs text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">필수</span>}
                            {group.is_single_select && <span className="text-xs text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded-full border border-yellow-200">1개만 선택</span>}
                        </h4>
                        <div className="space-y-2">
                            {group.options.map(opt => {
                                const isChecked = selectedOptions.has(opt.id);
                                return (
                                <label key={opt.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${isChecked ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-200' : 'hover:bg-gray-50'}`}>
                                    <div className="flex items-center gap-3">
                                        {/* 타입에 따라 input 모양 변경 */}
                                        <input 
                                            type={group.is_single_select ? "radio" : "checkbox"}
                                            name={`group_${group.id}`} // 라디오 그룹핑
                                            checked={isChecked}
                                            onChange={() => toggleOption(group, opt.id)}
                                            className={`w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${group.is_single_select ? 'rounded-full' : 'rounded'}`}
                                        />
                                        <span className="text-gray-700">{opt.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">+{opt.price.toLocaleString()}원</span>
                                </label>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {selectedMenu.option_groups.length === 0 && <p className="text-center text-gray-400 py-4">선택할 옵션이 없습니다.</p>}
            </div>

            {/* 모달 하단 버튼 */}
            <div className="p-4 border-t bg-white sticky bottom-0">
                <button 
                    onClick={confirmModal}
                    className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition"
                >
                    {calculateModalPrice().toLocaleString()}원 담기
                </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 장바구니 바 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 w-full max-w-lg left-1/2 -translate-x-1/2 bg-white border-t border-gray-200 shadow-[0_-5px_20px_rgba(0,0,0,0.15)] rounded-t-2xl z-40 animate-slideUp">
          
          {/* 장바구니 리스트 (접었다 폈다 할 수 있으면 좋지만 일단 심플하게 목록 노출) */}
          <div className="max-h-40 overflow-y-auto p-4 bg-gray-50 border-b">
            {cart.map((item) => (
                <div key={item.cartItemId} className="flex justify-between items-center mb-3 last:mb-0">
                    <div>
                        <div className="font-bold text-gray-800">
                            {item.name} <span className="text-indigo-600 text-sm">x{item.quantity}</span>
                        </div>
                        {item.selectedOptions.length > 0 && (
                            <p className="text-xs text-gray-500">
                                └ {item.selectedOptions.map(o => o.name).join(", ")}
                            </p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 text-sm">
                            {((item.price + item.selectedOptions.reduce((a,b)=>a+b.price,0)) * item.quantity).toLocaleString()}원
                        </span>
                        <div className="flex items-center bg-white border rounded-lg shadow-sm">
                            <button onClick={() => removeFromCart(item.cartItemId)} className="px-2.5 py-1 text-gray-500 hover:text-red-500 font-bold">-</button>
                            <button onClick={() => increaseQuantity(item.cartItemId)} className="px-2.5 py-1 text-gray-500 hover:text-blue-500 font-bold">+</button>
                        </div>
                    </div>
                </div>
            ))}
          </div>

          <div className="p-4 bg-white">
            <button 
                onClick={handleOrder}
                className="w-full bg-black text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-gray-800 transition active:scale-95 flex justify-between px-6"
            >
                <span>주문하기</span>
                <span>{calculateTotal().toLocaleString()}원</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderPage;