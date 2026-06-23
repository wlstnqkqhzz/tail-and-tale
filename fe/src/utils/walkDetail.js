// 산책 상세 유틸

export function canApply(schedule, isHost) {
    return schedule.isRecruitable
        && !isHost
        && !["REQUESTED", "APPROVED"].includes(schedule.myParticipantStatus);
}

export function getApplyButtonText(schedule, isHost) {
    if (isHost) return "호스트";
    if (schedule.myParticipantStatus === "REQUESTED") return "신청 대기 중";
    if (schedule.myParticipantStatus === "APPROVED") return "참여 승인됨";
    if (!schedule.isRecruitable) return "신청 불가";
    return "참여 신청";
}

export function getReviewTargetOptions(schedule, member, approvedParticipants) {
    if (!schedule || !member) {
        return [];
    }

    const options = [];

    if (schedule.hostMemberId !== member.memberId) {
        options.push({
            memberId: schedule.hostMemberId,
            nickname: "호스트 회원",
        });
    }

    approvedParticipants
        .filter((participant) => participant.memberId !== member.memberId)
        .forEach((participant) => {
            options.push({
                memberId: participant.memberId,
                nickname: participant.nickname,
            });
        });

    return options;
}

export function renderRating(rating) {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export function formatReviewDate(value) {
    return value ? value.slice(0, 10) : "";
}
