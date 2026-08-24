"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, ArrowRight } from '@carbon/icons-react';

export type TimeFilterMode = 'quick' | 'absolute';

export type QuickUnit = 'seconds' | 'minutes' | 'hours' | 'days' | 'weeks' | 'months' | 'years';

export interface TimeRangeValue {
  mode: TimeFilterMode;
  label: string;
  startTime: Date | null;
  endTime: Date | null;
  quickAmount?: number;
  quickUnit?: QuickUnit;
  presetKey?: string;
  isNext?: boolean;
}

interface ElasticTimeFilterProps {
  value?: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
  compact?: boolean;
  onRefresh?: () => void;
}

const COMMONLY_USED_PRESETS = [
  { key: 'today', label: 'Today', col: 1 },
  { key: 'yesterday', label: 'Yesterday', col: 2 },
  { key: 'this_week', label: 'This week', col: 1 },
  { key: 'week_to_date', label: 'Week to date', col: 2 },
  { key: 'this_month', label: 'This month', col: 1 },
  { key: 'month_to_date', label: 'Month to date', col: 2 },
  { key: 'this_year', label: 'This year', col: 1 },
  { key: 'year_to_date', label: 'Year to date', col: 2 },
  { key: 'last_15m', label: 'Last 15 minutes', col: 1, amount: 15, unit: 'minutes' },
  { key: 'last_30m', label: 'Last 30 minutes', col: 2, amount: 30, unit: 'minutes' },
  { key: 'last_1h', label: 'Last 1 hour', col: 1, amount: 1, unit: 'hours' },
  { key: 'last_4h', label: 'Last 4 hours', col: 2, amount: 4, unit: 'hours' },
  { key: 'last_24h', label: 'Last 24 hours', col: 1, amount: 24, unit: 'hours' },
  { key: 'last_7d', label: 'Last 7 days', col: 2, amount: 7, unit: 'days' },
  { key: 'last_30d', label: 'Last 30 days', col: 2, amount: 30, unit: 'days' },
];

export function getQuickRange(amount: number, unit: QuickUnit, isNext: boolean = false): { startTime: Date; endTime: Date; label: string } {
  const now = new Date();
  const unitMsMap: Record<QuickUnit, number> = {
    seconds: 1000,
    minutes: 60 * 1000,
    hours: 60 * 60 * 1000,
    days: 24 * 60 * 60 * 1000,
    weeks: 7 * 24 * 60 * 60 * 1000,
    months: 30 * 24 * 60 * 60 * 1000,
    years: 365 * 24 * 60 * 60 * 1000,
  };

  const ms = (unitMsMap[unit] || 60 * 1000) * amount;
  let startTime: Date;
  let endTime: Date;

  if (isNext) {
    startTime = now;
    endTime = new Date(now.getTime() + ms);
  } else {
    startTime = new Date(now.getTime() - ms);
    endTime = now;
  }

  const unitSingular = amount === 1 ? unit.replace(/s$/, '') : unit;
  const label = `${isNext ? 'Next' : 'Last'} ${amount} ${unitSingular}`;

  return { startTime, endTime, label };
}

export function getPresetRange(presetKey: string): { startTime: Date; endTime: Date; label: string } {
  const now = new Date();
  let startTime = new Date();
  let endTime = new Date();
  let label = '';

  switch (presetKey) {
    case 'today': {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endTime = now;
      label = 'Today';
      break;
    }
    case 'yesterday': {
      startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
      endTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
      label = 'Yesterday';
      break;
    }
    case 'this_week':
    case 'week_to_date': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startTime = new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0, 0);
      endTime = now;
      label = presetKey === 'this_week' ? 'This week' : 'Week to date';
      break;
    }
    case 'this_month':
    case 'month_to_date': {
      startTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endTime = now;
      label = presetKey === 'this_month' ? 'This month' : 'Month to date';
      break;
    }
    case 'this_year':
    case 'year_to_date': {
      startTime = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endTime = now;
      label = presetKey === 'this_year' ? 'This year' : 'Year to date';
      break;
    }
    case 'last_15m':
      return getQuickRange(15, 'minutes');
    case 'last_30m':
      return getQuickRange(30, 'minutes');
    case 'last_1h':
      return getQuickRange(1, 'hours');
    case 'last_4h':
      return getQuickRange(4, 'hours');
    case 'last_24h':
      return getQuickRange(24, 'hours');
    case 'last_7d':
      return getQuickRange(7, 'days');
    case 'last_30d':
      return getQuickRange(30, 'days');
    default:
      return getQuickRange(15, 'minutes');
  }

  return { startTime, endTime, label };
}

