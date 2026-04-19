import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config";
import toast from "react-hot-toast";

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

    const isHQ = ["SUPER_ADMIN", "BRAND_ADMIN", "GROUP_ADMIN"].includes(user?.role); 

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
                    use_table_board: useTableBoard
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
                                    checked={useTableBoard} // ✨ storeForm 대신 개별 상태값(useTableBoard) 연결!
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
    const [editingTableId, setEditingTableId] = useState(null);
    const [editingName, setEditingName] = useState("");
    const [zoomQrTable, setZoomQrTable] = useState(null);

    const handleCreateTable = async () => {
        if (!newTableName) return;
        try {
            await axios.post(`${API_BASE_URL}/stores/${store.id}/tables/`, { name: newTableName }, { headers: { Authorization: `Bearer ${token}` } });
            setNewTableName(""); fetchStore();
        } catch (err) { toast.error("테이블 생성 실패"); }
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

    const getQrImageUrl = (token, size = 150) => {
        const targetUrl = `${window.location.protocol}//${window.location.host}/order/${token}`;
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

    return (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 pb-20">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">🪑 테이블 & QR 관리</h2>
                <div className="flex gap-2">
                    <input className="border p-2 rounded w-40" placeholder="테이블명 (예: 1번)" value={newTableName} onChange={e=>setNewTableName(e.target.value)} />
                    <button onClick={handleCreateTable} className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700">추가</button>
                </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {store.tables?.map(table => (
                    <div key={table.id} className="border-2 border-gray-200 rounded-xl p-4 flex flex-col items-center hover:border-indigo-300 transition bg-white shadow-sm">
                        <div className="w-24 h-24 bg-gray-100 mb-3 cursor-zoom-in overflow-hidden rounded-lg border" onClick={() => setZoomQrTable(table)}>
                            <img src={getQrImageUrl(table.qr_token)} alt="QR Code" className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                        </div>
                        {editingTableId === table.id ? (
                            <div className="flex gap-1 w-full mb-2">
                                <input className="border p-1 text-xs w-full rounded text-center" value={editingName} onChange={e=>setEditingName(e.target.value)} autoFocus />
                                <button onClick={()=>saveEdit(table.id)} className="bg-blue-500 text-white px-1 rounded text-xs">V</button>
                                <button onClick={()=>setEditingTableId(null)} className="bg-gray-300 text-gray-700 px-1 rounded text-xs">X</button>
                            </div>
                        ) : (
                            <h3 className="font-bold text-lg mb-2 flex items-center gap-1 cursor-pointer hover:text-indigo-600" onClick={()=>startEdit(table)}>
                                {table.name} <span className="text-xs text-gray-400">✏️</span>
                            </h3>
                        )}
                        <div className="flex justify-between w-full mt-auto pt-2 border-t gap-2">
                            <button onClick={()=>handleDeleteTable(table.id)} className="text-red-400 text-xs hover:text-red-600 hover:underline">삭제</button>
                            <button onClick={()=>setZoomQrTable(table)} className="text-indigo-500 text-xs hover:text-indigo-700 font-bold">QR 확대</button>
                        </div>
                    </div>
                ))}
                {store.tables?.length === 0 && <div className="col-span-full text-center py-10 text-gray-400">등록된 테이블이 없습니다.</div>}
            </div>

            {zoomQrTable && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setZoomQrTable(null)}>
                    <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-extrabold text-gray-800 mb-2">{zoomQrTable.name}</h3>
                        <p className="text-gray-500 mb-6 text-sm">QR코드를 스캔하여 주문하세요</p>
                        <div className="p-4 border-4 border-black rounded-xl mb-6 bg-white">
                            <img src={getQrImageUrl(zoomQrTable.qr_token, 300)} alt="Large QR" className="w-64 h-64" />
                        </div>
                        <div className="flex gap-3 w-full">
                            <button onClick={() => handleDownloadQR(zoomQrTable)} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md flex items-center justify-center gap-2">📥 QR 저장</button>
                            <button onClick={() => setZoomQrTable(null)} className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300">닫기</button>
                        </div>
                        <p className="mt-4 text-xs text-gray-400 text-center">파일명: {new Date().toISOString().slice(0,10)}_{store.name}_{zoomQrTable.name}.png</p>
                    </div>
                </div>
            )}
        </div>
    );
}

