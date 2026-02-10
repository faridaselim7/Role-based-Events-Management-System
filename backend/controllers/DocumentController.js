import Document from '../models/Document.js';
import fs from 'fs';
import path from 'path';

// Req #76 - Events Office/Admin views/downloads uploaded documents
export const uploadDocument = async (req, res) => {
  try {
    const { documentType, vendorId, bazaarApplicationId, attendeeId } = req.body;
    const userId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = new Document({
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      documentType,
      vendorId: vendorId || null,
      bazaarApplicationId: bazaarApplicationId || null,
      attendeeId: attendeeId || null,
      uploadedBy: userId,
      status: 'pending'
    });

    await document.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document
    });
  } catch (error) {
    console.error('Error uploading document:', error);
    res.status(500).json({ message: 'Failed to upload document', error: error.message });
  }
};

// Get all documents (with filters for EO/Admin)
export const getAllDocuments = async (req, res) => {
  try {
    const { documentType, vendorId, status, bazaarApplicationId } = req.query;
    const filters = {};

    if (documentType) filters.documentType = documentType;
    if (vendorId) filters.vendorId = vendorId;
    if (status) filters.status = status;
    if (bazaarApplicationId) filters.bazaarApplicationId = bazaarApplicationId;

    const documents = await Document.find(filters)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email')
      .sort({ uploadedAt: -1 });

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Failed to fetch documents', error: error.message });
  }
};

// Get document by ID
export const getDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId)
      .populate('uploadedBy', 'firstName lastName email')
      .populate('verifiedBy', 'firstName lastName email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.status(200).json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ message: 'Failed to fetch document', error: error.message });
  }
};

// Download document file
export const downloadDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      return res.status(404).json({ message: 'File not found on server' });
    }

    // Send file for download
    res.download(document.filePath, document.fileName);
  } catch (error) {
    console.error('Error downloading document:', error);
    res.status(500).json({ message: 'Failed to download document', error: error.message });
  }
};

// Verify document (mark as verified by EO/Admin)
export const verifyDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = 'verified';
    document.verifiedBy = userId;
    document.verifiedAt = new Date();

    await document.save();

    res.status(200).json({
      message: 'Document verified successfully',
      document
    });
  } catch (error) {
    console.error('Error verifying document:', error);
    res.status(500).json({ message: 'Failed to verify document', error: error.message });
  }
};

// Reject document (with reason)
export const rejectDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { rejectionReason } = req.body;
    const userId = req.user.id;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    document.status = 'rejected';
    document.verifiedBy = userId;
    document.verifiedAt = new Date();
    document.rejectionReason = rejectionReason;

    await document.save();

    res.status(200).json({
      message: 'Document rejected',
      document
    });
  } catch (error) {
    console.error('Error rejecting document:', error);
    res.status(500).json({ message: 'Failed to reject document', error: error.message });
  }
};

// In DocumentController.js
export const viewDocument = async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findById(documentId);

    if (!document) return res.status(404).json({ message: 'Document not found' });
    if (!fs.existsSync(document.filePath)) return res.status(404).json({ message: 'File not found' });

    // This forces browser to display inline
    res.setHeader('Content-Type', document.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.fileName)}"`);

    // Extra headers for better PDF/image experience
    res.setHeader('Cache-Control', 'no-cache');
    if (document.mimeType === 'application/pdf') {
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; sandbox");
    }

    fs.createReadStream(document.filePath).pipe(res);
  } catch (error) {
    console.error('View error:', error);
    res.status(500).json({ message: 'Failed to view document' });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findById(documentId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Delete file from storage
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete document record
    await Document.findByIdAndDelete(documentId);

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ message: 'Failed to delete document', error: error.message });
  }
};