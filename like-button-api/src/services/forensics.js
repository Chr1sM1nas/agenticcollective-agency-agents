'use strict';

/**
 * Legal Evidence / Forensic Report Generator.
 *
 * Produces court-admissible documentation packages that include:
 *  - A chain-of-custody summary
 *  - All votes for a widget with their cryptographic signatures
 *  - Audit log entries for the widget
 *  - Audit chain integrity verification result
 *  - Evidence integrity certificate with HMAC seal
 */

const { v4: uuidv4 } = require('uuid');
const cryptoSvc = require('./crypto');
const auditLog = require('./auditLog');
const db = require('../database/db');
const config = require('../config/security');

/**
 * Generate a full forensic evidence package for a widget.
 *
 * @param {string} widgetId
 * @param {string} requestedBy – identity of the requesting party (for custody chain)
 * @returns {object} Evidence package
 */
function generateEvidencePackage(widgetId, requestedBy) {
  const widget = db.getWidget(widgetId);
  if (!widget) {
    throw new Error(`Widget '${widgetId}' not found`);
  }

  const reportId = uuidv4();
  const generatedAt = new Date().toISOString();

  // Collect all votes
  const votes = db.getAllVotes(widgetId);
  const voteIntegrity = votes.map(vote => {
    const intact = cryptoSvc.verifyVote({
      id: vote.id,
      widgetId: vote.widget_id,
      deviceFingerprint: vote.device_fingerprint,
      ipAddress: vote.ip_address,
      timestamp: vote.timestamp,
      signature: vote.signature,
    });
    return {
      id: vote.id,
      timestamp: vote.timestamp,
      deviceFingerprint: vote.device_fingerprint,
      ipAddress: vote.ip_address,
      userAgent: vote.user_agent,
      signature: vote.signature,
      integrityStatus: intact ? 'INTACT' : 'TAMPERED',
    };
  });

  const tamperedVotes = voteIntegrity.filter(v => v.integrityStatus === 'TAMPERED');

  // Audit log for this widget
  const auditEntries = auditLog.getLogForResource('vote', widgetId);

  // Chain integrity
  const chainResult = auditLog.verifyChain();

  // Evidence payload
  const evidencePayload = {
    reportId,
    generatedAt,
    requestedBy,
    widget: {
      id: widget.id,
      name: widget.name,
      owner: widget.owner,
      createdAt: widget.created_at,
    },
    summary: {
      totalVotes: votes.length,
      intactVotes: voteIntegrity.filter(v => v.integrityStatus === 'INTACT').length,
      tamperedVotes: tamperedVotes.length,
      auditChainIntact: chainResult.valid,
      auditEntriesChecked: chainResult.checkedEntries,
    },
    votes: voteIntegrity,
    auditLog: auditEntries,
    chainVerification: chainResult,
  };

  // Hash the entire payload for the certificate
  const payloadHash = cryptoSvc.sha256(JSON.stringify(evidencePayload));

  // HMAC seal – proves the certificate was issued by this system
  const seal = cryptoSvc.hmacSign(
    `${reportId}|${generatedAt}|${payloadHash}`,
    config.auditLog.secret,
  );

  const certificate = {
    version: '1.0',
    reportId,
    generatedAt,
    requestedBy,
    widgetId,
    payloadHash,
    seal,
    integrityStatement: tamperedVotes.length === 0 && chainResult.valid
      ? 'ALL_RECORDS_INTACT'
      : 'INTEGRITY_VIOLATIONS_DETECTED',
  };

  // Log the evidence generation event
  auditLog.append({
    action: 'EVIDENCE_PACKAGE_GENERATED',
    actor: requestedBy,
    resourceType: 'widget',
    resourceId: widgetId,
    data: { reportId, payloadHash, integrityStatement: certificate.integrityStatement },
  });

  return {
    certificate,
    evidence: evidencePayload,
  };
}

/**
 * Verify an existing evidence certificate.
 * Checks the HMAC seal to confirm the certificate was issued by this system
 * and was not modified since issuance.
 *
 * @param {object} certificate – the certificate object from a previously generated package
 * @param {object} evidence    – the evidence payload from the same package
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyCertificate(certificate, evidence) {
  const recomputedHash = cryptoSvc.sha256(JSON.stringify(evidence));
  if (recomputedHash !== certificate.payloadHash) {
    return { valid: false, reason: 'Evidence payload hash mismatch – data was modified' };
  }

  const sealInput = `${certificate.reportId}|${certificate.generatedAt}|${certificate.payloadHash}`;
  const sealValid = cryptoSvc.hmacVerify(sealInput, certificate.seal, config.auditLog.secret);
  if (!sealValid) {
    return { valid: false, reason: 'Certificate seal invalid – certificate was tampered with' };
  }

  return { valid: true };
}

module.exports = {
  generateEvidencePackage,
  verifyCertificate,
};
