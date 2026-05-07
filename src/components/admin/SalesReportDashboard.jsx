import { useState, useEffect } from "react";
import axios from "axios";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from "recharts";
import { API_BASE_URL } from "../../config";

const PRESETS = [
    { label: "이번 주", getDates: () => { const today = new Date(); const day = today.getDay() || 7; const mon = new Date(today); mon.setDate(today.getDate() - day + 1); return [mon, today]; } },
    { label: "이번 달", getDates: () => { const today = new Date(); return [new Date(today.getFullYear(), today.getMonth(), 1), today]; } },
    { label: "지난 달", getDates: () => { const today = new Date(); const first = new Date(today.getFullYear(), today.getMonth() - 1, 1); const last = new Date(today.getFullYear(), today.getMonth(), 0); return [first, last]; } },
    { label: "최근 3개월", getDates: () => { const today = new Date(); const start = new Date(today); start.setMonth(today.getMonth() - 3); return [start, today]; } },
];

const toDateStr = (d) => d.toISOString().slice(0, 10);
const fmtMoney = (v) => (v / 10000).toFixed(0) + "만원";
const fmtNum = (v) => v?.toLocaleString() ?? "0";

const PAY_COLORS = { card: "#6366f1", cash: "#10b981", deferred: "#f59e0b" };
const BAR_COLOR = "#6366f1";

