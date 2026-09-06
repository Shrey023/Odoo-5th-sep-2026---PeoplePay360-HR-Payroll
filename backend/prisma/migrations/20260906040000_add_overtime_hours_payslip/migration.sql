-- Add overtimeHours to Payslip
ALTER TABLE "Payslip" ADD COLUMN "overtimeHours" DECIMAL(6,2) NOT NULL DEFAULT 0;

-- Drop old unique constraint (payrunId, employeeId)
DROP INDEX IF EXISTS "Payslip_payrunId_employeeId_key";

-- Add new unique constraint (payrunId, employeeId, contractId) to allow multiple payslips per employee per payrun
CREATE UNIQUE INDEX "Payslip_payrunId_employeeId_contractId_key" ON "Payslip"("payrunId", "employeeId", "contractId");
