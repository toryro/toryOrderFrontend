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
    const [isCartOpen, setIsCartOpen] = useState(false); 
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [selectedOptions, setSelectedOptions] = useState(new Set());

    const [isCallModalOpen, setIsCallModalOpen] = useState(false);
    const [callOptions, setCallOptions] = useState([]);

    // { dailyNumber, orderId, viewToken }
    const [completedOrder, setCompletedOrder] = useState(null);
    const isProcessing = useRef(false);

    const [orderType, setOrderType] = useState("DINE_IN");
    const [orderTypeSetting, setOrderTypeSetting] = useState("SELECTABLE");
    const [isVirtual, setIsVirtual] = useState(false);
    const [tableType, setTableType] = useState("DINE_IN");
    const [sessionExpired, setSessionExpired] = useState(false);
    const [customerPhone, setCustomerPhone] = useState("");
    const sessionTokenRef = useRef(null);

    const getActivePrice = (menu) => {
        if (!menu.is_discounted || !menu.discount_price) return menu.price;
        if (menu.time_sale_start && menu.time_sale_end) {
            const now = new Date().getTime(); 
            const start = new Date(menu.time_sale_start).getTime(); 
            const end = new Date(menu.time_sale_end).getTime(); 
            if (now >= start && now <= end) {
                return menu.discount_price;
            }
            return menu.price; 
        }
        return menu.discount_price; 
    };

    useEffect(() => {
        const fetchInfo = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/tables/by-token/${token}`);
                const virtual = res.data.is_virtual === true;
                const tType = res.data.table_type || "DINE_IN";
                setIsVirtual(virtual);
                setTableType(tType);
                setTableInfo({ id: res.data.table_id, name: res.data.label });
                setOrderTypeSetting(res.data.order_type_setting);

                if (virtual || tType === "TAKEOUT_COUNTER" || res.data.order_type_setting === "TAKEOUT_ONLY") {
                    setOrderType("TAKEOUT");
                } else {
                    setOrderType("DINE_IN");
                }

                if (!virtual) {
                    const storageKey = `ts_${token}`;
                    let existingToken = sessionStorage.getItem(storageKey);
                    if (!existingToken) {
                        const sessionRes = await axios.post(`${API_BASE_URL}/tables/by-token/${token}/session`);
                        existingToken = sessionRes.data.session_token;
                        sessionStorage.setItem(storageKey, existingToken);
                    }
                    sessionTokenRef.current = existingToken;
                }

                const storeRes = await axios.get(`${API_BASE_URL}/stores/${res.data.store_id}`);
                setStore(storeRes.data);

                if (!virtual) {
                    try {
                        const callRes = await axios.get(`${API_BASE_URL}/stores/${res.data.store_id}/call-options`);
                        setCallOptions(callRes.data);
                    } catch { setCallOptions([]); }
                }
            } catch (err) {
                toast.error("유효하지 않은 QR 코드입니다.");
            } finally {
                setLoading(false);
            }
        };
        fetchInfo();
        
        const timer = setInterval(() => setStore(prev => ({...prev})), 60000);
        return () => clearInterval(timer);
    }, [token]);

    useEffect(() => {
        const query = new URLSearchParams(location.search);
        const impUid = query.get("imp_uid");
        const merchantUid = query.get("merchant_uid");
        const isSuccess = (query.get("success") === "true") || (query.get("imp_success") === "true");

        if (impUid && !isProcessing.current) {
            isProcessing.current = true;
            if (isSuccess) {
                const redirectSessionToken = sessionStorage.getItem(`ts_${token}`);
                axios.post(`${API_BASE_URL}/payments/complete`, {
                    imp_uid: impUid,
                    merchant_uid: merchantUid,
                    virtual_session_token: isVirtual ? token : undefined,
                    session_token: tableType === "TAKEOUT_COUNTER" ? redirectSessionToken : undefined,
                })
                .then((res) => {
                    const dailyNum = res.data.daily_number || "확인중";
                    setCompletedOrder({ dailyNumber: dailyNum, orderId: res.data.order_id, viewToken: res.data.view_token });
                    setCart([]);
                    setIsCartOpen(false); 
                    navigate(`/order/${token}`, { replace: true });
                })
                .catch((err) => {
                    if (err.response?.data?.status === "already_paid") {
                        setCompletedOrder({ dailyNumber: "완료", orderId: null, viewToken: null });
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

    useEffect(() => {
        const SESSION_TIMEOUT_MS = 20 * 60 * 1000; 
        let lastActiveTime = Date.now(); 

        const updateLastActiveTime = () => {
            lastActiveTime = Date.now();
        };

        const executeTimeout = () => {
            toast.error("장시간 활동이 없어 안전을 위해 주문 화면이 초기화되었습니다.");
            setCart([]); 
            setIsCartOpen(false);
            setSelectedOptions(new Set());
            window.location.reload(); 
        };

        const checkTimeoutInterval = setInterval(() => {
            if (Date.now() - lastActiveTime > SESSION_TIMEOUT_MS) {
                executeTimeout();
            }
        }, 60000); 

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                if (Date.now() - lastActiveTime > SESSION_TIMEOUT_MS) {
                    executeTimeout();
                }
            }
        };

        const events = ['touchstart', 'click', 'scroll', 'keydown'];
        events.forEach(event => window.addEventListener(event, updateLastActiveTime));
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            events.forEach(event => window.removeEventListener(event, updateLastActiveTime));
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            clearInterval(checkTimeoutInterval);
        };
    }, []);

    const handleStaffCall = async (message) => {
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/calls`, { table_id: tableInfo.id, message: message });
            toast.success(`🔔 '${message}' 요청을 보냈습니다.`);
            setIsCallModalOpen(false);
        } catch (err) { toast.error("호출에 실패했습니다."); }
    };

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
        
        const unitPrice = selectedMenu.activePrice + optionsList.reduce((s,o)=>s+o.price,0);
        const newItem = { id: Date.now(), menuId: selectedMenu.id, name: selectedMenu.name, price: unitPrice, quantity: 1, options: optionsList };
        
        setCart(prev => [...prev, newItem]);
        setIsModalOpen(false);
        toast.success(`${selectedMenu.name}이(가) 담겼습니다.`);
    };

    const handleOrder = async (e) => {
        e.stopPropagation();
        if (cart.length === 0) return toast.error("장바구니가 비어있습니다.");
        
        if (isProcessing.current) return;
        isProcessing.current = true; 

        const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const isTakeoutCounter = tableType === "TAKEOUT_COUNTER";
        // 긴급 모드 OR 후불 매장 → is_post_pay=true (PortOne 결제 건너뜀)
        const isEmergency = store.is_emergency_mode;
        const isPostPayStore = isEmergency || (!isVirtual && !isTakeoutCounter && store.payment_policy === "POST_PAY");

        const itemsData = cart.map(item => ({
            menu_id: item.menuId,
            quantity: item.quantity,
            options: item.options.map(o => ({ name: o.name, price: o.price })),
            options_desc: item.options.map(o => o.name).join(", "),
            price: item.price
        }));

        try {
            const isTakeoutOrder = orderType === "TAKEOUT" || isVirtual || isTakeoutCounter;
            const orderRes = await axios.post(`${API_BASE_URL}/orders/`, {
                store_id: store.id,
                table_id: tableInfo.id,
                items: itemsData,
                is_post_pay: isPostPayStore,
                order_type: orderType,
                session_token: sessionTokenRef.current ?? undefined,
                customer_phone: isTakeoutOrder && customerPhone ? customerPhone.replace(/\D/g, "") : undefined,
            });
            const tempDailyNumber = orderRes.data.daily_number;

            if (isPostPayStore) {
                setCompletedOrder({ dailyNumber: tempDailyNumber, orderId: orderRes.data.id, viewToken: orderRes.data.view_token });
                setCart([]);
                setIsCartOpen(false);
                isProcessing.current = false;
                const payMsg = isEmergency
                    ? "주문이 접수됐습니다. 현재 온라인 결제가 일시 중단되어 카운터에서 결제해 주세요."
                    : store.has_pos
                        ? "주문이 접수되었습니다. 포스기에서 결제해주세요!"
                        : "주문이 접수되었습니다. 결제는 나갈 때 카운터에서 해주세요!";
                toast.success(payMsg, { duration: 5000 });
                return;
            }

            const { IMP } = window;
            if (!IMP) {
                isProcessing.current = false; 
                return toast.error("포트원 결제 모듈을 불러오지 못했습니다.");
            }
            
            IMP.init("imp75163120"); 

            const orderName = cart.length > 1 
                ? `${cart[0].name} 외 ${cart.length - 1}건` 
                : cart[0].name;

            IMP.request_pay({
                pg: "html5_inicis", 
                pay_method: "card",
                merchant_uid: `order_${orderRes.data.id}_${new Date().getTime()}`,
                name: orderName,
                amount: totalAmount,
                buyer_email: "guest@tory.com",
                buyer_name: "테이블손님",
                buyer_tel: "010-0000-0000",
                m_redirect_url: `${window.location.origin}/order/${token}`
            }, async (rsp) => {
                if (rsp.success) {
                    try {
                        const verifyRes = await axios.post(`${API_BASE_URL}/payments/complete`, {
                            imp_uid: rsp.imp_uid,
                            merchant_uid: rsp.merchant_uid,
                            virtual_session_token: isVirtual ? token : undefined,
                            session_token: isTakeoutCounter ? sessionTokenRef.current : undefined,
                        });

                        setCompletedOrder({ dailyNumber: tempDailyNumber, orderId: orderRes.data.id, viewToken: verifyRes.data.view_token });
                        setCart([]);
                        setIsCartOpen(false);
                        toast.success("결제 및 주문이 완료되었습니다!");
                    } catch (verifyErr) {
                        console.error("검증 에러:", verifyErr);
                        toast.error("결제는 되었으나 주문 처리에 실패했습니다. 직원을 호출해주세요.");
                    }
                } else {
                    toast.error(`결제가 취소되었거나 실패했습니다: ${rsp.error_msg}`);
                }
                
                isProcessing.current = false; 
            });

        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.detail === "SESSION_EXPIRED") {
                // sessionStorage는 지우지 않음 — 만료된 토큰을 유지해야 새로고침 후에도 차단이 유지됨
                // (지우면 새로고침 시 새 세션이 발급되어 주문 가능해지는 버그 발생)
                sessionTokenRef.current = null;
                setSessionExpired(true);
                setIsCartOpen(false);
            } else {
                console.error("주문 생성 에러:", err);
                toast.error(`🚫 주문 불가: ${err.response?.data?.detail || "주문 생성 실패"}`);
            }
            isProcessing.current = false;
        }
    };

    if (loading || !store) return <div className="min-h-screen flex items-center justify-center font-bold text-gray-500">⏳ 메뉴판 로딩 중...</div>;

    if (sessionExpired) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white rounded-3xl w-full max-w-sm p-8 text-center shadow-2xl">
                <div className="text-6xl mb-4">🔒</div>
                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">주문 세션 만료</h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    테이블 퇴석 처리로 인해<br/>이 세션이 만료되었습니다.<br/>새로운 QR 코드를 스캔해주세요.
                </p>
                <div className="bg-slate-100 rounded-2xl p-4">
                    <p className="text-xs text-slate-500 font-bold">테이블 QR 코드를 다시 스캔하면<br/>새로운 주문을 시작할 수 있습니다.</p>
                </div>
            </div>
        </div>
    );

    const totalCartPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <div className="min-h-screen bg-gray-50 pb-28 font-sans">
            <div className={`shadow-sm sticky top-0 z-10 px-4 py-4 flex justify-between items-center ${isVirtual || tableType === "TAKEOUT_COUNTER" ? "bg-orange-500 text-white" : "bg-white"}`}>
                <div>
                    <h1 className={`font-extrabold text-xl ${isVirtual || tableType === "TAKEOUT_COUNTER" ? "text-white" : "text-gray-800"}`}>{store.name}</h1>
                    <p className={`text-sm font-bold ${isVirtual || tableType === "TAKEOUT_COUNTER" ? "text-orange-100" : "text-indigo-600"}`}>
                        {isVirtual ? "🎁 포장 주문 (선결제 필수)"
                            : tableType === "TAKEOUT_COUNTER" ? `📦 ${tableInfo?.name} (선결제 필수)`
                            : `📍 ${tableInfo?.name}`}
                    </p>
                </div>
                {isVirtual && (
                    <span className="bg-white text-orange-600 text-xs font-black px-3 py-1.5 rounded-full shadow-sm">1회용 링크</span>
                )}
                {tableType === "TAKEOUT_COUNTER" && (
                    <span className="bg-white text-orange-600 text-xs font-black px-3 py-1.5 rounded-full shadow-sm">포장 전용</span>
                )}
            </div>

            {store.is_emergency_mode && (
                <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-3">
                    <span className="text-xl shrink-0">🚨</span>
                    <p className="text-sm font-bold leading-snug">
                        현재 온라인 결제가 일시 중단됩니다.<br />
                        <span className="font-extrabold">주문 후 카운터에서 현금 또는 카드로 결제해 주세요.</span>
                    </p>
                </div>
            )}

            <div className="p-4 space-y-8 max-w-lg mx-auto">
                {store.categories.filter(c=>!c.is_hidden).map(cat => (
                    <div key={cat.id}>
                        <h2 className="font-extrabold text-xl mb-4 text-gray-800 pl-2 border-l-4 border-indigo-600">{cat.name}</h2>
                        <div className="grid gap-4">
                            {cat.menus.filter(m=>!m.is_hidden).map(menu => {
                                const currentPrice = getActivePrice(menu);
                                const isDiscountActive = currentPrice < menu.price;

                                return (
                                    <div key={menu.id} onClick={() => {
                                        if(menu.is_sold_out) return;
                
                                        // ✨ 수정됨: 여기서 기본 옵션값을 정확히 찾아서 담습니다! (에러 없앰)
                                        if(menu.option_groups?.length > 0 || store.use_menu_detail) {
                                            setSelectedMenu({...menu, activePrice: currentPrice}); 
                                            
                                            // 기본 선택된 옵션의 ID를 바구니에 담기
                                            const initialOptions = new Set();
                                            if (menu.option_groups) {
                                                menu.option_groups.forEach(group => {
                                                    if (group.options) {
                                                        group.options.forEach(opt => {
                                                            if (opt.is_default) {
                                                                initialOptions.add(opt.id); // ID로 저장!
                                                            }
                                                        });
                                                    }
                                                });
                                            }
                                            setSelectedOptions(initialOptions); 
                                            setIsModalOpen(true);
                                            
                                        } else {
                                            const existingItem = cart.find(item => item.menuId === menu.id && item.options.length === 0);
                                            if (existingItem) {
                                                updateQuantity(existingItem.id, 1);
                                                toast.success(`${menu.name} 수량이 추가되었습니다.`);
                                            } else {
                                                const newItem = { id: Date.now(), menuId: menu.id, name: menu.name, price: currentPrice, quantity: 1, options: [] };
                                                setCart(prev => [...prev, newItem]);
                                                toast.success(`${menu.name}이(가) 담겼습니다.`);
                                            }
                                        }
                                    }} className={`bg-white p-4 rounded-xl border shadow-sm flex gap-4 transition active:scale-95 ${menu.is_sold_out ? 'opacity-50 grayscale' : 'hover:border-indigo-300 cursor-pointer'}`}>
                                        
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-900 flex items-center flex-wrap gap-1">
                                                    {menu.name}
                                                    {isDiscountActive && (
                                                        <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse shadow-sm">
                                                            {menu.time_sale_start ? "TIME SALE ⏰" : "SALE"}
                                                        </span>
                                                    )}
                                                </h3>
                                                <p className="text-gray-500 text-sm mt-1 line-clamp-2">{menu.description}</p>
                                            </div>
                                            <div className="mt-2">
                                                {isDiscountActive ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-gray-400 line-through font-bold">{menu.price.toLocaleString()}원</span>
                                                        <span className="font-black text-red-600 text-lg">{currentPrice.toLocaleString()}원</span>
                                                    </div>
                                                ) : (
                                                    <span className="font-black text-indigo-600 text-lg">{menu.price.toLocaleString()}원</span>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden relative shrink-0 border border-gray-200 shadow-inner">
                                            {menu.image_url ? <img src={menu.image_url} className="w-full h-full object-cover"/> : <div className="text-3xl flex items-center justify-center h-full opacity-50">🍽️</div>}
                                            {menu.is_sold_out && <div className="absolute inset-0 bg-black/60 text-white flex items-center justify-center font-bold">품절</div>}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-3 px-4 shadow-[0_-5px_15px_rgba(0,0,0,0.05)] z-40 flex gap-3 pb-safe">
                {!isVirtual && (
                    <button onClick={() => setIsCallModalOpen(true)} className="flex flex-col items-center justify-center bg-gray-100 text-gray-700 w-[72px] rounded-xl font-bold text-[11px] active:bg-gray-200 transition">
                        <span className="text-2xl mb-0.5">🔔</span>
                        호출
                    </button>
                )}
                <button onClick={() => setIsCartOpen(true)} disabled={cart.length === 0} className={`flex-1 flex justify-between items-center px-5 rounded-xl font-bold text-lg transition shadow-lg ${cart.length > 0 ? (isVirtual ? 'bg-orange-500 text-white hover:bg-orange-600' : 'bg-indigo-600 text-white hover:bg-indigo-700') + ' active:scale-[0.98]' : 'bg-gray-200 text-gray-400'}`}>
                    <div className="flex items-center gap-2">
                        <span className="text-2xl opacity-90">{isVirtual ? "🎁" : "🛒"}</span>
                        {cart.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{totalCartCount}</span>}
                    </div>
                    <span>{cart.length > 0 ? `${totalCartPrice.toLocaleString()}원 주문하기` : '장바구니 비어있음'}</span>
                </button>
            </div>

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
                                        {item.options.length > 0 && <p className="text-xs text-gray-500 mt-1 line-clamp-2">└ {item.options.map(o => o.name).join(', ')}</p>}
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
                            
                            <div className="mb-4">
                                {isVirtual ? (
                                    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 p-3 rounded-xl">
                                        <span className="text-2xl">🎁</span>
                                        <div>
                                            <p className="font-black text-orange-700 text-sm">포장 전용 주문 (선결제 필수)</p>
                                            <p className="text-orange-500 text-xs mt-0.5">결제 후 이 링크는 자동으로 만료됩니다.</p>
                                        </div>
                                    </div>
                                ) : tableType === "TAKEOUT_COUNTER" ? (
                                    <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 p-3 rounded-xl">
                                        <span className="text-2xl">📦</span>
                                        <div>
                                            <p className="font-black text-orange-700 text-sm">포장 카운터 주문 (선결제 필수)</p>
                                            <p className="text-orange-500 text-xs mt-0.5">결제 완료 후 카운터에서 수령하세요.</p>
                                        </div>
                                    </div>
                                ) : orderTypeSetting === "SELECTABLE" ? (
                                    <div className="flex bg-gray-100 p-1 rounded-xl">
                                        <button onClick={() => setOrderType("DINE_IN")} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${orderType === "DINE_IN" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>🍽️ 매장 식사</button>
                                        <button onClick={() => setOrderType("TAKEOUT")} className={`flex-1 py-2 font-bold text-sm rounded-lg transition-colors ${orderType === "TAKEOUT" ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}>🎁 포장하기</button>
                                    </div>
                                ) : orderTypeSetting === "DINE_IN_ONLY" ? (
                                    <div className="text-center py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-sm">🍽️ 매장 식사 전용 테이블입니다.</div>
                                ) : (
                                    <div className="text-center py-2 bg-orange-50 text-orange-700 rounded-lg font-bold text-sm">🎁 포장 전용 주문입니다.</div>
                                )}
                            </div>

                            {(orderType === "TAKEOUT" || isVirtual || tableType === "TAKEOUT_COUNTER") && (
                                <div className="mb-4">
                                    <label className="block text-xs font-bold text-gray-500 mb-1.5">
                                        📱 완료 알림 받을 전화번호 <span className="font-normal text-gray-400">(선택)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="010-1234-5678"
                                        value={customerPhone}
                                        onChange={e => setCustomerPhone(e.target.value)}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-orange-300 bg-orange-50 placeholder:font-normal placeholder:text-gray-400"
                                    />
                                    {customerPhone && (
                                        <p className="text-xs text-orange-500 mt-1 font-bold">
                                            포장 완료 시 알림을 보내드립니다.
                                        </p>
                                    )}
                                </div>
                            )}

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

            {isModalOpen && selectedMenu && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 pb-safe animate-slideUp flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        
                        <div className="flex justify-end mb-2 shrink-0">
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 bg-gray-100 hover:bg-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-2xl font-light transition">&times;</button>
                        </div>

                        <div className="overflow-y-auto overflow-x-hidden flex-1 -mx-2 px-2 pb-4 space-y-5 scrollbar-hide">
                            
                            {selectedMenu.image_url && (
                                <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                                    <img src={selectedMenu.image_url} className="w-full h-full object-cover" alt={selectedMenu.name} />
                                </div>
                            )}

                            <div className="space-y-3">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900">{selectedMenu.name}</h3>
                                    <p className="text-indigo-600 font-black text-2xl mt-1">{selectedMenu.activePrice.toLocaleString()}원</p>
                                </div>
                                
                                {selectedMenu.description && (
                                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed font-medium">
                                            {selectedMenu.description}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {selectedMenu.option_groups?.length > 0 && (
                                <div className="space-y-6 pt-4 border-t border-gray-100">
                                    <h4 className="font-extrabold text-lg text-gray-800">추가 옵션 선택</h4>
                                    {selectedMenu.option_groups.map(group => (
                                        <div key={group.id} className="bg-white rounded-xl">
                                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                {group.name} 
                                                {group.is_required && <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded font-black">필수</span>}
                                            </h4>
                                            <div className="space-y-2">
                                                {group.options.map(opt => {
                                                    // ✨ 수정됨: 여기서 오타를 수정하고, Set의 올바른 확인 방식(.has)을 적용했습니다!
                                                    const isChecked = selectedOptions.has(opt.id);
                                                    
                                                    return (
                                                        <label key={opt.id} className={`flex justify-between items-center p-4 border-2 rounded-xl cursor-pointer transition ${isChecked ? 'bg-indigo-50 border-indigo-500' : 'border-gray-100 hover:border-indigo-200'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <input type={group.is_single_select ? "radio" : "checkbox"} checked={isChecked} onChange={() => toggleOption(group, opt.id)} className="w-5 h-5 accent-indigo-600 cursor-pointer"/>
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
                            )}
                        </div>

                        <div className="pt-4 shrink-0 border-t border-gray-100 bg-white">
                            <button onClick={handleConfirmOptions} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-extrabold text-lg hover:bg-indigo-700 active:scale-[0.98] transition shadow-xl flex items-center justify-center gap-2">
                                <span>🛒</span> 
                                {selectedMenu.option_groups?.length > 0 ? "이대로 장바구니 담기" : "장바구니 담기"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {completedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
                    <div className="bg-white rounded-3xl w-[90%] max-w-sm p-8 text-center shadow-2xl">
                        {isVirtual ? (
                            <>
                                <div className="text-6xl mb-4 animate-bounce">🎁</div>
                                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">포장 주문 완료!</h2>
                                <p className="text-gray-500 mb-6">결제가 확인되었습니다.<br/>준비되면 번호를 불러드릴게요.</p>
                                <div className="bg-orange-50 border-2 border-orange-100 rounded-2xl p-6 mb-4">
                                    <p className="text-sm text-orange-500 font-bold mb-1">포장 대기 번호</p>
                                    <p className="text-6xl font-black text-orange-500 tracking-tighter">#{completedOrder.dailyNumber}</p>
                                </div>
                                {completedOrder.orderId && completedOrder.viewToken && (
                                    <a
                                        href={`/order-status/${completedOrder.orderId}?token=${completedOrder.viewToken}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-base mb-4 active:scale-95 transition"
                                    >
                                        내 주문 상태 확인하기 →
                                    </a>
                                )}
                                <p className="text-xs text-gray-400 mb-6">이 링크는 결제 완료로 만료되었습니다.</p>
                            </>
                        ) : (
                            <>
                                <div className="text-6xl mb-4 animate-bounce">🎫</div>
                                <h2 className="text-2xl font-extrabold text-gray-800 mb-2">주문이 접수되었습니다!</h2>
                                <p className="text-gray-500 mb-6">아래 번호를 기억해주세요.</p>
                                <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6 mb-4">
                                    <p className="text-sm text-indigo-500 font-bold mb-1">나의 주문 번호</p>
                                    <p className="text-6xl font-black text-indigo-600 tracking-tighter">#{completedOrder.dailyNumber}</p>
                                </div>
                                {completedOrder.orderId && completedOrder.viewToken && (
                                    <a
                                        href={`/order-status/${completedOrder.orderId}?token=${completedOrder.viewToken}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-indigo-500 text-white py-3 rounded-xl font-bold text-base mb-4 active:scale-95 transition"
                                    >
                                        내 주문 상태 확인하기 →
                                    </a>
                                )}
                            </>
                        )}
                        <button onClick={() => setCompletedOrder(null)} className="w-full bg-gray-900 text-white py-4 rounded-xl font-bold text-lg active:scale-95 transition">확인했습니다 👍</button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default OrderPage;