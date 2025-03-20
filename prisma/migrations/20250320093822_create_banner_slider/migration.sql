-- CreateTable
CREATE TABLE "banner_silder" (
    "id" SERIAL NOT NULL,
    "create_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "update_date" TIMESTAMP(3) NOT NULL,
    "logo_main" TEXT,
    "popup_normolly" TEXT,
    "banner_login_register" TEXT,
    "banner_slider_homepage" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "banner_coupon_homepage_sec_1" TEXT,
    "banner_coupon_homepage_sec_2" TEXT,
    "banner_coupon_homepage_body" TEXT,

    CONSTRAINT "banner_silder_pkey" PRIMARY KEY ("id")
);
