import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) { setError("이메일을 입력해주세요."); return; }
        setError("");
        setLoading(true);
        try {
            await axios.post(`${API_BASE_URL}/auth/forgot-password`, { email });
            setSent(true);
        } catch {
            setError("요청 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-sm">
                <div className="text-center mb-6">
                    <div className="text-5xl mb-3">🔑</div>
                    <h1 className="text-2xl font-extrabold text-gray-800">비밀번호 찾기</h1>
                    <p className="text-gray-500 text-sm mt-2">
                        가입 시 사용한 이메일을 입력하면<br />재설정 링크를 보내드립니다.
                    </p>
                </div>

                {sent ? (
                    <div className="text-center space-y-4">
                        <div className="bg-green-50 border border-green-200 rounded-xl p-5">
                            <div className="text-3xl mb-2">📬</div>
                            <p className="font-bold text-green-700">이메일을 확인해주세요!</p>
                            <p className="text-green-600 text-sm mt-1">
                                <span className="font-bold">{email}</span>으로<br />
                                재설정 링크를 발송했습니다.
                            </p>
                            <p className="text-green-500 text-xs mt-2">링크는 30분 후 만료됩니다.</p>
                        </div>
                        <p className="text-xs text-gray-400">
                            이메일이 오지 않으면 스팸함을 확인하거나<br />
                            <button
                                onClick={() => setSent(false)}
                                className="text-indigo-500 font-bold underline"
                            >
                                다시 요청
                            </button>
                            하세요.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <input
                                type="email"
                                placeholder="이메일 주소"
                                className="w-full border border-gray-300 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                            />
                            {error && <p className="text-red-500 text-sm mt-1.5 font-bold">{error}</p>}
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:bg-indigo-300 transition active:scale-[0.98]"
                        >
                            {loading ? "발송 중..." : "재설정 링크 받기"}
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

export default ForgotPasswordPage;
