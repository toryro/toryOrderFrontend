import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

const STATUS_STEPS = [
    { key: "RECEIVED",  label: "접수됨",   icon: "✅" },
    { key: "COOKING",   label: "조리 중",   icon: "🍳" },
    { key: "COMPLETED", label: "준비됐습니다!", icon: "🎉" },
];

function getStep(data) {
    if (!data) return 0;
    if (data.payment_status === "CANCELLED") return -1;
    if (data.is_completed || data.cooking_status === "COMPLETED") return 2;
    if (data.cooking_status === "COOKING") return 1;
    return 0;
}

export default function OrderStatusPage() {
    const { orderId } = useParams();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const intervalRef = useRef(null);

    const fetchStatus = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/orders/${orderId}/status`, {
                params: { token },
            });
            setData(res.data);
            setError(null);
            // 완료/취소 시 폴링 중단
            if (res.data.is_completed || res.data.cooking_status === "COMPLETED" || res.data.payment_status === "CANCELLED") {
                clearInterval(intervalRef.current);
            }
        } catch (e) {
            setError(e.response?.data?.detail || "주문 정보를 불러올 수 없습니다.");
            clearInterval(intervalRef.current);
        }
    };

    useEffect(() => {
        if (!orderId || !token) {
            setError("잘못된 접근입니다.");
            return;
        }
        fetchStatus();
        intervalRef.current = setInterval(fetchStatus, 5000);
        return () => clearInterval(intervalRef.current);
    }, [orderId, token]);

    const step = getStep(data);
    const isCancelled = data?.payment_status === "CANCELLED";

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 text-center shadow max-w-sm w-full">
                    <div className="text-5xl mb-4">⚠️</div>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-400 text-lg animate-pulse">불러오는 중...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-10 px-4">
            <div className="w-full max-w-sm space-y-4">

                {/* 헤더 */}
                <div className="text-center">
                    <p className="text-sm text-gray-400">{data.store_name}</p>
                    <h1 className="text-2xl font-extrabold text-gray-800 mt-1">주문 #{data.daily_number}</h1>
                </div>

                {/* 취소 상태 */}
                {isCancelled ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                        <div className="text-4xl mb-2">❌</div>
                        <p className="text-red-600 font-bold text-lg">주문이 취소되었습니다</p>
                    </div>
                ) : (
                    <>
                        {/* 상태 스텝 */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between">
                                {STATUS_STEPS.map((s, i) => (
                                    <div key={s.key} className="flex-1 flex flex-col items-center">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold border-2 transition-all duration-500
                                            ${i < step ? "bg-green-500 border-green-500 text-white" :
                                              i === step ? "bg-indigo-500 border-indigo-500 text-white scale-110 shadow-md" :
                                              "bg-gray-100 border-gray-200 text-gray-400"}`}>
                                            {i <= step ? s.icon : <span className="text-base text-gray-400">{i + 1}</span>}
                                        </div>
                                        <p className={`text-xs mt-2 font-semibold text-center
                                            ${i === step ? "text-indigo-600" : i < step ? "text-green-600" : "text-gray-400"}`}>
                                            {s.label}
                                        </p>
                                        {i < STATUS_STEPS.length - 1 && (
                                            <div className="absolute" />
                                        )}
                                    </div>
                                ))}
                            </div>

                            {/* 진행선 */}
                            <div className="relative mt-1 mx-6 h-1 bg-gray-100 rounded-full">
                                <div
                                    className="absolute h-1 bg-indigo-400 rounded-full transition-all duration-700"
                                    style={{ width: step === 0 ? "0%" : step === 1 ? "50%" : "100%" }}
                                />
                            </div>

                            {/* 현재 상태 메시지 */}
                            <div className={`mt-5 py-3 px-4 rounded-xl text-center text-sm font-semibold
                                ${step === 2 ? "bg-green-50 text-green-700" : "bg-indigo-50 text-indigo-700"}`}>
                                {step === 0 && "주문이 접수되었습니다. 잠시 기다려주세요 🙏"}
                                {step === 1 && "지금 맛있게 조리하고 있어요! 🔥"}
                                {step === 2 && "준비가 완료됐습니다! 카운터에서 가져가세요 🎉"}
                            </div>
                        </div>

                        {/* 예상 시간 */}
                        {step < 2 && data.target_time && (
                            <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3">
                                <span className="text-2xl">⏱️</span>
                                <div>
                                    <p className="text-xs text-gray-400">예상 대기 시간</p>
                                    <p className="font-bold text-gray-800">약 {data.target_time}분</p>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* 주문 항목 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm">
                    <h2 className="text-sm font-bold text-gray-500 mb-3">주문 내역</h2>
                    <ul className="space-y-2">
                        {data.items.map((item, i) => (
                            <li key={i} className="flex justify-between items-start">
                                <div>
                                    <span className="font-semibold text-gray-800">{item.menu_name}</span>
                                    {item.options_desc && (
                                        <p className="text-xs text-gray-400 mt-0.5">{item.options_desc}</p>
                                    )}
                                </div>
                                <span className="text-gray-500 font-medium ml-4">×{item.quantity}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* 자동 갱신 안내 */}
                {!isCancelled && step < 2 && (
                    <p className="text-center text-xs text-gray-400">5초마다 자동으로 갱신됩니다</p>
                )}
            </div>
        </div>
    );
}
