-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector" WITH SCHEMA public;
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA public;

-- ENUMs
CREATE TYPE kyc_status_enum AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE account_status_enum AS ENUM ('active', 'blocked');
CREATE TYPE admin_role_enum AS ENUM ('super_admin', 'support');
CREATE TYPE product_status_enum AS ENUM ('active', 'out_of_stock', 'delisted');
CREATE TYPE discount_type_enum AS ENUM ('percentage', 'flat');
CREATE TYPE promo_status_enum AS ENUM ('scheduled', 'active', 'expired');
CREATE TYPE promo_creator_enum AS ENUM ('seller', 'admin');
CREATE TYPE order_status_enum AS ENUM ('placed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE payment_method_enum AS ENUM ('cod');
CREATE TYPE shipping_fee_source_enum AS ENUM ('platform_default', 'manual_override');
CREATE TYPE notification_channel_enum AS ENUM ('whatsapp', 'email');
CREATE TYPE notification_recipient_enum AS ENUM ('seller', 'retailer');
CREATE TYPE notification_status_enum AS ENUM ('sent', 'failed');
CREATE TYPE setting_value_type_enum AS ENUM ('fixed', 'percentage', 'text');
