import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

const METHOD_LABEL = {
  card: "카드", CARD: "카드",
  cash: "현금", CASH: "현금",
  후불: "후불", 기타: "기타",
};

function fmt(n) {
  return (n ?? 0).toLocaleString() + "원";
}

function businessDateOf(closingHour) {
  const now = new Date();
  // 현재 시각이 closingHour 미만이면 전날이 영업일
  if (now.getHours() < (closingHour || 0)) {
    now.setDate(now.getDate() - 1);
  }
  return now.toISOString().slice(0, 10);
}

// ─────────────────────────────────────────────
// 서브 컴포넌트: 마감 이력 행 → 상세 모달
// ─────────────────────────────────────────────
function ClosingDetailModal({ closing, onClose }) {
  if (!closing) return null;
  let snapshot = null;
  try { snapshot = JSON.parse(closing.snapshot_json || "{}"); } catch {}
  const methods = snapshot?.method_breakdown ?? {};
  const topMenus = snapshot?.top_menus ?? [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-black text-gray-800">{closing.business_date} 마감 상세</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              확정: {closing.closed_by_name ?? "—"} &nbsp;|&nbsp;
              {closing.closed_at ? new Date(closing.closed_at).toLocaleString("ko-KR") : "—"}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">×</button>
        </div>

        <div className="p-5 space-y-5">
          {/* 핵심 지표 */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "총 매출", value: fmt(closing.total_revenue), color: "text-indigo-700" },
              { label: "주문건수", value: `${closing.order_count}건`, color: "text-gray-800" },
              { label: "취소액", value: fmt(closing.cancelled_amount), color: "text-rose-600" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-400 font-bold mb-1">{label}</p>
                <p className={`text-lg font-black ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* 결제수단 */}
          <div>
            <p className="text-xs font-black text-gray-500 mb-2">결제수단별</p>
            <div className="space-y-1.5">
              {[
                { key: "card",  label: "카드", amount: closing.card_revenue, icon: "💳" },
                { key: "cash",  label: "현금", amount: closing.cash_revenue, icon: "💵" },
                { key: "defer", label: "후불 미수금", amount: closing.deferred_revenue, icon: "⏳", warn: true },
              ].map(({ key, label, amount, icon, warn }) => (
                <div key={key} className={`flex items-center justify-between px-3 py-2 rounded-lg ${warn && amount > 0 ? "bg-amber-50" : "bg-gray-50"}`}>
                  <span className={`text-sm font-bold ${warn && amount > 0 ? "text-amber-700" : "text-gray-600"}`}>
                    {icon} {label}
                  </span>
                  <span className={`font-black text-sm ${warn && amount > 0 ? "text-amber-700" : "text-gray-800"}`}>
                    {fmt(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 메뉴 TOP */}
          {topMenus.length > 0 && (
            <div>
              <p className="text-xs font-black text-gray-500 mb-2">메뉴별 매출 TOP {topMenus.length}</p>
              <div className="space-y-1">
                {topMenus.map((m, i) => (
                  <div key={m.name} className="flex items-center justify-between text-sm px-1">
                    <span className="text-gray-500 w-5 text-xs font-bold">{i + 1}</span>
                    <span className="flex-1 text-gray-700 font-bold truncate">{m.name}</span>
                    <span className="text-gray-500 text-xs mr-3">{m.count}개</span>
                    <span className="font-black text-gray-800">{fmt(m.revenue)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 메모 */}
          {closing.memo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
              <p className="text-xs font-black text-yellow-700 mb-1">메모</p>
              <p className="text-sm text-yellow-800">{closing.memo}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────
export default function DailyClosingDashboard({ store, token }) {
  const closingHour = store?.closing_hour ?? 0;
  const todayBizDate = businessDateOf(closingHour);
  const [searchParams] = useSearchParams();

  const [bizDate, setBizDate]       = useState(todayBizDate);
  const [summary, setSummary]       = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [memo, setMemo]             = useState("");
  const [confirming, setConfirming] = useState(false);

  const [history, setHistory]       = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [detailModal, setDetailModal] = useState(null);  // 선택된 closing 객체

  const headers = { Authorization: `Bearer ${token}` };

  const fetchSummary = useCallback(async (date) => {
    setLoadingSummary(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/stores/${store.id}/daily-closing/today-summary?business_date=${date}`,
        { headers }
      );
      setSummary(res.data);
      if (res.data.memo) setMemo(res.data.memo);
    } catch {
      toast.error("마감 데이터를 불러오지 못했습니다.");
    } finally {
      setLoadingSummary(false);
    }
  }, [store?.id, token]);

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/stores/${store.id}/daily-closing`,
        { headers }
      );
      setHistory(res.data);
    } catch {
      toast.error("마감 이력을 불러오지 못했습니다.");
    } finally {
      setLoadingHistory(false);
    }
  }, [store?.id, token]);

  const openDetail = async (closing) => {
    // 이미 snapshot_json이 있으면 바로 표시, 없으면 상세 조회
    if (closing.snapshot_json) { setDetailModal(closing); return; }
    try {
      const res = await axios.get(
        `${API_BASE_URL}/stores/${store.id}/daily-closing/${closing.id}`,
        { headers }
      );
      setDetailModal(res.data);
    } catch { toast.error("상세 조회에 실패했습니다."); }
  };

  const [confirmStep, setConfirmStep] = useState(false);

  const confirmClose = async () => {
    if (summary?.is_closed) return;
    if (!confirmStep) { setConfirmStep(true); return; }
    setConfirming(true);
    setConfirmStep(false);
    try {
      await axios.post(
        `${API_BASE_URL}/stores/${store.id}/daily-closing`,
        { business_date: bizDate, memo },
        { headers }
      );
      toast.success("마감이 확정되었습니다.");
      fetchSummary(bizDate);
      fetchHistory();
    } catch (e) {
      toast.error(e?.response?.data?.detail ?? "마감 확정에 실패했습니다.");
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    if (store?.id) { fetchSummary(bizDate); fetchHistory(); }
  }, [store?.id]);

  useEffect(() => {
    if (store?.id) fetchSummary(bizDate);
  }, [bizDate]);

  // ?detail=id 파라미터로 특정 마감 상세 자동 오픈
  useEffect(() => {
    const detailId = searchParams.get("detail");
    if (!detailId || !store?.id) return;
    axios.get(`${API_BASE_URL}/stores/${store.id}/daily-closing/${detailId}`, { headers })
      .then(res => {
        const row = res.data;
        row.closed_by_name = row.closed_by_name;
        setDetailModal(row);
      })
      .catch(() => {});
  }, [store?.id, searchParams.get("detail")]);

  // ─── 렌더 ───────────────────────────────────
  const isClosed = summary?.is_closed;

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* 헤더 */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl font-black text-gray-800">일마감</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            영업 마감 시각 기준: {closingHour === 0 ? "자정(00:00)" : `${closingHour}시`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-gray-500">영업일</label>
          <input
            type="date"
            value={bizDate}
            onChange={e => setBizDate(e.target.value)}
            className="bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl font-bold text-gray-700 text-sm outline-none"
          />
          {bizDate !== todayBizDate && (
            <button
              onClick={() => setBizDate(todayBizDate)}
              className="text-xs font-bold px-3 py-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            >
              오늘로
            </button>
          )}
        </div>
      </div>

      {/* 로딩 */}
      {loadingSummary ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <span className="animate-spin text-4xl">⏳</span>
        </div>
      ) : summary ? (
        <>
          {/* 마감 상태 배너 */}
          {isClosed ? (
            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4">
              <span className="text-3xl">✅</span>
              <div>
                <p className="font-black text-emerald-700">마감 완료</p>
                <p className="text-xs text-emerald-600 mt-0.5">
                  {summary.closed_by_name ?? "—"} &nbsp;|&nbsp;
                  {summary.closed_at ? new Date(summary.closed_at).toLocaleString("ko-KR") : ""}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
              <span className="text-3xl">🔓</span>
              <div>
                <p className="font-black text-amber-700">미마감</p>
                <p className="text-xs text-amber-600 mt-0.5">아래에서 오늘 영업을 마감 확정해 주세요.</p>
              </div>
            </div>
          )}

          {/* 후불 미수금 경고 */}
          {summary.deferred_count > 0 && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-5 py-4">
              <span className="text-3xl">⚠️</span>
              <p className="font-bold text-rose-700 text-sm">
                후불 미결제 {summary.deferred_count}건 ({fmt(summary.deferred_revenue)}) — 마감 전 확인하세요.
              </p>
            </div>
          )}

          {/* 핵심 지표 카드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "총 매출", value: fmt(summary.total_revenue), sub: `주문 ${summary.order_count}건`, bg: "bg-gradient-to-br from-indigo-600 to-indigo-800", text: "text-white", subText: "text-indigo-200" },
              { label: "카드 매출", value: fmt(summary.card_revenue), icon: "💳", bg: "bg-white", text: "text-gray-800", subText: "text-gray-400" },
              { label: "현금 매출", value: fmt(summary.cash_revenue), icon: "💵", bg: "bg-white", text: "text-gray-800", subText: "text-gray-400" },
              { label: "취소 환불", value: fmt(summary.cancelled_amount), sub: `${summary.cancelled_count}건`, bg: summary.cancelled_count > 0 ? "bg-rose-50 border border-rose-200" : "bg-white", text: summary.cancelled_count > 0 ? "text-rose-600" : "text-gray-800", subText: summary.cancelled_count > 0 ? "text-rose-400" : "text-gray-400" },
            ].map(({ label, value, sub, icon, bg, text, subText }) => (
              <div key={label} className={`${bg} p-5 rounded-2xl shadow-sm relative overflow-hidden`}>
                <p className={`text-xs font-bold mb-1 ${subText}`}>{icon ? `${icon} ` : ""}{label}</p>
                <p className={`text-2xl font-black ${text}`}>{value}</p>
                {sub && <p className={`text-xs mt-1 ${subText}`}>{sub}</p>}
              </div>
            ))}
          </div>

          {/* 후불 미수금 카드 (별도) */}
          {summary.deferred_revenue > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-600 mb-1">⏳ 후불 미수금</p>
                <p className="text-2xl font-black text-amber-700">{fmt(summary.deferred_revenue)}</p>
                <p className="text-xs text-amber-500 mt-1">미결제 후불 {summary.deferred_count}건</p>
              </div>
              <span className="text-6xl opacity-10">💸</span>
            </div>
          )}

          {/* 마감 확정 패널 */}
          {!isClosed && (
            <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
              <h3 className="font-black text-gray-800">마감 확정</h3>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1.5">메모 (선택)</label>
                <textarea
                  rows={2}
                  value={memo}
                  onChange={e => setMemo(e.target.value)}
                  placeholder="특이사항, 현금 실사 결과 등..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </div>
              {confirmStep ? (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-black text-rose-700 text-center">
                    정말 {bizDate} 영업을 마감 확정하시겠습니까?<br/>
                    <span className="font-normal text-rose-500">확정 후에는 취소할 수 없습니다.</span>
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmStep(false)}
                      className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition"
                    >
                      취소
                    </button>
                    <button
                      onClick={confirmClose}
                      disabled={confirming}
                      className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl transition disabled:opacity-50"
                    >
                      {confirming ? "처리 중..." : "예, 마감 확정"}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <button
                    onClick={confirmClose}
                    disabled={confirming}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-3 rounded-xl transition shadow-md disabled:opacity-50"
                  >
                    {confirming ? "처리 중..." : `${bizDate} 영업 마감 확정`}
                  </button>
                  <p className="text-xs text-gray-400 text-center">마감 확정 후에는 취소할 수 없습니다.</p>
                </>
              )}
            </div>
          )}

          {/* 마감 완료 메모 표시 */}
          {isClosed && summary.memo && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
              <p className="text-xs font-black text-yellow-600 mb-1">메모</p>
              <p className="text-sm text-yellow-800">{summary.memo}</p>
            </div>
          )}
        </>
      ) : null}

      {/* 마감 이력 */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-black text-gray-800">마감 이력</h3>
          <button onClick={fetchHistory} className="text-xs text-indigo-600 font-bold hover:underline">새로고침</button>
        </div>

        {loadingHistory ? (
          <div className="py-10 text-center text-gray-400 text-sm">불러오는 중...</div>
        ) : history.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-sm">마감 이력이 없습니다.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs font-bold">
                  <th className="px-4 py-3 text-left">영업일</th>
                  <th className="px-4 py-3 text-right">총 매출</th>
                  <th className="px-4 py-3 text-right">카드</th>
                  <th className="px-4 py-3 text-right">현금</th>
                  <th className="px-4 py-3 text-right">주문건</th>
                  <th className="px-4 py-3 text-right">취소</th>
                  <th className="px-4 py-3 text-left">확정자</th>
                  <th className="px-4 py-3 text-left">메모</th>
                </tr>
              </thead>
              <tbody>
                {history.map((c, idx) => (
                  <tr
                    key={c.id}
                    onClick={() => openDetail(c)}
                    className={`cursor-pointer hover:bg-indigo-50 transition border-t border-gray-50 ${idx % 2 === 0 ? "" : "bg-gray-50/30"}`}
                  >
                    <td className="px-4 py-3 font-bold text-indigo-700">{c.business_date}</td>
                    <td className="px-4 py-3 text-right font-black text-gray-800">{(c.total_revenue ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{(c.card_revenue ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{(c.cash_revenue ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-600">{c.order_count}건</td>
                    <td className="px-4 py-3 text-right">
                      {c.cancelled_count > 0
                        ? <span className="text-rose-600 font-bold">{c.cancelled_count}건</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{c.closed_by_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-[120px] truncate">{c.memo ?? ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {detailModal && (
        <ClosingDetailModal closing={detailModal} onClose={() => setDetailModal(null)} />
      )}
    </div>
  );
}
