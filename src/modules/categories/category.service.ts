import { prisma } from '../../config/prisma';

export const categoryService = {
  async listPublicCategories() {
    return prisma.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  },

  async listAdminCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  },

  async createCategory(data: { name: string }) {
    return prisma.category.create({
      data: {
        name: data.name,
      },
    });
  },
};
