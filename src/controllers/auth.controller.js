import { User, USER_ROLES } from '../models/User.model.js';
import { Institute } from '../models/Institute.model.js';
import { tokenService } from '../services/token.service.js';
import { successResponse, errorResponse } from '../utils/response.util.js';
import { cacheUtil } from '../utils/cache.util.js';

export const APP_ROLE_MAP = {
  LEARNER: ['TRAINEE'],
  INSTITUTE_PARTNER: [
    'INSTITUTE_DIRECTOR',
    'INSTITUTE_ERP_ADMIN',
    'INSTITUTE_ADMIN',
    'PROGRAMME_COORDINATOR',
    'FACULTY_TRAINER',
    'TRAINER_FACULTY',
    'ASSESSMENT_OFFICER',
    'LMS_CONTENT_ADMIN',
    'CONTENT_LMS_ADMIN',
    'PLACEMENT_CAREER_OFFICER',
    'PLACEMENT_OFFICER',
    'INSTITUTE_IT_EDGE_OPERATOR',
    'IT_EDGE_OPERATOR',
    'RESOURCE_PERSON',
    'NOMINATING_ORGANIZATION_COORDINATOR',
    'PARTNER_COORDINATOR',
    'FINANCE_OPERATIONS',
    'EMPLOYER_RECRUITER'
  ],
  NCCT_HQ: [
    'SUPER_ADMIN',
    'NCCT_HQ_ADMIN',
    'NCCT_HQ_TRAINING_ADMIN',
    'NCCT_HQ_TNA_OFFICER',
    'NCCT_HQ_FINANCE_OFFICER',
    'NCCT_HQ_IT_ADMIN',
    'COMMITTEE_APPROVER'
  ],
  PUBLIC_VERIFY: ['*']
};

