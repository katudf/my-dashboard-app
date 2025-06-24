// src/lib/types.ts
export interface ProjectData {
  name: string;
  color: string;
  borderColor: string;
  startDate: string | null;
  endDate: string | null;
  order: number; // ★★★ 追加: 表示順 ★★★
}
export interface Project extends ProjectData { id: string; }

export interface TaskData {
  projectId: string;
  text: string;
  start: string;
  end: string;
  color?: string;
}
export interface Task extends TaskData { id: string; }

export interface PositionedTask extends Task { level: number; }

export interface WorkerData {
  name: string;
  birthDate?: string | null; // ★★★ 追加: 生年月日 ★★★
  order: number; // ★★★ 追加: 表示順 ★★★
}
export interface Worker extends WorkerData { id: string; }

export interface ProjectAssignment { type: 'project'; id: string; }
export interface StatusAssignment { type: 'status'; value: '休み' | '半休'; }
export type Assignment = ProjectAssignment | StatusAssignment;
export interface Assignments { [key: string]: Assignment[]; }

export interface WeatherData { [date: string]: { precip: number; temp: number; }; }
export interface HolidayData { [date: string]: string; }
