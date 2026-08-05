import { ChannelAccount, ChannelListing, ChannelSyncJob, Product, Order, CustomerProfile } from '../../types';
import { updateEBayListingQuantity } from './ebayApiClient';

export function autoExtractHardwareItemSpecifics(product: Product): Record<string, string> {
  const specs: Record<string, string> = {
    'Brand': product.specs?.brand || 'Dell / Lenovo / HP',
    'MPN': product.specs?.mpn || product.specs?.model || product.id,
    'Condition': product.specs?.condition || 'Refurbished Grade A',
    'Warranty': product.specs?.warranty || '12 Months Warranty'
  };

  if (product.specs?.cpu) specs['Processor'] = product.specs.cpu;
  if (product.specs?.ram) specs['RAM Size'] = product.specs.ram;
  if (product.specs?.storage) specs['SSD / Storage'] = product.specs.storage;
  if (product.specs?.socket) specs['CPU Socket'] = product.specs.socket;
  if (product.specs?.interface) specs['Interface'] = product.specs.interface;
  if (product.specs?.power) specs['Power Rating'] = product.specs.power;

  return specs;
}

export async function protectInventoryRealtime(
  productId: string,
  newStock: number,
  account: ChannelAccount,
  listings: ChannelListing[]
): Promise<ChannelListing[]> {
  const targetListings = listings.filter(l => l.productId === productId || l.sku === productId);

  for (const listing of targetListings) {
    await updateEBayListingQuantity(account, listing.externalListingId, newStock);
  }

  return listings.map(l => {
    if (l.productId === productId || l.sku === productId) {
      return {
        ...l,
        quantity: newStock,
        status: newStock > 0 ? 'Active' : 'Out of Stock',
        lastSyncAt: new Date().toISOString()
      };
    }
    return l;
  });
}

export function createMockSyncJob(accountId: string, jobType: ChannelSyncJob['jobType'], totalItems: number = 25): ChannelSyncJob {
  return {
    id: `JOB-${Date.now()}`,
    accountId,
    jobType,
    status: 'In Progress',
    progressPercent: 15,
    totalItems,
    processedItems: 4,
    failedItems: 0,
    startedAt: new Date().toISOString()
  };
}