export const authController = {
  async register(req, res) {
    try {
      console.log(`[API HIT] POST /api/v1/auth/register | Body:`, { ...req.body, password: '[REDACTED]' });
      const {
        name,
        firstName,
        lastName,
        email,
        phone,
        mobileNumber,
        password,
        gender = 'Male',
        dob,
        dateOfBirth,
        state = '',
        city = '',
        district = '',
        role,
        userRole,
        user_role,
        user_type,
        instituteId,
        app,
        application,
        termsAccepted,
        // Role-specific fields from JSON spec
        designation,
        officialEmail,
        programmeArea,
        subjectsOrExpertise,
        experience,
        assessmentResponsibilities,
        contentDomains,
        careerResponsibilities,
        technicalResponsibilities,
        affiliatedOrganization,
        organizationName,
        organizationType,
        registrationDetails,
        organizationAddress,
        companyWebsite,
        industrySector,
        partnerDetails: incomingPartnerDetails,
        // Trainee specific fields
        participantCategory,
        cooperativeAffiliation,
        qualification,
        preferredLanguage,
        specialization,
        yearsExperience,
        employeeCode,
        companyName,
        website,
        // Institute registration fields
        newInstituteName,
        newInstituteCode,
        newInstituteType,
        newInstituteState,
        newInstituteDistrict,
        customInstituteName,
        otherInstituteName,
      } = req.body;

      const finalPhone = (phone || mobileNumber || '').trim();
      const finalRole = userRole || user_role || user_type || role || 'TRAINEE';
      const finalName = (name || `${firstName || ''} ${lastName || ''}`).trim();
      const fName = firstName || (finalName ? finalName.split(' ')[0] : '');
      const lName = lastName || (finalName ? finalName.split(' ').slice(1).join(' ') : '');

      console.log(`[AUTH API FLOW] =======================================`);
      console.log(`[AUTH API FLOW] Calling: POST /api/v1/auth/register`);
      console.log(`[AUTH API FLOW] Name: ${finalName} (${fName} ${lName}) | Email: ${email} | Phone: ${finalPhone}`);
      console.log(`[AUTH API FLOW] Role: ${finalRole} | Gender: ${gender} | DOB: ${dob || dateOfBirth} | Location: ${city}, ${state}`);

      if (!finalName || !email || !password) {
        console.warn(`[AUTH API FLOW] Rejected: Missing required fields`);
        return res.status(400).json(errorResponse('Name, email, and password are required', 'VALIDATION_ERROR'));
      }

      const existing = await User.findOne({ email: email.toLowerCase() });
      if (existing) {
        console.warn(`[AUTH API FLOW] Rejected: Email ${email} already registered`);
        return res.status(400).json(errorResponse('Email already registered', 'EMAIL_EXISTS'));
      }

      const assignedRole = USER_ROLES.includes(finalRole) ? finalRole : 'TRAINEE';
      const userId = `USR-${Date.now().toString().slice(-6)}`;
      let finalInstituteId = (instituteId === 'OTHER' && (customInstituteName || otherInstituteName || newInstituteName))
        ? (customInstituteName || otherInstituteName || newInstituteName).trim()
        : (instituteId || 'VAMNICOM');
      let userStatus = 'ACTIVE';

      // Determine default application assignment
      let targetApp = (application || app || '').toUpperCase();
      if (!targetApp) {
        if (assignedRole === 'TRAINEE') targetApp = 'LEARNER';
        else if (APP_ROLE_MAP.NCCT_HQ.includes(assignedRole)) targetApp = 'NCCT_HQ';
        else targetApp = 'INSTITUTE_PARTNER';
      }

      // Check verification method based on role
      let verificationMethod = 'NCCT_OR_INSTITUTE_ADMIN_APPROVAL';
      if (assignedRole === 'NOMINATING_ORGANIZATION_COORDINATOR' || assignedRole === 'EMPLOYER_RECRUITER') {
        verificationMethod = 'ORGANIZATION_VERIFICATION';
      } else if (assignedRole === 'RESOURCE_PERSON') {
        verificationMethod = 'PROFILE_AND_CREDENTIAL_VERIFICATION';
      }

      // Helper to format string or array fields
      const toArray = (val) => {
        if (!val) return [];
        if (Array.isArray(val)) return val;
        return String(val).split(',').map((s) => s.trim()).filter(Boolean);
      };

      // 1. Institute Admin Self-Registration Workflow
      if (assignedRole === 'INSTITUTE_ADMIN' && newInstituteName) {
        const instCode = newInstituteCode || `INST-${Date.now().toString().slice(-4)}`;
        const institute = await Institute.create({
          instituteId: `INST-${Date.now().toString().slice(-6)}`,
          name: newInstituteName,
          code: instCode,
          type: newInstituteType || 'ICM',
          state: newInstituteState || state || 'National',
          district: newInstituteDistrict || city || 'Central',
          contactEmail: email.toLowerCase(),
          contactPhone: finalPhone,
          directorName: finalName,
          status: 'PENDING_APPROVAL'
        });
        finalInstituteId = institute.instituteId;
        userStatus = 'PENDING_APPROVAL';
      } else if (targetApp === 'INSTITUTE_PARTNER') {
        userStatus = 'PENDING_APPROVAL';
      }

      // 2. Build Structured Partner Details
      const partnerData = {
        application: targetApp,
        userRole: assignedRole,
        organizationType: (assignedRole === 'NOMINATING_ORGANIZATION_COORDINATOR') ? 'NOMINATING_ORGANIZATION'
          : (assignedRole === 'EMPLOYER_RECRUITER') ? 'EMPLOYER'
          : (assignedRole === 'RESOURCE_PERSON') ? 'RESOURCE_PERSON' : 'NCCT_INSTITUTE',
        designation: designation || incomingPartnerDetails?.designation || '',
        officialEmail: officialEmail || incomingPartnerDetails?.officialEmail || '',
        programmeArea: programmeArea || incomingPartnerDetails?.programmeArea || '',
        subjectsOrExpertise: toArray(subjectsOrExpertise || incomingPartnerDetails?.subjectsOrExpertise || specialization),
        experience: Number(experience || incomingPartnerDetails?.experience || yearsExperience) || 0,
        assessmentResponsibilities: toArray(assessmentResponsibilities || incomingPartnerDetails?.assessmentResponsibilities),
        contentDomains: toArray(contentDomains || incomingPartnerDetails?.contentDomains),
        careerResponsibilities: toArray(careerResponsibilities || incomingPartnerDetails?.careerResponsibilities),
        technicalResponsibilities: toArray(technicalResponsibilities || incomingPartnerDetails?.technicalResponsibilities),
        affiliatedOrganization: affiliatedOrganization || incomingPartnerDetails?.affiliatedOrganization || '',
        organizationName: organizationName || companyName || incomingPartnerDetails?.organizationName || '',
        registrationDetails: registrationDetails || incomingPartnerDetails?.registrationDetails || '',
        industrySector: industrySector || incomingPartnerDetails?.industrySector || '',
        companyWebsite: companyWebsite || website || incomingPartnerDetails?.companyWebsite || '',
        organizationAddress: organizationAddress || incomingPartnerDetails?.organizationAddress || '',
        district: district || newInstituteDistrict || incomingPartnerDetails?.district || '',
        activationStatus: 'PENDING_APPROVAL',
        verificationMethod,
      };

      // 3. Build User Record with Structured Role Extensions & roleAssignments
      const user = new User({
        userId,
        name: finalName,
        firstName: fName,
        lastName: lName,
        email: email.toLowerCase(),
        phone: finalPhone,
        gender: gender || 'Male',
        dob: dob || dateOfBirth || '',
        password,
        role: assignedRole,
        roleAssignments: [
          {
            application: targetApp,
            role: assignedRole,
            organizationId: 'NCCT',
            instituteIds: [finalInstituteId],
            status: userStatus === 'PENDING_APPROVAL' ? 'PENDING_APPROVAL' : 'ACTIVE',
          }
        ],
        instituteId: finalInstituteId,
        status: userStatus,
        profile: {
          designation: designation || '',
          qualification: qualification || '',
          preferredLanguage: preferredLanguage || 'English',
          state: state || newInstituteState || '',
          city: city || newInstituteDistrict || '',
          district: district || newInstituteDistrict || '',
          address: organizationAddress || '',
        },
        partnerDetails: targetApp === 'INSTITUTE_PARTNER' ? partnerData : undefined,
        traineeDetails: assignedRole === 'TRAINEE' ? {
          registrationNumber: `TRN-${Date.now().toString().slice(-6)}`,
          participantCategory: participantCategory || 'Student / Graduate',
          cooperativeAffiliation: cooperativeAffiliation || 'Primary Agricultural Credit Society (PACS)',
          overallProgress: 0,
          attendancePercentage: 100,
        } : undefined,
        trainerDetails: (assignedRole === 'TRAINER_FACULTY' || assignedRole === 'FACULTY_TRAINER' || assignedRole === 'RESOURCE_PERSON') ? {
          specialization: toArray(subjectsOrExpertise || specialization || 'Cooperative Management'),
          yearsExperience: Number(experience || yearsExperience) || 5,
        } : undefined,
        employerDetails: assignedRole === 'EMPLOYER_RECRUITER' ? {
          companyName: organizationName || companyName || 'Cooperative Enterprise Partner',
          industry: industrySector || 'Banking & Finance',
          website: companyWebsite || website || '',
          isVerified: false,
        } : undefined,
      });

      await user.save();

      const { accessToken, refreshToken } = tokenService.generateTokens({
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        instituteId: user.instituteId,
        tokenVersion: user.tokenVersion,
      });

      console.log(`[AUTH API FLOW] User registered successfully: ${user.email} with role ${user.role} (status: ${user.status})`);

      return res.status(201).json(
        successResponse(
          {
            user: {
              userId: user.userId,
              name: user.name,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              gender: user.gender,
              dob: user.dob,
              role: user.role,
              roleAssignments: user.roleAssignments,
              instituteId: user.instituteId,
              status: user.status,
              profile: user.profile,
              partnerDetails: user.partnerDetails,
              traineeDetails: user.traineeDetails,
              trainerDetails: user.trainerDetails,
              employerDetails: user.employerDetails,
            },
            accessToken,
            refreshToken,
          },
          user.status === 'PENDING_APPROVAL'
            ? 'Partner registration submitted successfully! Awaiting verification and approval.'
            : 'Registration successful'
        )
      );
    } catch (err) {
      console.error(`[AUTH API FLOW] Registration Error:`, err);
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async login(req, res) {
    try {
      const {
        email,
        phone,
        identifier,
        password,
        app,
        application,
        user_role,
        user_type,
        role,
        userRole,
        userType
      } = req.body;

      const rawRoleOrType = user_role || user_type || role || userRole || userType || '';
      const rawApp = app || application || '';

      console.log(`[API HIT] POST /api/v1/auth/login | Identifier: ${email || phone || identifier} | user_role: ${rawRoleOrType} | app: ${rawApp}`);

      const loginId = (email || phone || identifier || '').trim();

      if (!loginId || !password) {
        return res.status(400).json(errorResponse('Email/Phone and password are required', 'VALIDATION_ERROR'));
      }

      const user = await User.findOne({
        $or: [
          { email: loginId.toLowerCase() },
          { phone: loginId },
          { userId: loginId }
        ]
      });

      if (!user) {
        return res.status(401).json(errorResponse('Invalid email/phone or password', 'INVALID_CREDENTIALS'));
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json(errorResponse('Invalid email/phone or password', 'INVALID_CREDENTIALS'));
      }

      if (user.status === 'BLOCKED') {
        return res.status(403).json(errorResponse('Account is suspended', 'ACCOUNT_BLOCKED'));
      }

      // Determine requested application and requested role
      let requestedApp = rawApp.toUpperCase().trim();
      let requestedRole = rawRoleOrType.toUpperCase().trim();

      // If user_role or user_type is supplied, deduce application if not explicitly given
      if (requestedRole) {
        if (['TRAINEE', 'LEARNER', 'STUDENT'].includes(requestedRole)) {
          if (!requestedApp) requestedApp = 'LEARNER';
          requestedRole = 'TRAINEE';
        } else if (APP_ROLE_MAP.INSTITUTE_PARTNER.includes(requestedRole) || requestedRole === 'INSTITUTE_PARTNER') {
          if (!requestedApp) requestedApp = 'INSTITUTE_PARTNER';
        } else if (APP_ROLE_MAP.NCCT_HQ.includes(requestedRole) || requestedRole === 'NCCT_HQ') {
          if (!requestedApp) requestedApp = 'NCCT_HQ';
        }
      }

      // If app was passed as LEARNER, but no role, default role to TRAINEE
      if (requestedApp === 'LEARNER' && !requestedRole) {
        requestedRole = 'TRAINEE';
      }

      // Collect all authorized roles for this user
      const userRoles = [
        user.role,
        ...(user.roleAssignments || []).map((ra) => ra.role)
      ].filter(Boolean);

      // 1. Check Application Authorization (LEARNER, INSTITUTE_PARTNER, NCCT_HQ)
      if (requestedApp && requestedApp !== 'PUBLIC_VERIFY') {
        const allowedRolesForApp = APP_ROLE_MAP[requestedApp] || [];
        const hasAppAccess = userRoles.some((r) => allowedRolesForApp.includes(r)) ||
          (user.roleAssignments || []).some((ra) => ra.application === requestedApp && ra.status === 'ACTIVE');

        if (!hasAppAccess) {
          console.warn(`[SECURITY AUDIT / 403] Denied application access for user ${user.email} (Role: ${user.role}) to requested application: ${requestedApp}`);
          return res.status(403).json({
            success: false,
            code: 'APP_ACCESS_DENIED',
            message: 'This account is not authorized for the requested PRAGYAAN application.'
          });
        }
      }

      // 2. If a specific user_role / user_type was requested, verify user has that role
      if (requestedRole && requestedRole !== 'TRAINEE' && requestedRole !== 'LEARNER') {
        const hasRole = userRoles.includes(requestedRole);
        if (!hasRole) {
          // If the user belongs to the requested application or is a registered partner, auto-adapt to their registered role
          const isPartner = userRoles.some((r) => APP_ROLE_MAP.INSTITUTE_PARTNER.includes(r));
          if (isPartner && (requestedApp === 'INSTITUTE_PARTNER' || !requestedApp)) {
            console.log(`[AUTH] User ${user.email} is registered as ${user.role}, auto-adapting role for partner portal.`);
            requestedRole = user.role;
          } else {
            console.warn(`[SECURITY AUDIT / 403] Denied role access for user ${user.email} to requested role: ${requestedRole}`);
            return res.status(403).json({
              success: false,
              code: 'APP_ACCESS_DENIED',
              message: `This account does not have the requested role '${requestedRole}'.`
            });
          }
        }
      }

      const activeSessionRole = requestedRole || user.role;
      const activeSessionApp = requestedApp || (activeSessionRole === 'TRAINEE' ? 'LEARNER' : 'INSTITUTE_PARTNER');

      const { accessToken, refreshToken } = tokenService.generateTokens({
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: activeSessionRole,
        instituteId: user.instituteId,
        tokenVersion: user.tokenVersion,
      });

      // Cache user auth details
      await cacheUtil.set(`user:auth:${user.userId}`, user.toObject(), 300);

      return res.json(
        successResponse(
          {
            user: {
              userId: user.userId,
              name: user.name,
              firstName: user.firstName,
              lastName: user.lastName,
              email: user.email,
              phone: user.phone,
              role: activeSessionRole,
              roleAssignments: user.roleAssignments,
              instituteId: user.instituteId,
              avatarUrl: user.avatarUrl,
              status: user.status,
              profile: user.profile,
              partnerDetails: user.partnerDetails,
              traineeDetails: user.traineeDetails,
              trainerDetails: user.trainerDetails,
              employerDetails: user.employerDetails,
            },
            application: activeSessionApp,
            user_role: activeSessionRole,
            user_type: activeSessionRole,
            accessToken,
            refreshToken,
          },
          'Login successful'
        )
      );

    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async me(req, res) {
    try {
      const user = await User.findOne({ userId: req.user.userId }).select('-password').lean();
      if (!user) {
        return res.status(404).json(errorResponse('User not found', 'NOT_FOUND'));
      }
      return res.json(successResponse(user, 'User profile retrieved'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async refreshToken(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json(errorResponse('Refresh token required', 'TOKEN_REQUIRED'));
      }

      const decoded = tokenService.verifyRefreshToken(refreshToken);
      const user = await User.findOne({ userId: decoded.userId });

      if (!user || user.status === 'BLOCKED') {
        return res.status(401).json(errorResponse('User not found or suspended', 'UNAUTHORIZED'));
      }

      const tokens = tokenService.generateTokens({
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
        instituteId: user.instituteId,
        tokenVersion: user.tokenVersion,
      });

      return res.json(successResponse(tokens, 'Tokens refreshed successfully'));
    } catch (err) {
      return res.status(401).json(errorResponse('Invalid refresh token', 'INVALID_REFRESH_TOKEN'));
    }
  },

  /**
   * Switch role simulator: Allows testing all 14 roles seamlessly
   */
  async switchRole(req, res) {
    try {
      const { targetRole } = req.body;
      if (!USER_ROLES.includes(targetRole)) {
        return res.status(400).json(errorResponse(`Invalid role. Must be one of ${USER_ROLES.join(', ')}`));
      }

      // Find sample user with this target role or assign to current user
      let roleUser = await User.findOne({ role: targetRole }).lean();
      if (!roleUser) {
        roleUser = await User.findOne({ userId: req.user.userId }).lean();
      }

      const tokens = tokenService.generateTokens({
        userId: roleUser.userId,
        email: roleUser.email,
        name: roleUser.name,
        role: targetRole,
        instituteId: roleUser.instituteId,
        tokenVersion: roleUser.tokenVersion,
      });

      return res.json(
        successResponse(
          {
            user: {
              userId: roleUser.userId,
              name: roleUser.name,
              email: roleUser.email,
              role: targetRole,
              instituteId: roleUser.instituteId,
              avatarUrl: roleUser.avatarUrl,
              traineeDetails: roleUser.traineeDetails,
            },
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          },
          `Active role switched to ${targetRole}`
        )
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  /**
   * Super Admin Institute Approval Workflow
   */
  async getPendingInstitutes(req, res) {
    try {
      console.log(`[API HIT] GET /api/v1/auth/pending-institutes`);
      const pending = await Institute.find({ status: 'PENDING_APPROVAL' });
      return res.json(successResponse(pending, 'Pending institutes fetched'));
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },

  async approveInstitute(req, res) {
    try {
      const { instituteId } = req.params;
      console.log(`[API HIT] PUT /api/v1/auth/approve-institute/${instituteId}`);
      const institute = await Institute.findOneAndUpdate(
        { instituteId },
        { status: 'ACTIVE' },
        { new: true }
      );

      if (!institute) {
        return res.status(404).json(errorResponse('Institute not found'));
      }

      // Activate all users under this institute
      await User.updateMany({ instituteId, status: 'PENDING' }, { status: 'ACTIVE' });

      return res.json(
        successResponse(
          institute,
          `Institute ${institute.name} verified and approved by NCCT Super Admin! Facilities unlocked.`
        )
      );
    } catch (err) {
      return res.status(500).json(errorResponse(err.message));
    }
  },
};
