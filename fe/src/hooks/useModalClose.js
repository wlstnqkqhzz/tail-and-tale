// 모달 닫기 애니메이션 및 ESC 닫기 처리

import { useCallback, useEffect, useState } from "react";

export function useModalClose(onClose) {
    const [isClosing, setIsClosing] = useState(false);

    const handleClose = useCallback(() => {
        if (isClosing) return;

        setIsClosing(true);

        setTimeout(() => {
            onClose();
        }, 160);
    }, [isClosing, onClose]);

    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };

        window.addEventListener("keydown", handleEsc);

        return () => {
            window.removeEventListener("keydown", handleEsc);
        };
    }, [handleClose]);

    return {
        isClosing,
        handleClose,
    };
}
