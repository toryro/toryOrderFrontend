import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_BASE_URL } from "../config";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      // 1. 로그인 요청
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await axios.post(`${API_BASE_URL}/token`, formData);
      const token = res.data.access_token;

      // 2. 토큰 저장
      localStorage.setItem("token", token);

      // 3. 내 정보 조회
      const userRes = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const user = userRes.data;
      console.log("로그인 유저 정보:", user);

      // 4. 역할(Role)에 따른 페이지 이동 🚦
      if (user.role === "SUPER_ADMIN") {
        alert("슈퍼 관리자님 환영합니다! 👑");
        navigate("/admin"); // 슈퍼관리자도 일단 관리자 페이지로 이동 (혹은 별도 페이지)
      } 
      else if (user.role === "STORE_OWNER") {
        if (user.store_id) {
            alert("사장님, 오늘도 대박나세요! 💰");
            navigate(`/admin/${user.store_id}`);
        } else {
            alert("할당된 가게가 없습니다.");
        }
      } 
      // 👇 [신규 추가] 직원일 경우
      else if (user.role === "STAFF") {
        if (user.store_id) {
            // 직원은 사장님과 같은 주소로 가지만, AdminPage 내부에서 '직원용 화면'을 보여줍니다.
            alert(`환영합니다, ${user.name}님! 오늘도 화이팅! 💪`);
            navigate(`/admin/${user.store_id}`);
        } else {
            alert("소속된 매장 정보가 없습니다.");
        }
      }
      // 👇 [신규 추가] 그룹(본사) 관리자일 경우
      else if (user.role === "GROUP_ADMIN") {
        alert("본사 관리자 모드로 접속합니다.");
        navigate("/admin"); // storeId 없이 접속하면 대시보드가 뜹니다.
      }
      else {
        // 그 외 (권한 없음)
        alert("접근 권한이 없는 역할입니다.");
        localStorage.removeItem("token"); // 토큰 삭제
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