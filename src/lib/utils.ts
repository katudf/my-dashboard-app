// src/lib/utils.ts
import { format, parseISO, differenceInYears, differenceInDays } from 'date-fns';

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

export const getTaskBarColor = (projectColor: string): string => {
  const colorMap: { [key: string]: string } = {
    'bg-teal-500': 'bg-teal-300',
    'bg-orange-500': 'bg-orange-300',
    'bg-red-500': 'bg-red-300',
    'bg-yellow-500': 'bg-yellow-300',
    'bg-indigo-500': 'bg-indigo-300',
    'bg-purple-500': 'bg-purple-300',
    'bg-pink-500': 'bg-pink-300',
    'bg-blue-500': 'bg-blue-300',
  };
  return colorMap[projectColor] || projectColor;
};


