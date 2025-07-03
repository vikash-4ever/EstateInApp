import * as FileSystem from "expo-file-system";
import mime from "mime";
import { ID, storage } from "./appwrite";

export const uploadImage = async (imageUri: string): Promise<string> => {
  const bucketId = process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!;
  const fileName = imageUri.split("/").pop() || `image_${Date.now()}`;
  const fileType = mime.getType(imageUri) || "image/jpeg";

  const fileStat = await FileSystem.getInfoAsync(imageUri);

  if (!fileStat.exists) {
    throw new Error("File does not exist at the given URI");
  }

  const file = {
    uri: imageUri,
    name: fileName,
    type: fileType,
    size: fileStat.size ?? 0, // fileStat.size is now guaranteed to exist
  };

  const uploadedFile = await storage.createFile(bucketId, ID.unique(), file);
  const fileUrl = storage.getFileView(bucketId, uploadedFile.$id);

  return fileUrl.href;
};
