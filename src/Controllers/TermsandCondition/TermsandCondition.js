import { TermsAndConditions } from "../../Models/TermsandCondition/TermsandCondition.js";
import uploadOnCloudinary from "../../Utils/Clodinary.js";

/* ================= GET ================= */
export const getTerms = async (req, res) => {
  try {
    const data = await TermsAndConditions.findOne();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= CREATE ================= */
export const createTerms = async (req, res) => {
  try {
    const existing = await TermsAndConditions.findOne();
    if (existing) {
      return res.status(400).json({ success: false, message: "Terms page already exists. Use Update." });
    }

    const { 
      pageTitle, pageSubtitle, 
      supportTitle, supportDesc, supportButtonText, supportButtonUrl,
      titles, contents 
    } = req.body;

    let sectionsData = [];

    // Process multiple icons from req.files array
    if (req.files && req.files.length > 0) {
      // Ensure titles and contents are arrays
      const titleList = Array.isArray(titles) ? titles : (titles ? [titles] : []);
      const contentList = Array.isArray(contents) ? contents : (contents ? [contents] : []);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const upload = await uploadOnCloudinary(file.path);
        
        if (upload) {
          sectionsData.push({
            icon: upload.secure_url,
            title: titleList[i] || "Section Title",
            content: contentList[i] || "Section Content"
          });
        }
      }
    }

    const newTerms = new TermsAndConditions({
      pageTitle, pageSubtitle, supportTitle, supportDesc, supportButtonText, supportButtonUrl,
      sections: sectionsData
    });

    await newTerms.save();
    return res.status(201).json({ success: true, data: newTerms });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= UPDATE ================= */
export const updateTerms = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      pageTitle, pageSubtitle, supportTitle, 
      supportDesc, supportButtonText, supportButtonUrl, 
      titles, contents 
    } = req.body;

    const terms = await TermsAndConditions.findById(id);
    if (!terms) return res.status(404).json({ success: false, message: "Document not found" });

    // 1. Update text fields only if they are provided
    if (pageTitle) terms.pageTitle = pageTitle;
    if (pageSubtitle) terms.pageSubtitle = pageSubtitle;
    if (supportTitle) terms.supportTitle = supportTitle;
    if (supportDesc) terms.supportDesc = supportDesc;
    if (supportButtonText) terms.supportButtonText = supportButtonText;
    if (supportButtonUrl) terms.supportButtonUrl = supportButtonUrl;

    // 2. Append new sections if uploaded
    if (req.files && req.files.length > 0) {
      const titleList = Array.isArray(titles) ? titles : (titles ? [titles] : []);
      const contentList = Array.isArray(contents) ? contents : (contents ? [contents] : []);
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const upload = await uploadOnCloudinary(file.path);
        
        if (upload) {
          terms.sections.push({
            icon: upload.secure_url,
            title: titleList[i] || "New Section",
            content: contentList[i] || "New Content"
          });
        }
      }
    }

    await terms.save();
    return res.status(200).json({ success: true, message: "Update successful", data: terms });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE ================= */
export const deleteTerms = async (req, res) => {
  try {
    const { id } = req.params;
    await TermsAndConditions.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/* ================= DELETE SINGLE SECTION ================= */
export const deleteSection = async (req, res) => {
  try {
    const { id, sectionId } = req.params;
    
    const terms = await TermsAndConditions.findById(id);
    if (!terms) {
      return res.status(404).json({ success: false, message: "Document not found" });
    }

    // Remove the specific section from the array
    terms.sections = terms.sections.filter(sec => sec._id.toString() !== sectionId);
    
    await terms.save();
    return res.status(200).json({ success: true, message: "Section Removed", data: terms });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};