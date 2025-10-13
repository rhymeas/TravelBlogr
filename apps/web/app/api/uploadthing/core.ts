import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { createServerSupabase } from "@/lib/supabase-server";

const f = createUploadthing();

const auth = async () => {
  const supabase = createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new UploadThingError("Unauthorized");
  }
  
  return { userId: user.id };
};

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  tripCoverImage: f({ image: { maxFileSize: "4MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);

      // Save to Supabase
      const supabase = createServerSupabase();
      await supabase
        .from('media')
        .insert({
          user_id: metadata.userId,
          file_url: file.url,
          file_name: file.name,
          file_size: file.size,
          file_type: 'image',
          upload_provider: 'uploadthing'
        });

      // Return data to the clientside onClientUploadComplete callback
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  tripPostImages: f({ 
    image: { maxFileSize: "8MB", maxFileCount: 10 } 
  })
    .middleware(async ({ req }) => {
      const user = await auth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Post images upload complete for userId:", metadata.userId);
      
      const supabase = createServerSupabase();
      await supabase
        .from('media')
        .insert({
          user_id: metadata.userId,
          file_url: file.url,
          file_name: file.name,
          file_size: file.size,
          file_type: 'image',
          upload_provider: 'uploadthing'
        });

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  tripDocuments: f({ 
    pdf: { maxFileSize: "16MB", maxFileCount: 5 },
    text: { maxFileSize: "1MB", maxFileCount: 10 }
  })
    .middleware(async ({ req }) => {
      const user = await auth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Documents upload complete for userId:", metadata.userId);
      
      const supabase = createServerSupabase();
      await supabase
        .from('media')
        .insert({
          user_id: metadata.userId,
          file_url: file.url,
          file_name: file.name,
          file_size: file.size,
          file_type: 'document',
          upload_provider: 'uploadthing'
        });

      return { uploadedBy: metadata.userId, url: file.url };
    }),

  profileAvatar: f({ image: { maxFileSize: "2MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      const user = await auth();
      return { userId: user.userId };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Avatar upload complete for userId:", metadata.userId);
      
      // Update user profile with new avatar
      const supabase = createServerSupabase();
      await supabase
        .from('users')
        .update({ avatar_url: file.url })
        .eq('id', metadata.userId);

      await supabase
        .from('media')
        .insert({
          user_id: metadata.userId,
          file_url: file.url,
          file_name: file.name,
          file_size: file.size,
          file_type: 'avatar',
          upload_provider: 'uploadthing'
        });

      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
