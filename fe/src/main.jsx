import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import "./index.css";
import { ToastProvider } from "./components/common/ToastProvider";
import { router } from "./routes/router";

createRoot(document.getElementById("root")).render(
    <ToastProvider>
        <RouterProvider router={router} />
    </ToastProvider>
);
