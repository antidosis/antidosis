-- Mesh store: optional seller-defined highlight chips on listings
ALTER TABLE "mesh_products"
  ADD COLUMN "highlights" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
