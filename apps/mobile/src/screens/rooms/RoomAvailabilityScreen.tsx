import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/apiClient';
import type { RoomAvailability, RoomCalendarEntry } from '../../api/types';
import { useTheme, useThemedStyles } from '../../contexts/ThemeContext';
import type { Theme } from '../../ui/theme';
import { Badge, Button, Card, CardBody, LoadingSpinner } from '../../components/ui';
import { DateTimePicker } from '../../components/ui/DateTimePicker';

export function RoomAvailabilityScreen({ route }: any) {
  const theme = useTheme();
  const styles = useThemedStyles(createStyles);
  const { id, name } = route.params as { id: string; name?: string };
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [selectedDate, setSelectedDate] = useState(new Date());

  const dateStr = selectedDate.toISOString().split('T')[0];

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['room-availability', id, dateStr],
    queryFn: () =>
      api.get<RoomCalendarEntry>(
        `/api/v1/meeting-rooms/${id}/availability?date=${dateStr}`,
      ),
  });

  if (isLoading && !data) return <LoadingSpinner />;

  /* Generate time slots from 08:00 to 18:00 */
  const timeSlots: { hour: number; label: string }[] = [];
  for (let h = 8; h <= 18; h++) {
    timeSlots.push({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
    });
  }

  /* Check if a time slot has a conflict */
  function getBookingAtHour(hour: number) {
    if (!data?.bookings) return null;
    return data.bookings.find((b) => {
      const startH = new Date(b.start).getHours();
      const endH = new Date(b.end).getHours();
      return hour >= startH && hour < endH;
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Room Header */}
      <Card>
        <CardBody>
          <View style={styles.headerRow}>
            <View style={styles.roomIcon}>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.roomName}>
                {name ?? (data ? (isAr ? data.roomNameAr : data.roomNameEn) : t('rooms.availability'))}
              </Text>
              <Text style={styles.roomSub}>{t('rooms.availabilityFor')}</Text>
            </View>
          </View>
        </CardBody>
      </Card>

      {/* Date Picker */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <DateTimePicker
            label={t('rooms.selectDate')}
            value={selectedDate}
            onChange={setSelectedDate}
            mode="date"
            minimumDate={new Date()}
          />
          <Button
            variant="secondary"
            size="sm"
            onPress={() => refetch()}
            style={{ marginTop: 12, alignSelf: 'flex-end' }}
          >
            {t('rooms.checkAvailability')}
          </Button>
        </CardBody>
      </Card>

      {/* Availability Timeline */}
      <Card style={{ marginTop: 16 }}>
        <CardBody>
          <Text style={styles.sectionTitle}>
            {t('rooms.timeline')} — {selectedDate.toLocaleDateString(isAr ? 'ar-SA' : 'en-US')}
          </Text>

          {timeSlots.map((slot) => {
            const booking = getBookingAtHour(slot.hour);
            const isBooked = Boolean(booking);
            return (
              <View key={slot.hour} style={styles.slotRow}>
                <Text style={styles.slotTime}>{slot.label}</Text>
                <View
                  style={[
                    styles.slotBar,
                    {
                      backgroundColor: isBooked
                        ? theme.colors.danger + '20'
                        : theme.colors.success + '20',
                    },
                  ]}
                >
                  {isBooked ? (
                    <View style={styles.slotContent}>
                      <Ionicons name="lock-closed" size={14} color={theme.colors.danger} />
                      <Text style={[styles.slotText, { color: theme.colors.danger }]} numberOfLines={1}>
                        {isAr ? booking!.titleAr : booking!.titleEn}
                      </Text>
                      <Badge variant="danger" label={booking!.status} size="sm" />
                    </View>
                  ) : (
                    <View style={styles.slotContent}>
                      <Ionicons name="checkmark-circle" size={14} color={theme.colors.success} />
                      <Text style={[styles.slotText, { color: theme.colors.success }]}>
                        {t('rooms.available')}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </CardBody>
      </Card>

      {/* Bookings Summary */}
      {data?.bookings && data.bookings.length > 0 && (
        <Card style={{ marginTop: 16 }}>
          <CardBody>
            <Text style={styles.sectionTitle}>
              {t('rooms.bookings')} ({data.bookings.length})
            </Text>
            {data.bookings.map((booking) => (
              <View key={booking.meetingId} style={styles.bookingItem}>
                <View style={styles.bookingIcon}>
                  <Ionicons name="calendar" size={16} color={theme.colors.info} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingTitle}>
                    {isAr ? booking.titleAr : booking.titleEn}
                  </Text>
                  <Text style={styles.bookingTime}>
                    {new Date(booking.start).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' — '}
                    {new Date(booking.end).toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Badge
                  variant={booking.status === 'confirmed' ? 'success' : 'warning'}
                  label={booking.status}
                  size="sm"
                />
              </View>
            ))}
          </CardBody>
        </Card>
      )}
    </ScrollView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    roomIcon: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: theme.colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    roomName: { fontSize: 18, fontWeight: '700', color: theme.colors.text },
    roomSub: { fontSize: 13, color: theme.colors.textMuted, marginTop: 2 },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },

    /* Timeline slots */
    slotRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
      gap: 8,
    },
    slotTime: {
      width: 48,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textMuted,
    },
    slotBar: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 10,
      borderRadius: theme.radius.xs,
    },
    slotContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    slotText: { fontSize: 12, fontWeight: '500', flex: 1 },

    /* Bookings */
    bookingItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.borderLight,
    },
    bookingIcon: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: theme.colors.info + '15',
      alignItems: 'center',
      justifyContent: 'center',
    },
    bookingTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
    bookingTime: { fontSize: 12, color: theme.colors.textMuted, marginTop: 2 },
  });