function formatElasticDateTime(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return '-';
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mon = months[d.getMonth()];
  const day = String(d.getDate()).padStart(2, '0');
  const yr = d.getFullYear();
  const hr = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  const sec = String(d.getSeconds()).padStart(2, '0');
  return `${mon} ${day}, ${yr} @ ${hr}:${min}:${sec}.000`;
}

function formatInputDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  const padH = String(h12).padStart(2, '0');
  TIME_OPTIONS.push(`${padH}:00 ${ampm}`);
  TIME_OPTIONS.push(`${padH}:30 ${ampm}`);
}

export function getDefaultTimeRange(): TimeRangeValue {
  const { startTime, endTime, label } = getQuickRange(15, 'minutes');
  return {
    mode: 'quick',
    label,
    startTime,
    endTime,
    quickAmount: 15,
    quickUnit: 'minutes',
    presetKey: 'last_15m',
    isNext: false,
  };
}

export default function ElasticTimeFilter({
  value,
  onChange,
  compact = false,
  onRefresh,
}: ElasticTimeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Active Value fallback
  const currentValue = useMemo(() => {
    return value || getDefaultTimeRange();
  }, [value]);

  // Popover State
  const [activeTab, setActiveTab] = useState<TimeFilterMode>(currentValue.mode || 'quick');

  // Quick Select Tab State
  const [quickDirection, setQuickDirection] = useState<'Last' | 'Next'>(currentValue.isNext ? 'Next' : 'Last');
  const [quickAmount, setQuickAmount] = useState<number>(currentValue.quickAmount || 15);
  const [quickUnit, setQuickUnit] = useState<QuickUnit>(currentValue.quickUnit || 'minutes');

  // Absolute Tab State
  const [absTarget, setAbsTarget] = useState<'start' | 'end'>('start');
  const [absStart, setAbsStart] = useState<Date>(currentValue.startTime || new Date(Date.now() - 15 * 60 * 1000));
  const [absEnd, setAbsEnd] = useState<Date>(currentValue.endTime || new Date());
  
  // Calendar month view (tracks currently viewed month in date picker)
  const [viewYear, setViewYear] = useState<number>(() => (absTarget === 'start' ? absStart : absEnd).getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(() => (absTarget === 'start' ? absStart : absEnd).getMonth());

  // Direct text input state for absolute
  const [startInputText, setStartInputText] = useState<string>(() => formatInputDateTime(absStart));
  const [endInputText, setEndInputText] = useState<string>(() => formatInputDateTime(absEnd));

  // Synchronize internal state when value or open state changes
  useEffect(() => {
    if (currentValue.startTime) {
      setAbsStart(currentValue.startTime);
      setStartInputText(formatInputDateTime(currentValue.startTime));
    }
    if (currentValue.endTime) {
      setAbsEnd(currentValue.endTime);
      setEndInputText(formatInputDateTime(currentValue.endTime));
    }
    if (currentValue.quickAmount) setQuickAmount(currentValue.quickAmount);
    if (currentValue.quickUnit) setQuickUnit(currentValue.quickUnit);
    if (currentValue.mode) setActiveTab(currentValue.mode);
    setQuickDirection(currentValue.isNext ? 'Next' : 'Last');
  }, [currentValue, isOpen]);

  // Update calendar view when switching between start & end
  useEffect(() => {
    const targetDate = absTarget === 'start' ? absStart : absEnd;
    setViewYear(targetDate.getFullYear());
    setViewMonth(targetDate.getMonth());
  }, [absTarget]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Step range forward / backward (< and > buttons)
  const handleStepRange = (direction: 'prev' | 'next', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const st = currentValue.startTime ? new Date(currentValue.startTime) : new Date(Date.now() - 15 * 60 * 1000);
    const et = currentValue.endTime ? new Date(currentValue.endTime) : new Date();
    const diff = et.getTime() - st.getTime();
    if (diff <= 0) return;

    let newStart: Date;
    let newEnd: Date;

    if (direction === 'prev') {
      newStart = new Date(st.getTime() - diff);
      newEnd = new Date(et.getTime() - diff);
    } else {
      newStart = new Date(st.getTime() + diff);
      newEnd = new Date(et.getTime() + diff);
    }

    const label = `${formatElasticDateTime(newStart).split('@')[0]} → ${formatElasticDateTime(newEnd).split('@')[0]}`;
    onChange({
      mode: 'absolute',
      label,
      startTime: newStart,
      endTime: newEnd,
    });
  };

  // Apply Quick Select custom
  const handleApplyQuick = () => {
    const isNext = quickDirection === 'Next';
    const { startTime, endTime, label } = getQuickRange(quickAmount, quickUnit, isNext);
    onChange({
      mode: 'quick',
      label,
      startTime,
      endTime,
      quickAmount,
      quickUnit,
      isNext,
    });
    setIsOpen(false);
  };

  // Apply Commonly Used Preset
  const handleSelectPreset = (preset: typeof COMMONLY_USED_PRESETS[0]) => {
    const { startTime, endTime, label } = getPresetRange(preset.key);
    onChange({
      mode: 'quick',
      label,
      startTime,
      endTime,
      quickAmount: preset.amount || 15,
      quickUnit: (preset.unit as QuickUnit) || 'minutes',
      presetKey: preset.key,
      isNext: false,
    });
    setIsOpen(false);
  };

  // Calendar Day Click
  const handleDayClick = (day: number, monthOffset: number = 0) => {
    const targetDate = new Date(viewYear, viewMonth + monthOffset, day);
    const currentTarget = absTarget === 'start' ? absStart : absEnd;
    
    // Preserve existing time of target
    targetDate.setHours(currentTarget.getHours(), currentTarget.getMinutes(), currentTarget.getSeconds(), currentTarget.getMilliseconds());

    if (absTarget === 'start') {
      setAbsStart(targetDate);
      setStartInputText(formatInputDateTime(targetDate));
    } else {
      setAbsEnd(targetDate);
      setEndInputText(formatInputDateTime(targetDate));
    }
  };

  // Time slot click (e.g. "02:30 PM")
  const handleTimeSelect = (timeStr: string) => {
    const [timePart, ampm] = timeStr.split(' ');
    let [h, m] = timePart.split(':').map(Number);
    if (ampm === 'PM' && h < 12) h += 12;
    if (ampm === 'AM' && h === 12) h = 0;

    const targetDate = new Date(absTarget === 'start' ? absStart : absEnd);
    targetDate.setHours(h, m, 0, 0);

    if (absTarget === 'start') {
      setAbsStart(targetDate);
      setStartInputText(formatInputDateTime(targetDate));
    } else {
      setAbsEnd(targetDate);
      setEndInputText(formatInputDateTime(targetDate));
    }
  };

  // Apply Absolute
  const handleApplyAbsolute = () => {
    let finalStart = absStart;
    let finalEnd = absEnd;

    // Parse input text fallback if manually edited
    const parsedStart = new Date(startInputText.replace(' ', 'T'));
    const parsedEnd = new Date(endInputText.replace(' ', 'T'));
    if (!isNaN(parsedStart.getTime())) finalStart = parsedStart;
    if (!isNaN(parsedEnd.getTime())) finalEnd = parsedEnd;

    const label = `${formatElasticDateTime(finalStart)} → ${formatElasticDateTime(finalEnd)}`;
    onChange({
      mode: 'absolute',
      label,
      startTime: finalStart,
      endTime: finalEnd,
    });
    setIsOpen(false);
  };

  // Generate Calendar Days Grid
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        monthOffset: -1,
        date: new Date(viewYear, viewMonth - 1, prevMonthDays - i),
      });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        monthOffset: 0,
        date: new Date(viewYear, viewMonth, i),
      });
    }

    // Next month padding (to fill 35 or 42 grid cells)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        monthOffset: 1,
        date: new Date(viewYear, viewMonth + 1, i),
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const activeTargetDate = absTarget === 'start' ? absStart : absEnd;

  return (
    <div className="elastic-time-filter-container" ref={containerRef}>
      {/* Main Trigger Bar (ElasticSearch / Kibana Style) */}
      <div className="elastic-time-trigger-group">
        <button
          type="button"
          className={`elastic-time-trigger-btn ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Select time range"
        >
          <span className="elastic-time-calendar-icon">
            <Calendar size={13} />
            <ChevronDown size={11} className="elastic-chevron-icon" />
          </span>
          <span className="elastic-time-label-text">
            {currentValue.label || 'Last 15 minutes'}
          </span>
        </button>

        {/* Step Range Shift Buttons (< and >) */}
        <div className="elastic-time-steppers">
          <button
            type="button"
            className="elastic-step-btn"
            onClick={(e) => handleStepRange('prev', e)}
            title="Shift time range back"
          >
            <ChevronLeft size={13} />
          </button>
          <button
            type="button"
            className="elastic-step-btn"
            onClick={(e) => handleStepRange('next', e)}
            title="Shift time range forward"
          >
            <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Popover Dropdown Panel */}
      {isOpen && (
        <div className="elastic-time-popover">
          {/* Top Tabs */}
          <div className="elastic-popover-tabs">
            <button
              type="button"
              className={`elastic-popover-tab ${activeTab === 'quick' ? 'active' : ''}`}
              onClick={() => setActiveTab('quick')}
            >
              Quick select
            </button>
            <button
              type="button"
              className={`elastic-popover-tab ${activeTab === 'absolute' ? 'active' : ''}`}
              onClick={() => setActiveTab('absolute')}
            >
              Absolute
            </button>
          </div>

          {/* Tab 1: Quick Select Content */}
          {activeTab === 'quick' && (
            <div className="elastic-quick-content">
              {/* Header & Custom Selector */}
              <div className="elastic-section-header">
                <span className="elastic-section-title">Quick select</span>
                <div className="elastic-section-steppers">
                  <button type="button" onClick={() => handleStepRange('prev')}>
                    <ChevronLeft size={14} />
                  </button>
                  <button type="button" onClick={() => handleStepRange('next')}>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              <div className="elastic-custom-quick-row">
                <select
                  value={quickDirection}
                  onChange={(e) => setQuickDirection(e.target.value as 'Last' | 'Next')}
                  className="elastic-select elastic-select-dir"
                >
                  <option value="Last">Last</option>
                  <option value="Next">Next</option>
                </select>

                <input
                  type="number"
                  min="1"
                  max="999"
                  value={quickAmount}
                  onChange={(e) => setQuickAmount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="elastic-number-input"
                />

                <select
                  value={quickUnit}
                  onChange={(e) => setQuickUnit(e.target.value as QuickUnit)}
                  className="elastic-select elastic-select-unit"
                >
                  <option value="seconds">seconds</option>
                  <option value="minutes">minutes</option>
                  <option value="hours">hours</option>
                  <option value="days">days</option>
                  <option value="weeks">weeks</option>
                  <option value="months">months</option>
                  <option value="years">years</option>
                </select>

                <button
                  type="button"
                  className="elastic-btn-apply"
                  onClick={handleApplyQuick}
                >
                  Apply
                </button>
              </div>

              <div className="elastic-divider" />

              {/* Commonly Used Presets */}
              <div className="elastic-section-header">
                <span className="elastic-section-title">Commonly used</span>
              </div>

              <div className="elastic-presets-grid">
                <div className="elastic-presets-col">
                  {COMMONLY_USED_PRESETS.filter((p) => p.col === 1).map((preset) => {
                    const isSelected = currentValue.presetKey === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        className={`elastic-preset-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPreset(preset)}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>

                <div className="elastic-presets-col">
                  {COMMONLY_USED_PRESETS.filter((p) => p.col === 2).map((preset) => {
                    const isSelected = currentValue.presetKey === preset.key;
                    return (
                      <button
                        key={preset.key}
                        type="button"
                        className={`elastic-preset-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectPreset(preset)}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Absolute (Range) Content */}
          {activeTab === 'absolute' && (
            <div className="elastic-absolute-content">
              {/* Range Indicator / Switcher */}
              <div className="elastic-abs-range-header">
                <button
                  type="button"
                  className={`elastic-abs-target-btn ${absTarget === 'start' ? 'active' : ''}`}
                  onClick={() => setAbsTarget('start')}
                >
                  <span className="target-badge">Start</span>
                  <span className="target-date">{formatInputDateTime(absStart)}</span>
                </button>
                <ArrowRight size={14} className="range-arrow-icon" />
                <button
                  type="button"
                  className={`elastic-abs-target-btn ${absTarget === 'end' ? 'active' : ''}`}
                  onClick={() => setAbsTarget('end')}
                >
                  <span className="target-badge">End</span>
                  <span className="target-date">{formatInputDateTime(absEnd)}</span>
                </button>
              </div>

              {/* Calendar & Time Picker Container */}
              <div className="elastic-calendar-time-wrapper">
                {/* Left: Interactive Calendar */}
                <div className="elastic-calendar-pane">
                  <div className="elastic-cal-nav">
                    <button
                      type="button"
                      className="elastic-cal-nav-btn"
                      onClick={() => {
                        if (viewMonth === 0) {
                          setViewMonth(11);
                          setViewYear(viewYear - 1);
                        } else {
                          setViewMonth(viewMonth - 1);
                        }
                      }}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="elastic-cal-month-title">
                      <strong>{MONTH_NAMES[viewMonth]}</strong> {viewYear}
                    </span>
                    <button
                      type="button"
                      className="elastic-cal-nav-btn"
                      onClick={() => {
                        if (viewMonth === 11) {
                          setViewMonth(0);
                          setViewYear(viewYear + 1);
                        } else {
                          setViewMonth(viewMonth + 1);
                        }
                      }}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Weekday headers */}
                  <div className="elastic-cal-grid-header">
                    <span>SU</span>
                    <span>MO</span>
                    <span>TU</span>
                    <span>WE</span>
                    <span>TH</span>
                    <span>FR</span>
                    <span>SA</span>
                  </div>

                  {/* Day cells */}
                  <div className="elastic-cal-grid-days">
                    {calendarDays.map((item, idx) => {
                      const isSelectedTarget =
                        item.date.getFullYear() === activeTargetDate.getFullYear() &&
                        item.date.getMonth() === activeTargetDate.getMonth() &&
                        item.date.getDate() === activeTargetDate.getDate();

                      const isStartDate =
                        item.date.getFullYear() === absStart.getFullYear() &&
                        item.date.getMonth() === absStart.getMonth() &&
                        item.date.getDate() === absStart.getDate();

                      const isEndDate =
                        item.date.getFullYear() === absEnd.getFullYear() &&
                        item.date.getMonth() === absEnd.getMonth() &&
                        item.date.getDate() === absEnd.getDate();

                      const isBetween =
                        item.date.getTime() > absStart.getTime() &&
                        item.date.getTime() < absEnd.getTime();

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`elastic-cal-day ${!item.isCurrentMonth ? 'dimmed' : ''} ${
                            isSelectedTarget ? 'selected-target' : ''
                          } ${isStartDate ? 'is-start' : ''} ${isEndDate ? 'is-end' : ''} ${
                            isBetween ? 'is-between' : ''
                          }`}
                          onClick={() => handleDayClick(item.day, item.monthOffset)}
                        >
                          {item.day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Time Options List */}
                <div className="elastic-time-pane">
                  <div className="elastic-time-pane-title">Time</div>
                  <div className="elastic-time-scroll">
                    {TIME_OPTIONS.map((timeStr, idx) => {
                      const targetHours = activeTargetDate.getHours();
                      const targetMinutes = activeTargetDate.getMinutes();
                      const h12 = targetHours % 12 === 0 ? 12 : targetHours % 12;
                      const ampm = targetHours < 12 ? 'AM' : 'PM';
                      const formattedCurrent = `${String(h12).padStart(2, '0')}:${targetMinutes < 30 ? '00' : '30'} ${ampm}`;
                      const isTimeActive = timeStr === formattedCurrent;

                      return (
                        <button
                          key={idx}
                          type="button"
                          className={`elastic-time-slot ${isTimeActive ? 'active' : ''}`}
                          onClick={() => handleTimeSelect(timeStr)}
                        >
                          {timeStr}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Bottom Input & Apply Bar */}
              <div className="elastic-abs-footer">
                <div className="elastic-abs-inputs">
                  <div className="elastic-abs-input-item">
                    <span className="input-tag">{absTarget === 'start' ? 'Start date' : 'End date'}</span>
                    <input
                      type="text"
                      className="elastic-text-input"
                      value={absTarget === 'start' ? startInputText : endInputText}
                      onChange={(e) => {
                        if (absTarget === 'start') {
                          setStartInputText(e.target.value);
                          const parsed = new Date(e.target.value.replace(' ', 'T'));
                          if (!isNaN(parsed.getTime())) setAbsStart(parsed);
                        } else {
                          setEndInputText(e.target.value);
                          const parsed = new Date(e.target.value.replace(' ', 'T'));
                          if (!isNaN(parsed.getTime())) setAbsEnd(parsed);
                        }
                      }}
                      placeholder="YYYY-MM-DD HH:mm:ss"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  className="elastic-btn-apply"
                  onClick={handleApplyAbsolute}
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
