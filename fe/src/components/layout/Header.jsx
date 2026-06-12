// 공통 헤더 컴포넌트

import { logoutUser } from "../../utils/auth";
import { useAuth } from "../../hooks/useAuth";
import { useDropdown } from "../../hooks/useDropdown";

export default function Header({ onLoginClick }) {
    const { isLoading, isLoggedIn, member } = useAuth();
    const { isOpen: isDropdownOpen, setIsOpen: setIsDropdownOpen, dropdownRef,} = useDropdown();

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-gray-100 bg-white">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
                <div className="cursor-pointer text-2xl font-bold">
                    Tail & Tale
                </div>

                <div className="flex h-10 w-32 items-center justify-end">
                    {isLoading ? (
                        <div className="h-10 w-28" />
                    ) : isLoggedIn ? (
                        <div ref={dropdownRef} className="relative">
                            <button
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex h-10 min-w-28 items-center justify-center gap-2 rounded-full border border-gray-300 px-5 text-sm font-medium transition hover:bg-gray-100"
                            >
                                {member?.nickname}님
                                <span className={`text-xs transition-transform duration-200 ${
                                        isDropdownOpen ? "rotate-180" : ""
                                    }`}
                                >
                                    ▼
                                </span>
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute right-0 mt-3 w-44 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl animate-[dropdownFadeIn_0.15s_ease-out]">
                                    <button className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50">
                                        마이페이지
                                    </button>

                                    <button className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50">
                                        내 반려견
                                    </button>

                                    <div className="h-px bg-gray-100" />

                                    <button
                                        onClick={logoutUser}
                                        className="block w-full px-5 py-3 text-left text-sm text-red-500 hover:bg-red-50"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <button
                            onClick={onLoginClick}
                            className="flex h-10 w-28 items-center justify-center rounded-full border border-gray-300 text-sm font-medium transition hover:bg-gray-100"
                        >
                            시작하기
                        </button>
                    )}
                </div>
            </div>
        </header>
    );
}