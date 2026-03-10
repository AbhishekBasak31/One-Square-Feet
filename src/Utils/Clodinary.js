import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";

dotenv.config();

// --- CLOUDINARY CONFIG ---
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
    try {
        if (!localFilePath) return null;
        if (!fs.existsSync(localFilePath)) return null;

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true
        });
        
        try {
            if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath);
        } catch (unlinkError) {
            console.warn("Failed to delete local file:", unlinkError.message);
        }
        
        return response;
    } catch (error) {
        console.error("Cloudinary Upload Error:", error);
        if (fs.existsSync(localFilePath)) {
            try { fs.unlinkSync(localFilePath); } catch (e) {}
        }
        return null;
    }
};

// --- MULTER CONFIG ---
const uploadDir = path.resolve("public", "uploads");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); 
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

export const upload = multer({ storage: storage });

// import { v2 as cloudinary } from 'cloudinary';
// import fs from "fs";
// import dotenv from "dotenv";

// dotenv.config();

// cloudinary.config({ 
//   cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
//   api_key: process.env.CLOUDINARY_API_KEY, 
//   api_secret: process.env.CLOUDINARY_API_SECRET
// });

// const uploadOnCloudinary = async (localFilePath, resourceType = "auto") => {
//     try {
//         if (!localFilePath) return null;

//         // EXTRA SAFETY: Check if file actually exists before sending to Cloudinary
//         if (!fs.existsSync(localFilePath)) {
//             console.error(`ENOENT PREVENTED: File not found at ${localFilePath}`);
//             return null;
//         }

//         const response = await cloudinary.uploader.upload(localFilePath, {
//             resource_type: resourceType,
//             use_filename: true,
//             unique_filename: true
//         });
        
//         // Use a safe deletion method
//         try {
//             if (fs.existsSync(localFilePath)) {
//                 fs.unlinkSync(localFilePath);
//             }
//         } catch (unlinkError) {
//             console.warn("Failed to delete local file:", unlinkError.message);
//         }
        
//         console.log("File uploaded successfully:", response.secure_url);
//         return response;

//     } catch (error) {
//         console.error("Cloudinary Upload Error:", error);
//         // Ensure cleanup even on failure
//         if (fs.existsSync(localFilePath)) {
//             try { fs.unlinkSync(localFilePath); } catch (e) {}
//         }
//         return null;
//     }
// };

// export default uploadOnCloudinary;