// 커뮤니티 게시글 이미지 업로더

import { uploadCommunityPostImage } from "../../api/community";

const MAX_IMAGE_COUNT = 5;

export default function CommunityImageUploader({ images, onChange, disabled = false }) {
    const handleUpload = async (event) => {
        const selectedFiles = Array.from(event.target.files || []);

        if (selectedFiles.length === 0) {
            return;
        }

        if (images.length + selectedFiles.length > MAX_IMAGE_COUNT) {
            alert(`이미지는 최대 ${MAX_IMAGE_COUNT}장까지 첨부할 수 있습니다.`);
            event.target.value = "";
            return;
        }

        try {
            const uploadedImages = [];

            for (const file of selectedFiles) {
                const formData = new FormData();
                formData.append("image", file);

                const response = await uploadCommunityPostImage(formData);
                uploadedImages.push(response.data);
            }

            onChange([...images, ...uploadedImages]);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "이미지 업로드에 실패했습니다.");
        } finally {
            event.target.value = "";
        }
    };

    const handleRemove = (targetIndex) => {
        onChange(images.filter((_, index) => index !== targetIndex));
    };

    return (
        <div className="grid gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-sm font-bold text-gray-700">이미지 첨부</p>
                    <p className="mt-1 text-xs text-gray-400">jpg, jpeg, png, webp 파일을 최대 5장까지 첨부할 수 있습니다.</p>
                </div>

                <label className={`inline-flex h-10 cursor-pointer items-center border px-4 text-sm font-bold transition ${
                    disabled || images.length >= MAX_IMAGE_COUNT
                        ? "cursor-not-allowed border-gray-100 text-gray-300"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}>
                    이미지 선택
                    <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        multiple
                        disabled={disabled || images.length >= MAX_IMAGE_COUNT}
                        onChange={handleUpload}
                        className="hidden"
                    />
                </label>
            </div>

            {images.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                    {images.map((image, index) => (
                        <div key={`${image.imageUrl}-${index}`} className="group relative overflow-hidden border border-gray-200 bg-gray-50">
                            <img
                                src={image.imageUrl}
                                alt={image.originalFileName || `게시글 이미지 ${index + 1}`}
                                className="aspect-square w-full object-cover"
                            />
                            <div className="absolute left-2 top-2 bg-black px-2 py-1 text-xs font-bold text-white">
                                {index === 0 ? "대표" : index + 1}
                            </div>
                            <button
                                type="button"
                                onClick={() => handleRemove(index)}
                                disabled={disabled}
                                className="absolute right-2 top-2 h-7 w-7 bg-white text-sm font-bold text-red-500 shadow transition hover:bg-red-50 disabled:cursor-not-allowed disabled:text-gray-300"
                                aria-label="이미지 삭제"
                            >
                                x
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
