import React, { useMemo, useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import { ListRow } from '../components/ListRow';
import { Card } from '../components/Card';
import { ClockIcon, ChevronLeftIcon, ChevronRightIcon, ActivityIcon, HeartIcon, WindIcon, BrainIcon } from 'lucide-react';

// Calculate severity based on sensor data and algorithm thresholds
const calculateSeverity = (sensorData: any) => {
  const menthone = sensorData?.menthone || 0;
  const hr = sensorData?.heartRate || 75;
  const spo2 = sensorData?.spo2 || 97;
  const emg = sensorData?.emg || 0.5;

  // Severity scoring based on algorithm thresholds
  let severityScore = 0;

  // Menthone contribution (primary indicator)
  if (menthone > 40) severityScore += 3;
  else if (menthone > 25) severityScore += 2;
  else if (menthone > 15) severityScore += 1;

  // Heart rate contribution
  if (hr > 120) severityScore += 2;
  else if (hr > 100) severityScore += 1;

  // SpO2 contribution (lower is worse)
  if (spo2 < 90) severityScore += 2;
  else if (spo2 < 94) severityScore += 1;

  // EMG contribution
  if (emg > 0.8) severityScore += 2;
  else if (emg > 0.7) severityScore += 1;

  // Map score to severity levels
  if (severityScore >= 7) return 'Severe';
  if (severityScore >= 4) return 'Moderate';
  return 'Mild';
};

// Load seizure logs from localStorage
const loadSeizureLogs = () => {
  const logs = localStorage.getItem('seizureLogs');
  if (logs) {
    const parsedLogs = JSON.parse(logs);
    // Transform to match the expected format
    return parsedLogs.map((log: any) => {
      const calculatedSeverity = calculateSeverity(log.sensorData);
      return {
        id: log.id,
        time: log.time || new Date(log.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        date: new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        delta: `+${Math.round(log.sensorData?.menthone || 0)}%`,
        fullDate: new Date(log.date),
        severity: calculatedSeverity,  // Algorithm-calculated severity
        confidence: log.confidence,
        notes: log.notes,
        sensorData: log.sensorData,
        userNote: log.userNote
      };
    });
  }
  return mockEvents; // Fall back to mock data if no real data
};

// Mock data for seizure events (as fallback)
const mockEvents = [{
  id: 1,
  time: '2:35 PM',
  date: 'Today',
  delta: '+38%',
  duration: '45s',
  fullDate: new Date(2025, 8, 16) // Sep 16, 2025 (today)
}, {
  id: 2,
  time: '10:15 AM',
  date: 'Today',
  delta: '+41%',
  duration: '48s',
  fullDate: new Date(2025, 8, 16) // Sep 16, 2025 - second event today
}, {
  id: 3,
  time: '11:20 AM',
  date: 'Sep 14',
  delta: '+42%',
  duration: '52s',
  fullDate: new Date(2025, 8, 14) // Sep 14, 2025
}, {
  id: 4,
  time: '3:45 PM',
  date: 'Sep 12',
  delta: '+35%',
  duration: '38s',
  fullDate: new Date(2025, 8, 12) // Sep 12, 2025
}, {
  id: 5,
  time: '9:15 AM',
  date: 'Sep 12',
  delta: '+48%',
  duration: '55s',
  fullDate: new Date(2025, 8, 12) // Sep 12, 2025 - second event
}, {
  id: 6,
  time: '6:30 PM',
  date: 'Sep 12',
  delta: '+39%',
  duration: '42s',
  fullDate: new Date(2025, 8, 12) // Sep 12, 2025 - third event
}, {
  id: 7,
  time: '9:15 AM',
  date: 'Sep 10',
  delta: '+51%',
  duration: '1m 5s',
  fullDate: new Date(2025, 8, 10) // Sep 10, 2025
}, {
  id: 8,
  time: '7:30 PM',
  date: 'Sep 8',
  delta: '+39%',
  duration: '42s',
  fullDate: new Date(2025, 8, 8) // Sep 8, 2025
}, {
  id: 9,
  time: '2:45 PM',
  date: 'Sep 8',
  delta: '+44%',
  duration: '50s',
  fullDate: new Date(2025, 8, 8) // Sep 8, 2025 - second event
}, {
  id: 10,
  time: '4:22 PM',
  date: 'Sep 5',
  delta: '+46%',
  duration: '55s',
  fullDate: new Date(2025, 8, 5) // Sep 5, 2025
}, {
  id: 11,
  time: '10:45 AM',
  date: 'Sep 2',
  delta: '+37%',
  duration: '40s',
  fullDate: new Date(2025, 8, 2) // Sep 2, 2025
}, {
  id: 12,
  time: '6:18 PM',
  date: 'Aug 30',
  delta: '+48%',
  duration: '58s',
  fullDate: new Date(2025, 7, 30) // Aug 30, 2025
}];
// Calendar helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};
const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};
export const History: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  // Load events from localStorage on mount
  useEffect(() => {
    const loadedEvents = loadSeizureLogs();
    setEvents(loadedEvents);
  }, []);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
    // Previous month days
    const prevMonthDays = [];
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);
    for (let i = firstDay - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false
      });
    }
    // Current month days
    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true
      });
    }
    // Next month days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthDays = [];
    const totalDaysShown = 42; // 6 rows of 7 days
    const remainingDays = totalDaysShown - (prevMonthDays.length + currentMonthDays.length);
    for (let i = 1; i <= remainingDays; i++) {
      nextMonthDays.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false
      });
    }
    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentMonth, currentYear]);
  // Go to previous month
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };
  // Go to next month
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };
  // Count events for a specific day
  const getEventCount = (day: number, month: number, year: number) => {
    return events.filter(event => {
      const eventDate = event.fullDate;
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
    }).length;
  };
  // Filter events by selected date
  const filteredEvents = useMemo(() => {
    if (!selectedDate) return [];
    return events.filter(event => {
      const eventDate = event.fullDate;
      return eventDate.getDate() === selectedDate.getDate() && eventDate.getMonth() === selectedDate.getMonth() && eventDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [selectedDate, events]);
  // Handle day selection
  const selectDay = (day: number, month: number, year: number) => {
    setSelectedDate(new Date(year, month, day));
  };
  const handleEventClick = (id: number) => {
    setSelectedEvent(id);
  };

  const renderEventDetails = () => {
    const event = events.find(e => e.id === selectedEvent);
    if (!event) return null;


    // Save note to event
    const handleSaveNote = () => {
      if (!noteText.trim()) return;

      // Update event with note
      const updatedEvent = { ...event, userNote: noteText };

      // Update events array
      const updatedEvents = events.map(e => e.id === event.id ? updatedEvent : e);
      setEvents(updatedEvents);

      // Save to localStorage
      const logs = localStorage.getItem('seizureLogs');
      if (logs) {
        const parsedLogs = JSON.parse(logs);
        const updatedLogs = parsedLogs.map((log: any) =>
          log.id === event.id ? { ...log, userNote: noteText } : log
        );
        localStorage.setItem('seizureLogs', JSON.stringify(updatedLogs));
      }

      // Reset note input
      setShowNoteInput(false);
      setNoteText('');
    };

    // Generate observations based on sensor data
    const getObservations = () => {
      const menthone = event.sensorData?.menthone || 0;
      const hr = event.sensorData?.heartRate || 0;
      const spo2 = event.sensorData?.spo2 || 0;
      const emg = event.sensorData?.emg || 0;

      let observations = [];

      if (menthone > 40) {
        observations.push("Significant menthone spike detected");
      } else if (menthone > 20) {
        observations.push("Moderate menthone elevation");
      }

      if (hr > 100) {
        observations.push("Elevated heart rate during event");
      }

      if (spo2 < 94) {
        observations.push("Blood oxygen dropped below normal");
      }

      if (emg > 0.7) {
        observations.push("High muscle activity recorded");
      }

      if (event.severity === 'High') {
        observations.push("Event classified as high severity");
      }

      return observations.length > 0 ? observations.join(". ") + "." : "Normal physiological response recorded.";
    };

    return <div className="fixed inset-0 bg-bg z-50 overflow-auto">
        <div className="flex flex-col h-full">
          {/* Custom Header with Back Button */}
          <div className="bg-white border-b border-ink-60/10 px-4 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSelectedEvent(null)}
                className="mr-3 p-1"
              >
                <ChevronLeftIcon size={24} className="text-ink-100" />
              </button>
              <h1 className="text-h1 font-semibold">Event Details</h1>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4">
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div className="text-h2 font-semibold">{event.time}</div>
                <div className="text-bodySmall text-ink-60">{event.date}</div>
              </div>

              {/* 4 Sensor Signals Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 rounded-lg p-2 flex items-center">
                  <ActivityIcon size={14} className="text-blue-600 mr-1.5" />
                  <div>
                    <div className="text-xs text-ink-60">Menthone</div>
                    <div className="text-bodySmall font-semibold text-blue-600">
                      {event.delta || '+0%'}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 flex items-center">
                  <HeartIcon size={14} className="text-red-500 mr-1.5" />
                  <div>
                    <div className="text-xs text-ink-60">Heart Rate</div>
                    <div className="text-bodySmall font-semibold text-red-500">
                      {Math.round(event.sensorData?.heartRate || 75)} bpm
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 flex items-center">
                  <WindIcon size={14} className="text-green-600 mr-1.5" />
                  <div>
                    <div className="text-xs text-ink-60">Blood O₂</div>
                    <div className="text-bodySmall font-semibold text-green-600">
                      {Math.round(event.sensorData?.spo2 || 97)}%
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 flex items-center">
                  <BrainIcon size={14} className="text-purple-600 mr-1.5" />
                  <div>
                    <div className="text-xs text-ink-60">Muscle</div>
                    <div className="text-bodySmall font-semibold text-purple-600">
                      {Math.round((event.sensorData?.emg || 0.5) * 100)}%
                    </div>
                  </div>
                </div>
              </div>

            {/* Observations */}
            <div className="bg-blue-50 rounded-lg p-3 mb-3">
              <div className="text-xs font-semibold text-ink-100 mb-1">Observations</div>
              <p className="text-xs text-ink-80 leading-relaxed">
                {getObservations()}
              </p>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs text-ink-60">Detection Confidence</span>
              <span className="text-xs font-semibold">
                {Math.round((event.confidence || 0) * 100)}%
              </span>
            </div>

            {/* Algorithm-Calculated Severity (Read-Only) */}
            <div className="flex items-center justify-between mb-3 px-2">
              <span className="text-xs text-ink-60">Algorithm Severity</span>
              <span
                className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  event.severity === 'Mild'
                    ? 'bg-green-100 text-green-700'
                    : event.severity === 'Severe'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {event.severity || 'Moderate'}
              </span>
            </div>

              {/* User Notes Section */}
              {event.userNote && !showNoteInput && (
                <div className="bg-yellow-50 rounded-lg p-3 mb-3">
                  <div className="text-xs font-semibold text-ink-100 mb-1">Your Notes</div>
                  <p className="text-xs text-ink-80 leading-relaxed">
                    {event.userNote}
                  </p>
                </div>
              )}

              {/* Note Input */}
              {showNoteInput ? (
                <div className="space-y-3">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add your thoughts about this seizure event..."
                    className="w-full p-3 border border-ink-60/20 rounded-lg text-bodySmall resize-none"
                    rows={4}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setShowNoteInput(false);
                        setNoteText('');
                      }}
                      className="flex-1 py-2 border border-ink-60/20 rounded-lg text-bodySmall font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveNote}
                      className="flex-1 py-2 bg-brand-primary text-white rounded-lg text-bodySmall font-semibold"
                      disabled={!noteText.trim()}
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setShowNoteInput(true);
                    setNoteText(event.userNote || '');
                  }}
                  className="w-full py-2 border border-ink-60/20 rounded-lg text-bodySmall font-semibold"
                >
                  {event.userNote ? 'Edit Note' : 'Add Note'}
                </button>
              )}
            </Card>
          </div>
        </div>
      </div>;
  };
  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };
  const isSelectedDay = (day: number, month: number, year: number) => {
    if (!selectedDate) return false;
    return day === selectedDate.getDate() && month === selectedDate.getMonth() && year === selectedDate.getFullYear();
  };
  return <Layout title="History">
      <div className="mt-4">
        <Card>
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-h2 font-semibold">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div className="flex space-x-2">
              <button className="p-1 rounded-full hover:bg-gray-100" onClick={goToPreviousMonth}>
                <ChevronLeftIcon size={20} className="text-ink-60" />
              </button>
              <button className="p-1 rounded-full hover:bg-gray-100" onClick={goToNextMonth}>
                <ChevronRightIcon size={20} className="text-ink-60" />
              </button>
            </div>
          </div>
          {/* Day headers */}
          <div className="grid grid-cols-7 text-center mb-2">
            {dayNames.map(day => <div key={day} className="text-bodySmall text-ink-60">
                {day}
              </div>)}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const eventCount = getEventCount(day.day, day.month, day.year);
              const isSelected = isSelectedDay(day.day, day.month, day.year);

              return (
                <button
                  key={index}
                  className={`
                    w-10 h-10 flex flex-col items-center justify-center rounded-full relative
                    ${day.isCurrentMonth ? 'text-ink-100' : 'text-ink-60/50'}
                    ${isToday(day.day, day.month, day.year) ? 'font-semibold' : ''}
                    ${isSelected ? 'ring-1 ring-brand-primary' : ''}
                  `}
                  onClick={() => selectDay(day.day, day.month, day.year)}
                >
                  <span>{day.day}</span>
                  {eventCount > 0 && (
                    <div className="absolute bottom-0.5 flex space-x-0.5">
                      {eventCount === 1 && (
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      )}
                      {eventCount === 2 && (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        </>
                      )}
                      {eventCount >= 3 && (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        </>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </Card>
        {/* Events for selected day */}
        {selectedDate && <div className="mt-6">
            <Card>
              <h2 className="text-h2 font-semibold mb-4">
                Events for{' '}
                {selectedDate.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
              </h2>
              {filteredEvents.length > 0 ? <div className="space-y-2">
                  {filteredEvents.map(event => (
                    <div key={event.id} className="relative">
                      <ListRow
                        icon={<ClockIcon size={20} className="text-ink-60" />}
                        title={`${event.time}`}
                        meta={
                          <div className="flex items-center gap-2">
                            <span>Menthone: {event.delta}</span>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                event.severity === 'Mild'
                                  ? 'bg-green-100 text-green-700'
                                  : event.severity === 'Severe'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}
                            >
                              {event.severity || 'Moderate'}
                            </span>
                          </div>
                        }
                        onClick={() => handleEventClick(event.id)}
                      />
                    </div>
                  ))}
                </div> : <div className="text-center py-6 text-ink-60">
                  No events on this day
                </div>}
            </Card>
          </div>}
      </div>
      {selectedEvent !== null && renderEventDetails()}
    </Layout>;
};