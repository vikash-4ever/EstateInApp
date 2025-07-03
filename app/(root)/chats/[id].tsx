import { useEffect, useState, useRef } from "react";
import {
  View,
  TextInput,
  Text,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  databases,
} from "@/lib/appwrite";
import { Query } from "react-native-appwrite";
import icons from "@/constants/icons";

const ChatRoom = () => {
  const { id: chatId, userId: otherUserId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();
  const { user } = useGlobalContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverName, setReceiverName] = useState("Live Chat");
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Fetch other user's userProfile
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const res = await databases.listDocuments(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.EXPO_PUBLIC_APPWRITE_USERPROFILES_COLLECTION_ID!,
          [Query.equal("userId", otherUserId)]
        );

        if (res.documents.length > 0) {
          setReceiverName(res.documents[0].name);
        }
      } catch (error) {
        console.error("Failed to load receiver profile", error);
      }
    };

    fetchUserProfile();
  }, [otherUserId]);

  useEffect(() => {
    const fetch = async () => {
      const msgs = await getMessages(chatId);
      setMessages(msgs);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 50);
    };

    fetch();

    const unsubscribe = subscribeToMessages(chatId, (event) => {
      const message = event.payload;
      setMessages((prev) => [...prev, message]);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 50);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (newMessage.trim()) {
      await sendMessage({
        chatId,
        senderId: user?.$id!,
        receiverId: otherUserId,
        content: newMessage,
      });
      setNewMessage("");
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View
      className={`max-w-[70%] p-3 my-1 rounded-2xl ${
        item.senderId === user?.$id
          ? "bg-primary-300 self-end rounded-tr-none"
          : "bg-gray-100 self-start rounded-tl-none"
      }`}
    >
      <Text
        className={`text-sm ${
          item.senderId === user?.$id
            ? "text-white font-rubik-regular"
            : "text-black font-rubik-regular"
        }`}
      >
        {item.content}
      </Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-4 bg-white border-b border-gray-100">
        <TouchableOpacity
          onPress={() => router.back()}
          className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
        >
          <Image source={icons.backArrow} className="size-5" />
        </TouchableOpacity>

        <Text className="text-base text-center font-rubik-medium text-black-300">
          {receiverName}
        </Text>

        <TouchableOpacity>
          <Image source={icons.dots} className="w-6 h-6" />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.$id}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input */}
      <View className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-100 flex-row items-center gap-3">
        <TextInput
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          className="flex-1 px-4 py-3 bg-gray-100 rounded-full font-rubik-regular text-sm text-black"
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          onPress={handleSend}
          className="bg-primary-300 rounded-full p-3"
        >
          <Image source={icons.send} className="w-5 h-5 tint-white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatRoom;
