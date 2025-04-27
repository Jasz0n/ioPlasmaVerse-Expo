import { View, Text, Pressable, TouchableOpacity, FlatList } from 'react-native';
import { MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Link, useFocusEffect } from 'expo-router';
import { useState, useCallback } from 'react';
import { useAppointments, ConsultationStatus } from '@/providers/AppointmentProvider';
import { Consultation } from '@/providers/AppointmentProvider';
import { useAuth } from '@/providers/AuthProvider';
import React from 'react';

const Page = () => {
  const { getAppointments, updateAppointment } = useAppointments();
  const [appointments, setAppointments] = useState<Consultation[]>([]);
  const { isTherapist } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAppointmenets();
    }, [])
  );

  const loadAppointmenets = async () => {
    const appointments = await getAppointments();
    setAppointments(appointments);
  };

  const callTherapist = () => {
    console.log('call therapist');
  };

  const confirmSession = async (id: string) => {
    const updatedAppointment = await updateAppointment(id, {
      status: ConsultationStatus.Confirmed,
    });
    setAppointments(
      appointments.map((appointment) =>
        appointment.id === id ? { ...appointment, status: updatedAppointment.status } : appointment
      )
    );
  };

  const cancelSession = async (id: string) => {
    const updatedAppointment = await updateAppointment(id, {
      status: ConsultationStatus.Cancelled,
    });
    setAppointments(
      appointments.map((appointment) =>
        appointment.id === id ? { ...appointment, status: updatedAppointment.status } : appointment
      )
    );
  };

  return (
    <View >
      {!isTherapist && (
        <FlatList
          data={appointments}
          onRefresh={loadAppointmenets}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          ListHeaderComponent={() => (
            <View>
              {/* Action Cards */}
              <Link href="/consultation/schedule" asChild>
                <TouchableOpacity>
                  <MaterialIcons name="calendar-today" size={32} color="white" />
                  <Text>Book Consultation</Text>
                  <Text>Schedule your next session</Text>
                </TouchableOpacity>
              </Link>

              <Link href="/chats" asChild>
                <TouchableOpacity>
                  <MaterialIcons name="chat" size={32} color="white" />
                  <Text>Join Chats</Text>
                  <Text>Connect with support groups</Text>
                </TouchableOpacity>
              </Link>
            </View>
          )}
          renderItem={({ item }) => (
            <Link href={`/consultation/${item.id}`} asChild>
              <TouchableOpacity
               >
                <Text >
                  
                </Text>
                <Text >{new Date(item.dateTime).toLocaleString()}</Text>
                <Text>Dr. Simon Grimm</Text>
              </TouchableOpacity>
            </Link>
          )}
          ListEmptyComponent={() => (
            <View >
              <Text >No appointments</Text>
            </View>
          )}
          ListFooterComponent={() => (
            <View >
              <View >
                <FontAwesome5 name="phone-alt" size={20} color="#f97316" />
                <Text>Call Your Therapist</Text>
              </View>
              <Text >
                Need immediate support? Your therapist is just a call away during business hours.
              </Text>
              <Pressable
                onPress={callTherapist}>
                <Text>Call Now</Text>
              </Pressable>
            </View>
          )}
        />
      )}

      {isTherapist && (
        <FlatList
          data={appointments}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          onRefresh={loadAppointmenets}
          refreshing={refreshing}
          ListHeaderComponent={() => (
            <View >
              <Text>Upcoming Appointments</Text>
              <Text>Manage your scheduled sessions</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity >
              <View >
                <View>
                  <View>
                    {item.status === 'Pending' && (
                      <Ionicons name="time-outline" size={24} color="#6B7280" />
                    )}
                    {item.status === 'Confirmed' && (
                      <Ionicons name="checkmark-circle-outline" size={24} color="#059669" />
                    )}
                    {item.status === 'Cancelled' && (
                      <Ionicons name="close-circle-outline" size={24} color="#DC2626" />
                    )}
                    {item.status === 'Completed' && (
                      <Ionicons name="checkmark-done-circle-outline" size={24} color="#1D4ED8" />
                    )}
                    <Text >{item.status}</Text>
                  </View>
                  <Text >{new Date(item.dateTime).toLocaleString()}</Text>
                  <Text >Client: {item.clientEmail}</Text>
                </View>
                {item.status === 'Pending' && (
                  <View >
                    <TouchableOpacity
                      
                      onPress={() => confirmSession(item.id)}>
                      <Text >Confirm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      
                      onPress={() => cancelSession(item.id)}>
                      <Text >Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'Confirmed' && (
                  <Link href={`/consultation/${item.id}`} asChild>
                    <TouchableOpacity>
                      <Text>Enter Session</Text>
                    </TouchableOpacity>
                  </Link>
                )}
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={() => (
            <View >
              <Text>No upcoming appointments</Text>
              <Text>Your schedule is clear for now</Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

export default Page;
