import {Account, Avatars, Client, Databases, ID, OAuthProvider, RealtimeResponseEvent, Query, Storage} from "react-native-appwrite";
import * as FileSystem from "expo-file-system";
import * as Linking from "expo-linking";
import { openAuthSessionAsync } from "expo-web-browser";

type MessagePayload = {
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: string;
};

type Filters = {
  mode?: string;
  type?: string;
  minPrice?: number;
  maxPrice?: number;
  minBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  facilities?: string[]; // selected facilities must all be included
  limit?: number;
};

const safeParse = (str?: string) => {
  if (!str) return {};
  try { return JSON.parse(str); } catch { return {}; }
};

export const config = {
    platform : 'com.vishw.estatein',
    endpoint : process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT,
    projectId : process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID,
    databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID,
    galleriesCollectionId : process.env.EXPO_PUBLIC_APPWRITE_GALLERIES_COLLECTION_ID,
    reviewsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_REVIEWS_COLLECTION_ID,
    userProfilesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_USERPROFILES_COLLECTION_ID,
    propertiesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID,
    favoritesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_FAVORITES_COLLECTION_ID,
    chatsCollectionId: process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID,
    statusCollectionId: process.env.EXPO_PUBLIC_APPWRITE_STATUS_COLLECTION_ID,
    messagesCollectionId: process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID,
    bucketId: process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID,
    bookingsId: process.env.EXPO_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID,
};

export const client = new Client();

client
    .setEndpoint(config.endpoint!)
    .setProject(config.projectId!)

export const avatar = new Avatars(client);
export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export {ID};

export async function login() {
    try{
        const redirectUri = Linking.createURL('/');

        const response = await account.createOAuth2Token(OAuthProvider.Google, redirectUri);

        if(!response) throw new Error('Failed to Login!');
        const browserResult = await openAuthSessionAsync(
            response.toString(), redirectUri
        )

        if (browserResult.type !== 'success') throw new Error('Failed to Login!');

        const url = new URL(browserResult.url);

        const secret = url.searchParams.get('secret') ?.toString();
        const userId = url.searchParams.get('userId') ?.toString();

        if(!secret || !userId) throw new Error('Failed to Login!');

        const session = await account.createSession(userId, secret);

        if(!session) throw new Error('Failed to create session!');

        return true;
    }catch(error) {
        console.error(error);
        return false;
    }
};

