import api from "./axios";

// 반려견 등록
export const registerDog = (data) => {
    return api.post("/api/dogs", data);
};

// 내 반려견 목록 조회
export const getDogs = () => {
    return api.get("/api/dogs");
};

// 내 반려견 상세 조회
export const getDog = (dogId) => {
    return api.get(`/api/dogs/${dogId}`);
};

// 반려견 정보 수정
export const updateDog = (dogId, data) => {
    return api.patch(`/api/dogs/${dogId}`, data);
};

// 반려견 이미지 업로드
export const uploadDogImage = (image) => {
    const formData = new FormData();

    formData.append("image", image);

    return api.post("/api/dogs/images", formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
};

// 반려견 삭제
export const deleteDog = (dogId) => {
    return api.delete(`/api/dogs/${dogId}`);
};

// 반려견 인증
export const verifyDog = (dogId, data) => {
    return api.post(`/api/dogs/${dogId}/verify`, data);
};
