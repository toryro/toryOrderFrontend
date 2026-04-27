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
    const [storeInfo, setStoreInfo] = useState(null);
    const token = localStorage.getItem("token");

    const [selectedTable, setSelectedTable] = useState(null);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [clearModal, setClearModal] = useState({ isOpen: false, tableId: null, tableName: "", pendingOrders: [], deferredOrders: [] });
    const [collectModal, setCollectModal] = useState({ isOpen: false, tableId: null, tableName: "", deferredOrders: [] });
    const [takeoutLink, setTakeoutLink] = useState(null);
    const [takeoutLoading, setTakeoutLoading] = useState(false);
    
    const wsRef = useRef(null);
    const reconnectTimeout = useRef(null);
    const reconnectAttempt = useRef(0);

    // ✨ [핵심 로직] 테이블 현황과 진행 중인 주문 내역을 동시에 가져옵니다.
    const fetchDashboardData = async () => {
        try {
            const [tablesRes, ordersRes, storeRes] = await Promise.all([
                axios.get(`${API_BASE_URL}/stores/${storeId}/tables`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/stores/${storeId}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_BASE_URL}/stores/${storeId}`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);
            setTables(tablesRes.data);
            setActiveOrders(ordersRes.data);
            setStoreInfo(storeRes.data);
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

        ws.onopen = () => {
            reconnectAttempt.current = 0;
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === "ping") return;
            if (["NEW_ORDER", "TABLE_STATUS_CHANGED", "ORDER_COMPLETED", "PAYMENT_COLLECTED", "ORDER_CANCELLED"].includes(data.type)) {
                fetchDashboardData();
            }
        };

        ws.onerror = () => ws.close();

        ws.onclose = (event) => {
            if (event.code === 1008) return; // 인증 실패 — 재연결해도 동일하게 거절됨
            const delay = Math.min(1000 * Math.pow(2, reconnectAttempt.current), 30000) + Math.random() * 1000;
            reconnectAttempt.current += 1;
            reconnectTimeout.current = setTimeout(() => connectWebSocket(), delay);
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
                window.removeEventListener('focus', handleFocus);
                if (reconnectTimeout.current) clearTimeout(reconnectTimeout.current);
                if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(); }
            };
        }
    }, [storeId]);

    const handleOpenCollect = (tableId, tableName) => {
        const deferredOrders = activeOrders.filter(
            o => o.table_id === tableId && !o.is_completed && o.payment_status === "DEFERRED"
        );
        setCollectModal({ isOpen: true, tableId, tableName, deferredOrders });
    };

    const handleCollectPayment = async (paymentMethod) => {
        const { deferredOrders } = collectModal;
        try {
            await Promise.all(
                deferredOrders.map(o =>
                    axios.patch(
                        `${API_BASE_URL}/orders/${o.id}/collect-payment`,
                        { payment_method: paymentMethod },
                        { headers: { Authorization: `Bearer ${token}` } }
                    )
                )
            );
            setCollectModal({ isOpen: false, tableId: null, tableName: "", deferredOrders: [] });
            toast.success("수납이 완료되었습니다!");
            fetchDashboardData();
        } catch {
            toast.error("수납 처리 실패");
        }
    };

    const handleClearTable = (tableId, tableName) => {
        // is_completed=true인 DEFERRED 주문도 포함: 조리완료 후 수납 안 된 경우 경고 필요
        const pendingOrders = activeOrders.filter(
            o => o.table_id === tableId && !o.is_completed && o.payment_status !== "DEFERRED"
        );
        const deferredOrders = activeOrders.filter(
            o => o.table_id === tableId && o.payment_status === "DEFERRED"
        );
        setClearModal({ isOpen: true, tableId, tableName, pendingOrders, deferredOrders });
    };

    const executeClearTable = async () => {
        const { tableId, tableName } = clearModal;
        setClearModal(prev => ({ ...prev, isOpen: false }));
        try {
            await axios.post(`${API_BASE_URL}/tables/${tableId}/clear`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${tableName} 정리가 완료되었습니다.`, { icon: '🧹' });
            fetchDashboardData();
        } catch (err) {
            toast.error(err.response?.data?.detail || "테이블 초기화에 실패했습니다.");
        }
    };

    const handleOpenOrder = (table) => {
        setSelectedTable(table);
        setIsOrderModalOpen(true);
    };

    const handleIssueTakeoutLink = async () => {
        setTakeoutLoading(true);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/stores/${storeId}/virtual-sessions`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const url = `${window.location.origin}/order/${res.data.token}`;
            setTakeoutLink(url);
        } catch {
            toast.error("포장 링크 발행에 실패했습니다.");
        } finally {
            setTakeoutLoading(false);
        }
    };

    const handleCopyTakeoutLink = () => {
        navigator.clipboard.writeText(takeoutLink);
        toast.success("링크가 복사되었습니다!");
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
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex items-center gap-3 text-sm font-bold text-gray-500">
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400"></span>접수대기</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-400"></span>조리중</span>
                            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400"></span>식사중</span>
                        </div>
                        <button
                            onClick={handleIssueTakeoutLink}
                            disabled={takeoutLoading}
                            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-md transition active:scale-95"
                        >
                            <span className="text-base">🎁</span>
                            {takeoutLoading ? "발행 중..." : "포장 주문 발행"}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 mt-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mt-4">
                    {tables.map(table => {
                        const config = getStatusConfig(table.current_status);
                        const isOccupied = table.current_status !== "EMPTY";

                        const unservedOrdersCount = activeOrders.filter(o => o.table_id === table.id && !o.is_completed).length;
                        const needsAdditionalServing = table.current_status === "OCCUPIED" && unservedOrdersCount > 0;

                        const deferredOrders = activeOrders.filter(o => o.table_id === table.id && !o.is_completed && o.payment_status === "DEFERRED");
                        const hasDeferred = deferredOrders.length > 0;
                        const deferredTotal = deferredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

                        return (
                            <div key={table.id} className={`rounded-2xl border-2 flex flex-col justify-between transition-all duration-300 ${config.bg} ${config.border} shadow-sm hover:shadow-md min-h-[220px] relative overflow-visible`}>

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
                                    {hasDeferred && (
                                        <div className="mt-2 flex items-center gap-1.5 bg-amber-100 border border-amber-300 rounded-lg px-2 py-1">
                                            <span className="text-sm">💴</span>
                                            <span className="text-xs font-black text-amber-800">미수납 {deferredTotal.toLocaleString()}원</span>
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

                                    {hasDeferred && (
                                        <button
                                            onClick={() => handleOpenCollect(table.id, table.name)}
                                            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg text-sm font-bold shadow-sm active:scale-95 transition"
                                        >
                                            💴 수납 처리
                                        </button>
                                    )}

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

            {clearModal.isOpen && (
                <ClearTableModal
                    tableName={clearModal.tableName}
                    pendingOrders={clearModal.pendingOrders}
                    deferredOrders={clearModal.deferredOrders}
                    onConfirm={executeClearTable}
                    onCancel={() => setClearModal(prev => ({ ...prev, isOpen: false }))}
                />
            )}

            {collectModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setCollectModal({ isOpen: false, tableId: null, tableName: "", deferredOrders: [] })}>
                    <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="bg-emerald-700 text-white p-5 font-bold text-lg flex justify-between items-center">
                            <span className="flex items-center gap-2"><span className="text-2xl">💴</span> 수납 처리</span>
                            <button onClick={() => setCollectModal({ isOpen: false, tableId: null, tableName: "", deferredOrders: [] })} className="text-emerald-200 hover:text-white text-2xl">&times;</button>
                        </div>
                        <div className="p-6 flex flex-col gap-4">
                            <div className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-sm text-gray-500 mb-1">{collectModal.tableName} · 미수납 {collectModal.deferredOrders.length}건</p>
                                <p className="text-3xl font-black text-gray-800">
                                    {collectModal.deferredOrders.reduce((s, o) => s + (o.total_price || 0), 0).toLocaleString()}
                                    <span className="text-lg font-bold ml-1">원</span>
                                </p>
                            </div>

                            {storeInfo?.has_pos ? (
                                <button
                                    onClick={() => handleCollectPayment("POS")}
                                    className="w-full py-4 rounded-xl font-black text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all active:scale-95"
                                >
                                    포스기 수납 완료 ✅
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => handleCollectPayment("card")}
                                        className="py-4 rounded-xl font-black text-lg bg-indigo-500 hover:bg-indigo-600 text-white shadow-md transition-all active:scale-95 flex flex-col items-center gap-1"
                                    >
                                        <span className="text-2xl">💳</span> 카드
                                    </button>
                                    <button
                                        onClick={() => handleCollectPayment("cash")}
                                        className="py-4 rounded-xl font-black text-lg bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all active:scale-95 flex flex-col items-center gap-1"
                                    >
                                        <span className="text-2xl">💵</span> 현금
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={() => setCollectModal({ isOpen: false, tableId: null, tableName: "", deferredOrders: [] })}
                                className="w-full py-3 rounded-xl font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {takeoutLink && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={() => setTakeoutLink(null)}
                >
                    <div
                        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">🎁</span>
                            <h3 className="font-extrabold text-xl text-gray-800">포장 주문 링크 발행됨</h3>
                        </div>
                        <p className="text-sm text-gray-500 mb-4">아래 링크를 고객에게 전달하세요. 결제 완료 후 자동 만료됩니다.</p>
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 mb-4 break-all text-xs font-mono text-gray-600 select-all">
                            {takeoutLink}
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCopyTakeoutLink}
                                className="flex-1 bg-orange-500 text-white py-3 rounded-xl font-bold hover:bg-orange-600 transition active:scale-95"
                            >
                                링크 복사
                            </button>
                            <a
                                href={takeoutLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 bg-slate-800 text-white py-3 rounded-xl font-bold hover:bg-black transition text-center flex items-center justify-center"
                            >
                                새 탭으로 열기
                            </a>
                        </div>
                        <button
                            onClick={() => setTakeoutLink(null)}
                            className="w-full mt-3 text-gray-400 text-sm font-bold py-2 hover:text-gray-600 transition"
                        >
                            닫기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

const COOKING_STATUS_LABEL = { PENDING: "접수 대기", COOKING: "조리 중", COMPLETED: "완료" };
const COOKING_STATUS_COLOR = { PENDING: "bg-yellow-100 text-yellow-700", COOKING: "bg-blue-100 text-blue-700", COMPLETED: "bg-green-100 text-green-700" };

function ClearTableModal({ tableName, pendingOrders, deferredOrders = [], onConfirm, onCancel }) {
    const hasPending = pendingOrders.length > 0;
    const hasDeferred = deferredOrders.length > 0;
    const deferredTotal = deferredOrders.reduce((sum, o) => sum + (o.total_price || 0), 0);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className={`px-6 py-5 ${hasDeferred ? "bg-amber-50 border-b border-amber-100" : hasPending ? "bg-red-50 border-b border-red-100" : "bg-gray-50 border-b border-gray-100"}`}>
                    <div className="flex items-center gap-3">
                        <span className="text-3xl">{hasDeferred ? "💴" : hasPending ? "⚠️" : "🧹"}</span>
                        <div>
                            <h3 className="font-black text-lg text-gray-900">{tableName} 퇴석 처리</h3>
                            {hasDeferred
                                ? <p className="text-amber-700 font-bold text-sm mt-0.5">미수납 {deferredTotal.toLocaleString()}원 — 수납 후 퇴석해주세요</p>
                                : hasPending
                                    ? <p className="text-red-600 font-bold text-sm mt-0.5">처리되지 않은 주문이 {pendingOrders.length}건 있습니다</p>
                                    : <p className="text-gray-500 text-sm mt-0.5">테이블을 비우고 새 QR을 발급합니다</p>
                            }
                        </div>
                    </div>
                </div>

                {/* 미수납(DEFERRED) 주문 경고 섹션 */}
                {hasDeferred && (
                    <div className="px-6 py-4 border-b border-amber-100 bg-amber-50/50 space-y-2">
                        <p className="text-xs font-black text-amber-800 mb-2">💴 미수납 주문 (수납 완료 후 퇴석 가능)</p>
                        {deferredOrders.map(order => (
                            <div key={order.id} className="flex items-center justify-between bg-white border border-amber-200 rounded-xl px-3 py-2">
                                <div>
                                    <span className="font-black text-gray-800 text-sm">#{order.daily_number}</span>
                                    <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                        {order.items?.filter(i => !i.is_cancelled).map(i => `${i.menu_name} ×${i.quantity}`).join(", ")}
                                    </p>
                                </div>
                                <span className="text-sm font-black text-amber-700 shrink-0">{order.total_price?.toLocaleString()}원</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 조리 미완료 주문 목록 */}
                {hasPending && (
                    <div className="px-6 py-4 max-h-48 overflow-y-auto space-y-2 border-b border-gray-100">
                        <p className="text-xs font-black text-red-700 mb-2">⚠️ 조리 미완료 주문 (강제 퇴석 시 취소됨)</p>
                        {pendingOrders.map(order => (
                            <div key={order.id} className="flex items-start justify-between gap-3 bg-gray-50 rounded-xl p-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-black text-gray-800 text-sm">#{order.daily_number}</span>
                                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${COOKING_STATUS_COLOR[order.cooking_status] || "bg-gray-100 text-gray-600"}`}>
                                            {COOKING_STATUS_LABEL[order.cooking_status] || order.cooking_status}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">
                                        {order.items?.filter(i => !i.is_cancelled).map(i => `${i.menu_name} ×${i.quantity}`).join(", ")}
                                    </p>
                                </div>
                                <span className="text-sm font-bold text-gray-700 shrink-0">{order.total_price?.toLocaleString()}원</span>
                            </div>
                        ))}
                    </div>
                )}

                <div className="px-6 py-4 flex flex-col gap-2">
                    <button
                        onClick={onCancel}
                        className="w-full py-3 rounded-xl font-bold text-base bg-indigo-600 text-white hover:bg-indigo-700 transition active:scale-95"
                    >
                        {hasDeferred ? "수납 처리하러 가기" : "돌아가기"}
                    </button>
                    {/* 미수납 주문이 있으면 퇴석 버튼 비활성화 */}
                    {!hasDeferred && (
                        <button
                            onClick={onConfirm}
                            className={`w-full py-3 rounded-xl font-bold text-sm transition active:scale-95 ${hasPending ? "bg-red-100 text-red-600 hover:bg-red-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                        >
                            {hasPending ? "주방에 알리고 강제 퇴석" : "퇴석 처리"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TableDashboard;