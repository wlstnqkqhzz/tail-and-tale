package com.tailandtale.domain.member.entity;

import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 뱃지 Entity

@Entity
@Table(
        name = "badge",
        uniqueConstraints = @UniqueConstraint(name = "uk_badge_code", columnNames = "code")
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Badge extends BaseEntity {

    // 뱃지 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "badge_id")
    private Long id;

    // 뱃지 코드
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private BadgeCode code;

    // 뱃지 이름
    @Column(nullable = false, length = 50)
    private String name;

    // 뱃지 설명
    @Column(length = 300)
    private String description;

    // 뱃지 아이콘 URL
    @Column(name = "icon_url", length = 500)
    private String iconUrl;

    // 획득 조건 유형
    @Enumerated(EnumType.STRING)
    @Column(name = "condition_type", nullable = false)
    private BadgeConditionType conditionType;

    // 획득 조건 값
    @Column(name = "condition_value")
    private Integer conditionValue;

    // 사용 여부
    @Column(name = "is_active", nullable = false)
    private Boolean isActive;
}
