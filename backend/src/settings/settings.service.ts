import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export const DEFAULT_SETTINGS: Record<string, string> = {
  storeName: 'AL-RIZVI',
  storeTagline: 'Islamic Gifting',
  announcementOn: 'true',
  announcementText: 'Share the Barakah — Free shipping over ₹500',
  heroBadge: 'Share the Barakah',
  heroTitle: 'Thoughtful Islamic gifts, curated with love',
  heroQuote: '“Give gifts and you will love one another.”',
  heroImageUrl: '',
  heroCtaLabel: 'Shop the Collection',
  brandStory:
    'We create gifts meant to be felt, remembered and cherished. Each hamper is thoughtfully curated and beautifully presented — turning ordinary moments into lasting, meaningful memories.',
  freeShippingThreshold: '500',
  shippingFee: '49',
  whatsapp: '',
  supportEmail: '',
  supportPhone: '',
  address: '',
  instagram: '',
  facebook: '',
  youtube: '',
};

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  /** Returns defaults merged with stored overrides. */
  async getAll(): Promise<Record<string, string>> {
    const rows = await this.prisma.setting.findMany();
    const merged = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      merged[row.key] = row.value;
    }
    return merged;
  }

  async updateMany(values: Record<string, string>) {
    const entries = Object.entries(values).filter(
      ([, v]) => typeof v === 'string',
    );
    await this.prisma.$transaction(
      entries.map(([key, value]) =>
        this.prisma.setting.upsert({
          where: { key },
          create: { key, value },
          update: { value },
        }),
      ),
    );
    return this.getAll();
  }
}
