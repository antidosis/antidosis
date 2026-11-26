-- AlterTable
ALTER TABLE "mesh_products" ADD COLUMN     "images" TEXT[] DEFAULT ARRAY[]::TEXT[];
