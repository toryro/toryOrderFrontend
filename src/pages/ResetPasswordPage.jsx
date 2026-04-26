import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) setError("유효하지 않은 링크입니다.");
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (newPassword.length < 6) {
            setError("비밀번호는 최소 6자 이상이어야 합니다.");
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("비밀번호가 일치하지 않습니다.");
            return;
        }

        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/reset-password`, {
                token,
                new_password: newPassword,
            });
            setDone(true);
            setTimeout(() => navigate("/"), 3000);
        } catch (err) {
            setError(err.response?.data?.detail || "오류가 발생했습니다. 링크가 만료되었을 수 있습니다.");
        } finally {
            setLoading(false);
        }
    };

    const passwordStrength = () => {
        if (!newPassword) return null;
        if (newPassword.length < 6) return { label: "너무 짧음", color: "bg-red-400", width: "w-1/4" };
        if (newPassword.length < 10) return { label: "보통", color: "bg-yellow-400", width: "w-2/4" };
        if (!/[0-9]/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) return { label: "보통", color: "bg-yellow-400", width: "w-2/4" };
        return { label: "강함", color: "bg-green-400", width: "w-full" };
    };
    const strength = passwordStrength();

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🔐</div>
                    <h1 className="text-2xl font-extrabold text-gray-800">새 비밀번호 설정</h1>
                </div>

                {done ? (
                    <div className="text-center space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                            <div className="text-4xl mb-2">✅</div>
                            <p className="font-bold text-green-700 text-lg">비밀번호가 변경되었습니다!</p>
                            <p className="text-green-500 text-sm mt-2">잠시 후 로그인 화면으로 이동합니다.</p>
                        </div>
                        <Link to="/" className="block w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-center hover:bg-indigo-700 transition">
                            지금 로그인하기
                        </Link>
                    </div>
                ) : !token ? (
                    <div className="text-center space-y-4">
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5">
                            <div className="text-3xl mb-2">❌</div>
                            <p className="font-bold text-red-700">유효하지 않은 링크입니다.</p>
                        </div>
                        <Link to="/forgot-password" className="block text-indigo-500 font-bold text-sm hover:underline">
                            비밀번호 찾기 다시 요청하기
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1.5">새 비밀번호</label>
                            <input
                                type="password"
                                placeholder="6자 이상 입력"
                                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoFocus
                            />
                            {strength && (
                                <div className="mt-2 space-y-1">
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full transition-all ${strength.color} ${strength.width}`} />
                                    </div>
                                    <p className={`text-xs font-bold ${strength.color.replace('bg-', 'text-')}`}>{strength.label}</p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-600 mb-1.5">비밀번호 확인</label>
                            <input
                                type="password"
                                placeholder="동일한 비밀번호 재입력"
                                className={`w-full border p-3 rounded-xl focus:outline-none focus:ring-2 transition ${
                                    confirmPassword && newPassword !== confirmPassword
                                        ? "border-red-400 focus:ring-red-300"
                                        : "border-gray-300 focus:ring-indigo-400"
                                }`}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                            />
                            {confirmPassword && newPassword !== confirmPassword && (
                                <p className="text-red-500 text-xs mt-1 font-bold">비밀번호가 일치하지 않습니다.</p>
                            )}
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-red-600 text-sm font-bold">{error}</p>
                                {error.includes("만료") && (
                                    <Link to="/forgot-password" className="text-indigo-500 text-xs font-bold underline mt-1 block">
                                        재설정 링크 다시 받기 →
                                    </Link>
                                )}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !newPassword || !confirmPassword}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-indigo-300 transition active:scale-[0.98]"
                        >
                            {loading ? "변경 중..." : "비밀번호 변경하기"}
                        </button>
                    </form>
                )}

                <div className="mt-6 text-center">
                    <Link to="/" className="text-sm text-gray-400 hover:text-indigo-500 font-bold transition">
                        ← 로그인으로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default ResetPasswordPage;
