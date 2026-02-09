import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function KitchenPage() {
    const { storeId } = useParams();
    
    // === 상태 관리 ===
    const [orders, setOrders] = useState([]);         
    const [staffCalls, setStaffCalls] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    
    // === 오디오 상태 ===
    const [isAudioAllowed, setIsAudioAllowed] = useState(false);
    const [isPlayingAlarm, setIsPlayingAlarm] = useState(false);
    
    const isAudioAllowedRef = useRef(isAudioAllowed);
    const audioRef = useRef(null);
    const wsRef = useRef(null);
    const reconnectTimeout = useRef(null);

    // 설정값 추적
    useEffect(() => {
        isAudioAllowedRef.current = isAudioAllowed;
    }, [isAudioAllowed]);

    useEffect(() => {
        return () => {
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, []);

    // 🔔 알림 시작
    const startAlarm = () => {
        if (!audioRef.current) return;
        if (isPlayingAlarm) return; 

        setIsPlayingAlarm(true);
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(e => console.warn("소리 차단됨"));
    };

    // 🔕 알림 중지
    const stopAlarm = () => {
        if (!audioRef.current) return;
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAlarm(false);
    };

    // 데이터 로딩
    const fetchInitialData = async () => {
        try {
            const ordersRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/orders`);
            setOrders(ordersRes.data.filter(order => !order.is_completed));
            const callsRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/calls`);
            setStaffCalls(callsRes.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    // 웹소켓 연결
    const connectWebSocket = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
        
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/${storeId}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("🟢 주방 시스템 연결 성공");
            setIsConnected(true);
            fetchInitialData();
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            // 🔥 [1] 주문 알림
            if (data.type === "NEW_ORDER") {
                setOrders(prev => {
                    if (prev.some(o => o.id === data.order_id)) return prev;
                    return [{
                        id: data.order_id,
                        daily_number: data.daily_number,
                        table_name: data.table_name,
                        created_at: data.created_at,
                        items: data.items
                    }, ...prev];
                });
                if (isAudioAllowedRef.current) startAlarm();
            }
            
            // 🔥 [2] 직원 호출 알림 (실시간 반영 로직 수정됨!)
            else if (data.type === "STAFF_CALL") {
                console.log("🔔 직원 호출 수신:", data);
                setStaffCalls(prev => {
                    // 중복 방지 후 추가
                    if (prev.some(c => c.id === data.id)) return prev;
                    return [{
                        id: data.id,
                        table_name: data.table_name,
                        message: data.message,
                        created_at: data.created_at
                    }, ...prev];
                });
                
                if (isAudioAllowedRef.current) startAlarm();
            }
        };

        ws.onclose = () => {
            console.log("🔴 연결 끊김, 재연결 시도...");
            setIsConnected(false);
            wsRef.current = null;
            reconnectTimeout.current = setTimeout(connectWebSocket, 3000); 
        };
    };

    useEffect(() => {
        fetchInitialData();
        connectWebSocket();
        return () => { if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current); };
    }, [storeId]);

    // 주문 완료 처리
    const handleCompleteOrder = async (orderId) => {
        if(!window.confirm("조리 완료 처리하시겠습니까?")) return;
        try {
            await axios.patch(`${API_BASE_URL}/orders/${orderId}/complete`);
            setOrders(prev => {
                const nextOrders = prev.filter(o => o.id !== orderId);
                if (nextOrders.length === 0 && staffCalls.length === 0) stopAlarm();
                return nextOrders;
            });
        } catch (err) { alert("처리 실패"); }
    };

    // 직원 호출 완료 처리
    const handleCompleteCall = async (callId) => {
        try {
            await axios.patch(`${API_BASE_URL}/calls/${callId}/complete`);
            setStaffCalls(prev => {
                const nextCalls = prev.filter(c => c.id !== callId);
                if (orders.length === 0 && nextCalls.length === 0) stopAlarm();
                return nextCalls;
            });
        } catch (err) { alert("처리 실패"); }
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
                <p className="mb-10 text-gray-400 text-lg">주방 알림 시스템을 시작하려면 아래 버튼을 눌러주세요.</p>
                <button onClick={startKitchenMode} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-5 px-16 rounded-full text-2xl shadow-2xl transition transform hover:scale-105">
                    시스템 시작 ▶
                </button>
                <audio ref={audioRef} src="/dingdong.mp3" loop hidden />
            </div>
        );
    }

    return (
        <div className={`min-h-screen transition-colors duration-500 font-sans ${isPlayingAlarm ? "bg-red-50" : "bg-gray-100"}`}>
            <audio ref={audioRef} src="/dingdong.mp3" loop hidden />

            {/* ✨ [UI 개선] 상단 네비게이션 바 (더 고급스럽게) */}
            <header className="bg-slate-800 text-white shadow-lg sticky top-0 z-50">
                <div className="max-w-8xl mx-auto px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-500 p-2 rounded-lg">
                            <span className="text-2xl">🍳</span>
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-wider">주방 현황판</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? "bg-green-400 animate-pulse" : "bg-red-500"}`}></span>
                                <span className="text-xs text-slate-300 font-medium">{isConnected ? "실시간 연결됨" : "연결 끊김"}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        {isPlayingAlarm && (
                            <div className="flex items-center gap-4 animate-pulse">
                                <span className="text-red-400 font-black text-2xl drop-shadow-md">🔔 알림 확인 요망!</span>
                                <button onClick={stopAlarm} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-lg border-2 border-red-400 transition transform hover:scale-105">
                                    소리 끄기
                                </button>
                            </div>
                        )}
                        <div className="text-right hidden md:block">
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pending Orders</p>
                            <p className="text-3xl font-black text-indigo-400">{orders.length}<span className="text-lg text-slate-500 ml-1">건</span></p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="p-6 max-w-8xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    
                    {/* 🔥 [UI 개선] 직원 호출 카드 (입체감 있는 디자인) */}
                    {staffCalls.map((call) => (
                        <div key={`call-${call.id}`} className="bg-white rounded-2xl shadow-xl border-l-8 border-yellow-400 overflow-hidden flex flex-col transform transition hover:-translate-y-1 duration-300 ring-1 ring-black/5 animate-slideUp">
                            <div className="bg-yellow-50 p-4 border-b border-yellow-100 flex justify-between items-center">
                                <span className="flex items-center gap-2 text-yellow-700 font-black text-lg">
                                    <span className="animate-bounce">🔔</span> 직원 호출
                                </span>
                                <span className="text-xs font-bold text-yellow-600 bg-yellow-200 px-2 py-1 rounded-full">{call.created_at}</span>
                            </div>
                            <div className="p-8 flex-1 flex flex-col items-center justify-center text-center space-y-4">
                                <h3 className="text-2xl font-extrabold text-gray-800">{call.table_name}</h3>
                                <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-xl font-bold text-xl shadow-inner inline-block">
                                    "{call.message}"
                                </div>
                            </div>
                            <button onClick={() => handleCompleteCall(call.id)} className="w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-bold py-4 text-lg transition-colors flex items-center justify-center gap-2">
                                <span>확인 완료</span> <span>👌</span>
                            </button>
                        </div>
                    ))}

                    {/* 🔥 [UI 개선] 주문 카드 (깔끔하고 모던한 디자인) */}
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col ring-1 ring-black/5 transition hover:shadow-2xl">
                            <div className="bg-slate-800 text-white p-4 flex justify-between items-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                                <div className="z-10">
                                    <span className="text-3xl font-black text-indigo-400 tracking-tighter">#{order.daily_number}</span>
                                    <span className="text-xs text-slate-400 block font-medium mt-0.5">{order.created_at} 접수</span>
                                </div>
                                <span className="z-10 text-lg font-bold bg-slate-700 px-3 py-1 rounded-lg border border-slate-600">{order.table_name || "Unknown"}</span>
                            </div>
                            
                            <div className="p-5 flex-1 overflow-y-auto max-h-[350px] bg-slate-50/50">
                                <ul className="space-y-3">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-lg text-slate-700 leading-tight">{item.menu_name}</span>
                                                <span className="bg-red-50 text-red-600 font-black px-2 py-0.5 rounded text-sm shrink-0 ml-2 border border-red-100">x {item.quantity}</span>
                                            </div>
                                            {item.options && (
                                                <div className="mt-2 text-sm text-slate-500 bg-slate-50 p-2 rounded border border-slate-100 flex gap-2">
                                                    <span className="text-slate-400">↳</span>
                                                    <span>{item.options}</span>
                                                </div>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            <div className="p-4 bg-white border-t border-slate-100">
                                <button onClick={() => handleCompleteOrder(order.id)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3.5 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <span>조리 완료</span> <span>✅</span>
                                </button>
                            </div>
                        </div>
                    ))}
                    
                    {orders.length === 0 && staffCalls.length === 0 && (
                        <div className="col-span-full py-40 flex flex-col items-center justify-center text-slate-300 select-none">
                            <div className="text-8xl mb-6 opacity-20 grayscale">🍽️</div>
                            <p className="text-3xl font-bold text-slate-400">대기 중인 주문이 없습니다</p>
                            <p className="text-slate-400 mt-2">주문이 들어오면 자동으로 알림이 울립니다.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default KitchenPage;