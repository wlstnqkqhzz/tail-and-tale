import { createBrowserRouter } from "react-router-dom";

import HomePage from "../pages/HomePage";
import OAuth2RedirectPage from "../pages/OAuth2RedirectPage";
import ProfileCompletePage from "../pages/ProfileCompletePage";

// 애플리케이션 라우터 설정

export const router = createBrowserRouter([
    { path: "/", element: <HomePage />,},
    { path: "/oauth2/redirect", element: <OAuth2RedirectPage />,},
    { path: "/profile-complete", element: <ProfileCompletePage />,},
]);