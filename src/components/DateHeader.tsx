// src/components/DateHeader.tsx
import React from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Plus } from 'lucide-react'; // Plusアイコンをインポート
import { STICKY_COL_WIDTH, DATE_CELL_WIDTH, HEADER_HEIGHT } from '../lib/constants';

interface DateHeaderProps {
  dates: Date[];
  holidays: { [date: string]: string };
  weatherData: { [date: string]: { precip: number; temp: number } };
  // ★★★ 新しいpropを追加 ★★★
  onProjectAdd: () => void;
}

export const DateHeader: React.FC<DateHeaderProps> = React.memo(({ dates, holidays, weatherData, onProjectAdd }) => {
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 100 }}>
      <div className="grid" style={{ gridTemplateColumns: `${STICKY_COL_WIDTH}px repeat(${dates.length}, ${DATE_CELL_WIDTH}px)` }}>
        {/* ★★★ 現場名ヘッダーにボタンを追加 ★★★ */}
        <div className="sticky top-0 left-0 z-50 bg-gray-200 border-b border-r border-gray-300 p-2 flex items-center justify-between" style={{ height: HEADER_HEIGHT }}>
          <span className="font-bold">現場名</span>
          <button
            onClick={onProjectAdd}
            className="flex items-center justify-center w-6 h-6 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 transition-transform transform hover:scale-110"
            title="新規現場を追加"
          >
            <Plus size={16} />
          </button>
        </div>
        {dates.map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          const holidayName = holidays[dateStr];
          const weather = weatherData[dateStr];
          const day = date.getDay();
          const isToday = format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          let dayColor = day === 0 || holidayName ? 'text-red-500' : day === 6 ? 'text-blue-500' : '';
          let bgColor = isToday ? 'bg-blue-100' : 'bg-gray-50';
          if (holidayName) bgColor = 'bg-red-100';
          return (
            <div key={dateStr} className={`sticky top-0 z-30 flex flex-col justify-center items-center border-b border-r border-gray-300 text-center p-1 ${bgColor}`} style={{ height: HEADER_HEIGHT }}>
              <span className={`font-semibold ${dayColor}`}>
                {format(date, 'M/d')}（{format(date, 'EEEE', { locale: ja }).slice(0,1)}）
              </span>
              <div className="text-xs font-normal mt-1 flex-grow flex flex-col justify-center">
                {holidayName ? <span className="text-red-700 font-medium truncate" title={holidayName}>{holidayName}</span> : weather ? (<div><span className="text-blue-600">💧{weather.precip}%</span><span className="text-red-600 ml-2">🌡️{weather.temp}°C</span></div>) : (<div className="text-gray-400">--</div>)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});
