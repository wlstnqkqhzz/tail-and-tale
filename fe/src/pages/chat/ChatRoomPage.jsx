// 채팅방 페이지

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Header from "../../components/layout/Header";
import { UserActionTrigger } from "../../components/member/UserMiniProfileModal";
import { getChatMessages, readChatRoom } from "../../api/chat";
import { readTargetNotifications } from "../../api/notification";
import { useAuth } from "../../hooks/useAuth";
import { getAccessToken } from "../../utils/token";
import { createChatStompClient } from "../../utils/stompClient";
import { formatDateTime } from "../../utils/walkFormat";

export default function ChatRoomPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { chatRoomId } = useParams();
    const { member } = useAuth();
    const messageListRef = useRef(null);
    const messageInputRef = useRef(null);
    const stompClientRef = useRef(null);
    const messageItemRefs = useRef({});
    const hasInitialScrolledRef = useRef(false);

    // 채팅 상태
    const [messages, setMessages] = useState([]);
    const [content, setContent] = useState("");
    const [unreadStartMessageId, setUnreadStartMessageId] = useState(null);

    // 요청 및 연결 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionMessage, setConnectionMessage] = useState("연결 준비 중");
    const walkTitle = location.state?.walkTitle || "산책 채팅방";
    const walkScheduleId = location.state?.walkScheduleId;

    // 메시지 목록 조회
    const fetchMessages = useCallback(async () => {
        try {
            setIsLoading(true);

            const response = await getChatMessages(chatRoomId, {
                size: 50,
            });

            const nextMessages = response.data.messages;
            const firstUnreadMessage = findFirstUnreadMessage(
                nextMessages,
                response.data.lastReadMessageId
            );

            setMessages(nextMessages);
            setUnreadStartMessageId(firstUnreadMessage?.chatMessageId || null);

            const lastMessage = nextMessages.at(-1);

            if (lastMessage) {
                await readChatRoom(chatRoomId, {
                    lastReadMessageId: lastMessage.chatMessageId,
                });
            }

            await readTargetNotifications("CHAT_ROOM", chatRoomId);
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "채팅 메시지 조회에 실패했습니다.");
            navigate("/chat/rooms");
        } finally {
            setIsLoading(false);
        }
    }, [chatRoomId, navigate]);

    // 비로그인 접근 방지 및 메시지 조회
    useEffect(() => {
        if (!getAccessToken()) {
            alert("로그인이 필요합니다.");
            navigate("/");
            return;
        }

        const timerId = window.setTimeout(() => {
            fetchMessages();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchMessages, navigate]);

    // WebSocket 연결
    useEffect(() => {
        const accessToken = getAccessToken();

        if (!accessToken) {
            return;
        }

        const timerId = window.setTimeout(() => {
            stompClientRef.current = createChatStompClient({
                chatRoomId,
                accessToken,
                onConnect: () => {
                    setIsConnected(true);
                    setConnectionMessage("실시간 연결됨");
                    messageInputRef.current?.focus();
                },
                onMessage: (message) => {
                    setMessages((prevMessages) => [...prevMessages, message]);
                    readChatRoom(chatRoomId, {
                        lastReadMessageId: message.chatMessageId,
                    }).catch((error) => console.error(error));
                },
                onError: (message) => {
                    setIsConnected(false);
                    setConnectionMessage(message);
                },
            });
        }, 0);

        return () => {
            window.clearTimeout(timerId);
            stompClientRef.current?.disconnect();
        };
    }, [chatRoomId]);

    // 메시지 위치 스크롤
    useEffect(() => {
        const timerId = window.setTimeout(() => {
            if (!hasInitialScrolledRef.current) {
                hasInitialScrolledRef.current = true;

                if (unreadStartMessageId && messageItemRefs.current[unreadStartMessageId]) {
                    messageItemRefs.current[unreadStartMessageId].scrollIntoView({
                        block: "center",
                    });
                    return;
                }
            }

            messageListRef.current?.scrollTo({
                top: messageListRef.current.scrollHeight,
                behavior: "smooth",
            });
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [messages, unreadStartMessageId]);

    // 메시지 전송
    const handleSubmit = (event) => {
        event.preventDefault();

        if (!content.trim()) {
            return;
        }

        try {
            stompClientRef.current?.send(content.trim());
            setContent("");
            window.setTimeout(() => {
                messageInputRef.current?.focus();
            }, 0);
        } catch (error) {
            setConnectionMessage(error.message || "채팅 메시지 전송에 실패했습니다.");
            alert(error.message || "채팅 메시지 전송에 실패했습니다.");
        }
    };

    return (
        <>
            <Header />

            <main className="flex h-screen flex-col overflow-hidden bg-white pt-20">
                <section className="shrink-0 border-b border-gray-100 px-8 py-6">
                    <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <button
                                type="button"
                                onClick={() => navigate("/chat/rooms")}
                                className="mb-3 text-sm font-bold text-gray-500 transition hover:text-gray-950"
                            >
                                채팅 목록으로 돌아가기
                            </button>
                            <h1 className="text-3xl font-bold text-gray-950">{walkTitle}</h1>
                            <p className="mt-2 text-sm text-gray-500">
                                {isConnected ? "실시간 메시지를 주고받을 수 있습니다." : connectionMessage}
                            </p>
                        </div>

                        {walkScheduleId && (
                            <button
                                type="button"
                                onClick={() => navigate(`/walks/${walkScheduleId}`)}
                                className="h-11 border border-gray-200 px-5 text-sm font-bold transition hover:bg-gray-50"
                            >
                                산책 상세 보기
                            </button>
                        )}
                    </div>
                </section>

                <section className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col px-8 py-4">
                    <div
                        ref={messageListRef}
                        className="min-h-0 flex-1 overflow-y-auto border border-gray-200 bg-gray-50 p-5"
                    >
                        {isLoading ? (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                메시지를 불러오는 중...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                아직 메시지가 없습니다.
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {messages.map((message) => (
                                    <div
                                        key={message.chatMessageId}
                                        ref={(element) => {
                                            if (element) {
                                                messageItemRefs.current[message.chatMessageId] = element;
                                            }
                                        }}
                                    >
                                        {message.chatMessageId === unreadStartMessageId && (
                                            <UnreadMessageDivider />
                                        )}

                                        <ChatMessageItem
                                            message={message}
                                            isMine={message.senderId === member?.memberId}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4 grid shrink-0 grid-cols-[1fr_auto] gap-3">
                        <input
                            ref={messageInputRef}
                            value={content}
                            onChange={(event) => setContent(event.target.value)}
                            maxLength={1000}
                            className="h-12 border border-gray-200 px-4 text-sm outline-none transition focus:border-black"
                            placeholder={isConnected ? "메시지를 입력하세요" : "채팅 서버 연결 중입니다"}
                            disabled={!isConnected}
                        />

                        <button
                            type="submit"
                            disabled={!isConnected || !content.trim()}
                            className="h-12 bg-black px-8 text-sm font-bold text-white transition hover:opacity-80 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                            전송
                        </button>
                    </form>
                </section>
            </main>

        </>
    );
}

// 첫 안 읽은 메시지 조회
function findFirstUnreadMessage(messages, lastReadMessageId) {
    if (!lastReadMessageId) {
        return null;
    }

    return messages.find((message) => message.chatMessageId > lastReadMessageId);
}

// 안 읽은 메시지 구분선
function UnreadMessageDivider() {
    return (
        <div className="my-2 flex items-center gap-3">
            <div className="h-px flex-1 bg-emerald-200" />
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
                여기부터 안 읽은 메시지
            </span>
            <div className="h-px flex-1 bg-emerald-200" />
        </div>
    );
}

// 채팅 메시지 아이템
function ChatMessageItem({ message, isMine }) {
    if (message.messageType === "SYSTEM") {
        return (
            <div className="text-center text-xs font-bold text-gray-400">
                {message.content}
            </div>
        );
    }

    return (
        <div className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[72%] ${isMine ? "text-right" : "text-left"}`}>
                {!isMine && (
                    <div className="mb-1 flex items-center gap-2 text-xs font-bold text-gray-500">
                        <UserActionTrigger
                            memberId={message.senderId}
                            nickname={message.senderNickname || "알 수 없음"}
                        />
                    </div>
                )}

                <div className={`inline-block break-words px-4 py-3 text-sm leading-6 ${
                    isMine
                        ? "bg-gray-950 text-white"
                        : "border border-gray-200 bg-white text-gray-800"
                }`}
                >
                    {message.isDeleted ? "삭제된 메시지입니다." : message.content}
                </div>

                <p className="mt-1 text-xs text-gray-400">
                    {formatDateTime(message.createdAt)}
                </p>
            </div>
        </div>
    );
}
