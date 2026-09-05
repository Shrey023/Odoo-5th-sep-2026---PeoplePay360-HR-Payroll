import { z } from 'zod'

export const createStructureSchema = z.object({
  name: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const updateStructureSchema = createStructureSchema.partial()

const ruleBase = z.object({
  name: z.string().min(1),
  code: z.string().min(1).regex(/^[A-Z_]+$/, 'Code must be uppercase letters/underscores'),
  category: z.enum(['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET']),
  sequence: z.coerce.number().int().nonnegative(),
  computeType: z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']),
  amount: z.coerce.number().nonnegative().nullish(),
  percent: z.coerce.number().nonnegative().nullish(),
  percentBase: z.enum(['CONTRACT_WAGE', 'BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION']).nullish(),
  expression: z.string().min(1).nullish(),
})

function checkComputeShape(r: z.infer<typeof ruleBase>, ctx: z.RefinementCtx) {
  if (r.computeType === 'FIXED' && (r.amount === null || r.amount === undefined)) {
    ctx.addIssue({ code: 'custom', message: 'FIXED rule needs an amount', path: ['amount'] })
  }
  if (r.computeType === 'PERCENTAGE') {
    if (r.percent === null || r.percent === undefined) {
      ctx.addIssue({ code: 'custom', message: 'PERCENTAGE rule needs a percent', path: ['percent'] })
    }
    if (!r.percentBase) {
      ctx.addIssue({ code: 'custom', message: 'PERCENTAGE rule needs a base', path: ['percentBase'] })
    }
  }
  if (r.computeType === 'FORMULA' && !r.expression) {
    ctx.addIssue({ code: 'custom', message: 'FORMULA rule needs an expression', path: ['expression'] })
  }
}

export const createRuleSchema = ruleBase.superRefine(checkComputeShape)
export const updateRuleSchema = ruleBase.partial().superRefine((r, ctx) => {
  if (r.computeType) checkComputeShape(r as z.infer<typeof ruleBase>, ctx)
})

export type CreateStructureInput = z.infer<typeof createStructureSchema>
export type UpdateStructureInput = z.infer<typeof updateStructureSchema>
export type CreateRuleInput = z.infer<typeof createRuleSchema>
export type UpdateRuleInput = z.infer<typeof updateRuleSchema>
