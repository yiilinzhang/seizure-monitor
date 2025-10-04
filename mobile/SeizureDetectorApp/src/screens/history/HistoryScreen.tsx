import React, {useState, useMemo} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {Layout} from '../../components/common/Layout';
import {Card} from '../../components/common/Card';
import {colors, fontSize, spacing} from '../../utils/colors';

interface SeizureEvent {
  id: number;
  time: string;
  date: string;
  delta: string;
  duration: string;
  fullDate: Date;
}

// Mock data for seizure events (matching web design)
const mockEvents: SeizureEvent[] = [
  {
    id: 1,
    time: '2:35 PM',
    date: 'Today',
    delta: '+38%',
    duration: '45s',
    fullDate: new Date(2025, 9, 3), // Oct 3, 2025 (today)
  },
  {
    id: 2,
    time: '10:15 AM',
    date: 'Today',
    delta: '+41%',
    duration: '48s',
    fullDate: new Date(2025, 9, 3),
  },
  {
    id: 3,
    time: '11:20 AM',
    date: 'Oct 1',
    delta: '+42%',
    duration: '52s',
    fullDate: new Date(2025, 9, 1),
  },
  {
    id: 4,
    time: '3:45 PM',
    date: 'Sep 29',
    delta: '+35%',
    duration: '38s',
    fullDate: new Date(2025, 8, 29),
  },
  {
    id: 5,
    time: '9:15 AM',
    date: 'Sep 29',
    delta: '+48%',
    duration: '55s',
    fullDate: new Date(2025, 8, 29),
  },
];

// Calendar helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export const HistoryScreen: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const days = [];
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
      });
    }

    // Next month days
    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // Count events for a specific day
  const getEventCount = (day: number, month: number, year: number) => {
    return mockEvents.filter(event => {
      const eventDate = event.fullDate;
      return (
        eventDate.getDate() === day &&
        eventDate.getMonth() === month &&
        eventDate.getFullYear() === year
      );
    }).length;
  };

  // Filter events by selected date
  const filteredEvents = useMemo(() => {
    if (!selectedDate) return [];
    return mockEvents.filter(event => {
      const eventDate = event.fullDate;
      return (
        eventDate.getDate() === selectedDate.getDate() &&
        eventDate.getMonth() === selectedDate.getMonth() &&
        eventDate.getFullYear() === selectedDate.getFullYear()
      );
    });
  }, [selectedDate]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const selectDay = (day: number, month: number, year: number) => {
    setSelectedDate(new Date(year, month, day));
  };

  const isToday = (day: number, month: number, year: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const isSelectedDay = (day: number, month: number, year: number) => {
    if (!selectedDate) return false;
    return (
      day === selectedDate.getDate() &&
      month === selectedDate.getMonth() &&
      year === selectedDate.getFullYear()
    );
  };

  return (
    <Layout title="History">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <Card style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthTitle}>
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <View style={styles.navButtons}>
              <TouchableOpacity
                onPress={goToPreviousMonth}
                style={styles.navButton}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goToNextMonth}
                style={styles.navButton}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Day headers */}
          <View style={styles.dayHeaders}>
            {dayNames.map(day => (
              <View key={day} style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const eventCount = getEventCount(day.day, day.month, day.year);
              const isSelected = isSelectedDay(day.day, day.month, day.year);
              const isTodayDay = isToday(day.day, day.month, day.year);

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayCell,
                    isSelected && styles.selectedDay,
                    isTodayDay && styles.todayDay,
                  ]}
                  onPress={() => selectDay(day.day, day.month, day.year)}>
                  <Text
                    style={[
                      styles.dayText,
                      !day.isCurrentMonth && styles.otherMonthDay,
                      isTodayDay && styles.todayText,
                    ]}>
                    {day.day}
                  </Text>
                  {eventCount > 0 && (
                    <View style={styles.eventDots}>
                      {[...Array(Math.min(eventCount, 3))].map((_, i) => (
                        <View key={i} style={styles.eventDot} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Events for selected day */}
        {selectedDate && (
          <Card style={styles.eventsCard}>
            <Text style={styles.eventsTitle}>
              Events for{' '}
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {filteredEvents.length > 0 ? (
              <View style={styles.eventsList}>
                {filteredEvents.map(event => (
                  <TouchableOpacity key={event.id} style={styles.eventItem}>
                    <View style={styles.eventIcon}>
                      <Text style={styles.eventIconText}>🕐</Text>
                    </View>
                    <View style={styles.eventInfo}>
                      <Text style={styles.eventTitle}>
                        {event.time} - {event.delta}
                      </Text>
                      <Text style={styles.eventMeta}>
                        Duration: {event.duration}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.noEvents}>
                <Text style={styles.noEventsText}>No events on this day</Text>
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </Layout>
  );
};

const styles = StyleSheet.create({
  calendarCard: {
    marginBottom: spacing.margin,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.margin,
  },
  monthTitle: {
    fontSize: fontSize.h2,
    fontWeight: '600',
    color: colors.ink[100],
  },
  navButtons: {
    flexDirection: 'row',
    gap: spacing.grid,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.ink[60],
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: spacing.grid,
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayHeaderText: {
    fontSize: fontSize.bodySmall,
    color: colors.ink[60],
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  selectedDay: {
    borderWidth: 1,
    borderColor: colors.brand.primary,
    borderRadius: 20,
  },
  todayDay: {
    backgroundColor: colors.brand.primary + '15',
    borderRadius: 20,
  },
  dayText: {
    fontSize: fontSize.body,
    color: colors.ink[100],
  },
  todayText: {
    fontWeight: '700',
  },
  otherMonthDay: {
    color: colors.ink[60],
    opacity: 0.5,
  },
  eventDots: {
    position: 'absolute',
    bottom: 4,
    flexDirection: 'row',
    gap: 2,
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.semantic.alert,
  },
  eventsCard: {
    marginBottom: spacing.margin,
  },
  eventsTitle: {
    fontSize: fontSize.h2,
    fontWeight: '600',
    color: colors.ink[100],
    marginBottom: spacing.margin,
  },
  eventsList: {
    gap: spacing.grid,
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.grid,
    borderBottomWidth: 1,
    borderBottomColor: colors.ink[60] + '20',
  },
  eventIcon: {
    width: 20,
    height: 20,
    marginRight: spacing.grid,
  },
  eventIconText: {
    fontSize: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: fontSize.body,
    fontWeight: '600',
    color: colors.ink[100],
  },
  eventMeta: {
    fontSize: fontSize.bodySmall,
    color: colors.ink[60],
    marginTop: 2,
  },
  noEvents: {
    alignItems: 'center',
    paddingVertical: spacing.margin * 2,
  },
  noEventsText: {
    fontSize: fontSize.body,
    color: colors.ink[60],
  },
});
