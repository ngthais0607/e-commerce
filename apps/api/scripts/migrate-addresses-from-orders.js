/**
 * Script to migrate shipping addresses from orders table to addresses table
 * This script extracts shipping addresses from existing orders and creates
 * corresponding entries in the addresses table if they don't already exist.
 * 
 * Usage: node apps/api/scripts/migrate-addresses-from-orders.js
 */

import { query, execute } from '../src/config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateAddresses() {
  try {
    console.log('🔄 Starting address migration from orders...');

    // Get all orders with shipping addresses
    const orders = await query(
      `SELECT id, clientId, shippingAddress, phone 
       FROM orders 
       WHERE shippingAddress IS NOT NULL 
       AND shippingAddress != '' 
       AND shippingAddress != 'null'`
    );

    console.log(`📦 Found ${orders.length} orders with shipping addresses`);

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const order of orders) {
      try {
        // Parse shipping address (it's stored as JSON string)
        let shippingAddress;
        try {
          shippingAddress = typeof order.shippingAddress === 'string' 
            ? JSON.parse(order.shippingAddress) 
            : order.shippingAddress;
        } catch (parseError) {
          console.error(`❌ Failed to parse address for order ${order.id}:`, parseError.message);
          errors++;
          continue;
        }

        if (!shippingAddress || !shippingAddress.name || !shippingAddress.address) {
          skipped++;
          continue;
        }

        // Check if address already exists
        const [existingAddresses] = await query(
          `SELECT * FROM addresses 
           WHERE clientId = ? 
           AND name = ? 
           AND phone = ? 
           AND address = ? 
           AND city = ? 
           AND district = ? 
           AND ward = ?`,
          [
            order.clientId,
            shippingAddress.name,
            shippingAddress.phone || order.phone,
            shippingAddress.address,
            shippingAddress.city || '',
            shippingAddress.district || '',
            shippingAddress.ward || '',
          ]
        );

        // If address doesn't exist, create it
        if (!existingAddresses || existingAddresses.length === 0) {
          await execute(
            `INSERT INTO addresses (clientId, name, phone, address, city, district, ward, postalCode, isDefault, createdAt, updatedAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(), NOW())`,
            [
              order.clientId,
              shippingAddress.name,
              shippingAddress.phone || order.phone,
              shippingAddress.address,
              shippingAddress.city || '',
              shippingAddress.district || '',
              shippingAddress.ward || '',
              shippingAddress.postalCode || null,
            ]
          );
          created++;
          console.log(`✅ Created address for order ${order.id} (user ${order.clientId})`);
        } else {
          skipped++;
          console.log(`⏭️  Address already exists for order ${order.id}`);
        }
      } catch (error) {
        console.error(`❌ Error processing order ${order.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Created: ${created} addresses`);
    console.log(`   ⏭️  Skipped: ${skipped} (already exist or invalid)`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`\n✨ Migration completed!`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrateAddresses();

