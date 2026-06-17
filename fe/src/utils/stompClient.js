// 브라우저 WebSocket 기반 STOMP 클라이언트

const NULL_CHAR = "\u0000";

export function createChatStompClient({
    chatRoomId,
    accessToken,
    onConnect,
    onMessage,
    onError,
}) {
    const webSocketUrl = getWebSocketUrl();
    const socket = new WebSocket(webSocketUrl);
    let isConnected = false;

    console.info("[chat-websocket] connecting", {
        chatRoomId,
        webSocketUrl,
    });

    socket.onopen = () => {
        console.info("[chat-websocket] opened");
        socket.send(buildFrame("CONNECT", {
            "accept-version": "1.2",
            "heart-beat": "10000,10000",
            Authorization: `Bearer ${accessToken}`,
        }));
    };

    socket.onmessage = (event) => {
        const frames = String(event.data)
            .split(NULL_CHAR)
            .filter((frame) => frame.trim() !== "");

        frames.forEach((frame) => {
            const parsedFrame = parseFrame(frame);

            console.debug("[chat-websocket] received", parsedFrame);

            if (parsedFrame.command === "CONNECTED") {
                isConnected = true;
                socket.send(buildFrame("SUBSCRIBE", {
                    id: `chat-room-${chatRoomId}`,
                    destination: `/sub/chat/rooms/${chatRoomId}`,
                }));
                onConnect?.();
                return;
            }

            if (parsedFrame.command === "MESSAGE") {
                onMessage?.(JSON.parse(parsedFrame.body));
                return;
            }

            if (parsedFrame.command === "ERROR") {
                console.error("[chat-websocket] stomp error", parsedFrame);
                onError?.(parsedFrame.body || "채팅 연결 중 오류가 발생했습니다.");
            }
        });
    };

    socket.onerror = (event) => {
        console.error("[chat-websocket] socket error", event);
        onError?.("채팅 서버 연결에 실패했습니다.");
    };

    socket.onclose = (event) => {
        isConnected = false;
        console.warn("[chat-websocket] closed", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean,
        });
    };

    return {
        send(content) {
            if (!isConnected || socket.readyState !== WebSocket.OPEN) {
                throw new Error("채팅 서버에 연결되어 있지 않습니다.");
            }

            socket.send(buildFrame("SEND", {
                destination: `/pub/chat/rooms/${chatRoomId}/messages`,
                "content-type": "application/json",
            }, JSON.stringify({ content })));
        },
        disconnect() {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(buildFrame("DISCONNECT", {}));
            }

            socket.close();
        },
    };
}

function getWebSocketUrl() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

    return `${baseUrl.replace(/^http/, "ws")}/ws-chat`;
}

function buildFrame(command, headers, body = "") {
    const headerLines = Object.entries(headers)
        .map(([key, value]) => `${key}:${value}`)
        .join("\n");

    return `${command}\n${headerLines}\n\n${body}${NULL_CHAR}`;
}

function parseFrame(frame) {
    const [headerText, ...bodyParts] = frame.split("\n\n");
    const headerLines = headerText.split("\n");
    const command = headerLines.shift();
    const headers = {};

    headerLines.forEach((line) => {
        const separatorIndex = line.indexOf(":");

        if (separatorIndex > -1) {
            headers[line.slice(0, separatorIndex)] = line.slice(separatorIndex + 1);
        }
    });

    return {
        command,
        headers,
        body: bodyParts.join("\n\n"),
    };
}
