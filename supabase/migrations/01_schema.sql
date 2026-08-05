-- Admins
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL, -- references auth.users in Supabase
  role admin_role_enum NOT NULL DEFAULT 'support'
);

-- Sellers
CREATE TABLE sellers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID NOT NULL,
  store_name TEXT NOT NULL,
  kyc_status kyc_status_enum NOT NULL DEFAULT 'pending',
  account_status account_status_enum NOT NULL DEFAULT 'active',
  logo_url TEXT,
  description TEXT,
  banner_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- AI Matching Engine Additions
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location geography(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED
);
CREATE INDEX idx_sellers_location ON sellers USING GIST (location);

-- Retailers
CREATE TABLE retailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  account_status account_status_enum NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- AI Matching Engine Additions
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  location geography(Point, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED
);
CREATE INDEX idx_retailers_location ON retailers USING GIST (location);

-- Seller Commissions
CREATE TABLE seller_commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  commission_rate NUMERIC NOT NULL,
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  set_by_admin_id UUID NOT NULL REFERENCES admins(id)
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id)
);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  name TEXT NOT NULL,
  base_price NUMERIC NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  moq INTEGER NOT NULL DEFAULT 1,
  status product_status_enum NOT NULL DEFAULT 'active',
  embedding vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product Variants
CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  variant_name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  stock_qty INTEGER NOT NULL DEFAULT 0
);

-- Product Images
CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Promotions
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES sellers(id),
  product_id UUID REFERENCES products(id),
  discount_type discount_type_enum NOT NULL,
  discount_value NUMERIC NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  status promo_status_enum NOT NULL DEFAULT 'scheduled',
  created_by_type promo_creator_enum NOT NULL,
  created_by_id UUID NOT NULL
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id),
  retailer_id UUID REFERENCES retailers(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wishlists
CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_id UUID NOT NULL REFERENCES retailers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  retailer_id UUID REFERENCES retailers(id),
  is_guest BOOLEAN NOT NULL DEFAULT false,
  guest_name TEXT,
  guest_phone TEXT,
  guest_address TEXT,
  guest_latitude DOUBLE PRECISION,  -- AI Matching Engine Addition
  guest_longitude DOUBLE PRECISION, -- AI Matching Engine Addition
  tracking_number TEXT NOT NULL UNIQUE,
  status order_status_enum NOT NULL DEFAULT 'placed',
  payment_method payment_method_enum NOT NULL DEFAULT 'cod',
  shipping_fee NUMERIC NOT NULL,
  shipping_fee_source shipping_fee_source_enum NOT NULL DEFAULT 'platform_default',
  shipping_fee_set_by UUID REFERENCES admins(id),
  total_amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Order Items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  product_id UUID NOT NULL REFERENCES products(id),
  seller_id UUID NOT NULL REFERENCES sellers(id),
  qty INTEGER NOT NULL,
  unit_price_snapshot NUMERIC NOT NULL
);

-- Order Status History
CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  status order_status_enum NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  changed_by UUID REFERENCES admins(id)
);

-- Notification Logs
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  channel notification_channel_enum NOT NULL,
  recipient_type notification_recipient_enum NOT NULL,
  status notification_status_enum NOT NULL DEFAULT 'sent',
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Platform Settings
CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  setting_key TEXT NOT NULL UNIQUE,
  value_type setting_value_type_enum NOT NULL,
  value TEXT NOT NULL,
  updated_by UUID REFERENCES admins(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI Matching Engine: Seller Metrics
CREATE TABLE seller_metrics (
  seller_id UUID PRIMARY KEY REFERENCES sellers(id),
  avg_rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  fulfillment_hours NUMERIC(8,2) DEFAULT NULL,
  completion_rate NUMERIC(5,4) DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_impressions INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- AI Matching Engine: Seller Boost
CREATE TABLE seller_boost (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES sellers(id) UNIQUE,
  category_id UUID REFERENCES categories(id),
  boost_score NUMERIC(4,2) DEFAULT 15.0,
  impressions_cap INTEGER DEFAULT 500,
  impressions_used INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '14 days',
  is_active BOOLEAN DEFAULT true
);
CREATE INDEX idx_seller_boost_active ON seller_boost (category_id) WHERE is_active = true;
