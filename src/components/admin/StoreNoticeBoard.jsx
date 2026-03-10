import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

export default function StoreNoticeBoard({ token }) {
    const [notices, setNotices] = useState([]);
    const [selectedNotice, setSelectedNotice] = useState(null);

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/notices/my`, { headers: { Authorization: `Bearer ${token}` } });
            setNotices(res.data);
        } catch (e) { toast.error("공지사항 목록을 불러오지 못했습니다."); }
    };

    // ✨ 공지사항 "확인(읽음)" 처리 함수
    const handleReadNotice = async (noticeId) => {
        try {
            await axios.post(`${API_BASE_URL}/notices/${noticeId}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("공지를 확인했습니다.");
            setSelectedNotice(null);
            fetchNotices(); // 목록 새로고침해서 뱃지(안읽음->읽음) 업데이트
        } catch(e) { toast.error("처리 중 오류가 발생했습니다."); }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">📢 본사 공지사항 수신함</h2>
                <button onClick={fetchNotices} className="bg-white border border-gray-300 text-gray-600 px-4 py-2 rounded-lg font-bold hover:bg-gray-50 transition text-sm flex items-center gap-2 shadow-sm">
                    🔄 새로고침
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead>
                        <tr className="bg-indigo-50/50 text-indigo-900 text-sm border-b border-indigo-100">
                            <th className="p-4 font-bold w-24 text-center">상태</th>
                            <th className="p-4 font-bold w-1/2">제목</th>
                            <th className="p-4 font-bold text-center">수신 일시</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notices.map((n) => (
                            <tr key={n.id} onClick={() => setSelectedNotice(n)} className={`border-b border-gray-100 cursor-pointer transition group ${n.is_read ? 'bg-white hover:bg-gray-50' : 'bg-red-50/30 hover:bg-red-50'}`}>
                                <td className="p-4 text-center">
                                    {n.is_read 
                                        ? <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded text-[11px] font-bold">읽음</span>
                                        : <span className="bg-red-500 text-white px-2 py-1 rounded text-[11px] font-bold shadow-sm animate-pulse">🔴 안읽음</span>
                                    }
                                </td>
                                <td className={`p-4 font-bold transition truncate ${n.is_read ? 'text-gray-600' : 'text-gray-900 group-hover:text-red-600'}`}>
                                    {n.title}
                                </td>
                                <td className="p-4 text-center text-xs text-gray-500 font-medium">
                                    {new Date(n.created_at).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </td>
                            </tr>
                        ))}
                        {notices.length === 0 && (
                            <tr>
                                <td colSpan="3" className="p-10 text-center text-gray-400 font-bold bg-gray-50">수신된 공지사항이 없습니다.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* ✨ 공지사항 상세 읽기 모달 */}
            {selectedNotice && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn" onClick={() => setSelectedNotice(null)}>
                    <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className={`${selectedNotice.is_read ? 'bg-slate-800' : 'bg-red-600'} p-5 text-white flex justify-between items-center`}>
                            <h3 className="font-bold flex items-center gap-2">
                                {selectedNotice.is_read ? '📄 공지사항 확인' : '🚨 새로운 공지사항'}
                            </h3>
                            <button onClick={() => setSelectedNotice(null)} className="text-white/70 hover:text-white text-xl transition">×</button>
                        </div>
                        <div className="p-8 space-y-4">
                            <h4 className="font-extrabold text-2xl text-gray-900 mb-2">{selectedNotice.title}</h4>
                            <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-5 rounded-xl border border-gray-100 text-[15px] leading-relaxed h-48 overflow-y-auto">
                                {selectedNotice.content}
                            </p>
                        </div>
                        <div className="p-4 bg-gray-50 border-t flex gap-2">
                            {!selectedNotice.is_read ? (
                                <button onClick={() => handleReadNotice(selectedNotice.id)} className="w-full bg-red-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-red-700 transition shadow-md active:scale-95">
                                    ✅ 확인했습니다 (읽음 처리)
                                </button>
                            ) : (
                                <button onClick={() => setSelectedNotice(null)} className="w-full bg-gray-300 text-gray-800 px-6 py-3 rounded-xl font-bold hover:bg-gray-400 transition">
                                    닫기
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}