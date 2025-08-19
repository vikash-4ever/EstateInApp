import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";
import { router, useLocalSearchParams } from "expo-router";
import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import NoResults from "@/components/NoResults";
import { getBookingRequestsForUser } from "@/lib/appwrite";
import { BookingCard } from "@/components/Cards";
import NotificationIcon from "@/components/NotificationIcon";

type TabType = "sent" | "received" | "granted";

export default function BookingRequestsScreen() {
  const { tab, propertyId } = useLocalSearchParams<{ tab?:string; propertyId?:string}>();
  const { userProfile } = useGlobalContext();
  const currentProfileId = userProfile!.$id;
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || "sent");

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const allRequests = await getBookingRequestsForUser(currentProfileId);
      setRequests(allRequests);
    } catch (error) {
      console.error("Failed to fetch booking requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [currentProfileId]);

  const sentRequests = requests.filter(r => r.senderProfile?.$id === currentProfileId);
  const receivedRequests = requests.filter(r => r.receiverProfile?.$id === currentProfileId && r.status === "pending" && (!propertyId || r.propertyId === propertyId));
  const grantedRequests = requests.filter(r => r.receiverProfile?.$id === currentProfileId && r.status === "accepted");

  const dataMap: Record<TabType, any[]> = {
    sent: sentRequests,
    received: receivedRequests,
    granted: grantedRequests
  };

  return (
    <View className="bg-white flex-1">
      <FlatList
        data={loading ? [] : dataMap[activeTab]}
        keyExtractor={item => item.$id}
        contentContainerClassName="pb-32"
        ListHeaderComponent={
          <View>
            {/* Top Header */}
            <View className="px-5">
              <View className="flex flex-row items-center justify-between mt-5 px-1">
                <TouchableOpacity
                  onPress={() => router.push('/(root)/(tabs)/profile')}
                  className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
                >
                  <Image source={icons.backArrow} className="size-5" />
                </TouchableOpacity>
                <Text className="text-base mr-2 text-center font-rubik-medium text-black-300">
                  Booking Requests
                </Text>
                <NotificationIcon/>
              </View>
            </View>

            {/* Tabs */}
            <View className="flex-row justify-around p-3 border-b border-gray-200 mt-4">
              {(["sent", "received", "granted"] as TabType[]).map(tab => (
                <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)}>
                  <Text className={`text-base font-rubik-medium ${activeTab === tab ? "text-primary-300" : "text-black-100"}`}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} ({dataMap[tab].length})
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {loading && (
              <View className="flex-1 justify-center items-center py-10">
                <ActivityIndicator size={"large"} color={"black"}/>
              </View>
            )}
          </View>
        }
        renderItem={({ item }) => (
          <BookingCard
            item={item}
            currentProfileId={currentProfileId}
            onDeleted={fetchRequests}
            onPress={() => router.push(`/properties/${item.propertyId}`)}
          />
        )}
        ListEmptyComponent={!loading ? <NoResults /> : null}
      />
    </View>
  );
}
