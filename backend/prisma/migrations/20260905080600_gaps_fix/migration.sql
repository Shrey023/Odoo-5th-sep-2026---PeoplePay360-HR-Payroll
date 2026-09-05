/*
  Warnings:

  - The `percentBase` column on the `SalaryRule` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `role` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `company` on the `WorkingSchedule` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PercentBase" AS ENUM ('CONTRACT_WAGE', 'BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION');

-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "departmentId" UUID,
ADD COLUMN     "employeeType" "EmployeeType" NOT NULL DEFAULT 'FULL_TIME',
ADD COLUMN     "jobPosition" TEXT;

-- AlterTable
ALTER TABLE "Department" ADD COLUMN     "companyId" UUID;

-- AlterTable
ALTER TABLE "Employee" ADD COLUMN     "companyId" UUID;

-- AlterTable
ALTER TABLE "Payrun" ADD COLUMN     "employeeType" "EmployeeType";

-- AlterTable
ALTER TABLE "SalaryRule" DROP COLUMN "percentBase",
ADD COLUMN     "percentBase" "PercentBase";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "roles" "UserRole"[] DEFAULT ARRAY['EMPLOYEE']::"UserRole"[];

-- AlterTable
ALTER TABLE "WorkingSchedule" DROP COLUMN "company",
ADD COLUMN     "companyId" UUID,
ADD COLUMN     "daysPerWeek" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "weeklyHours" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Company" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Company_name_key" ON "Company"("name");

-- CreateIndex
CREATE INDEX "Contract_departmentId_idx" ON "Contract"("departmentId");

-- CreateIndex
CREATE INDEX "Employee_companyId_idx" ON "Employee"("companyId");

-- AddForeignKey
ALTER TABLE "Department" ADD CONSTRAINT "Department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkingSchedule" ADD CONSTRAINT "WorkingSchedule_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department"("id") ON DELETE SET NULL ON UPDATE CASCADE;
