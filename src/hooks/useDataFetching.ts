// src/hooks/useDataFetching.ts
import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db, appId } from '../config/firebase';
import { API_KEY, LAT, LON } from '../lib/constants';
import type { Project, Worker, Task, Assignments, WeatherData, HolidayData } from '../lib/types';

export const useDataFetching = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [workers, setWorkers] = useState<Worker[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [assignments, setAssignments] = useState<Assignments>({});
    const [weatherData, setWeatherData] = useState<WeatherData>({});
    const [holidays, setHolidays] = useState<HolidayData>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const showNotification = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        // 実際の通知実装に置き換えるか、イベントを発行するなどする
        console.log(`Notification (${type}): ${message}`);
        if(type === 'error') setError(message);
    }, []);

    // Firestore data fetching
    useEffect(() => {
        const collections = {
            projects: setProjects,
            workers: setWorkers,
            tasks: setTasks,
            assignments: (data: any[]) => {
                const assignmentsData: Assignments = {};
                data.forEach(doc => {
                   assignmentsData[doc.id] = doc.assignments;
                });
                setAssignments(assignmentsData);
            },
        };

        const unsubscribes = Object.entries(collections).map(([colName, setter]) => {
            const collRef = collection(db, 'artifacts', appId, colName);
            return onSnapshot(collRef, (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setter(data as any); // Type assertion is tricky here
                setIsLoading(false);
            }, (err) => {
                console.error(`Error fetching ${colName}:`, err);
                showNotification(`${colName}のデータ取得に失敗しました。`, 'error');
                setIsLoading(false);
            });
        });

        return () => unsubscribes.forEach(unsub => unsub());
    }, [appId, showNotification]);

    // External data fetching
    useEffect(() => {
        const fetchHolidays = async () => {
            try {
                const response = await fetch('https://holidays-jp.github.io/api/v1/date.json');
                if (!response.ok) throw new Error('祝日データの取得に失敗しました');
                setHolidays(await response.json());
            } catch (err) {
                console.error(err);
                showNotification('祝日データの取得に失敗しました', 'error');
            }
        };

        const fetchWeather = async () => {
             if (!API_KEY) return;
            try {
                const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${API_KEY}&units=metric`;
                const response = await fetch(url);
                if (!response.ok) throw new Error('天気データの取得に失敗しました');
                const data = await response.json();
                
                const dailyData: { [key: string]: { temps: number[], pops: number[] } } = {};
                data.list.forEach((item: any) => {
                    const date = item.dt_txt.split(' ')[0];
                    if (!dailyData[date]) dailyData[date] = { temps: [], pops: [] };
                    dailyData[date].temps.push(item.main.temp_max);
                    dailyData[date].pops.push(item.pop);
                });

                const newWeatherData: WeatherData = {};
                Object.keys(dailyData).forEach(date => {
                    newWeatherData[date] = {
                        temp: Math.round(Math.max(...dailyData[date].temps)),
                        precip: Math.round(Math.max(...dailyData[date].pops) * 100)
                    };
                });
                setWeatherData(newWeatherData);
            } catch (err) {
                console.error(err);
                showNotification('天気データの取得に失敗しました。', 'error');
            }
        };

        fetchHolidays();
        fetchWeather();
    }, [showNotification]);


    return { projects, workers, tasks, assignments, weatherData, holidays, isLoading, error, setProjects, setTasks, setAssignments, showNotification };
};