import { useEffect, useState, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { Consultation, useAppointments } from '@/providers/AppointmentProvider';
import { useStreamVideoClient } from '@stream-io/video-react-native-sdk';

interface TranscriptEntry {
  speaker_id: string;
  type: string;
  text: string;
  start_ts: number;
  stop_ts: number;
}

interface ConsultationInfo extends Consultation {
  recordings?: any;
  transcriptions?: any;
}

const Page = () => {
  const { isTherapist } = useAuth();
  const { getAppointments } = useAppointments();
  const [appointments, setAppointments] = useState<ConsultationInfo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const client = useStreamVideoClient();
  
  const [playerVisible, setPlayerVisible] = useState(false);
  const [transcriptVisible, setTranscriptVisible] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptEntry[]>([]);
  const [currentAppointment, setCurrentAppointment] = useState<ConsultationInfo | null>(null);

  if (!isTherapist) {
    return (
      <View>
        <Text>You are not a therapist</Text>
      </View>
    );
  }

  useEffect(() => {
    loadAppointmenets();
  }, []);

  const loadAppointmenets = async () => {
    const appointments = await getAppointments();
    setAppointmentInfo(appointments);
  };

  const setAppointmentInfo = async (appointments: ConsultationInfo[]) => {
    await Promise.all(
      appointments.map(async (appointment) => {
        try {
          const _call = client?.call('default', appointment.id as string);
          if (!_call) return {};
          const recordingsQuery = await _call?.queryRecordings();
          const transcriptionQuery = await _call?.queryTranscriptions();
          appointment.recordings = recordingsQuery?.recordings;
          appointment.transcriptions = transcriptionQuery?.transcriptions;
        } catch (error) {
          console.error('Error fetching recordings:', error);
          appointment.recordings = [];
          appointment.transcriptions = [];
        }
      })
    );
    setAppointments(appointments);
  };

 

  const showTranscription = async (url: string, appointment: ConsultationInfo) => {
    try {
      const response = await fetch(url);
      const text = await response.text();

      // Parse JSONL format
      const entries = text
        .trim()
        .split('\n')
        .map((line) => JSON.parse(line));
      setTranscriptData(entries);
      setCurrentAppointment(appointment);
      setTranscriptVisible(true);
    } catch (error) {
      console.error('Error fetching transcript:', error);
    }
  };

  return (
    <View>
      

      {transcriptVisible && (
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
            backgroundColor: 'white',
          }}>
          <View >
            <View >
              <Text>Transcript</Text>
              <TouchableOpacity onPress={() => setTranscriptVisible(false)} >
                <Text>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView>
              {transcriptData.map((entry, index) => (
                <View key={index}>
                  <Text>
                    {entry.speaker_id === currentAppointment?.therapistId ? 'Therapist' : 'Client'}:
                  </Text>
                  <Text >{entry.text}</Text>
                  <Text >
                    {new Date(entry.start_ts).toISOString().substr(11, 8)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      )}

      <FlatList
        data={appointments}
        renderItem={({ item: appointment }) => (
          <View >
            <View >
              <Text >{appointment.clientEmail}</Text>
              <Text >
                {new Date(appointment.dateTime).toLocaleString()}
              </Text>
            </View>

            

            {appointment.transcriptions && appointment.transcriptions.length > 0 ? (
              <View>
                <Text>Transcriptions</Text>
                {appointment.transcriptions.map((transcription: any, index: number) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => showTranscription(transcription.url, appointment)}>
                    <Text>{transcription.filename}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text>No transcriptions available</Text>
            )}
          </View>
        )}
        onRefresh={loadAppointmenets}
        refreshing={refreshing}
      />
    </View>
  );
};
export default Page;
