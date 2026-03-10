import  {GallerySec } from "../../Models/HomePage/GallerySec.js"
import uploadOnCloudinary from "../../Utils/Clodinary.js"; 

/* ================= GET ================= */
export const getGallerySec = async (req, res) => {
  try {
    const data = await GallerySec.findOne();
    return res.status(200).json({ success: true, data: data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createGallerySec = async (req, res) => {
  try {
    const existing = await GallerySec.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Gallery Section exists. Use Update." });
    }

    const { tag, Htext, SDesc } = req.body;
    let galleryList = [];

    // 1. Parse the JSON string of videos sent by frontend
    if (req.body.galleryvideo) {
        try {
            galleryList = JSON.parse(req.body.galleryvideo);
        } catch (e) {
            return res.status(400).json({ message: "Invalid gallery data format" });
        }
    }

    // 2. Handle File Uploads (video_0, video_1, etc.)
    if (req.files) {
        // Iterate through the array we parsed to see if a file matches its index
        for (let i = 0; i < galleryList.length; i++) {
            const fieldName = `video_${i}`;
            
            // Check if a file was uploaded for this specific index
            if (req.files[fieldName] && req.files[fieldName][0]) {
                const file = req.files[fieldName][0];
                const upload = await uploadOnCloudinary(file.path);
                
                // If upload success, update the URL in the list
                if (upload) {
                    galleryList[i].Videourl = upload.secure_url;
                }
            }
        }
    }

    const newSection = new GallerySec({
      tag,
      Htext,
      SDesc,
      galleryvideo: galleryList
    });

    await newSection.save();
    return res.status(201).json({ success: true, message: "Gallery Created", data: newSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateGallerySec = async (req, res) => {
  try {
    const { tag, Htext, SDesc } = req.body;
    let galleryList = [];

    // 1. Parse existing/new structure from text data
    if (req.body.galleryvideo) {
        try {
            galleryList = JSON.parse(req.body.galleryvideo);
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
    }

    // 2. Handle File Uploads (video_0, video_1, etc.)
    if (req.files) {
        // Iterate through the array to check for corresponding file updates
        for (let i = 0; i < galleryList.length; i++) {
            const fieldName = `video_${i}`;
            
            // Check if a new file exists for this index
            if (req.files[fieldName] && req.files[fieldName][0]) {
                const file = req.files[fieldName][0];
                const upload = await uploadOnCloudinary(file.path);
                
                // Update URL if upload successful
                if (upload) {
                    galleryList[i].Videourl = upload.secure_url;
                }
            }
        }
    }

    // 3. Update Singleton Document
    const updatedSection = await GallerySec.findOneAndUpdate(
      {},
      { 
        $set: { 
            tag, 
            Htext, 
            SDesc, 
            galleryvideo: galleryList 
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, message: "Gallery Updated", data: updatedSection });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteGallerySec = async (req, res) => {
  try {
    await GallerySec.findOneAndDelete({});
    return res.status(200).json({ success: true, message: "Gallery Deleted Successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};