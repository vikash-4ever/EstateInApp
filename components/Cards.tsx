import React, { useState, useEffect } from "react";
import { Text, TouchableOpacity, View, Image } from 'react-native';
import icons from "@/constants/icons";
import { Models, Query } from "react-native-appwrite";
import { addToFavorites, config, databases, removeFromFavorites } from "@/lib/appwrite";

interface Props {
    item: Models.Document;
    userId: string;
    onPress?: () => void;
}

export const FeaturedCard = ({ item: { images, rating, name, address, price, $id }, userId, onPress }: Props) => {
    const image = Array.isArray(images) && images.length > 0 ? images[0] : null;
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const checkIfFavorite = async () => {
            const favoriteDocumentId = await getFavoriteDocumentId($id, userId);
            if (favoriteDocumentId) {
                setIsFavorite(true);
            }
        };

        checkIfFavorite();
    }, [userId, $id]);  

    const handleFavoriteToggle = async () => {
        if (isFavorite) {
            const favoriteDocumentId = await getFavoriteDocumentId($id, userId);
            if (favoriteDocumentId) {
                await removeFromFavorites(favoriteDocumentId);
            }
        } else {
            await addToFavorites(userId, $id);
        }

        setIsFavorite(!isFavorite);
    };

    return (
        <TouchableOpacity onPress={onPress} className="flex flex-col items-start w-60 h-80 relative">
            <Image source={{ uri: image }} className="size-full rounded-2xl" />
            <View className="flex flex-row items-center bg-white/90 px-3 py-1.5 rounded-full absolute top-5 right-5">
                <Image source={icons.star} className="size-3.5" />
                <Text className="text-xs font-rubik-bold text-primary-300 ml-1">{rating}</Text>
            </View>
            <View className="flex flex-col items-start absolute bottom-5 inset-x-5">
                <Text className="text-xl font-rubik-extrabold text-white" numberOfLines={1}>{name}</Text>
                <Text className="text-base font-rubik text-white">{address}</Text>
                <View className="flex flex-row items-center justify-between w-full">
                    <Text className="text-xl font-rubik-extrabold text-white">
                        {'\u20B9'}{price}
                    </Text>
                    <TouchableOpacity onPress={handleFavoriteToggle}>
                        <Image
                            source={icons.heart}
                            className="size-5"
                            tintColor={isFavorite ? "#dfb6b2" : "white"}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

export const Card = ({ item: { images, rating, name, address, price, $id }, userId, onPress }: Props) => {
    const image = Array.isArray(images) && images.length > 0 ? images[0] : null;
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        const checkIfFavorite = async () => {
            const favoriteDocumentId = await getFavoriteDocumentId($id, userId);
            if (favoriteDocumentId) {
                setIsFavorite(true);
            }
        };

        checkIfFavorite();
    }, [userId, $id]); 

    const handleFavoriteToggle = async () => {
        if (isFavorite) {
            const favoriteDocumentId = await getFavoriteDocumentId($id, userId);
            if (favoriteDocumentId) {
                await removeFromFavorites(favoriteDocumentId);
            }
        } else {
            await addToFavorites(userId, $id);
        }

        setIsFavorite(!isFavorite);
    };

    return (
        <TouchableOpacity onPress={onPress} className="flex-1 w-full mt-4 px-3 py-4 rounded-lg bg-white shadow-lg shadow-black-100/70 relative">
            <View className="flex flex-row items-center absolute px-2 top-5 right-5 bg-white/90 p-1 rounded-full z-50">
                <Image source={icons.star} className="size-2.5" />
                <Text className="text-xs font-rubik-bold text-primary-300 ml-0.5">{rating}</Text>
            </View>
            <Image source={{ uri: image }} className="w-full h-40 rounded-lg" />
            <View className="flex flex-col mt-2">
                <Text className="text-base font-rubik-bold text-black-300">{name}</Text>
                <Text className="text-xs font-rubik text-black-200">{address}</Text>
                <View className="flex flex-row items-center justify-between mt-2">
                    <Text className="text-base font-rubik-bold text-primary-300">
                        {'\u20B9'}{price}
                    </Text>
                    <TouchableOpacity onPress={handleFavoriteToggle}>
                        <Image
                            source={icons.heart}
                            className="w-5 h-5 mr-2"
                            tintColor={isFavorite ? "#dfb6b2" : "#191d31" }
                        />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const getFavoriteDocumentId = async (propertyId: string, userId: string) => {
    try {
        const response = await databases.listDocuments(config.databaseId!, config.favoritesCollectionId!, [
            Query.equal("propertyId", propertyId),
            Query.equal("userId", userId),
        ]);
        return response.documents[0]?._id;
    } catch (error) {
        console.error("Error fetching favorite document:", error);
        return null;
    }
};
