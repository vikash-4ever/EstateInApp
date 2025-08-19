import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, View, Image, ActivityIndicator, Alert } from "react-native";
import icons from "@/constants/icons";
import { Models, Query } from "react-native-appwrite";
import { acceptBookingRequest, addToFavorites, config, databases, deleteBookingRequest, rejectBookingRequest, removeFromFavorites } from "@/lib/appwrite";
import { useGlobalContext } from "@/lib/global-provider";

interface Props {
  item: Models.Document; 
  userId: string;
  onPress?: () => void;
}

// Utility: Fetch favorite doc ID
const getFavoriteDocumentId = async (propertyId: string, userId: string) => {
  try {
    const response = await databases.listDocuments(
      config.databaseId!,
      config.favoritesCollectionId!,
      [
        Query.equal("propertyId", propertyId),
        Query.equal("userId", userId),
      ]
    );
    return response.documents.length > 0 ? response.documents[0].$id : null;
  } catch (error) {
    console.error("Error fetching favorite document:", error);
    return null;
  }
};

const useFavorite = ($id: string, userId: string, initialValue = false) => {
  const { setFavoritesUpdated } = useGlobalContext();
  const [isFavorite, setIsFavorite] = useState(initialValue);
  const [favoriteDocId, setFavoriteDocId] = useState<string | null>(null);

  useEffect(() => {
    if (initialValue) return; // Already known from props, skip check
    const checkIfFavorite = async () => {
      const favId = await getFavoriteDocumentId($id, userId);
      if (favId) {
        setIsFavorite(true);
        setFavoriteDocId(favId);
      }
    };
    checkIfFavorite();
  }, [$id, userId]);

  const toggleFavorite = async () => {
    const prevValue = isFavorite;
    setIsFavorite(!prevValue);
    try {
      if (prevValue && favoriteDocId) {
        await removeFromFavorites(favoriteDocId);
        setFavoriteDocId(null);
      } else {
        const newFav = await addToFavorites(userId, $id);
        setFavoriteDocId(newFav.$id);
      }
      setFavoritesUpdated(prev => !prev);
    } catch (error) {
      console.error("Error toggling favorite:", error);
      setIsFavorite(prevValue);
    }
  };

  return { isFavorite, toggleFavorite };
};


