import { INITIAL_PRODUCTS } from '../data/products';
import { prisma } from './prisma';
import { hashPassword } from './auth';
import { normalizeProductForDb } from './products';

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@techseller.app';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

const slugify = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const seedDatabase = async () => {
  const adminUser = await prisma.adminUser.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      name: 'Admin',
      role: 'admin'
    },
    create: {
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: await hashPassword(ADMIN_PASSWORD),
      role: 'admin'
    }
  });

  const categories = new Map<string, { id: string }>();
  for (const product of INITIAL_PRODUCTS) {
    const categoryName = product.category || 'Laptops';
    if (!categories.has(categoryName)) {
      const category = await prisma.category.upsert({
        where: { name: categoryName },
        update: {},
        create: {
          name: categoryName,
          slug: slugify(categoryName)
        }
      });
      categories.set(categoryName, { id: category.id });
    }
  }

  const productCount = await prisma.product.count();
  if (productCount === 0) {
    for (const product of INITIAL_PRODUCTS) {
      const categoryId = categories.get(product.category || 'Laptops')?.id ?? null;
      const payload = normalizeProductForDb({
        name: product.name,
        description: product.description,
        categoryId,
        price: product.price,
        discountPrice: product.discountPrice ?? null,
        stock: product.stock,
        costPrice: 0,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        sales: product.sales,
        image: product.image || '',
        specs: product.specs ?? {},
        tags: product.tags ?? [],
        additionalImages: product.additionalImages ?? [],
        colors: product.colors ?? [],
        sizes: product.sizes ?? [],
        collection: product.collection ?? null
      });

      await prisma.product.create({ data: payload });
    }
  }

  return { adminUser, seededProducts: productCount === 0 ? INITIAL_PRODUCTS.length : 0 };
};
