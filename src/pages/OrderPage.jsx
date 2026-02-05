import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

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

  // 모바일 결제 복귀 처리
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const impUid = query.get("imp_uid");
    const merchantUid = query.get("merchant_uid");
    const isSuccess = (query.get("success") === "true") || (query.get("imp_success") === "true");

    if (impUid) {
      if (isSuccess) {
        axios.post(`${API_BASE_URL}/payments/complete`, { imp_uid: impUid, merchant_uid: merchantUid })
          .then(() => {
            alert("결제가 완료되었습니다! 👨‍🍳");
            setCart([]);
            navigate(`/order/${token}`, { replace: true });
          })
          .catch((err) => {
            alert(`결제 검증 실패: ${err.response?.data?.detail || "오류 발생"}`);
            navigate(`/order/${token}`, { replace: true });
          });
      } else {
        alert("결제가 취소되었습니다.");
        navigate(`/order/${token}`, { replace: true });
      }
    }
  }, [location, token, navigate]);

  // 옵션 그룹핑 헬퍼
  const getGroupedOptions = (options) => {
      const grouped = [];
      options.forEach(opt => {
          const groupName = opt.group_name || '옵션';
          const lastGroup = grouped[grouped.length - 1];
          if (lastGroup && lastGroup.name === groupName) {
              lastGroup.items.push(opt.name);
          } else {
              grouped.push({ name: groupName, items: [opt.name] });
          }
      });
      return grouped;
  };

  // 직원 호출
  const handleStaffCall = async (message) => {
    try {
      await axios.post(`${API_BASE_URL}/stores/${store.id}/calls`, { table_id: tableInfo.id, message });
      alert("🔔 직원을 호출했습니다.");
      setIsCallModalOpen(false);
    } catch (err) { alert("호출 실패"); }
  };

  // 초기 정보 로딩
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/tables/by-token/${token}`);
        setTableInfo({ id: res.data.table_id, name: res.data.label });
        const storeRes = await axios.get(`${API_BASE_URL}/stores/${res.data.store_id}`);
        setStore(storeRes.data);
      } catch (err) { alert("유효하지 않은 QR 코드입니다."); }
      finally { setLoading(false); }
    };
    fetchInfo();
  }, [token]);

  const handleMenuClick = (menu) => {
    if (menu.is_sold_out) return;

    if (menu.option_groups && menu.option_groups.length > 0) {
      const sortedGroups = [...menu.option_groups].sort((a,b) => a.order_index - b.order_index);
      const menuWithSortedGroups = { ...menu, option_groups: sortedGroups };
      
      setSelectedMenu(menuWithSortedGroups);

      const defaultOptions = new Set();
      sortedGroups.forEach(group => {
        if (group.is_single_select || group.is_required) {
            const defaultOpt = group.options.find(o => o.is_default);
            if (!defaultOpt && group.is_single_select && group.is_required && group.options.length > 0) {
                defaultOptions.add(group.options[0].id);
            } else if (defaultOpt) {
                defaultOptions.add(defaultOpt.id);
            }
        }
      });
      setSelectedOptions(defaultOptions);
      setIsModalOpen(true);
    } else {
      addToCart(menu, []);
    }
  };

  const toggleOption = (group, optionId) => {
    const newOptions = new Set(selectedOptions);

    if (group.is_single_select) {
      group.options.forEach(opt => { if (newOptions.has(opt.id)) newOptions.delete(opt.id); });
      newOptions.add(optionId);
    } else {
      if (newOptions.has(optionId)) {
          newOptions.delete(optionId);
      } else {
          if (group.max_select > 0) {
              const currentCount = Array.from(newOptions).filter(id => 
                  group.options.some(opt => opt.id === id)
              ).length;
              if (currentCount >= group.max_select) {
                  return alert(`이 옵션은 최대 ${group.max_select}개까지만 선택 가능합니다.`);
              }
          }
          newOptions.add(optionId);
      }
    }
    setSelectedOptions(newOptions);
  };

  const addToCart = (menu, options) => {
    const optionsPrice = options.reduce((sum, opt) => sum + opt.price, 0);
    const unitPrice = menu.price + optionsPrice;
    const currentOptionIds = options.map(o => o.id).sort().join(',');

    const existingItemIndex = cart.findIndex(item => {
        const itemOptionIds = item.options.map(o => o.id).sort().join(',');
        return item.menuId === menu.id && itemOptionIds === currentOptionIds;
    });

    if (existingItemIndex !== -1) {
        const newCart = [...cart];
        newCart[existingItemIndex].quantity += 1;
        setCart(newCart);
    } else {
        const newItem = {
            id: Date.now(),
            menuId: menu.id,
            name: menu.name,
            price: unitPrice,
            quantity: 1,
            options: options
        };
        setCart([...cart, newItem]);
    }
    setIsModalOpen(false);
  };

  const updateQuantity = (itemId, delta) => {
      setCart(prev => prev.map(item => {
          if (item.id === itemId) {
              return { ...item, quantity: Math.max(0, item.quantity + delta) };
          }
          return item;
      }).filter(item => item.quantity > 0));
      
      if (cart.length === 1 && cart[0].quantity + delta <= 0) setIsCartOpen(false);
  };

  const handleConfirmOptions = () => {
    for (const group of selectedMenu.option_groups) {
      if (group.is_required) {
        const hasSelected = group.options.some(opt => selectedOptions.has(opt.id));
        if (!hasSelected) return alert(`'${group.name}' 옵션은 필수입니다!`);
      }
    }
    
    const optionsList = [];
    selectedMenu.option_groups.forEach(group => {
        group.options.forEach(opt => { 
            if (selectedOptions.has(opt.id)) {
                optionsList.push({ ...opt, group_name: group.name }); 
            }
        });
    });
    addToCart(selectedMenu, optionsList);
  };

  // 주문 및 결제 처리
  const handleOrder = async (e) => {
    e.stopPropagation();
    if (cart.length === 0) return alert("장바구니가 비어있습니다.");

    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const itemsData = cart.map(item => ({
      menu_id: item.menuId,
      quantity: item.quantity,
      options: item.options.map(o => ({ name: o.name, price: o.price })),
      options_desc: item.options.map(o => o.name).join(", "),
      price: item.price
    }));

    try {
      const orderRes = await axios.post(`${API_BASE_URL}/orders/`, { store_id: store.id, table_id: tableInfo.id, items: itemsData });
      
      const { IMP } = window;
      IMP.init("imp75163120"); // ✅ 내 가게 코드

      IMP.request_pay({
        pg: "html5_inicis", 
        pay_method: "card",
        merchant_uid: `order_${orderRes.data.id}_${Date.now()}`,
        name: `${orderRes.data.items[0].menu_name} 외`,
        amount: totalAmount,
        m_redirect_url: window.location.href
      }, async (rsp) => {
        if (rsp.success) {
          await axios.post(`${API_BASE_URL}/payments/complete`, { imp_uid: rsp.imp_uid, merchant_uid: rsp.merchant_uid });
          alert("결제 완료! 👨‍🍳");
          setCart([]);
          setIsCartOpen(false);
        } else {
          alert(`결제 실패: ${rsp.error_msg}`);
        }
      });
    } catch (err) { alert("주문 생성 실패"); }
  };

  if (loading || !store) return <div className="p-10 text-center">⏳ 메뉴판 불러오는 중...</div>;

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
        {store.categories
            .filter(cat => !cat.is_hidden)
            .map(cat => {
                const visibleMenus = cat.menus.filter(m => !m.is_hidden);
                if (visibleMenus.length === 0) return null;

                return (
                  <div key={cat.id}>
                    <h2 className="font-extrabold text-xl mb-4 text-gray-800 pl-2 border-l-4 border-indigo-600">
                      {cat.name}
                      {cat.description && <span className="text-xs font-normal text-gray-500 ml-2">{cat.description}</span>}
                    </h2>
                    <div className="grid gap-4">
                      {visibleMenus.map(menu => (
                        <div 
                          key={menu.id} 
                          onClick={() => handleMenuClick(menu)}
                          className={`bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4 cursor-pointer transition active:scale-95 ${menu.is_sold_out ? 'opacity-60 grayscale' : 'hover:border-indigo-200'}`}
                        >
                          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 relative">
                            {menu.image_url ? (
                                <img src={menu.image_url} className="w-full h-full object-cover" alt={menu.name} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">🍽️</div>
                            )}
                            {menu.is_sold_out && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold">품절</div>}
                          </div>

                          <div className="flex-1 flex flex-col justify-between py-1">
                            <div className="flex justify-between items-start gap-2">
                                <h3 className="font-bold text-lg text-gray-900 leading-tight">{menu.name}</h3>
                                <div className="flex flex-col items-end shrink-0">
                                    <span className="font-bold text-gray-900">{menu.price.toLocaleString()}원</span>
                                    {!menu.is_sold_out && (
                                        <button className="mt-1 bg-indigo-50 text-indigo-600 text-[10px] px-2 py-1 rounded-full font-bold border border-indigo-100 hover:bg-indigo-100">
                                            담기 +
                                        </button>
                                    )}
                                </div>
                            </div>
                            {menu.description ? (
                                <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">{menu.description}</p>
                            ) : (
                                <p className="text-xs text-gray-300 mt-1"> </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
            })}
      </div>

      {/* 직원 호출 플로팅 버튼 */}
      <button 
          onClick={() => setIsCallModalOpen(true)}
          className="fixed bottom-24 right-4 bg-yellow-500 hover:bg-yellow-600 text-white w-14 h-14 rounded-full shadow-lg font-bold z-40 flex flex-col items-center justify-center animate-bounce-slow"
      >
          <span className="text-xl">🔔</span>
          <span className="text-[10px]">호출</span>
      </button>

      {/* 직원 호출 모달 */}
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
                          <CallOptionButton label="물 주세요 💧" onClick={() => handleStaffCall("물")} />
                          <CallOptionButton label="앞치마 주세요 👕" onClick={() => handleStaffCall("앞치마")} />
                          <CallOptionButton label="반찬 리필 🍱" onClick={() => handleStaffCall("반찬 리필")} />
                          <CallOptionButton label="물티슈 주세요 🧻" onClick={() => handleStaffCall("물티슈")} />
                          <CallOptionButton label="수저 주세요 🥄" onClick={() => handleStaffCall("수저")} />
                          <CallOptionButton label="직원만 호출 🙋" onClick={() => handleStaffCall("직원 호출")} isPrimary />
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* 장바구니 & 주문하기 바 */}
      {cart.length > 0 && (
        <>
            {isCartOpen && <div className="fixed inset-0 bg-black/50 z-20" onClick={() => setIsCartOpen(false)} />}

            <div className={`fixed bottom-0 left-0 right-0 bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-30 transition-transform duration-300 rounded-t-2xl ${isCartOpen ? 'translate-y-0' : 'translate-y-[0]'}`}>
                {isCartOpen && (
                    <div className="max-h-[50vh] overflow-y-auto p-4 space-y-3 bg-gray-50">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-lg">🛒 주문 목록</h3>
                            <button onClick={()=>setIsCartOpen(false)} className="text-sm text-gray-500">닫기 🔽</button>
                        </div>
                        {cart.map((item) => (
                            <div key={item.id} className="flex justify-between items-start bg-white p-3 rounded-lg border shadow-sm">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-gray-800">{item.name}</p>
                                        <span className="text-sm font-bold text-indigo-600">x {item.quantity}</span>
                                    </div>
                                    
                                    {item.options.length > 0 && (
                                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                                            {getGroupedOptions(item.options).map((g, idx) => (
                                                <div key={idx}>
                                                    <span className="font-semibold text-gray-600">· {g.name} :</span> {g.items.join(", ")}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    
                                    <p className="text-sm text-gray-600 mt-2 font-bold">{(item.price * item.quantity).toLocaleString()}원</p>
                                </div>
                                <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1 ml-2">
                                    <button onClick={() => updateQuantity(item.id, -1)} className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold hover:text-red-500">－</button>
                                    <span className="font-bold text-sm w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.id, 1)} className="w-6 h-6 flex items-center justify-center text-gray-500 font-bold hover:text-blue-500">＋</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <div className="p-4 border-t bg-white cursor-pointer hover:bg-gray-50 transition" onClick={() => setIsCartOpen(!isCartOpen)}>
                    <div className="max-w-lg mx-auto flex justify-between items-center mb-3">
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full text-xs font-bold">{cart.reduce((a,b)=>a+b.quantity,0)}개</span>
                            <span className="text-xs text-gray-400">목록 보기 ▲</span>
                        </div>
                        <span className="font-extrabold text-xl text-indigo-600">{cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString()}원</span>
                    </div>
                    <button onClick={handleOrder} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-700 active:scale-95 transition">주문하기</button>
                </div>
            </div>
        </>
      )}

      {/* 메뉴 옵션 모달 */}
      {isModalOpen && selectedMenu && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-t-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slideUp">
                <div className="p-5 border-b flex justify-between items-start bg-gray-50">
                    <div>
                        <h3 className="font-extrabold text-xl text-gray-900">{selectedMenu.name}</h3>
                        <p className="text-indigo-600 font-bold mt-1">{selectedMenu.price.toLocaleString()}원</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                </div>
                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                    {selectedMenu.option_groups.map(group => (
                        <div key={group.id}>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2 text-sm">
                                {group.name} 
                                {group.is_required && <span className="text-[10px] text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full font-bold">필수</span>}
                                {group.is_single_select && <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full border">1개만 선택</span>}
                                {!group.is_single_select && group.max_select > 0 && <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full font-bold">최대 {group.max_select}개</span>}
                            </h4>
                            <div className="space-y-2">
                                {group.options.map(opt => {
                                    const isChecked = selectedOptions.has(opt.id);
                                    return (
                                    <label key={opt.id} className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition ${isChecked ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'hover:bg-gray-50 border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type={group.is_single_select ? "radio" : "checkbox"}
                                                name={`group_${group.id}`}
                                                checked={isChecked}
                                                onChange={() => toggleOption(group, opt.id)}
                                                className={`w-5 h-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 ${group.is_single_select ? 'rounded-full' : 'rounded'}`}
                                            />
                                            <span className={`text-sm ${isChecked ? 'font-bold text-indigo-900' : 'text-gray-700'}`}>{opt.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">+{opt.price.toLocaleString()}원</span>
                                    </label>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                    {selectedMenu.option_groups.length === 0 && <p className="text-center text-gray-400 py-4 text-sm">추가 선택할 옵션이 없습니다.</p>}
                </div>
                <div className="p-4 border-t bg-white">
                    <button onClick={handleConfirmOptions} className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-indigo-700 transition shadow-lg">
                        {(selectedMenu.price + Array.from(selectedOptions).reduce((sum, id) => {
                            const opt = selectedMenu.option_groups.flatMap(g=>g.options).find(o=>o.id===id);
                            return sum + (opt ? opt.price : 0);
                        }, 0)).toLocaleString()}원 담기
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}

function CallOptionButton({ label, onClick, isPrimary }) {
    return (
        <button 
            onClick={onClick} 
            className={`border rounded-xl p-4 font-bold transition flex items-center justify-center text-center h-20 shadow-sm
                ${isPrimary 
                    ? "bg-yellow-50 border-yellow-400 text-yellow-800 hover:bg-yellow-100" 
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-400"
                }`}
        >
            {label}
        </button>
    );
}

export default OrderPage;