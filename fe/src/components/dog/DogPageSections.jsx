// 반려견 화면 컴포넌트

import { useState } from "react";
import { resolveImageUrl } from "../../utils/dogPage";

export function DogImagePreview({ imageUrl, name }) {
    const [hasImageError, setHasImageError] = useState(false);
    const resolvedImageUrl = resolveImageUrl(imageUrl);
    const hasImage = resolvedImageUrl && !hasImageError;

    return (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-3xl bg-gray-100 text-2xl font-bold text-gray-500">
            {hasImage ? (
                <img
                    src={resolvedImageUrl}
                    alt={name || "반려견 이미지"}
                    onError={() => setHasImageError(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span>{name?.slice(0, 1) || "D"}</span>
            )}
        </div>
    );
}

// 반려견 이미지
export function DogAvatar({ dog, className }) {
    const [hasImageError, setHasImageError] = useState(false);
    const imageUrl = resolveImageUrl(dog.profileImageUrl);
    const hasImage = imageUrl && !hasImageError;

    return (
        <div className={`flex shrink-0 items-center justify-center overflow-hidden bg-gray-100 font-bold text-gray-500 ${className}`}>
            {hasImage ? (
                <img
                    src={imageUrl}
                    alt={dog.name}
                    onError={() => setHasImageError(true)}
                    className="h-full w-full object-cover"
                />
            ) : (
                <span>{dog.name?.slice(0, 1) || "D"}</span>
            )}
        </div>
    );
}

// 이미지 URL 보정


// 상세 정보 항목
export function DetailItem({ label, value }) {
    return (
        <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-400">{label}</p>
            <p className="mt-2 break-words text-sm font-medium text-gray-800">{value}</p>
        </div>
    );
}

// 인증 뱃지
export function VerifiedBadge() {
    return (
        <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
            인증
        </span>
    );
}