// 5. 상세 매출 리포트 관리 (일별/월별/시간대별/메뉴별/객단가 분석)
export function AdminSales({ store, token }) {
    // 기본 검색 기간을 '최근 7일'로 자동 셋팅합니다.
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().slice(0, 10);
    });
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [stats, setStats] = useState(null);
    const [activeTab, setActiveTab] = useState("daily"); // daily, monthly, hourly, menu

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/stats?start_date=${startDate}&end_date=${endDate}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (err) { toast.error("매출 데이터를 불러오는데 실패했습니다."); }
    };

    useEffect(() => { fetchStats(); }, [startDate, endDate]);

    return (
        <div className="space-y-6 pb-20 animate-fadeIn">
            {/* 1. 검색 바 */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800">💰 상세 매출 리포트</h2>
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 p-2 rounded-xl">
                    <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} className="bg-white px-2 py-1 rounded-lg font-bold text-gray-700 outline-none border border-gray-200" />
                    <span className="text-gray-400 font-bold">~</span>
                    <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} className="bg-white px-2 py-1 rounded-lg font-bold text-gray-700 outline-none border border-gray-200" />
                    <button onClick={fetchStats} className="bg-slate-800 text-white px-4 py-1.5 rounded-lg text-sm font-bold ml-2 hover:bg-black transition shadow-sm">조회</button>
                </div>
            </div>

            {stats ? (
                <>
                    {/* 2. 핵심 지표 요약 (객단가 포함) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
                            <p className="text-indigo-200 font-bold mb-1 text-sm">해당 기간 총 매출액</p>
                            <p className="text-3xl font-black">{stats.total_revenue.toLocaleString()}원</p>
                            <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-10">💵</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                            <p className="text-gray-500 font-bold mb-1 text-sm">해당 기간 총 주문건수</p>
                            <p className="text-3xl font-black text-gray-800">{stats.order_count}건</p>
                            <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-[0.03]">🧾</span>
                        </div>
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 relative overflow-hidden">
                            <p className="text-gray-500 font-bold mb-1 text-sm flex items-center gap-1">
                                1건당 평균 결제액 (객단가) 
                                <span className="text-[10px] bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-md">중요</span>
                            </p>
                            <p className="text-3xl font-black text-indigo-600">{stats.average_order_value.toLocaleString()}원</p>
                            <span className="absolute right-[-10px] bottom-[-20px] text-7xl opacity-[0.03]">👥</span>
                        </div>
                    </div>

                    {/* 3. 상세 분석 탭 (Tab) 영역 */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto scrollbar-hide">
                            <button onClick={()=>setActiveTab("daily")} className={`flex-1 py-4 font-bold text-sm transition whitespace-nowrap px-4 ${activeTab==="daily" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}>📅 일별 매출</button>
                            <button onClick={()=>setActiveTab("monthly")} className={`flex-1 py-4 font-bold text-sm transition whitespace-nowrap px-4 ${activeTab==="monthly" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}>🗓️ 월별 매출</button>
                            <button onClick={()=>setActiveTab("hourly")} className={`flex-1 py-4 font-bold text-sm transition whitespace-nowrap px-4 ${activeTab==="hourly" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}>⏰ 시간대별</button>
                            <button onClick={()=>setActiveTab("menu")} className={`flex-1 py-4 font-bold text-sm transition whitespace-nowrap px-4 ${activeTab==="menu" ? "text-indigo-600 bg-white border-b-2 border-indigo-600" : "text-gray-500 hover:bg-gray-100"}`}>🍔 메뉴별 분석</button>
                        </div>

                        <div className="p-6 min-h-[400px]">
                            {/* --- 📅 일별 매출 탭 --- */}
                            {activeTab === "daily" && (
                                <div className="animate-fadeIn">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 text-gray-500 text-sm">
                                                <th className="pb-3 font-bold w-1/3">날짜</th>
                                                <th className="pb-3 font-bold text-right w-1/3">결제 건수</th>
                                                <th className="pb-3 font-bold text-right w-1/3">매출액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.daily_stats.map((d, i) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-indigo-50/30 transition">
                                                    <td className="py-4 font-bold text-gray-800">{d.date}</td>
                                                    <td className="py-4 text-right text-gray-600 font-medium">{d.count}건</td>
                                                    <td className="py-4 text-right font-black text-indigo-600">{d.sales.toLocaleString()}원</td>
                                                </tr>
                                            ))}
                                            {stats.daily_stats.length === 0 && <tr><td colSpan="3" className="text-center py-10 text-gray-400 font-bold">해당 기간의 매출이 없습니다.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* --- 🗓️ 월별 매출 탭 --- */}
                            {activeTab === "monthly" && (
                                <div className="animate-fadeIn">
                                    <table className="w-full text-left">
                                        <thead>
                                            <tr className="border-b-2 border-gray-200 text-gray-500 text-sm">
                                                <th className="pb-3 font-bold w-1/3">월 (Month)</th>
                                                <th className="pb-3 font-bold text-right w-1/3">결제 건수</th>
                                                <th className="pb-3 font-bold text-right w-1/3">매출액</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {stats.monthly_stats.map((m, i) => (
                                                <tr key={i} className="border-b border-gray-100 hover:bg-indigo-50/30 transition">
                                                    <td className="py-4 font-bold text-gray-800">{m.month}</td>
                                                    <td className="py-4 text-right text-gray-600 font-medium">{m.count}건</td>
                                                    <td className="py-4 text-right font-black text-indigo-600">{m.sales.toLocaleString()}원</td>
                                                </tr>
                                            ))}
                                            {stats.monthly_stats.length === 0 && <tr><td colSpan="3" className="text-center py-10 text-gray-400 font-bold">해당 기간의 매출이 없습니다.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* --- ⏰ 시간대별 매출 탭 --- */}
                            {activeTab === "hourly" && (
                                <div className="animate-fadeIn space-y-3 pr-2 max-h-[300px] xl:max-h-[400px] overflow-y-auto">
                                    <div className="flex justify-end mb-2">
                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">※ 피크타임(인력 배치) 확인용</span>
                                    </div>
                                    {stats.hourly_stats.map((h, idx) => {
                                        // 해당 기간 동안 매출이 발생한 가장 높은 시간대의 금액을 100%로 잡습니다.
                                        const maxSales = Math.max(...stats.hourly_stats.map(s => s.sales)) || 1;
                                        const percent = (h.sales / maxSales) * 100;
                                        const isPeak = percent > 80; // 상위 80% 이상은 피크타임으로 표시

                                        return (
                                            <div key={idx} className="flex items-center gap-3 text-sm group">
                                                <span className="w-12 font-bold text-gray-500 text-right">{h.hour}시</span>
                                                <div className="flex-1 h-6 bg-gray-100 rounded-md overflow-hidden relative">
                                                    <div className={`h-full transition-all duration-1000 ease-out ${isPeak ? 'bg-red-400' : 'bg-indigo-400'}`} style={{ width: `${percent}%` }}></div>
                                                </div>
                                                <span className={`w-24 text-right font-bold ${isPeak ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {h.sales.toLocaleString()}원
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* --- 🍔 메뉴별 분석 탭 --- */}
                            {activeTab === "menu" && (
                                <div className="animate-fadeIn space-y-4 max-h-[300px] xl:max-h-[400px] overflow-y-auto pr-2">
                                    <div className="flex justify-end mb-2">
                                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">※ 매출액 기준 내림차순</span>
                                    </div>
                                    {stats.menu_stats.map((m, idx) => (
                                        <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-indigo-200 transition">
                                            <div className="flex items-center gap-4">
                                                <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-sm ${idx === 0 ? 'bg-yellow-400 text-white' : idx === 1 ? 'bg-gray-300 text-white' : idx === 2 ? 'bg-orange-300 text-white' : 'bg-white text-gray-400 border border-gray-200'}`}>
                                                    {idx+1}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-gray-800 text-base">{m.name}</p>
                                                    <p className="text-xs text-gray-500 mt-0.5">{m.count}개 팔림</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-black text-lg text-indigo-700">{m.revenue.toLocaleString()}원</span>
                                            </div>
                                        </div>
                                    ))}
                                    {stats.menu_stats.length === 0 && <p className="text-center text-gray-400 py-10 font-bold">결제된 메뉴가 없습니다.</p>}
                                </div>
                            )}
                        </div>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                    <span className="text-4xl mb-4 animate-spin">⏳</span>
                    <p className="font-bold">데이터를 집계하고 있습니다...</p>
                </div>
            )}
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
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // ✨ 취소 방식 선택 모달용 상태 (새로 추가됨)
    const [cancelActionOrder, setCancelActionOrder] = useState(null);
    // 메뉴별 부분 취소 모달용 상태
    const [cancelModal, setCancelModal] = useState({ isOpen: false, order: null, selectedItemIds: [], reason: "" });

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/stores/${store.id}/orders/history`, { headers: { Authorization: `Bearer ${token}` } });
            setOrders(res.data);
        } catch (err) { toast.error("주문 내역을 불러오지 못했습니다."); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchOrders(); }, []);

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

    return (
        // ✨ 1. h-full, flex-col, overflow-hidden을 사용하여 바깥쪽 브라우저의 이중 스크롤을 완벽 차단합니다.
        <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-gray-200 animate-fadeIn h-[calc(100vh-120px)] flex flex-col overflow-hidden">
            
            {/* 상단 헤더 영역 (shrink-0으로 고정하여 찌그러지지 않게 방어) */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🧾 주문 및 결제 내역 (환불 처리)</h2>
                <button onClick={fetchOrders} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-bold hover:bg-gray-200 flex items-center gap-2 transition">
                    🔄 새로고침
                </button>
            </div>

            {/* ✨ 2. flex-1과 overflow-auto를 적용하여 '표 내부에서만' 예쁘게 스크롤되도록 만듭니다. */}
            <div className="flex-1 overflow-auto border border-gray-200 rounded-xl relative bg-white">
                
                {/* ✨ 3. 표 최소 너비를 700px로 확 줄여서 웬만한 화면에선 가로 스크롤 없이 꽉 차게 변경! */}
                <table className="w-full text-left border-collapse min-w-[700px]">
                    {/* ✨ 4. sticky 속성으로 스크롤을 내려도 테이블 헤더(분류명)가 항상 상단에 고정됩니다. */}
                    <thead className="sticky top-0 z-10 shadow-sm">
                        <tr className="bg-slate-900 text-white text-sm">
                            <th className="p-3 font-bold w-24 text-center">주문일시</th>
                            <th className="p-3 font-bold w-20 text-center">대기번호</th>
                            <th className="p-3 font-bold w-24 text-center">테이블</th>
                            <th className="p-3 font-bold">주문 메뉴</th>
                            <th className="p-3 font-bold w-24 text-right">결제 금액</th>
                            <th className="p-3 font-bold w-20 text-center">상태</th>
                            <th className="p-3 font-bold w-28 text-center">취소 관리</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="7" className="text-center py-10 font-bold text-gray-400">데이터를 불러오는 중입니다...</td></tr> : null}
                        {!loading && orders.map(o => {
                            const cancelledAmt = o.items?.filter(i => i.is_cancelled).reduce((sum, i) => sum + (i.price * i.quantity), 0) || 0;
                            const finalAmt = o.total_price - cancelledAmt;

                            return (
                                <tr key={o.id} className={`border-b border-gray-100 transition ${o.payment_status === "CANCELLED" ? "bg-red-50/30 opacity-70" : "hover:bg-gray-50"}`}>
                                    <td className="p-3 text-center text-xs text-gray-500 font-medium">
                                        {new Date(o.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-3 text-center font-black text-gray-800 text-base">{o.daily_number}번</td>
                                    <td className="p-3 text-center font-bold text-indigo-600 text-sm">{o.table_name}</td>
                                    
                                    <td className="p-3 text-sm font-bold text-gray-700">
                                        <div className="flex flex-col gap-0.5 max-h-24 overflow-y-auto pr-1">
                                            {o.items?.map(i => (
                                                <span key={i.id} className={i.is_cancelled ? "line-through text-red-400 font-medium" : "truncate"}>
                                                    {i.menu_name} <span className="text-xs text-gray-400">x{i.quantity}</span>
                                                </span>
                                            ))}
                                        </div>
                                    </td>

                                    <td className="p-3 text-right">
                                        {o.payment_status === "PARTIAL_CANCELLED" ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-400 line-through text-[11px] font-normal">{o.total_price.toLocaleString()}원</span>
                                                <span className="font-black text-red-600">{finalAmt.toLocaleString()}원</span>
                                                <span className="text-[10px] text-yellow-600">(-{cancelledAmt.toLocaleString()}원)</span>
                                            </div>
                                        ) : o.payment_status === "CANCELLED" ? (
                                            <div className="flex flex-col items-end">
                                                <span className="text-gray-400 line-through text-xs font-normal">{o.total_price.toLocaleString()}원</span>
                                                <span className="font-black text-red-600">0원</span>
                                            </div>
                                        ) : (
                                            <span className="font-black text-gray-900">{o.total_price.toLocaleString()}원</span>
                                        )}
                                    </td>

                                    <td className="p-3 text-center">
                                        {o.payment_status === "PAID" && <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-[11px] font-bold shadow-sm">결제완료</span>}
                                        {o.payment_status === "CANCELLED" && <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-[11px] font-bold shadow-sm">전체취소</span>}
                                        {o.payment_status === "PARTIAL_CANCELLED" && <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-[11px] font-bold shadow-sm">부분취소</span>}
                                    </td>
                                    
                                    <td className="p-3 text-center">
                                        <button 
                                            onClick={() => setCancelActionOrder(o)} 
                                            disabled={o.payment_status === "CANCELLED"}
                                            className="bg-red-50 hover:bg-red-500 hover:text-white disabled:bg-gray-100 disabled:text-gray-400 disabled:border-transparent border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition shadow-sm"
                                        >
                                            {o.payment_status === "CANCELLED" ? "취소불가" : "결제 취소"}
                                        </button>
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
        </div>
    );
}