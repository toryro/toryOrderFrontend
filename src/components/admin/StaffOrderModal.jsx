// src/components/admin/StaffOrderModal.jsx 전체 코드

import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

export function StaffOrderModal({ storeId, table, token, onClose, onSuccess }) {
    const [categories, setCategories] = useState([]);
    const [activeCategoryId, setActiveCategoryId] = useState(null);
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(true);
    const [optionModal, setOptionModal] = useState({ isOpen: false, menu: null, selectedOptions: {} });

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = "unset"; };
    }, []);

    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/stores/${storeId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCategories(res.data.categories || []);
                if (res.data.categories?.length > 0) setActiveCategoryId(res.data.categories[0].id);
                setLoading(false);
            } catch (err) { toast.error("메뉴 로딩 실패"); }
        };
        fetchMenu();
    }, [storeId]);

    const handleAddToCart = (menu, optionsArray = []) => {
        const optionKey = optionsArray.map(o => o.id).sort().join("_");
        const uniqueKey = `${menu.id}-${optionKey}`;
        const existingItemIndex = cart.findIndex(item => item.uniqueKey === uniqueKey);

        if (existingItemIndex > -1) {
            const newCart = [...cart];
            newCart[existingItemIndex].quantity += 1;
            setCart(newCart);
        } else {
            const optionTotalPrice = optionsArray.reduce((acc, cur) => acc + cur.price, 0);
            setCart([...cart, {
                uniqueKey,
                menu_id: menu.id,
                menu_name: menu.name,
                base_price: menu.price,
                price: menu.price + optionTotalPrice,
                quantity: 1,
                options: optionsArray
            }]);
        }
        setOptionModal({ isOpen: false, menu: null, selectedOptions: {} });
    };

    const handleOptionSubmit = () => {
        const { menu, selectedOptions } = optionModal;
        
        // ✨ [필수 옵션 체크]
        for (const group of menu.option_groups) {
            const selectedCount = (selectedOptions[group.id] || []).length;
            if (group.is_required && selectedCount === 0) {
                return toast.error(`[${group.name}] 옵션은 필수 선택 사항입니다.`);
            }
        }
        
        const flatOptions = Object.values(selectedOptions).flat();
        handleAddToCart(menu, flatOptions);
    };

    const updateQuantity = (index, delta) => {
        const newCart = [...cart];
        const newQty = newCart[index].quantity + delta;
        if (newQty <= 0) {
            setCart(newCart.filter((_, i) => i !== index));
        } else {
            newCart[index].quantity = newQty;
            setCart(newCart);
        }
    };

    const handleOrderSubmit = async () => {
        if (cart.length === 0) return toast.error("메뉴를 선택해주세요.");
        try {
            await axios.post(`${API_BASE_URL}/orders/`, {
                store_id: parseInt(storeId),
                table_id: table.id,
                order_type: "DINE_IN",
                payment_method: "POST_PAY",
                is_post_pay: true, 
                items: cart.map(item => ({
                    menu_id: item.menu_id,
                    quantity: item.quantity,
                    options: item.options.map(o => ({ id: o.id, name: o.name, price: o.price }))
                }))
            });
            toast.success("주문이 완료되었습니다.");
            onSuccess();
        } catch (err) { toast.error("주문 실패"); }
    };

    if (loading) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
            <div className="bg-white w-full max-w-6xl h-full max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden relative">
                
                <div className="h-16 flex-shrink-0 bg-slate-900 px-6 flex justify-between items-center text-white z-20">
                    <div className="flex items-center gap-3">
                        <span className="bg-indigo-500 text-white px-2.5 py-1 rounded-md text-[11px] font-black tracking-wide">직원주문</span>
                        <h2 className="text-xl font-extrabold">{table.name}</h2>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-all text-2xl font-light">×</button>
                </div>

                <div className="flex-1 min-h-0 flex flex-row w-full bg-slate-50 relative">
                    <div className="w-32 sm:w-40 flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto overscroll-contain p-3 space-y-2">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategoryId(cat.id)}
                                className={`w-full py-4 px-3 rounded-xl text-sm font-bold transition-all text-left ${activeCategoryId === cat.id ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:bg-slate-50 hover:text-indigo-600"}`}>
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    <div className="flex-1 min-w-0 overflow-y-auto overscroll-contain p-4 sm:p-6">
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {categories.find(c => c.id === activeCategoryId)?.menus.map(menu => (
                                <button key={menu.id} 
                                    onClick={() => {
                                        if (menu.option_groups?.length > 0) {
                                            // ✨ [핵심 해결] 기본 옵션(is_default) 자동 선택 로직
                                            const initialOptions = {};
                                            menu.option_groups.forEach(group => {
                                                const defaultOpts = group.options.filter(opt => opt.is_default);
                                                if (defaultOpts.length > 0) initialOptions[group.id] = defaultOpts;
                                            });
                                            setOptionModal({ isOpen: true, menu, selectedOptions: initialOptions });
                                        } else {
                                            handleAddToCart(menu, []);
                                        }
                                    }}
                                    className="flex flex-col h-28 bg-white border border-slate-200 p-4 rounded-xl text-left hover:border-indigo-500 hover:shadow-md transition-all active:scale-[0.98] group">
                                    <div className="font-bold text-slate-800 text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-indigo-600">{menu.name}</div>
                                    <div className="flex justify-between items-end mt-auto w-full">
                                        <div className="text-sm font-black text-slate-500">{menu.price.toLocaleString()}원</div>
                                        {menu.option_groups?.length > 0 && <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 font-bold">옵션</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="w-72 sm:w-80 flex-shrink-0 bg-white border-l border-slate-200 flex flex-col relative z-10 shadow-[-4px_0_15px_rgba(0,0,0,0.02)]">
                        <div className="h-14 flex-shrink-0 flex justify-between items-center px-4 border-b border-slate-200">
                            <span className="font-extrabold text-slate-800 text-sm">주문 목록</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold">{cart.length}개</span>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2.5 bg-slate-50">
                            {cart.map((item, idx) => (
                                <div key={item.uniqueKey} className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-2">
                                    <div>
                                        <div className="font-bold text-slate-800 text-sm truncate">{item.menu_name}</div>
                                        {item.options.length > 0 && (
                                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 line-clamp-1">
                                                {item.options.map(o => o.name).join(", ")}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="font-black text-indigo-600 text-sm">{(item.price * item.quantity).toLocaleString()}원</div>
                                        <div className="flex items-center gap-1 bg-slate-50 p-0.5 rounded border border-slate-200">
                                            <button onClick={() => updateQuantity(idx, -1)} className="w-7 h-7 rounded bg-white flex items-center justify-center font-black text-slate-600 shadow-sm hover:bg-slate-100 transition">-</button>
                                            <span className="font-bold text-xs w-6 text-center">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(idx, 1)} className="w-7 h-7 rounded bg-white flex items-center justify-center font-black text-indigo-600 shadow-sm hover:bg-indigo-50 transition">+</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-shrink-0 bg-white border-t border-slate-200 p-4 z-20">
                            <div className="flex justify-between items-end mb-3">
                                <span className="font-bold text-slate-500 text-xs">총 합계 금액</span>
                                <span className="text-xl font-black text-slate-900">
                                    {cart.reduce((acc, cur) => acc + (cur.price * cur.quantity), 0).toLocaleString()}<span className="text-sm font-bold ml-0.5">원</span>
                                </span>
                            </div>
                            <button onClick={handleOrderSubmit} className="w-full bg-indigo-600 text-white py-3.5 rounded-lg font-bold text-base shadow-sm hover:bg-indigo-700 active:scale-[0.98] transition-all">
                                주방 주문 전송 🚀
                            </button>
                        </div>
                    </div>
                </div>

                {optionModal.isOpen && (
                    <div className="absolute inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl w-full max-w-sm shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                            <div className="h-14 flex-shrink-0 px-4 border-b flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800 text-sm truncate pr-4">{optionModal.menu.name} 옵션 선택</h3>
                                <button onClick={() => setOptionModal({ isOpen: false, menu: null, selectedOptions: {} })} className="text-xl text-slate-400 hover:text-slate-600">×</button>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-4 bg-white">
                                {optionModal.menu.option_groups.map(group => (
                                    <div key={group.id}>
                                        <div className="font-bold text-xs text-slate-800 mb-2 flex items-center gap-2">
                                            {group.name} 
                                            {group.is_required && <span className="text-[9px] bg-red-50 text-red-600 px-1 py-0.5 rounded border border-red-100">필수</span>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            {group.options.map(opt => {
                                                const selectedInGroup = optionModal.selectedOptions[group.id] || [];
                                                const isSelected = selectedInGroup.some(o => o.id === opt.id);
                                                const isMulti = group.max_select > 1 || group.is_multiple;

                                                return (
                                                    <button key={opt.id} 
                                                        onClick={() => {
                                                            setOptionModal(prev => {
                                                                const currentList = prev.selectedOptions[group.id] || [];
                                                                let newList;
                                                                if (isSelected) {
                                                                    newList = currentList.filter(o => o.id !== opt.id);
                                                                } else {
                                                                    if (isMulti) {
                                                                        const max = group.max_select || 99;
                                                                        if (currentList.length >= max) {
                                                                            toast.error(`최대 ${max}개까지만 선택 가능합니다.`);
                                                                            return prev;
                                                                        }
                                                                        newList = [...currentList, opt];
                                                                    } else {
                                                                        newList = [opt];
                                                                    }
                                                                }
                                                                return { ...prev, selectedOptions: { ...prev.selectedOptions, [group.id]: newList } };
                                                            });
                                                        }}
                                                        className={`p-2.5 rounded-lg border text-left transition-all ${isSelected ? "border-indigo-600 bg-indigo-50 shadow-inner" : "border-slate-200 hover:border-indigo-300"}`}>
                                                        <div className={`text-xs font-bold mb-0.5 ${isSelected ? "text-indigo-700" : "text-slate-700"}`}>
                                                            {isSelected && <span className="mr-1">✓</span>}
                                                            {opt.name}
                                                        </div>
                                                        <div className="text-[10px] font-medium text-slate-500">+{opt.price.toLocaleString()}원</div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="flex-shrink-0 p-3 border-t bg-slate-50">
                                <button onClick={handleOptionSubmit} className="w-full bg-slate-900 text-white py-3 rounded-lg font-bold text-sm active:scale-95 transition-all">선택 완료</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}