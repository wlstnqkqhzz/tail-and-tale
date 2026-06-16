import { formatParticipantStatus, formatScheduleStatus } from "../../utils/walkFormat";

// 산책 상태 뱃지
export function StatusBadge({ status, type = "schedule" }) {
    const label = type === "participant" ? formatParticipantStatus(status) : formatScheduleStatus(status);
    const className = getStatusBadgeClass(status);

    return (
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
            {label}
        </span>
    );
}

// 산책 보조 정보 뱃지
export function InfoBadge({ label, tone = "gray" }) {
    const toneClass = {
        gray: "bg-gray-100 text-gray-600",
        green: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
        blue: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
        amber: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
    }[tone];

    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${toneClass}`}>
            {label}
        </span>
    );
}

function getStatusBadgeClass(status) {
    if (status === "OPEN" || status === "APPROVED") {
        return "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100";
    }

    if (status === "REQUESTED") {
        return "bg-blue-50 text-blue-600 ring-1 ring-blue-100";
    }

    if (status === "CLOSED") {
        return "bg-amber-50 text-amber-600 ring-1 ring-amber-100";
    }

    if (status === "CANCELED" || status === "REJECTED") {
        return "bg-red-50 text-red-500 ring-1 ring-red-100";
    }

    return "bg-gray-100 text-gray-600";
}
