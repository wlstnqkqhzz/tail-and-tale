package com.tailandtale.domain.care.entity;

import com.tailandtale.domain.dog.entity.Dog;
import com.tailandtale.global.common.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

// 감정 다이어리 Entity

@Entity
@Table(
        name = "emotion_diary",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_emotion_diary_dog_date", columnNames = {"dog_id", "recorded_date"})
        }
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class EmotionDiary extends BaseEntity {

    // 감정 다이어리 ID
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "emotion_diary_id")
    private Long id;

    // 반려견
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dog_id", nullable = false)
    private Dog dog;

    // 연결된 산책 기록 ID
    @Column(name = "walk_record_id")
    private Long walkRecordId;

    // 기록일
    @Column(name = "recorded_date", nullable = false)
    private LocalDate recordedDate;

    // 감정 상태
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DogEmotion emotion;

    // 행동 패턴
    @Column(name = "behavior_pattern", length = 500)
    private String behaviorPattern;

    // 컨디션 점수
    @Column(name = "condition_level")
    private Integer conditionLevel;

    // 다이어리 내용
    @Column(name = "diary_content", length = 1500)
    private String diaryContent;

    // 감정 다이어리 생성
    private EmotionDiary(
            Dog dog,
            Long walkRecordId,
            LocalDate recordedDate,
            DogEmotion emotion,
            String behaviorPattern,
            Integer conditionLevel,
            String diaryContent
    ) {
        this.dog = dog;
        this.walkRecordId = walkRecordId;
        this.recordedDate = recordedDate;
        this.emotion = emotion == null ? DogEmotion.UNKNOWN : emotion;
        this.behaviorPattern = behaviorPattern;
        this.conditionLevel = conditionLevel;
        this.diaryContent = diaryContent;
    }

    // 감정 다이어리 생성
    public static EmotionDiary create(
            Dog dog,
            Long walkRecordId,
            LocalDate recordedDate,
            DogEmotion emotion,
            String behaviorPattern,
            Integer conditionLevel,
            String diaryContent
    ) {
        return new EmotionDiary(
                dog,
                walkRecordId,
                recordedDate,
                emotion,
                behaviorPattern,
                conditionLevel,
                diaryContent
        );
    }

    // 감정 다이어리 수정
    public void update(
            Dog dog,
            Long walkRecordId,
            LocalDate recordedDate,
            DogEmotion emotion,
            String behaviorPattern,
            Integer conditionLevel,
            String diaryContent
    ) {
        if (dog != null) {
            this.dog = dog;
        }
        if (walkRecordId != null) {
            this.walkRecordId = walkRecordId;
        }
        if (recordedDate != null) {
            this.recordedDate = recordedDate;
        }
        if (emotion != null) {
            this.emotion = emotion;
        }
        if (behaviorPattern != null) {
            this.behaviorPattern = behaviorPattern;
        }
        if (conditionLevel != null) {
            this.conditionLevel = conditionLevel;
        }
        if (diaryContent != null) {
            this.diaryContent = diaryContent;
        }
    }
}
