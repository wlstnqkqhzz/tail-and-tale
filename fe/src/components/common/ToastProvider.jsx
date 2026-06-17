// 공통 Toast Provider

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    // Toast 표시
    const showToast = useCallback(({ title, message, tone = "green" }) => {
        const toastId = Date.now() + Math.random();

        setToasts((prevToasts) => [
            ...prevToasts,
            {
                toastId,
                title,
                message,
                tone,
            },
        ]);

        window.setTimeout(() => {
            setToasts((prevToasts) =>
                prevToasts.filter((toast) => toast.toastId !== toastId)
            );
        }, 3200);
    }, []);

    // Toast 닫기
    const closeToast = useCallback((toastId) => {
        setToasts((prevToasts) =>
            prevToasts.filter((toast) => toast.toastId !== toastId)
        );
    }, []);

    const value = useMemo(() => ({
        showToast,
    }), [showToast]);

    return (
        <ToastContext.Provider value={value}>
            {children}

            <div className="pointer-events-none fixed right-6 top-24 z-[80] grid w-[360px] max-w-[calc(100vw-48px)] gap-3">
                {toasts.map((toast) => (
                    <Toast key={toast.toastId} toast={toast} onClose={closeToast} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있습니다.");
    }

    return context;
}

// Toast UI
function Toast({ toast, onClose }) {
    const toneClassName = toast.tone === "red"
        ? "border-l-red-500"
        : toast.tone === "amber"
            ? "border-l-amber-500"
            : "border-l-emerald-500";

    return (
        <div className={`pointer-events-auto border border-gray-100 border-l-4 bg-white p-4 shadow-xl ${toneClassName}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-950">{toast.title}</p>
                    {toast.message && (
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                            {toast.message}
                        </p>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => onClose(toast.toastId)}
                    className="shrink-0 text-xs font-bold text-gray-400 transition hover:text-gray-950"
                >
                    닫기
                </button>
            </div>
        </div>
    );
}
