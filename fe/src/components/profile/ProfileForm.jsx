// 마이페이지 프로필 수정 폼

import RegionSelect from "../common/RegionSelect";

export function ProfileForm({ form, isSubmitting, isWithdrawing, onChange, onSubmit, onWithdraw }) {
    return (
        <form onSubmit={onSubmit} className="h-fit border border-gray-200 p-6">
            <div className="mb-6">
                <p className="text-sm font-bold tracking-[0.3em] text-gray-400">PROFILE</p>
                <h2 className="mt-3 text-2xl font-bold text-gray-950">내 정보 수정</h2>
            </div>

            <div className="grid gap-4">
                <Field label="실명">
                    <input name="realName"
                        value={form.realName}
                        disabled
                        className="h-12 border border-gray-200 bg-gray-100 px-4 text-sm text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs font-normal text-gray-400">
                        실명은 가입 후 변경할 수 없습니다.
                    </p>
                </Field>

                <Field label="닉네임">
                    <input name="nickname"
                        value={form.nickname}
                        onChange={onChange}
                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                        placeholder="닉네임을 입력해주세요"
                    />
                </Field>

                <Field label="전화번호">
                    <input name="phoneNumber"
                        value={form.phoneNumber}
                        onChange={onChange}
                        className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                        placeholder="01012345678"
                    />
                </Field>

                <Field label="거주 지역">
                    <RegionSelect
                        value={form.region}
                        onChange={(region) => onChange({ target: { name: "region", value: region } })}
                    />
                </Field>

                <Field label="자기소개">
                    <textarea name="introduction"
                        value={form.introduction}
                        onChange={onChange}
                        className="min-h-28 resize-none border border-gray-200 px-4 py-3 text-sm leading-6 outline-none transition focus:border-black"
                        placeholder="간단한 자기소개를 입력해주세요"
                    />
                </Field>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 h-12 w-full bg-black text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
                {isSubmitting ? "저장 중..." : "정보 저장"}
            </button>

            <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="text-xs leading-5 text-gray-400">
                    탈퇴 시 계정 상태가 탈퇴로 전환되며, 이후 로그인할 수 없습니다.
                </p>
                <button
                    type="button"
                    onClick={onWithdraw}
                    disabled={isWithdrawing}
                    className="mt-3 h-11 w-full border border-red-100 text-sm font-bold text-red-500 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-300"
                >
                    {isWithdrawing ? "탈퇴 처리 중..." : "회원 탈퇴"}
                </button>
            </div>
        </form>
    );
}

// 요약 카드 그리드

function Field({ label, children }) {
    return (
        <label className="grid gap-2 text-sm font-bold text-gray-700">
            {label}
            {children}
        </label>
    );
}

// 작은 정보
