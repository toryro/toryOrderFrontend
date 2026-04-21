import { useState, useEffect, useRef } from "react"; 
import { useParams, useNavigate } from "react-router-dom"; 
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config"; 
import { StaffOrderModal } from "../components/admin/StaffOrderModal";

export function TableDashboard() {
    const { storeId } = useParams(); 
    const navigate = useNavigate(); 
    
    // ✨ 테이블 목록과 활성화된(미완료) 주문 목록을 함께 관리합니다.
    const [tables, setTables] = useState([]); 
    const [activeOrders, setActiveOrders] = useState([]); 
    const token = localStorage.getItem("token");

    const [selectedTable, setSelectedTable] = useState(null); 
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    
    const wsRef = useRef(null);

    // ✨ [핵심 로직] 테이블 현황과 진행 중인 주문 내역을 동시에 가져옵니다.
    const fetchDashboardData = async () => {
        try {
            const [tablesRes, ordersRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/stores/${storeId}/tables`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/stores/${storeId}/orders`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setTables(tablesRes.data);
            setActiveOrders(ordersRes.data);
        } catch (err) {
            console.error("현황판 데이터를 불러오는데 실패했습니다.", err);
        }
    };

    const connectWebSocket = () => {
        if (!token) return;
        const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
        const wsUrl = `${wsProtocol}//${baseUrl}/ws/${storeId}?token=${token}`;
        
        const ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (["NEW_ORDER", "TABLE_STATUS_CHANGED", "ORDER_COMPLETED"].includes(data.type)) {
                fetchDashboardData(); // 데이터 갱신 시 두 가지 모두 업데이트
            }
        };

        ws.onclose = () => {
            setTimeout(() => connectWebSocket(), 3000);
        };
        
        wsRef.current = ws;
    };

    useEffect(() => {
        if (storeId) {
            // 1. 최초 데이터 및 웹소켓 연결
            fetchDashboardData();
            connectWebSocket(); 
            
            // 2. 맥북 잠자기 깨어남 대응: 화면에 다시 포커스가 올 때 즉시 갱신
            const handleFocus = () => {
                console.log("화면 포커스 감지: 데이터를 최신화합니다.");
                fetchDashboardData();
            };
            window.addEventListener('focus', handleFocus);
            
            // 3. 백업용 10초 폴링
            const interval = setInterval(fetchDashboardData, 10000); 
            
            // [정리] 컴포넌트가 사라질 때(unmount) 실행
            return () => {
                clearInterval(interval);
                window.removeEventListener('focus', handleFocus); // 이벤트 제거
                if (wsRef.current) wsRef.current.close();
            };
        }
    }, [storeId]);

    const handleClearTable = async (tableId, tableName) => {
        // 1. 해당 테이블의 미완료 주문 수 확인
        const unservedOrders = activeOrders.filter(o => o.table_id === tableId && !o.is_completed);
        const hasPending = unservedOrders.length > 0;

        // 2. 기본 경고
        let confirmMessage = `[${tableName}] 테이블을 비우시겠습니까?\n새로운 QR이 발급됩니다.`;
        
        // 3. 🚨 조리 중일 때 강력 경고 추가
        if (hasPending) {
            confirmMessage = `⚠️ 경고: [${tableName}]에 아직 조리 중인 주문이 ${unservedOrders.length}건 있습니다!\n\n지금 퇴석 처리하면 주방의 주문도 함께 취소될 수 있습니다.\n정말로 강제 퇴석 처리하시겠습니까?`;
        }

        if (!window.confirm(confirmMessage)) return;

        // 추가 확인 (실수 방지 쐐기)
        if (hasPending && !window.confirm("진짜로 비웁니까? 주방에서 이미 요리를 시작했을 수 있습니다.")) return;

        try {
            await axios.post(`${API_BASE_URL}/tables/${tableId}/clear`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${tableName} 정리가 완료되었습니다.`, { icon: '🧹' });
            fetchDashboardData(); 
        } catch (err) {
            toast.error("테이블 초기화에 실패했습니다.");
        }
    };

    const handleOpenOrder = (table) => {
        setSelectedTable(table);
        setIsOrderModalOpen(true);
    };

    const getStatusConfig = (status) => {
        switch(status) {
            case "EMPTY": 
                return { text: "빈 자리", bg: "bg-amber-50/30", border: "border-amber-200", textCol: "text-amber-800", icon: "🪑" };
            case "PENDING": 
                return { text: "접수 대기", bg: "bg-yellow-50", border: "border-yellow-400", textCol: "text-yellow-700", icon: "⏳", pulse: true };
            case "COOKING": 
                return { text: "조리 중", bg: "bg-blue-50", border: "border-blue-400", textCol: "text-blue-700", icon: "🧑‍🍳", pulse: true };
            case "OCCUPIED": 
                return { text: "식사 중", bg: "bg-green-50", border: "border-green-400", textCol: "text-green-700", icon: "🍽️" };
            case "CLEANING_REQUESTED": 
                return { text: "정리 요망", bg: "bg-red-50", border: "border-red-400", textCol: "text-red-700", icon: "🧹" };
            default: 
                return { text: "알 수 없음", bg: "bg-gray-100", border: "border-gray-200", textCol: "text-gray-500", icon: "❓" };
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString.replace(' ', 'T'));
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-20">
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center transition font-bold">
                            ←
                        </button>
                        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                            <span>🗺️</span> 홀 테이블 현황판
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 text-sm font-bold text-gray-500">
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400"></span>접수대기</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400"></span>조리중</span>
                        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400"></span>식사중</span>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-4">
                    {tables.map(table => {
                        const config = getStatusConfig(table.current_status);
                        const isOccupied = table.current_status !== "EMPTY";
                        
                        // ✨ [알림 배지 로직] 이 테이블에 소속된 미완료 주문의 개수를 계산합니다.
                        const unservedOrdersCount = activeOrders.filter(o => o.table_id === table.id && !o.is_completed).length;
                        // 테이블 상태가 '식사 중(OCCUPIED)'인데 미완료 주문이 있다면 알람을 띄웁니다.
                        const needsAdditionalServing = table.current_status === "OCCUPIED" && unservedOrdersCount > 0;

                        return (
                            <div key={table.id} className={`rounded-2xl border-2 flex flex-col justify-between transition-all duration-300 ${config.bg} ${config.border} shadow-sm hover:shadow-md h-[220px] relative overflow-visible`}>
                                
                                {/* ✨ 추가 서빙이 필요할 때 우측 상단에 튀어나오는 빨간색 알림 배지 */}
                                {needsAdditionalServing && (
                                    <div className="absolute -top-3 -right-3 bg-red-600 text-white font-black text-[11px] px-3 py-1.5 rounded-full shadow-[0_5px_15px_rgba(220,38,38,0.5)] border-2 border-white z-10 animate-bounce flex items-center gap-1">
                                        <span>🚨</span> 추가 서빙 {unservedOrdersCount}건
                                    </div>
                                )}
                                
                                <div className="p-4 flex justify-between items-start">
                                    <h3 className={`font-black text-xl ${config.textCol}`}>{table.name}</h3>
                                    <span className={`text-3xl ${config.pulse ? 'animate-pulse' : ''}`}>{config.icon}</span>
                                </div>
                                
                                <div className="px-4 pb-2 flex-1 flex flex-col justify-center relative">
                                    <div className={`font-extrabold text-lg ${config.textCol}`}>{config.text}</div>
                                    {isOccupied && table.occupied_at && (
                                        <div className="text-xs font-bold opacity-70 mt-1 flex items-center gap-1">
                                            <span>⏱️</span> 착석: {formatTime(table.occupied_at)}
                                        </div>
                                    )}
                                </div>

                                <div className="p-2 border-t border-black/5 bg-white/60 flex flex-col gap-2">
                                    <button 
                                        onClick={() => handleOpenOrder(table)}
                                        className={`w-full text-white py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition ${needsAdditionalServing ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    >
                                        {needsAdditionalServing ? '🛍️ 내역 확인/서빙 완료' : '🛍️ 직원 주문 넣기'}
                                    </button>

                                    {isOccupied ? (
                                        <button 
                                            onClick={() => handleClearTable(table.id, table.name)}
                                            className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-bold hover:bg-black shadow-sm transition-transform active:scale-95"
                                        >
                                            퇴석 / 비우기
                                        </button>
                                    ) : (
                                        <button disabled className="w-full py-2 rounded-lg text-sm font-bold bg-white text-slate-400 border border-slate-200 cursor-not-allowed">
                                            빈 자리
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {isOrderModalOpen && selectedTable && (
                <StaffOrderModal 
                    storeId={storeId}
                    table={selectedTable}
                    token={token}
                    onClose={() => setIsOrderModalOpen(false)}
                    onSuccess={() => {
                        setIsOrderModalOpen(false);
                        fetchDashboardData();
                    }}
                />
            )}
        </div>
    );
}

export default TableDashboard;