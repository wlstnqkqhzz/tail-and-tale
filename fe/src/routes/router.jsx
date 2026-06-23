import { createBrowserRouter } from "react-router-dom";

import OAuth2PendingGuard from "../components/auth/OAuth2PendingGuard";
import AdminPage from "../pages/admin/AdminPage";
import OAuth2ProfileCompletePage from "../pages/auth/OAuth2ProfileCompletePage";
import OAuth2RedirectPage from "../pages/auth/OAuth2RedirectPage";
import CarePage from "../pages/care/CarePage";
import ChatRoomPage from "../pages/chat/ChatRoomPage";
import ChatRoomsPage from "../pages/chat/ChatRoomsPage";
import CommunityDetailPage from "../pages/community/CommunityDetailPage";
import CommunityEditPage from "../pages/community/CommunityEditPage";
import CommunityListPage from "../pages/community/CommunityListPage";
import CommunityWritePage from "../pages/community/CommunityWritePage";
import DogsPage from "../pages/dog/DogsPage";
import HomePage from "../pages/home/HomePage";
import MemberProfilePage from "../pages/member/MemberProfilePage";
import ProfileCompletePage from "../pages/member/ProfileCompletePage";
import WalkCreatePage from "../pages/walk/WalkCreatePage";
import WalkDetailPage from "../pages/walk/WalkDetailPage";
import WalksPage from "../pages/walk/WalksPage";

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
            { path: "/members/:memberId", element: <MemberProfilePage />,},
            { path: "/admin", element: <AdminPage />,},
        ],
    },
]);
