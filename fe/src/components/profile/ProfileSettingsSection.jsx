// 마이페이지 설정 영역

import { notificationSettingLabels } from "../../constants/profileComplete";

export function SettingsSection({ notificationSettings, blockedMembers, onNotificationChange, onUnblock }) {
    return (
        <section className="grid gap-8 pt-8">
            <div className="border border-gray-200 p-6">
                <div className="mb-5">
                    <p className="text-sm font-bold tracking-[0.3em] text-gray-400">NOTIFICATION</p>
                    <h2 className="mt-3 text-2xl font-bold text-gray-950">알림 설정</h2>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                    {notificationSettings.map((setting) => (
                        <label
                            key={setting.notificationType}
                            className="flex min-h-16 items-center justify-between gap-4 border border-gray-100 px-4 py-3"
                        >
                            <span>
                                <span className="block text-sm font-bold text-gray-950">
                                    {notificationSettingLabels[setting.notificationType] || setting.notificationType}
                                </span>
                                <span className="mt-1 block text-xs font-bold text-gray-400">{setting.channel}</span>
                            </span>
                            <input
                                type="checkbox"
                                checked={Boolean(setting.isEnabled)}
                                onChange={(event) => onNotificationChange(setting.notificationType, event.target.checked)}
                                className="h-5 w-5 accent-black"
                            />
                        </label>
                    ))}
                </div>
            </div>

            <div className="border border-gray-200 p-6">
                <div className="mb-5 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-sm font-bold tracking-[0.3em] text-gray-400">BLOCK</p>
                        <h2 className="mt-3 text-2xl font-bold text-gray-950">차단 회원</h2>
                    </div>
                    <span className="text-sm font-bold text-gray-400">{blockedMembers.length}명</span>
                </div>

                {blockedMembers.length === 0 ? (
                    <div className="flex h-28 items-center justify-center border border-dashed border-gray-200 text-sm text-gray-400">
                        차단한 회원이 없습니다.
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {blockedMembers.map((blockedMember) => (
                            <div
                                key={blockedMember.memberBlockId}
                                className="grid gap-4 border border-gray-100 p-4 md:grid-cols-[1fr_auto] md:items-center"
                            >
                                <div className="min-w-0">
                                    <p className="text-base font-bold text-gray-950">{blockedMember.blockedNickname}</p>
                                    <p className="mt-1 line-clamp-1 text-sm text-gray-400">
                                        {blockedMember.reason || "차단 사유 없음"}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onUnblock(blockedMember.blockedMemberId)}
                                    className="h-10 border border-gray-200 px-4 text-sm font-bold transition hover:bg-gray-50"
                                >
                                    차단 해제
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

// 대시보드 탭
