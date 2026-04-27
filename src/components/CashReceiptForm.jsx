export function CashReceiptForm({ value, onChange, forceEnabled = false }) {
    const set = (patch) => onChange(prev => ({ ...prev, ...patch }));
    const isOpen = forceEnabled || value.enabled;

    return (
        <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
            {!forceEnabled && (
                <label className="flex items-center gap-2 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={value.enabled}
                        onChange={e => set({ enabled: e.target.checked })}
                        className="w-4 h-4 accent-amber-500"
                    />
                    <span className="font-bold text-sm text-gray-700">현금영수증 발급</span>
                </label>
            )}

            {isOpen && (
                <div className="space-y-2.5">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => set({ tradeType: "PERSONAL", identifierType: "phone" })}
                            className={`py-2 rounded-lg text-xs font-bold border transition ${value.tradeType === "PERSONAL" ? "bg-amber-100 border-amber-400 text-amber-700" : "border-gray-200 text-gray-500 bg-white"}`}
                        >
                            소득공제 (개인)
                        </button>
                        <button
                            type="button"
                            onClick={() => set({ tradeType: "BUSINESS", identifierType: "business" })}
                            className={`py-2 rounded-lg text-xs font-bold border transition ${value.tradeType === "BUSINESS" ? "bg-amber-100 border-amber-400 text-amber-700" : "border-gray-200 text-gray-500 bg-white"}`}
                        >
                            지출증빙 (사업자)
                        </button>
                    </div>

                    {value.tradeType === "PERSONAL" && (
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => set({ identifierType: "phone" })}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition ${value.identifierType === "phone" ? "bg-gray-200 border-gray-400 text-gray-800" : "border-gray-200 text-gray-400 bg-white"}`}
                            >
                                휴대폰번호
                            </button>
                            <button
                                type="button"
                                onClick={() => set({ identifierType: "card" })}
                                className={`py-1.5 rounded-lg text-xs font-bold border transition ${value.identifierType === "card" ? "bg-gray-200 border-gray-400 text-gray-800" : "border-gray-200 text-gray-400 bg-white"}`}
                            >
                                현금영수증카드
                            </button>
                        </div>
                    )}

                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder={
                            value.identifierType === "phone" ? "휴대폰번호 (숫자만)" :
                            value.identifierType === "card" ? "현금영수증 카드번호" :
                            "사업자번호 (숫자만, 10자리)"
                        }
                        value={value.identifier}
                        onChange={e => set({ identifier: e.target.value.replace(/\D/g, "") })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                </div>
            )}
        </div>
    );
}