// ─── 점주용: 기간별 리포트 ────────────────────────────────────────────────
function StoreReport({ store, token }) {
    const [preset, setPreset]     = useState(0);
    const [startDate, setStart]   = useState(() => toDateStr(PRESETS[0].getDates()[0]));
    const [endDate, setEnd]       = useState(() => toDateStr(new Date()));
    const [data, setData]         = useState(null);
    const [loading, setLoading]   = useState(false);

    const headers = { Authorization: `Bearer ${token}` };

    const fetch = async (s, e) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/reports/period`, { params: { start_date: s, end_date: e }, headers });
            setData(res.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(startDate, endDate); }, []);

    const applyPreset = (i) => {
        setPreset(i);
        const [s, e] = PRESETS[i].getDates();
        const ss = toDateStr(s), ee = toDateStr(e);
        setStart(ss); setEnd(ee);
        fetch(ss, ee);
    };

    const applyCustom = () => { setPreset(-1); fetch(startDate, endDate); };

    const payBreakdown = data ? [
        { name: "카드", value: data.totals.card,     fill: PAY_COLORS.card },
        { name: "현금", value: data.totals.cash,     fill: PAY_COLORS.cash },
        { name: "후불", value: data.totals.deferred, fill: PAY_COLORS.deferred },
    ].filter(x => x.value > 0) : [];

    const handleCsvExport = () => {
        if (!data?.period_stats?.length) return;
        const header = "영업일,매출,주문건수,카드,현금,후불,취소액";
        const rows = data.period_stats.map(r =>
            `${r.date},${r.revenue},${r.order_count},${r.card},${r.cash},${r.deferred},${r.cancelled_amount}`
        );
        const blob = new Blob([header + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a"); a.href = url;
        a.download = `매출리포트_${startDate}_${endDate}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-6">
            {/* 기간 선택 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <div className="flex flex-wrap gap-2 mb-4">
                    {PRESETS.map((p, i) => (
                        <button key={i} onClick={() => applyPreset(i)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${preset === i ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
                        className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <span className="text-gray-400 font-bold">~</span>
                    <input type="date" value={endDate} onChange={e => setEnd(e.target.value)}
                        className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300" />
                    <button onClick={applyCustom}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition">
                        조회
                    </button>
                    <button onClick={handleCsvExport}
                        className="ml-auto px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition">
                        CSV 내보내기
                    </button>
                </div>
            </div>

            {loading && <p className="text-center text-gray-400 py-10 animate-pulse">불러오는 중...</p>}

            {data && !loading && (
                <>
                    {/* KPI 카드 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "총 매출", value: `${fmtNum(data.totals.revenue)}원`, sub: fmtMoney(data.totals.revenue), color: "indigo" },
                            { label: "주문 건수", value: `${fmtNum(data.totals.order_count)}건`, sub: `마감 ${data.totals.closing_count}일`, color: "green" },
                            { label: "카드 매출", value: `${fmtNum(data.totals.card)}원`, sub: data.totals.revenue ? `${Math.round(data.totals.card / data.totals.revenue * 100)}%` : "0%", color: "blue" },
                            { label: "취소 금액", value: `${fmtNum(data.totals.cancelled_amount)}원`, sub: "환불 포함", color: "red" },
                        ].map(k => (
                            <div key={k.label} className={`bg-white rounded-2xl p-5 shadow-sm border border-${k.color}-100`}>
                                <p className={`text-xs font-bold text-${k.color}-500 mb-1`}>{k.label}</p>
                                <p className="text-xl font-extrabold text-gray-800">{k.value}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{k.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* 일별 매출 차트 */}
                    {data.period_stats.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-4">일별 매출</h3>
                            <ResponsiveContainer width="100%" height={200}>
                                <BarChart data={data.period_stats} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/10000).toFixed(0)}만`} />
                                    <Tooltip formatter={v => [`${fmtNum(v)}원`, "매출"]} labelFormatter={l => l} />
                                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                        {data.period_stats.map((_, i) => <Cell key={i} fill={BAR_COLOR} fillOpacity={0.85} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* 결제수단 비율 */}
                        {payBreakdown.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-700 mb-4">결제수단별 매출</h3>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={payBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {payBreakdown.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                                        </Pie>
                                        <Legend />
                                        <Tooltip formatter={v => `${fmtNum(v)}원`} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        )}

                        {/* 인기 메뉴 */}
                        {data.top_menus.length > 0 && (
                            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                                <h3 className="font-bold text-gray-700 mb-4">인기 메뉴 TOP 10</h3>
                                <ul className="space-y-2">
                                    {data.top_menus.map((m, i) => {
                                        const maxRev = data.top_menus[0].revenue || 1;
                                        return (
                                            <li key={m.name} className="flex items-center gap-3">
                                                <span className="w-5 text-xs font-bold text-gray-400 shrink-0">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-semibold text-gray-700 truncate">{m.name}</span>
                                                        <span className="text-gray-400 shrink-0 ml-2">{m.count}개</span>
                                                    </div>
                                                    <div className="h-1.5 bg-gray-100 rounded-full mt-1">
                                                        <div className="h-1.5 bg-indigo-400 rounded-full" style={{ width: `${Math.round(m.revenue / maxRev * 100)}%` }} />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-gray-500 shrink-0">{fmtMoney(m.revenue)}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {!data.period_stats.length && (
                        <div className="bg-white rounded-2xl p-10 text-center text-gray-400 shadow-sm">
                            선택 기간에 마감 데이터가 없습니다.<br />
                            <span className="text-sm">일마감 탭에서 마감을 확정해야 리포트에 반영됩니다.</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

// ─── 브랜드 관리자용: 매장별 비교 ──────────────────────────────────────────
function BrandReport({ user, token }) {
    const [preset, setPreset]   = useState(0);
    const [startDate, setStart] = useState(() => toDateStr(PRESETS[0].getDates()[0]));
    const [endDate, setEnd]     = useState(() => toDateStr(new Date()));
    const [data, setData]       = useState(null);
    const [loading, setLoading] = useState(false);
    const headers = { Authorization: `Bearer ${token}` };

    const fetch = async (s, e) => {
        if (!user?.brand_id) return;
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/brands/${user.brand_id}/reports/stores`, { params: { start_date: s, end_date: e }, headers });
            setData(res.data);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    useEffect(() => { fetch(startDate, endDate); }, [user?.brand_id]);

    const applyPreset = (i) => {
        setPreset(i);
        const [s, e] = PRESETS[i].getDates();
        const ss = toDateStr(s), ee = toDateStr(e);
        setStart(ss); setEnd(ee);
        fetch(ss, ee);
    };

    const maxRevenue = data?.store_stats?.[0]?.revenue || 1;

    return (
        <div className="space-y-6">
            {/* 기간 선택 */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-purple-600 mb-3">브랜드 전체 매장 비교 리포트</p>
                <div className="flex flex-wrap gap-2 mb-4">
                    {PRESETS.map((p, i) => (
                        <button key={i} onClick={() => applyPreset(i)}
                            className={`px-4 py-1.5 rounded-full text-sm font-bold transition ${preset === i ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                            {p.label}
                        </button>
                    ))}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <input type="date" value={startDate} onChange={e => setStart(e.target.value)}
                        className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <span className="text-gray-400 font-bold">~</span>
                    <input type="date" value={endDate} onChange={e => setEnd(e.target.value)}
                        className="border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <button onClick={() => { setPreset(-1); fetch(startDate, endDate); }}
                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-sm font-bold hover:bg-purple-700 transition">
                        조회
                    </button>
                </div>
            </div>

            {loading && <p className="text-center text-gray-400 py-10 animate-pulse">불러오는 중...</p>}

            {data && !loading && (
                <>
                    {/* 브랜드 합계 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                            <p className="text-xs font-bold text-purple-500 mb-1">브랜드 총 매출</p>
                            <p className="text-2xl font-extrabold text-gray-800">{fmtNum(data.totals.revenue)}원</p>
                            <p className="text-xs text-gray-400">{data.brand_name}</p>
                        </div>
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-purple-100">
                            <p className="text-xs font-bold text-purple-500 mb-1">브랜드 총 주문</p>
                            <p className="text-2xl font-extrabold text-gray-800">{fmtNum(data.totals.order_count)}건</p>
                            <p className="text-xs text-gray-400">{data.store_stats.length}개 매장</p>
                        </div>
                    </div>

                    {/* 매장별 바 차트 */}
                    {data.store_stats.length > 0 && (
                        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                            <h3 className="font-bold text-gray-700 mb-4">매장별 매출 비교</h3>
                            <ResponsiveContainer width="100%" height={Math.max(200, data.store_stats.length * 48)}>
                                <BarChart data={data.store_stats} layout="vertical" margin={{ left: 0, right: 40 }}>
                                    <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/10000).toFixed(0)}만`} />
                                    <YAxis type="category" dataKey="store_name" tick={{ fontSize: 12 }} width={80} />
                                    <Tooltip formatter={v => [`${fmtNum(v)}원`, "매출"]} />
                                    <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                        {data.store_stats.map((_, i) => <Cell key={i} fill="#7c3aed" fillOpacity={1 - i * 0.08} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* 매장별 상세 테이블 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500">순위</th>
                                    <th className="p-3 text-left text-xs font-bold text-gray-500">매장명</th>
                                    <th className="p-3 text-right text-xs font-bold text-gray-500">매출</th>
                                    <th className="p-3 text-right text-xs font-bold text-gray-500">주문</th>
                                    <th className="p-3 text-right text-xs font-bold text-gray-500">카드</th>
                                    <th className="p-3 text-right text-xs font-bold text-gray-500">현금</th>
                                    <th className="p-3 text-right text-xs font-bold text-gray-500">마감일수</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.store_stats.map((s, i) => (
                                    <tr key={s.store_id} className="hover:bg-gray-50">
                                        <td className="p-3 font-bold text-gray-400">{i + 1}</td>
                                        <td className="p-3">
                                            <div className="font-semibold text-gray-800">{s.store_name}</div>
                                            <div className="h-1 bg-gray-100 rounded mt-1">
                                                <div className="h-1 bg-purple-400 rounded" style={{ width: `${Math.round(s.revenue / maxRevenue * 100)}%` }} />
                                            </div>
                                        </td>
                                        <td className="p-3 text-right font-bold text-gray-800">{fmtNum(s.revenue)}원</td>
                                        <td className="p-3 text-right text-gray-600">{fmtNum(s.order_count)}건</td>
                                        <td className="p-3 text-right text-indigo-600">{fmtNum(s.card)}원</td>
                                        <td className="p-3 text-right text-green-600">{fmtNum(s.cash)}원</td>
                                        <td className="p-3 text-right text-gray-500">{s.closing_count}일</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}

// ─── 메인 컴포넌트: 권한에 따라 A안 / B안 선택 ─────────────────────────────
export default function SalesReportDashboard({ store, token, user }) {
    const isBrandManager = ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN"].includes(user?.role);
    const [view, setView] = useState(isBrandManager ? "brand" : "store");

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-gray-800">📊 매출 리포트</h2>
                {isBrandManager && store && (
                    <div className="flex bg-gray-100 rounded-xl p-1">
                        <button onClick={() => setView("store")}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${view === "store" ? "bg-white text-indigo-700 shadow" : "text-gray-500"}`}>
                            이 매장
                        </button>
                        <button onClick={() => setView("brand")}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition ${view === "brand" ? "bg-white text-purple-700 shadow" : "text-gray-500"}`}>
                            브랜드 전체
                        </button>
                    </div>
                )}
            </div>

            {view === "store" && store && <StoreReport store={store} token={token} />}
            {view === "brand" && isBrandManager && <BrandReport user={user} token={token} />}
        </div>
    );
}
