import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function KitchenPage() {
    const { storeId } = useParams();
    
    const [orders, setOrders] = useState([]);         
    const [staffCalls, setStaffCalls] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    
    // 오디오 설정
    const [isAudioAllowed, setIsAudioAllowed] = useState(false); 
    const [isPlayingAlarm, setIsPlayingAlarm] = useState(false); 
    const audioRef = useRef(new Audio("/dingdong.mp3"));
    const wsRef = useRef(null);
    const reconnectTimeout = useRef(null);

    useEffect(() => {
        audioRef.current.loop = true;
        return () => {
            stopAlarm();
            if (wsRef.current) wsRef.current.close();
            if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
        };
    }, []);

    const startAlarm = () => {
        if (isPlayingAlarm) return;
        audioRef.current.currentTime = 0;
        audioRef.current.play()
            .then(() => setIsPlayingAlarm(true))
            .catch(e => console.error("오디오 재생 실패 (사용자 클릭 필요):", e));
    };

    const stopAlarm = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAlarm(false);
    };

    const fetchInitialData = async () => {
        try {
            const ordersRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/orders`);
            // 결제 완료된 주문만 필터링하여 초기 로드
            setOrders(ordersRes.data.filter(order => !order.is_completed));
            const callsRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/calls`);
            setStaffCalls(callsRes.data);
        } catch (err) { console.error(err); } 
        finally { setLoading(false); }
    };

    const connectWebSocket = () => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) return;
        
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/${storeId}`;
        
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log("🟢 주방 연결됨");
            setIsConnected(true);
            fetchInitialData();
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "NEW_ORDER") {
                const newOrder = convertWsOrderToState(data);
                
                // 🔥 [핵심] 중복 방지 로직: 이미 리스트에 같은 주문 ID가 있으면 추가 안 함
                setOrders(prev => {
                    if (prev.some(o => o.id === newOrder.id)) return prev;
                    return [newOrder, ...prev];
                });
                
                if (isAudioAllowed) startAlarm();
            }
        };

        ws.onclose = () => {
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

    const convertWsOrderToState = (wsData) => ({
        id: wsData.order_id,
        daily_number: wsData.daily_number,
        table_name: wsData.table_name,
        created_at: wsData.created_at,
        items: wsData.items
    });

    const handleCompleteOrder = async (orderId) => {
        if(!window.confirm("조리 완료 처리하시겠습니까?")) return;
        try {
            await axios.patch(`${API_BASE_URL}/orders/${orderId}/complete`);
            setOrders(prev => prev.filter(o => o.id !== orderId));
            if (orders.length <= 1 && staffCalls.length === 0) stopAlarm();
        } catch (err) { alert("처리 실패"); }
    };

    const startKitchenMode = () => {
        audioRef.current.play().then(() => {
            audioRef.current.pause();
            setIsAudioAllowed(true);
        }).catch(() => alert("소리 재생 권한이 필요합니다."));
    };

    if (!isAudioAllowed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white">
                <div className="text-7xl mb-6">👨‍🍳</div>
                <h1 className="text-4xl font-bold mb-6">주방 디스플레이 (KDS)</h1>
                <p className="mb-8 text-gray-400">알림 소리를 위해 권한이 필요합니다.</p>
                <button onClick={startKitchenMode} className="bg-green-600 hover:bg-green-700 text-white font-bold py-5 px-12 rounded-full text-2xl shadow-xl">
                    주방 모드 시작 ▶
                </button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen p-4 transition-colors duration-500 ${isPlayingAlarm ? "bg-red-50" : "bg-gray-100"}`}>
            <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border-l-8 border-indigo-600">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-extrabold text-gray-800">🍳 주방 현황</h1>
                    <span className={`px-2 py-1 rounded text-xs font-bold ${isConnected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {isConnected ? "🟢 연결됨" : "🔴 연결 끊김"}
                    </span>
                    {isPlayingAlarm && (
                        <button onClick={stopAlarm} className="bg-red-600 text-white px-6 py-2 rounded-full font-bold animate-pulse">🔔 소리 끄기</button>
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 font-bold">대기 중</p>
                    <p className="text-3xl font-black text-indigo-600">{orders.length}건</p>
                </div>
            </header>

            {loading ? <div>로딩중...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {orders.map((order) => (
                        <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden flex flex-col h-full animate-slideUp">
                            <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                                <div>
                                    <span className="text-2xl font-bold text-yellow-400">#{order.daily_number}</span>
                                    <span className="text-xs text-gray-300 block">{order.created_at}</span>
                                </div>
                                <span className="text-lg font-bold">{order.table_name || "Unknown"}</span>
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto">
                                <ul className="space-y-4">
                                    {order.items.map((item, idx) => (
                                        <li key={idx} className="border-b border-gray-100 pb-3 last:border-0">
                                            <div className="flex justify-between font-bold text-lg text-gray-800">
                                                <span>{item.menu_name}</span>
                                                <span className="text-red-600 ml-2">x {item.quantity}</span>
                                            </div>
                                            {item.options && <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded mt-1">↳ {item.options}</p>}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="p-4 border-t">
                                <button onClick={() => handleCompleteOrder(order.id)} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg shadow-sm">조리 완료 ✅</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default KitchenPage;