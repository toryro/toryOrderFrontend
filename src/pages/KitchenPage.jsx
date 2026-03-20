import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import toast from "react-hot-toast";

function KitchenPage() {
    const { storeId } = useParams();
    
    // === 기본 상태 관리 ===
    const [dbOrders, setDbOrders] = useState([]); 
    const [displayOrders, setDisplayOrders] = useState([]); 
    const [staffCalls, setStaffCalls] = useState([]); 
    const [isConnected, setIsConnected] = useState(false);
    
    // === 오디오 상태 ===
    const [isAudioAllowed, setIsAudioAllowed] = useState(false);
    const [isPlayingAlarm, setIsPlayingAlarm] = useState(false);
    const audioRef = useRef(null);
    const wsRef = useRef(null);
    const reconnectTimeout = useRef(null);

    // 화면 동기화를 위한 고유 기기 ID
    const myClientId = useRef(`client_${Date.now()}_${Math.floor(Math.random() * 1000)}`);

    // === 🔗 병합 및 ✂️ 분할 관련 상태 ===
    const [isMergeMode, setIsMergeMode] = useState(false);
    const [mergeSelection, setMergeSelection] = useState([]);
    const [splitModal, setSplitModal] = useState({ isOpen: false, order: null, item: null, splitQty: 1 });

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, []);

    // =========================================================
    // 🔔 스마트 알림 제어 로직 (조건부 소리 끄기)
    // =========================================================
    const startAlarm = () => {
        if (!audioRef.current || isPlayingAlarm) return; 
        setIsPlayingAlarm(true);
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.warn("소리 재생이 브라우저에 의해 차단되었습니다."));
    };

    const stopAlarm = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAlarm(false);
    };

    // =========================================================
    // 🔔 스마트 알림 제어 로직 (조건부 소리 켜기/끄기 완벽 제어)
    // =========================================================
    useEffect(() => {
        // 1. 아직 '시스템 시작' 버튼을 누르지 않았다면(소리 권한 없음) 무시합니다.
        if (!isAudioAllowed) return;

        const hasPendingOrders = displayOrders.some(o => !o.is_fully_cancelled && o.cooking_status === "PENDING");
        const hasActiveCalls = staffCalls.length > 0;

        // 2. 대기 중인 주문이나 직원이 호출이 있다면?
        if (hasPendingOrders || hasActiveCalls) {
            // 소리가 안 나고 있을 때만 소리를 켭니다! (새로고침 직후 밀린 주문 대응)
            if (!isPlayingAlarm) {
                startAlarm();
            }
        } 
        // 3. 대기 중인 주문/호출이 하나도 없다면?
        else {
            // 소리가 나고 있을 때만 끕니다!
            if (isPlayingAlarm) {
                stopAlarm();
            }
        }
    }, [displayOrders, staffCalls, isPlayingAlarm, isAudioAllowed]);


    // =========================================================
    // 📡 데이터 로딩 및 웹소켓 연결
    // =========================================================
    const fetchInitialData = async () => {
        const token = localStorage.getItem("token"); 
        if (!token) return;

        try {
            const ordersRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/orders`, { headers: { Authorization: `Bearer ${token}` } });
            const freshOrders = ordersRes.data.filter(order => !order.is_completed);
            setDbOrders(freshOrders);
            
            setDisplayOrders(prevDisplay => {
                const existingDbIds = new Set(prevDisplay.flatMap(o => o.ref_order_ids));
                const newOrders = freshOrders.filter(dbO => !existingDbIds.has(dbO.id));

                const newDisplayCards = newOrders.map(dbO => ({
                    display_id: `db_${dbO.id}`,
                    daily_numbers: [dbO.daily_number],
                    table_name: dbO.table_name || "Unknown",
                    created_at: dbO.created_at,
                    is_fully_cancelled: dbO.payment_status === "CANCELLED",
                    payment_status: dbO.payment_status,
                    cooking_status: "PENDING", // 무조건 '접수 대기(PENDING)'로 시작
                    ref_order_ids: [dbO.id],
                    cooking_status: dbO.cooking_status || "PENDING",
                    items: dbO.items.map(item => ({...item, unique_id: `db_${dbO.id}_${item.id}`}))
                }));

                const updatedPrev = prevDisplay.map(disp => {
                    const hasCancelled = disp.ref_order_ids.some(refId => {
                        const found = freshOrders.find(o => o.id === refId);
                        return found && found.payment_status === 'CANCELLED';
                    });
                    return hasCancelled ? { ...disp, is_fully_cancelled: true } : disp;
                });

                return [...newDisplayCards, ...updatedPrev].sort((a,b) => a.created_at.localeCompare(b.created_at));
            });

            const callsRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/calls`, { headers: { Authorization: `Bearer ${token}` } });
            setStaffCalls(callsRes.data);
        } catch (err) { console.error(err); } 
    };

    const connectWebSocket = () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}//${baseUrl}/ws/${storeId}?token=${token}`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            setIsConnected(true);
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // 다른 기기의 화면 조작(접수, 합치기 등) 상태를 똑같이 동기화
            if (data.type === "SYNC_DISPLAY") {
                if (data.clientId !== myClientId.current) setDisplayOrders(data.displayOrders);
                return;
            }

            if (data.type === "ORDER_COMPLETED") {
                setDisplayOrders(prev => prev.filter(o => !o.ref_order_ids.includes(data.order_id)));
                return;
            }

            if (data.type === "CALL_COMPLETED") {
                setStaffCalls(prev => prev.filter(c => c.id !== data.call_id));
                return;
            }

            if (["NEW_ORDER", "CANCEL_ORDER", "PARTIAL_CANCEL_ORDER", "NEW_CALL"].includes(data.type)) {
                startAlarm(); // 새로운 건이 들어오면 무조건 알림 시작
                fetchInitialData(); 
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            reconnectTimeout.current = setTimeout(() => connectWebSocket(), 3000);
        };
        ws.onerror = () => ws.close(); 
        wsRef.current = ws;
    };

    useEffect(() => {
        fetchInitialData(); 
        connectWebSocket();
        return () => {
            if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [storeId]);


    // =========================================================
    // ✨ 1단계: 접수 대기 -> 조리 시작 처리 (동기화)
    // =========================================================
    const handleStartCooking = async (displayId) => {
        // 1. 화면 상태 즉시 변경
        const newDisplayOrders = displayOrders.map(o => 
            o.display_id === displayId ? { ...o, cooking_status: "COOKING" } : o
        );
        
        setDisplayOrders(newDisplayOrders);
        stopAlarm(true); 

        // 2. 다른 화면(태블릿)에도 '조리 시작' 상태로 똑같이 변경하라고 방송
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "SYNC_DISPLAY", clientId: myClientId.current, displayOrders: newDisplayOrders }));
        }

        // 3. ✨ [신규 추가] 새로고침해도 유지되도록 백엔드 DB에 상태 저장!
        const targetOrder = displayOrders.find(o => o.display_id === displayId);
        if (targetOrder) {
            const token = localStorage.getItem("token");
            try {
                // 합치기(Merge)된 카드일 경우, 안에 들어있는 원본 주문 번호(ref_order_ids)를 모두 조리중으로 바꿈
                await Promise.all(targetOrder.ref_order_ids.map(id => 
                    axios.patch(`${API_BASE_URL}/orders/${id}/cooking`, {}, { headers: { Authorization: `Bearer ${token}` } })
                ));
            } catch (err) {
                console.error("DB 조리 상태 업데이트 실패", err);
            }
        }
    };

    // =========================================================
    // ✨ 2단계: 조리 완료 처리 (화면 삭제)
    // =========================================================
    const handleCompleteOrder = async (displayOrder) => {
        const confirmMsg = displayOrder.is_fully_cancelled ? "취소된 주문을 지우시겠습니까?" : "조리를 완료 처리하시겠습니까?";
        if(!window.confirm(confirmMsg)) return;
        
        const token = localStorage.getItem("token"); 
        try {
            const dbIdsToComplete = [];
            for (const dbId of displayOrder.ref_order_ids) {
                const usedElsewhere = displayOrders.some(o => o.display_id !== displayOrder.display_id && o.ref_order_ids.includes(dbId));
                if (!usedElsewhere) dbIdsToComplete.push(dbId); 
            }

            // 백엔드 DB 반영 (완료 시 다른 태블릿에서 자동으로 삭제됨)
            await Promise.all(dbIdsToComplete.map(id => 
                axios.patch(`${API_BASE_URL}/orders/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } })
            ));
            
            // 내 화면에서도 즉시 삭제
            setDisplayOrders(prev => prev.filter(o => o.display_id !== displayOrder.display_id));
        } catch (err) { toast.error("처리 실패"); }
    };

    const handleCompleteCall = async (callId) => {
        const token = localStorage.getItem("token"); 
        try {
            await axios.patch(`${API_BASE_URL}/calls/${callId}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } });
            setStaffCalls(prev => prev.filter(c => c.id !== callId));
        } catch (err) { toast.error("처리 실패"); }
    };

    // =========================================================
    // 🔗 병합 및 ✂️ 분할 로직 (상태 동기화 포함)
    // =========================================================
    const toggleMergeSelection = (displayId) => {
        setMergeSelection(prev => prev.includes(displayId) ? prev.filter(id => id !== displayId) : [...prev, displayId]);
    };

    const executeMerge = () => {
        if (mergeSelection.length < 2) return toast.error("합칠 카드를 2개 이상 선택해주세요.");
        
        const targetCards = displayOrders.filter(o => mergeSelection.includes(o.display_id));
        const mergedDailyNumbers = [...new Set(targetCards.flatMap(c => c.daily_numbers))];
        
        const combinedItems = [];
        targetCards.flatMap(c => c.items).forEach(item => {
            const existing = combinedItems.find(g => g.menu_name === item.menu_name && g.options_desc === item.options_desc && g.is_cancelled === item.is_cancelled);
            if (existing) existing.quantity += item.quantity;
            else combinedItems.push({...item, unique_id: `merged_item_${Date.now()}_${Math.random()}`});
        });

        const newCard = {
            display_id: `merged_${Date.now()}`,
            daily_numbers: mergedDailyNumbers,
            table_name: targetCards[0].table_name,
            created_at: targetCards[0].created_at,
            is_fully_cancelled: targetCards.some(c => c.is_fully_cancelled),
            payment_status: targetCards[0].payment_status,
            cooking_status: targetCards.some(c => c.cooking_status === "COOKING") ? "COOKING" : "PENDING", 
            ref_order_ids: [...new Set(targetCards.flatMap(c => c.ref_order_ids))],
            items: combinedItems
        };

        const newDisplayOrders = [...displayOrders.filter(o => !mergeSelection.includes(o.display_id)), newCard];
        setDisplayOrders(newDisplayOrders);
        setIsMergeMode(false);
        setMergeSelection([]);
        toast.success("카드가 병합되었습니다!");

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "SYNC_DISPLAY", clientId: myClientId.current, displayOrders: newDisplayOrders }));
        }
    };

    const executeSplit = () => {
        const { order, item, splitQty } = splitModal;
        if (splitQty <= 0 || splitQty >= item.quantity) return;

        const newCard = {
            ...order,
            display_id: `split_${Date.now()}`,
            items: [ { ...item, quantity: splitQty, unique_id: `split_item_${Date.now()}` } ]
        };

        const updatedOriginal = {
            ...order,
            items: order.items.map(i => i.unique_id === item.unique_id ? { ...i, quantity: i.quantity - splitQty } : i)
        };

        const newDisplayOrders = displayOrders.map(o => o.display_id === order.display_id ? updatedOriginal : o).concat(newCard);
        setDisplayOrders(newDisplayOrders);
        setSplitModal({ isOpen: false, order: null, item: null, splitQty: 1 });
        toast.success(`새로운 카드로 분리되었습니다!`);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "SYNC_DISPLAY", clientId: myClientId.current, displayOrders: newDisplayOrders }));
        }
    };

    const startKitchenMode = () => {
        if (audioRef.current) {
            audioRef.current.play().then(() => {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsAudioAllowed(true);
            }).catch(e => alert("브라우저 설정에서 소리 재생을 허용해주세요!"));
        }
    };

    if (!isAudioAllowed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white font-sans">
                <div className="animate-bounce text-8xl mb-6">👨‍🍳</div>
                <h1 className="text-5xl font-extrabold mb-6 tracking-tight">KITCHEN DISPLAY</h1>
                <button onClick={startKitchenMode} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 px-16 rounded-full text-2xl shadow-2xl transition transform hover:scale-105">시스템 시작 ▶</button>
                <audio ref={audioRef} src="/dingdong.mp3" loop hidden />
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans pb-24 ${isPlayingAlarm ? "bg-red-50" : "bg-gray-100"}`}>
            <audio ref={audioRef} src="/dingdong.mp3" loop hidden />

            <header className="bg-slate-800 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-8xl mx-auto px-4 py-4 md:px-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-500 p-2 rounded-lg"><span className="text-2xl">🍳</span></div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-wider">주방 현황판</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"}`}></span>
                                <span className="text-xs text-slate-300 font-medium">{isConnected ? "실시간 연결됨" : "연결 끊김"}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row items-center gap-4">
                        <button onClick={() => { setIsMergeMode(!isMergeMode); setMergeSelection([]); }} 
                            className={`px-4 py-2 font-bold rounded-lg transition-all border-2 ${isMergeMode ? 'bg-indigo-600 text-white border-indigo-400 shadow-md' : 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'}`}>
                            {isMergeMode ? '합치기 취소' : '🔗 주문서 합치기'}
                        </button>
                        {/* 🚫 수동 소리 끄기 버튼은 안전을 위해 완전히 제거되었습니다. */}
                    </div>
                </div>
            </header>

            <main className="p-4 md:p-6 max-w-8xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                    
                    {/* 직원 호출 카드 */}
                    {staffCalls.map((call) => (
                        <div key={`call-${call.id}`} className="bg-white rounded-2xl shadow-xl border-l-8 border-yellow-400 flex flex-col animate-slideUp">
                            <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex justify-between items-center">
                                <span className="flex items-center gap-2 text-yellow-700 font-black text-lg"><span className="animate-bounce">🔔</span> 직원 호출</span>
                            </div>
                            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                <h3 className="text-2xl font-extrabold text-gray-800">{call.table_name}</h3>
                                <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-xl font-bold text-xl shadow-inner inline-block">"{call.message}"</div>
                            </div>
                            <button onClick={() => handleCompleteCall(call.id)} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 text-lg">확인 완료 👌</button>
                        </div>
                    ))}

                    {/* 🔥 주문 카드 렌더링 */}
                    {displayOrders.map((order) => {
                        const isFullyCancelled = order.is_fully_cancelled;
                        const isSelected = mergeSelection.includes(order.display_id);
                        
                        return (
                            <div key={order.display_id} 
                                onClick={() => isMergeMode && toggleMergeSelection(order.display_id)}
                                className={`rounded-2xl shadow-lg overflow-hidden flex flex-col ring-2 transition-all duration-300 animate-slideUp ${
                                isFullyCancelled ? 'bg-red-50 ring-red-500' : 'bg-white ring-transparent'
                            } ${isMergeMode ? 'cursor-pointer hover:scale-[1.02]' : ''} ${isSelected ? '!ring-indigo-500 !ring-4 scale-[1.02] shadow-2xl' : ''}`}>
                                
                                {/* 뱃지 상태 표시 */}
                                {isFullyCancelled && <div className="bg-red-600 text-white text-center font-black py-2 text-sm animate-pulse">🚨 취소된 주문입니다! 🚨</div>}
                                {isSelected && <div className="bg-indigo-600 text-white text-center font-black py-1.5 text-sm animate-pulse">선택됨 ✔️</div>}
                                
                                {!isFullyCancelled && order.cooking_status === "PENDING" && (
                                    <div className="bg-yellow-500 text-yellow-900 text-center font-black py-1.5 text-sm animate-pulse shadow-inner">
                                        ⏳ 접수 대기 중
                                    </div>
                                )}
                                {!isFullyCancelled && order.cooking_status === "COOKING" && (
                                    <div className="bg-indigo-500 text-white text-center font-bold py-1.5 text-sm shadow-inner">
                                        🧑‍🍳 조리 진행 중
                                    </div>
                                )}

                                <div className={`${isFullyCancelled ? 'bg-red-900' : order.cooking_status === 'COOKING' ? 'bg-indigo-800' : 'bg-slate-800'} text-white p-4 flex justify-between items-center relative transition-colors`}>
                                    <div className="z-10">
                                        <span className={`text-2xl md:text-3xl font-black tracking-tighter ${isFullyCancelled ? 'text-red-300' : 'text-indigo-300'}`}>
                                            #{order.daily_numbers.join(', ')}
                                        </span>
                                        <span className="text-[11px] text-slate-300 block font-medium mt-1">{order.created_at} 접수</span>
                                    </div>
                                    <span className="z-10 text-xl font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 shadow-sm">{order.table_name}</span>
                                </div>
                                
                                <div className={`p-4 flex-1 overflow-y-auto max-h-[400px] ${isFullyCancelled ? 'bg-red-50/50' : 'bg-slate-50/50'}`}>
                                    <ul className="space-y-3">
                                        {order.items.map((item) => (
                                            <li key={item.unique_id} className={`p-3 rounded-lg border shadow-sm transition-colors ${item.is_cancelled ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                                                <div className="flex justify-between items-start">
                                                    <span className={`font-bold text-lg leading-tight ${item.is_cancelled ? 'line-through text-red-500' : 'text-slate-700'}`}>
                                                        {item.menu_name}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
                                                        {!isMergeMode && !item.is_cancelled && item.quantity > 1 && (
                                                            <button onClick={(e) => { e.stopPropagation(); setSplitModal({ isOpen: true, order, item, splitQty: 1 }); }} 
                                                                className="bg-gray-100 text-gray-500 hover:bg-gray-200 text-xs px-2 py-1 rounded font-bold shadow-sm border border-gray-200">
                                                                ✂️분할
                                                            </button>
                                                        )}
                                                        <span className={`font-black px-2.5 py-0.5 rounded text-sm md:text-base border shadow-sm ${item.is_cancelled ? 'bg-red-100 text-red-400 border-red-200 line-through' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                                                            {item.quantity}개
                                                        </span>
                                                    </div>
                                                </div>
                                                {item.options_desc && (
                                                    <div className="mt-2 text-sm p-2 rounded border bg-slate-50 border-slate-100 text-slate-500 flex gap-2">
                                                        <span>↳</span><span>{item.options_desc}</span>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                {!isMergeMode && (
                                    <div className="p-4 border-t bg-white flex gap-2">
                                        {!isFullyCancelled && order.cooking_status === "PENDING" ? (
                                            <button onClick={() => handleStartCooking(order.display_id)} 
                                                className="w-full py-3.5 rounded-xl font-black text-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900">
                                                <span>접수 대기</span> <span>👉</span>
                                            </button>
                                        ) : (
                                            <button onClick={() => handleCompleteOrder(order)} 
                                                className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isFullyCancelled ? 'bg-gray-800 hover:bg-black text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
                                                {isFullyCancelled ? <><span>취소 확인</span> <span>🗑️</span></> : <><span>조리 완료</span> <span>✅</span></>}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </main>

            {isMergeMode && (
                <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.3)] z-50 flex justify-between items-center animate-slideUp">
                    <div className="text-white font-bold text-lg ml-4">
                        현재 <span className="text-indigo-400 font-black text-2xl">{mergeSelection.length}</span>개의 카드 선택됨
                    </div>
                    <div className="flex gap-3">
                        <button onClick={executeMerge} disabled={mergeSelection.length < 2} className="bg-indigo-600 disabled:bg-slate-600 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-indigo-500 transition">
                            합치기 완료
                        </button>
                    </div>
                </div>
            )}

            {splitModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSplitModal({...splitModal, isOpen: false})}>
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-800 text-white p-5 font-bold text-lg flex justify-between items-center">
                            <span className="flex items-center gap-2"><span className="text-2xl">✂️</span> 메뉴 수량 분리</span>
                            <button onClick={() => setSplitModal({...splitModal, isOpen: false})} className="text-gray-300 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-6 bg-gray-50 flex flex-col items-center">
                            <p className="text-gray-800 font-black text-xl mb-1">{splitModal.item.menu_name}</p>
                            <p className="text-gray-500 text-sm mb-6">총 {splitModal.item.quantity}개 중 몇 개를 따로 분리할까요?</p>
                            
                            <div className="flex items-center gap-6 mb-8 bg-white p-2 rounded-2xl border border-gray-200 shadow-sm">
                                <button onClick={() => setSplitModal(p => ({...p, splitQty: Math.max(1, p.splitQty - 1)}))} className="w-14 h-14 rounded-xl bg-gray-100 text-gray-600 font-black text-2xl hover:bg-gray-200">-</button>
                                <span className="text-4xl font-black text-indigo-600 w-12 text-center">{splitModal.splitQty}</span>
                                <button onClick={() => setSplitModal(p => ({...p, splitQty: Math.min(p.item.quantity - 1, p.splitQty + 1)}))} className="w-14 h-14 rounded-xl bg-gray-100 text-gray-600 font-black text-2xl hover:bg-gray-200">+</button>
                            </div>

                            <button onClick={executeSplit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 text-lg rounded-xl shadow-md transition-colors">
                                {splitModal.splitQty}개 분리하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KitchenPage;