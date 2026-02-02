import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function KitchenPage() {
    const { storeId } = useParams();
    
    // === 상태 관리 ===
    const [orders, setOrders] = useState([]);         // 주문 목록
    const [staffCalls, setStaffCalls] = useState([]); // 직원 호출 목록
    const [loading, setLoading] = useState(true);
    
    // 오디오 관련 상태
    const [isAudioAllowed, setIsAudioAllowed] = useState(false); // 브라우저 권한 여부
    const [isPlayingAlarm, setIsPlayingAlarm] = useState(false); // 현재 알림 울림 여부

    // 이전 데이터 개수 기억 (알림 트리거용: 주문수 + 호출수)
    const prevTotalCountRef = useRef(0);
    
    // 오디오 객체 (반복 재생용)
    const audioRef = useRef(new Audio("/dingdong.mp3"));

    // 초기 설정: 오디오 반복 재생 활성화
    useEffect(() => {
        audioRef.current.loop = true;
    }, []);

    // === 1. 알림 제어 함수 ===
    const startAlarm = () => {
        if (isPlayingAlarm) return; // 이미 울리고 있으면 패스

        audioRef.current.currentTime = 0;
        audioRef.current.play()
            .then(() => setIsPlayingAlarm(true))
            .catch(e => console.log("자동 재생 막힘 (화면 클릭 필요):", e));
    };

    const stopAlarm = () => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setIsPlayingAlarm(false);
    };

    // === 2. 통합 데이터 가져오기 (주문 + 호출) ===
    const fetchData = async (isBackground = false) => {
        try {
            // (1) 주문 목록 조회
            const ordersRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/orders`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            // 미완료 주문만 필터링
            const activeOrders = ordersRes.data.filter(order => !order.is_completed);

            // (2) 직원 호출 목록 조회
            const callsRes = await axios.get(`${API_BASE_URL}/stores/${storeId}/calls`, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            });
            // 백엔드에서 이미 미완료만 보내준다고 가정 (아니라면 여기서 filter 필요)
            const activeCalls = callsRes.data;

            // (3) 알림 트리거 로직
            const currentTotalCount = activeOrders.length + activeCalls.length;

            // 백그라운드 갱신이고 + 소리 권한 있고 + (주문이나 호출이) 늘어났다면 -> 알림 시작!
            if (isBackground && isAudioAllowed && currentTotalCount > prevTotalCountRef.current) {
                startAlarm();
            }

            // 상태 업데이트
            prevTotalCountRef.current = currentTotalCount;
            setOrders(activeOrders);
            setStaffCalls(activeCalls);

        } catch (err) {
            console.error("데이터 로딩 실패", err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    };

    // === 3. 실시간 폴링 (5초 주기) ===
    useEffect(() => {
        fetchData(); // 최초 실행

        const intervalId = setInterval(() => {
            fetchData(true); // 백그라운드 모드
        }, 5000);

        return () => {
            clearInterval(intervalId);
            stopAlarm(); // 페이지 이탈 시 알림 끄기
        };
    }, [storeId, isAudioAllowed]);

    // === 4. 완료 처리 핸들러 ===
    // (1) 음식 주문 완료
    const handleCompleteOrder = async (orderId) => {
        if(!window.confirm("조리 완료 처리하시겠습니까?")) return;
        try {
            await axios.patch(`${API_BASE_URL}/orders/${orderId}/complete`);
            fetchData(true); // 즉시 갱신
        } catch (err) { alert("처리 실패"); }
    };

    // (2) 직원 호출 완료
    const handleCompleteCall = async (callId) => {
        try {
            await axios.patch(`${API_BASE_URL}/calls/${callId}/complete`);
            fetchData(true); // 즉시 갱신
        } catch (err) { alert("처리 실패"); }
    };

    // === 5. 주방 모드 시작 (권한 획득) ===
    const startKitchenMode = () => {
        // 빈 소리를 재생하여 브라우저 정책 통과
        audioRef.current.play().then(() => {
            audioRef.current.pause();
            setIsAudioAllowed(true);
        }).catch(() => alert("소리 재생 권한을 얻지 못했습니다. 브라우저 설정을 확인해주세요."));
    };

    // [화면 1] 권한 요청 대기 화면
    if (!isAudioAllowed) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white animate-fadeIn">
                <div className="text-7xl mb-6">👨‍🍳</div>
                <h1 className="text-4xl font-bold mb-6">주방 디스플레이 시스템 (KDS)</h1>
                <p className="text-gray-400 mb-10 text-lg">주문 알림 소리를 재생하려면 아래 버튼을 눌러주세요.</p>
                <button 
                    onClick={startKitchenMode}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-5 px-12 rounded-full text-2xl shadow-xl transition transform hover:scale-105"
                >
                    주방 모드 시작하기 ▶
                </button>
            </div>
        );
    }

    // [화면 2] 메인 주방 화면
    return (
        <div className={`min-h-screen p-4 transition-colors duration-500 ${isPlayingAlarm ? "bg-red-50" : "bg-gray-100"}`}>
            {/* --- 상단 헤더 --- */}
            <header className="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border-l-8 border-indigo-600">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-extrabold text-gray-800">🍳 주방 현황</h1>
                    
                    {/* 알림 끄기 버튼 (알림 울릴 때만 등장) */}
                    {isPlayingAlarm && (
                        <button 
                            onClick={stopAlarm}
                            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-full font-bold shadow-lg animate-pulse"
                        >
                            <span className="text-xl">🔔</span>
                            <span>소리 끄기 (확인)</span>
                        </button>
                    )}
                </div>

                <div className="text-right flex gap-6">
                    <div>
                        <p className="text-xs text-gray-500 font-bold">직원 호출</p>
                        <p className={`text-3xl font-black ${staffCalls.length > 0 ? "text-red-600 animate-bounce" : "text-gray-400"}`}>
                            {staffCalls.length}건
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 font-bold">주문 대기</p>
                        <p className="text-3xl font-black text-indigo-600">{orders.length}건</p>
                    </div>
                </div>
            </header>

            {loading ? <div className="text-center py-20 text-gray-500 font-bold text-xl">⏳ 데이터를 불러오는 중...</div> : (
                <div className="space-y-8">
                    
                    {/* --- 섹션 1: 직원 호출 (있을 때만 표시) --- */}
                    {staffCalls.length > 0 && (
                        <div className="bg-red-100 border-l-8 border-red-600 p-6 rounded-r-xl shadow-md animate-pulse-slow">
                            <h2 className="font-bold text-red-800 text-xl mb-4 flex items-center gap-2">
                                🔔 직원 호출 요청 ({staffCalls.length}건)
                            </h2>
                            <div className="flex flex-wrap gap-4">
                                {staffCalls.map(call => (
                                    <div key={call.id} className="bg-white p-4 rounded-xl shadow-sm flex flex-col gap-2 border border-red-200 min-w-[200px]">
                                        <div className="flex justify-between items-start">
                                            <span className="font-bold text-gray-800 text-xl">{call.table_name}</span>
                                            <span className="text-xs text-gray-400">{call.created_at.substring(11, 16)}</span>
                                        </div>
                                        <span className="block text-red-600 font-extrabold text-2xl">{call.message}</span>
                                        <button 
                                            onClick={() => handleCompleteCall(call.id)}
                                            className="mt-2 w-full bg-gray-800 text-white py-2 rounded-lg font-bold hover:bg-black transition"
                                        >
                                            확인 (완료)
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- 섹션 2: 주문 목록 (그리드) --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {orders.map((order) => (
                            <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-transparent hover:border-indigo-500 transition-all flex flex-col h-full">
                                {/* 주문 카드 헤더 */}
                                <div className="bg-gray-800 text-white p-4 flex justify-between items-center">
                                    <div>
                                        <span className="text-xs text-gray-400 font-bold block mb-1">ORDER NO.</span>
                                        <span className="text-2xl font-bold text-yellow-400">#{order.daily_number}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-lg font-bold block">{order.table_name || "테이블 미정"}</span>
                                        <span className="text-xs text-gray-400 font-mono">{order.created_at.substring(11, 16)}</span>
                                    </div>
                                </div>

                                {/* 메뉴 리스트 */}
                                <div className="p-5 flex-1 overflow-y-auto bg-white min-h-[200px]">
                                    <ul className="space-y-4">
                                        {order.items.map((item) => (
                                            <li key={item.id} className="border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-lg text-gray-800 break-keep">{item.menu_name}</span>
                                                    <span className="bg-red-50 text-red-600 border border-red-100 px-2 py-0.5 rounded text-sm font-extrabold shrink-0 ml-2">
                                                        x {item.quantity}
                                                    </span>
                                                </div>
                                                {item.options_desc && (
                                                    <p className="text-sm text-gray-500 bg-gray-50 p-2 rounded mt-1">
                                                        ↳ {item.options_desc}
                                                    </p>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* 하단 버튼 */}
                                <div className="p-4 bg-gray-50 border-t">
                                    <button 
                                        onClick={() => handleCompleteOrder(order.id)}
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg shadow-sm active:scale-95 transition-transform"
                                    >
                                        조리 완료 ✅
                                    </button>
                                </div>
                            </div>
                        ))}
                        
                        {orders.length === 0 && staffCalls.length === 0 && (
                            <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-300">
                                <div className="text-7xl mb-4 grayscale opacity-30">🍽️</div>
                                <p className="text-2xl font-bold text-gray-400">현재 대기 중인 주문이 없습니다.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default KitchenPage;