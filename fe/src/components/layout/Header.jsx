// 공통 헤더 컴포넌트

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getNotifications, readAllNotifications, readNotification, readTargetNotifications } from "../../api/notification";
import { logoutUser } from "../../utils/auth";
import { useAuth } from "../../hooks/useAuth";
import { useDropdown } from "../../hooks/useDropdown";
import { getAccessToken } from "../../utils/token";
import { createNotificationStompClient } from "../../utils/stompClient";
import { useToast } from "../common/ToastProvider";

export default function Header({ onLoginClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isLoading, isLoggedIn, member } = useAuth();
    const { showToast } = useToast();
    const notificationStompClientRef = useRef(null);
    const {
        isOpen: isDropdownOpen,
        setIsOpen: setIsDropdownOpen,
        dropdownRef,
    } = useDropdown();
    const {
        isOpen: isNotificationOpen,
        setIsOpen: setIsNotificationOpen,
        dropdownRef: notificationDropdownRef,
    } = useDropdown();

    // 알림 상태
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isNotificationLoading, setIsNotificationLoading] = useState(false);

    // 알림 목록 조회
    const fetchNotifications = useCallback(async () => {
        if (!isLoggedIn) {
            return;
        }

        try {
            setIsNotificationLoading(true);

            const response = await getNotifications();

            setNotifications(response.data.notifications);
            setUnreadCount(response.data.unreadCount);
        } catch (error) {
            console.error(error);
        } finally {
            setIsNotificationLoading(false);
        }
    }, [isLoggedIn]);

    // 로그인 후 알림 조회
    useEffect(() => {
        if (!isLoggedIn) {
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        fetchNotifications();
    }, [fetchNotifications, isLoggedIn]);

    // 실시간 알림 구독
    useEffect(() => {
        const accessToken = getAccessToken();

        if (!isLoggedIn || !member?.memberId || member.status === "PENDING" || !accessToken) {
            notificationStompClientRef.current?.disconnect();
            notificationStompClientRef.current = null;
            return;
        }

        notificationStompClientRef.current = createNotificationStompClient({
            memberId: member.memberId,
            accessToken,
            onNotification: (notification) => {
                setNotifications((prevNotifications) => {
                    const alreadyExists = prevNotifications.some((prevNotification) =>
                        prevNotification.notificationId === notification.notificationId
                    );

                    if (alreadyExists) {
                        return prevNotifications;
                    }

                    return [notification, ...prevNotifications];
                });
                setUnreadCount((prevUnreadCount) => prevUnreadCount + 1);
                showToast({
                    title: notification.title,
                    message: notification.content,
                });
            },
            onError: (message) => {
                console.error(message);
            },
        });

        return () => {
            notificationStompClientRef.current?.disconnect();
            notificationStompClientRef.current = null;
        };
    }, [isLoggedIn, member?.memberId, member?.status, showToast]);

    // 페이지 이동
    const movePage = (path) => {
        setIsDropdownOpen(false);
        setIsNotificationOpen(false);
        navigate(path);
    };

    // 알림 드롭다운 열기
    const toggleNotification = async () => {
        const nextOpen = !isNotificationOpen;

        setIsNotificationOpen(nextOpen);
        setIsDropdownOpen(false);

        if (nextOpen) {
            await fetchNotifications();
        }
    };

    // 알림 클릭
    const handleNotificationClick = async (notification) => {
        try {
            if (notification.targetType === "CHAT_ROOM") {
                await readTargetNotifications(notification.targetType, notification.targetId);
            } else if (!notification.isRead) {
                await readNotification(notification.notificationId);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsNotificationOpen(false);
            await fetchNotifications();
            navigate(getNotificationTargetPath(notification));
        }
    };

    // 전체 읽음 처리
    const handleReadAll = async () => {
        try {
            await readAllNotifications();
            await fetchNotifications();
        } catch (error) {
            console.error(error);
            alert("알림 읽음 처리에 실패했습니다.");
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-20 border-b border-gray-100 bg-white">
            <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-8">
                <div className="flex items-center gap-10">
                    <div
                        onClick={() => navigate("/")}
                        className="cursor-pointer text-2xl font-bold"
                    >
                        Tail & Tale
                    </div>

                    {isLoggedIn && (
                        <nav className="hidden items-center gap-6 md:flex">
                            <HeaderNavButton
                                label="산책"
                                path="/walks"
                                isActive={location.pathname.startsWith("/walks")}
                                onClick={movePage}
                            />
                            <HeaderNavButton
                                label="커뮤니티"
                                path="/community"
                                isActive={location.pathname.startsWith("/community")}
                                onClick={movePage}
                            />
                            <HeaderNavButton
                                label="케어"
                                path="/care"
                                isActive={location.pathname.startsWith("/care")}
                                onClick={movePage}
                            />
                            {member?.role === "ADMIN" && (
                                <HeaderNavButton
                                    label="관리자"
                                    path="/admin"
                                    isActive={location.pathname.startsWith("/admin")}
                                    onClick={movePage}
                                />
                            )}
                        </nav>
                    )}
                </div>

                <div className="flex h-10 items-center justify-end gap-3">
                    {isLoading ? (
                        <div className="h-10 w-28" />
                    ) : isLoggedIn ? (
                        <>
                            <div ref={notificationDropdownRef} className="relative">
                                <button
                                    type="button"
                                    onClick={toggleNotification}
                                    className="relative flex h-10 min-w-14 items-center justify-center rounded-full border border-gray-300 px-4 text-sm font-bold transition hover:bg-gray-100"
                                >
                                    알림
                                    {unreadCount > 0 && (
                                        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
                                            {unreadCount > 9 ? "9+" : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {isNotificationOpen && (
                                    <NotificationDropdown
                                        notifications={notifications}
                                        unreadCount={unreadCount}
                                        isLoading={isNotificationLoading}
                                        onReadAll={handleReadAll}
                                        onNotificationClick={handleNotificationClick}
                                    />
                                )}
                            </div>

                            <div ref={dropdownRef} className="relative">
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(!isDropdownOpen);
                                        setIsNotificationOpen(false);
                                    }}
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
                                        <button
                                            onClick={() => movePage("/profile-complete")}
                                            className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50"
                                        >
                                            마이페이지
                                        </button>

                                        <button
                                            onClick={() => movePage("/dogs")}
                                            className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50"
                                        >
                                            내 반려견
                                        </button>

                                        <button
                                            onClick={() => movePage("/walks")}
                                            className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50"
                                        >
                                            산책 일정
                                        </button>

                                        <button
                                            onClick={() => movePage("/chat/rooms")}
                                            className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50"
                                        >
                                            채팅
                                        </button>

                                        <button
                                            onClick={() => movePage("/care")}
                                            className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50"
                                        >
                                            케어 기록
                                        </button>

                                        {member?.role === "ADMIN" && (
                                            <button
                                                onClick={() => movePage("/admin")}
                                                className="block w-full px-5 py-3 text-left text-sm hover:bg-gray-50"
                                            >
                                                관리자
                                            </button>
                                        )}

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
                        </>
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

// 헤더 메인 메뉴 버튼
function HeaderNavButton({ label, path, isActive, onClick }) {
    return (
        <button
            type="button"
            onClick={() => onClick(path)}
            className={`text-sm font-bold transition ${
                isActive
                    ? "text-gray-950"
                    : "text-gray-400 hover:text-gray-950"
            }`}
        >
            {label}
        </button>
    );
}

// 알림 드롭다운
function NotificationDropdown({ notifications, unreadCount, isLoading, onReadAll, onNotificationClick }) {
    const displayNotifications = createDisplayNotifications(notifications);

    return (
        <div className="absolute right-0 mt-3 w-96 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl animate-[dropdownFadeIn_0.15s_ease-out]">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <div>
                    <p className="text-sm font-bold text-gray-950">알림</p>
                    <p className="mt-1 text-xs text-gray-400">미읽음 {unreadCount}개</p>
                </div>

                <button
                    type="button"
                    onClick={onReadAll}
                    disabled={unreadCount === 0}
                    className="text-xs font-bold text-gray-500 transition hover:text-gray-950 disabled:cursor-not-allowed disabled:text-gray-300"
                >
                    모두 읽음
                </button>
            </div>

            <div className="max-h-96 overflow-y-auto">
                {isLoading ? (
                    <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                        알림을 불러오는 중...
                    </div>
                ) : displayNotifications.length === 0 ? (
                    <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                        아직 알림이 없습니다.
                    </div>
                ) : (
                    displayNotifications.slice(0, 8).map((notification) => (
                        <button
                            key={notification.displayKey}
                            type="button"
                            onClick={() => onNotificationClick(notification)}
                            className={`block w-full border-b border-gray-50 px-5 py-4 text-left transition hover:bg-gray-50 ${
                                notification.isRead ? "bg-white" : "bg-emerald-50/60"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                <span className={`mt-1 h-2 w-2 rounded-full ${
                                    notification.isRead ? "bg-gray-200" : "bg-emerald-500"
                                }`}
                                />
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-bold text-gray-950">
                                        {notification.displayTitle}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-500">
                                        {notification.displayContent}
                                    </p>
                                    <p className="mt-2 text-xs text-gray-400">
                                        {formatNotificationDate(notification.createdAt)}
                                    </p>
                                </div>
                            </div>
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}

// 알림 표시 목록 생성
function createDisplayNotifications(notifications) {
    const displayNotifications = [];
    const chatNotificationGroups = new Map();

    notifications.forEach((notification) => {
        if (notification.type !== "CHAT_MESSAGE" || notification.targetType !== "CHAT_ROOM") {
            displayNotifications.push({
                ...notification,
                displayKey: `notification-${notification.notificationId}`,
                displayTitle: notification.title,
                displayContent: notification.content,
            });
            return;
        }

        const groupKey = `chat-${notification.targetId}`;
        const existingGroup = chatNotificationGroups.get(groupKey);

        if (!existingGroup) {
            chatNotificationGroups.set(groupKey, {
                ...notification,
                displayKey: groupKey,
                displayTitle: notification.title,
                displayContent: notification.content,
                chatNotificationCount: 1,
                unreadGroupCount: notification.isRead ? 0 : 1,
            });
            return;
        }

        existingGroup.chatNotificationCount += 1;

        if (!notification.isRead) {
            existingGroup.unreadGroupCount += 1;
        }

        if (new Date(notification.createdAt) > new Date(existingGroup.createdAt)) {
            existingGroup.notificationId = notification.notificationId;
            existingGroup.title = notification.title;
            existingGroup.content = notification.content;
            existingGroup.createdAt = notification.createdAt;
            existingGroup.displayContent = notification.content;
        }

        existingGroup.isRead = existingGroup.unreadGroupCount === 0;
    });

    chatNotificationGroups.forEach((group) => {
        displayNotifications.push({
            ...group,
            displayTitle: group.unreadGroupCount > 1
                ? `새 채팅 메시지 ${group.unreadGroupCount}개`
                : group.title,
        });
    });

    return displayNotifications.sort((first, second) =>
        new Date(second.createdAt) - new Date(first.createdAt)
    );
}

// 알림 이동 경로
function getNotificationTargetPath(notification) {
    if (notification.targetType === "CHAT_ROOM") {
        return `/chat/rooms/${notification.targetId}`;
    }

    return `/walks/${notification.targetId}`;
}

// 알림 날짜 표시
function formatNotificationDate(dateTime) {
    if (!dateTime) {
        return "";
    }

    return dateTime.replace("T", " ").slice(0, 16);
}
