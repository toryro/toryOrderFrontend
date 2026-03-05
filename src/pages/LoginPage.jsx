import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";
import toast from "react-hot-toast"; // 🔥 임포트 추가

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    // 💡 입력값 빈칸 체크 추가 (UX 개선)
    if (!email || !password) {
        toast.error("이메일과 비밀번호를 모두 입력해주세요.");
        return;
    }

    // 로딩 상태를 보여주는 토스트 실행 (데이터를 가져오는 동안 빙글빙글 돕니다)
    const loginPromise = axios.post(`${API_BASE_URL}/token`, new URLSearchParams({
        username: email,
        password: password
    }));

    toast.promise(loginPromise, {
        loading: '로그인 중...',
        success: '토큰 발급 성공!',
        error: '로그인 실패! 이메일과 비밀번호를 확인해주세요.',
    }).then(async (res) => {
        const token = res.data.access_token;
        localStorage.setItem("token", token);

        try {
            const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const user = userRes.data;

            // 역할에 따른 페이지 이동 및 성공 알림
            if (user.role === "SUPER_ADMIN") {
                toast.success("슈퍼 관리자님 환영합니다! 👑");
                navigate("/admin");
            } else if (user.role === "BRAND_ADMIN") {
                toast.success(`반갑습니다! ${user.name} 브랜드 관리자님.`);
                navigate("/admin");
            } else if (user.role === "GROUP_ADMIN") {
                toast.success(`${user.name} 그룹 관리자님 환영합니다.`);
                navigate("/admin");
            } else if (user.role === "STORE_OWNER") {
                if (user.store_id) {
                    toast.success(`환영합니다, ${user.name} 사장님! 오늘도 화이팅! 💪`);
                    navigate(`/admin/${user.store_id}`);
                } else {
                    toast.error("소속된 매장 정보가 없습니다.");
                }
            } else {
                toast.error("접근 권한이 없는 역할입니다.");
                localStorage.removeItem("token");
            }
        } catch (err) {
            toast.error("사용자 정보를 불러오는데 실패했습니다.");
        }
    }).catch((err) => {
        // 오류 처리는 위 toast.promise의 error 속성에서 이미 처리됨
        console.error(err);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-indigo-600">
          Tory Order 로그인
        </h1>
        
        <div className="space-y-4">
          <input
            type="text"
            placeholder="이메일"
            className="w-full border p-3 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full border p-3 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()} 
          />
          <button
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white p-3 rounded font-bold hover:bg-indigo-700 transition"
          >
            로그인
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;