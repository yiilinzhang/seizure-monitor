import React, { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { ListRow } from '../components/ListRow';
import { Card } from '../components/Card';
import { ClockIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
// Mock data for seizure events
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
    return mockEvents.filter(event => {
      const eventDate = event.fullDate;
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
    }).length;
  };
  // Filter events by selected date
  const filteredEvents = useMemo(() => {
    if (!selectedDate) return [];
    return mockEvents.filter(event => {
      const eventDate = event.fullDate;
      return eventDate.getDate() === selectedDate.getDate() && eventDate.getMonth() === selectedDate.getMonth() && eventDate.getFullYear() === selectedDate.getFullYear();
    });
  }, [selectedDate]);
  // Handle day selection
  const selectDay = (day: number, month: number, year: number) => {
    setSelectedDate(new Date(year, month, day));
  };
  const handleEventClick = (id: number) => {
    setSelectedEvent(id);
  };
  const renderEventDetails = () => {
    const event = mockEvents.find(e => e.id === selectedEvent);
    if (!event) return null;
    return <div className="fixed inset-0 bg-bg z-50 overflow-auto">
        <Layout title="Event Details" showBack={true}>
          <Card className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-h2 font-semibold">{event.time}</div>
              <div className="text-bodySmall text-ink-60">{event.date}</div>
            </div>
            <div className="flex justify-between mb-6">
              <div>
                <div className="text-bodySmall text-ink-60">Peak delta</div>
                <div className="text-title font-semibold text-semantic-alert">
                  {event.delta}
                </div>
              </div>
              <div>
                <div className="text-bodySmall text-ink-60">Duration</div>
                <div className="text-title font-semibold">{event.duration}</div>
              </div>
            </div>
            <div className="h-32 bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-ink-60">Event sparkline chart</span>
            </div>
            <div className="space-y-4">
              <button className="w-full py-2 border border-ink-60/20 rounded-lg text-bodySmall font-semibold">
                Add note
              </button>
              <button className="w-full py-2 border border-ink-60/20 rounded-lg text-bodySmall font-semibold">
                Export CSV
              </button>
            </div>
          </Card>
        </Layout>
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
                  {filteredEvents.map(event => <ListRow key={event.id} icon={<ClockIcon size={20} className="text-ink-60" />} title={`${event.time} - ${event.delta}`} meta={`Duration: ${event.duration}`} onClick={() => handleEventClick(event.id)} />)}
                </div> : <div className="text-center py-6 text-ink-60">
                  No events on this day
                </div>}
            </Card>
          </div>}
      </div>
      {selectedEvent !== null && renderEventDetails()}
    </Layout>;
};