export async function logout() {
    try {
        await account.deleteSession('current');
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

export async function getCurrentUser() {
    try {
        const response = await account.get();
        if(response.$id) {
            const userAvatar = avatar.getInitials(response.name);
            return {
                ... response,
                avatar: userAvatar.toString(),
            }
        }
        
    } catch (error) {
        console.error(error);
        return null;
    }
};

export const getCurrentUserProfile = async () => {
  try {
    const authUser = await account.get();
    const response = await databases.listDocuments(
      config.databaseId!,
      config.userProfilesCollectionId!,
      [Query.equal("userId", authUser.$id)]
    );

    return response.documents[0] || null;
  } catch (error) {
    console.error("Error fetching current user's profile:", error);
    return null;
  }
};

export async function getLatestProperties({
  userId,
}: {
  userId?: string;
}) {
  try {
    const propertiesPromise = databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      [Query.orderAsc('$createdAt'), Query.limit(5)]
    );

    const favoritesPromise = userId
      ? getFavorites(userId)
      : Promise.resolve([]);

    const [propertiesResult, favorites] = await Promise.all([
      propertiesPromise,
      favoritesPromise,
    ]);

    const favoriteIds = new Set(favorites.map((f: any) => f.propertyId));

    return propertiesResult.documents.map((doc) => ({
      ...doc,
      isFavorite: favoriteIds.has(doc.$id),
    }));
  } catch (error) {
    console.error("Error in getLatestProperties:", error);
    return [];
  }
}

export async function getProperties({
  filter,
  query,
  limit = 100,
  offset = 0,
  userId,
}: {
  filter: string;
  query: string;
  limit?: number;
  offset?: number;
  userId?: string;
}) {
  try {
    const buildQuery = [Query.orderDesc('$createdAt')];

    if (query) {
      buildQuery.push(
        Query.or([
          Query.search('name', query),
          Query.search('address', query),
        ])
      );
    }

    if (limit) buildQuery.push(Query.limit(limit));
    if (offset) buildQuery.push(Query.offset(offset));

    const propertiesPromise = databases.listDocuments(
      config.databaseId!,
      config.propertiesCollectionId!,
      buildQuery
    );

    const favoritesPromise = userId ? getFavorites(userId) : Promise.resolve([]);

    const [propertiesResult, favorites] = await Promise.all([
      propertiesPromise,
      favoritesPromise
    ]);

    const favoriteIds = new Set(favorites.map((f: any) => f.propertyId));

    const filteredDocs = propertiesResult.documents.filter((doc) => {
      const meta = JSON.parse(doc.meta || '{}');
      return !filter || filter === 'All' || meta.type === filter;
    });

    return filteredDocs.map((doc) => ({
      ...doc,
      isFavorite: favoriteIds.has(doc.$id)
    }));
  } catch (error) {
    console.error("Error in getProperties:", error);
    return [];
  }
}
  
export async function getPropertyById({id}:{id : string}) {
    try{
        const result = await databases.getDocument(
            config.databaseId!,
            config.propertiesCollectionId!,
            id,
        );
        return result;
    }catch(error) {
        console.error(error);
        return null;
    }
};

export const createPost = async ({
  name,
  description,
  address,
  price,
  rating = 0,
  images,
  details,     // should be JSON.stringify({ area, bedrooms, bathrooms })
  meta,        // should be JSON.stringify({ type, facilities, geolocation, mode })
  userProfile, // userProfile $id
  gallery,     // gallery document ID (optional)
  reviews = [], // array of review IDs (optional)
}: {
  name: string;
  description: string;
  address: string;
  price: number;
  rating?: number;
  images: string[];
  details: string;
  meta: string;
  userProfile: string;
  gallery?: string;
  reviews?: string[];
}) => {
  try {
    const document = await databases.createDocument(
      config.databaseId!,
      config.propertiesCollectionId!,
      ID.unique(),
      {
        name,
        description,
        address,
        price,
        rating,
        images,
        details,
        meta,
        userProfile,
        gallery,
        reviews
      }
    );

    return document;
  } catch (error) {
    console.error("Error creating post:", error);
    throw error;
  }
};

export const deleteProperty = async (propertyId: string) => {
  try {
    const response = await databases.deleteDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID!,
      propertyId
    );

    return response;
  } catch (error) {
    console.error("Failed to delete property:", error);
    throw error;
  }
};

export const addToFavorites = async (userId: string, propertyId: string) => {
    return await databases.createDocument(
      config.databaseId!,
      config.favoritesCollectionId!,
      ID.unique(),
      {
        userId,
        propertyId,
      }
    );
};
  
export const getFavorites = async (userId: string) => {
  const response = await databases.listDocuments(
    config.databaseId!,
    config.favoritesCollectionId!,
    [Query.equal("userId", userId)]
  );
  
  return response.documents;
};
  
export const removeFromFavorites = async (documentId: string) => {
  return await databases.deleteDocument(
    config.databaseId!,
    config.favoritesCollectionId!,
    documentId
  );
};

