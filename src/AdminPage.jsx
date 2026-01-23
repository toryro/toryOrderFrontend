import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// [설정] 본인의 맥북 IP 주소로 꼭 확인하세요!
const API_BASE_URL = "http://127.0.0.1:8000"; 

function AdminPage() {
  const navigate = useNavigate();
  const { storeId } = useParams();
  const [store, setStore] = useState(null);
  
  // 입력 폼 상태
  const [menuName, setMenuName] = useState("");
  const [menuPrice, setMenuPrice] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [menuImage, setMenuImage] = useState(null); // 이미지 URL 저장용
  const [activeTab, setActiveTab] = useState(0);

  // 데이터 불러오기
  const fetchStoreData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/stores/${storeId}`);
      setStore(res.data);
      if (res.data.categories.length > 0 && !categoryId) {
        setCategoryId(res.data.categories[0].id);
      }
    } catch (err) {
      console.error(err);
      alert("가게 정보를 불러올 수 없습니다.");
    }
  };

  useEffect(() => {
    fetchStoreData();
  }, [storeId]);

  // [핵심] 이미지 파일 선택 시 바로 서버로 업로드
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE_URL}/upload/`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMenuImage(res.data.url); // 서버가 준 이미지 URL을 상태에 저장
    } catch (err) {
      alert("이미지 업로드 실패");
      console.error(err);
    }
  };

  // 메뉴 추가 함수
  const handleAddMenu = async () => {
    if (!menuName || !menuPrice) return alert("이름과 가격을 입력해주세요.");
    try {
      await axios.post(`${API_BASE_URL}/categories/${categoryId}/menus/`, {
        name: menuName,
        price: parseInt(menuPrice),
        description: "사장님이 추가함",
        is_sold_out: false,
        image_url: menuImage // [추가] 이미지 URL도 함께 전송
      });
      alert("✅ 메뉴가 추가되었습니다!");
      setMenuName("");
      setMenuPrice("");
      setMenuImage(null); // 초기화
      fetchStoreData(); 
    } catch (err) {
      alert("메뉴 추가 실패");
    }
  };

  // [추가] 로그아웃 함수
  const handleLogout = () => {
    localStorage.removeItem("token"); // 토큰 삭제
    alert("로그아웃 되었습니다.");
    navigate("/login"); // 로그인 화면으로 이동
  };

  // 품절 처리 토글
  const toggleSoldOut = (menu) => {
    alert(`'${menu.name}' 품절 상태를 변경합니다.\n(기능 준비중)`);
  };

  if (!store) return <div className="flex justify-center items-center h-screen text-gray-500">로딩중...</div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. 상단 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">영업중</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">{store.name} 관리</h1>
          </div>
          {/* 로그아웃 버튼 추가 */}
            <button 
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-500 font-bold px-3 py-2"
            >
              로그아웃
            </button>
          <button 
              onClick={() => {
                // 1. 토큰이 있는지 먼저 꺼내봅니다.
                const token = store.tables[0]?.qr_token;
                
                // 2. 토큰이 없으면 경고창을 띄우고 중단합니다.
                if (!token) {
                    alert("QR 코드가 없습니다. 테이블이 등록되어 있는지 확인해주세요.");
                    return;
                }

                // 3. 토큰이 있을 때만 새 창을 엽니다.
                window.open(`${API_BASE_URL.replace(":8000", ":5173")}/order/${token}`);
            }}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition"
        >
            <span>📱 내 가게 QR 보기</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        
        {/* 2. 메뉴 등록 카드 (이미지 업로드 포함) */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-10">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">1</span>
            새 메뉴 등록하기
          </h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* [왼쪽] 이미지 업로드 영역 */}
            <div className="w-full md:w-40 flex flex-col gap-2">
                <div className="w-40 h-40 bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group cursor-pointer hover:border-blue-500 transition">
                    {menuImage ? (
                        <img src={menuImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex flex-col items-center text-gray-400">
                            <span className="text-2xl">📷</span>
                            <span className="text-xs mt-1 font-bold">사진 추가</span>
                        </div>
                    )}
                    {/* 투명한 파일 입력창이 위를 덮고 있음 */}
                    <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                </div>
            </div>

            {/* [오른쪽] 텍스트 입력 영역 */}
            <div className="flex-1 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <select 
                      className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      value={categoryId} 
                      onChange={(e) => setCategoryId(e.target.value)}
                    >
                      {store.categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                    <input 
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="메뉴 이름 (예: 치즈돈가스)" 
                      value={menuName}
                      onChange={(e) => setMenuName(e.target.value)}
                    />
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                    <input 
                      type="number"
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="가격 (원)" 
                      value={menuPrice}
                      onChange={(e) => setMenuPrice(e.target.value)}
                    />
                    <button 
                      onClick={handleAddMenu}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3 rounded-lg shadow-md transition transform active:scale-95"
                    >
                      + 등록
                    </button>
                </div>
            </div>
          </div>
        </div>

        {/* 3. 메뉴판 관리 */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="bg-black text-white w-6 h-6 rounded-full flex items-center justify-center text-xs mr-2">2</span>
            메뉴 관리
          </h2>

          <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
            {store.categories.map((cat, index) => (
              <button
                key={cat.id}
                onClick={() => setActiveTab(index)}
                className={`px-5 py-2 rounded-full font-bold whitespace-nowrap transition ${
                  activeTab === index 
                    ? "bg-gray-900 text-white shadow-lg" 
                    : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {store.categories[activeTab]?.menus.map((menu) => (
              <div key={menu.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition flex flex-row">
                {/* 리스트의 이미지 표시 부분 */}
                <div className="w-32 h-32 bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                  {menu.image_url ? (
                      <img src={menu.image_url} alt={menu.name} className="w-full h-full object-cover" />
                  ) : (
                      <span className="text-4xl">🥘</span>
                  )}
                </div>
                
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{menu.name}</h3>
                    <span className="text-blue-600 font-bold">{menu.price.toLocaleString()}원</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-gray-500">{menu.is_sold_out ? "품절됨" : "판매중"}</span>
                    <button 
                      onClick={() => toggleSoldOut(menu)}
                      className={`relative w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${
                        menu.is_sold_out ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    >
                      <span className={`inline-block w-3 h-3 transform bg-white rounded-full transition duration-200 ease-in-out mt-1 ml-1 ${
                          menu.is_sold_out ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}

export default AdminPage;