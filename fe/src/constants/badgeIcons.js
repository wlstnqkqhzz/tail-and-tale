// 뱃지 아이콘 매핑

const adminVerifiedIcon = new URL("../assets/icons/badges/admin-verified.svg", import.meta.url).href;
const careKeeperIcon = new URL("../assets/icons/badges/care-keeper.svg", import.meta.url).href;
const firstWalkIcon = new URL("../assets/icons/badges/first-walk.svg", import.meta.url).href;
const reviewStarIcon = new URL("../assets/icons/badges/review-star.svg", import.meta.url).href;
const trustedWalkerIcon = new URL("../assets/icons/badges/trusted-walker.svg", import.meta.url).href;

export const BADGE_ICONS = {
    FIRST_WALK: firstWalkIcon,
    TRUSTED_WALKER: trustedWalkerIcon,
    CARE_KEEPER: careKeeperIcon,
    REVIEW_STAR: reviewStarIcon,
    ADMIN_VERIFIED: adminVerifiedIcon,
};

export function getBadgeIcon(code) {
    return BADGE_ICONS[code] || null;
}

export function getBadgeFallbackLabel(name) {
    return name?.slice(0, 1) || "B";
}
