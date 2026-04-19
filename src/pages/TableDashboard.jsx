import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom"; 
import axios from "axios";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../config"; 

export function TableDashboard() {
    const { storeId } = useParams(); 
    const navigate = useNavigate(); // ✨ 뒤로가기 버튼용
    const [tables, setTables] = useState([]); // ✨ 가짜 데이터 삭제! 처음엔 빈 바구니
    const token = localStorage.getItem("token");

    // 1. 실제 DB에서 우리 매장의 테이블 목록을 가져옵니다.
    const fetchTables = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${storeId}/tables`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTables(res.data);
        } catch (err) {
            console.error("테이블 현황을 불러오는데 실패했습니다.", err);
        }
    };

    // 2. 10초마다 자동으로 새로고침하여 실시간 현황을 보여줍니다.
    useEffect(() => {
        if (storeId) {
            fetchTables();
            const interval = setInterval(fetchTables, 10000); 
            return () => clearInterval(interval);
        }
    }, [storeId]);

    // 3. 퇴석 및 토큰 갱신 기능
    const handleClearTable = async (tableId, tableName) => {
        if (!window.confirm(`[${tableName}] 테이블을 비우시겠습니까?\n이전 손님의 QR 접속이 완전히 차단(토큰 갱신)됩니다.`)) return;

        try {
            await axios.post(`${API_BASE_URL}/tables/${tableId}/clear`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`${tableName} 초기화 및 QR 갱신 완료!`);
            fetchTables(); // 초기화 성공 즉시 화면 갱신
        } catch (error) {
            toast.error("테이블 초기화에 실패했습니다.");
        }
    };

    // 4. 착석 시간(occupied_at)을 기준으로 몇 분 지났는지 계산
    const getElapsedMin = (occupiedAt) => {
        if (!occupiedAt) return 0;
        const diffMs = new Date() - new Date(occupiedAt);
        return Math.max(0, Math.floor(diffMs / 60000));
    };

    const totalTables = tables.length;
    const occupiedCount = tables.filter(t => t.current_status === "OCCUPIED").length;

    // ✨ DB의 실제 상태값(EMPTY, OCCUPIED, CLEANING_REQUESTED)에 따라 색상 부여
    const getCardStyle = (status) => {
        switch (status) {
            case "OCCUPIED": return "bg-indigo-50 border-indigo-500 shadow-indigo-100";
            case "CLEANING_REQUESTED": return "bg-yellow-50 border-yellow-400 shadow-yellow-100 opacity-80";
            case "EMPTY": 
            default: return "bg-white border-gray-200 hover:border-indigo-300 shadow-sm";
        }
    };

    return (
        <div className="flex flex-col h-screen w-full bg-slate-50 min-w-[1024px] overflow-hidden font-sans">
            
            {/* 상단 헤더 */}
            <div className="bg-slate-900 text-white p-4 lg:p-6 shrink-0 flex justify-between items-center shadow-md z-10">
                <div className="flex items-center gap-6">
                    {/* ✨ 관리자 메인 화면으로 돌아가는 버튼 추가 */}
                    <button onClick={() => navigate(-1)} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg text-sm font-bold transition">
                        ← 뒤로가기
                    </button>
                    <h1 className="text-2xl font-black tracking-tight">📊 실시간 매장 현황</h1>
                    <div className="flex gap-3 text-sm font-bold">
                        <span className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            전체 <span className="text-indigo-400 ml-1">{totalTables}</span>
                        </span>
                        <span className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            사용중 <span className="text-green-400 ml-1">{occupiedCount}</span>
                        </span>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-sm font-bold">{new Date().toLocaleDateString('ko-KR')} 영업일</p>
                </div>
            </div>

            {/* 메인 그리드 영역 */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 lg:gap-6 pb-20">
                    
                    {tables.map(table => (
                        <div 
                            key={table.id} 
                            className={`flex flex-col h-40 lg:h-48 rounded-2xl border-2 transition-all p-4 relative ${getCardStyle(table.current_status)}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h3 className={`text-xl lg:text-2xl font-black ${table.current_status === 'EMPTY' ? 'text-gray-500' : 'text-gray-900'}`}>
                                    {table.name}
                                </h3>
                                {/* 식사 중일 때만 시간 표시 */}
                                {table.current_status === "OCCUPIED" && (
                                    <span className="text-sm font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-md shadow-sm">
                                        {getElapsedMin(table.occupied_at)}분
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 flex flex-col justify-center">
                                {table.current_status === "OCCUPIED" ? (
                                    <p className="text-lg font-bold text-indigo-700 text-center mt-2">🍽️ 식사 중</p>
                                ) : table.current_status === "CLEANING_REQUESTED" ? (
                                    <p className="text-lg font-bold text-yellow-600 text-center mt-2">🧹 치우는 중</p>
                                ) : (
                                    <p className="text-lg font-bold text-gray-300 text-center mt-2">빈 자리</p>
                                )}
                            </div>

                            <div className="mt-auto pt-3 border-t border-black/5">
                                {table.current_status === "OCCUPIED" ? (
                                    <button 
                                        onClick={() => handleClearTable(table.id, table.name)}
                                        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-sm transition-transform"
                                    >
                                        퇴석/비우기
                                    </button>
                                ) : (
                                    <button 
                                        disabled 
                                        className={`w-full py-2 rounded-lg text-sm font-bold transition-colors ${
                                            table.current_status === "CLEANING_REQUESTED" 
                                            ? "bg-yellow-400 text-yellow-900" 
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                    >
                                        {table.current_status === "CLEANING_REQUESTED" ? "정리 진행중" : "주문 대기중"}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    
                    {/* 테이블이 아예 없을 때 안내문 */}
                    {tables.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-400 font-bold text-lg">
                            등록된 테이블이 없습니다. 관리자 메뉴에서 테이블을 추가해주세요.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default TableDashboard;