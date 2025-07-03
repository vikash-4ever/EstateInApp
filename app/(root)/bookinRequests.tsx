import { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { getBookingRequestsForUser, respondToBookingRequest } from '@/lib/appwrite';
import { useGlobalContext } from '@/lib/global-provider';
import { Models } from 'react-native-appwrite';
export default function BookingRequestsScreen() {
  const { userProfile } = useGlobalContext();
  const [requests, setRequests] = useState<Models.Document[]>([]);

  const fetchRequests = async () => {
    const data = await getBookingRequestsForUser(userProfile!.$id);
    setRequests(data);
  };

  const handleResponse = async (requestId: string, action: 'accepted' | 'declined') => {
    await respondToBookingRequest({ requestId, newStatus: action });
    fetchRequests();
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  return (
    <View className="p-4">
      <Text className="text-xl font-bold mb-4">Booking Requests</Text>
      <FlatList
        data={requests}
        keyExtractor={(item) => item.$id}
        renderItem={({ item }) => (
          <View className="bg-white rounded-lg p-4 mb-3">
            <Text>Property ID: {item.propertyId}</Text>
            <Text>Status: {item.status}</Text>
            <Text>From: {item.senderProfile.name}</Text>
            <Text>To: {item.receiverProfile.name}</Text>

            {item.receiverProfile === userProfile?.$id && item.status === 'pending' && (
              <View className="flex-row gap-2 mt-2">
                <Button title="Accept" onPress={() => handleResponse(item.$id, 'accepted')} />
                <Button title="Decline" onPress={() => handleResponse(item.$id, 'declined')} />
              </View>
            )}
          </View>
        )}
      />
    </View>
  );
}
