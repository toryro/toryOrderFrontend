import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config"; // IP 주소 설정 가져오기

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // 1. 로그인 요청 (토큰 발급)
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await axios.post(`${API_BASE_URL}/token`, formData);
      const token = res.data.access_token;

      // 2. 토큰 저장
      localStorage.setItem("token", token);

      // 3. [핵심] "나 누구야?" 확인 (내 정보 조회)
      const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = userRes.data;
      console.log("로그인 유저 정보:", user);

      // 4. 역할(Role)에 따른 교통정리 🚦
      if (user.role === "SUPER_ADMIN") {
        // 슈퍼 관리자 -> 대시보드
        alert("슈퍼 관리자님 환영합니다! 👑");
        navigate("/super-admin");
      } else if (user.role === "STORE_OWNER") {
        // 사장님 -> 내 가게 관리 페이지
        if (user.store_id) {
            alert("사장님, 오늘도 대박나세요! 💰");
            navigate(`/admin/${user.store_id}`);
        } else {
            alert("할당된 가게가 없습니다. 관리자에게 문의하세요.");
        }
      } else {
        // 그 외 (그룹 관리자 등)
        alert("접근 권한이 없는 역할입니다.");
      }

    } catch (err) {
      console.error(err);
      alert("로그인 실패! 이메일과 비밀번호를 확인해주세요.");
    }
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
            placeholder="이메일 (admin@tory.com)"
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
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()} // 엔터키 로그인 지원
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