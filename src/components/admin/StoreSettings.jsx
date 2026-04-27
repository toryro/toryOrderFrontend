import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";
import { CashReceiptForm } from "../CashReceiptForm";

// 1. 영업장 정보 관리
export function AdminStoreInfo({ store, token, fetchStore, user }) { 
    const [name, setName] = useState(store?.name || "");
    const [address, setAddress] = useState(store?.address || "");
    const [phone, setPhone] = useState(store?.phone || "");
    const [desc, setDesc] = useState(store?.description || "");
    const [notice, setNotice] = useState(store?.notice || "");
    const [originInfo, setOriginInfo] = useState(store?.origin_info || "");
    const [ownerName, setOwnerName] = useState(store?.owner_name || "");
    const [businessName, setBusinessName] = useState(store?.business_name || "");
    const [businessAddress, setBusinessAddress] = useState(store?.business_address || "");
    const [businessNumber, setBusinessNumber] = useState(store?.business_number || "");
    
    const [brandId, setBrandId] = useState(store?.brand_id || "");
    const [priceMarkup, setPriceMarkup] = useState(store?.price_markup || 0); 
    const [brands, setBrands] = useState([]);
    
    const [royaltyType, setRoyaltyType] = useState(store?.royalty_type || "PERCENTAGE"); 
    const [royaltyAmount, setRoyaltyAmount] = useState(store?.royalty_amount || 0); 

    const [region, setRegion] = useState(store?.region || "미지정");
    const [isDirectManage, setIsDirectManage] = useState(store?.is_direct_manage || false);

    const [paymentPolicy, setPaymentPolicy] = useState(store?.payment_policy || "PRE_PAY");
    const [useTableBoard, setUseTableBoard] = useState(store?.use_table_board ?? true);
    const [useMenuDetail, setUseMenuDetail] = useState(store?.use_menu_detail ?? false);
    const [closingHour, setClosingHour] = useState(store?.closing_hour ?? 0);

    const isHQ = ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN"].includes(user?.role); 
    const [hasPos, setHasPos] = useState(store?.has_pos || false); // ✨ 신규: POS 사용 여부 상태

    // ✨ [핵심 수정] 서버에서 store 데이터가 새로고침 될 때마다 화면 상태(State)를 동기화합니다!
    useEffect(() => {
        if (store) {
            setName(store.name || "");
            setAddress(store.address || "");
            setPhone(store.phone || "");
            setDesc(store.description || "");
            setNotice(store.notice || "");
            setOriginInfo(store.origin_info || "");
            setOwnerName(store.owner_name || "");
            setBusinessName(store.business_name || "");
            setBusinessAddress(store.business_address || "");
            setBusinessNumber(store.business_number || "");
            setBrandId(store.brand_id || "");
            setPriceMarkup(store.price_markup || 0);
            setRoyaltyType(store.royalty_type || "PERCENTAGE");
            setRoyaltyAmount(store.royalty_amount || 0);
            setRegion(store.region || "미지정");
            setIsDirectManage(store.is_direct_manage || false);
            
            // 토글 및 라디오 버튼 동기화
            setPaymentPolicy(store.payment_policy || "PRE_PAY");
            setUseTableBoard(store.use_table_board ?? true);
            setUseMenuDetail(store.use_menu_detail ?? false);
            setClosingHour(store.closing_hour ?? 0);
        }
    }, [store]);

    // 기존 브랜드 목록 가져오기
    useEffect(() => {
        axios.get(`${API_BASE_URL}/brands/`, { headers: { Authorization: `Bearer ${token}` } })
            .then(res => setBrands(res.data))
            .catch(()=>{});
    }, [token]);

    const handleSave = async () => {
        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, 
                { 
                    name, address, phone, description: desc, notice, origin_info: originInfo, 
                    owner_name: ownerName, business_name: businessName, business_address: businessAddress, 
                    business_number: businessNumber, 
                    brand_id: brandId ? parseInt(brandId) : null,
                    price_markup: parseInt(priceMarkup),
                    royalty_type: royaltyType,                 
                    royalty_amount: parseFloat(royaltyAmount), 
                    region: region,                            
                    is_direct_manage: isDirectManage,
                    payment_policy: paymentPolicy,
                    use_menu_detail: useMenuDetail,
                    use_table_board: useTableBoard,
                    has_pos: hasPos,
                    closing_hour: parseInt(closingHour),
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("가게 정보가 성공적으로 저장되었습니다."); 
            fetchStore(); // 저장 후 DB 데이터를 다시 불러옴 -> 위의 useEffect가 실행되면서 화면 최신화!
        } catch(err) { 
            toast.error("저장 실패"); 
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">🏠 기본 정보</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* ✨ [신규 추가] 테이블 결제 방식 설정 (점주, 본사 모두 설정 가능) */}
                    <div className="col-span-1 md:col-span-2 bg-indigo-50 p-5 rounded-xl border border-indigo-100 mb-2">
                        <label className="block text-base font-black text-indigo-900 mb-3">
                            💳 테이블 주문 결제 방식
                        </label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <label className={`flex-1 border-2 p-4 rounded-xl cursor-pointer font-bold transition flex items-center gap-3 ${paymentPolicy === 'PRE_PAY' ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                                <input type="radio" name="paymentPolicy" value="PRE_PAY" checked={paymentPolicy === 'PRE_PAY'} onChange={(e) => setPaymentPolicy(e.target.value)} className="w-5 h-5 accent-indigo-600" />
                                선불 (주문 시 모바일 결제)
                            </label>
                            <label className={`flex-1 border-2 p-4 rounded-xl cursor-pointer font-bold transition flex items-center gap-3 ${paymentPolicy === 'POST_PAY' ? 'bg-white border-yellow-500 text-yellow-700 shadow-sm' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                                <input type="radio" name="paymentPolicy" value="POST_PAY" checked={paymentPolicy === 'POST_PAY'} onChange={(e) => setPaymentPolicy(e.target.value)} className="w-5 h-5 accent-yellow-500" />
                                후불 (나갈 때 카운터 결제)
                            </label>
                        </div>
                        <p className="text-sm text-indigo-600 mt-3 font-bold bg-white p-2 rounded-lg inline-block">
                            💡 후불 선택 시, 손님은 결제 과정 없이 바로 주문이 접수되며 주방 모니터에 '결제 대기'로 표시됩니다.
                        </p>
                    </div>

                    {/* 영업 마감 시각 (매출 정산 기준 시각) */}
                    <div className="col-span-1 md:col-span-2 bg-slate-50 p-5 rounded-xl border border-slate-200">
                        <label className="block text-base font-black text-slate-800 mb-1">
                            🕛 영업 마감 기준 시각 (매출 정산용)
                        </label>
                        <p className="text-xs text-slate-500 mb-3">새벽에도 영업하는 경우, 이 시각 이전 주문은 전날 영업일로 집계됩니다. (예: 새벽 3시 설정 → 03:00 이전 주문 = 전날 매출)</p>
                        <select
                            value={closingHour}
                            onChange={e => setClosingHour(e.target.value)}
                            className="border-2 border-slate-200 rounded-xl px-4 py-2 font-bold text-gray-700 focus:border-indigo-500 outline-none bg-white"
                        >
                            <option value={0}>자정 (00:00) — 기본값</option>
                            {[1,2,3,4,5,6].map(h => (
                                <option key={h} value={h}>새벽 {h}시 (0{h}:00)</option>
                            ))}
                        </select>
                    </div>

                        {/* ✨ [수정 완료] 테이블 현황판 사용 설정 */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-200 mt-4 shadow-sm">
                            <div>
                                <h4 className="font-bold text-gray-800">📊 테이블 현황판 (홀 모니터) 사용</h4>
                                <p className="text-xs text-gray-500 mt-1">홀 직원을 위한 실시간 테이블 상태(식사 중, 치우기 등) 모니터 기능을 켭니다.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={useTableBoard}
                                    onChange={(e) => setUseTableBoard(e.target.checked)} 
                                />
                                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        {/* 테이블 현황판 설정 아래에 추가 */}
                        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-indigo-200 mt-2 shadow-sm">
                            <div>
                                <h4 className="font-bold text-gray-800">🖼️ 메뉴 상세 페이지 사용</h4>
                                <p className="text-xs text-gray-500 mt-1">메뉴 클릭 시 바로 담지 않고 설명과 사진이 있는 상세 페이지를 보여줍니다.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={useMenuDetail}
                                    onChange={(e) => setUseMenuDetail(e.target.checked)} 
                                />
                                <div className="w-14 h-7 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                        {/* ✨ 신규 추가: POS 시스템 연동 설정 UI */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="text-2xl">🖥️</span>
                                <div>
                                    <h3 className="font-extrabold text-lg text-gray-900">POS 시스템 연동 정책</h3>
                                    <p className="text-xs text-gray-500 font-bold mt-1">POS기 유무에 따라 결제 방식, 영수증 자동 출력, 후불 수납 UI가 달라집니다.</p>
                                </div>
                            </div>

                            <div className="flex bg-gray-100 p-1.5 rounded-xl">
                                <button
                                    onClick={() => setHasPos(true)}
                                    className={`flex-1 py-3 font-bold text-sm rounded-lg transition-all ${hasPos ? "bg-white text-indigo-700 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    ✅ POS기 사용함
                                </button>
                                <button
                                    onClick={() => setHasPos(false)}
                                    className={`flex-1 py-3 font-bold text-sm rounded-lg transition-all ${!hasPos ? "bg-white text-indigo-700 shadow-md" : "text-gray-500 hover:text-gray-700"}`}
                                >
                                    📱 POS기 없음
                                </button>
                            </div>
                            <div className={`mt-3 p-3 rounded-xl text-xs font-bold leading-relaxed ${hasPos ? "bg-indigo-50 text-indigo-700" : "bg-amber-50 text-amber-700"}`}>
                                {hasPos ? (
                                    <>
                                        <p>· 후불 주문 접수 후 고객에게 <strong>"포스기에서 결제해주세요"</strong> 안내</p>
                                        <p>· 결제 완료 후 영수증 자동 출력 생략 (POS가 직접 출력)</p>
                                        <p>· 수납 모달에서 결제수단 선택 없이 <strong>"포스기 수납 완료"</strong> 버튼만 표시</p>
                                    </>
                                ) : (
                                    <>
                                        <p>· 후불 주문 접수 후 고객에게 <strong>"카운터에서 결제해주세요"</strong> 안내</p>
                                        <p>· 결제 완료 후 영수증 프린터로 자동 출력</p>
                                        <p>· 수납 모달에서 <strong>카드 / 현금</strong> 중 결제수단 선택 후 수납 처리</p>
                                    </>
                                )}
                            </div>
                        </div>

                    {isHQ && (
                        <>
                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1">소속 브랜드</label>
                                <select className="w-full border p-3 rounded-lg bg-indigo-50" value={brandId} onChange={e=>setBrandId(e.target.value)} disabled={!isHQ}>
                                    <option value="">독립 매장</option>
                                    {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-600 mb-1 flex justify-between">
                                    지점 기본 가격 할증 (원) {!isHQ && <span className="text-red-500 text-xs">본사 전용</span>}
                                </label>
                                <input className={`w-full border p-3 rounded-lg ${!isHQ ? "bg-gray-100" : ""}`} type="number" value={priceMarkup} onChange={e=>setPriceMarkup(e.target.value)} disabled={!isHQ} placeholder="예: 강남점 500" />
                            </div>

                            <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                                <label className="block text-sm font-bold text-gray-800 mb-2 flex justify-between">
                                    🗺️ 매장 운영 분류 설정 {!isHQ && <span className="text-red-500 text-xs">본사 전용</span>}
                                </label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <select 
                                        className={`w-full sm:w-1/3 border p-3 rounded-lg font-bold ${!isHQ ? "bg-gray-100" : "bg-white"}`} 
                                        value={region} onChange={e=>setRegion(e.target.value)} disabled={!isHQ}
                                    >
                                        <option value="미지정">지역 선택 안함</option>
                                        <option value="서울">서울</option>
                                        <option value="경기">경기</option>
                                        <option value="인천">인천</option>
                                        <option value="강원">강원</option>
                                        <option value="충청">충청</option>
                                        <option value="전라">전라</option>
                                        <option value="경상">경상</option>
                                        <option value="부산">부산</option>
                                        <option value="제주">제주</option>
                                    </select>
                                    <select 
                                        className={`w-full sm:w-2/3 border p-3 rounded-lg font-bold ${!isHQ ? "bg-gray-100" : "text-indigo-700 bg-indigo-50"}`} 
                                        value={isDirectManage} onChange={e=>setIsDirectManage(e.target.value === 'true')} disabled={!isHQ}
                                    >
                                        <option value={false}>🤝 가맹점 (Franchise)</option>
                                        <option value={true}>🏢 본사 직영점 (Direct)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg border border-gray-200 mt-2">
                                <label className="block text-sm font-bold text-gray-800 mb-2 flex justify-between">
                                    👑 본사 로열티 (수수료) 정책 설정 {!isHQ && <span className="text-red-500 text-xs">본사 전용</span>}
                                </label>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <select 
                                        className={`border p-3 rounded-lg flex-1 font-bold ${!isHQ ? "bg-gray-100" : "bg-white"}`}
                                        value={royaltyType} onChange={e=>setRoyaltyType(e.target.value)} disabled={!isHQ}
                                    >
                                        <option value="PERCENTAGE">매출 비례 방식 (%)</option>
                                        <option value="FIXED">고정 금액 방식 (원)</option>
                                    </select>
                                    <div className="flex-1 relative">
                                        <input 
                                            className={`w-full border p-3 rounded-lg text-right pr-8 font-bold ${!isHQ ? "bg-gray-100" : ""}`} 
                                            type="number" step={royaltyType === "PERCENTAGE" ? "0.1" : "1000"} 
                                            value={royaltyAmount} onChange={e=>setRoyaltyAmount(e.target.value)} disabled={!isHQ} 
                                            placeholder={royaltyType === "PERCENTAGE" ? "예: 3.5" : "예: 300000"} 
                                        />
                                        <span className="absolute right-3 top-3.5 text-gray-400 font-bold">{royaltyType === "PERCENTAGE" ? "%" : "원"}</span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 이름</label><input className="w-full border p-3 rounded-lg" value={name} onChange={e=>setName(e.target.value)} /></div>
                    <div><label className="block text-sm font-bold text-gray-600 mb-1">전화번호</label><input className="w-full border p-3 rounded-lg" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 주소</label><input className="w-full border p-3 rounded-lg" value={address} onChange={e=>setAddress(e.target.value)} /></div>
                    <div className="col-span-2"><label className="block text-sm font-bold text-gray-600 mb-1">가게 소개</label><textarea className="w-full border p-3 rounded-lg h-20 resize-none" value={desc} onChange={e=>setDesc(e.target.value)} /></div>
                </div>
            </div>
            
            <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-md">저장하기</button>
        </div>
    );
}

// 2. 직원 호출 옵션 관리
export function AdminCallOptionManagement({ store, token }) { 
    const [options, setOptions] = useState([]);
    const [newName, setNewName] = useState("");

    const fetchOptions = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/call-options`, { headers: { Authorization: `Bearer ${token}` } });
            setOptions(res.data);
        } catch (err) { console.error("옵션 로딩 실패"); }
    };

    useEffect(() => { fetchOptions(); }, [store.id]);

    const handleAdd = async () => {
        if (!newName) return;
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/call-options`, { name: newName }, { headers: { Authorization: `Bearer ${token}` } });
            setNewName(""); fetchOptions();
        } catch (err) { toast.error("추가 실패"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/call-options/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchOptions(); }
        catch (err) { toast.error("삭제 실패"); }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 pb-20">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">🔔 직원 호출 옵션 관리</h2>
            <div className="flex gap-2 mb-6">
                <input className="border p-3 rounded-lg flex-1 text-lg" placeholder="새로운 요청 항목 (예: 물티슈)" value={newName} onChange={e=>setNewName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAdd()} />
                <button onClick={handleAdd} className="bg-indigo-600 text-white px-6 rounded-lg font-bold hover:bg-indigo-700 shadow-md">추가하기</button>
            </div>
            <div className="space-y-3">
                {options.map(opt => (
                    <div key={opt.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="font-bold text-gray-700 text-lg">{opt.name}</span>
                        <button onClick={()=>handleDelete(opt.id)} className="text-red-500 hover:text-red-700 font-bold text-sm bg-white border border-red-100 px-3 py-1 rounded-lg">삭제</button>
                    </div>
                ))}
                {options.length === 0 && <p className="text-center text-gray-400 py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">등록된 옵션이 없습니다.</p>}
            </div>
            <div className="mt-8 p-5 bg-yellow-50 rounded-xl text-sm text-yellow-800 border border-yellow-200 flex items-start gap-3"><span className="text-xl">💡</span><div><p className="font-bold text-lg mb-1">알아두세요</p><p><b>'직원만 호출 🙋'</b> 버튼은 시스템 기본값으로 항상 표시됩니다.</p></div></div>
        </div>
    );
}

// 3. 영업 시간 관리 (휴일 로직 완벽 복구 버전)
export function AdminHours({ store, token, fetchStore }) { 
    const [hours, setHours] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [newHolidayDate, setNewHolidayDate] = useState("");
    const [newHolidayDesc, setNewHolidayDesc] = useState("");

    // 브레이크 타임 일괄 추가용 상태
    const [isAddingBreak, setIsAddingBreak] = useState(false);
    const [breakDays, setBreakDays] = useState([0, 1, 2, 3, 4, 5, 6]); 
    const [breakStart, setBreakStart] = useState("");
    const [breakEnd, setBreakEnd] = useState("");

    // 휴일 수정용 상태
    const [editingHoliday, setEditingHoliday] = useState(null);

    const days = ["월", "화", "수", "목", "금", "토", "일"];
    const todayStr = new Date().toISOString().slice(0, 10);

    useEffect(() => {
        if (store?.operating_hours?.length > 0) {
            const sorted = [...store.operating_hours].sort((a, b) => a.day_of_week - b.day_of_week);
            const fullHours = Array.from({ length: 7 }, (_, i) => {
                const exist = sorted.find(h => h.day_of_week === i);
                
                let parsedBreaks = [];
                try {
                    if (exist?.break_time_list) {
                        const parsed = JSON.parse(exist.break_time_list);
                        if (Array.isArray(parsed)) parsedBreaks = parsed;
                    }
                } catch(e) {}

                return { 
                    day_of_week: i, 
                    open_time: exist?.open_time || "09:00", 
                    close_time: exist?.close_time || "22:00", 
                    is_closed: exist?.is_closed || false,
                    break_times: parsedBreaks 
                };
            });
            setHours(fullHours);
        } else {
            setHours(Array.from({ length: 7 }, (_, i) => ({ day_of_week: i, open_time: "09:00", close_time: "22:00", is_closed: false, break_times: [] })));
        }
        setHolidays(store?.holidays || []);
    }, [store]);

    const handleHourChange = (index, field, value) => {
        const newHours = [...hours];
        newHours[index] = { ...newHours[index], [field]: value };
        setHours(newHours);
    };

    const handleRemoveBreakTime = (index, btIndex) => {
        const newHours = [...hours];
        newHours[index].break_times.splice(btIndex, 1);
        setHours(newHours);
    };

    const handleBreakTimeChange = (index, btIndex, field, value) => {
        const newHours = [...hours];
        newHours[index].break_times[btIndex][field] = value;
        setHours(newHours);
    };

    const handleApplyBulkBreak = () => {
        if (!breakStart || !breakEnd) return toast.error("시작 시간과 종료 시간을 입력해주세요.");
        if (breakStart >= breakEnd) return toast.error("종료 시간이 시작 시간보다 늦어야 합니다.");
        if (breakDays.length === 0) return toast.error("적용할 요일을 1개 이상 선택해주세요.");

        let hasOverlap = false;
        for (const d of breakDays) {
            const dayBreaks = hours[d].break_times || [];
            for (const bt of dayBreaks) {
                if (bt.start && bt.end) {
                    if (breakStart < bt.end && breakEnd > bt.start) {
                        hasOverlap = true;
                        break;
                    }
                }
            }
        }

        if (hasOverlap) {
            if (!window.confirm("⚠️ 기존에 설정된 휴게시간과 겹치는 요일이 있습니다. 그래도 추가하시겠습니까?")) return;
        }

        const newHours = [...hours];
        breakDays.forEach(d => {
            if (!newHours[d].break_times) newHours[d].break_times = [];
            newHours[d].break_times.push({ start: breakStart, end: breakEnd });
            newHours[d].break_times.sort((a, b) => a.start.localeCompare(b.start));
        });

        setHours(newHours);
        setIsAddingBreak(false);
        setBreakStart("");
        setBreakEnd("");
        toast.success("선택한 요일에 휴게시간이 추가되었습니다! 아래 '저장' 버튼을 눌러주세요.");
    };

    const toggleBreakDay = (dayIdx) => {
        if (breakDays.includes(dayIdx)) setBreakDays(breakDays.filter(d => d !== dayIdx));
        else setBreakDays([...breakDays, dayIdx]);
    };

    const handleSaveHours = async () => {
        const payload = hours.map(h => ({
            day_of_week: h.day_of_week,
            open_time: h.open_time,
            close_time: h.close_time,
            is_closed: h.is_closed,
            break_time_list: JSON.stringify((h.break_times || []).filter(bt => bt.start && bt.end)) 
        }));

        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/hours`, payload, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("영업시간 및 브레이크 타임이 저장되었습니다.");
            fetchStore();
        } catch (err) { toast.error("저장 실패"); }
    };

    const handleAddHoliday = async () => {
        if (!newHolidayDate) return toast.error("날짜를 입력해주세요.");
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/holidays`, { date: newHolidayDate, description: newHolidayDesc }, { headers: { Authorization: `Bearer ${token}` } });
            setNewHolidayDate(""); setNewHolidayDesc(""); fetchStore();
        } catch (err) { toast.error("휴일 추가 실패"); }
    };

    const handleDeleteHoliday = async (id) => {
        if (!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/holidays/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchStore(); } 
        catch (err) { toast.error("삭제 실패"); }
    };

    const handleSaveEditHoliday = async () => {
        if (!editingHoliday.date) return toast.error("날짜를 입력해주세요.");
        try {
            await axios.delete(`${API_BASE_URL}/holidays/${editingHoliday.id}`, { headers: { Authorization: `Bearer ${token}` } });
            await axios.post(`${API_BASE_URL}/stores/${store.id}/holidays`, { date: editingHoliday.date, description: editingHoliday.description }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("휴일 정보가 수정되었습니다.");
            setEditingHoliday(null);
            fetchStore();
        } catch (err) { toast.error("수정 실패"); }
    };

    const validHolidays = holidays.filter(h => h.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 animate-fadeIn h-full pb-10">
            
            {/* 영업 시간 영역 (넓게 2칸 차지) */}
            <div className="xl:col-span-2 bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-4">
                    <h3 className="font-bold text-xl text-gray-800">⏰ 요일별 영업 및 휴게 시간</h3>
                    <button onClick={() => setIsAddingBreak(!isAddingBreak)} className={`px-4 py-2 rounded-lg font-bold text-sm transition border-2 ${isAddingBreak ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-white border-gray-200 text-gray-600 hover:border-orange-300'}`}>
                        {isAddingBreak ? "닫기" : "☕ 휴게시간 일괄 추가"}
                    </button>
                </div>

                {isAddingBreak && (
                    <div className="mb-4 p-4 bg-orange-50/50 border border-orange-200 rounded-xl animate-fadeIn">
                        <p className="text-sm font-bold text-orange-800 mb-2">적용할 요일과 시간을 선택해주세요.</p>
                        <div className="flex flex-wrap gap-2 mb-3">
                            {days.map((dayName, idx) => (
                                <button key={idx} onClick={() => toggleBreakDay(idx)} className={`w-9 h-9 rounded-full font-bold text-sm transition ${breakDays.includes(idx) ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-gray-300 text-gray-500'}`}>
                                    {dayName}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <input type="time" className="border border-orange-200 rounded-lg p-2 font-bold outline-none w-32" value={breakStart} onChange={e=>setBreakStart(e.target.value)} />
                            <span className="font-bold text-gray-400">~</span>
                            <input type="time" className="border border-orange-200 rounded-lg p-2 font-bold outline-none w-32" value={breakEnd} onChange={e=>setBreakEnd(e.target.value)} />
                            <button onClick={handleApplyBulkBreak} className="bg-orange-600 text-white px-4 py-2.5 rounded-lg font-bold shadow-md hover:bg-orange-700">일괄 추가</button>
                        </div>
                    </div>
                )}

                <div className="space-y-3 flex-1">
                    {hours.map((h, idx) => (
                        <div key={idx} className={`flex flex-col gap-3 p-4 rounded-xl border-2 transition ${h.is_closed ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-indigo-100 shadow-sm"}`}>
                            {/* 메인 영업 시간 */}
                            <div className="flex flex-wrap items-center gap-2 w-full">
                                <span className={`w-6 font-black text-center text-lg shrink-0 ${h.day_of_week >= 5 ? "text-red-500" : "text-gray-700"}`}>{days[h.day_of_week]}</span>
                                <input type="time" className="border-2 border-gray-200 rounded-lg p-1.5 font-bold focus:border-indigo-500 outline-none w-28 text-sm" value={h.open_time} onChange={e=>handleHourChange(idx, "open_time", e.target.value)} disabled={h.is_closed}/>
                                <span className="font-bold text-gray-400 shrink-0">~</span>
                                <input type="time" className="border-2 border-gray-200 rounded-lg p-1.5 font-bold focus:border-indigo-500 outline-none w-28 text-sm" value={h.close_time} onChange={e=>handleHourChange(idx, "close_time", e.target.value)} disabled={h.is_closed}/>
                                <label className="flex items-center gap-1.5 sm:ml-auto text-sm cursor-pointer font-bold text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition shrink-0">
                                    <input type="checkbox" className="w-4 h-4 shrink-0" checked={h.is_closed} onChange={e=>handleHourChange(idx, "is_closed", e.target.checked)}/> <span>휴무</span>
                                </label>
                            </div>
                            
                            {/* 휴게시간 */}
                            <div className="flex flex-wrap gap-2 sm:pl-8">
                                {(h.break_times || []).map((bt, btIndex) => (
                                    <div key={btIndex} className="flex items-center gap-1.5 text-sm bg-orange-50/50 p-1.5 rounded-lg border border-orange-100 shrink-0">
                                        <span className="font-extrabold text-orange-600 px-1 text-xs shrink-0">☕ Break</span>
                                        <input type="time" className="border border-gray-200 rounded bg-white p-1.5 text-xs font-bold text-gray-700 outline-none w-24 shrink-0" value={bt.start || ""} onChange={e=>handleBreakTimeChange(idx, btIndex, "start", e.target.value)} disabled={h.is_closed}/>
                                        <span className="text-gray-400 shrink-0">-</span>
                                        <input type="time" className="border border-gray-200 rounded bg-white p-1.5 text-xs font-bold text-gray-700 outline-none w-24 shrink-0" value={bt.end || ""} onChange={e=>handleBreakTimeChange(idx, btIndex, "end", e.target.value)} disabled={h.is_closed}/>
                                        <button onClick={() => handleRemoveBreakTime(idx, btIndex)} className="text-red-400 hover:text-red-600 px-2 font-bold text-lg leading-none shrink-0">×</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <button onClick={handleSaveHours} className="mt-6 w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold text-lg hover:bg-black shadow-md transition shrink-0">시간표 저장 💾</button>
            </div>

            {/* 휴일 설정 영역 (1칸 차지) */}
            <div className="xl:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-gray-200 h-fit flex flex-col">
                <h3 className="font-bold text-xl mb-4 text-gray-800 shrink-0">📅 예정된 휴일</h3>
                <div className="mb-4 bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-2 shrink-0">
                    <div className="flex gap-2 w-full">
                        <input type="date" className="border border-gray-300 p-2 rounded-lg font-bold flex-1 min-w-0" value={newHolidayDate} onChange={e=>setNewHolidayDate(e.target.value)} />
                        <button onClick={handleAddHoliday} className="bg-indigo-600 text-white px-4 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm whitespace-nowrap shrink-0">추가</button>
                    </div>
                    <input type="text" className="border border-gray-300 p-2 rounded-lg w-full font-bold text-sm min-w-0" placeholder="휴무 사유 (예: 추석 연휴)" value={newHolidayDesc} onChange={e=>setNewHolidayDesc(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleAddHoliday()} />
                </div>
                <ul className="space-y-3 overflow-y-auto max-h-[300px] xl:max-h-[400px] pr-1">
                    
                    {/* ✨ 날아갔던 휴일 리스트 렌더링 코드가 완벽히 복구되었습니다! */}
                    {validHolidays.map(h => (
                        <li key={h.id} className="p-4 bg-white rounded-xl border-2 border-gray-100 hover:border-indigo-200 transition group relative">
                            {editingHoliday && editingHoliday.id === h.id ? (
                                <div className="flex flex-col gap-2">
                                    <input type="date" className="border border-indigo-300 p-1.5 rounded font-bold text-sm" value={editingHoliday.date} onChange={e=>setEditingHoliday({...editingHoliday, date: e.target.value})} />
                                    <input type="text" className="border border-indigo-300 p-1.5 rounded font-bold text-sm" value={editingHoliday.description} onChange={e=>setEditingHoliday({...editingHoliday, description: e.target.value})} />
                                    <div className="flex gap-2 mt-1">
                                        <button onClick={handleSaveEditHoliday} className="flex-1 bg-indigo-500 text-white text-xs font-bold py-1.5 rounded">저장</button>
                                        <button onClick={()=>setEditingHoliday(null)} className="flex-1 bg-gray-200 text-gray-700 text-xs font-bold py-1.5 rounded">취소</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col pr-8">
                                        <span className={`font-black text-lg ${h.date === todayStr ? "text-red-600" : "text-gray-800"}`}>
                                            {h.date} {h.date === todayStr && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded align-middle ml-1">오늘</span>}
                                        </span>
                                        <span className="text-gray-500 text-sm font-bold">{h.description || "사유 없음"}</span>
                                    </div>
                                    <div className="absolute top-4 right-3 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={()=>setEditingHoliday({id: h.id, date: h.date, description: h.description})} className="text-indigo-500 hover:bg-indigo-50 px-2 py-1 rounded text-xs font-bold">수정</button>
                                        <button onClick={()=>handleDeleteHoliday(h.id)} className="text-red-500 hover:bg-red-50 px-2 py-1 rounded text-xs font-bold">삭제</button>
                                    </div>
                                </>
                            )}
                        </li>
                    ))}
                    {validHolidays.length === 0 && <li className="text-gray-400 font-bold text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-sm">예정된 임시 휴일이 없습니다.</li>}
                    
                </ul>
            </div>
        </div>
    );
}

// 4. 테이블 및 QR 관리
export function AdminTables({ store, token, fetchStore }) {
    const [newTableName, setNewTableName] = useState("");
    const [newCounterName, setNewCounterName] = useState("");
    const [editingTableId, setEditingTableId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [zoomQrTable, setZoomQrTable] = useState(null);

    const dineInTables = store.tables?.filter(t => t.table_type !== "TAKEOUT_COUNTER") ?? [];
    const takeoutCounters = store.tables?.filter(t => t.table_type === "TAKEOUT_COUNTER") ?? [];

    const handleCreateTable = async (tableType) => {
        const name = tableType === "TAKEOUT_COUNTER" ? newCounterName : newTableName;
        if (!name) return;
        try {
            await axios.post(
                `${API_BASE_URL}/stores/${store.id}/tables/`,
                { name, table_type: tableType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (tableType === "TAKEOUT_COUNTER") setNewCounterName("");
            else setNewTableName("");
            fetchStore();
        } catch (err) { toast.error("생성 실패"); }
    };

    const handleDeleteTable = async (id) => {
        if (!window.confirm("정말 삭제하시겠습니까? QR코드도 무효화됩니다.")) return;
        try { await axios.delete(`${API_BASE_URL}/tables/${id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchStore(); }
        catch (err) { toast.error("삭제 실패"); }
    };

    const startEdit = (table) => { setEditingTableId(table.id); setEditingName(table.name); };

    const saveEdit = async (tableId) => {
        try {
            await axios.patch(`${API_BASE_URL}/tables/${tableId}`, { name: editingName }, { headers: { Authorization: `Bearer ${token}` } });
            setEditingTableId(null); fetchStore();
        } catch (err) { toast.error("수정 실패"); }
    };

    const getQrImageUrl = (qrToken, size = 150) => {
        const targetUrl = `${window.location.protocol}//${window.location.host}/order/${qrToken}`;
        return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(targetUrl)}`;
    };

    const handleDownloadQR = async (table) => {
        const imageUrl = getQrImageUrl(table.qr_token, 500);
        const dateStr = new Date().toISOString().slice(0, 10);
        const fileName = `${dateStr}_${store.name}_${table.name}.png`;
        try {
            const response = await fetch(imageUrl);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) { console.error(err); toast.error("다운로드 중 오류가 발생했습니다."); }
    };

    const TableCard = ({ table, isCounter }) => (
        <div key={table.id} className={`border-2 rounded-xl p-4 flex flex-col items-center transition shadow-sm ${
            isCounter
                ? "border-orange-200 hover:border-orange-400 bg-orange-50"
                : "border-gray-200 hover:border-indigo-300 bg-white"
        }`}>
            <div className="w-24 h-24 bg-white mb-3 cursor-zoom-in overflow-hidden rounded-lg border" onClick={() => setZoomQrTable(table)}>
                <img src={getQrImageUrl(table.qr_token)} alt="QR Code" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
            </div>
            {editingTableId === table.id ? (
                <div className="flex gap-1 w-full mb-2">
                    <input className="border p-1 text-xs w-full rounded text-center" value={editingName} onChange={e => setEditingName(e.target.value)} autoFocus />
                    <button onClick={() => saveEdit(table.id)} className="bg-blue-500 text-white px-1 rounded text-xs">V</button>
                    <button onClick={() => setEditingTableId(null)} className="bg-gray-300 text-gray-700 px-1 rounded text-xs">X</button>
                </div>
            ) : (
                <h3 className={`font-bold text-lg mb-1 flex items-center gap-1 cursor-pointer ${isCounter ? "hover:text-orange-600" : "hover:text-indigo-600"}`} onClick={() => startEdit(table)}>
                    {table.name} <span className="text-xs text-gray-400">✏️</span>
                </h3>
            )}
            {isCounter && <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full mb-2">포장 전용 · 선결제</span>}
            <div className="flex justify-between w-full mt-auto pt-2 border-t gap-2">
                <button onClick={() => handleDeleteTable(table.id)} className="text-red-400 text-xs hover:text-red-600 hover:underline">삭제</button>
                <button onClick={() => setZoomQrTable(table)} className={`text-xs font-bold ${isCounter ? "text-orange-500 hover:text-orange-700" : "text-indigo-500 hover:text-indigo-700"}`}>QR 확대</button>
            </div>
        </div>
    );

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 pb-20 space-y-10">
            {/* 홀 테이블 섹션 */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">🪑 홀 테이블</h2>
                        <p className="text-xs text-gray-400 mt-0.5">각 테이블에 QR을 붙여두면 손님이 스캔해서 주문합니다.</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            className="border p-2 rounded w-36 text-sm"
                            placeholder="테이블명 (예: 1번)"
                            value={newTableName}
                            onChange={e => setNewTableName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreateTable("DINE_IN")}
                        />
                        <button onClick={() => handleCreateTable("DINE_IN")} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 text-sm">추가</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {dineInTables.map(table => <TableCard key={table.id} table={table} isCounter={false} />)}
                    {dineInTables.length === 0 && <div className="col-span-full text-center py-8 text-gray-400 text-sm">등록된 홀 테이블이 없습니다.</div>}
                </div>
            </div>

            <hr className="border-gray-100" />

            {/* 포장 카운터 QR 섹션 */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">📦 포장 카운터 QR</h2>
                        <p className="text-xs text-gray-400 mt-0.5">카운터나 입구에 고정 부착합니다. 여러 명이 동시에 스캔해도 각자 독립 주문됩니다.</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            className="border p-2 rounded w-36 text-sm"
                            placeholder="이름 (예: 포장 카운터)"
                            value={newCounterName}
                            onChange={e => setNewCounterName(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && handleCreateTable("TAKEOUT_COUNTER")}
                        />
                        <button onClick={() => handleCreateTable("TAKEOUT_COUNTER")} className="bg-orange-500 text-white px-4 py-2 rounded font-bold hover:bg-orange-600 text-sm">추가</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {takeoutCounters.map(table => <TableCard key={table.id} table={table} isCounter={true} />)}
                    {takeoutCounters.length === 0 && <div className="col-span-full text-center py-8 text-gray-400 text-sm">등록된 포장 카운터 QR이 없습니다.</div>}
                </div>
                {takeoutCounters.length > 0 && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-700">
                        포장 카운터 QR은 항상 선결제 전용입니다. QR을 인쇄해서 카운터에 부착하세요.
                    </div>
                )}
            </div>

            {zoomQrTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setZoomQrTable(null)}>
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-2xl font-extrabold text-gray-800">{zoomQrTable.name}</h3>
                            {zoomQrTable.table_type === "TAKEOUT_COUNTER" && (
                                <span className="text-xs font-bold text-orange-500 bg-orange-100 px-2 py-0.5 rounded-full">포장 전용</span>
                            )}
                        </div>
                        <p className="text-gray-500 mb-6 text-sm">QR코드를 스캔하여 주문하세요</p>
                        <div className={`p-4 border-4 rounded-xl mb-6 bg-white ${zoomQrTable.table_type === "TAKEOUT_COUNTER" ? "border-orange-400" : "border-black"}`}>
                            <img src={getQrImageUrl(zoomQrTable.qr_token, 300)} alt="Large QR" className="w-64 h-64" />
                        </div>
                        <div className="flex gap-3 w-full">
                            <button
                                onClick={() => handleDownloadQR(zoomQrTable)}
                                className={`flex-1 text-white py-3 rounded-xl font-bold shadow-md flex items-center justify-center gap-2 ${zoomQrTable.table_type === "TAKEOUT_COUNTER" ? "bg-orange-500 hover:bg-orange-600" : "bg-indigo-600 hover:bg-indigo-700"}`}
                            >
                                📥 QR 저장
                            </button>
                            <button onClick={() => setZoomQrTable(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300">닫기</button>
                        </div>
                        <p className="mt-4 text-xs text-gray-400 text-center">파일명: {new Date().toISOString().slice(0, 10)}_{store.name}_{zoomQrTable.name}.png</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// 5. 상세 매출 리포트 관리 (일별/월별/시간대별/메뉴별/객단가 분석)
export function AdminSales({ store, token }) {
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() - 6);
        return d.toISOString().slice(0, 10);
    });
    const [endDate, setEndDate] = useState(today);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("daily");
    const [drillModal, setDrillModal] = useState({ isOpen: false, title: "", orders: [], loading: false });
    const closingHour = store?.closing_hour || 0;

    const setRange = (type) => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        if (type === "today") {
            setStartDate(todayStr); setEndDate(todayStr);
        } else if (type === "yesterday") {
            const d = new Date(now); d.setDate(d.getDate() - 1);
            const s = d.toISOString().slice(0, 10);
            setStartDate(s); setEndDate(s);
        } else if (type === "week") {
            const d = new Date(now); d.setDate(d.getDate() - 6);
            setStartDate(d.toISOString().slice(0, 10)); setEndDate(todayStr);
        } else if (type === "month") {
            setStartDate(`${todayStr.slice(0, 7)}-01`); setEndDate(todayStr);
        }
    };

    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/stores/${store.id}/stats?start_date=${startDate}&end_date=${endDate}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStats(res.data);
        } catch { toast.error("매출 데이터를 불러오는데 실패했습니다."); }
        finally { setLoading(false); }
    };

    const openDayDrill = async (date) => {
        setDrillModal({ isOpen: true, title: `${date} 주문 내역`, orders: [], loading: true });
        try {
            const res = await axios.get(
                `${API_BASE_URL}/stores/${store.id}/orders/by-date?date=${date}&closing_hour=${closingHour}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDrillModal(prev => ({ ...prev, orders: res.data, loading: false }));
        } catch { toast.error("주문 내역을 불러오는데 실패했습니다."); setDrillModal(prev => ({ ...prev, loading: false })); }
    };

    const openStatusDrill = async (status, title) => {
        setDrillModal({ isOpen: true, title, orders: [], loading: true });
        try {
            const res = await axios.get(
                `${API_BASE_URL}/stores/${store.id}/orders/period?start_date=${startDate}&end_date=${endDate}&status=${status}&closing_hour=${closingHour}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDrillModal(prev => ({ ...prev, orders: res.data, loading: false }));
        } catch { toast.error("주문 내역을 불러오는데 실패했습니다."); setDrillModal(prev => ({ ...prev, loading: false })); }
    };

    useEffect(() => { fetchStats(); }, [startDate, endDate]);

    const exportCSV = () => {
        if (!stats) return;
        const sections = [
            [`=== 요약 ===`, `총매출,주문건수,객단가,직전기간매출,직전기간객단가`],
            ["", `${stats.total_revenue},${stats.order_count},${stats.average_order_value},${stats.prev_period_revenue},${stats.prev_avg_order_value || 0}`],
            [""],
            ["=== 일별 매출 ===", "날짜,주문건수,객단가,매출액"],
            ...stats.daily_stats.map(d => ["", `${d.date},${d.count},${d.avg_order_value || 0},${d.sales}`]),
            [""],
            ["=== 월별 매출 ===", "월,주문건수,객단가,매출액"],
            ...stats.monthly_stats.map(m => ["", `${m.month},${m.count},${m.avg_order_value || 0},${m.sales}`]),
            [""],
            ["=== 요일별 매출 ===", "요일,주문건수,객단가,매출액"],
            ...(stats.weekday_stats || []).map(w => ["", `${w.weekday},${w.count},${w.avg_order_value || 0},${w.sales}`]),
            [""],
            ["=== 시간대별 매출 ===", "시간,주문건수,객단가,매출액"],
            ...stats.hourly_stats.map(h => ["", `${h.hour}시,${h.count},${h.avg_order_value || 0},${h.sales}`]),
            [""],
            ["=== 카테고리별 매출 ===", "카테고리,판매수량,매출액"],
            ...(stats.category_stats || []).map(c => ["", `${c.name},${c.count},${c.revenue}`]),
            [""],
            ["=== 메뉴별 매출 ===", "메뉴명,판매수량,매출액"],
            ...stats.menu_stats.map(m => ["", `${m.name},${m.count},${m.revenue}`]),
            [""],
            ["=== 결제수단별 ===", "수단,건수,객단가,매출액"],
            ...(stats.payment_method_stats || []).map(p => ["", `${p.method},${p.count},${p.avg_order_value || 0},${p.revenue}`]),
            [""],
            ["=== 주문유형별 ===", "유형,건수,객단가,매출액"],
            ...(stats.order_type_stats || []).map(o => ["", `${o.type},${o.count},${o.avg_order_value || 0},${o.revenue}`]),
        ];
        const csv = sections.flat().join("\n");
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url; a.download = `매출리포트_${startDate}_${endDate}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    const PAYMENT_METHOD_LABEL = { card: "카드", CARD: "카드", cash: "현금", CASH: "현금", 후불: "후불", 기타: "기타" };
    const ORDER_TYPE_LABEL = { DINE_IN: "홀", TAKEOUT: "포장" };
    const WEEKDAY_COLOR = ["bg-indigo-500", "bg-indigo-500", "bg-indigo-500", "bg-indigo-500", "bg-indigo-500", "bg-rose-500", "bg-rose-500"];

    const GrowthBadge = ({ rate }) => {
        if (rate === null || rate === undefined) return null;
        const isUp = rate >= 0;
        return (
            <span className={`inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full ml-2 ${isUp ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {isUp ? "▲" : "▼"} {Math.abs(rate)}%
            </span>
        );
    };

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* 1. 검색 바 */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                    <h2 className="text-xl font-bold text-gray-800">매출 리포트</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {[["today","오늘"],["yesterday","어제"],["week","최근 7일"],["month","이번달"]].map(([k,l]) => (
                            <button key={k} onClick={() => setRange(k)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition">{l}</button>
                        ))}
                        <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-xl">
                            <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white px-2 py-1 rounded-lg font-bold text-gray-700 outline-none border border-gray-200 text-sm" />
                            <span className="text-gray-400 font-bold">~</span>
                            <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white px-2 py-1 rounded-lg font-bold text-gray-700 outline-none border border-gray-200 text-sm" />
                            <button onClick={fetchStats} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold ml-1 hover:bg-black transition shadow-sm">조회</button>
                        </div>
                        {stats && (
                            <button onClick={exportCSV} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 transition">CSV 전체 저장</button>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <span className="text-4xl mb-4 animate-spin inline-block">⏳</span>
                    <p className="font-bold">데이터를 집계하고 있습니다...</p>
                </div>
            ) : stats ? (
                <>
                    {/* 2. 핵심 지표 요약 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 총 매출 */}
                        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
                            <p className="text-indigo-200 font-bold mb-1 text-xs">총 매출액 (결제완료)</p>
                            <p className="text-3xl font-black">{stats.total_revenue.toLocaleString()}원</p>
                            <div className="mt-2 flex items-center">
                                <span className="text-indigo-300 text-xs">직전 동기 {(stats.prev_period_revenue || 0).toLocaleString()}원</span>
                                <GrowthBadge rate={stats.growth_rate} />
                            </div>
                            <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-10">💵</span>
                        </div>

                        {/* 주문건수 */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                            <p className="text-gray-500 font-bold mb-1 text-xs">총 주문건수</p>
                            <p className="text-3xl font-black text-gray-800">{stats.order_count}건</p>
                            <div className="mt-2 flex items-center">
                                <span className="text-gray-400 text-xs">직전 동기 {stats.prev_period_count || 0}건</span>
                                <GrowthBadge rate={stats.count_growth_rate} />
                            </div>
                            <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-[0.03]">🧾</span>
                        </div>

                        {/* 객단가 */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                            <p className="text-gray-500 font-bold mb-1 text-xs flex items-center gap-1">
                                객단가
                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-md">중요</span>
                            </p>
                            <p className="text-3xl font-black text-purple-600">{stats.average_order_value.toLocaleString()}원</p>
                            <div className="mt-2 flex items-center">
                                <span className="text-gray-400 text-xs">직전 동기 {(stats.prev_avg_order_value || 0).toLocaleString()}원</span>
                                <GrowthBadge rate={stats.aov_growth_rate} />
                            </div>
                            <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-[0.03]">👥</span>
                        </div>

                        {/* 취소/환불 또는 후불 미수금 */}
                        {(stats.cancelled_count > 0 || stats.deferred_revenue > 0) ? (
                            <div
                                className="bg-rose-50 border border-rose-200 p-6 rounded-2xl relative overflow-hidden cursor-pointer hover:shadow-md transition"
                                onClick={() => {
                                    if (stats.cancelled_count > 0) openStatusDrill("CANCELLED", `취소 주문 내역 (${startDate} ~ ${endDate})`);
                                    else openStatusDrill("DEFERRED", `후불 미수금 내역 (${startDate} ~ ${endDate})`);
                                }}
                            >
                                {stats.cancelled_count > 0 ? (
                                    <>
                                        <p className="text-rose-700 font-bold mb-1 text-xs">취소 · 환불 <span className="ml-1 text-rose-400">(클릭하여 상세보기)</span></p>
                                        <p className="text-2xl font-black text-rose-600">-{stats.refund_amount.toLocaleString()}원</p>
                                        <p className="text-rose-400 text-xs mt-2">총 {stats.cancelled_count}건 취소됨</p>
                                    </>
                                ) : (
                                    <>
                                        <p className="text-amber-700 font-bold mb-1 text-xs">후불 미수금 <span className="ml-1 text-amber-400">(클릭하여 상세보기)</span></p>
                                        <p className="text-2xl font-black text-amber-600">{stats.deferred_revenue.toLocaleString()}원</p>
                                        <p className="text-amber-400 text-xs mt-2">미결제 후불 주문</p>
                                    </>
                                )}
                                <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-[0.06]">⚠️</span>
                            </div>
                        ) : (
                            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl relative overflow-hidden">
                                <p className="text-emerald-700 font-bold mb-1 text-xs">취소 · 환불</p>
                                <p className="text-2xl font-black text-emerald-600">0건</p>
                                <p className="text-emerald-400 text-xs mt-2">이 기간 취소 없음</p>
                                <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-[0.06]">✅</span>
                            </div>
                        )}
                    </div>

                    {/* 3. 결제수단 & 주문유형 분석 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-4 text-sm">결제 수단별</h3>
                            <div className="space-y-3">
                                {(stats.payment_method_stats || []).map((p, i) => {
                                    const total = stats.payment_method_stats.reduce((a, b) => a + b.count, 0) || 1;
                                    const pct = Math.round((p.count / total) * 100);
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold text-gray-700">{PAYMENT_METHOD_LABEL[p.method] || p.method}</span>
                                                <span className="text-gray-500 text-right">
                                                    {p.count}건 · {p.revenue.toLocaleString()}원
                                                    {p.avg_order_value > 0 && <span className="ml-1 text-purple-500 font-bold">객단가 {p.avg_order_value.toLocaleString()}원</span>}
                                                    <span className="ml-1 text-indigo-500 font-bold">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!stats.payment_method_stats || stats.payment_method_stats.length === 0) && <p className="text-gray-400 text-sm text-center py-4">데이터 없음</p>}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-4 text-sm">주문 유형별 (홀 / 포장)</h3>
                            <div className="space-y-3">
                                {(stats.order_type_stats || []).map((o, i) => {
                                    const total = stats.order_type_stats.reduce((a, b) => a + b.count, 0) || 1;
                                    const pct = Math.round((o.count / total) * 100);
                                    return (
                                        <div key={i}>
                                            <div className="flex justify-between text-sm mb-1">
                                                <span className="font-bold text-gray-700">{ORDER_TYPE_LABEL[o.type] || o.type}</span>
                                                <span className="text-gray-500 text-right">
                                                    {o.count}건 · {o.revenue.toLocaleString()}원
                                                    {o.avg_order_value > 0 && <span className="ml-1 text-purple-500 font-bold">객단가 {o.avg_order_value.toLocaleString()}원</span>}
                                                    <span className="ml-1 text-teal-500 font-bold">({pct}%)</span>
                                                </span>
                                            </div>
                                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-teal-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {(!stats.order_type_stats || stats.order_type_stats.length === 0) && <p className="text-gray-400 text-sm text-center py-4">데이터 없음</p>}
                            </div>
                        </div>
                    </div>

                    {/* 3-b. 할인 효과 (original_price 데이터가 있는 경우만) */}
                    {stats.discount_gap !== null && stats.discount_gap !== undefined && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                            <h3 className="font-bold text-gray-700 mb-4 text-sm">할인 효과 분석</h3>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-gray-50 rounded-xl p-4">
                                    <p className="text-xs text-gray-400 font-bold mb-1">정가 합계</p>
                                    <p className="text-lg font-black text-gray-700">{(stats.discount_original || 0).toLocaleString()}원</p>
                                </div>
                                <div className="bg-indigo-50 rounded-xl p-4">
                                    <p className="text-xs text-indigo-400 font-bold mb-1">실결제 합계</p>
                                    <p className="text-lg font-black text-indigo-700">{(stats.discount_actual || 0).toLocaleString()}원</p>
                                </div>
                                <div className="bg-rose-50 rounded-xl p-4">
                                    <p className="text-xs text-rose-400 font-bold mb-1">할인 포기 금액</p>
                                    <p className="text-lg font-black text-rose-600">-{(stats.discount_gap || 0).toLocaleString()}원</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">※ 업데이트 이후 생성된 주문부터 집계됩니다.</p>
                        </div>
                    )}

                    {/* 3-c. 정산서 인쇄 버튼 */}
                    <div className="flex justify-end">
                        <button
                            onClick={() => window.print()}
                            className="px-5 py-2.5 text-sm font-bold rounded-xl bg-slate-700 text-white hover:bg-slate-900 transition shadow-sm"
                        >
                            정산서 인쇄
                        </button>
                    </div>

                    {/* 4. 상세 분석 탭 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
                            {[
                                ["daily",    "📅 일별"],
                                ["monthly",  "🗓️ 월별"],
                                ["weekday",  "📊 요일별"],
                                ["hourly",   "⏰ 시간대별"],
                                ["category", "🗂️ 카테고리별"],
                                ["menu",    "🍔 메뉴별"],
                            ].map(([k, l]) => (
                                <button key={k} onClick={() => setActiveTab(k)}
                                    className={`flex-1 py-4 font-bold text-sm transition whitespace-nowrap px-4 ${activeTab === k ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}>
                                    {l}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 min-h-[400px]">
                            {/* 일별 */}
                            {activeTab === "daily" && (
                                <div className="animate-fadeIn">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 text-gray-500 text-sm">
                                                <th className="pb-3 font-bold">날짜</th>
                                                <th className="pb-3 font-bold text-right">결제 건수</th>
                                                <th className="pb-3 font-bold text-right text-purple-600">객단가</th>
                                                <th className="pb-3 font-bold text-right">매출액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.daily_stats.map((d, i) => (
                                                <tr key={i} onClick={() => openDayDrill(d.date)} className="border-b border-gray-100 hover:bg-indigo-50 cursor-pointer transition">
                                                    <td className="py-3 font-bold text-indigo-700 underline underline-offset-2">{d.date}</td>
                                                    <td className="py-3 text-right text-gray-600 font-medium">{d.count}건</td>
                                                    <td className="py-3 text-right font-bold text-purple-600">{(d.avg_order_value || 0).toLocaleString()}원</td>
                                                    <td className="py-3 text-right font-black text-indigo-600">{d.sales.toLocaleString()}원</td>
                                                </tr>
                                            ))}
                                            {stats.daily_stats.length === 0 && <tr><td colSpan="4" className="text-center py-10 text-gray-400 font-bold">해당 기간의 매출이 없습니다.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 월별 */}
                            {activeTab === "monthly" && (
                                <div className="animate-fadeIn">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 text-gray-500 text-sm">
                                                <th className="pb-3 font-bold">월</th>
                                                <th className="pb-3 font-bold text-right">결제 건수</th>
                                                <th className="pb-3 font-bold text-right text-purple-600">객단가</th>
                                                <th className="pb-3 font-bold text-right">매출액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.monthly_stats.map((m, i) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-indigo-50/30 transition">
                                                    <td className="py-3 font-bold text-gray-800">{m.month}</td>
                                                    <td className="py-3 text-right text-gray-600 font-medium">{m.count}건</td>
                                                    <td className="py-3 text-right font-bold text-purple-600">{(m.avg_order_value || 0).toLocaleString()}원</td>
                                                    <td className="py-3 text-right font-black text-indigo-600">{m.sales.toLocaleString()}원</td>
                                                </tr>
                                            ))}
                                            {stats.monthly_stats.length === 0 && <tr><td colSpan="4" className="text-center py-10 text-gray-400 font-bold">해당 기간의 매출이 없습니다.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* 요일별 */}
                            {activeTab === "weekday" && (
                                <div className="animate-fadeIn">
                                    <p className="text-xs text-gray-400 font-bold mb-4 text-right">※ 요일별 인력 배치 및 이벤트 기획에 활용하세요</p>
                                    <div className="space-y-3">
                                        {(stats.weekday_stats || []).map((w, idx) => {
                                            const maxSales = Math.max(...(stats.weekday_stats || []).map(x => x.sales)) || 1;
                                            const maxAov = Math.max(...(stats.weekday_stats || []).map(x => x.avg_order_value || 0)) || 1;
                                            const pct = (w.sales / maxSales) * 100;
                                            const isTop = pct === 100;
                                            const isHighAov = w.avg_order_value > 0 && (w.avg_order_value / maxAov) >= 0.9;
                                            return (
                                                <div key={idx} className="flex items-center gap-3 text-sm">
                                                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm shadow-sm shrink-0 ${WEEKDAY_COLOR[idx] || "bg-indigo-400"}`}>
                                                        {w.weekday}
                                                    </span>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <span className="font-bold text-gray-600 text-xs flex items-center gap-2">
                                                                {w.count}건
                                                                {w.avg_order_value > 0 && (
                                                                    <span className={`text-xs font-bold ${isHighAov ? "text-purple-600" : "text-gray-400"}`}>
                                                                        객단가 {w.avg_order_value.toLocaleString()}원
                                                                        {isHighAov && " 👑"}
                                                                    </span>
                                                                )}
                                                            </span>
                                                            <span className={`font-black text-sm ${isTop ? "text-indigo-700" : "text-gray-700"}`}>
                                                                {w.sales.toLocaleString()}원
                                                                {isTop && <span className="ml-1 text-xs text-yellow-500">★ 최고</span>}
                                                            </span>
                                                        </div>
                                                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                                                            <div className={`h-full rounded-full transition-all duration-700 ${WEEKDAY_COLOR[idx] || "bg-indigo-400"}`} style={{ width: `${pct}%` }}></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 시간대별 */}
                            {activeTab === "hourly" && (
                                <div className="animate-fadeIn">
                                    <p className="text-xs text-gray-400 font-bold mb-4 text-right">※ 빨간색 = 피크타임 (최고 대비 80% 이상)</p>
                                    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                                        {stats.hourly_stats.map((h, idx) => {
                                            const maxSales = Math.max(...stats.hourly_stats.map(s => s.sales)) || 1;
                                            const percent = (h.sales / maxSales) * 100;
                                            const isPeak = percent > 80 && h.sales > 0;
                                            return (
                                                <div key={idx} className="flex items-center gap-3 text-sm group">
                                                    <span className="w-10 text-right font-bold text-gray-400 text-xs shrink-0">{h.hour}시</span>
                                                    <div className="flex-1 h-5 bg-gray-100 rounded-md overflow-hidden">
                                                        <div className={`h-full transition-all duration-700 ease-out rounded-md ${isPeak ? "bg-rose-400" : "bg-indigo-400"}`} style={{ width: `${percent}%` }}></div>
                                                    </div>
                                                    <span className={`w-56 text-right font-bold text-xs shrink-0 ${isPeak ? "text-rose-600" : "text-gray-600"}`}>
                                                        {h.sales > 0
                                                            ? <>{h.count}건 · {h.sales.toLocaleString()}원 <span className="text-purple-500">({(h.avg_order_value || 0).toLocaleString()}원)</span></>
                                                            : "-"}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 메뉴별 */}
                            {activeTab === "menu" && (
                                <div className="animate-fadeIn">
                                    <p className="text-xs text-gray-400 font-bold mb-4 text-right">※ 매출액 기준 내림차순</p>
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                        {stats.menu_stats.map((m, idx) => {
                                            const maxRev = stats.menu_stats[0]?.revenue || 1;
                                            const pct = (m.revenue / maxRev) * 100;
                                            return (
                                                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm shrink-0 ${idx === 0 ? "bg-yellow-400 text-white" : idx === 1 ? "bg-gray-300 text-white" : idx === 2 ? "bg-orange-300 text-white" : "bg-white text-gray-400 border"}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline mb-1.5">
                                                            <p className="font-bold text-gray-800 truncate">{m.name}</p>
                                                            <span className="font-black text-indigo-700 shrink-0 ml-2">{m.revenue.toLocaleString()}원</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-indigo-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-400 shrink-0">{m.count}개</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {stats.menu_stats.length === 0 && <p className="text-center text-gray-400 py-10 font-bold">결제된 메뉴가 없습니다.</p>}
                                    </div>
                                </div>
                            )}

                            {/* 카테고리별 */}
                            {activeTab === "category" && (
                                <div className="animate-fadeIn">
                                    <p className="text-xs text-gray-400 font-bold mb-4 text-right">※ 매출액 기준 내림차순</p>
                                    <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                        {(stats.category_stats || []).map((c, idx) => {
                                            const maxRev = stats.category_stats[0]?.revenue || 1;
                                            const pct = (c.revenue / maxRev) * 100;
                                            return (
                                                <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                                                    <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm shrink-0 ${idx === 0 ? "bg-yellow-400 text-white" : idx === 1 ? "bg-gray-300 text-white" : idx === 2 ? "bg-orange-300 text-white" : "bg-white text-gray-400 border"}`}>
                                                        {idx + 1}
                                                    </span>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-baseline mb-1.5">
                                                            <p className="font-bold text-gray-800 truncate">{c.name}</p>
                                                            <span className="font-black text-indigo-700 shrink-0 ml-2">{c.revenue.toLocaleString()}원</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-teal-400 rounded-full transition-all duration-700" style={{ width: `${pct}%` }}></div>
                                                            </div>
                                                            <span className="text-xs text-gray-400 shrink-0">{c.count}개</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {(!stats.category_stats || stats.category_stats.length === 0) && <p className="text-center text-gray-400 py-10 font-bold">데이터 없음</p>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 드릴다운 모달 */}
                    {drillModal.isOpen && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDrillModal(prev => ({ ...prev, isOpen: false }))}>
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-between items-center p-6 border-b">
                                    <h3 className="font-black text-gray-800 text-lg">{drillModal.title}</h3>
                                    <button onClick={() => setDrillModal(prev => ({ ...prev, isOpen: false }))} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none">×</button>
                                </div>
                                <div className="overflow-y-auto flex-1 p-4">
                                    {drillModal.loading ? (
                                        <div className="flex items-center justify-center py-12 text-gray-400 font-bold">불러오는 중...</div>
                                    ) : drillModal.orders.length === 0 ? (
                                        <div className="flex items-center justify-center py-12 text-gray-400 font-bold">주문 내역이 없습니다.</div>
                                    ) : (
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b-2 border-gray-200 text-gray-500 text-xs">
                                                    <th className="pb-2 font-bold text-left">시간</th>
                                                    <th className="pb-2 font-bold text-left">테이블</th>
                                                    <th className="pb-2 font-bold text-left">메뉴</th>
                                                    <th className="pb-2 font-bold text-right">금액</th>
                                                    <th className="pb-2 font-bold text-right">상태</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {drillModal.orders.map((o, i) => {
                                                    const statusLabel = { PAID: "완료", DEFERRED: "후불", CANCELLED: "취소", PARTIAL_CANCELLED: "부분취소" }[o.payment_status] || o.payment_status;
                                                    const statusColor = { PAID: "text-emerald-600", DEFERRED: "text-amber-600", CANCELLED: "text-rose-600", PARTIAL_CANCELLED: "text-orange-500" }[o.payment_status] || "text-gray-500";
                                                    const menuSummary = o.items.filter(it => !it.is_cancelled).map(it => `${it.menu_name}×${it.quantity}`).join(", ");
                                                    const timeStr = new Date(o.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
                                                    return (
                                                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                                            <td className="py-2.5 text-gray-500 text-xs">{timeStr}</td>
                                                            <td className="py-2.5 font-bold text-gray-700">{o.table_name}</td>
                                                            <td className="py-2.5 text-gray-600 max-w-[200px] truncate">{menuSummary || "-"}</td>
                                                            <td className="py-2.5 text-right font-black text-indigo-700">{(o.paid_amount || o.total_price || 0).toLocaleString()}원</td>
                                                            <td className={`py-2.5 text-right font-bold text-xs ${statusColor}`}>{statusLabel}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t-2 border-gray-200">
                                                    <td colSpan="3" className="pt-3 font-bold text-gray-500 text-xs">{drillModal.orders.length}건</td>
                                                    <td className="pt-3 text-right font-black text-indigo-700">
                                                        {drillModal.orders.filter(o => ["PAID","PARTIAL_CANCELLED"].includes(o.payment_status)).reduce((s, o) => s + (o.paid_amount || o.total_price || 0), 0).toLocaleString()}원
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            ) : null}
        </div>
    );
}

// 6. 점주용 계정 관리
export function AdminUsers({ store, token }) {
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserName, setNewUserName] = useState("");
    const [newUserRole, setNewUserRole] = useState("STAFF");

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/users/`, { headers: { Authorization: `Bearer ${token}` } });
            setUsers(res.data);
        } catch (err) { toast.error("목록 로딩 실패"); }
    };

    const handleCreateUser = async () => {
        if(!newUserEmail || !newUserPassword) return toast.error("이메일, 비밀번호 필수");
        try {
            await axios.post(`${API_BASE_URL}/admin/users/`, 
                { email: newUserEmail, password: newUserPassword, name: newUserName, role: newUserRole, store_id: store.id },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("생성 완료"); setNewUserEmail(""); setNewUserPassword(""); setNewUserName(""); setIsModalOpen(false); fetchUsers();
        } catch(err) { toast.error(err.response?.data?.detail || "실패"); }
    };

    const handleDeleteUser = async (userId) => {
        if(!window.confirm("삭제하시겠습니까?")) return;
        try { await axios.delete(`${API_BASE_URL}/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } }); fetchUsers(); } catch(err) { toast.error("삭제 실패"); }
    };

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
            {/* ... (기존 AdminUsers return 안의 UI 내용 그대로 유지) ... */}
            <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-gray-800">👤 계정 관리</h2><button onClick={()=>setIsModalOpen(true)} className="bg-gray-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-black">+ 계정 추가</button></div>
            <table className="w-full text-left border-collapse">
                <thead><tr className="border-b bg-gray-50 text-gray-500 text-sm"><th className="p-3">이름</th><th className="p-3">이메일</th><th className="p-3">권한</th><th className="p-3">상태</th><th className="p-3 text-right">관리</th></tr></thead>
                <tbody>{users.map(u => (<tr key={u.id} className="border-b hover:bg-gray-50"><td className="p-3 font-bold">{u.name || "-"}</td><td className="p-3 text-gray-600">{u.email}</td><td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${u.role==='SUPER_ADMIN'?'bg-red-100 text-red-700':u.role==='STORE_OWNER'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700'}`}>{u.role}</span></td><td className="p-3 text-sm">{u.is_active ? "🟢 활성" : "🔴 정지"}</td><td className="p-3 text-right"><button onClick={()=>handleDeleteUser(u.id)} className="text-red-500 hover:underline text-sm">삭제</button></td></tr>))}</tbody>
            </table>
            {isModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white p-6 rounded-xl w-96 shadow-2xl"><h3 className="text-xl font-bold mb-4">새 계정</h3><div className="space-y-3"><input className="border w-full p-2 rounded" placeholder="이름" value={newUserName} onChange={e=>setNewUserName(e.target.value)} /><input className="border w-full p-2 rounded" placeholder="이메일" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)} /><input className="border w-full p-2 rounded" type="password" placeholder="비밀번호" value={newUserPassword} onChange={e=>setNewUserPassword(e.target.value)} /><select className="border w-full p-2 rounded" value={newUserRole} onChange={e=>setNewUserRole(e.target.value)}><option value="STAFF">직원 (STAFF)</option><option value="STORE_OWNER">점주 (STORE_OWNER)</option></select></div><div className="flex gap-2 mt-6"><button onClick={handleCreateUser} className="flex-1 bg-indigo-600 text-white py-2 rounded font-bold">생성</button><button onClick={()=>setIsModalOpen(false)} className="flex-1 bg-gray-200 py-2 rounded font-bold">취소</button></div></div></div>)}
        </div>
    );
}

// 7. 주문/결제 내역 및 환불 (UI 개선 및 원버튼 스마트 취소 적용)
export function AdminOrders({ store, token }) {
    const today = new Date().toISOString().slice(0, 10);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [detailOrder, setDetailOrder] = useState(null);
    const [reprinting, setReprinting] = useState(false);

    // 취소 방식 선택 모달용 상태
    const [cancelActionOrder, setCancelActionOrder] = useState(null);
    // 메뉴별 부분 취소 모달용 상태
    const [cancelModal, setCancelModal] = useState({ isOpen: false, order: null, selectedItemIds: [], reason: "" });
    // 검색 필터
    const [searchQuery, setSearchQuery] = useState("");
    // 후불 수납 모달
    const [collectModal, setCollectModal] = useState(null); // { order, method }
    const [cashReceiptInput, setCashReceiptInput] = useState({ enabled: false, tradeType: "PERSONAL", identifierType: "phone", identifier: "" });
    // 현금영수증 재발급 모달
    const [reissueModal, setReissueModal] = useState(null); // { order }
    const [reissueInput, setReissueInput] = useState({ tradeType: "PERSONAL", identifierType: "phone", identifier: "" });

    const filteredOrders = orders.filter(o => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            (o.table_name || "").toLowerCase().includes(q) ||
            o.items?.some(i => i.menu_name.toLowerCase().includes(q)) ||
            String(o.daily_number).includes(q)
        );
    });

    const setRange = (type) => {
        const now = new Date();
        const todayStr = now.toISOString().slice(0, 10);
        if (type === "today") {
            setStartDate(todayStr); setEndDate(todayStr);
        } else if (type === "yesterday") {
            const d = new Date(now); d.setDate(d.getDate() - 1);
            const s = d.toISOString().slice(0, 10);
            setStartDate(s); setEndDate(s);
        } else if (type === "week") {
            const d = new Date(now); d.setDate(d.getDate() - 6);
            setStartDate(d.toISOString().slice(0, 10)); setEndDate(todayStr);
        } else if (type === "month") {
            setStartDate(`${todayStr.slice(0, 7)}-01`); setEndDate(todayStr);
        }
    };

    const fetchOrders = async (sd = startDate, ed = endDate) => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/stores/${store.id}/orders/history?start_date=${sd}&end_date=${ed}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setOrders(res.data);
        } catch (err) { toast.error("주문 내역을 불러오지 못했습니다."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, [startDate, endDate]);

    // ESC 프린터 재출력
    const handleEscReprint = async (order) => {
        setReprinting(true);
        try {
            await axios.post(
                `${API_BASE_URL}/stores/${store.id}/print/receipt?order_id=${order.id}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("영수증이 출력됩니다.");
        } catch { toast.error("프린터 출력에 실패했습니다. 브라우저 인쇄를 이용해주세요."); }
        finally { setReprinting(false); }
    };

    // 브라우저 인쇄 재출력
    const handleBrowserReprint = (order) => {
        const ORDER_TYPE = { DINE_IN: "홀", TAKEOUT: "포장" };
        const PAY_METHOD = { card: "카드", CARD: "카드", cash: "현금", CASH: "현금", 후불: "후불", 기타: "기타" };
        const timeStr = new Date(order.created_at).toLocaleString("ko-KR");
        const activeItems = order.items.filter(i => !i.is_cancelled);
        const paid = order.paid_amount || order.total_price || 0;

        const rows = activeItems.map(i => `
            <tr>
                <td style="padding:4px 0">${i.menu_name}</td>
                <td style="padding:4px 0;text-align:center">×${i.quantity}</td>
                <td style="padding:4px 0;text-align:right">${(i.price * i.quantity).toLocaleString()}원</td>
            </tr>
            ${i.options_desc ? i.options_desc.split(",").filter(o=>o.trim()).map(o=>`
            <tr><td colspan="3" style="padding:1px 0 1px 12px;font-size:11px;color:#666">└ ${o.trim()}</td></tr>`).join("") : ""}
        `).join("");

        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>영수증</title>
        <style>body{font-family:monospace;font-size:13px;width:280px;margin:0 auto;padding:12px}
        h2{text-align:center;font-size:15px;margin:0 0 6px}
        .divider{border-top:1px dashed #333;margin:6px 0}
        table{width:100%;border-collapse:collapse}
        .total{font-size:16px;font-weight:bold}
        @media print{body{width:100%}}</style></head>
        <body>
        <h2>${store.name || "매장"}</h2>
        <div class="divider"></div>
        <table><tr><td>테이블</td><td style="text-align:right">${order.table_name} (${ORDER_TYPE[order.order_type] || order.order_type})</td></tr>
        <tr><td>주문번호</td><td style="text-align:right">#${order.id} (${order.daily_number}번)</td></tr>
        <tr><td>일시</td><td style="text-align:right">${timeStr}</td></tr></table>
        <div class="divider"></div>
        <table>${rows}</table>
        <div class="divider"></div>
        <table>
        <tr class="total"><td>합계</td><td style="text-align:right">${paid.toLocaleString()}원</td></tr>
        ${order.payment_method ? `<tr><td>결제수단</td><td style="text-align:right">${PAY_METHOD[order.payment_method] || order.payment_method}</td></tr>` : ""}
        </table>
        <div class="divider"></div>
        <p style="text-align:center;font-size:12px">감사합니다!</p>
        <script>window.onload=()=>{window.print();setTimeout(()=>window.close(),500)}<\/script>
        </body></html>`;

        const w = window.open("", "_blank", "width=340,height=600");
        if (w) { w.document.write(html); w.document.close(); }
    };

    const handleFullCancel = async (order) => {
        if (!window.confirm(`[전체 취소]\n정말 ${order.total_price.toLocaleString()}원 결제를 전체 취소하시겠습니까?\n(주방 화면에서도 즉시 삭제됩니다)`)) return;
        
        try {
            await axios.post(`${API_BASE_URL}/orders/${order.id}/cancel`, 
                { reason: "관리자 전액 환불 요청" }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("결제가 전체 취소되었습니다.");
            setCancelActionOrder(null); // 선택 창 닫기
            fetchOrders();
        } catch (err) { toast.error(err.response?.data?.detail || "취소에 실패했습니다."); }
    };

    const toggleCancelItem = (itemId) => {
        setCancelModal(prev => {
            const isSelected = prev.selectedItemIds.includes(itemId);
            const newIds = isSelected 
                ? prev.selectedItemIds.filter(id => id !== itemId) 
                : [...prev.selectedItemIds, itemId];
            return { ...prev, selectedItemIds: newIds };
        });
    };

    const calculateCancelAmount = () => {
        if (!cancelModal.order) return 0;
        return cancelModal.order.items
            .filter(i => cancelModal.selectedItemIds.includes(i.id))
            .reduce((sum, i) => sum + (i.price * i.quantity), 0);
    };

    const handlePartialCancel = async () => {
        if (cancelModal.selectedItemIds.length === 0) return toast.error("취소할 메뉴를 하나 이상 선택해주세요.");

        try {
            await axios.post(`${API_BASE_URL}/orders/${cancelModal.order.id}/cancel`,
                {
                    reason: cancelModal.reason || "관리자 메뉴 부분 취소",
                    cancelled_item_ids: cancelModal.selectedItemIds
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success(`선택한 메뉴가 부분 취소되었습니다.`);
            setCancelModal({ isOpen: false, order: null, selectedItemIds: [], reason: "" });
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.detail || "부분 취소에 실패했습니다.");
        }
    };

    const handleCollectPayment = async () => {
        if (!collectModal?.method) return toast.error("결제 수단을 선택해주세요.");
        const cashReceipt = collectModal.method === "cash" && cashReceiptInput.enabled && cashReceiptInput.identifier
            ? { identifier_type: cashReceiptInput.identifierType, identifier: cashReceiptInput.identifier, trade_type: cashReceiptInput.tradeType }
            : null;
        try {
            await axios.patch(
                `${API_BASE_URL}/orders/${collectModal.order.id}/collect-payment`,
                { payment_method: collectModal.method, cash_receipt: cashReceipt },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("수납이 완료되었습니다.");
            setCollectModal(null);
            setCashReceiptInput({ enabled: false, tradeType: "PERSONAL", identifierType: "phone", identifier: "" });
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.detail || "수납 처리에 실패했습니다.");
        }
    };

    const handleReissue = async () => {
        if (!reissueInput.identifier.trim()) return toast.error("식별번호를 입력해주세요.");
        try {
            await axios.post(
                `${API_BASE_URL}/orders/${reissueModal.order.id}/cash-receipt/reissue`,
                { identifier_type: reissueInput.identifierType, identifier: reissueInput.identifier, trade_type: reissueInput.tradeType },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success("현금영수증이 재발급되었습니다.");
            setReissueModal(null);
            setReissueInput({ tradeType: "PERSONAL", identifierType: "phone", identifier: "" });
            fetchOrders();
        } catch (err) {
            toast.error(err.response?.data?.detail || "재발급에 실패했습니다.");
        }
    };

    const handleExportCSV = () => {
        const PAY_LABEL = { card: "카드", CARD: "카드", cash: "현금", CASH: "현금", 후불: "후불", 기타: "기타" };
        const TYPE_LABEL = { DINE_IN: "홀", TAKEOUT: "포장" };
        const STATUS_LABEL = { PAID: "완료", CANCELLED: "취소", PARTIAL_CANCELLED: "부분취소", DEFERRED: "후불" };
        const esc = v => `"${String(v ?? "").replace(/"/g, '""')}"`;

        const rows = [
            ["주문일시", "번호", "테이블", "유형", "주문메뉴", "결제수단", "결제금액", "상태"].map(esc).join(","),
            ...filteredOrders.map(o => {
                const cancelledAmt = o.items?.filter(i => i.is_cancelled).reduce((s, i) => s + i.price * i.quantity, 0) || 0;
                const finalAmt = o.payment_status === "PARTIAL_CANCELLED"
                    ? o.total_price - cancelledAmt
                    : (o.payment_status === "CANCELLED" ? 0 : (o.paid_amount || o.total_price || 0));
                const menuSummary = o.items?.filter(i => !i.is_cancelled).map(i => `${i.menu_name}×${i.quantity}`).join(" / ") || "";
                return [
                    new Date(o.created_at).toLocaleString("ko-KR"),
                    `${o.daily_number}번`,
                    o.table_name || "",
                    TYPE_LABEL[o.order_type] || o.order_type,
                    menuSummary,
                    o.payment_method ? (PAY_LABEL[o.payment_method] || o.payment_method) : "",
                    finalAmt,
                    STATUS_LABEL[o.payment_status] || o.payment_status,
                ].map(esc).join(",");
            })
        ];

        const csv = "﻿" + rows.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `주문내역_${startDate}_${endDate}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-200 animate-fadeIn h-[calc(100vh-120px)] flex flex-col overflow-hidden">

            {/* 헤더 + 날짜 필터 */}
            <div className="shrink-0 space-y-3 mb-4">
                {/* 타이틀 행 */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🧾 주문 및 결제 내역</h2>
                    <div className="flex items-center gap-2">
                        <button onClick={handleExportCSV} className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-3 py-2 rounded-lg font-bold hover:bg-emerald-600 hover:text-white flex items-center gap-1.5 transition text-sm">
                            📥 CSV
                        </button>
                        <button onClick={() => fetchOrders()} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-2 transition text-sm">
                            🔄 새로고침
                        </button>
                    </div>
                </div>

                {/* 날짜 필터 행 */}
                <div className="flex flex-wrap items-center gap-2">
                    {[["today","오늘"],["yesterday","어제"],["week","최근 7일"],["month","이번달"]].map(([k,l]) => (
                        <button key={k} onClick={() => setRange(k)} className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition">{l}</button>
                    ))}
                    <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-xl">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white px-2 py-1 rounded-lg font-bold text-gray-700 outline-none border border-gray-200 text-sm" />
                        <span className="text-gray-400 font-bold">~</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white px-2 py-1 rounded-lg font-bold text-gray-700 outline-none border border-gray-200 text-sm" />
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="메뉴명·테이블·번호 검색"
                        className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-sm font-medium text-gray-700 outline-none focus:border-indigo-400 w-44"
                    />
                    <span className="text-xs text-gray-400 font-bold">
                        {searchQuery ? `${filteredOrders.length} / ${orders.length}건` : `${orders.length}건`}
                    </span>
                </div>

                {/* 요약 통계 카드 */}
                {(() => {
                    const valid = filteredOrders.filter(o => o.payment_status !== "CANCELLED");
                    const revenue = valid.reduce((sum, o) => {
                        if (o.payment_status === "PARTIAL_CANCELLED") {
                            const cancelled = o.items?.filter(i => i.is_cancelled).reduce((s, i) => s + i.price * i.quantity, 0) || 0;
                            return sum + (o.total_price - cancelled);
                        }
                        return sum + (o.paid_amount || o.total_price || 0);
                    }, 0);
                    const deferredCnt = filteredOrders.filter(o => o.payment_status === "DEFERRED").length;
                    const avg = valid.length > 0 ? Math.round(revenue / valid.length) : 0;
                    return (
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
                                <p className="text-xs text-indigo-400 font-bold mb-0.5">총 매출</p>
                                <p className="text-lg font-black text-indigo-700">{revenue.toLocaleString()}원</p>
                            </div>
                            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 text-center">
                                <p className="text-xs text-gray-400 font-bold mb-0.5">주문 건수</p>
                                <p className="text-lg font-black text-gray-700">{valid.length}건</p>
                            </div>
                            <div className={`border rounded-xl p-3 text-center ${deferredCnt > 0 ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                                <p className={`text-xs font-bold mb-0.5 ${deferredCnt > 0 ? "text-amber-500" : "text-gray-400"}`}>미수납(후불)</p>
                                <p className={`text-lg font-black ${deferredCnt > 0 ? "text-amber-600" : "text-gray-700"}`}>{deferredCnt}건</p>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* ✨ 2. flex-1과 overflow-auto를 적용하여 '표 내부에서만' 예쁘게 스크롤되도록 만듭니다. */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-xl relative bg-white">
                
                {/* ✨ 3. 표 최소 너비를 700px로 확 줄여서 웬만한 화면에선 가로 스크롤 없이 꽉 차게 변경! */}
                <table className="w-full text-left border-collapse min-w-[780px]">
                    <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-slate-900 text-white text-sm">
                            <th className="p-3 font-bold w-24 text-center">주문일시</th>
                            <th className="p-3 font-bold w-16 text-center">번호</th>
                            <th className="p-3 font-bold w-20 text-center">테이블</th>
                            <th className="p-3 font-bold w-16 text-center">유형</th>
                            <th className="p-3 font-bold">주문 메뉴</th>
                            <th className="p-3 font-bold w-20 text-center">결제수단</th>
                            <th className="p-3 font-bold w-24 text-right">결제금액</th>
                            <th className="p-3 font-bold w-20 text-center">상태</th>
                            <th className="p-3 font-bold w-28 text-center">관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="9" className="text-center py-10 font-bold text-gray-400">데이터를 불러오는 중입니다...</td></tr>}
                        {!loading && filteredOrders.length === 0 && <tr><td colSpan="9" className="text-center py-10 font-bold text-gray-400">{searchQuery ? "검색 결과가 없습니다." : "해당 기간의 주문이 없습니다."}</td></tr>}
                        {!loading && filteredOrders.map(o => {
                            const cancelledAmt = o.items?.filter(i => i.is_cancelled).reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0;
                            const finalAmt = o.total_price - cancelledAmt;
                            const PAY_METHOD = { card: "카드", CARD: "카드", cash: "현금", CASH: "현금", 후불: "후불", 기타: "기타" };
                            const ORDER_TYPE = { DINE_IN: "홀", TAKEOUT: "포장" };
                            const STATUS_STYLE = {
                                PAID: "bg-green-100 text-green-700",
                                CANCELLED: "bg-red-100 text-red-700",
                                PARTIAL_CANCELLED: "bg-yellow-100 text-yellow-800",
                                DEFERRED: "bg-amber-100 text-amber-700",
                            };
                            const STATUS_LABEL = { PAID: "완료", CANCELLED: "취소", PARTIAL_CANCELLED: "부분취소", DEFERRED: "후불" };

                            return (
                                <tr
                                    key={o.id}
                                    onClick={() => setDetailOrder(o)}
                                    className={`border-b border-gray-100 cursor-pointer transition ${o.payment_status === "CANCELLED" ? "bg-red-50/30 opacity-60 hover:opacity-80" : "hover:bg-indigo-50/40"}`}
                                >
                                    <td className="p-3 text-center text-xs text-gray-500 font-medium">
                                        {new Date(o.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-3 text-center font-black text-gray-800">{o.daily_number}번</td>
                                    <td className="p-3 text-center font-bold text-indigo-600 text-sm">{o.table_name}</td>
                                    <td className="p-3 text-center text-xs font-bold text-gray-500">{ORDER_TYPE[o.order_type] || o.order_type}</td>
                                    <td className="p-3 text-sm font-bold text-gray-700">
                                        <div className="flex flex-col gap-0.5 max-h-16 overflow-hidden">
                                            {o.items?.map(i => (
                                                <span key={i.id} className={i.is_cancelled ? "line-through text-red-400 font-medium text-xs" : "truncate"}>
                                                    {i.menu_name} <span className="text-xs text-gray-400">×{i.quantity}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="p-3 text-center text-xs font-bold text-gray-600">
                                        <div className="flex flex-col items-center gap-1">
                                            <span>{o.payment_method ? (PAY_METHOD[o.payment_method] || o.payment_method) : "-"}</span>
                                            {o.payment_method === "cash" && o.cash_receipt_status && o.cash_receipt_status !== "NONE" && (
                                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                                    o.cash_receipt_status === "ISSUED" ? "bg-emerald-100 text-emerald-700" :
                                                    o.cash_receipt_status === "FAILED" ? "bg-red-100 text-red-600" :
                                                    "bg-gray-100 text-gray-500"
                                                }`}>
                                                    {o.cash_receipt_status === "ISSUED" ? "영수증✓" :
                                                     o.cash_receipt_status === "FAILED" ? "발급실패" : "취소됨"}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-3 text-right">
                                        {o.payment_status === "PARTIAL_CANCELLED" ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-400 line-through text-[11px]">{o.total_price.toLocaleString()}원</span>
                                                <span className="font-black text-red-600 text-sm">{finalAmt.toLocaleString()}원</span>
                                            </div>
                                        ) : o.payment_status === "CANCELLED" ? (
                                            <span className="font-black text-red-400 line-through text-sm">{o.total_price.toLocaleString()}원</span>
                                        ) : (
                                            <span className="font-black text-gray-900 text-sm">{(o.paid_amount || o.total_price || 0).toLocaleString()}원</span>
                                        )}
                                    </td>
                                    <td className="p-3 text-center">
                                        <span className={`px-2 py-1 rounded text-[11px] font-bold ${STATUS_STYLE[o.payment_status] || "bg-gray-100 text-gray-600"}`}>
                                            {STATUS_LABEL[o.payment_status] || o.payment_status}
                                        </span>
                                    </td>
                                    <td className="p-3 text-center" onClick={e => e.stopPropagation()}>
                                        <div className="flex flex-col gap-1 items-center">
                                            {o.payment_status === "DEFERRED" && (
                                                <button
                                                    onClick={() => setCollectModal({ order: o, method: "cash" })}
                                                    className="bg-amber-50 hover:bg-amber-500 hover:text-white border border-amber-300 text-amber-700 text-xs font-bold px-2 py-1.5 rounded-lg transition w-full"
                                                >
                                                    💰 수납
                                                </button>
                                            )}
                                            {o.payment_method === "cash" && ["FAILED", "CANCELLED", "NONE"].includes(o.cash_receipt_status) && o.payment_status === "PAID" && (
                                                <button
                                                    onClick={() => { setReissueModal({ order: o }); setReissueInput({ tradeType: "PERSONAL", identifierType: "phone", identifier: "" }); }}
                                                    className="bg-emerald-50 hover:bg-emerald-500 hover:text-white border border-emerald-300 text-emerald-700 text-xs font-bold px-2 py-1.5 rounded-lg transition w-full"
                                                >
                                                    🧾 영수증
                                                </button>
                                            )}
                                            <button
                                                onClick={() => setCancelActionOrder(o)}
                                                disabled={o.payment_status === "CANCELLED"}
                                                className="bg-red-50 hover:bg-red-500 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent border border-red-200 text-red-600 text-xs font-bold px-2 py-1.5 rounded-lg transition w-full"
                                            >
                                                {o.payment_status === "CANCELLED" ? "불가" : "취소"}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* 취소 방식 선택 스마트 팝업 */}
            {cancelActionOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCancelActionOrder(null)}>
                    <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-slideUp" onClick={e => e.stopPropagation()}>
                        <div className="text-center mb-6">
                            <span className="text-4xl">🤔</span>
                            <h3 className="font-extrabold text-xl mt-2 text-gray-900">어떤 방식으로 취소할까요?</h3>
                            <p className="text-sm text-gray-500 mt-1">대기번호 <span className="font-bold text-indigo-600">{cancelActionOrder.daily_number}번</span> 주문</p>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                            <button onClick={() => {
                                setCancelModal({ isOpen: true, order: cancelActionOrder, selectedItemIds: [], reason: "" });
                                setCancelActionOrder(null); 
                            }} 
                            disabled={cancelActionOrder.items.every(i => i.is_cancelled)}
                            className="w-full bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent border border-indigo-200 p-4 rounded-xl font-bold text-lg transition text-left flex justify-between items-center group shadow-sm">
                                <span>🍔 특정 메뉴만 취소</span>
                                <span className="opacity-50 group-hover:opacity-100 transition-opacity">👉</span>
                            </button>

                            <button onClick={() => handleFullCancel(cancelActionOrder)} 
                                className="w-full bg-red-50 hover:bg-red-600 hover:text-white text-red-600 border border-red-200 p-4 rounded-xl font-bold text-lg transition text-left flex justify-between items-center group shadow-sm">
                                <span>🚨 주문 전체 취소</span>
                                <span className="opacity-50 group-hover:opacity-100 transition-opacity">🗑️</span>
                            </button>
                        </div>
                        
                        <button onClick={() => setCancelActionOrder(null)} className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition">닫기</button>
                    </div>
                </div>
            )}

            {/* 메뉴별 부분 취소 모달 */}
            {cancelModal.isOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
                    <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-2xl animate-fadeIn">
                        <div className="border-b pb-3 mb-4">
                            <h3 className="font-extrabold text-xl text-gray-900">🍔 취소할 메뉴 선택</h3>
                            <p className="text-sm text-gray-500 mt-1">대기번호 <span className="font-bold text-indigo-600">{cancelModal.order.daily_number}번</span> 주문</p>
                        </div>

                        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto pr-2">
                            {cancelModal.order.items.map(item => {
                                const isAlreadyCancelled = item.is_cancelled;
                                return (
                                    <label key={item.id} className={`flex justify-between items-center p-3 border rounded-xl cursor-pointer transition ${isAlreadyCancelled ? 'bg-gray-100 opacity-50' : 'hover:bg-indigo-50 border-gray-200'}`}>
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox"
                                                className="w-5 h-5 accent-indigo-600 cursor-pointer"
                                                disabled={isAlreadyCancelled}
                                                checked={cancelModal.selectedItemIds.includes(item.id)}
                                                onChange={() => toggleCancelItem(item.id)}
                                            />
                                            <span className={`font-bold text-sm ${isAlreadyCancelled ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                                {item.menu_name} <span className="text-gray-500 text-xs ml-1">x{item.quantity}</span>
                                            </span>
                                        </div>
                                        <span className={`font-bold text-sm ${isAlreadyCancelled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                            {(item.price * item.quantity).toLocaleString()}원
                                        </span>
                                    </label>
                                )
                            })}
                        </div>

                        <div className="bg-red-50 p-3 rounded-lg border border-red-100 flex justify-between items-center mb-4">
                            <span className="text-sm font-bold text-red-800">환불 예정 금액</span>
                            <span className="text-xl font-black text-red-600">{calculateCancelAmount().toLocaleString()}원</span>
                        </div>

                        <div className="mb-6">
                            <input type="text" className="w-full border border-gray-300 p-2.5 rounded-lg text-sm outline-none focus:border-indigo-500 bg-gray-50 focus:bg-white transition" placeholder="취소 사유 메모 (선택사항)" value={cancelModal.reason} onChange={e=>setCancelModal({...cancelModal, reason: e.target.value})} />
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handlePartialCancel} disabled={cancelModal.selectedItemIds.length === 0} className="flex-1 bg-red-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold shadow-md hover:bg-red-700 transition">선택 메뉴 취소하기</button>
                            <button onClick={() => setCancelModal({ isOpen: false, order: null, selectedItemIds: [], reason: "" })} className="w-24 bg-gray-200 text-gray-800 py-3 rounded-xl font-bold hover:bg-gray-300 transition">닫기</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 후불 수납 모달 */}
            {collectModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => { setCollectModal(null); setCashReceiptInput({ enabled: false, tradeType: "PERSONAL", identifierType: "phone", identifier: "" }); }}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b">
                            <h3 className="font-extrabold text-xl text-gray-900">💰 후불 수납 처리</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                대기 <span className="font-bold text-amber-600">{collectModal.order.daily_number}번</span> ·
                                <span className="font-bold text-gray-700 ml-1">{(collectModal.order.paid_amount || collectModal.order.total_price || 0).toLocaleString()}원</span>
                            </p>
                        </div>
                        <div className="p-5 space-y-3">
                            <p className="text-sm font-bold text-gray-600 mb-1">결제 수단 선택</p>
                            {[["cash", "현금"], ["card", "카드"], ["기타", "기타"]].map(([val, label]) => (
                                <label key={val} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${collectModal.method === val ? "bg-amber-50 border-amber-400" : "border-gray-200 hover:bg-gray-50"}`}>
                                    <input
                                        type="radio"
                                        name="collect_method"
                                        value={val}
                                        checked={collectModal.method === val}
                                        onChange={() => setCollectModal(prev => ({ ...prev, method: val }))}
                                        className="accent-amber-500 w-4 h-4"
                                    />
                                    <span className={`font-bold text-sm ${collectModal.method === val ? "text-amber-700" : "text-gray-700"}`}>{label}</span>
                                </label>
                            ))}
                            {collectModal.method === "cash" && (
                                <CashReceiptForm value={cashReceiptInput} onChange={setCashReceiptInput} />
                            )}
                        </div>
                        <div className="p-4 border-t flex gap-2">
                            <button
                                onClick={handleCollectPayment}
                                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition"
                            >
                                수납 완료
                            </button>
                            <button
                                onClick={() => { setCollectModal(null); setCashReceiptInput({ enabled: false, tradeType: "PERSONAL", identifierType: "phone", identifier: "" }); }}
                                className="w-24 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 현금영수증 재발급 모달 */}
            {reissueModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[75] p-4" onClick={() => setReissueModal(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-5 border-b">
                            <h3 className="font-extrabold text-xl text-gray-900">🧾 현금영수증 재발급</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {reissueModal.order.daily_number}번 주문 ·{" "}
                                <span className="font-bold text-gray-700">
                                    {(reissueModal.order.paid_amount || reissueModal.order.total_price || 0).toLocaleString()}원
                                </span>
                            </p>
                        </div>
                        <div className="p-5">
                            <CashReceiptForm
                                value={{ ...reissueInput, enabled: true }}
                                onChange={patch => setReissueInput(prev => ({ ...prev, ...(typeof patch === "function" ? patch(prev) : patch) }))}
                                forceEnabled
                            />
                        </div>
                        <div className="p-4 border-t flex gap-2">
                            <button
                                onClick={handleReissue}
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition"
                            >
                                발급
                            </button>
                            <button
                                onClick={() => setReissueModal(null)}
                                className="w-24 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
                            >
                                취소
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 주문 상세 모달 */}
            {detailOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" onClick={() => setDetailOrder(null)}>
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        {/* 헤더 */}
                        <div className="p-5 border-b flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-2xl font-black text-indigo-600">#{detailOrder.daily_number}번</span>
                                    {(() => {
                                        const STATUS_STYLE = { PAID: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700", PARTIAL_CANCELLED: "bg-yellow-100 text-yellow-800", DEFERRED: "bg-amber-100 text-amber-700" };
                                        const STATUS_LABEL = { PAID: "완료", CANCELLED: "취소", PARTIAL_CANCELLED: "부분취소", DEFERRED: "후불" };
                                        return <span className={`px-2 py-0.5 rounded text-xs font-bold ${STATUS_STYLE[detailOrder.payment_status] || "bg-gray-100 text-gray-600"}`}>{STATUS_LABEL[detailOrder.payment_status] || detailOrder.payment_status}</span>;
                                    })()}
                                </div>
                                <p className="text-sm text-gray-500">{new Date(detailOrder.created_at).toLocaleString("ko-KR")}</p>
                            </div>
                            <button onClick={() => setDetailOrder(null)} className="text-gray-400 hover:text-gray-700 text-2xl font-bold leading-none mt-0.5">×</button>
                        </div>

                        {/* 주문 메타 정보 */}
                        <div className="px-5 py-3 bg-gray-50 border-b grid grid-cols-3 gap-2 text-sm">
                            <div className="text-center">
                                <p className="text-gray-400 text-xs mb-0.5">테이블</p>
                                <p className="font-bold text-gray-800">{detailOrder.table_name || "-"}</p>
                            </div>
                            <div className="text-center border-x border-gray-200">
                                <p className="text-gray-400 text-xs mb-0.5">유형</p>
                                <p className="font-bold text-gray-800">{detailOrder.order_type === "TAKEOUT" ? "포장" : "홀"}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-gray-400 text-xs mb-0.5">결제수단</p>
                                <p className="font-bold text-gray-800">
                                    {detailOrder.payment_method
                                        ? ({ card: "카드", CARD: "카드", cash: "현금", CASH: "현금", 후불: "후불", 기타: "기타" }[detailOrder.payment_method] || detailOrder.payment_method)
                                        : "-"}
                                </p>
                            </div>
                        </div>

                        {/* 주문 항목 목록 */}
                        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                            {detailOrder.items?.map(item => (
                                <div key={item.id} className={`rounded-xl border p-3 ${item.is_cancelled ? "bg-red-50/40 border-red-100 opacity-60" : "bg-white border-gray-100"}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`font-bold text-sm ${item.is_cancelled ? "line-through text-red-400" : "text-gray-800"}`}>
                                            {item.menu_name}
                                            <span className="text-gray-400 font-medium ml-1">×{item.quantity}</span>
                                        </span>
                                        <span className={`font-bold text-sm ${item.is_cancelled ? "line-through text-red-300" : "text-gray-900"}`}>
                                            {(item.price * item.quantity).toLocaleString()}원
                                        </span>
                                    </div>
                                    {item.options_desc && item.options_desc.split(",").filter(o => o.trim()).map((opt, idx) => (
                                        <p key={idx} className="text-xs text-gray-400 mt-0.5 pl-2">└ {opt.trim()}</p>
                                    ))}
                                    {item.is_cancelled && (
                                        <span className="text-[10px] font-bold text-red-400 mt-1 block">취소됨</span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* 결제 합계 */}
                        <div className="px-5 py-3 border-t bg-gray-50">
                            {detailOrder.payment_status === "PARTIAL_CANCELLED" && (() => {
                                const cancelledAmt = detailOrder.items?.filter(i => i.is_cancelled).reduce((sum, i) => sum + i.price * i.quantity, 0) || 0;
                                return (
                                    <div className="flex justify-between items-center text-sm text-gray-400 mb-1">
                                        <span>취소 금액</span>
                                        <span className="line-through">-{cancelledAmt.toLocaleString()}원</span>
                                    </div>
                                );
                            })()}
                            <div className="flex justify-between items-center">
                                <span className="font-bold text-gray-700">최종 결제</span>
                                <span className="font-black text-lg text-gray-900">{(detailOrder.paid_amount || detailOrder.total_price || 0).toLocaleString()}원</span>
                            </div>
                        </div>

                        {/* 재출력 버튼 */}
                        <div className="p-4 border-t flex gap-2">
                            <button
                                onClick={() => handleEscReprint(detailOrder)}
                                disabled={reprinting}
                                className="flex-1 bg-gray-800 hover:bg-black disabled:bg-gray-300 text-white text-sm font-bold py-2.5 rounded-xl transition"
                            >
                                {reprinting ? "출력 중..." : "🖨️ ESC 프린터"}
                            </button>
                            <button
                                onClick={() => handleBrowserReprint(detailOrder)}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2.5 rounded-xl transition"
                            >
                                🌐 브라우저 인쇄
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function ToggleSwitch({ checked, onChange }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-14 h-7 rounded-full transition-colors duration-300 focus:outline-none shrink-0 ${checked ? "bg-indigo-600" : "bg-gray-300"}`}
        >
            <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${checked ? "translate-x-7" : "translate-x-0"}`} />
        </button>
    );
}

export function AdminHardwareSettings({ store, token, fetchStore }) {
    const [hasPos, setHasPos] = useState(store?.has_pos ?? false);
    const [printerConfig, setPrinterConfig] = useState(store?.printer_config || "NONE");
    const [autoKitchenPrint, setAutoKitchenPrint] = useState(store?.auto_kitchen_print ?? false);
    const [allowStaffOrder, setAllowStaffOrder] = useState(store?.allow_staff_order ?? true);
    const [saving, setSaving] = useState(false);
    const [copied, setCopied] = useState(null);
    const [testResult, setTestResult] = useState({ 1: null, 2: null });
    const [testing, setTesting] = useState({ 1: false, 2: false });

    // 영수증 프린터(1) 연결 설정
    const [r_type, setRType] = useState(store?.receipt_printer_type || "FILE");
    const [r_host, setRHost] = useState(store?.receipt_printer_host || "");
    const [r_port, setRPort] = useState(store?.receipt_printer_port || "9100");
    const [r_baud, setRBaud] = useState(store?.receipt_printer_baud || 9600);

    // 주방 프린터(2) 연결 설정
    const [k_type, setKType] = useState(store?.kitchen_printer_type || "FILE");
    const [k_host, setKHost] = useState(store?.kitchen_printer_host || "");
    const [k_port, setKPort] = useState(store?.kitchen_printer_port || "9100");
    const [k_baud, setKBaud] = useState(store?.kitchen_printer_baud || 9600);

    const handleSaveHardware = async () => {
        setSaving(true);
        try {
            await axios.patch(`${API_BASE_URL}/stores/${store.id}`, {
                has_pos: hasPos,
                printer_config: printerConfig,
                auto_kitchen_print: autoKitchenPrint,
                allow_staff_order: allowStaffOrder,
                receipt_printer_type: r_type,
                receipt_printer_host: r_host,
                receipt_printer_port: r_port,
                receipt_printer_baud: Number(r_baud),
                kitchen_printer_type: k_type,
                kitchen_printer_host: k_host,
                kitchen_printer_port: k_port,
                kitchen_printer_baud: Number(k_baud),
            }, { headers: { Authorization: `Bearer ${token}` } });
            toast.success("하드웨어 설정이 저장되었습니다.");
            fetchStore();
        } catch {
            toast.error("설정 저장 실패");
        } finally {
            setSaving(false);
        }
    };

    const handleTestPrint = async (printerNum) => {
        setTesting(p => ({ ...p, [printerNum]: true }));
        setTestResult(p => ({ ...p, [printerNum]: null }));
        try {
            const res = await axios.post(
                `${API_BASE_URL}/stores/${store.id}/print/test?printer=${printerNum}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setTestResult(p => ({ ...p, [printerNum]: { ok: true, data: res.data } }));
            if (res.data.simulated) {
                toast("시뮬레이션 출력 완료 (FILE 모드)", { icon: "📄" });
            } else {
                toast.success(`프린터 ${printerNum} 테스트 출력 완료`);
            }
        } catch (e) {
            const msg = e.response?.data?.detail || "연결 실패";
            setTestResult(p => ({ ...p, [printerNum]: { ok: false, msg } }));
            toast.error(`테스트 실패: ${msg}`);
        } finally {
            setTesting(p => ({ ...p, [printerNum]: false }));
        }
    };

    const copyToClipboard = (text, key) => {
        navigator.clipboard.writeText(text);
        setCopied(key);
        setTimeout(() => setCopied(null), 1500);
    };

    const envContent = `SERVER_URL=${window.location.origin.replace(/:\d+$/, ":8000")}
STORE_ID=${store.id}
EMAIL=owner@example.com
PASSWORD=yourpassword`;

    const PRINTER_CONFIGS = [
        { value: "NONE",     label: "프린터 없음",  desc: "출력 기능을 사용하지 않습니다.",               icon: "🚫" },
        { value: "UNIFIED",  label: "통합 출력",    desc: "영수증 프린터 1대로 주방지까지 함께 출력합니다.", icon: "🖨️" },
        { value: "SEPARATE", label: "분리 출력",    desc: "영수증용(Printer 1)과 주방용(Printer 2)를 각각 사용합니다.", icon: "🖨️🖨️" },
    ];

    const CONN_TYPES = [
        { value: "NETWORK", label: "네트워크 (LAN/Wi-Fi)", icon: "🌐" },
        { value: "SERIAL",  label: "시리얼 / USB",          icon: "🔌" },
        { value: "FILE",    label: "테스트 (시뮬레이션)",    icon: "📄" },
    ];

    const BAUD_RATES = [9600, 19200, 38400, 57600, 115200];

    // 프린터 연결 설정 폼 컴포넌트
    const PrinterConnectionForm = ({ num, label, type, setType, host, setHost, port, setPort, baud, setBaud }) => (
        <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🖨️</span>
                    <div>
                        <p className="font-extrabold text-gray-800 text-sm">Printer {num} — {label}</p>
                        <p className="text-xs text-gray-400">{num === 1 ? "계산대 옆 영수증 프린터" : "주방 주문서 프린터"}</p>
                    </div>
                </div>
                <button
                    onClick={() => handleTestPrint(num)}
                    disabled={testing[num]}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded-lg transition">
                    {testing[num] ? "출력 중..." : "테스트 출력"}
                </button>
            </div>

            <div className="p-5 space-y-4">
                {/* 연결 방식 */}
                <div>
                    <p className="text-xs font-bold text-gray-600 mb-2">연결 방식</p>
                    <div className="grid grid-cols-3 gap-2">
                        {CONN_TYPES.map(ct => (
                            <button key={ct.value} onClick={() => {
                                setType(ct.value);
                                if (ct.value === "NETWORK") setPort("9100");
                            }}
                                className={`p-3 rounded-xl border-2 text-center transition-all text-xs ${type === ct.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}>
                                <div className="text-xl mb-1">{ct.icon}</div>
                                <p className={`font-bold text-xs leading-tight ${type === ct.value ? "text-indigo-700" : "text-gray-700"}`}>{ct.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 네트워크 설정 */}
                {type === "NETWORK" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">IP 주소</label>
                            <input value={host} onChange={e => setHost(e.target.value)}
                                placeholder="192.168.1.100"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">포트</label>
                            <input value={port} onChange={e => setPort(e.target.value)}
                                placeholder="9100"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400" />
                        </div>
                    </div>
                )}

                {/* 시리얼/USB 설정 */}
                {type === "SERIAL" && (
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">COM 포트</label>
                            <input value={port} onChange={e => setPort(e.target.value)}
                                placeholder="COM3  또는  /dev/ttyUSB0"
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-indigo-400" />
                            <p className="text-xs text-gray-400 mt-1">Windows: COM3 · Linux/Mac: /dev/ttyUSB0</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-600 block mb-1">전송속도 (Baud)</label>
                            <select value={baud} onChange={e => setBaud(Number(e.target.value))}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400">
                                {BAUD_RATES.map(b => <option key={b} value={b}>{b.toLocaleString()}</option>)}
                            </select>
                            <p className="text-xs text-gray-400 mt-1">대부분의 프린터: 9600 또는 115200</p>
                        </div>
                    </div>
                )}

                {/* 테스트 모드 안내 */}
                {type === "FILE" && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                        <span className="text-amber-500 shrink-0">📄</span>
                        <p className="text-xs text-amber-700 leading-relaxed">
                            실제 프린터 없이 ESC/POS 출력 내용을 서버 로그에서 확인합니다.<br/>
                            실제 운영 전 <strong>네트워크</strong> 또는 <strong>시리얼/USB</strong>로 변경하세요.
                        </p>
                    </div>
                )}

                {/* 테스트 결과 */}
                {testResult[num] && (
                    <div className={`rounded-xl p-3 text-xs font-mono ${testResult[num].ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-700"}`}>
                        {testResult[num].ok
                            ? testResult[num].data?.simulated
                                ? `✓ 시뮬레이션 완료 (FILE 모드)\n출력 바이트: ${testResult[num].data?.debug_output?.length || 0}자`
                                : `✓ 프린터 출력 완료`
                            : `✗ 오류: ${testResult[num].msg}`}
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div>
                <h2 className="text-2xl font-extrabold text-gray-900">⚙️ 하드웨어 설정</h2>
                <p className="text-sm text-gray-500 mt-1">매장 운영 환경과 프린터를 설정합니다.</p>
            </div>

            {/* 시스템 환경 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-extrabold text-gray-800">🖥️ 운영 시스템 환경</h3>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                    {[
                        { val: true,  icon: "💻", title: "표준 POS 시스템", desc: "POS기 사용 · 영수증 자동 출력 생략\n수납 시 포스기 수납 완료 버튼만 표시" },
                        { val: false, icon: "📱", title: "모바일/태블릿 전용", desc: "POS기 없음 · 결제 후 영수증 자동 출력\n수납 시 카드/현금 선택 후 처리" },
                    ].map(opt => (
                        <button key={String(opt.val)} onClick={() => { setHasPos(opt.val); if (!opt.val) setPrinterConfig("NONE"); }}
                            className={`p-5 rounded-xl border-2 text-left transition-all ${hasPos === opt.val ? "border-indigo-500 bg-indigo-50 shadow-md" : "border-gray-200 hover:border-gray-300"}`}>
                            <div className="text-3xl mb-3">{opt.icon}</div>
                            <p className={`font-extrabold text-sm mb-1 ${hasPos === opt.val ? "text-indigo-700" : "text-gray-800"}`}>{opt.title}</p>
                            <p className="text-xs text-gray-500 whitespace-pre-line leading-relaxed">{opt.desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* 프린터 구성 선택 */}
            {hasPos && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-extrabold text-gray-800">🖨️ 프린터 구성</h3>
                    </div>
                    <div className="p-6 space-y-3">
                        {PRINTER_CONFIGS.map(cfg => (
                            <button key={cfg.value} onClick={() => { setPrinterConfig(cfg.value); if (cfg.value === "NONE") setAutoKitchenPrint(false); }}
                                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${printerConfig === cfg.value ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-gray-300"}`}>
                                <span className="text-2xl">{cfg.icon}</span>
                                <div className="flex-1">
                                    <p className={`font-bold text-sm ${printerConfig === cfg.value ? "text-indigo-700" : "text-gray-800"}`}>{cfg.label}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{cfg.desc}</p>
                                </div>
                                {printerConfig === cfg.value && <span className="text-indigo-500 text-xl">✓</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Printer 1 연결 설정 — 프린터가 있을 때 */}
            {hasPos && printerConfig !== "NONE" && (
                <PrinterConnectionForm
                    num={1} label="영수증 프린터"
                    type={r_type} setType={setRType}
                    host={r_host} setHost={setRHost}
                    port={r_port} setPort={setRPort}
                    baud={r_baud} setBaud={setRBaud}
                />
            )}

            {/* Printer 2 연결 설정 — 분리 출력일 때만 */}
            {hasPos && printerConfig === "SEPARATE" && (
                <PrinterConnectionForm
                    num={2} label="주방 프린터"
                    type={k_type} setType={setKType}
                    host={k_host} setHost={setKHost}
                    port={k_port} setPort={setKPort}
                    baud={k_baud} setBaud={setKBaud}
                />
            )}

            {/* 자동 출력 토글 */}
            {hasPos && printerConfig !== "NONE" && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-extrabold text-gray-800">⚡ 자동 출력 설정</h3>
                    </div>
                    <div className="p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-800 text-sm">주방 주문서 자동 출력</p>
                                <p className="text-xs text-gray-500 mt-0.5">주문 접수 즉시 주방 프린터에서 자동으로 출력됩니다.</p>
                            </div>
                            <ToggleSwitch checked={autoKitchenPrint} onChange={setAutoKitchenPrint} />
                        </div>
                    </div>
                </div>
            )}

            {/* 프린터 에이전트 가이드 */}
            {hasPos && printerConfig !== "NONE" && autoKitchenPrint && (
                <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-lg">
                    <div className="px-6 py-4 border-b border-slate-700 flex items-center gap-2">
                        <span className="text-lg">🤖</span>
                        <h3 className="font-extrabold text-white">프린터 에이전트 설정 가이드</h3>
                        <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded-full font-bold">필수</span>
                    </div>
                    <div className="p-6 space-y-5 text-sm">
                        <p className="text-slate-300 leading-relaxed">
                            자동 출력은 <span className="text-white font-bold">toryOrderPrinterAgent</span>가 POS PC에서 실행 중이어야 동작합니다.
                        </p>
                        <div>
                            <p className="text-slate-400 font-bold mb-2">① 패키지 설치</p>
                            <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                                <code className="text-green-400 font-mono text-xs">pip install python-escpos</code>
                                <button onClick={() => copyToClipboard("pip install python-escpos", "install")}
                                    className="text-slate-400 hover:text-white text-xs shrink-0 transition">
                                    {copied === "install" ? "✓ 복사됨" : "복사"}
                                </button>
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold mb-2">② .env 파일 생성</p>
                            <div className="bg-slate-800 rounded-xl p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-slate-400 text-xs font-mono">.env</span>
                                    <button onClick={() => copyToClipboard(envContent, "env")}
                                        className="text-slate-400 hover:text-white text-xs transition">
                                        {copied === "env" ? "✓ 복사됨" : "전체 복사"}
                                    </button>
                                </div>
                                <pre className="text-green-400 font-mono text-xs whitespace-pre leading-relaxed overflow-x-auto">
{`SERVER_URL=${window.location.origin.replace(/:\d+$/, ":8000")}
STORE_ID=${store.id}
EMAIL=`}<span className="text-yellow-400">owner@example.com</span>{`
PASSWORD=`}<span className="text-yellow-400">yourpassword</span>
                                </pre>
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-400 font-bold mb-2">③ 에이전트 실행</p>
                            <div className="bg-slate-800 rounded-xl p-3 flex items-center justify-between gap-3">
                                <code className="text-green-400 font-mono text-xs">python agent.py</code>
                                <button onClick={() => copyToClipboard("python agent.py", "run")}
                                    className="text-slate-400 hover:text-white text-xs shrink-0 transition">
                                    {copied === "run" ? "✓ 복사됨" : "복사"}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-start gap-2 bg-slate-800 rounded-xl p-3">
                            <span className="text-yellow-400 shrink-0">💡</span>
                            <p className="text-slate-400 text-xs leading-relaxed">
                                POS PC가 켜질 때 자동 실행되도록 작업 스케줄러(Windows) 또는 systemd(Linux)에 등록하면 편리합니다.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* 운영 편의 */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-extrabold text-gray-800">🛠️ 운영 편의 기능</h3>
                </div>
                <div className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-bold text-gray-800 text-sm">직원 주문 입력 허용</p>
                            <p className="text-xs text-gray-500 mt-0.5">테이블 현황판에서 직원이 직접 주문을 넣을 수 있습니다.</p>
                        </div>
                        <ToggleSwitch checked={allowStaffOrder} onChange={setAllowStaffOrder} />
                    </div>
                </div>
            </div>

            {/* 저장 버튼 */}
            <button onClick={handleSaveHardware} disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white py-4 rounded-2xl font-extrabold text-lg shadow-lg transition-all active:scale-95">
                {saving ? "저장 중..." : "설정 저장"}
            </button>
        </div>
    );
}