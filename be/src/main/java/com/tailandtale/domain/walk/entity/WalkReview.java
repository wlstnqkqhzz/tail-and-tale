package com.tailandtale.domain.walk.entity;

import com.tailandtale.domain.member.entity.Member;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 산책 후기 Entity

@Entity
@Table(
        name = "walk_review",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_walk_review",
                columnNames = {"walk_schedule_id", "reviewer_id", "reviewee_id"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WalkReview extends BaseEntity {

    // 산책 후기 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "walk_review_id")
    private Long id;

    // 산책 일정
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "walk_schedule_id", nullable = false)
    private WalkSchedule walkSchedule;

    // 작성 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private Member reviewer;

    // 평가 대상 회원
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private Member reviewee;

    // 평점
    @Column(nullable = false)
    private Integer rating;

    // 후기 내용
    @Column(length = 1000)
    private String content;

    // 산책 후기 생성
    private WalkReview(
            WalkSchedule walkSchedule,
            Member reviewer,
            Member reviewee,
            Integer rating,
            String content
    ) {
        this.walkSchedule = walkSchedule;
        this.reviewer = reviewer;
        this.reviewee = reviewee;
        this.rating = rating;
        this.content = content;
    }

    // 산책 후기 생성
    public static WalkReview create(
            WalkSchedule walkSchedule,
            Member reviewer,
            Member reviewee,
            Integer rating,
            String content
    ) {
        return new WalkReview(
                walkSchedule,
                reviewer,
                reviewee,
                rating,
                content
        );
    }

    // 산책 후기 수정
    public void update(
            Integer rating,
            String content
    ) {
        if (rating != null) {
            this.rating = rating;
        }
        if (content != null) {
            this.content = content;
        }
    }
}