export const FeaturedCard = ({
  item: { images, rating, name, address, price, $id, isFavorite:initialFav },
  userId,
  onPress,
}: Props) => {
  const image = Array.isArray(images) && images.length > 0 ? images[0] : null;
  const { isFavorite, toggleFavorite } = useFavorite($id, userId, initialFav);

  return (
    <TouchableOpacity onPress={onPress} className="flex flex-col items-start w-60 h-80 relative">
      <Image source={{ uri: image }} className="size-full rounded-2xl" />
      <View className="flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-5 right-5">
        <Image source={icons.star} className="size-3.5" />
        <Text className="text-xs font-rubik-bold text-primary-300 ml-1">{rating}</Text>
      </View>
      <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
        <Text className="text-xl font-rubik-extrabold text-white" numberOfLines={1}>
          {name}
        </Text>
        <Text className="text-base font-rubik text-white">{address}</Text>
        <View className="flex flex-row items-center justify-between w-full">
          <Text className="text-xl font-rubik-extrabold text-white">{'\u20B9'}{price}</Text>
          <TouchableOpacity onPress={toggleFavorite}>
            <Image
              source={isFavorite ? icons.heartfilled : icons.heart}
              className="size-5"
              tintColor={isFavorite ? "red" : "white"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const Card = ({
  item: { images, rating, name, address, price, $id },
  userId,
  onPress,
}: Props) => {
  const image = Array.isArray(images) && images.length > 0 ? images[0] : null;
  const { isFavorite, toggleFavorite } = useFavorite($id, userId);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="flex-1 w-full mt-4 px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative"
    >
      <View className="flex flex-row items-center absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
        <Image source={icons.star} className="size-2.5" />
        <Text className="text-xs font-rubik-bold text-primary-300 ml-0.5">{rating}</Text>
      </View>
      <Image source={{ uri: image }} className="w-full h-40 rounded-lg" />
      <View className="flex flex-col mt-2">
        <Text className="text-base font-rubik-bold text-black-300">{name}</Text>
        <Text className="text-xs font-rubik text-black-200">{address}</Text>
        <View className="flex flex-row items-center justify-between mt-2">
          <Text className="text-base font-rubik-bold text-primary-300">{'\u20B9'}{price}</Text>
          <TouchableOpacity onPress={toggleFavorite}>
            <Image
              source={isFavorite ? icons.heartfilled : icons.heart}
              className="w-5 h-5 mr-1"
              tintColor={isFavorite ? "red" : "#191d31"}
            />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export const BookingCard = ({
  item,
  onPress,
  currentProfileId,
  onDeleted,
}: {
  item: any;
  onPress?: () => void;
  currentProfileId: string;
    onDeleted?: (deletedId: string) => void;
}) => {
  const [loading, setLoading] = useState(false);

  const image =
    Array.isArray(item.property?.images) && item.property.images.length > 0
      ? item.property.images[0]
      : null;

  const isSender = item.senderProfile?.$id === currentProfileId;
  const isReceiver = item.receiverProfile?.$id === currentProfileId;

  const handleAccept = async () => {
    setLoading(true);
    try {
      await acceptBookingRequest(item.$id);
      item.status = "accepted";
    } catch (err) {
      console.error("Error accepting request:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await rejectBookingRequest(item.$id);
      item.status = "rejected";
    } catch (err) {
      console.error("Error rejecting request:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
  Alert.alert(
    "Delete Request",
    "Are you sure you want to delete this booking request?",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          setLoading(true);
          try {
            await deleteBookingRequest(item.$id);
            if (onDeleted) onDeleted(item.$id);
          } catch (err) {
            console.error("Error deleting request:", err);
          } finally {
            setLoading(false);
          }
        },
      },
    ]
  );
};

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    accepted: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <View className="w-full mt-4 p-4 rounded-lg bg-white shadow-lg shadow-black-100/40">
      {/* Property image */}
      <TouchableOpacity onPress={onPress}>
        {image ? (
          <Image source={{ uri: image }} className="w-full h-40 rounded-lg" />
        ) : (
          <View className="w-full h-40 bg-gray-100 rounded-lg items-center justify-center">
            <Text className="text-gray-400">No image</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Property details */}
      <TouchableOpacity onPress={onPress}>
        <Text className="text-base font-rubik-bold text-black-300 mt-2">
          {item.property?.name || "Unknown Property"}
        </Text>
        <Text className="text-xs font-rubik text-black-200">
          {item.property?.address || "No address available"}
        </Text>
      </TouchableOpacity>

      {/* Price & Status */}
      <View className="flex flex-row items-center justify-between mt-2">
        <Text className="text-base font-rubik-bold text-primary-300">
          ₹{item.property?.price || "N/A"}
        </Text>
        <View
          className={`px-3 py-1 rounded-full ${
            statusColors[item.status || "pending"]
          }`}
        >
          <Text className="text-xs font-rubik-bold capitalize">
            {item.status || "pending"}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View className="flex flex-row gap-3 mt-4">
        {loading ? (
          <ActivityIndicator size="small" className="text-primary-300" />
        ) : isReceiver && item.status === "pending" ? (
          <>
            <TouchableOpacity
              onPress={handleAccept}
              className="flex-1 bg-green-500 rounded-lg py-2"
            >
              <Text className="text-white text-center font-rubik-bold">
                Accept
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReject}
              className="flex-1 bg-red-500 rounded-lg py-2"
            >
              <Text className="text-white text-center font-rubik-bold">
                Reject
              </Text>
            </TouchableOpacity>
          </>
        ) : isSender ? (
          <TouchableOpacity
            onPress={handleDelete}
            className="flex-1 bg-red-500 rounded-lg py-2"
          >
            <Text className="text-white text-center font-rubik-bold">
              Delete
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};
