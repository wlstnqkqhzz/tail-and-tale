// 채팅방 목록 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/layout/Header";
import { getChatRooms } from "../api/chat";
import { getAccessToken } from "../utils/token";
import { formatDateTime } from "../utils/walkFormat";
import { useAuth } from "../hooks/useAuth";

export default function ChatRoomsPage() {
    const navigate = useNavigate();
    const { member } = useAuth();

    // 채팅방 목록 상태
    const [chatRooms, setChatRooms] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 내 채팅방 목록 조회
    const fetchChatRooms = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await getChatRooms();

            setChatRooms(sortChatRooms(response.data));
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "채팅방 목록 조회에 실패했습니다.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    // 비로그인 접근 방지 및 초기 조회
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const timerId = window.setTimeout(() => {
            fetchChatRooms();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchChatRooms, navigate]);

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto max-w-6xl">
                        <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                            WALK CHAT
                        </p>
                        <h1 className="mt-5 text-5xl font-bold leading-tight text-gray-950">
                            승인된 산책 메이트와
                            <br />
                            채팅을 이어가세요
                        </h1>
                        <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                            산책 호스트와 승인된 참여자만 입장할 수 있는 산책 일정별 그룹 채팅방입니다.
                        </p>
                    </div>
                </section>

                <section className="mx-auto max-w-6xl px-8 py-10">
                    {isLoading ? (
                        <div className="flex h-80 items-center justify-center border border-gray-100 text-sm text-gray-400">
                            채팅방을 불러오는 중...
                        </div>
                    ) : chatRooms.length === 0 ? (
                        <div className="flex h-80 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                            입장 가능한 채팅방이 없습니다.
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {chatRooms.map((chatRoom) => (
                                <button
                                    key={chatRoom.chatRoomId}
                                    type="button"
                                    onClick={() => navigate(`/chat/rooms/${chatRoom.chatRoomId}`, {
                                        state: {
                                            walkTitle: chatRoom.walkTitle,
                                            walkScheduleId: chatRoom.walkScheduleId,
                                        },
                                    })}
                                    className="grid gap-4 border border-gray-200 p-6 text-left transition hover:border-gray-950 hover:shadow-lg md:grid-cols-[1fr_auto]"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">
                                                {chatRoom.myRole === "HOST" ? "호스트" : "참여자"}
                                            </span>
                                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                                                {chatRoom.status === "ACTIVE" ? "진행 중" : "종료"}
                                            </span>
                                            {hasUnreadMessage(chatRoom, member?.memberId) && (
                                                <span className="rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
                                                    새 메시지
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="mt-4 truncate text-2xl font-bold text-gray-950">
                                            {chatRoom.walkTitle}
                                        </h2>
                                        <p className="mt-3 truncate text-sm text-gray-500">
                                            {chatRoom.lastMessage?.content || "아직 메시지가 없습니다."}
                                        </p>
                                    </div>

                                    <div className="text-sm text-gray-400 md:text-right">
                                        {chatRoom.lastMessage?.createdAt
                                            ? formatDateTime(chatRoom.lastMessage.createdAt)
                                            : "새 채팅방"}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

// 채팅방 최신순 정렬
function sortChatRooms(chatRooms) {
    return [...chatRooms].sort((first, second) =>
        getChatRoomTime(second) - getChatRoomTime(first)
    );
}

// 채팅방 정렬 시간 조회
function getChatRoomTime(chatRoom) {
    if (!chatRoom.lastMessage?.createdAt) {
        return 0;
    }

    return new Date(chatRoom.lastMessage.createdAt).getTime();
}

// 안 읽은 메시지 여부
function hasUnreadMessage(chatRoom, memberId) {
    if (!chatRoom.lastMessage || chatRoom.lastMessage.senderId === memberId) {
        return false;
    }

    if (!chatRoom.lastReadMessageId) {
        return true;
    }

    return chatRoom.lastMessage.chatMessageId > chatRoom.lastReadMessageId;
}
