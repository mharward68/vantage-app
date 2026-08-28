-- =====================================================================
-- STATUS: FOSSIL — NOT PART OF VANTAGE. DO NOT RUN. DO NOT TRUST.
--
-- Vantage has no SQL database and never has had one. It is an
-- offline-first PWA whose entire state is a single JSON blob in
-- localStorage (key: vantage_prm_database), with binary attachments in
-- IndexedDB (store: VantagePRMFiles). From Phase 2 the store becomes
-- Firestore -- still not SQL. See ai/DECLARATIONS.md.
--
-- The Prospect and Company TABLES that this script ALTERs DO NOT EXIST
-- and never did. This file is a leftover from an abandoned SQL
-- direction, retained only as history. An agent reading it cold would
-- conclude there is a relational schema here. There is not.
--
-- Some of the fields below did ship -- as plain properties on the JSON
-- records, not as columns (e.g. prospect.linkedin, company.employees,
-- company.industry). Others never did, and at least one named here
-- (EmployeeRange) was subsequently removed. The column list is NOT a
-- reliable index of the real record shape. Read app.js for that.
--
-- Marked 2026-08-28 during the Phase 0 retrofit. Safe to delete.
-- =====================================================================

-- SQL Migration Script: SaaS CRM Database Updates

-- 1. Update the Prospect Table Schema
-- Adding LinkedIn profile URL and Metro area location field.
ALTER TABLE Prospect
ADD COLUMN LinkedIn VARCHAR(255) DEFAULT NULL,
ADD COLUMN Metro VARCHAR(255) DEFAULT NULL;

-- 2. Update the Company Table Schema
-- Adding Employee Range, Company Specialities, and Company Headquarters.
-- We also include Employees and Company Description for completeness.
ALTER TABLE Company
ADD COLUMN Employees INT DEFAULT NULL,
ADD COLUMN EmployeeRange VARCHAR(100) DEFAULT NULL,
ADD COLUMN CompanyDescription TEXT DEFAULT NULL,
ADD COLUMN CompanySpecialities TEXT DEFAULT NULL,
ADD COLUMN CompanyHeadquarters VARCHAR(255) DEFAULT NULL;
