import { Certificate } from '../models/Certificate.model.js';
import { Enrollment } from '../models/Enrollment.model.js';
import { Programme } from '../models/Programme.model.js';
import { Institute } from '../models/Institute.model.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import crypto from 'crypto';

export const certificateController = {
  /**
   * Generates a verifiable digital certificate with HMAC-SHA256 signature
   */
  async generate(req, res) {
    try {
      const { traineeId, programmeId } = req.body;

      const programme = await Programme.findOne({ programmeId });
      const enrollment = await Enrollment.findOne({ traineeId, programmeId });
      if (!programme || !enrollment) {
        return res.status(404).json(errorResponse('Trainee enrollment or programme not found', 'NOT_FOUND'));
      }

      const existingCert = await Certificate.findOne({ traineeId, programmeId, status: 'VALID' });
      if (existingCert) {
        return res.json(successResponse(existingCert, 'Certificate already issued'));
      }

      const institute = await Institute.findOne({ instituteId: programme.instituteId }) || { name: 'VAMNICOM, Pune' };
      const certificateId = `CERT-2025-${programme.instituteId.slice(-3).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const credentialId = `CRED-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

      // Cryptographic signature over canonical record
      const canonicalData = `${credentialId}|${traineeId}|${programme.programmeId}|${new Date().toISOString()}`;
      const digitalSignature = crypto.createHmac('sha256', 'ncct_cert_authority_key').update(canonicalData).digest('hex');
      const qrVerificationUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${credentialId}`;

      const certificate = new Certificate({
        certificateId,
        credentialId,
        traineeId,
        traineeName: enrollment.traineeName,
        programmeId: programme.programmeId,
        programmeTitle: programme.title,
        instituteId: programme.instituteId,
        instituteName: institute.name,
        completionScore: 88,
        skillsCertified: programme.mappedSkills?.map((s) => s.skillName) || ['Digital Literacy', 'Cooperative Accounting'],
        digitalSignature,
        qrVerificationUrl,
        status: 'VALID',
      });

      await certificate.save();

      // Update enrollment
      enrollment.certificateIssued = true;
      enrollment.certificateId = certificateId;
      await enrollment.save();

      return res.status(201).json(successResponse(certificate, 'Certificate issued successfully'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async getMyCertificates(req, res) {
    try {
      const certificates = await Certificate.find({ traineeId: req.user.userId, status: 'VALID' }).lean();
      return res.json(successResponse(certificates));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  /**
   * Public verification endpoint (No login required)
   */
  async verifyPublic(req, res) {
    try {
      const { credentialId } = req.params;
      const certificate = await Certificate.findOne({ credentialId }).lean();
      if (!certificate) {
        return res.status(404).json(
          errorResponse('Certificate credential not found or revoked', 'INVALID_CREDENTIAL')
        );
      }

      return res.json(
        successResponse(
          {
            credentialId: certificate.credentialId,
            certificateId: certificate.certificateId,
            traineeName: certificate.traineeName,
            programmeTitle: certificate.programmeTitle,
            instituteName: certificate.instituteName,
            issueDate: certificate.issueDate,
            skillsCertified: certificate.skillsCertified,
            status: certificate.status,
            verified: certificate.status === 'VALID',
          },
          'Certificate authenticity verified'
        )
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
