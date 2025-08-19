import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Pressable,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import { getChatsForUser, getUserProfileByUserId, deleteChatAndMessages } from "@/lib/appwrite";
import icons from "@/constants/icons";
import NoResults from "@/components/NoResults";
import NotificationIcon from "@/components/NotificationIcon";

const ChatsScreen = () => {
  const { user } = useGlobalContext();
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedChat, setSelectedChat] = useState<any>(null);
  
  const screenWidth = Dimensions.get("window").width;
  const screenHeight = Dimensions.get("window").height;
  const router = useRouter();

  useEffect(() => {
    fetchChats();
  }, [user]);

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
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChatPress = (chat: any) => {
    if (!user?.$id || (!chat.user1 && !chat.user2)) return;
    const otherUserId = chat.user1 === user.$id ? chat.user2 : chat.user1;

    if (!otherUserId) return;

    router.push({
      pathname: "/(root)/chats/[id]",
      params: { id: chat.$id, userId: otherUserId },
    });
  };

  
const handleLongPress = (event: any, chat: any) => {
  const { pageX, pageY } = event.nativeEvent;

  const menuWidth = 150;
  const menuHeight = 100;

  // Clamp X
  let x = pageX;
  if (x + menuWidth > screenWidth) {
    x = screenWidth - menuWidth - 10; // add some padding
  } else if (x < 10) {
    x = 10;
  }

  // Clamp Y
  let y = pageY;
  if (y + menuHeight > screenHeight) {
    y = screenHeight - menuHeight - 10;
  } else if (y < 10) {
    y = 10;
  }

  setMenuPosition({ x, y });
  setSelectedChat(chat);
  setMenuVisible(true);
};

  const confirmDeleteChat = () => {
    if (!selectedChat) return;

    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat and all messages?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteChatAndMessages(selectedChat.$id);
              setChats((prev) => prev.filter((c) => c.$id !== selectedChat.$id));
              setMenuVisible(false);
            } catch (error) {
              console.error("Error deleting chat:", error);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const profile = item.otherUserProfile;

    return (
      <Pressable
        onPress={() => handleChatPress(item)}
        onLongPress={(e) => handleLongPress(e, item)}
        className="flex-row items-center justify-between py-2 mt-2 border border-gray-100 rounded-lg"
      >
        <View className="flex-row items-center gap-3 px-2">
          <Image
            source={profile?.avatar ? { uri: profile.avatar } : icons.person}
            className="w-12 h-12 rounded-full"
            resizeMode="cover"
          />
          <View>
            <Text className="text-black-300 text-base mt-1 font-rubik-medium">
              {profile?.name || "Unknown User"}
            </Text>
            <Text className="text-sm text-gray-400 font-rubik-regular mt-1">
              {item.lastMessage
                ? item.lastMessage.length > 40
                  ? item.lastMessage.substring(0, 40) + "..."
                  : item.lastMessage
                : "Tap to continue"}
            </Text>
          </View>
        </View>
      </Pressable>
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
            <NotificationIcon/>
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

      {/* Floating Context Menu */}
      {menuVisible && (
        <View
          className="absolute bg-white shadow-md rounded-lg p-2"
          style={{
            top: menuPosition.y,
            right: menuPosition.x, // Keep it right side
            width: 150,
            zIndex: 999,
          }}
        >
          <TouchableOpacity
            className="py-2 px-3"
            onPress={confirmDeleteChat}
          >
            <Text className="text-red-500 font-rubik-medium">Delete Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="py-2 px-3"
            onPress={() => setMenuVisible(false)}
          >
            <Text className="text-gray-500 font-rubik-medium">Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

export default ChatsScreen;
