// src/api/ai.ts
export const aiApi = {
  getTaskSuggestions: async (projectName: string): Promise<{ taskName: string; duration: number }[]> => {
    console.log(`AI API: Fetching task suggestions for "${projectName}"...`);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const suggestions = [
      { taskName: '足場設置', duration: 2 }, { taskName: '下地処理', duration: 3 },
      { taskName: '中塗り', duration: 2 }, { taskName: '上塗り', duration: 2 },
      { taskName: '検査・手直し', duration: 1 }, { taskName: '足場解体', duration: 1 },
    ];
    return suggestions.filter(() => Math.random() > 0.4);
  },
  generateWorkerMemo: async (workerName: string, schedule: string): Promise<string> => {
    console.log(`AI API: Generating memo for ${workerName} with schedule:\n${schedule}`);
    await new Promise(resolve => setTimeout(resolve, 1200));
    return `## ${workerName}さん 申し送りメモ\n\n**【要確認】**\n- 明日の現場入場は8:00厳守でお願いします。\n- 鈴木さんと連携し、高所作業の安全対策を再確認してください。\n\n**【特記事項】**\n${schedule.trim() ? `- 直近の予定は以下の通りです。\n${schedule.replace(/^/gm, '  - ')}` : '- 直近の予定はありません。'}\n\n*This is an AI-generated memo.*`;
  },
  analyzeRisk: async (date: string, weather: string, tasks: string): Promise<string> => {
    console.log(`AI API: Analyzing risk for ${date} with weather "${weather}" and tasks "${tasks}"`);
    await new Promise(resolve => setTimeout(resolve, 1800));
    let riskHtml = `<h3>${date} の潜在リスク分析</h3>`;
    riskHtml += `<p><strong>天候:</strong> ${weather} / <strong>主な作業:</strong> ${tasks || '未定'}</p>`;
    riskHtml += '<ul>';
    if (weather.includes('雨')) {
        riskHtml += '<li><strong class="text-red-500">降雨リスク:</strong> 塗装・防水作業は原則中止。感電防止のため電動工具の管理を徹底。</li>';
    }
    const tempMatch = weather.match(/(\d+)℃/);
    if (tempMatch && parseInt(tempMatch[1]) >= 30) {
        riskHtml += '<li><strong class="text-orange-500">熱中症リスク:</strong> 定期的な水分補給と塩分摂取を義務付け。作業中の体調変化に注意。</li>';
    }
    if (tasks.includes('塗装') || tasks.includes('防水')) {
        riskHtml += '<li><strong class="text-yellow-500">化学物質リスク:</strong> 有機溶剤の取り扱いに注意。適切な換気と保護具の着用を。</li>';
    }
    if (riskHtml.endsWith('<ul>')) {
        riskHtml += '<li>特筆すべき重大なリスクは検出されませんでした。基本的な安全対策を継続してください。</li>';
    }
    riskHtml += '</ul>';
    return riskHtml;
  },
};