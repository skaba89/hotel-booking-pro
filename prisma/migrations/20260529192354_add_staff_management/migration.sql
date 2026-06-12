-- CreateEnum
CREATE TYPE "StaffDepartment" AS ENUM ('HOUSEKEEPING', 'RECEPTION', 'RESTAURANT', 'KITCHEN', 'MAINTENANCE', 'SECURITY', 'MANAGEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "ShiftStatus" AS ENUM ('SCHEDULED', 'COMPLETED', 'ABSENT', 'CANCELLED');

-- CreateTable
CREATE TABLE "staff_members" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "department" "StaffDepartment" NOT NULL DEFAULT 'HOUSEKEEPING',
    "position" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "hire_date" DATE,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_shifts" (
    "id" TEXT NOT NULL,
    "staff_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "area" TEXT,
    "status" "ShiftStatus" NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_shifts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_members_department_idx" ON "staff_members"("department");

-- CreateIndex
CREATE INDEX "staff_members_is_active_idx" ON "staff_members"("is_active");

-- CreateIndex
CREATE INDEX "staff_shifts_date_idx" ON "staff_shifts"("date");

-- CreateIndex
CREATE INDEX "staff_shifts_staff_id_date_idx" ON "staff_shifts"("staff_id", "date");

-- AddForeignKey
ALTER TABLE "staff_shifts" ADD CONSTRAINT "staff_shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "staff_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;
