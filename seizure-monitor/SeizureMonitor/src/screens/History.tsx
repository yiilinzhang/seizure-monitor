import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { Layout } from '../components/Layout';
import { Card } from '../components/Card';

// Real seizure events - empty array until real data is available
const mockEvents: any[] = [];

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const History: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const calendarDays = useMemo(() => {
    const daysInMonth = getDaysInMonth(currentYear, currentMonth);
    const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

    const prevMonthDays = [];
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const daysInPrevMonth = getDaysInMonth(prevMonthYear, prevMonth);

    for (let i = firstDay - 1; i >= 0; i--) {
      prevMonthDays.push({
        day: daysInPrevMonth - i,
        month: prevMonth,
        year: prevMonthYear,
        isCurrentMonth: false,
      });
    }

    const currentMonthDays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      currentMonthDays.push({
        day: i,
        month: currentMonth,
        year: currentYear,
        isCurrentMonth: true,
      });
    }

    const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
    const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextMonthDays = [];
    const totalDaysShown = 42;
    const remainingDays = totalDaysShown - (prevMonthDays.length + currentMonthDays.length);

    for (let i = 1; i <= remainingDays; i++) {
      nextMonthDays.push({
        day: i,
        month: nextMonth,
        year: nextMonthYear,
        isCurrentMonth: false,
      });
    }

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  }, [currentMonth, currentYear]);

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
      <View style={{ marginTop: 16 }}>
        <Card>
          {/* Calendar header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#3D3D3D',
              }}
            >
              {monthNames[currentMonth]} {currentYear}
            </Text>
            <View style={{ flexDirection: 'row' }}>
              <TouchableOpacity
                onPress={goToPreviousMonth}
                style={{ padding: 8 }}
              >
                <Icon name="chevron-left" size={20} color="#8A8A8A" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={goToNextMonth}
                style={{ padding: 8 }}
              >
                <Icon name="chevron-right" size={20} color="#8A8A8A" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Day headers */}
          <View
            style={{
              flexDirection: 'row',
              marginBottom: 8,
            }}
          >
            {dayNames.map(day => (
              <View
                key={day}
                style={{
                  flex: 1,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: '#8A8A8A',
                  }}
                >
                  {day}
                </Text>
              </View>
            ))}
          </View>

          {/* Calendar grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
            }}
          >
            {calendarDays.map((dayObj, index) => {
              const eventCount = getEventCount(
                dayObj.day,
                dayObj.month,
                dayObj.year
              );
              const selected = isSelectedDay(
                dayObj.day,
                dayObj.month,
                dayObj.year
              );
              const today = isToday(dayObj.day, dayObj.month, dayObj.year);

              return (
                <TouchableOpacity
                  key={index}
                  style={{
                    width: '14.28%',
                    aspectRatio: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2,
                  }}
                  onPress={() =>
                    selectDay(dayObj.day, dayObj.month, dayObj.year)
                  }
                >
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: selected ? '#87AEEE' : 'transparent',
                      borderWidth: today ? 1 : 0,
                      borderColor: '#87AEEE',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        color: selected
                          ? '#FFFFFF'
                          : dayObj.isCurrentMonth
                          ? '#3D3D3D'
                          : '#8A8A8A',
                        fontWeight: today ? '600' : '400',
                      }}
                    >
                      {dayObj.day}
                    </Text>
                    {eventCount > 0 && (
                      <View
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          flexDirection: 'row',
                        }}
                      >
                        {Array.from({ length: Math.min(eventCount, 3) }).map(
                          (_, i) => (
                            <View
                              key={i}
                              style={{
                                width: 4,
                                height: 4,
                                borderRadius: 2,
                                backgroundColor: '#FF8383',
                                marginHorizontal: 1,
                              }}
                            />
                          )
                        )}
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Events for selected day */}
        {selectedDate && (
          <Card style={{ marginTop: 24 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#3D3D3D',
                marginBottom: 16,
              }}
            >
              Events for{' '}
              {selectedDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            {filteredEvents.length > 0 ? (
              <View>
                {filteredEvents.map(event => (
                  <TouchableOpacity
                    key={event.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingVertical: 12,
                      borderBottomWidth: 1,
                      borderBottomColor: 'rgba(138, 138, 138, 0.1)',
                    }}
                  >
                    <Icon name="clock" size={20} color="#8A8A8A" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          color: '#3D3D3D',
                          fontWeight: '500',
                        }}
                      >
                        {event.time} - {event.delta}
                      </Text>
                      <Text
                        style={{
                          fontSize: 14,
                          color: '#8A8A8A',
                          marginTop: 4,
                        }}
                      >
                        Duration: {event.duration}
                      </Text>
                    </View>
                    <Icon name="chevron-right" size={20} color="#8A8A8A" />
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text
                style={{
                  textAlign: 'center',
                  fontSize: 14,
                  color: '#8A8A8A',
                  paddingVertical: 24,
                }}
              >
                No events on this day
              </Text>
            )}
          </Card>
        )}
      </View>
    </Layout>
  );
};