export const getUserProfile = async (profileId: string) => {
  try {
    const response = await databases.getDocument(
      config.databaseId!,
      config.userProfilesCollectionId!,
      profileId // this is the document $id of userProfiles
    );
    return response;
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

export const getUserProfileByUserId = async (userId: string) => {
  try {
    const res = await databases.listDocuments(
      config.databaseId!, config.userProfilesCollectionId!, [
      Query.equal("userId", userId),
      Query.limit(1),
    ]);
    return res.documents[0] || null;
  } catch (error) {
    console.error("Failed to fetch user profile:", error);
    return null;
  }
};

export const getUserProperties = async (userId: string) => {
  try {
    let allProperties: any[] = [];
    let offset = 0;
    const batchSize = 100;

    while (true) {
      const batch = await databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID!,
        [
          Query.equal("userProfile", userId),
          Query.limit(batchSize),
          Query.offset(offset),
        ]
      );

      allProperties.push(...batch.documents);

      if (batch.documents.length < batchSize) break;

      offset += batchSize;
    }

    return allProperties.map((post) => ({
      ...post,
      details: JSON.parse(post.details),
      meta: JSON.parse(post.meta),
    }));
  } catch (error) {
    console.error("Error fetching user properties:", error);
    throw error;
  }
};

export const getOrCreateChat = async (user1Id: string, user2Id: string) => {
  try {
    const res = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!, 
      process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID!, [
      Query.or([
        Query.and([Query.equal("user1", user1Id), Query.equal("user2", user2Id)]),
        Query.and([Query.equal("user1", user2Id), Query.equal("user2", user1Id)])
      ])
    ]);

    if (res.total > 0) return res.documents[0];

    const newChat = await databases.createDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID!,
      ID.unique(),
      {
        user1: user1Id,
        user2: user2Id,
        lastMessage: "",
        lastUpdated: new Date().toISOString()
      }
    );

    return newChat;
  } catch (error) {
    console.error("Error in getOrCreateChat:", error);
    throw error;
  }
};

export const getChatsForUser = async (userId: string) => {
  try {
    const res = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID!, 
      [
      Query.or([Query.equal("user1", userId), Query.equal("user2", userId)]),
      Query.orderDesc("lastUpdated")
    ]);
    return res.documents;
  } catch (error) {
    console.error("Error in getChatsForUser:", error);
    return [];
  }
};

export const getMessages = async (chatId: string) => {
  try {
    const res = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
      [
      Query.equal("chatId", chatId),
      Query.orderAsc("timestamp")
    ]);
    return res.documents;
  } catch (error) {
    console.error("Error in getMessages:", error);
    return [];
  }
};

export const sendMessage = async ({
  chatId,
  senderId,
  receiverId,
  content,
}: {
  chatId: string;
  senderId: string;
  receiverId: string;
  content: string;
}) => {
  try {
    const response = await databases.createDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
      ID.unique(),
      {
        chatId,
        senderId,
        receiverId,
        content,
        timestamp: new Date().toISOString(),
      }
    );

    await databases.updateDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID!,
      chatId,
      {
        lastMessage: content,
        lastUpdated: new Date().toISOString(),
      }
    );

    return response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
};

export const deleteChatAndMessages = async (chatId: string) => {
  try {
    // Delete all messages in the chat
    const messagesRes = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
      [Query.equal("chatId", chatId)]
    );

    await Promise.all(
      messagesRes.documents.map((msg) =>
        databases.deleteDocument(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
          msg.$id
        )
      )
    );

    // Delete the chat itself
    await databases.deleteDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID!,
      chatId
    );

    return true;
  } catch (error) {
    console.error("Error deleting chat and messages:", error);
    throw error;
  }
};

export const deleteMessages = async (messageIds: string[]) => {
  try {
    await Promise.all(
      messageIds.map((id) =>
        databases.deleteDocument(
          process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
          id
        )
      )
    );
    return true;
  } catch (error) {
    console.error("Error deleting messages:", error);
    throw error;
  }
};

export const deleteChatIfEmpty = async (chatId: string) => {
  try {
    // 1. Check if there are any messages left
    const messagesRes = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!,
      [Query.equal("chatId", chatId)]
    );

    // 2. If no messages, delete the chat
    if (messagesRes.total === 0) {
      await databases.deleteDocument(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_CHATS_COLLECTION_ID!,
        chatId
      );
      console.log(`Chat ${chatId} deleted because it had no messages`);
    }
  } catch (error) {
    console.error("Error deleting chat if empty:", error);
  }
};

export const subscribeToMessages = (
  chatId: string,
  callback: (message: RealtimeResponseEvent<MessagePayload>) => void
) => {
  const unsubscribe = client.subscribe<MessagePayload>(
    `databases.${process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!}.collections.${process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID!}.documents`,
    (res) => {
      if ((res.payload as MessagePayload).chatId === chatId) {
        callback(res);
      }
    }
  );

  return unsubscribe;
};

