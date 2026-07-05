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
