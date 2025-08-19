import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator } from "react-native";
import React, { useEffect, useState } from "react";
import moment from "moment";
import { client, databases } from "@/lib/appwrite";
import icons from "@/constants/icons";
import { useGlobalContext } from "@/lib/global-provider";
import { Query, RealtimeResponseEvent } from "react-native-appwrite";
import { useRouter } from "expo-router";

const DATABASE_ID = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!;
const BOOKINGS_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!;
const PROPERTIES_COLLECTION_ID = process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID!;

export default function NotificationsScreen() {
  const router = useRouter();
  const { userProfile } = useGlobalContext();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Show to me:
  // - as receiver: pending requests
  // - as sender: accepted/rejected responses
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await databases.listDocuments(
        DATABASE_ID,
        BOOKINGS_COLLECTION_ID,
        [
          Query.or([
            Query.and([
              Query.equal("receiverProfile", userProfile?.$id || ""),
              Query.equal("status", "pending"),
            ]),
            Query.and([
              Query.equal("senderProfile", userProfile?.$id || ""),
              Query.or([Query.equal("status", "accepted"), Query.equal("status", "rejected")]),
            ]),
          ]),
          Query.orderDesc("$createdAt"),
        ]
      );

      const withProps = await Promise.all(
        res.documents.map(async (booking) => {
          try {
            const property = await databases.getDocument(
              DATABASE_ID,
              PROPERTIES_COLLECTION_ID,
              booking.propertyId
            );
            return {
              ...booking,
              propertyName: property.name || "Unknown Property",
              propertyImage: property.images?.[0] || null,
            };
          } catch {
            return booking;
          }
        })
      );

      setNotifications(withProps);
    } catch (err) {
      console.error("Error fetching notifications", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const unsubscribe = client.subscribe(
      `databases.${DATABASE_ID}.collections.${BOOKINGS_COLLECTION_ID}.documents`,
      (response: RealtimeResponseEvent<any>) => {
        const evt = response.events?.[0] || "";
        if (evt.includes(".create") || evt.includes(".update") || evt.includes(".delete")) {
          fetchNotifications();
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const getNotificationText = (item: any) => {
    if (item.receiverProfile?.$id === userProfile?.$id && item.status === "pending") {
      return `New booking request for ${item.propertyName}`;
    }
    if (item.senderProfile?.$id === userProfile?.$id && item.status === "accepted") {
      return `Your booking request for ${item.propertyName} was accepted`;
    }
    if (item.senderProfile?.$id === userProfile?.$id && item.status === "rejected") {
      return `Your booking request for ${item.propertyName} was rejected`;
    }
    return null;
  };

  const renderItem = ({ item }: { item: any }) => {
    const message = getNotificationText(item);
    if (!message) return null;

    const isReceiver = item.receiverProfile?.$id === userProfile?.$id;
    const isSender = item.senderProfile?.$id === userProfile?.$id;

    // Unread for me?
    const unreadForMe =
      (isReceiver && item.status === "pending" && !item.seenByReceiver) ||
      (isSender && ["accepted", "rejected"].includes(item.status) && !item.seenBySender);

    return (
      <TouchableOpacity
        className={`flex-row items-center py-2 px-2 mb-2 border border-gray-200 rounded-lg ${
          unreadForMe ? "bg-gray-100" : "bg-white"
        }`}
        onPress={async () => {
          // Navigate
          if (isReceiver && item.status === "pending") {
            router.push({ pathname: "/(root)/bookingRequests", params: { tab: "received" } });
          } else {
            router.push(`/properties/${item.propertyId}`);
          }

          // Optimistic local mark-as-seen for snappy UI
          setNotifications((prev) =>
            prev.map((n) =>
              n.$id === item.$id
                ? {
                    ...n,
                    ...(isReceiver ? { seenByReceiver: true } : {}),
                    ...(isSender ? { seenBySender: true } : {}),
                  }
                : n
            )
          );

          // Persist mark-as-seen
          try {
            if (isReceiver && item.status === "pending" && !item.seenByReceiver) {
              await databases.updateDocument(DATABASE_ID, BOOKINGS_COLLECTION_ID, item.$id, {
                seenByReceiver: true,
              });
            }
            if (isSender && ["accepted", "rejected"].includes(item.status) && !item.seenBySender) {
              await databases.updateDocument(DATABASE_ID, BOOKINGS_COLLECTION_ID, item.$id, {
                seenBySender: true,
              });
            }
          } catch (error) {
            console.error("Error marking as seen!", error);
            // If it failed, refetch to get the truth
            fetchNotifications();
          }
        }}
      >
        <Image source={{ uri: item.propertyImage }} className="w-14 h-14 rounded-full mr-3" />
        <View className="flex-1">
          <Text className="text-base font-medium mt-1">{message}</Text>
          <Text className="text-xs text-gray-500">{moment(item.$createdAt).fromNow()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5">
        <View className="flex flex-row items-center justify-between mt-5 pb-2 px-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
          >
            <Image source={icons.backArrow} className="size-5" />
          </TouchableOpacity>
          <Text className="text-base mr-2 text-center font-rubik-medium text-black-300">
            Notifications
          </Text>
          <TouchableOpacity onPress={() => router.push("/(root)/chats")}>
            <Image source={icons.send} className="w-6 h-6" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={"black"}/>
        </View>
      ) : (
        <FlatList
          className="mt-5 mx-6"
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.$id}
          ListEmptyComponent={
            <View className="flex-1 justify-center items-center mt-10">
              <Text className="text-gray-400">You're all caught up! 🎉</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
