import { useState, useEffect } from "react";
import { addToFavorites, removeFromFavorites, config, databases } from "@/lib/appwrite";
import { Query } from "react-native-appwrite";

export const useFavorite = (propertyId: string, userId: string) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [documentId, setDocumentId] = useState<string | null>(null);

  const getFavoriteDocumentId = async () => {
    try {
      const res = await databases.listDocuments(config.databaseId!, config.favoritesCollectionId!, [
        Query.equal("propertyId", propertyId),
        Query.equal("userId", userId),
      ]);
      if (res.documents.length > 0) {
        setDocumentId(res.documents[0].$id);
        setIsFavorite(true);
      } else {
        setIsFavorite(false);
      }
    } catch (err) {
      console.error("Error checking favorite:", err);
    }
  };

  const toggleFavorite = async () => {
    if (isFavorite && documentId) {
      await removeFromFavorites(documentId);
      setIsFavorite(false);
      setDocumentId(null);
    } else {
      const res = await addToFavorites(userId, propertyId);
      setIsFavorite(true);
      setDocumentId(res.$id);
    }
  };

  useEffect(() => {
    getFavoriteDocumentId();
  }, [propertyId, userId]);

  return { isFavorite, toggleFavorite };
};