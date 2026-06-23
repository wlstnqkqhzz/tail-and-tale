// 반려견 페이지 상수

export const initialForm = {
    name: "",
    breed: "",
    gender: "UNKNOWN",
    birthDate: "",
    weight: "",
    size: "",
    personality: "",
    profileImageUrl: "",
    isNeutered: false,
    note: "",
};

export const MAX_DOG_WEIGHT = 999.99;
export const MAX_DOG_IMAGE_SIZE = 5 * 1024 * 1024;
export const WALK_CREATE_NOTICE_KEY = "walkCreateAccessNotice";
export const WALK_CREATE_NOTICE_LOCK_KEY = "walkCreateAccessNoticeLock";
