import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);
const BUCKET_NAME = process.env.BUCKET_NAME;

const uploadOnSupabase = async (localFilePath, mimeType, originalName) => {
    try {
        if (!localFilePath) return null;

        // Read the file buffer
        const fileContent = fs.readFileSync(localFilePath);
        
        // Create a unique filename: timestamp-originalName.pdf
        // Sanitize name to remove spaces/special chars
        const sanitizedName = originalName.replace(/[^a-zA-Z0-9.]/g, "_");
        const fileName = `${Date.now()}_${sanitizedName}`;

        // Upload to 'resumes' bucket
        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME) // Must match your bucket name
            .upload(fileName, fileContent, {
                contentType: mimeType, // Ensures browser opens it as PDF
                upsert: false
            });

        if (error) {
            console.error("Supabase Upload Error Details:", error);
            throw error;
        }

        // Get the Public URL
        const { data: publicUrlData } = supabase
            .storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        // Cleanup local file
        fs.unlinkSync(localFilePath);

        return publicUrlData.publicUrl;

    } catch (error) {
        console.log("Supabase Upload Failed:", error.message);
        // Cleanup local file if it exists
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return null;
    }
};
export const deleteFromSupabase = async (fullUrl) => {
    try {
        if (!fullUrl) return;

        // The URL looks like: https://xyz.supabase.co/.../public/resumes/12345_cv.pdf
        // We need to extract just: "12345_cv.pdf"
        
        // Split by the bucket name to get the relative path
        const fileParts = fullUrl.split(`/${BUCKET_NAME}/`);
        
        if (fileParts.length < 2) {
            console.log("Invalid URL format, could not extract file path");
            return;
        }

        const filePath = fileParts[1]; // This gives us "12345_cv.pdf"

        const { data, error } = await supabase
            .storage
            .from(BUCKET_NAME)
            .remove([filePath]); // Supabase expects an array of paths

        if (error) {
            console.error("Supabase Deletion Error:", error);
            return false;
        }

        console.log("File deleted from Supabase:", filePath);
        return true;

    } catch (error) {
        console.error("Error in deleteFromSupabase:", error);
        return false;
    }
};
export default uploadOnSupabase;
