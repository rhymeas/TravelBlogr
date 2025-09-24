import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

// Supabase client for file storage
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseClient = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export class SupabaseStorageService {
  private bucketName = 'images';

  constructor() {
    if (!supabaseClient) {
      console.warn('Supabase not configured - file uploads disabled');
    }
  }

  // Check if storage is available
  isAvailable(): boolean {
    return supabaseClient !== null;
  }

  // Upload file and return public URL
  async uploadFile(
    file: Buffer, 
    fileName: string, 
    mimeType: string,
    folder: string = 'uploads'
  ): Promise<{ publicUrl: string; filePath: string }> {
    if (!supabaseClient) {
      throw new Error('Supabase storage not configured');
    }

    const fileId = randomUUID();
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const filePath = `${folder}/${fileId}.${fileExtension}`;

    // Upload file to Supabase Storage
    const { data, error } = await supabaseClient.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseClient.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return {
      publicUrl,
      filePath: data.path
    };
  }

  // Delete file
  async deleteFile(filePath: string): Promise<void> {
    if (!supabaseClient) {
      throw new Error('Supabase storage not configured');
    }

    const { error } = await supabaseClient.storage
      .from(this.bucketName)
      .remove([filePath]);

    if (error) {
      console.error('Supabase delete error:', error);
      throw new Error(`Delete failed: ${error.message}`);
    }
  }

  // Get signed URL for private files (if needed)
  async getSignedUrl(filePath: string, expiresIn: number = 3600): Promise<string> {
    if (!supabaseClient) {
      throw new Error('Supabase storage not configured');
    }

    const { data, error } = await supabaseClient.storage
      .from(this.bucketName)
      .createSignedUrl(filePath, expiresIn);

    if (error) {
      console.error('Supabase signed URL error:', error);
      throw new Error(`Signed URL failed: ${error.message}`);
    }

    return data.signedUrl;
  }

  // List files in a folder
  async listFiles(folder: string = 'uploads'): Promise<any[]> {
    if (!supabaseClient) {
      throw new Error('Supabase storage not configured');
    }

    const { data, error } = await supabaseClient.storage
      .from(this.bucketName)
      .list(folder);

    if (error) {
      console.error('Supabase list error:', error);
      throw new Error(`List failed: ${error.message}`);
    }

    return data || [];
  }
}

// Export singleton instance
export const supabaseStorage = new SupabaseStorageService();
