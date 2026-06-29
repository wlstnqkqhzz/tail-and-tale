// 공통 페이지 이동 컴포넌트

export default function Pagination({ page = 0, totalPages = 0, onPageChange }) {
    if (totalPages <= 1) {
        return null;
    }

    const visiblePageCount = 5;
    const startPage = Math.max(
        0,
        Math.min(page - Math.floor(visiblePageCount / 2), totalPages - visiblePageCount),
    );
    const endPage = Math.min(totalPages, startPage + visiblePageCount);
    const pageNumbers = Array.from(
        { length: endPage - startPage },
        (_, index) => startPage + index,
    );

    return (
        <nav className="mt-10 flex items-center justify-center gap-2" aria-label="페이지 이동">
            <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 0}
                className="h-10 border border-gray-200 px-4 text-sm font-bold text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
            >
                이전
            </button>

            {pageNumbers.map((pageNumber) => (
                <button
                    key={pageNumber}
                    type="button"
                    onClick={() => onPageChange(pageNumber)}
                    aria-current={pageNumber === page ? "page" : undefined}
                    className={`h-10 w-10 border text-sm font-bold transition ${
                        pageNumber === page
                            ? "border-black bg-black text-white"
                            : "border-gray-200 text-gray-600 hover:border-black hover:text-black"
                    }`}
                >
                    {pageNumber + 1}
                </button>
            ))}

            <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages - 1}
                className="h-10 border border-gray-200 px-4 text-sm font-bold text-gray-600 transition hover:border-black hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
            >
                다음
            </button>
        </nav>
    );
}
