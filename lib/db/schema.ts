import {
  pgTable,
  text,
  timestamp,
  boolean,
  serial,
  integer,
  numeric,
  date,
  unique,
} from 'drizzle-orm/pg-core'

// --- Better Auth required tables ---
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('emailVerified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expiresAt').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  ipAddress: text('ipAddress'),
  userAgent: text('userAgent'),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
})

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('accountId').notNull(),
  providerId: text('providerId').notNull(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('accessToken'),
  refreshToken: text('refreshToken'),
  idToken: text('idToken'),
  accessTokenExpiresAt: timestamp('accessTokenExpiresAt'),
  refreshTokenExpiresAt: timestamp('refreshTokenExpiresAt'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expiresAt').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
})

// --- App tables ---
export const members = pgTable('members', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  joinedAt: date('joinedAt').notNull(),
  openingAmountInHand: numeric('openingAmountInHand', { precision: 12, scale: 2 })
    .notNull()
    .default('0'),
  openingBalanceOfCredit: numeric('openingBalanceOfCredit', {
    precision: 12,
    scale: 2,
  })
    .notNull()
    .default('0'),
  isActive: boolean('isActive').notNull().default(true),
  createdAt: timestamp('createdAt').notNull().defaultNow(),
  updatedAt: timestamp('updatedAt').notNull().defaultNow(),
})

export const monthlyRecords = pgTable(
  'monthly_records',
  {
    id: serial('id').primaryKey(),
    userId: text('userId').notNull(),
    memberId: integer('memberId').notNull(),
    year: integer('year').notNull(),
    month: integer('month').notNull(),
    monthlyFee: numeric('monthlyFee', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    loanReturned: numeric('loanReturned', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    loanIssued: numeric('loanIssued', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    remarks: text('remarks'),
    amountInHand: numeric('amountInHand', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    balanceOfCredit: numeric('balanceOfCredit', { precision: 12, scale: 2 })
      .notNull()
      .default('0'),
    createdAt: timestamp('createdAt').notNull().defaultNow(),
    updatedAt: timestamp('updatedAt').notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.memberId, t.year, t.month)]
)

export type Member = typeof members.$inferSelect
export type NewMember = typeof members.$inferInsert
export type MonthlyRecord = typeof monthlyRecords.$inferSelect
export type NewMonthlyRecord = typeof monthlyRecords.$inferInsert
