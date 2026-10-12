ALTER TABLE "order_items" ADD COLUMN "productImageSnapshot" TEXT;

UPDATE "order_items" AS order_item
SET "productImageSnapshot" = COALESCE(
	NULLIF(order_item."variantSnapshot" ->> 'ColorImageUrl', ''),
	(
		SELECT product_image."url"
		FROM "product_skus" AS product_sku
		JOIN "product_images" AS product_image ON product_image."productId" = product_sku."productId"
		WHERE product_sku."id" = order_item."skuId"
		ORDER BY product_image."sortOrder" ASC, product_image."createdAt" ASC
		LIMIT 1
	)
)
WHERE order_item."skuId" IS NOT NULL;