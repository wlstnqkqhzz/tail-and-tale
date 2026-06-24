// 마이페이지 및 내 정보 수정 페이지

import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../components/layout/Header";
import { updateMyProfile, getMyDashboard, verifyMyPassword, withdrawMyAccount, getMyBlocks, unblockMember } from "../../api/member";
import { getNotificationSettings, updateNotificationSetting } from "../../api/notification";
import { cancelMyWalkParticipation } from "../../api/walk";
import { clearTokens, getAccessToken } from "../../utils/token";
import { isCompleteRegionValue } from "../../constants/regions";
import {
    analysisLabels,
    conditionAfterWalkLabels,
    emotionLabels,
    healthLabels,
    initialForm,
} from "../../constants/profileComplete";
import { formatDateOnly } from "../../utils/profileComplete";
import { ProfileForm } from "../../components/profile/ProfileForm";
import { DashboardTabs, SummaryGrid } from "../../components/profile/ProfileDashboardSummary";
import {
    CareGroup,
    CareRow,
    ChatRoomRow,
    CommunityGroup,
    DashboardSection,
    DogCard,
    ReviewGroup,
    WalkRow,
} from "../../components/profile/ProfileDashboardItems";
import { SettingsSection } from "../../components/profile/ProfileSettingsSection";

export default function MyPage() {
    const navigate = useNavigate();

    // 마이페이지 데이터 상태
    const [member, setMember] = useState(null);
    const [dogs, setDogs] = useState([]);
    const [myWalks, setMyWalks] = useState([]);
    const [myParticipations, setMyParticipations] = useState([]);
    const [chatRooms, setChatRooms] = useState([]);
    const [writtenReviews, setWrittenReviews] = useState([]);
    const [receivedReviews, setReceivedReviews] = useState([]);
    const [walkRecords, setWalkRecords] = useState([]);
    const [emotionDiaries, setEmotionDiaries] = useState([]);
    const [healthRecords, setHealthRecords] = useState([]);
    const [aiAnalyses, setAiAnalyses] = useState([]);
    const [communityPosts, setCommunityPosts] = useState([]);
    const [communityComments, setCommunityComments] = useState([]);
    const [notificationSettings, setNotificationSettings] = useState([]);
    const [blockedMembers, setBlockedMembers] = useState([]);

    // 입력 폼 상태
    const [form, setForm] = useState(initialForm);
    const [activeDashboardTab, setActiveDashboardTab] = useState("dogs");

    // 요청 상태
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    // 마이페이지 데이터 조회
    const fetchMyPageData = useCallback(async () => {
        try {
            setIsLoading(true);

            const [dashboardResponse, notificationSettingResponse, blockedMemberResponse] = await Promise.all([
                getMyDashboard(),
                getNotificationSettings(),
                getMyBlocks(),
            ]);
            const dashboard = dashboardResponse.data;
            const nextMember = dashboard.member;

            setMember(nextMember);
            setDogs(dashboard.dogs);
            setMyWalks(dashboard.myWalkSchedules);
            setMyParticipations(dashboard.myParticipations);
            setChatRooms(dashboard.chatRooms);
            setWrittenReviews(dashboard.writtenReviews || []);
            setReceivedReviews(dashboard.receivedReviews || []);
            setWalkRecords(dashboard.walkRecords || []);
            setEmotionDiaries(dashboard.emotionDiaries || []);
            setHealthRecords(dashboard.healthRecords || []);
            setAiAnalyses(dashboard.aiAnalyses || []);
            setCommunityPosts(dashboard.communityPosts || []);
            setCommunityComments(dashboard.communityComments || []);
            setNotificationSettings(notificationSettingResponse.data || []);
            setBlockedMembers(blockedMemberResponse.data || []);
            setForm({
                realName: nextMember.realName || "",
                nickname: nextMember.nickname || "",
                phoneNumber: nextMember.phoneNumber || "",
                region: nextMember.region || "",
                introduction: nextMember.introduction || "",
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "마이페이지 정보를 불러오지 못했습니다.");
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
            fetchMyPageData();
        }, 0);

        return () => {
            window.clearTimeout(timerId);
        };
    }, [fetchMyPageData, navigate]);

    // 입력값 변경
    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((prevForm) => ({
            ...prevForm,
            [name]: value,
        }));
    };

    // 내 참여 신청 취소
    const handleCancelParticipation = async (walkScheduleId) => {
        if (!window.confirm("산책 참여 신청을 취소할까요?")) {
            return;
        }

        try {
            await cancelMyWalkParticipation(walkScheduleId);

            alert("산책 참여 신청이 취소되었습니다.");
            await fetchMyPageData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "산책 참여 신청 취소에 실패했습니다.");
        }
    };

    // 알림 설정 변경
    const handleNotificationSettingChange = async (notificationType, isEnabled) => {
        try {
            const response = await updateNotificationSetting(notificationType, { isEnabled });

            setNotificationSettings((prevSettings) => {
                if (notificationType === "ALL") {
                    return prevSettings.map((setting) => ({
                        ...setting,
                        isEnabled,
                    }));
                }

                return prevSettings.map((setting) => {
                    if (setting.notificationType === notificationType) {
                        return response.data;
                    }

                    if (isEnabled && setting.notificationType === "ALL") {
                        return {
                            ...setting,
                            isEnabled: true,
                        };
                    }

                    return setting;
                });
            });
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "알림 설정 변경에 실패했습니다.");
        }
    };

    // 회원 차단 해제
    const handleUnblockMember = async (memberId) => {
        if (!window.confirm("차단을 해제할까요?")) {
            return;
        }

        try {
            await unblockMember(memberId);
            await fetchMyPageData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "차단 해제에 실패했습니다.");
        }
    };

    // 내 정보 저장
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!form.nickname.trim()) {
            alert("닉네임을 입력해주세요.");
            return;
        }

        if (form.region.trim() && !isCompleteRegionValue(form.region)) {
            alert("거주 지역은 시/도와 시/군/구를 모두 선택해주세요.");
            return;
        }

        try {
            setIsSubmitting(true);

            await updateMyProfile({
                nickname: form.nickname.trim(),
                phoneNumber: form.phoneNumber.trim(),
                region: form.region.trim(),
                introduction: form.introduction.trim(),
            });

            alert("내 정보가 저장되었습니다.");
            await fetchMyPageData();
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "내 정보 저장에 실패했습니다.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // 회원 탈퇴
    const handleWithdraw = async () => {
        const password = window.prompt("회원 탈퇴를 위해 비밀번호를 입력해주세요.");

        if (password === null) {
            return;
        }

        if (!password.trim()) {
            alert("비밀번호를 입력해주세요.");
            return;
        }

        try {
            setIsWithdrawing(true);

            await verifyMyPassword({ password });

            if (!window.confirm("정말 탈퇴하시겠습니까? 탈퇴 후에는 계정을 다시 사용할 수 없습니다.")) {
                return;
            }

            await withdrawMyAccount({ password });

            clearTokens();
            alert("회원 탈퇴가 완료되었습니다.");
            window.location.replace("/");
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || "회원 탈퇴에 실패했습니다.");
        } finally {
            setIsWithdrawing(false);
        }
    };

    // 케어 페이지 이동
    const moveCarePage = (tab, dogId) => {
        const params = new URLSearchParams({ tab });

        if (dogId) {
            params.set("dogId", String(dogId));
        }

        navigate(`/care?${params.toString()}`);
    };

    return (
        <>
            <Header />

            <main className="min-h-screen bg-white pt-20">
                <section className="border-b border-gray-100 px-8 py-14">
                    <div className="mx-auto max-w-7xl">
                        <p className="text-sm font-bold tracking-[0.4em] text-emerald-600">
                            MY PAGE
                        </p>
                        <div className="mt-5 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h1 className="text-5xl font-bold leading-tight text-gray-950">
                                    내 활동과 정보를
                                    <br />
                                    한 곳에서 관리하세요
                                </h1>
                                <p className="mt-5 max-w-2xl text-base leading-7 text-gray-500">
                                    내 반려견, 작성한 산책 글, 참여 신청, 채팅방을 빠르게 확인할 수 있습니다.
                                </p>
                            </div>

                            {member && (
                                <div className="grid min-w-64 gap-2 border border-gray-200 p-5">
                                    <p className="text-sm font-bold text-gray-400">로그인 회원</p>
                                    <p className="text-2xl font-bold text-gray-950">{member.nickname}님</p>
                                    <p className="truncate text-sm text-gray-500">{member.email}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {isLoading ? (
                    <div className="flex h-[calc(100vh-80px)] items-center justify-center text-sm text-gray-400">
                        마이페이지 정보를 불러오는 중...
                    </div>
                ) : (
                    <section className="mx-auto grid max-w-7xl gap-10 px-8 py-12 xl:grid-cols-[420px_1fr]">
                        <ProfileForm
                            form={form}
                            isSubmitting={isSubmitting}
                            isWithdrawing={isWithdrawing}
                            onChange={handleChange}
                            onSubmit={handleSubmit}
                            onWithdraw={handleWithdraw}
                        />

                        <div className="grid content-start gap-8 self-start">
                            <SummaryGrid
                                dogs={dogs}
                                myWalks={myWalks}
                                myParticipations={myParticipations}
                                chatRooms={chatRooms}
                                writtenReviews={writtenReviews}
                                receivedReviews={receivedReviews}
                                walkRecords={walkRecords}
                                emotionDiaries={emotionDiaries}
                                healthRecords={healthRecords}
                                aiAnalyses={aiAnalyses}
                                communityPosts={communityPosts}
                            />

                            <DashboardTabs
                                activeTab={activeDashboardTab}
                                onChange={setActiveDashboardTab}
                            />

                            {activeDashboardTab === "dogs" && (
                                <DashboardSection
                                    title="내 반려견"
                                    count={dogs.length}
                                    emptyText="등록된 반려견이 없습니다."
                                    actionLabel="반려견 관리"
                                    onAction={() => navigate("/dogs")}
                                >
                                    <div className="grid gap-3 md:grid-cols-2">
                                        {dogs.slice(0, 4).map((dog) => (
                                            <DogCard key={dog.dogId} dog={dog} onClick={() => navigate("/dogs")} />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "walks" && (
                                <DashboardSection
                                    title="내가 쓴 산책 글"
                                    count={myWalks.length}
                                    emptyText="작성한 산책 글이 없습니다."
                                    actionLabel="산책 글 작성"
                                    onAction={() => navigate("/walks/new")}
                                >
                                    <div className="grid gap-3">
                                        {myWalks.slice(0, 4).map((schedule) => (
                                            <WalkRow
                                                key={schedule.walkScheduleId}
                                                schedule={schedule}
                                                onClick={() => navigate(`/walks/${schedule.walkScheduleId}`)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "participations" && (
                                <DashboardSection
                                    title="내 참여 신청"
                                    count={myParticipations.length}
                                    emptyText="참여 신청한 산책이 없습니다."
                                    actionLabel="산책 둘러보기"
                                    onAction={() => navigate("/walks")}
                                >
                                    <div className="grid gap-3">
                                        {myParticipations.slice(0, 4).map((schedule) => (
                                            <WalkRow
                                                key={schedule.walkScheduleId}
                                                participation={schedule}
                                                showParticipantStatus
                                                onClick={() => navigate(`/walks/${schedule.walkScheduleId}`)}
                                                onCancel={() => handleCancelParticipation(schedule.walkScheduleId)}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "chats" && (
                                <DashboardSection
                                    title="내 채팅창"
                                    count={chatRooms.length}
                                    emptyText="입장 가능한 채팅방이 없습니다."
                                    actionLabel="채팅 목록"
                                    onAction={() => navigate("/chat/rooms")}
                                >
                                    <div className="grid gap-3">
                                        {chatRooms.slice(0, 4).map((chatRoom) => (
                                            <ChatRoomRow
                                                key={chatRoom.chatRoomId}
                                                chatRoom={chatRoom}
                                                onClick={() => navigate(`/chat/rooms/${chatRoom.chatRoomId}`, {
                                                    state: {
                                                        walkTitle: chatRoom.walkTitle,
                                                        walkScheduleId: chatRoom.walkScheduleId,
                                                    },
                                                })}
                                            />
                                        ))}
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "community" && (
                                <DashboardSection
                                    title="내 커뮤니티"
                                    count={communityPosts.length + communityComments.length}
                                    emptyText="작성한 커뮤니티 활동이 없습니다."
                                    actionLabel="커뮤니티 보기"
                                    onAction={() => navigate("/community")}
                                >
                                    <div className="grid gap-6">
                                        <CommunityGroup
                                            title="내가 쓴 글"
                                            items={communityPosts}
                                            emptyText="작성한 커뮤니티 글이 없습니다."
                                            type="post"
                                            onClick={(item) => navigate(`/community/${item.communityPostId}`)}
                                        />

                                        <CommunityGroup
                                            title="내가 쓴 댓글"
                                            items={communityComments}
                                            emptyText="작성한 댓글이 없습니다."
                                            type="comment"
                                            onClick={(item) => navigate(`/community/${item.communityPostId}`)}
                                        />
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "reviews" && (
                                <DashboardSection
                                    title="내 산책 후기"
                                    count={writtenReviews.length + receivedReviews.length}
                                    emptyText="작성하거나 받은 산책 후기가 없습니다."
                                    actionLabel="산책 보기"
                                    onAction={() => navigate("/walks")}
                                >
                                    <div className="grid gap-6">
                                        <ReviewGroup
                                            title="내가 쓴 후기"
                                            reviews={writtenReviews}
                                            emptyText="작성한 산책 후기가 없습니다."
                                            onClick={(review) => navigate(`/walks/${review.walkScheduleId}`)}
                                        />

                                        <ReviewGroup
                                            title="내가 받은 후기"
                                            reviews={receivedReviews}
                                            emptyText="받은 산책 후기가 없습니다."
                                            onClick={(review) => navigate(`/walks/${review.walkScheduleId}`)}
                                        />
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "care" && (
                                <DashboardSection
                                    title="내 케어 기록"
                                    count={walkRecords.length + emotionDiaries.length + healthRecords.length + aiAnalyses.length}
                                    emptyText="작성한 케어 기록이 없습니다."
                                    actionLabel="케어 관리"
                                    onAction={() => moveCarePage("walk", dogs[0]?.dogId)}
                                >
                                    <div className="grid gap-6">
                                        <CareGroup
                                            title="산책 기록"
                                            count={walkRecords.length}
                                            emptyText="작성한 산책 기록이 없습니다."
                                            actionLabel="산책 기록 보기"
                                            onAction={() => moveCarePage("walk", walkRecords[0]?.dogId || dogs[0]?.dogId)}
                                        >
                                            {walkRecords.slice(0, 3).map((record) => (
                                                <CareRow
                                                    key={record.walkRecordId}
                                                    title={`${conditionAfterWalkLabels[record.conditionAfterWalk] || "상태 미입력"} · ${record.durationMinutes ? `${record.durationMinutes}분` : "시간 미입력"}`}
                                                    meta={`${formatDateOnly(record.startedAt)} · ${record.dogName}`}
                                                    content={record.memo || record.routeSummary || "기록된 내용이 없습니다."}
                                                    onClick={() => moveCarePage("walk", record.dogId)}
                                                />
                                            ))}
                                        </CareGroup>

                                        <CareGroup
                                            title="감정 일기"
                                            count={emotionDiaries.length}
                                            emptyText="작성한 감정 일기가 없습니다."
                                            actionLabel="감정 일기 보기"
                                            onAction={() => moveCarePage("emotion", emotionDiaries[0]?.dogId || dogs[0]?.dogId)}
                                        >
                                            {emotionDiaries.slice(0, 3).map((diary) => (
                                                <CareRow
                                                    key={diary.emotionDiaryId}
                                                    title={emotionLabels[diary.emotion]}
                                                    meta={`${diary.recordedDate} · ${diary.dogName}`}
                                                    content={diary.diaryContent || diary.behaviorPattern || "기록된 내용이 없습니다."}
                                                    onClick={() => moveCarePage("emotion", diary.dogId)}
                                                />
                                            ))}
                                        </CareGroup>

                                        <CareGroup
                                            title="건강 체크"
                                            count={healthRecords.length}
                                            emptyText="작성한 건강 기록이 없습니다."
                                            actionLabel="건강 체크 보기"
                                            onAction={() => moveCarePage("health", healthRecords[0]?.dogId || dogs[0]?.dogId)}
                                        >
                                            {healthRecords.slice(0, 3).map((record) => (
                                                <CareRow
                                                    key={record.healthRecordId}
                                                    title={`${healthLabels[record.healthStatus] || "상태 미입력"} · ${record.weight ? `${record.weight}kg` : "몸무게 미입력"}`}
                                                    meta={`${record.recordedDate} · ${record.dogName}`}
                                                    content={record.memo || record.symptoms || "기록된 내용이 없습니다."}
                                                    onClick={() => moveCarePage("health", record.dogId)}
                                                />
                                            ))}
                                        </CareGroup>

                                        <CareGroup
                                            title="AI 분석"
                                            count={aiAnalyses.length}
                                            emptyText="생성한 AI 분석 결과가 없습니다."
                                            actionLabel="AI 분석 보기"
                                            onAction={() => moveCarePage("analysis", aiAnalyses[0]?.dogId || dogs[0]?.dogId)}
                                        >
                                            {aiAnalyses.slice(0, 3).map((analysis) => (
                                                <CareRow
                                                    key={analysis.aiAnalysisResultId}
                                                    title={analysis.summary}
                                                    meta={`${analysisLabels[analysis.analysisType]} · ${analysis.dogName}`}
                                                    content={analysis.guideContent || analysis.resultContent}
                                                    onClick={() => moveCarePage("analysis", analysis.dogId)}
                                                />
                                            ))}
                                        </CareGroup>
                                    </div>
                                </DashboardSection>
                            )}

                            {activeDashboardTab === "settings" && (
                                <SettingsSection
                                    notificationSettings={notificationSettings}
                                    blockedMembers={blockedMembers}
                                    onNotificationChange={handleNotificationSettingChange}
                                    onUnblock={handleUnblockMember}
                                />
                            )}
                        </div>
                    </section>
                )}
            </main>
        </>
    );
}

// 설정 관리
