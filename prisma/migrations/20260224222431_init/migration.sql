-- CreateTable
CREATE TABLE "Shipper" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Consignee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vat" TEXT,
    "eori" TEXT,
    "bin" TEXT,
    "usci" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notify" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "vat" TEXT,
    "eori" TEXT,
    "bin" TEXT,
    "usci" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AlsoNotify" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Forwarder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FreightBuyer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Goods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT NOT NULL,
    "hsCode" TEXT NOT NULL,
    "declNo" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Port" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "TypeReleased" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BillOfLading" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingNumber" TEXT NOT NULL,
    "contractNumber" TEXT NOT NULL,
    "saveStatus" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "typeReleasedId" TEXT,
    "portId" TEXT,
    "cityId" TEXT,
    "shipperId" TEXT,
    "consigneeId" TEXT,
    "notifyId" TEXT,
    "alsoNotifyId" TEXT,
    "forwarderId" TEXT,
    "freightBuyerId" TEXT,
    "goodsId" TEXT,
    CONSTRAINT "BillOfLading_typeReleasedId_fkey" FOREIGN KEY ("typeReleasedId") REFERENCES "TypeReleased" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_portId_fkey" FOREIGN KEY ("portId") REFERENCES "Port" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "Shipper" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_consigneeId_fkey" FOREIGN KEY ("consigneeId") REFERENCES "Consignee" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_notifyId_fkey" FOREIGN KEY ("notifyId") REFERENCES "Notify" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_alsoNotifyId_fkey" FOREIGN KEY ("alsoNotifyId") REFERENCES "AlsoNotify" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_forwarderId_fkey" FOREIGN KEY ("forwarderId") REFERENCES "Forwarder" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_freightBuyerId_fkey" FOREIGN KEY ("freightBuyerId") REFERENCES "FreightBuyer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BillOfLading_goodsId_fkey" FOREIGN KEY ("goodsId") REFERENCES "Goods" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Container" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "containerNum" TEXT NOT NULL,
    "typeTc" TEXT NOT NULL,
    "sealNum" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "packageType" TEXT NOT NULL,
    "grossWeight" REAL NOT NULL,
    "netWeight" REAL NOT NULL,
    "volume" REAL NOT NULL,
    "billOfLadingId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Container_billOfLadingId_fkey" FOREIGN KEY ("billOfLadingId") REFERENCES "BillOfLading" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
