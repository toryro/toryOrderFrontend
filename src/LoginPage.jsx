import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

// [설정] 본인 IP 주소 확인!
const API_BASE_URL = "http://192.168.0.172:8000";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // 새로고침 방지

    // FastAPI의 OAuth2Form은 JSON이 아니라 "Form Data"를 원합니다.
    const formData = new URLSearchParams();
    formData.append("username", email); // *주의: 서버는 username이라는 이름으로 찾음
    formData.append("password", password);

    try {
      const res = await axios.post(`${API_BASE_URL}/token`, formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      // 1. 토큰 받기 성공!
      const { access_token } = res.data;
      
      // 2. 브라우저 저장소(Local Storage)에 토큰 저장
      localStorage.setItem("token", access_token);
      
      alert("로그인 성공! 사장님 환영합니다. 🎉");

      // 3. 관리자 페이지로 이동 (일단 1번 가게로 고정)
      navigate("/admin/1");

    } catch (err) {
      console.error(err);
      alert("로그인 실패! 이메일과 비밀번호를 확인해주세요.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">🔑 사장님 로그인</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
            <input 
              type="email" 
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin@tory.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
            <input 
              type="password" 
              className="w-full border rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="비밀번호 입력"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition"
          >
            로그인 하기
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          토리에 오신 것을 환영합니다.
        </p>
      </div>
    </div>
  );
}

export default LoginPage;