import { format, parseISO, differenceInYears } from 'date-fns';

export const formatDateStr = (date: Date): string => format(date, 'yyyy-MM-dd');
export const parseDateStr = (dateStr: string): Date => parseISO(dateStr);

export const calculateAge = (birthDateStr?: string | null): number | null => {
    if (!birthDateStr) {
        return null;
    }
    try {
        const birthDate = parseISO(birthDateStr);
        const today = new Date();
        return differenceInYears(today, birthDate);
    } catch (e) {
        console.error("Invalid birth date string:", birthDateStr, e);
        return null;
    }
};