import { useState, useRef, useEffect } from "react";

export default function InfoTooltip({ text }) {
    const [visible, setVisible] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!visible) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setVisible(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [visible]);

    return (
        <span ref={ref} className="relative inline-flex items-center ml-1.5 align-middle">
            <button
                type="button"
                className="w-[18px] h-[18px] rounded-full border border-gray-300 text-gray-400 text-[11px] font-bold leading-none flex items-center justify-center hover:border-gray-500 hover:text-gray-600 transition-colors focus:outline-none"
                onMouseEnter={() => setVisible(true)}
                onMouseLeave={() => setVisible(false)}
                onClick={() => setVisible(v => !v)}
                aria-label="도움말"
            >
                ?
            </button>
            {visible && (
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 bg-gray-800 text-white text-xs rounded-xl px-3 py-2.5 shadow-xl leading-relaxed whitespace-pre-wrap pointer-events-none">
                    {text}
                    <span className="absolute top-full left-1/2 -translate-x-1/2 border-[5px] border-transparent border-t-gray-800" />
                </span>
            )}
        </span>
    );
}
