import { createBrowserRouter } from "react-router-dom";

import OAuth2PendingGuard from "../components/auth/OAuth2PendingGuard";
import HomePage from "../pages/HomePage";
import OAuth2RedirectPage from "../pages/OAuth2RedirectPage";
import OAuth2ProfileCompletePage from "../pages/OAuth2ProfileCompletePage";
import ProfileCompletePage from "../pages/ProfileCompletePage";
import DogsPage from "../pages/DogsPage";
import WalksPage from "../pages/WalksPage";
import WalkDetailPage from "../pages/WalkDetailPage";
import WalkCreatePage from "../pages/WalkCreatePage";
import ChatRoomsPage from "../pages/ChatRoomsPage";
import ChatRoomPage from "../pages/ChatRoomPage";
import CarePage from "../pages/CarePage";
import CommunityListPage from "../pages/CommunityListPage";
import CommunityWritePage from "../pages/CommunityWritePage";
import CommunityDetailPage from "../pages/CommunityDetailPage";
import CommunityEditPage from "../pages/CommunityEditPage";

// 애플리케이션 라우터 설정

export const router = createBrowserRouter([
    {
        element: <OAuth2PendingGuard />,
        children: [
            { path: "/", element: <HomePage />,},
            { path: "/oauth2/redirect", element: <OAuth2RedirectPage />,},
            { path: "/oauth2/profile-complete", element: <OAuth2ProfileCompletePage />,},
            { path: "/profile-complete", element: <ProfileCompletePage />,},
            { path: "/dogs", element: <DogsPage />,},
            { path: "/walks", element: <WalksPage />,},
            { path: "/walks/new", element: <WalkCreatePage />,},
            { path: "/walks/:walkScheduleId", element: <WalkDetailPage />,},
            { path: "/chat/rooms", element: <ChatRoomsPage />,},
            { path: "/chat/rooms/:chatRoomId", element: <ChatRoomPage />,},
            { path: "/care", element: <CarePage />,},
            { path: "/community", element: <CommunityListPage />,},
            { path: "/community/write", element: <CommunityWritePage />,},
            { path: "/community/:communityPostId", element: <CommunityDetailPage />,},
            { path: "/community/:communityPostId/edit", element: <CommunityEditPage />,},
        ],
    },
]);
