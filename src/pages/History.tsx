import React, { useMemo, useState } from 'react';
import { Layout } from '../components/Layout';
import { ListRow } from '../components/ListRow';
import { Card } from '../components/Card';
import { ClockIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
// Mock data for events
const mockEvents = [{
  id: 1,
  time: '10:23 AM',
  date: 'Today',
  delta: '+22%',
  duration: '8s',
  type: 'Auto-detected',
  fullDate: new Date(2023, 9, 15) // October 15, 2023
}, {
  id: 2,
  time: '09:45 AM',
  date: 'Today',
  delta: '+18%',
  duration: '6s',
  type: 'Manual',
  fullDate: new Date(2023, 9, 15) // October 15, 2023
}, {
  id: 3,
  time: '08:17 AM',
  date: 'Today',
  delta: '+25%',
  duration: '7s',
  type: 'Auto-detected',
  fullDate: new Date(2023, 9, 15) // October 15, 2023
}, {
  id: 4,
  time: '11:52 PM',
  date: 'Yesterday',
  delta: '+15%',
  duration: '4s',
  type: 'Manual',
  fullDate: new Date(2023, 9, 14) // October 14, 2023
}, {
  id: 5,
  time: '10:08 PM',
  date: 'Yesterday',
  delta: '+19%',
  duration: '5s',
  type: 'Auto-detected',
  fullDate: new Date(2023, 9, 14) // October 14, 2023
}, {
  id: 6,
  time: '3:45 PM',
  date: 'Oct 10',
  delta: '+21%',
  duration: '7s',
  type: 'Auto-detected',
  fullDate: new Date(2023, 9, 10) // October 10, 2023
}, {
  id: 7,
  time: '9:12 AM',
  date: 'Oct 8',
  delta: '+16%',
  duration: '5s',
  type: 'Auto-detected',
  fullDate: new Date(2023, 9, 8) // October 8, 2023
}, {
  id: 8,
  time: '2:30 PM',
  date: 'Oct 5',
  delta: '+24%',
  duration: '9s',
  type: 'Manual',
  fullDate: new Date(2023, 9, 5) // October 5, 2023
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
  // Check if a day has events
  const hasEvents = (day: number, month: number, year: number) => {
    return mockEvents.some(event => {
      const eventDate = event.fullDate;
      return eventDate.getDate() === day && eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
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
              <div>
                <div className="text-bodySmall text-ink-60">Type</div>
                <div className="text-body">{event.type}</div>
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
            {calendarDays.map((day, index) => <button key={index} className={`
                  h-10 flex flex-col items-center justify-center rounded-full relative
                  ${day.isCurrentMonth ? 'text-ink-100' : 'text-ink-60/50'}
                  ${isToday(day.day, day.month, day.year) ? 'font-semibold' : ''}
                  ${isSelectedDay(day.day, day.month, day.year) ? 'bg-brand-primary text-white' : ''}
                `} onClick={() => selectDay(day.day, day.month, day.year)}>
                <span>{day.day}</span>
                {hasEvents(day.day, day.month, day.year) && !isSelectedDay(day.day, day.month, day.year) && <div className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${isSelectedDay(day.day, day.month, day.year) ? 'bg-white' : 'bg-brand-primary'}`}></div>}
              </button>)}
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
                  {filteredEvents.map(event => <ListRow key={event.id} icon={<ClockIcon size={20} className="text-ink-60" />} title={`${event.time} - ${event.delta}`} meta={`${event.duration} • ${event.type}`} onClick={() => handleEventClick(event.id)} />)}
                </div> : <div className="text-center py-6 text-ink-60">
                  No events on this day
                </div>}
            </Card>
          </div>}
      </div>
      {selectedEvent !== null && renderEventDetails()}
    </Layout>;
};