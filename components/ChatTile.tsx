import { View, Text, TouchableOpacity, Image } from "react-native";
import { useRouter } from "expo-router";
import { formatDistanceToNow } from "date-fns";
import React from "react";

type ChatTileProps = {
  chatId: string;
  userId: string;
  name: string;
  profileImage?: string;
  lastMessage?: string;
  lastMessageTimestamp?: string;
};

const ChatTile = ({
  chatId,
  userId,
  name,
  profileImage,
  lastMessage,
  lastMessageTimestamp,
}: ChatTileProps) => {
  const router = useRouter();

  return (
    <TouchableOpacity
      className="flex-row items-center gap-4 p-4 border-b border-gray-200"
      onPress={() =>
        router.push({
          pathname: "/(root)/chats/[id]",
          params: {
            id: chatId,
            userId: userId,
          },
        })
      }
    >
      <Image
        source={{
          uri: profileImage || "https://via.placeholder.com/100",
        }}
        className="w-12 h-12 rounded-full"
        resizeMode="cover"
      />

      <View className="flex-1">
        <Text className="text-base font-semibold text-black">{name}</Text>
        <Text className="text-sm text-gray-500 truncate">{lastMessage || "Say hello!"}</Text>
      </View>

      {lastMessageTimestamp && (
        <Text className="text-xs text-gray-400">
          {formatDistanceToNow(new Date(lastMessageTimestamp), { addSuffix: true })}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default ChatTile;
