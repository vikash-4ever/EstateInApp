import React, { useEffect, useState } from "react";
import { View, TouchableOpacity, Image, Text } from "react-native";
import { useRouter } from "expo-router";
import { client, databases } from "@/lib/appwrite";
import { Query, RealtimeResponseEvent } from "react-native-appwrite";
import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const BOOKINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!;

export default function NotificationIcon() {
  const router = useRouter();
  const { userProfile } = useGlobalContext();
  const [unreadCount, setUnreadCount] = useState(0);

  // Count rules:
  // - Receiver: pending requests they haven't seen yet
  // - Sender: accepted/rejected responses they haven't seen yet
  const fetchUnreadCount = async () => {
    if (!userProfile?.$id) return;

    try {
      const receiverUnread = await databases.listDocuments(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        [
          Query.and([
            Query.equal("receiverProfile", userProfile.$id),
            Query.equal("status", "pending"),
            Query.equal("seenByReceiver", false),
          ]),
        ]
      );

      // Use OR for accepted/rejected to be safe across Appwrite versions
      const senderUnread = await databases.listDocuments(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        [
          Query.and([
            Query.equal("senderProfile", userProfile.$id),
            Query.or([Query.equal("status", "accepted"), Query.equal("status", "rejected")]),
            Query.equal("seenBySender", false),
          ]),
        ]
      );

      setUnreadCount((receiverUnread.total || 0) + (senderUnread.total || 0));
    } catch (error) {
      console.error("Error fetching unread count:", error);
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    fetchUnreadCount();

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${BOOKINGS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<any>) => {
        // Recompute on any create/update/delete touching bookingRequests
        const evt = response.events?.[0] || "";
        if (evt.includes(".create") || evt.includes(".update") || evt.includes(".delete")) {
          fetchUnreadCount();
        }
      }
    );

    return () => unsubscribe();
  }, [userProfile?.$id]);

  return (
    <TouchableOpacity className="relative" onPress={() => router.push("/(root)/notifications")}>
      <Image source={icons.bell} className="w-6 h-6" />
      {unreadCount > 0 && (
        <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 items-center justify-center px-1">
          <Text className="text-white text-[10px] font-bold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
