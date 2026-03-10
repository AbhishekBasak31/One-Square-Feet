import multer from "multer";
import path from "path";
import fs from "fs";

// This creates an absolute path to your folder
const uploadDir = path.resolve("public", "uploads");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Double check: if Render wiped the folder during a deploy, create it again
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        // Add extension (like .jpg) so Cloudinary identifies it correctly
        const ext = path.extname(file.originalname); 
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

export const upload = multer({ storage: storage });