export const searchUniversal = async (query: string, filters: Filters = {}) => {
  try {
    const {
      mode,
      type,
      minPrice,
      maxPrice,
      minBedrooms,
      minBathrooms,
      minArea,
      maxArea,
      facilities,
      limit = 50,
    } = filters;

    // --- Users query (unchanged) ---
    const userQuery = [
      Query.or([Query.search("name", query), Query.search("email", query)]),
      Query.limit(20),
    ];

    // --- Properties: base search in indexable string fields ---
    const propertyQuery: any[] = [
      Query.or([
        Query.search("name", query),
        Query.search("description", query),
        Query.search("address", query),
        Query.search("details", query),
        Query.search("meta", query),
      ]),
      Query.limit(limit),
    ];

    // price is top-level → safe to filter server-side
    if (typeof minPrice === "number") propertyQuery.push(Query.greaterThanEqual("price", minPrice));
    if (typeof maxPrice === "number") propertyQuery.push(Query.lessThanEqual("price", maxPrice));

    const [usersRes, propsRes] = await Promise.all([
      databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_USERPROFILES_COLLECTION_ID!,
        userQuery
      ),
      databases.listDocuments(
        process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
        process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID!,
        propertyQuery
      ),
    ]);

    const users = usersRes.documents.map((doc: any) => ({ ...doc, type: "user" }));

    // --- Parse JSON and filter client-side for non-indexed attributes ---
    let props = propsRes.documents.map((doc: any) => {
      const details = safeParse(doc.details as string) as any;
      const metaObj = safeParse(doc.meta as string) as any;

      const parsed = {
        mode: metaObj?.mode ?? "",
        type: metaObj?.type ?? "",
        facilities: Array.isArray(metaObj?.facilities) ? metaObj.facilities as string[] : [],
        area: Number(details?.area) || 0,
        bedrooms: Number(details?.bedrooms) || 0,
        bathrooms: Number(details?.bathrooms) || 0,
      };

      return { ...doc, _parsed: parsed, type: "property" };
    });

    if (mode) props = props.filter((p: any) => p._parsed.mode === mode);
    if (type) props = props.filter((p: any) => p._parsed.type === type);

    if (typeof minBedrooms === "number") props = props.filter((p: any) => p._parsed.bedrooms >= minBedrooms);
    if (typeof minBathrooms === "number") props = props.filter((p: any) => p._parsed.bathrooms >= minBathrooms);

    if (typeof minArea === "number") props = props.filter((p: any) => p._parsed.area >= minArea);
    if (typeof maxArea === "number") props = props.filter((p: any) => p._parsed.area <= maxArea);

    if (facilities && facilities.length) {
      props = props.filter((p: any) =>
        facilities.every(f => p._parsed.facilities.includes(f))
      );
    }

    return [...users, ...props];
  } catch (error: any) {
    console.error("Search Failed!", error?.message || error);
    return [];
  }
};

export const uploadFile = async (uri: string) => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists || fileInfo.size == null) {
      throw new Error("File does not exist or size is unknown");
    }

    const file = {
      uri,
      name: `avatar-${Date.now()}.jpg`,
      type: "image/jpeg",
      size: fileInfo.size,
    };

    const response = await storage.createFile(
      process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!,
      ID.unique(),
      file
    );

    const url = storage.getFileView(
      process.env.EXPO_PUBLIC_APPWRITE_BUCKET_ID!,
      response.$id
    ).href;

    return url;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
};

export const updateUserProfile = async (id: string, data: { avatar: string }) => {
  try {
    return await databases.updateDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_USERPROFILES_COLLECTION_ID!,
      id,
      data
    );
  } catch (error) {
    console.error("Failed to update profile:", error);
  }
};

export const sendBookingRequest = async ({
  propertyId,
  senderProfileId,
  receiverProfileId,
}: {
  propertyId: string;
  senderProfileId: string;
  receiverProfileId: string;
}) => {
  try {
    const response = await databases.createDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
      ID.unique(),
      {
        propertyId,
        senderProfile: senderProfileId,
        receiverProfile: receiverProfileId,
        status: 'pending',
        seenByReceiver: false,
        seenBySender: true,
        createdAt: new Date().toISOString(),
      }
    );
    return response;
  } catch (error) {
    console.error('Error sending booking request:', error);
    throw error;
  }
};

