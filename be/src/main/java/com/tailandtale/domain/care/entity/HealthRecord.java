package com.tailandtale.domain.care.entity;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

// 건강 기록 Entity

@Entity
@Table(
        name = "health_record",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_health_record_dog_date", columnNames = {"dog_id", "recorded_date"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class HealthRecord extends BaseEntity {

    // 건강 기록 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "health_record_id")
    private Long id;

    // 반려견
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id", nullable = false)
    private Dog dog;

    // 기록일
    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    // 몸무게
    @Column(precision = 5, scale = 2)
    private BigDecimal weight;

    // 건강 상태
    @Enumerated(EnumType.STRING)
    @Column(name = "health_status", length = 20)
    private HealthStatus healthStatus;

    // 증상
    @Column(length = 500)
    private String symptoms;

    // 메모
    @Column(length = 1000)
    private String memo;

    // 건강 기록 생성
    private HealthRecord(
            Dog dog,
            LocalDate recordedDate,
            BigDecimal weight,
            HealthStatus healthStatus,
            String symptoms,
            String memo
    ) {
        this.dog = dog;
        this.recordedDate = recordedDate;
        this.weight = weight;
        this.healthStatus = healthStatus;
        this.symptoms = symptoms;
        this.memo = memo;
    }

    // 건강 기록 생성
    public static HealthRecord create(
            Dog dog,
            LocalDate recordedDate,
            BigDecimal weight,
            HealthStatus healthStatus,
            String symptoms,
            String memo
    ) {
        return new HealthRecord(
                dog,
                recordedDate,
                weight,
                healthStatus,
                symptoms,
                memo
        );
    }

    // 건강 기록 수정
    public void update(
            Dog dog,
            LocalDate recordedDate,
            BigDecimal weight,
            HealthStatus healthStatus,
            String symptoms,
            String memo
    ) {
        if (dog != null) {
            this.dog = dog;
        }
        if (recordedDate != null) {
            this.recordedDate = recordedDate;
        }
        if (weight != null) {
            this.weight = weight;
        }
        if (healthStatus != null) {
            this.healthStatus = healthStatus;
        }
        if (symptoms != null) {
            this.symptoms = symptoms;
        }
        if (memo != null) {
            this.memo = memo;
        }
    }
}
