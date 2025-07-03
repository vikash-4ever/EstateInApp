import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import { getChatsForUser, getUserProfileByUserId } from "@/lib/appwrite";
import icons from "@/constants/icons";
import NoResults from "@/components/NoResults"; // same component used in properties screen

const ChatsScreen = () => {
  const { user } = useGlobalContext();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchChats = async () => {
      if (!user?.$id) return;

      try {
        setLoading(true);
        const chatsList = await getChatsForUser(user.$id);
        const profileCache: Record<string, any> = {};

        const enrichedChats = await Promise.all(
          chatsList.map(async (chat) => {
            const otherUserId = chat.user1 === user.$id ? chat.user2 : chat.user1;

            if (!profileCache[otherUserId]) {
              const profile = await getUserProfileByUserId(otherUserId);
              profileCache[otherUserId] = profile;
            }

            return {
              ...chat,
              otherUserProfile: profileCache[otherUserId],
            };
          })
        );

        setChats(enrichedChats);
      } catch (error) {
        console.error("Error fetching chats or profiles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchChats();
  }, [user]);

  const handleChatPress = (chat: any) => {
    if (!user?.$id || (!chat.user1 && !chat.user2)) return;

    const otherUserId = chat.user1 === user.$id ? chat.user2 : chat.user1;

    if (!otherUserId) return;

    router.push({
      pathname: "/(root)/chats/[id]",
      params: { id: chat.$id, userId: otherUserId },
    });
  };

  const renderItem = ({ item }: { item: any }) => {
    const profile = item.otherUserProfile;

    return (
      <TouchableOpacity
        onPress={() => handleChatPress(item)}
        className="flex-row items-center justify-between py-4 border-b border-gray-100"
      >
        <View className="flex-row items-center gap-3">
          <Image
            source={profile?.avatar ? { uri: profile.avatar } : icons.person}
            className="w-10 h-10 rounded-full"
            resizeMode="cover"
          />
          <View>
            <Text className="text-black-300 text-base font-rubik-medium">
              {profile?.name || "Unknown User"}
            </Text>
            <Text className="text-xs text-gray-400 font-rubik-regular mt-1">
              Tap to continue
            </Text>
          </View>
        </View>
        <Image source={icons.rightArrow} className="w-4 h-4" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView className="bg-white h-full">
      <FlatList
        data={chats}
        keyExtractor={(item) => item.$id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerClassName="px-6 pb-10"
        ListHeaderComponent={
          <View className="flex-row items-center justify-between mt-5 mb-4">
            <TouchableOpacity
              onPress={() => router.push("/(root)/(tabs)/profile")}
              className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
            >
              <Image source={icons.backArrow} className="size-5" />
            </TouchableOpacity>

            <Text className="text-base text-center font-rubik-medium text-black-300">
              Messages
            </Text>

            <Image source={icons.bell} className="w-6 h-6" />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator size="large" className="mt-10 text-primary-300" />
          ) : (
            <NoResults />
          )
        }
      />
    </SafeAreaView>
  );
};

export default ChatsScreen;
