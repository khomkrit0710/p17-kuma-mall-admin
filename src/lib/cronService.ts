import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


async function updateFlashSaleStatus() {
  try {
    // console.log('[Cron] Running update flash sale status job...');

    const allFlashSales = await prisma.flash_sale.findMany();

    const result = {
      total: allFlashSales.length,
      pendingToActive: 0,
      activeToExpired: 0,
      noChange: 0,
      errors: 0,
    };

    const now = new Date();
    
    for (const flashSale of allFlashSales) {
      try {
        const startDate = new Date(flashSale.start_date);
        const endDate = new Date(flashSale.end_date);
        let newStatus = flashSale.status;

        if (now > endDate && flashSale.status !== "expired") {
          newStatus = "expired";
          result.activeToExpired++;
        }

        else if (now >= startDate && now <= endDate && flashSale.status === "pending") {
          newStatus = "active";
          result.pendingToActive++;
        }

        else {
          result.noChange++;
          continue;
        }

        await prisma.flash_sale.update({
          where: { id: flashSale.id },
          data: { status: newStatus }
        });
        
      } catch (error) {
        result.errors++;
        console.error(`Error updating flash sale ID ${flashSale.id}:`, error);
      }
    }

    // console.log('[Cron] Update flash sale status complete:', result);
    return result;
  } catch (error) {
    console.error('[Cron] Error updating flash sale statuses:', error);
    throw error;
  }
}


async function updateSoldOutFlashSales() {
  try {
    // console.log('[Cron] Running update sold out flash sales job...');

    const soldOutFlashSales = await prisma.flash_sale.findMany({
      where: {
        status: "active",
        quantity: {
          lte: 0
        }
      }
    });

    const result = {
      total: soldOutFlashSales.length,
      updatedToSoldOut: 0,
      errors: 0,
    };

    for (const flashSale of soldOutFlashSales) {
      try {
        await prisma.flash_sale.update({
          where: { id: flashSale.id },
          data: { status: "sold_out" }
        });
        
        result.updatedToSoldOut++;
      } catch (error) {
        result.errors++;
        console.error(`Error updating sold out flash sale ID ${flashSale.id}:`, error);
      }
    }

    // console.log('[Cron] Update sold out flash sales complete:', result);
    return result;
  } catch (error) {
    console.error('[Cron] Error updating sold out flash sales:', error);
    throw error;
  }
}


export function startAllCronJobs() {

  cron.schedule('*/1 * * * *', async () => {
    try {
      await updateFlashSaleStatus();
      await updateSoldOutFlashSales();
    } catch (error) {
      console.error('Error running cron jobs:', error);
    }
  });
  
  // console.log('Flash Sale cron jobs scheduled to run every 5 minutes');
}


export async function runFlashSaleUpdates() {
  try {
    const statusResult = await updateFlashSaleStatus();
    const soldOutResult = await updateSoldOutFlashSales();
    return { statusResult, soldOutResult };
  } catch (error) {
    console.error('Error manually running Flash Sale updates:', error);
    throw error;
  }
}