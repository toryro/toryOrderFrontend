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
    
    // === 오디오 및 알람 상태 ===
    const [isAudioAllowed, setIsAudioAllowed] = useState(false);
    const [isPlayingAlarm, setIsPlayingAlarm] = useState(false);
    const audioRef = useRef(null);
    const wsRef = useRef(null);
    const reconnectTimeout = useRef(null);
    
    const myClientId = useRef(`client_${Date.now()}_${Math.floor(Math.random() * 1000)}`);
    const [mutedDelays, setMutedDelays] = useState([]);

    // === 🔗 병합 및 ✂️ 분할 관련 상태 ===
    const [isMergeMode, setIsMergeMode] = useState(false);
    const [mergeSelection, setMergeSelection] = useState([]);
    const [splitModal, setSplitModal] = useState({ isOpen: false, order: null, splitSelections: {} });

    // 1초 타이머 (경과 시간 실시간 계산용)
    const [nowTimer, setNowTimer] = useState(Date.now());
    useEffect(() => {
        const interval = setInterval(() => setNowTimer(Date.now()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, []);

    // =========================================================
    // 🔔 오디오 제어 함수
    // =========================================================
    const startAlarm = () => {
        if (!audioRef.current || isPlayingAlarm) return; 
        setIsPlayingAlarm(true);
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.warn("소리 재생 차단됨"));
    };

    const stopAlarm = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAlarm(false);
    };

    useEffect(() => {
        if (!isAudioAllowed) return;

        const hasPendingOrders = displayOrders.some(o => !o.is_fully_cancelled && o.cooking_status === "PENDING");
        const hasActiveCalls = staffCalls.length > 0;
        
        const hasUnmutedDelay = displayOrders.some(o => {
            if (o.is_fully_cancelled) return false;
            const orderTime = new Date(o.created_at.replace(' ', 'T')).getTime();
            const elapsedSecs = Math.max(0, Math.floor((nowTimer - orderTime) / 1000));
            const targetSecs = (o.target_time || 15) * 60;
            return elapsedSecs >= targetSecs && !mutedDelays.includes(o.display_id);
        });

        if (hasPendingOrders || hasActiveCalls || hasUnmutedDelay) {
            if (!isPlayingAlarm) startAlarm();
        } else {
            if (isPlayingAlarm) stopAlarm();
        }
    }, [displayOrders, staffCalls, isPlayingAlarm, isAudioAllowed, nowTimer, mutedDelays]);


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
                    target_time: dbO.target_time || 15,
                    is_fully_cancelled: dbO.payment_status === "CANCELLED",
                    payment_status: dbO.payment_status,
                    cooking_status: dbO.cooking_status || "PENDING", 
                    ref_order_ids: [dbO.id],
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
            
            if (data.type === "SYNC_DISPLAY") {
                if (data.clientId !== myClientId.current) setDisplayOrders(data.displayOrders);
                return;
            }
            if (data.type === "MUTE_DELAY") {
                if (data.clientId !== myClientId.current) setMutedDelays(prev => [...prev, data.displayId]);
                return;
            }
            if (data.type === "UNMUTE_DELAY") {
                if (data.clientId !== myClientId.current) setMutedDelays(prev => prev.filter(id => id !== data.displayId));
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


    const handleMuteDelay = (displayId) => {
        setMutedDelays(prev => [...prev, displayId]);
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "MUTE_DELAY", clientId: myClientId.current, displayId }));
        }
    };

    const handleAdjustTime = async (displayId, amount) => {
        const token = localStorage.getItem("token");
        const newDisplayOrders = displayOrders.map(o => {
            if (o.display_id === displayId) {
                const newTime = Math.max(5, (o.target_time || 15) + amount); 
                return { ...o, target_time: newTime };
            }
            return o;
        });
        
        setDisplayOrders(newDisplayOrders);
        setMutedDelays(prev => prev.filter(id => id !== displayId));

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "SYNC_DISPLAY", clientId: myClientId.current, displayOrders: newDisplayOrders }));
            wsRef.current.send(JSON.stringify({ type: "UNMUTE_DELAY", clientId: myClientId.current, displayId }));
        }

        const targetOrder = displayOrders.find(o => o.display_id === displayId);
        if (targetOrder && targetOrder.ref_order_ids.length > 0) {
            try {
                await axios.patch(`${API_BASE_URL}/orders/${targetOrder.ref_order_ids[0]}/target-time?time_change=${amount}`, {}, { headers: { Authorization: `Bearer ${token}` } });
            } catch (err) { console.error(err); }
        }
    };

    const handleStartCooking = async (displayId) => {
        const newDisplayOrders = displayOrders.map(o => 
            o.display_id === displayId ? { ...o, cooking_status: "COOKING" } : o
        );
        setDisplayOrders(newDisplayOrders);

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: "SYNC_DISPLAY", clientId: myClientId.current, displayOrders: newDisplayOrders }));
        }

        const targetOrder = displayOrders.find(o => o.display_id === displayId);
        if (targetOrder) {
            const token = localStorage.getItem("token");
            try {
                await Promise.all(targetOrder.ref_order_ids.map(id => 
                    axios.patch(`${API_BASE_URL}/orders/${id}/cooking`, {}, { headers: { Authorization: `Bearer ${token}` } })
                ));
            } catch (err) { console.error("DB 조리 상태 업데이트 실패", err); }
        }
    };

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
            await Promise.all(dbIdsToComplete.map(id => 
                axios.patch(`${API_BASE_URL}/orders/${id}/complete`, {}, { headers: { Authorization: `Bearer ${token}` } })
            ));
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

    const toggleMergeSelection = (displayId) => { setMergeSelection(prev => prev.includes(displayId) ? prev.filter(id => id !== displayId) : [...prev, displayId]); };
    
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
            target_time: targetCards[0].target_time, 
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
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) { wsRef.current.send(JSON.stringify({ type: "SYNC_DISPLAY", clientId: myClientId.current, displayOrders: newDisplayOrders })); }
    };

    const openSplitModal = (order, e) => {
        if (e) e.stopPropagation();
        const initialSelections = {};
        order.items.forEach(item => {
            if (!item.is_cancelled) initialSelections[item.unique_id] = 0;
        });
        setSplitModal({ isOpen: true, order, splitSelections: initialSelections });
    };

    const handleSplitQtyChange = (uniqueId, delta, maxQty) => {
        setSplitModal(prev => {
            const current = prev.splitSelections[uniqueId] || 0;
            let next = current + delta;
            if (next < 0) next = 0;
            if (next > maxQty) next = maxQty;
            return { ...prev, splitSelections: { ...prev.splitSelections, [uniqueId]: next } };
        });
    };

    const executeSplit = () => {
        const { order, splitSelections } = splitModal;
        
        const newCardItems = [];
        const originalCardItems = [];
        
        order.items.forEach(item => {
            if (item.is_cancelled) {
                originalCardItems.push(item);
                return;
            }
            const moveQty = splitSelections[item.unique_id] || 0;
            const remainQty = item.quantity - moveQty;
            
            if (moveQty > 0) {
                newCardItems.push({ ...item, quantity: moveQty, unique_id: `split_item_${Date.now()}_${Math.random()}` });
            }
            if (remainQty > 0) {
                originalCardItems.push({ ...item, quantity: remainQty });
            }
        });

        if (newCardItems.length === 0) return toast.error("분리할 메뉴를 1개 이상 선택해주세요.");
        if (originalCardItems.length === 0) return toast.error("원본 주문에 남길 메뉴가 최소 1개 있어야 합니다. (전체 이동 불가)");

        const newCard = { 
            ...order, 
            display_id: `split_${Date.now()}_${Math.random()}`, 
            items: newCardItems 
        };
        const updatedOriginal = { 
            ...order, 
            items: originalCardItems 
        };
        
        const newDisplayOrders = displayOrders.map(o => o.display_id === order.display_id ? updatedOriginal : o).concat(newCard);
        setDisplayOrders(newDisplayOrders);
        setSplitModal({ isOpen: false, order: null, splitSelections: {} });
        toast.success(`메뉴가 성공적으로 분리되었습니다!`);
        
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
                        
                        const orderTime = new Date(order.created_at.replace(' ', 'T')).getTime();
                        const elapsedSecs = Math.max(0, Math.floor((nowTimer - orderTime) / 1000));
                        const targetSecs = (order.target_time || 15) * 60;
                        const isDelayed = elapsedSecs >= targetSecs && !isFullyCancelled; 

                        const m = Math.floor(elapsedSecs / 60).toString().padStart(2, '0');
                        const s = (elapsedSecs % 60).toString().padStart(2, '0');
                        
                        // 분할 가능 여부 (전체 메뉴 개수가 1개 초과일 때만 분할 버튼 표시)
                        const totalQty = order.items.reduce((sum, item) => sum + (item.is_cancelled ? 0 : parseInt(item.quantity, 10)), 0);

                        return (
                            <div key={order.display_id} 
                                onClick={() => isMergeMode && toggleMergeSelection(order.display_id)}
                                className={`rounded-2xl shadow-lg overflow-hidden flex flex-col ring-2 transition-all duration-300 animate-slideUp ${
                                isFullyCancelled ? 'bg-red-50 ring-red-500' : isDelayed ? 'bg-red-50 ring-red-600 shadow-[0_0_20px_rgba(220,38,38,0.4)]' : 'bg-white ring-transparent'
                            } ${isMergeMode ? 'cursor-pointer hover:scale-[1.02]' : ''} ${isSelected ? '!ring-indigo-500 !ring-4 scale-[1.02] shadow-2xl' : ''}`}>
                                
                                {isFullyCancelled && <div className="bg-red-600 text-white text-center font-black py-2 text-sm animate-pulse">🚨 취소된 주문입니다! 🚨</div>}
                                
                                {!isFullyCancelled && (
                                    <div className={`px-4 py-3 flex flex-col gap-2 ${isDelayed ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700'} border-b border-gray-200 transition-colors`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-xs mb-0.5 ${isDelayed ? 'text-red-200' : 'text-gray-500'}`}>
                                                    🕒 주문 시간: {order.created_at.split(" ")[1].substring(0, 5)}
                                                </span>
                                                <span className={`font-black tracking-widest text-xl ${isDelayed ? 'animate-pulse text-white' : 'text-indigo-600'}`}>
                                                    경과: {m}분 {s}초
                                                </span>
                                            </div>
                                            <div className="flex items-center bg-white/20 rounded-lg p-1 gap-1">
                                                <button onClick={(e)=>{e.stopPropagation(); handleAdjustTime(order.display_id, -5);}} className="w-6 h-6 flex items-center justify-center bg-white text-gray-800 rounded font-bold hover:bg-gray-200 active:scale-95">-</button>
                                                <span className={`text-xs font-bold px-1 ${isDelayed ? 'text-white' : 'text-gray-600'}`}>목표 {order.target_time}분</span>
                                                <button onClick={(e)=>{e.stopPropagation(); handleAdjustTime(order.display_id, 5);}} className="w-6 h-6 flex items-center justify-center bg-white text-gray-800 rounded font-bold hover:bg-gray-200 active:scale-95">+</button>
                                            </div>
                                        </div>
                                        
                                        {isDelayed && !mutedDelays.includes(order.display_id) && (
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleMuteDelay(order.display_id); }} 
                                                className="w-full mt-1 py-1.5 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-black text-sm rounded shadow-sm flex justify-center items-center gap-2 animate-pulse"
                                            >
                                                <span>🔕</span> 이 주문 지연 알람 끄기
                                            </button>
                                        )}
                                    </div>
                                )}

                                {!isFullyCancelled && order.cooking_status === "PENDING" && (
                                    <div className="bg-yellow-400 text-yellow-900 text-center font-black py-1.5 text-sm shadow-inner flex justify-center items-center gap-2">
                                        <span className="animate-spin text-lg">⏳</span> 접수 대기 중
                                    </div>
                                )}
                                {!isFullyCancelled && order.cooking_status === "COOKING" && (
                                    <div className="bg-indigo-500 text-white text-center font-bold py-1.5 text-sm shadow-inner">
                                        🧑‍🍳 조리 진행 중
                                    </div>
                                )}

                                <div className={`${isFullyCancelled ? 'bg-red-900' : isDelayed ? 'bg-red-800' : order.cooking_status === 'COOKING' ? 'bg-indigo-800' : 'bg-slate-800'} text-white p-4 flex justify-between items-center relative transition-colors`}>
                                    <div className="z-10">
                                        <span className={`text-2xl md:text-3xl font-black tracking-tighter ${isFullyCancelled ? 'text-red-300' : 'text-indigo-300'}`}>
                                            #{order.daily_numbers.join(', ')}
                                        </span>
                                    </div>
                                    <div className="z-10 flex items-center gap-2">
                                        {/* ✨ [신규 추가] 포장 여부 뱃지 */}
                                        {order.order_type === "TAKEOUT" ? (
                                            <span className="text-sm font-black bg-orange-500 text-white px-3 py-1.5 rounded-lg shadow-sm animate-pulse">🎁 포장</span>
                                        ) : (
                                            <span className="text-sm font-bold bg-indigo-500 text-white px-3 py-1.5 rounded-lg shadow-sm">🍽️ 매장</span>
                                        )}
                                        
                                        <span className="text-xl font-bold bg-white/10 px-3 py-1.5 rounded-lg border border-white/20 shadow-sm">{order.table_name}</span>
                                    </div>
                                </div>
                                
                                <div className={`p-4 flex-1 overflow-y-auto max-h-[200px] lg:max-h-[250px] ${isFullyCancelled ? 'bg-red-50/50' : 'bg-slate-50/50'}`}>
                                    <ul className="space-y-3">
                                        {order.items.map((item) => (
                                            <li key={item.unique_id} className={`p-3 rounded-lg border shadow-sm transition-colors ${item.is_cancelled ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                                                <div className="flex justify-between items-start">
                                                    <span className={`font-bold text-lg leading-tight ${item.is_cancelled ? 'line-through text-red-500' : 'text-slate-700'}`}>
                                                        {item.menu_name}
                                                    </span>
                                                    <div className="flex items-center gap-2 shrink-0 ml-2">
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
                                
                                {/* ✨ [수정 완료] 분할 버튼과 액션 버튼을 나란히(가로) 배치 */}
                                {!isMergeMode && (
                                    <div className="p-4 border-t bg-white flex gap-2">
                                        
                                        {/* ✂️ 분할 버튼 (수량이 2개 이상이면서, '조리 중(COOKING)'일 때만 표시!) */}
                                        {!isFullyCancelled && totalQty > 1 && order.cooking_status === "COOKING" && (
                                            <button 
                                                onClick={(e) => openSplitModal(order, e)} 
                                                className="w-[72px] py-2 rounded-xl font-bold shadow-sm transition-all active:scale-95 flex flex-col items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 shrink-0"
                                            >
                                                <span className="text-lg leading-none mb-1">✂️</span>
                                                <span className="text-[11px] leading-tight text-center">주문<br/>분할</span>
                                            </button>
                                        )}

                                        {/* 메인 액션 버튼 (나머지 영역을 모두 채움) */}
                                        {!isFullyCancelled && order.cooking_status === "PENDING" ? (
                                            <button onClick={() => handleStartCooking(order.display_id)} 
                                                className="flex-1 py-3 rounded-xl font-black text-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900">
                                                <span>접수 대기 (시작)</span> <span>👉</span>
                                            </button>
                                        ) : (
                                            <button onClick={() => handleCompleteOrder(order)} 
                                                className={`flex-1 py-3 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isFullyCancelled ? 'bg-gray-800 hover:bg-black text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}>
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

            {/* ✨ 다중 분할 모달 창 */}
            {splitModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSplitModal({ isOpen: false, order: null, splitSelections: {} })}>
                    <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-fadeIn" onClick={e => e.stopPropagation()}>
                        <div className="bg-slate-800 text-white p-5 font-bold text-lg flex justify-between items-center">
                            <span className="flex items-center gap-2"><span className="text-2xl">✂️</span> 여러 메뉴 쪼개기</span>
                            <button onClick={() => setSplitModal({ isOpen: false, order: null, splitSelections: {} })} className="text-gray-300 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-6 bg-gray-50 flex flex-col">
                            <p className="text-gray-800 font-black text-xl mb-4">새 카드로 보낼 메뉴 개수를 선택하세요</p>
                            
                            <div className="space-y-3 mb-6 max-h-[40vh] overflow-y-auto pr-2">
                                {splitModal.order.items.filter(i => !i.is_cancelled).map(item => (
                                    <div key={item.unique_id} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-700 leading-tight">{item.menu_name}</p>
                                            <p className="text-xs text-indigo-500 font-bold mt-1">현재 총 {item.quantity}개</p>
                                        </div>
                                        <div className="flex items-center gap-3 bg-gray-100 p-1.5 rounded-lg">
                                            <button 
                                                onClick={() => handleSplitQtyChange(item.unique_id, -1, item.quantity)} 
                                                className="w-8 h-8 rounded-md bg-white text-gray-600 font-black text-xl shadow-sm hover:bg-gray-50"
                                            >-</button>
                                            <span className="text-xl font-black text-indigo-600 w-6 text-center">
                                                {splitModal.splitSelections[item.unique_id] || 0}
                                            </span>
                                            <button 
                                                onClick={() => handleSplitQtyChange(item.unique_id, 1, item.quantity)} 
                                                className="w-8 h-8 rounded-md bg-white text-gray-600 font-black text-xl shadow-sm hover:bg-gray-50"
                                            >+</button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button onClick={executeSplit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 text-lg rounded-xl shadow-md transition-colors">
                                선택한 메뉴 분리하기
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default KitchenPage;