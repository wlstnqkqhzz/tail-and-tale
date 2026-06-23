package com.tailandtale.domain.member.service;

import com.tailandtale.domain.member.dto.MemberBlockDto;
import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.domain.member.entity.MemberBlock;
import com.tailandtale.domain.member.repository.MemberBlockRepository;
import com.tailandtale.domain.member.repository.MemberRepository;
import com.tailandtale.global.exception.CustomException;
import com.tailandtale.global.exception.MemberBlockErrorCode;
import com.tailandtale.global.exception.MemberErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// 회원 차단 Service

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberBlockService {
    private final MemberBlockRepository memberBlockRepository;
    private final MemberRepository memberRepository;

    // 내 차단 목록 조회
    public List<MemberBlockDto.Response> getMyBlocks(Long memberId) {
        return memberBlockRepository.findAllByBlockerMemberIdAndUnblockedAtIsNullOrderByBlockedAtDesc(memberId)
                .stream()
                .map(MemberBlockDto.Response::from)
                .toList();
    }

    // 회원 차단
    @Transactional
    public MemberBlockDto.Response blockMember(
            Long blockerMemberId,
            Long blockedMemberId,
            MemberBlockDto.Request request
    ) {
        validateNotSelf(blockerMemberId, blockedMemberId);

        Member blockerMember = getMember(blockerMemberId);
        Member blockedMember = getMember(blockedMemberId);

        MemberBlock memberBlock = memberBlockRepository.findByBlockerMemberIdAndBlockedMemberId(
                blockerMemberId,
                blockedMemberId
        ).map(existingBlock -> {
            existingBlock.blockAgain(request.getReason());
            return existingBlock;
        }).orElseGet(() -> MemberBlock.create(
                blockerMember,
                blockedMember,
                request.getReason()
        ));

        return MemberBlockDto.Response.from(memberBlockRepository.save(memberBlock));
    }

    // 회원 차단 해제
    @Transactional
    public void unblockMember(Long blockerMemberId, Long blockedMemberId) {
        MemberBlock memberBlock = memberBlockRepository.findByBlockerMemberIdAndBlockedMemberId(
                        blockerMemberId,
                        blockedMemberId
                )
                .filter(MemberBlock::isActive)
                .orElseThrow(() -> new CustomException(MemberBlockErrorCode.MEMBER_BLOCK_NOT_FOUND));

        memberBlock.unblock();
    }

    // 양방향 차단 관계 검증
    public void validateNotBlockedBetween(Long firstMemberId, Long secondMemberId) {
        if (isBlockedBetween(firstMemberId, secondMemberId)) {
            throw new CustomException(MemberBlockErrorCode.MEMBER_BLOCKED);
        }
    }

    // 양방향 차단 여부 조회
    public boolean isBlockedBetween(Long firstMemberId, Long secondMemberId) {
        return memberBlockRepository.existsByBlockerMemberIdAndBlockedMemberIdAndUnblockedAtIsNull(firstMemberId, secondMemberId)
                || memberBlockRepository.existsByBlockerMemberIdAndBlockedMemberIdAndUnblockedAtIsNull(secondMemberId, firstMemberId);
    }

    private Member getMember(Long memberId) {
        return memberRepository.findById(memberId)
                .orElseThrow(() -> new CustomException(MemberErrorCode.MEMBER_NOT_FOUND));
    }

    private void validateNotSelf(Long blockerMemberId, Long blockedMemberId) {
        if (blockerMemberId.equals(blockedMemberId)) {
            throw new CustomException(MemberBlockErrorCode.CANNOT_BLOCK_SELF);
        }
    }
}
