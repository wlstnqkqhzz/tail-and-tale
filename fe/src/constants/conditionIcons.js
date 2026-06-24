import condition1Icon from "../assets/icons/conditions/condition-1.svg";
import condition2Icon from "../assets/icons/conditions/condition-2.svg";
import condition3Icon from "../assets/icons/conditions/condition-3.svg";
import condition4Icon from "../assets/icons/conditions/condition-4.svg";
import condition5Icon from "../assets/icons/conditions/condition-5.svg";

export const CONDITION_ICONS = {
    1: condition1Icon,
    2: condition2Icon,
    3: condition3Icon,
    4: condition4Icon,
    5: condition5Icon,
};

export const CONDITION_LABELS = {
    1: "매우 안좋음",
    2: "안좋음",
    3: "보통",
    4: "좋음",
    5: "매우 좋음",
};

export function getConditionIcon(conditionLevel) {
    return CONDITION_ICONS[Number(conditionLevel)] || CONDITION_ICONS[3];
}

export function getConditionLabel(conditionLevel) {
    return CONDITION_LABELS[Number(conditionLevel)] || CONDITION_LABELS[3];
}
