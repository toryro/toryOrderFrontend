import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

// [설정] 본인 IP로 수정 필수
const API_BASE_URL = "http://127.0.0.1:8000";

function OrderPage() {
  const { qr_token } = useParams(); // URL에서 QR 토큰 가져오기
  const navigate = useNavigate();
  
  const [store, setStore] = useState(null);
  const [table, setTable] = useState(null);
  const [cart, setCart] = useState([]);

  // [신규] 옵션 선택 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState(null); // 현재 선택 중인 메뉴
  const [selectedOptions, setSelectedOptions] = useState({}); // { 그룹ID: 옵션객체 }

  useEffect(() => {
    // 1. QR 토큰으로 테이블 정보 조회
    if(qr_token) {
      axios.get(`${API_BASE_URL}/tables/by-token/${qr_token}`)
      .then(res => {
        setTable(res.data);
        return axios.get(`${API_BASE_URL}/stores/${res.data.store_id}`);
      })
      .then(res => setStore(res.data))
      .catch(err => {
        alert("유효하지 않은 QR 코드입니다.");
        console.error(err);
      });
    }
  }, [qr_token]);

  // --- 메뉴 클릭 핸들러 (모달 열기) ---
  const handleMenuClick = (menu) => {
    // 옵션이 없는 메뉴라면? -> 바로 장바구니행
    if (!menu.option_groups || menu.option_groups.length === 0) {
      addToCart(menu, []);
      return;
    }

    // 옵션이 있다면? -> 모달 열기
    setSelectedMenu(menu);
    setSelectedOptions({}); // 옵션 선택 초기화
    setIsModalOpen(true);
  };

  // --- 옵션 선택 핸들러 ---
  const handleOptionSelect = (group, option) => {
    // 라디오 버튼 방식 (그룹당 1개만 선택 가능하다고 가정)
    // * 다중 선택(체크박스)이 필요하면 로직을 수정해야 함
    setSelectedOptions(prev => ({
      ...prev,
      [group.id]: option
    }));
  };

  // --- 장바구니 담기 (최종) ---
  const handleAddToCartWithOptions = () => {
    if (!selectedMenu) return;

    // 1. 필수 옵션 선택 여부 체크
    for (const group of selectedMenu.option_groups) {
        if (group.is_required && !selectedOptions[group.id]) {
            alert(`'${group.name}' 옵션을 선택해주세요!`);
            return;
        }
    }

    // 2. 선택된 옵션들을 리스트로 변환
    const optionsList = Object.values(selectedOptions);

    // 3. 장바구니에 추가
    addToCart(selectedMenu, optionsList);
    
    // 4. 모달 닫기
    setIsModalOpen(false);
    setSelectedMenu(null);
  };

  const addToCart = (menu, options = []) => {
    setCart(prev => {
      // 동일한 메뉴 + 동일한 옵션 조합이 있는지 확인
      const existingItemIndex = prev.findIndex(item => 
        item.id === menu.id && 
        JSON.stringify(item.options) === JSON.stringify(options)
      );

      if (existingItemIndex !== -1) {
        const newCart = [...prev];
        newCart[existingItemIndex].quantity += 1;
        return newCart;
      } else {
        return [...prev, { ...menu, quantity: 1, options: options }];
      }
    });
  };

  const removeFromCart = (index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // --- 주문 전송 ---
  const handleOrder = async () => {
    //alert(JSON.stringify(table));

    if (cart.length === 0) return alert("장바구니가 비어있습니다.");

    try {
        const orderItems = cart.map(item => ({
            menu_id: item.id,
            quantity: item.quantity,
            // 옵션 정보 변환 (백엔드가 원하는 포맷으로)
            options: item.options.map(opt => ({
                name: opt.name,
                price: opt.price
            }))
        }));

        // 👇 [확인용] 이 로그가 콘솔에 어떻게 찍히는지 보세요!
        console.log("전송할 테이블 ID:", table.table_id);

        await axios.post(`${API_BASE_URL}/orders/`, {
            store_id: table.store_id,
            table_id: table.table_id,
            items: orderItems
        });

        alert("주문이 접수되었습니다! 👨‍🍳");
        setCart([]); // 장바구니 비우기
    } catch (err) {
        alert("주문 실패");
        console.error(err);
    }
  };

  // 총 금액 계산 (옵션 가격 포함)
  const totalPrice = cart.reduce((sum, item) => {
      const optionsPrice = item.options.reduce((optSum, opt) => optSum + opt.price, 0);
      return sum + (item.price + optionsPrice) * item.quantity;
  }, 0);

  // 모달에서 현재 보여줄 예상 가격
  const calculateModalPrice = () => {
      if (!selectedMenu) return 0;
      const base = selectedMenu.price;
      const optSum = Object.values(selectedOptions).reduce((sum, opt) => sum + opt.price, 0);
      return base + optSum;
  };

  if (!store || !table) return <div className="text-center mt-10">가게 정보를 불러오는 중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* 상단 헤더 */}
      <header className="bg-white p-4 shadow-sm sticky top-0 z-10 text-center">
        <h1 className="text-xl font-bold">{store.name}</h1>
        <p className="text-sm text-gray-500">{table.label}</p>
      </header>

      {/* 메뉴 리스트 */}
      <main className="p-4 space-y-8">
        {store.categories.map(cat => (
          <div key={cat.id}>
            <h2 className="text-lg font-bold mb-3 border-b-2 border-gray-800 inline-block">{cat.name}</h2>
            <div className="grid grid-cols-1 gap-4">
              {cat.menus.map(menu => (
                <div 
                    key={menu.id} 
                    onClick={() => !menu.is_sold_out && handleMenuClick(menu)}
                    className={`bg-white p-4 rounded-xl shadow-sm flex gap-4 border border-gray-100 active:scale-95 transition ${menu.is_sold_out ? 'opacity-50 grayscale' : 'cursor-pointer'}`}
                >
                  <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                    {menu.image_url ? (
                        <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">🥘</div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <h3 className="font-bold text-lg">{menu.name}</h3>
                    <p className="text-gray-500 text-sm line-clamp-2">{menu.description}</p>
                    <p className="font-bold text-blue-600 mt-1">{menu.price.toLocaleString()}원</p>
                    {menu.is_sold_out && <span className="text-red-500 text-sm font-bold">품절</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </main>

      {/* --- 옵션 선택 모달 (팝업) --- */}
      {isModalOpen && selectedMenu && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                {/* 모달 헤더 */}
                <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-lg">{selectedMenu.name} 옵션 선택</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                
                {/* 옵션 스크롤 영역 */}
                <div className="p-6 overflow-y-auto flex-1">
                    {selectedMenu.option_groups.map(group => (
                        <div key={group.id} className="mb-6 last:mb-0">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="font-bold text-gray-800">{group.name}</span>
                                {group.is_required && <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-bold">필수</span>}
                            </div>
                            <div className="space-y-2">
                                {group.options.map(option => (
                                    <label key={option.id} className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="radio" 
                                                name={`group-${group.id}`} // 그룹별로 하나의 이름 공유 (라디오 버튼)
                                                className="w-5 h-5 text-blue-600"
                                                checked={selectedOptions[group.id]?.id === option.id}
                                                onChange={() => handleOptionSelect(group, option)}
                                            />
                                            <span className="text-gray-700">{option.name}</span>
                                        </div>
                                        {option.price > 0 && <span className="text-sm font-bold text-gray-500">+{option.price}원</span>}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* 모달 하단 버튼 */}
                <div className="p-4 border-t bg-gray-50">
                    <button 
                        onClick={handleAddToCartWithOptions}
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-blue-700 active:scale-95 transition flex justify-between px-8"
                    >
                        <span>담기</span>
                        <span>{calculateModalPrice().toLocaleString()}원</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 하단 장바구니 바 */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] rounded-t-2xl p-4 z-40 max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-4 px-2">
            <span className="font-bold text-lg">총 주문 금액</span>
            <span className="text-xl font-bold text-blue-600">{totalPrice.toLocaleString()}원</span>
          </div>
          
          <div className="max-h-40 overflow-y-auto mb-4 space-y-3 px-2">
            {cart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start text-sm border-b pb-2 last:border-0">
                <div>
                  <div className="font-bold flex items-center gap-2">
                      {item.name} <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">x{item.quantity}</span>
                  </div>
                  {/* 옵션 표시 */}
                  {item.options.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                          └ {item.options.map(opt => `${opt.name}`).join(", ")}
                      </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                    <span className="font-medium">
                        {((item.price + item.options.reduce((sum, opt) => sum + opt.price, 0)) * item.quantity).toLocaleString()}원
                    </span>
                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600 font-bold px-2">삭제</button>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={handleOrder}
            className="w-full bg-gray-900 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition"
          >
            주문하기
          </button>
        </div>
      )}
    </div>
  );
}

export default OrderPage;