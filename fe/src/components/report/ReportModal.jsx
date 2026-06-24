import { useEffect, useState } from "react";

const reportReasonOptions = [
    { value: "MONEY_TRADE", label: "금전 거래" },
    { value: "STALKING", label: "스토킹" },
    { value: "SEXUAL_CONTENT", label: "음란물" },
    { value: "BAD_MANNER", label: "비매너" },
    { value: "ETC", label: "기타" },
];

export default function ReportModal({
    isOpen,
    targetLabel,
    isSubmitting,
    onClose,
    onSubmit,
}) {
    const [reason, setReason] = useState("BAD_MANNER");
    const [content, setContent] = useState("");

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        setReason("BAD_MANNER");
        setContent("");
    }, [isOpen]);

    if (!isOpen) {
        return null;
    }

    const handleSubmit = (event) => {
        event.preventDefault();

        if (reason === "ETC" && !content.trim()) {
            alert("기타 신고 사유는 상세 내용을 입력해주세요.");
            return;
        }

        onSubmit({
            reason,
            content: content.trim() || null,
        });
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-6"
            onClick={(event) => event.stopPropagation()}
        >
            <div
                className="w-full max-w-lg border border-gray-200 bg-white p-7 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold tracking-[0.35em] text-emerald-700">REPORT</p>
                        <h2 className="mt-3 text-2xl font-bold text-gray-950">신고하기</h2>
                        <p className="mt-2 text-sm leading-6 text-gray-500">
                            {targetLabel || "선택한 대상"}에 대한 신고 사유를 선택해주세요.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="h-9 w-9 border border-gray-200 text-lg text-gray-400 transition hover:border-black hover:text-black"
                        aria-label="신고 창 닫기"
                    >
                        x
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 grid gap-5">
                    <div>
                        <label className="text-sm font-bold text-gray-700">신고 사유</label>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                            {reportReasonOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setReason(option.value)}
                                    className={`h-11 border px-3 text-sm font-bold transition ${
                                        reason === option.value
                                            ? "border-black bg-black text-white"
                                            : "border-gray-200 text-gray-600 hover:border-gray-400"
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-bold text-gray-700">상세 내용</label>
                        <textarea
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            maxLength={1000}
                            className="mt-3 min-h-32 w-full resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                            placeholder="신고 사유를 구체적으로 입력해주세요."
                        />
                        <p className="mt-2 text-xs text-gray-400">{content.length}/1000</p>
                    </div>

                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
                        >
                            취소
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 bg-black px-6 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            {isSubmitting ? "신고 중..." : "신고 접수"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