export const getBookingRequestForProperty = async (propertyId: string, senderProfileId: string) => {
  try {
    const res = await databases.listDocuments(
      config.databaseId!,
      config.bookingsId!,
      [
        Query.equal("propertyId", propertyId),
        Query.equal("senderProfile", senderProfileId),
      ]
    );
    return res.documents.length > 0 ? res.documents[0] : null;
  } catch (err) {
    console.error("Error checking booking request:", err);
    return null;
  }
};

export const getBookingRequestsForUser = async (userProfileId: string) => {
  try {
    const res = await databases.listDocuments(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
      [
        Query.or([
          Query.equal("senderProfile", userProfileId),
          Query.equal("receiverProfile", userProfileId),
        ]),
        Query.orderDesc("createdAt"),
      ]
    );

    // Fetch property details for each booking
    const bookingsWithProperty = await Promise.all(
      res.documents.map(async (booking) => {
        try {
          const propertyDoc = await databases.getDocument(
            process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
            process.env.EXPO_PUBLIC_APPWRITE_PROPERTIES_COLLECTION_ID!,
            booking.propertyId
          );
          return { ...booking, property: propertyDoc };
        } catch {
          return { ...booking, property: null };
        }
      })
    );

    return bookingsWithProperty;
  } catch (error) {
    console.error("Error fetching booking requests:", error);
    throw error;
  }
};

export const getFavoriteProperties = async (userId: string) => {
  const favorites = await databases.listDocuments(
    config.databaseId!,
    config.favoritesCollectionId!,
    [Query.equal("userId", userId)]
  );

  if (favorites.total === 0) return [];

  const propertyIds = favorites.documents.map(f => f.propertyId);

  const properties = await databases.listDocuments(
    config.databaseId!,
    config.propertiesCollectionId!,
    [Query.equal("$id", propertyIds)]
  );

  return properties.documents.map(doc => ({
    ...doc,
    isFavorite: true
  }));
};

export const deleteBookingRequest = async (requestId: string) => {
  try {
    await databases.deleteDocument(
      config.databaseId!,
      config.bookingsId!,
      requestId
    );
    return true;
  } catch (error) {
    console.error("Error deleting booking request:", error);
    throw error;
  }
};

export const respondToBookingRequest = async ({
  requestId,
  newStatus, // 'accepted' or 'declined' (old caller)
}: {
  requestId: string;
  newStatus: "accepted" | "declined";
}) => {
  try {
    // Normalize: we only store 'accepted' | 'rejected'
    const status = newStatus === "declined" ? "rejected" : "accepted";

    const response = await databases.updateDocument(
      process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID!,
      process.env.EXPO_PUBLIC_APPWRITE_BOOKINGS_COLLECTION_ID!,
      requestId,
      {
        status,
        // Whoever is responding (receiver) has seen it by performing the action,
        // and the sender should now see a *new* unread decision.
        seenByReceiver: true,
        seenBySender: false,
      }
    );
    return response;
  } catch (error) {
    console.error("Error updating booking request:", error);
    throw error;
  }
};

export const acceptBookingRequest = async (requestId: string) => {
  try {
    const updated = await databases.updateDocument(
      config.databaseId!,
      config.bookingsId!,
      requestId,
      {
        status: "accepted",
        // Receiver (owner) has seen it after taking action
        seenByReceiver: true,
        // Sender (requester) should now get a fresh unread notification
        seenBySender: false
      }
    );
    return updated;
  } catch (error) {
    console.error("Error accepting booking request:", error);
    throw error;
  }
};

export const rejectBookingRequest = async (requestId: string) => {
  try {
    const updated = await databases.updateDocument(
      config.databaseId!,
      config.bookingsId!,
      requestId,
      {
        status: "rejected",
        // Receiver (owner) has seen it after taking action
        seenByReceiver: true,
        // Sender (requester) should now get a fresh unread notification
        seenBySender: false
      }
    );
    return updated;
  } catch (error) {
    console.error("Error rejecting booking request:", error);
    throw error;
  }
};
