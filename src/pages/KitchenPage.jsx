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
        const token = localStorage.getItem("token"); 
        if (!token) return;

        try {
            const ordersRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/orders`, { headers: { Authorization: `Bearer ${token}` } });
            // 조리 완료(is_completed)되지 않은 주문만 필터링 (취소건도 is_completed가 false면 가져옴)
            setOrders(ordersRes.data.filter(order => !order.is_completed));
            
            const callsRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/calls`, { headers: { Authorization: `Bearer ${token}` } });
            setStaffCalls(callsRes.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    // 웹소켓 연결
    const connectWebSocket = () => {
        const token = localStorage.getItem("token");
        if (!token) {
            console.error("인증 토큰이 없습니다. 로그인 페이지로 이동합니다.");
            return;
        }

        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}//${baseUrl}/ws/${storeId}?token=${token}`;
        
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("🟢 주방 WebSocket 서버 연결 성공!");
            setIsConnected(true);
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };

        // ✨ 알림 수신 로직 (취소 알림이 와도 fetchInitialData를 호출해 화면 갱신)
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "NEW_ORDER" || data.type === "CANCEL_ORDER" || data.type === "PARTIAL_CANCEL_ORDER" || data.type === "NEW_CALL") {
                startAlarm();       // 🔔 띵동! 소리 울리기
                fetchInitialData(); // 🔄 화면 최신화 (호출 목록 다시 불러오기)
            }
        };

        ws.onclose = (e) => {
            console.warn(`🔴 WebSocket 끊김 (Code: ${e.code}). 3초 뒤 재연결 시도...`);
            setIsConnected(false);
            reconnectTimeout.current = setTimeout(() => {
                console.log("🔄 WebSocket 자동 재연결 시도 중...");
                connectWebSocket();
            }, 3000);
        };

        ws.onerror = (err) => {
            console.error("WebSocket 통신 에러:", err);
            ws.close(); 
        };

        wsRef.current = ws;
    };

    useEffect(() => {
        fetchInitialData(); 
        connectWebSocket();
        
        return () => {
            if (wsRef.current) {
                wsRef.current.onclose = null; 
                wsRef.current.close();
            }
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, [storeId]);

    // 주문/취소 완료 처리 (화면에서 치우기)
    const handleCompleteOrder = async (orderId) => {
        // 이미 취소된 주문은 "조리 완료"가 아니라 "취소 확인"이므로 메시지를 다르게 띄웁니다.
        const targetOrder = orders.find(o => o.id === orderId);
        const confirmMsg = targetOrder?.payment_status === "CANCELLED" 
            ? "취소된 주문을 화면에서 지우시겠습니까?" 
            : "조리 완료 처리하시겠습니까?";

        if(!window.confirm(confirmMsg)) return;
        
        const token = localStorage.getItem("token"); 
        try {
            await axios.patch(`${API_BASE_URL}/orders/${orderId}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(prev => {
                const nextOrders = prev.filter(o => o.id !== orderId);
                if (nextOrders.length === 0 && staffCalls.length === 0) stopAlarm();
                return nextOrders;
            });
        } catch (err) { alert("처리 실패"); }
    };

    // 직원 호출 완료 처리
    const handleCompleteCall = async (callId) => {
        const token = localStorage.getItem("token"); 
        try {
            await axios.patch(`${API_BASE_URL}/calls/${callId}/complete`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
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
                    
                    {/* 직원 호출 카드 */}
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

                    {/* 🔥 주문 카드 렌더링 (취소 상태 완벽 반영) */}
                    {orders.map((order) => {
                        const isFullyCancelled = order.payment_status === 'CANCELLED';
                        
                        return (
                            <div key={order.id} className={`rounded-2xl shadow-lg overflow-hidden flex flex-col ring-1 transition hover:shadow-2xl ${
                                isFullyCancelled 
                                    ? 'bg-red-50 ring-red-500 border-2 border-red-500 opacity-95' 
                                    : 'bg-white ring-black/5'
                            }`}>
                                {/* ✨ 전체 취소 배너 */}
                                {isFullyCancelled && (
                                    <div className="bg-red-600 text-white text-center font-black py-2 text-sm animate-pulse tracking-wide">
                                        🚨 전체 취소된 주문입니다! (조리 중지) 🚨
                                    </div>
                                )}

                                <div className={`${isFullyCancelled ? 'bg-red-900' : 'bg-slate-800'} text-white p-4 flex justify-between items-center relative overflow-hidden transition-colors`}>
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                                    <div className="z-10">
                                        <span className={`text-3xl font-black tracking-tighter ${isFullyCancelled ? 'text-red-300' : 'text-indigo-400'}`}>#{order.daily_number}</span>
                                        <span className="text-xs text-slate-300 block font-medium mt-0.5">{order.created_at} 접수</span>
                                    </div>
                                    <span className="z-10 text-lg font-bold bg-white/10 px-3 py-1 rounded-lg border border-white/20">{order.table_name || "Unknown"}</span>
                                </div>
                                
                                <div className={`p-5 flex-1 overflow-y-auto max-h-[350px] ${isFullyCancelled ? 'bg-red-50/50' : 'bg-slate-50/50'}`}>
                                    <ul className="space-y-3">
                                        {order.items.map((item, idx) => (
                                            <li key={idx} className={`p-3 rounded-lg border shadow-sm transition-colors ${
                                                item.is_cancelled ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'
                                            }`}>
                                                <div className="flex justify-between items-start">
                                                    <span className={`font-bold text-lg leading-tight ${item.is_cancelled ? 'line-through text-red-500' : 'text-slate-700'}`}>
                                                        {item.menu_name}
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        {/* ✨ 부분 취소 뱃지 */}
                                                        {item.is_cancelled && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded-md font-bold animate-pulse shadow-sm">취소됨</span>}
                                                        <span className={`font-black px-2 py-0.5 rounded text-sm shrink-0 border ${
                                                            item.is_cancelled ? 'bg-red-100 text-red-400 border-red-200 line-through' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                                        }`}>
                                                            x {item.quantity}
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* ✨ 옵션 변수명을 스키마에 맞게 options_desc 로 변경 */}
                                                {item.options_desc && (
                                                    <div className={`mt-2 text-sm p-2 rounded border flex gap-2 ${
                                                        item.is_cancelled ? 'bg-red-100/50 border-red-200 text-red-400 line-through' : 'text-slate-500 bg-slate-50 border-slate-100'
                                                    }`}>
                                                        <span className={item.is_cancelled ? "text-red-300" : "text-slate-400"}>↳</span>
                                                        <span>{item.options_desc}</span>
                                                    </div>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                
                                <div className={`p-4 border-t ${isFullyCancelled ? 'bg-red-50 border-red-200' : 'bg-white border-slate-100'}`}>
                                    <button onClick={() => handleCompleteOrder(order.id)} className={`w-full py-3.5 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${
                                        isFullyCancelled
                                            ? 'bg-gray-800 hover:bg-black text-white'
                                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                    }`}>
                                        {/* ✨ 전체 취소된 주문은 버튼 텍스트가 바뀝니다! */}
                                        {isFullyCancelled ? (
                                            <><span>취소 확인 (화면 닫기)</span> <span>🗑️</span></>
                                        ) : (
                                            <><span>조리 완료</span> <span>✅</span></>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    
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