// 케어 날짜 유틸

import { tabs } from "../constants/carePage";

export function toDatetimeLocalValue(value) {
    return value ? value.slice(0, 16) : "";
}

export function formatDateOnly(value) {
    return value ? value.slice(0, 10) : "-";
}

export function toNumber(value) {
    const number = Number(value);

    return Number.isFinite(number) ? number : 0;
}

export function getCurrentDatetimeLocalValue() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");

    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function parseLocalDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number);

    return new Date(year, month - 1, day);
}

function toLocalDateString(date) {
    const pad = (value) => String(value).padStart(2, "0");

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function addDays(dateString, days) {
    const date = parseLocalDate(dateString);
    date.setDate(date.getDate() + days);

    return toLocalDateString(date);
}

export function getReviewRange(mode, anchorDate) {
    const anchor = parseLocalDate(anchorDate);

    if (mode === "month") {
        const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
        const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);

        return {
            startDate: toLocalDateString(start),
            endDate: toLocalDateString(end),
        };
    }

    const weekOptions = getMonthWeekOptions(anchorDate.slice(0, 7));
    const selectedWeek = weekOptions.find((option) => (
        anchorDate >= option.startDate && anchorDate <= option.endDate
    )) || weekOptions[0];

    return {
        startDate: selectedWeek.startDate,
        endDate: selectedWeek.endDate,
    };
}

export function buildDateRange(startDate, endDate) {
    const dates = [];
    let current = startDate;

    while (current <= endDate) {
        dates.push(current);
        current = addDays(current, 1);
    }

    return dates;
}

function getDateKey(value) {
    return value ? value.slice(0, 10) : "";
}

export function groupFirstByDate(records, fieldName) {
    const map = new Map();

    records.forEach((record) => {
        const dateKey = getDateKey(record[fieldName]);

        if (dateKey && !map.has(dateKey)) {
            map.set(dateKey, record);
        }
    });

    return map;
}

export function groupManyByDate(records, fieldName) {
    const map = new Map();

    records.forEach((record) => {
        const dateKey = getDateKey(record[fieldName]);

        if (!dateKey) {
            return;
        }

        const currentRecords = map.get(dateKey) || [];
        map.set(dateKey, [...currentRecords, record]);
    });

    return map;
}

export function getMondayBasedWeekday(dateString) {
    const day = parseLocalDate(dateString).getDay();

    return day === 0 ? 6 : day - 1;
}

export function getMonthWeekOptions(monthValue) {
    const monthStartDate = `${monthValue}-01`;
    const monthStart = parseLocalDate(monthStartDate);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const monthEndDate = toLocalDateString(monthEnd);
    const options = [];
    let currentStartDate = monthStartDate;
    let weekNumber = 1;

    while (currentStartDate <= monthEndDate) {
        const currentWeekday = getMondayBasedWeekday(currentStartDate);
        const daysInThisWeek = weekNumber === 1 ? 7 - currentWeekday : 7;
        const candidateEndDate = addDays(currentStartDate, daysInThisWeek - 1);
        const endDate = candidateEndDate > monthEndDate ? monthEndDate : candidateEndDate;

        options.push({
            weekNumber,
            startDate: currentStartDate,
            endDate,
        });

        currentStartDate = addDays(endDate, 1);
        weekNumber += 1;
    }

    return options;
}

export function getSelectedMonthWeekNumber(anchorDate, weekOptions) {
    return weekOptions.find((option) => (
        anchorDate >= option.startDate && anchorDate <= option.endDate
    ))?.weekNumber || weekOptions[0]?.weekNumber || 1;
}

export function getReviewStats(days, diariesByDate, walksByDate) {
    const diaries = days
        .map((date) => diariesByDate.get(date))
        .filter(Boolean);
    const walkCount = days.reduce((totalCount, date) => totalCount + (walksByDate.get(date)?.length || 0), 0);

    return {
        recordedDays: diaries.length,
        walkCount,
    };
}

export function normalizeCareTab(tab) {
    return tabs.some((item) => item.key === tab) ? tab : "walk";
}
