import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

// ✨ [신규 추가] 영문 코드를 친화적인 한글 이름으로 바꿔주는 마법의 사전
const ACTION_MAP = {
    "CREATE_BRAND": "👑 브랜드 생성",
    "CREATE_STORE": "🏪 매장 오픈",
    "UPDATE_STORE": "🏪 매장 수정",
    "CREATE_MENU": "🍔 메뉴 생성",
    "UPDATE_MENU": "📝 메뉴 수정",
    "UPDATE_MENU_PRICE": "💰 가격 변경",
    "DELETE_MENU": "🗑️ 메뉴 삭제",
    "CREATE_USER": "👤 계정 생성",
    "DELETE_USER": "🚫 계정 삭제",
    "SEND_NOTICE": "📢 공지 발송",
    "DISTRIBUTE_MENU": "🚀 일괄 배포"
};

// 사전에 등록된 한글이 있으면 한글을, 없으면 원래 영어를 그대로 보여주는 도우미 함수
const getActionLabel = (action) => ACTION_MAP[action] || action;

export default function HQAuditLog({ token }) {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterAction, setFilterAction] = useState("ALL");

    const fetchLogs = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/admin/audit-logs`, { headers: { Authorization: `Bearer ${token}` } });
            setLogs(res.data);
        } catch (e) { toast.error("감사 로그를 불러오지 못했습니다."); }
    };

    useEffect(() => { fetchLogs(); }, []);

    // ✨ [강화됨] 검색 및 필터링 로직 (한글 작업 분류명으로도 검색 가능!)
    const filteredLogs = useMemo(() => {
        return logs.filter(log => {
            // 1. 필터 드롭다운 조건 검사
            const matchAction = filterAction === "ALL" || log.action === filterAction;
            
            // 2. 검색어 조건 검사 (이름, 이메일, 상세 내용 + '한글 작업명' 까지 포함해서 검색)
            const lowerSearch = searchTerm.toLowerCase();
            const actionLabel = getActionLabel(log.action).toLowerCase(); // 한글명 소문자로 준비
            
            const matchSearch = searchTerm === "" || 
                (log.user_name && log.user_name.toLowerCase().includes(lowerSearch)) ||
                (log.user_email && log.user_email.toLowerCase().includes(lowerSearch)) ||
                (log.details && log.details.toLowerCase().includes(lowerSearch)) ||
                actionLabel.includes(lowerSearch); // ✨ 작업명 검색 추가!

            return matchAction && matchSearch;
        });
    }, [logs, searchTerm, filterAction]);

    // DB에 있는 액션 종류들만 중복 없이 뽑기
    const uniqueActions = useMemo(() => {
        const actions = new Set(logs.map(log => log.action));
        return Array.from(actions);
    }, [logs]);

    // 행동(Action)에 따라 예쁜 색상 뱃지 달아주기 (한글 사전 적용)
    const formatAction = (action) => {
        const label = getActionLabel(action); // 한글 이름 가져오기

        if (action.includes("CREATE_MENU")) return <span className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        if (action.includes("UPDATE_MENU")) return <span className="bg-yellow-100 text-yellow-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        if (action.includes("DELETE_MENU")) return <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        
        if (action.includes("CREATE_USER")) return <span className="bg-green-100 text-green-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        if (action.includes("DELETE_USER")) return <span className="bg-red-100 text-red-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        
        if (action === "SEND_NOTICE") return <span className="bg-purple-100 text-purple-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        if (action === "DISTRIBUTE_MENU") return <span className="bg-indigo-100 text-indigo-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        
        if (action.includes("STORE")) return <span className="bg-teal-100 text-teal-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
        if (action.includes("BRAND")) return <span className="bg-orange-100 text-orange-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;

        return <span className="bg-gray-100 text-gray-800 px-3 py-1.5 rounded-lg text-[11px] font-bold shadow-sm whitespace-nowrap">{label}</span>;
    };

    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                    <span className="text-3xl">🕵️</span> 시스템 감사 로그 <span className="text-sm font-normal text-gray-500 bg-gray-100 px-2 py-1 rounded-lg shadow-inner">총 {filteredLogs.length}건</span>
                </h2>
                <button onClick={fetchLogs} className="bg-white border border-gray-300 text-gray-600 px-4 py-2.5 rounded-lg font-bold hover:bg-gray-50 transition text-sm flex items-center gap-2 shadow-sm whitespace-nowrap">
                    🔄 데이터 새로고침
                </button>
            </div>

            {/* 강력한 검색 및 필터 바 */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                    <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                    <input 
                        type="text" 
                        placeholder="작업명, 담당자 이름, 이메일, 상세 내용으로 싹 다 검색..." 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold focus:border-indigo-400 focus:bg-white outline-none transition"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-bold text-gray-500">작업 분류:</span>
                    <select 
                        className="bg-gray-50 border border-gray-200 text-gray-700 py-2.5 px-3 rounded-lg text-sm font-bold focus:border-indigo-400 focus:bg-white outline-none cursor-pointer"
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                    >
                        <option value="ALL">전체 보기 (All)</option>
                        {/* ✨ 드롭다운 메뉴에도 예쁜 한글 적용! */}
                        {uniqueActions.map(action => (
                            <option key={action} value={action}>{getActionLabel(action)}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead>
                            <tr className="bg-slate-900 text-white text-sm">
                                <th className="p-4 font-bold w-44 text-center">발생 일시</th>
                                <th className="p-4 font-bold w-48">작업자 (ID/이름)</th>
                                <th className="p-4 font-bold w-36 text-center">작업 종류</th>
                                <th className="p-4 font-bold">상세 내용 (Details)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLogs.map((log) => (
                                <tr key={log.id} className="border-b border-gray-100 hover:bg-indigo-50/30 transition group">
                                    <td className="p-4 text-center text-xs text-gray-500 font-medium whitespace-nowrap">
                                        {new Date(log.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-sm text-gray-800">{log.user_name}</div>
                                        <div className="text-[11px] text-gray-400">{log.user_email}</div>
                                    </td>
                                    {/* ✨ 예쁜 한글 뱃지로 렌더링 */}
                                    <td className="p-4 text-center">{formatAction(log.action)}</td>
                                    <td className="p-4 text-sm font-bold text-gray-700">
                                        <div className="bg-gray-50 group-hover:bg-white p-2.5 rounded-lg border border-gray-100 transition break-keep">
                                            {log.details}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLogs.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="p-16 text-center">
                                        <div className="text-4xl mb-3">📭</div>
                                        <p className="text-gray-500 font-bold text-lg">조건에 맞는 감사 로그가 없습니다.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}