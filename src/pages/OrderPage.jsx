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
  
    // 🛒 장바구니 및 옵션 관련 상태
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState(new Set());

    // 🔔 직원 호출 관련 상태
    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [callOptions, setCallOptions] = useState([]);

    // 주문 완료 모달 상태
    const [completedOrder, setCompletedOrder] = useState(null);
    const isProcessing = useRef(false);

    // 1️⃣. 초기 데이터 로딩 (에러 핸들링 분리 완료!)
    useEffect(() => {
        const fetchInfo = async () => {
            try {
                // 1. 토큰으로 테이블 정보 가져오기
                const res = await axios.get(`${API_BASE_URL}/tables/by-token/${token}`);
                setTableInfo({ id: res.data.table_id, name: res.data.label });
                
                // 2. 테이블이 속한 매장 정보 가져오기
                const storeRes = await axios.get(`${API_BASE_URL}/stores/${res.data.store_id}`);
                setStore(storeRes.data);
                
                // 3. ✨ [수정됨] 직원 호출 옵션은 실패해도 메인 화면을 망치지 않도록 분리!
                try {
                    const callRes = await axios.get(`${API_BASE_URL}/stores/${res.data.store_id}/call-options`);
                    setCallOptions(callRes.data);
                } catch (callErr) {
                    console.warn("호출 옵션을 불러올 수 없어 기본값만 사용합니다.");
                    setCallOptions([]); // 옵션이 없으면 빈 배열로 두고 '직원만 호출'만 표시
                }
                
            } catch (err) { 
                toast.error("유효하지 않은 QR 코드입니다."); 
            } finally { 
                setLoading(false); 
            }
        };
        fetchInfo();
    }, [token]);

    // 2️⃣. 모바일 결제 복귀 처리
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
                    setIsCartOpen(false); 
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
                .finally(() => { isProcessing.current = false; });
            } else {
                toast.error("결제가 취소되었습니다.");
                isProcessing.current = false;
                navigate(`/order/${token}`, { replace: true });
            }
        }
    }, [location, token, navigate]);

    // 🔔 직원 호출 핸들러
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
            toast.error("호출에 실패했습니다.");
        }
    };

    // 🛒 장바구니 수량 업데이트 
    const updateQuantity = (itemId, delta) => {
        setCart(prev => {
            const nextCart = prev.map(item => {
                if (item.id === itemId) return { ...item, quantity: Math.max(0, item.quantity + delta) };
                return item;
            }).filter(item => item.quantity > 0);
            
            if (nextCart.length === 0) setIsCartOpen(false);
            return nextCart;
        });
    };

    // 🍔 메뉴 옵션 토글
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

    // 🍔 메뉴 옵션 담기 완료
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
        toast.success(`${selectedMenu.name}이(가) 담겼습니다.`);
    };

    // 💳 주문 및 결제 실행
    const handleOrder = async (e) => {
        e.stopPropagation();
        if (cart.length === 0) return toast.error("장바구니가 비어있습니다.");
        if (isProcessing.current) return;
        isProcessing.current = true;

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
            const tempDailyNumber = orderRes.data.daily_number;

            const { IMP } = window;
            IMP.init("imp75163120"); // 가맹점 식별코드

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
            const errorMsg = err.response?.data?.detail || "주문 생성 실패";
            toast.error(`🚫 주문 불가: ${errorMsg}`); 
            isProcessing.current = false;
        }
    };

    if (loading || !store) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">⏳ 메뉴판 로딩 중...</div>;

    const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-28 font-sans">
            
            {/* 상단 헤더 */}
            <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-4 flex justify-between items-center">
                <div>
                    <h1 className="font-extrabold text-xl text-gray-800">{store.name}</h1>
                    <p className="text-sm text-indigo-600 font-bold">📍 {tableInfo?.name}</p>
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
                                        const existingItem = cart.find(item => item.menuId === menu.id && item.options.length === 0);
                                        if (existingItem) {
                                            updateQuantity(existingItem.id, 1);
                                            toast.success(`${menu.name} 수량이 추가되었습니다.`);
                                        } else {
                                            const newItem = { id: Date.now(), menuId: menu.id, name: menu.name, price: menu.price, quantity: 1, options: [] };
                                            setCart(prev => [...prev, newItem]);
                                            toast.success(`${menu.name}이(가) 담겼습니다.`);
                                        }
                                    }
                                }} className={`bg-white p-4 rounded-xl border shadow-sm flex gap-4 transition active:scale-95 ${menu.is_sold_out ? 'opacity-50 grayscale' : 'hover:border-indigo-300 cursor-pointer'}`}>
                                    
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <h3 className="font-bold text-lg text-gray-900">{menu.name}</h3>
                                            <p className="text-gray-500 text-sm mt-0.5 line-clamp-1">{menu.description}</p>
                                        </div>
                                        <span className="font-black text-indigo-600 mt-2">{menu.price.toLocaleString()}원</span>
                                    </div>
                                    
                                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative shrink-0">
                                        {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="text-3xl flex items-center justify-center h-full">🍽️</div>}
                                        {menu.is_sold_out && <div className="absolute inset-0 bg-black/60 text-white flex items-center justify-center font-bold">품절</div>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* 하단 고정 주문/호출 네비게이션 바 */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40 flex gap-3 pb-safe">
                
                <button onClick={() => setIsCallModalOpen(true)} className="flex flex-col items-center justify-center bg-gray-100 text-gray-700 w-[72px] rounded-xl font-bold text-[11px] active:bg-gray-200 transition">
                    <span className="text-2xl mb-0.5">🔔</span>
                    호출
                </button>
                
                <button onClick={() => setIsCartOpen(true)} disabled={cart.length === 0} className={`flex-1 flex justify-between items-center px-5 rounded-xl font-bold text-lg transition shadow-lg ${cart.length > 0 ? 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]' : 'bg-gray-200 text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl opacity-90">🛒</span>
                        {cart.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalCartCount}</span>}
                    </div>
                    <span>{cart.length > 0 ? `${totalCartPrice.toLocaleString()}원 주문하기` : '장바구니 비어있음'}</span>
                </button>
            </div>

            {/* 장바구니 내역 모달 */}
            {isCartOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex flex-col justify-end animate-fadeIn" onClick={() => setIsCartOpen(false)}>
                    <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl flex flex-col max-h-[85vh] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] animate-slideUp" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-black text-gray-900">🛒 주문할 내역</h2>
                            <button onClick={() => setIsCartOpen(false)} className="text-gray-400 text-3xl font-light">&times;</button>
                        </div>
                        
                        <div className="overflow-y-auto p-4 space-y-3 flex-1 bg-gray-50">
                            {cart.map((item) => (
                                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex justify-between items-center">
                                    <div className="flex-1 pr-4">
                                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                                        {item.options.length > 0 && (
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                └ {item.options.map(o => o.name).join(', ')}
                                            </p>
                                        )}
                                        <p className="font-black text-indigo-600 mt-1">{(item.price * item.quantity).toLocaleString()}원</p>
                                    </div>
                                    <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                                        <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center bg-white rounded-lg font-bold text-gray-600 shadow-sm">-</button>
                                        <span className="font-black text-gray-900 w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-lg font-bold shadow-sm">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-5 bg-white border-t border-gray-200 shrink-0 pb-safe">
                            <div className="flex justify-between items-center mb-4 px-1">
                                <span className="font-bold text-gray-500">결제 예정 금액</span>
                                <span className="font-black text-2xl text-red-500">{totalCartPrice.toLocaleString()}원</span>
                            </div>
                            <button onClick={handleOrder} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black text-xl shadow-xl active:scale-[0.98] transition-transform">
                                결제 진행하기
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 직원 호출 모달 */}
            {isCallModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn" onClick={() => setIsCallModalOpen(false)}>
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-800 text-white p-5 font-bold text-lg flex justify-between items-center">
                            <span className="flex items-center gap-2"><span className="text-2xl">🔔</span> 직원 호출</span>
                            <button onClick={() => setIsCallModalOpen(false)} className="text-gray-300 hover:text-white text-2xl leading-none">&times;</button>
                        </div>
                        <div className="p-6 bg-gray-50">
                            <p className="text-center text-gray-500 mb-5 text-sm font-bold">필요하신 서비스를 선택해주세요.</p>
                            <div className="grid grid-cols-2 gap-3">
                                {callOptions.map((opt) => (
                                    <button key={opt.id} onClick={() => handleStaffCall(opt.name)} className="bg-white border-2 border-gray-200 text-gray-700 rounded-2xl p-4 font-bold text-sm active:bg-gray-100 transition shadow-sm h-16 flex items-center justify-center text-center">
                                        {opt.name}
                                    </button>
                                ))}
                                <button onClick={() => handleStaffCall("직원 호출")} className="col-span-2 bg-yellow-50 border-2 border-yellow-400 text-yellow-800 rounded-2xl p-4 font-bold text-base active:bg-yellow-100 transition shadow-sm flex items-center justify-center gap-2 h-16">
                                    직원만 호출할게요 🙋
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 메뉴 상세 옵션 모달 */}
            {isModalOpen && selectedMenu && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 pb-safe animate-slideUp">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black">{selectedMenu.name}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 text-3xl font-light">&times;</button>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto mb-4 space-y-6">
                            {selectedMenu.option_groups.map(group => (
                                <div key={group.id}>
                                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                        {group.name} 
                                        {group.is_required && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-black">필수</span>}
                                    </h4>
                                    <div className="space-y-2">
                                        {group.options.map(opt => {
                                            const isChecked = selectedOptions.has(opt.id);
                                            return (
                                                <label key={opt.id} className={`flex justify-between items-center p-4 border-2 rounded-xl cursor-pointer transition ${isChecked ? 'bg-indigo-50 border-indigo-500' : 'border-gray-100'}`}>
                                                    <div className="flex items-center gap-3">
                                                        <input type={group.is_single_select ? "radio" : "checkbox"} checked={isChecked} onChange={() => toggleOption(group, opt.id)} className="w-5 h-5 accent-indigo-600"/>
                                                        <span className={`font-bold ${isChecked ? 'text-indigo-700' : 'text-gray-700'}`}>{opt.name}</span>
                                                    </div>
                                                    <span className={`font-bold ${isChecked ? 'text-indigo-700' : 'text-gray-500'}`}>+{opt.price.toLocaleString()}원</span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={handleConfirmOptions} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg active:bg-indigo-700 shadow-xl">옵션 선택 완료</button>
                    </div>
                </div>
            )}

            {/* 주문 완료 모달 */}
            {completedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white rounded-3xl w-[90%] max-w-sm p-8 text-center shadow-2xl">
                        <div className="text-6xl mb-4 animate-bounce">🎫</div>
                        <h2 className="text-2xl font-extrabold text-gray-800 mb-2">주문이 접수되었습니다!</h2>
                        <p className="text-gray-500 mb-6">아래 번호를 기억해주세요.</p>
                        <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 mb-8">
                            <p className="text-sm text-indigo-500 font-bold mb-1">나의 주문 번호</p>
                            <p className="text-6xl font-black text-indigo-600 tracking-tighter">#{completedOrder}</p>
                        </div>
                        <button onClick={() => setCompletedOrder(null)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg active:scale-95 transition">확인했습니다 👍</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPage;