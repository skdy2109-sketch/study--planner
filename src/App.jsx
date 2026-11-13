import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  BookOpen,
  Sparkles,
  Paperclip,
  FileText,
  Download,
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  CalendarPlus,
  ExternalLink,
  Trash2
} from 'lucide-react';

const SUBJECT_LIST = [
  '국어', '수학', '영어', '한국사', '통합사회', '사회', '지리', '윤리', '역사',
  '통합과학', '물리학', '화학', '생명과학', '지구과학', '기술·가정', '정보',
  '체육', '음악', '미술', '한문', '제2외국어'
];

const TYPE_LIST = ['수행평가', '지필평가', '기타 일정'];

const WEEKDAYS = [
  { label: '일', value: 0 }, { label: '월', value: 1 }, { label: '화', value: 2 },
  { label: '수', value: 3 }, { label: '목', value: 4 }, { label: '금', value: 5 },
  { label: '토', value: 6 }
];

export default function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('study_tasks_v7');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("로컬 저장소 로딩 실패:", e);
      }
    }
    return [];
  });

  const [dateMode, setDateMode] = useState('single');
  const [formData, setFormData] = useState({
    title: '',
    subject: '국어',
    taskType: '수행평가',
    dueDate: '',
    weight: 10,
    memo: '',
    link: ''
  });

  const [multipleDates, setMultipleDates] = useState([]);
  const [tempDate, setTempDate] = useState('');
  const [repeatRange, setRepeatRange] = useState({ startDate: '', endDate: '', selectedDay: 6 });
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [statusFilter, setStatusFilter] = useState(['active', 'overlapped']);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [viewMode, setViewMode] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateDetails, setSelectedDateDetails] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('study_tasks_v7', JSON.stringify(tasks));
    } catch (e) {
      console.warn("로컬스토리지 저장 실패:", e);
    }
  }, [tasks]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'weight' ? Number(value) : value }));
  };

  const addMultipleDate = () => {
    if (tempDate && !multipleDates.includes(tempDate)) {
      setMultipleDates(prev => [...prev, tempDate].sort());
      setTempDate('');
    }
  };

  const removeMultipleDate = (targetDate) => {
    setMultipleDates(prev => prev.filter(d => d !== targetDate));
  };

  const calculateRepeatDates = (startDateStr, endDateStr, targetDayOfWeek) => {
    if (!startDateStr || !endDateStr) return [];
    const start = new Date(startDateStr);
    const end = new Date(endDateStr);
    const results = [];
    if (start > end) return [];
    let curr = new Date(start);
    while (curr <= end) {
      if (curr.getDay() === Number(targetDayOfWeek)) {
        results.push(curr.toISOString().split('T')[0]);
      }
      curr.setDate(curr.getDate() + 1);
    }
    return results;
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    const filePromises = selectedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          resolve({
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type,
            isImage: file.type.startsWith('image/'),
            dataUrl: event.target.result
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(filePromises).then(newFiles => {
      setAttachedFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  const removeAttachedFile = (fileId) => {
    setAttachedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleAddTask = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.title) return;

    let targetDates = [];
    if (dateMode === 'single') {
      if (!formData.dueDate) return;
      targetDates = [formData.dueDate];
    } else if (dateMode === 'multiple') {
      if (multipleDates.length === 0) return;
      targetDates = multipleDates;
    } else if (dateMode === 'repeat') {
      targetDates = calculateRepeatDates(repeatRange.startDate, repeatRange.endDate, repeatRange.selectedDay);
      if (targetDates.length === 0) {
        setErrorMsg('설정한 기간 내에 해당 요일이 존재하지 않거나 날짜가 올바르지 않습니다.');
        return;
      }
    }

    const newTasks = targetDates.map((d, idx) => ({
      id: (Date.now() + idx).toString(),
      ...formData,
      dueDate: d,
      files: attachedFiles,
      completed: false
    }));

    setTasks(prev => [...prev, ...newTasks]);
    setFormData({ title: '', subject: '국어', taskType: '수행평가', dueDate: '', weight: 10, memo: '', link: '' });
    setMultipleDates([]);
    setRepeatRange({ startDate: '', endDate: '', selectedDay: 6 });
    setAttachedFiles([]);
  };

  const toggleComplete = (id) => {
    setTasks(prev => prev.map(task => task.id === id ? { ...task, completed: !task.completed } : task));
  };

  const deleteTask = (id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const calculateDDay = (dueDateStr) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(dueDateStr);
    targetDate.setHours(0, 0, 0, 0);
    return Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const dateCounts = tasks.reduce((acc, task) => {
    if (!task.completed) acc[task.dueDate] = (acc[task.dueDate] || 0) + 1;
    return acc;
  }, {});

  const analyzePriority = (task) => {
    const dDay = calculateDDay(task.dueDate);
    const isOverlapped = (dateCounts[task.dueDate] || 0) > 1;
    let urgencyScore = dDay <= 0 ? 100 : dDay === 1 ? 85 : dDay === 2 ? 70 : dDay <= 3 ? 45 : 15;
    const priorityScore = (urgencyScore * 0.6) + (task.weight * 0.4);
    let nagMessage = '';
    if (dDay < 0) nagMessage = '지금이라도 제출해 감점을 줄이세요.';
    else if (dDay === 0) nagMessage = '오늘이 마감일입니다. 최우선으로 마무리하세요.';
    else if (dDay <= 2) {
      nagMessage = task.weight >= 20
        ? `비중이 ${task.weight}%인 ${task.subject} ${task.taskType}입니다. 지금 당장 시작해야 합니다.`
        : '마감이 다가왔습니다. 오늘 바로 완성해두세요.';
    } else if (isOverlapped) {
      nagMessage = '이날 일정이 몰려 있습니다. 미리미리 준비하세요.';
    } else {
      nagMessage = '꾸준히 진행 상황을 점검하세요.';
    }
    return { dDay, priorityScore, nagMessage, isOverlapped };
  };

  const sortedTasks = [...tasks].sort((a, b) => analyzePriority(b).priorityScore - analyzePriority(a).priorityScore);
  const urgentTasks = sortedTasks.filter(t => !t.completed).slice(0, 2);

  const filteredTasks = sortedTasks.filter(task => {
    const isComp = task.completed;
    const isOverlapped = (dateCounts[task.dueDate] || 0) > 1;
    let statusMatch = false;
    if (statusFilter.includes('active') && !isComp && !isOverlapped) statusMatch = true;
    if (statusFilter.includes('overlapped') && !isComp && isOverlapped) statusMatch = true;
    if (statusFilter.includes('completed') && isComp) statusMatch = true;
    const subjectMatch = subjectFilter === 'all' || task.subject === subjectFilter;
    const typeMatch = typeFilter === 'all' || task.taskType === typeFilter;
    return statusMatch && subjectMatch && typeMatch;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const lastDateOfMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) calendarDays.push(null);
  for (let d = 1; d <= lastDateOfMonth; d++) {
    calendarDays.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between">
      <div>
        <header className="bg-slate-900 text-slate-300 text-xs py-2.5 px-6 text-center border-b border-slate-800">
          Copyright © 2026 NH. L. All rights reserved.
        </header>

        <div className="max-w-4xl mx-auto px-4 pt-6 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-blue-600" />
              수행평가 & 일정 스마트 매니저
            </h1>
            <p className="text-sm text-slate-500 mt-1">체계적인 일정 관리와 스마트 재촉 시스템으로 성적을 지키세요.</p>
          </div>
          <div className="flex bg-slate-200 p-1 rounded-xl">
            <button onClick={() => setViewMode('calendar')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              <CalendarDays className="w-4 h-4" /> 달력 + 입력 폼
            </button>
            <button onClick={() => setViewMode('list')} className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
              <List className="w-4 h-4" /> 전체 목록 모아보기 ({tasks.length})
            </button>
          </div>
        </div>

        <main className="max-w-4xl mx-auto px-4 space-y-6">
          <section className="bg-slate-900 text-white rounded-2xl p-6 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                <h2 className="font-bold text-lg tracking-wide">스마트 재촉 시스템 가동중</h2>
              </div>
              <span className="text-xs bg-blue-600/30 border border-blue-400 text-blue-300 px-3 py-1 rounded-full font-medium">
                가장 급한 일정 {urgentTasks.length}건
              </span>
            </div>
            {urgentTasks.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                등록된 일정이 없거나 모든 일정을 완료했습니다! 새로운 일정을 추가해 보세요.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {urgentTasks.map(task => {
                  const analysis = analyzePriority(task);
                  return (
                    <div key={task.id} className="bg-slate-800/90 rounded-xl p-4 border border-slate-700 hover:border-blue-500 transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded bg-blue-600 text-white">{task.subject} · {task.taskType}</span>
                          <span className="text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                            {analysis.dDay < 0 ? `D+${Math.abs(analysis.dDay)}` : analysis.dDay === 0 ? 'D-Day' : `D-${analysis.dDay}`}
                          </span>
                        </div>
                        <h3 className="font-bold text-base text-white mb-1 line-clamp-1">{task.title}</h3>
                        <p className="text-xs text-blue-300 font-medium bg-blue-950/60 p-2 rounded border border-blue-900/50 mb-3">{analysis.nagMessage}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-slate-700/60 text-xs text-slate-400">
                        <span>마감일: {task.dueDate}</span>
                        <span className="text-slate-300 font-semibold">성적 반영비율: {task.weight}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {viewMode === 'calendar' ? (
            <div className="space-y-6">
              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-slate-900">{year}년 {month + 1}월 일정 달력</h2>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"><ChevronLeft className="w-4 h-4" /></button>
                    <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100 text-slate-700">오늘</button>
                    <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-semibold text-xs text-slate-500 mb-2">
                  <span className="text-red-500">일</span><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span className="text-blue-500">토</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5">
                  {calendarDays.map((dayStr, idx) => {
                    if (!dayStr) return <div key={`empty-${idx}`} className="h-24 bg-slate-50/50 rounded-xl"></div>;
                    const dayTasks = tasks.filter(t => t.dueDate === dayStr);
                    const isToday = dayStr === new Date().toISOString().split('T')[0];
                    return (
                      <div key={dayStr} onClick={() => setSelectedDateDetails({ date: dayStr, tasks: dayTasks })} className={`h-24 p-1.5 rounded-xl border transition-all flex flex-col justify-between cursor-pointer overflow-hidden ${isToday ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300 bg-white'}`}>
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${isToday ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>{parseInt(dayStr.split('-')[2])}</span>
                          {dayTasks.length > 0 && <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded-full font-bold">{dayTasks.length}</span>}
                        </div>
                        <div className="space-y-1 overflow-y-auto flex-1 mt-1">
                          {dayTasks.map(t => (
                            <div key={t.id} className={`text-[10px] px-1 py-0.5 rounded truncate font-medium ${t.completed ? 'bg-slate-200 text-slate-500 line-through' : 'bg-blue-100 text-blue-800'}`}>[{t.subject}] {t.title}</div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><CalendarPlus className="w-5 h-5 text-blue-600" /> 새 일정 추가하기</h2>
                {errorMsg && <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-xs font-semibold border border-red-200">{errorMsg}</div>}
                <div className="flex border-b border-slate-200 mb-5">
                  <button type="button" onClick={() => setDateMode('single')} className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${dateMode === 'single' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>단일 날짜</button>
                  <button type="button" onClick={() => setDateMode('multiple')} className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${dateMode === 'multiple' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>여러 날짜 선택</button>
                  <button type="button" onClick={() => setDateMode('repeat')} className={`pb-2.5 px-4 text-sm font-semibold border-b-2 transition-all ${dateMode === 'repeat' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>매주 반복 설정</button>
                </div>

                <form onSubmit={handleAddTask} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">일정 제목 *</label>
                      <input type="text" name="title" value={formData.title} onChange={handleInputChange} required placeholder="예: 미분단원 중간 지필고사 준비" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">과목 선택</label>
                      <select name="subject" value={formData.subject} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none">
                        {SUBJECT_LIST.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">일정 유형</label>
                      <select name="taskType" value={formData.taskType} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white outline-none">
                        {TYPE_LIST.map(type => <option key={type} value={type}>{type}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">성적 반영비율 (%)</label>
                      <input type="number" name="weight" min="1" max="100" value={formData.weight} onChange={handleInputChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
                    </div>
                  </div>

                  {dateMode === 'single' && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">마감일 (Due Date) *</label>
                      <input type="date" name="dueDate" value={formData.dueDate} onChange={handleInputChange} required className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
                    </div>
                  )}

                  {dateMode === 'multiple' && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700">개별 날짜 여러 개 지정</label>
                      <div className="flex gap-2">
                        <input type="date" value={tempDate} onChange={(e) => setTempDate(e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                        <button type="button" onClick={addMultipleDate} className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold">날짜 추가</button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {multipleDates.map(d => (
                          <span key={d} className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-full font-medium">
                            {d} <button type="button" onClick={() => removeMultipleDate(d)}><X className="w-3.5 h-3.5" /></button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {dateMode === 'repeat' && (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold text-slate-700">기간 및 요일 반복 설정</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input type="date" value={repeatRange.startDate} onChange={(e) => setRepeatRange(prev => ({ ...prev, startDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                        <input type="date" value={repeatRange.endDate} onChange={(e) => setRepeatRange(prev => ({ ...prev, endDate: e.target.value }))} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white" />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {WEEKDAYS.map(w => (
                          <button key={w.value} type="button" onClick={() => setRepeatRange(prev => ({ ...prev, selectedDay: w.value }))} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${repeatRange.selectedDay === w.value ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}>
                            {w.label}요일
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <input type="url" name="link" value={formData.link} onChange={handleInputChange} placeholder="참고 링크 (선택)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none" />
                  <textarea name="memo" value={formData.memo} onChange={handleInputChange} rows="2" placeholder="메모 및 준비물 (선택)" className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none resize-none" />

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-slate-700">
                      <Paperclip className="w-4 h-4" /> 파일 선택
                      <input type="file" ref={fileInputRef} multiple onChange={handleFileSelect} className="hidden" />
                    </label>
                    <span className="text-xs text-slate-400">{isUploading ? '업로드 중...' : `${attachedFiles.length}개 파일 첨부됨`}</span>
                  </div>

                  <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-md">
                    + 일정 등록하기
                  </button>
                </form>
              </section>
            </div>
          ) : (
            <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><List className="w-5 h-5 text-blue-600" /> 전체 일정 목록 ({filteredTasks.length}건)</h2>
                <div className="flex flex-wrap items-center gap-2">
                  <select value={subjectFilter} onChange={(e) => setSubjectFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                    <option value="all">과목 전체</option>
                    {SUBJECT_LIST.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white">
                    <option value="all">유형 전체</option>
                    {TYPE_LIST.map(type => <option key={type} value={type}>{type}</option>)}
                  </select>
                </div>
              </div>
              {filteredTasks.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">조건에 맞는 일정이 없습니다.</div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map(task => {
                    const analysis = analyzePriority(task);
                    return (
                      <div key={task.id} className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${task.completed ? 'bg-slate-50 opacity-70' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-start gap-3">
                          <button onClick={() => toggleComplete(task.id)} className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center ${task.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 text-transparent'}`}><Check className="w-3.5 h-3.5" /></button>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">{task.subject}</span>
                              <span className="text-xs font-semibold text-slate-600">{task.taskType}</span>
                              <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100">{analysis.dDay < 0 ? `D+${Math.abs(analysis.dDay)}` : analysis.dDay === 0 ? 'D-Day' : `D-${analysis.dDay}`}</span>
                            </div>
                            <h3 className={`font-bold text-base ${task.completed ? 'line-through text-slate-500' : 'text-slate-900'}`}>{task.title}</h3>
                            <p className="text-xs text-slate-500 mt-1">마감일: {task.dueDate} | 성적 반영비율: {task.weight}%</p>
                          </div>
                        </div>
                        <button onClick={() => deleteTask(task.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}
        </main>
      </div>

      {selectedDateDetails && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-lg">{selectedDateDetails.date} 일정 목록</h3>
              <button onClick={() => setSelectedDateDetails(null)}><X className="w-5 h-5" /></button>
            </div>
            {selectedDateDetails.tasks.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">이 날짜에 등록된 일정이 없습니다.</p>
            ) : (
              <div className="space-y-3">
                {selectedDateDetails.tasks.map(t => (
                  <div key={t.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">{t.subject}</span>
                    <h4 className="font-bold text-sm mt-1">{t.title}</h4>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setSelectedDateDetails(null)} className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold">닫기</button>
          </div>
        </div>
      )}

      <footer className="mt-16 bg-slate-900 text-slate-400 py-6 px-6 text-center text-xs border-t border-slate-800">
        <p>Copyright © 2026 NH. L. All rights reserved.</p>
      </footer>
    </div>
  );
}