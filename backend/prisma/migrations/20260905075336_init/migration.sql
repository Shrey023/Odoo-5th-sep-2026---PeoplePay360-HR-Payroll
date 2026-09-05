-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "EmployeeStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "EmployeeType" AS ENUM ('FULL_TIME', 'CONTRACTOR', 'INTERN');

-- CreateEnum
CREATE TYPE "ContractStatus" AS ENUM ('DRAFT', 'RUNNING', 'EXPIRED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'LATE', 'ABSENT', 'OVERTIME');

-- CreateEnum
CREATE TYPE "LeaveUnit" AS ENUM ('DAYS', 'HOURS');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('DRAFT', 'TO_APPROVE', 'APPROVED', 'REFUSED');

-- CreateEnum
CREATE TYPE "AllocationStatus" AS ENUM ('DRAFT', 'APPROVED', 'REFUSED');

-- CreateEnum
CREATE TYPE "RuleCategory" AS ENUM ('BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET');

-- CreateEnum
CREATE TYPE "ComputeType" AS ENUM ('FIXED', 'PERCENTAGE', 'FORMULA');

-- CreateEnum
CREATE TYPE "PayrunStatus" AS ENUM ('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID');

-- CreateEnum
CREATE TYPE "PayslipStatus" AS ENUM ('DRAFT', 'COMPUTED', 'VALIDATED', 'PAID');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Department" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Department_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkingSchedule" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "calendarType" TEXT NOT NULL DEFAULT 'Standard',
    "company" TEXT NOT NULL DEFAULT 'PeoplePay360',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkingSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScheduleLine" (
    "id" UUID NOT NULL,
    "scheduleId" UUID NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,

    CONSTRAINT "ScheduleLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "workEmail" TEXT NOT NULL,
    "jobPosition" TEXT NOT NULL,
    "employeeType" "EmployeeType" NOT NULL DEFAULT 'FULL_TIME',
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "bankAccount" TEXT,
    "departmentId" UUID,
    "managerId" UUID,
    "scheduleId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contract" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "employeeId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "wage" DECIMAL(12,2) NOT NULL,
    "status" "ContractStatus" NOT NULL DEFAULT 'DRAFT',
    "structureId" UUID,
    "scheduleId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contract_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attendance" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "checkIn" TIMESTAMP(3) NOT NULL,
    "checkOut" TIMESTAMP(3),
    "workedHours" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "status" "AttendanceStatus" NOT NULL DEFAULT 'PRESENT',
    "manualEdit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffType" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "unit" "LeaveUnit" NOT NULL DEFAULT 'DAYS',
    "requiresAllocation" BOOLEAN NOT NULL DEFAULT true,
    "approvalRequired" BOOLEAN NOT NULL DEFAULT true,
    "color" TEXT NOT NULL DEFAULT '#1971c2',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeOffType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "typeId" UUID NOT NULL,
    "amount" DECIMAL(6,2) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "status" "AllocationStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeOffRequest" (
    "id" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "typeId" UUID NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "duration" DECIMAL(6,2) NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TimeOffRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryStructure" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EmployeeStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryStructure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalaryRule" (
    "id" UUID NOT NULL,
    "structureId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "category" "RuleCategory" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "computeType" "ComputeType" NOT NULL DEFAULT 'FIXED',
    "amount" DECIMAL(12,2),
    "percent" DECIMAL(6,3),
    "percentBase" "RuleCategory",
    "expression" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalaryRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payrun" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "structureId" UUID NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" "PayrunStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payrun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payslip" (
    "id" UUID NOT NULL,
    "payrunId" UUID NOT NULL,
    "employeeId" UUID NOT NULL,
    "contractId" UUID,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "workedDays" DECIMAL(6,2) NOT NULL DEFAULT 0,
    "gross" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "deductions" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "net" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "PayslipStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payslip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayslipLine" (
    "id" UUID NOT NULL,
    "payslipId" UUID NOT NULL,
    "ruleCode" TEXT NOT NULL,
    "ruleName" TEXT NOT NULL,
    "category" "RuleCategory" NOT NULL,
    "sequence" INTEGER NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "PayslipLine_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "Department_name_key" ON "Department"("name");

-- CreateIndex
CREATE INDEX "ScheduleLine_scheduleId_idx" ON "ScheduleLine"("scheduleId");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_workEmail_key" ON "Employee"("workEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "Employee_departmentId_idx" ON "Employee"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_status_idx" ON "Employee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Contract_reference_key" ON "Contract"("reference");

-- CreateIndex
CREATE INDEX "Contract_employeeId_idx" ON "Contract"("employeeId");

-- CreateIndex
CREATE INDEX "Contract_status_idx" ON "Contract"("status");

-- CreateIndex
CREATE INDEX "Attendance_employeeId_idx" ON "Attendance"("employeeId");

-- CreateIndex
CREATE INDEX "Attendance_checkIn_idx" ON "Attendance"("checkIn");

-- CreateIndex
CREATE UNIQUE INDEX "TimeOffType_name_key" ON "TimeOffType"("name");

-- CreateIndex
CREATE INDEX "Allocation_employeeId_idx" ON "Allocation"("employeeId");

-- CreateIndex
CREATE INDEX "Allocation_typeId_idx" ON "Allocation"("typeId");

-- CreateIndex
CREATE INDEX "TimeOffRequest_employeeId_idx" ON "TimeOffRequest"("employeeId");

-- CreateIndex
CREATE INDEX "TimeOffRequest_typeId_idx" ON "TimeOffRequest"("typeId");

-- CreateIndex
CREATE INDEX "TimeOffRequest_status_idx" ON "TimeOffRequest"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryStructure_name_key" ON "SalaryStructure"("name");

-- CreateIndex
CREATE INDEX "SalaryRule_structureId_sequence_idx" ON "SalaryRule"("structureId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "SalaryRule_structureId_code_key" ON "SalaryRule"("structureId", "code");

-- CreateIndex
CREATE INDEX "Payrun_status_idx" ON "Payrun"("status");

-- CreateIndex
CREATE INDEX "Payslip_employeeId_idx" ON "Payslip"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrunId_employeeId_key" ON "Payslip"("payrunId", "employeeId");

-- CreateIndex
CREATE INDEX "PayslipLine_payslipId_idx" ON "PayslipLine"("payslipId");

-- AddForeignKey
ALTER TABLE "ScheduleLine" ADD CONSTRAINT "ScheduleLine_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "WorkingSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "WorkingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "WorkingSchedule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attendance" ADD CONSTRAINT "Attendance_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TimeOffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeOffRequest" ADD CONSTRAINT "TimeOffRequest_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "TimeOffType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalaryRule" ADD CONSTRAINT "SalaryRule_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payrun" ADD CONSTRAINT "Payrun_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "SalaryStructure"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrunId_fkey" FOREIGN KEY ("payrunId") REFERENCES "Payrun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayslipLine" ADD CONSTRAINT "PayslipLine_payslipId_fkey" FOREIGN KEY ("payslipId") REFERENCES "Payslip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
