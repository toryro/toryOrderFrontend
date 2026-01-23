import { useState } from 'react';

function SuperAdminPage() {
  // 아직 백엔드에 '모든 매장 불러오기' 기능이 없으므로, 가짜 데이터(Mock Data)로 디자인부터 봅니다.
  const [stores] = useState([
    { id: 1, name: "김밥천국 강남점", owner: "김사장", status: "영업중", sales: 150000 },
    { id: 2, name: "김밥천국 싱가포르점", owner: "이회장", status: "영업중", sales: 320000 },
    { id: 3, name: "망한 분식", owner: "박폐업", status: "폐업", sales: 0 },
  ]);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 1. 왼쪽 사이드바 (검은색) */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-6 text-2xl font-bold text-center border-b border-slate-700">
          TORY ADMIN
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <div className="p-3 bg-blue-600 rounded cursor-pointer font-bold">📊 대시보드</div>
          <div className="p-3 hover:bg-slate-800 rounded cursor-pointer text-gray-400">🏪 매장 관리</div>
          <div className="p-3 hover:bg-slate-800 rounded cursor-pointer text-gray-400">⚙️ 시스템 설정</div>
        </nav>
        <div className="p-4 text-xs text-gray-500 text-center">
          v1.0.0 (Admin Mode)
        </div>
      </aside>

      {/* 2. 메인 컨텐츠 영역 (회색) */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">본사 현황판</h1>
          <button className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 transition">
            로그아웃
          </button>
        </header>

        {/* 3. 통계 카드 (위쪽 3개 박스) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-bold uppercase">총 가맹점</h3>
            <p className="text-4xl font-extrabold text-blue-600 mt-2">1,204개</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-bold uppercase">오늘 총 거래액</h3>
            <p className="text-4xl font-extrabold text-emerald-500 mt-2">₩ 45,200,000</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-gray-500 text-sm font-bold uppercase">시스템 상태</h3>
            <div className="flex items-center mt-2">
              <span className="w-4 h-4 bg-green-500 rounded-full animate-pulse mr-2"></span>
              <p className="text-2xl font-bold text-gray-700">정상 가동 중</p>
            </div>
          </div>
        </div>

        {/* 4. 매장 목록 테이블 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-800">최근 가입 매장</h2>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">매장명</th>
                <th className="px-6 py-3">점주</th>
                <th className="px-6 py-3">매출(일)</th>
                <th className="px-6 py-3">상태</th>
                <th className="px-6 py-3">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stores.map((store) => (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">#{store.id}</td>
                  <td className="px-6 py-4 text-gray-700">{store.name}</td>
                  <td className="px-6 py-4 text-gray-500">{store.owner}</td>
                  <td className="px-6 py-4 font-mono font-bold">₩ {store.sales.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      store.status === "영업중" 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                    }`}>
                      {store.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:underline text-sm font-bold">설정</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

export default SuperAdminPage;