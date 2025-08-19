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
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useGlobalContext } from "@/lib/global-provider";
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  deleteMessages,
  databases,
  deleteChatIfEmpty,
} from "@/lib/appwrite";
import { Query } from "react-native-appwrite";
import icons from "@/constants/icons";

type Message = {
  $id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
};

const ChatRoom = () => {
  const { id: chatId, userId: otherUserId } = useLocalSearchParams<{
    id: string;
    userId: string;
  }>();
  const { user } = useGlobalContext();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<string[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  // Fetch other user's profile name
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

  // Load and subscribe to messages
  useEffect(() => {
    const fetch = async () => {
      const msgs = await getMessages(chatId);
      setMessages(msgs);
      scrollToBottom(false);
    };
    fetch();

    const unsubscribe = subscribeToMessages(chatId, (event) => {
      const message = event.payload;

      setMessages((prev: Message[]) => {
        const msg = message as Message;
        
        if (event.events.includes("databases.*.collections.*.documents.delete")) {
          return prev.filter((m) => m.$id !== msg.$id);
        }

        if (prev.some((m) => m.$id === msg.$id)) {
          return prev;
        }

        return [...prev, msg];
      });

      scrollToBottom(true);
    });

    return () => unsubscribe();
  }, [chatId]);

  const scrollToBottom = (animated: boolean) => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated });
    }, 50);
  };

  const handleSend = async () => {
    if (newMessage.trim()) {
      await sendMessage({
        chatId,
        senderId: user?.$id!,
        receiverId: otherUserId,
        content: newMessage,
      });
      setNewMessage("");
      scrollToBottom(true);
    }
  };

  // Toggle message selection
  const toggleSelectMessage = (id: string) => {
    if (!selectionMode) {
      setSelectionMode(true);
      setSelectedMessages([id]);
    } else {
      setSelectedMessages((prev) =>
        prev.includes(id) ? prev.filter((msgId) => msgId !== id) : [...prev, id]
      );
    }
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      "Delete Messages",
      `Are you sure you want to delete ${selectedMessages.length} message(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteMessages(selectedMessages);
              setMessages((prev) =>
                prev.filter((msg) => !selectedMessages.includes(msg.$id))
              );
              await deleteChatIfEmpty(chatId); // NEW step
              setSelectedMessages([]);
              setSelectionMode(false);
            } catch (error) {
              console.error("Error deleting messages:", error);
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    const isSelected = selectedMessages.includes(item.$id);
    const isSender = item.senderId === user?.$id;

    return (
      <TouchableOpacity
        onLongPress={() => toggleSelectMessage(item.$id)}
        onPress={() => {
          if (selectionMode) toggleSelectMessage(item.$id);
        }}
        className={`max-w-[70%] p-3 my-1 rounded-2xl ${
          isSender
            ? "bg-primary-300 self-end rounded-tr-none"
            : "bg-gray-100 self-start rounded-tl-none"
        } ${isSelected ? "border-2 border-primary-300 bg-black-50" : ""}`}
      >
        <Text
          className={`text-md ${
            isSender
              ? "text-white font-rubik-regular"
              : "text-black font-rubik-regular"
          }`}
        >
          {item.content}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleReceiverPress = () => {
    if (otherUserId) {
      // router.push(`/users/${user!.$id}`);
      Alert.alert("Please search User in Universal Search.")
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View
            className="flex-1"
            onLayout={() => scrollToBottom(false)}
          >
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 py-5 bg-white border-b border-gray-100">
              <TouchableOpacity
                onPress={() => {
                  if (selectionMode) {
                    setSelectionMode(false);
                    setSelectedMessages([]);
                  } else {
                    router.back();
                  }
                }}
                className="flex flex-row bg-primary-200 rounded-full size-11 items-center justify-center"
              >
                <Image source={icons.backArrow} className="size-5" />
              </TouchableOpacity>
              
              <TouchableOpacity onPress={handleReceiverPress}>
                <Text className="text-base text-center font-rubik-medium text-black-300">
                  {receiverName}
                </Text>
              </TouchableOpacity>

              {selectionMode ? (
                <TouchableOpacity onPress={handleDeleteSelected}>
                  <Image source={icons.trash} className="w-6 h-6" tintColor="red" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity>
                  <Image source={icons.dots} className="w-6 h-6" tintColor={"transparent"} />
                </TouchableOpacity>
              )}
            </View>

            {/* Chat Messages */}
            <FlatList
              ref={flatListRef}
              data={messages}
              renderItem={renderItem}
              keyExtractor={(item) => item.$id}
              onLayout={() => scrollToBottom(false)}
              contentContainerStyle={{ padding: 16, paddingBottom: 10 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollToBottom(true)}
            />

            {/* Message Input */}
            {!selectionMode && (
              <View className="px-4 py-1 bg-white border-t border-gray-100 flex-row items-center gap-3">
                <TextInput
                  value={newMessage}
                  onChangeText={setNewMessage}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-3 bg-gray-100 rounded-full font-rubik-regular text-lg text-black"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity
                  onPress={handleSend}
                  className="bg-primary-300 rounded-full p-4"
                >
                  <Image source={icons.send} className="w-6 h-6" tintColor={"white"} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatRoom;
