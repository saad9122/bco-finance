export type RecordInputs = {
  monthlyFee: number
  loanReturned: number
  loanIssued: number
}

export type CalculatedRecord = RecordInputs & {
  amountInHand: number
  balanceOfCredit: number
}

export type ChronologicalRecord = {
  id?: number
  year: number
  month: number
  monthlyFee: number
  loanReturned: number
  loanIssued: number
  amountInHand: number
  balanceOfCredit: number
}

export function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  const n = typeof value === 'number' ? value : parseFloat(value)
  return isNaN(n) ? 0 : n
}

export function getPreviousMonth(year: number, month: number) {
  if (month === 1) return { year: year - 1, month: 12 }
  return { year, month: month - 1 }
}

export function compareYearMonth(
  a: { year: number; month: number },
  b: { year: number; month: number }
) {
  if (a.year !== b.year) return a.year - b.year
  return a.month - b.month
}

export function getPreviousBalanceOfCredit(
  priorRecord: { balanceOfCredit: string | number } | null | undefined,
  memberOpeningBalance: string | number
): number {
  if (priorRecord) return parseAmount(priorRecord.balanceOfCredit)
  return parseAmount(memberOpeningBalance)
}

export function getPreviousAmountInHand(
  priorRecord: { amountInHand: string | number } | null | undefined,
  memberOpeningAmount: string | number
): number {
  if (priorRecord) return parseAmount(priorRecord.amountInHand)
  return parseAmount(memberOpeningAmount)
}

export function computeRecord(
  inputs: RecordInputs,
  prevAmountInHand: number,
  prevBalanceOfCredit: number
): CalculatedRecord {
  return {
    ...inputs,
    amountInHand: prevAmountInHand + inputs.monthlyFee,
    balanceOfCredit:
      prevBalanceOfCredit + inputs.loanIssued - inputs.loanReturned,
  }
}

export function computeRecordPreview(
  inputs: RecordInputs,
  priorRecord: { amountInHand: string; balanceOfCredit: string } | null,
  openingAmountInHand: string,
  openingBalanceOfCredit: string
) {
  const prevAIH = getPreviousAmountInHand(priorRecord, openingAmountInHand)
  const prevBOC = getPreviousBalanceOfCredit(
    priorRecord,
    openingBalanceOfCredit
  )
  const calculated = computeRecord(inputs, prevAIH, prevBOC)
  return {
    previousBalanceOfCredit: prevBOC,
    ...calculated,
  }
}

export function recalculateFromMonth(
  records: ChronologicalRecord[],
  openingAmountInHand: number,
  openingBalanceOfCredit: number,
  fromYear: number,
  fromMonth: number
): ChronologicalRecord[] {
  const sorted = [...records].sort((a, b) =>
    compareYearMonth(a, b)
  )

  const startIndex = sorted.findIndex(
    (r) => r.year === fromYear && r.month === fromMonth
  )
  if (startIndex === -1) return sorted

  let prevAIH: number
  let prevBOC: number

  if (startIndex === 0) {
    prevAIH = openingAmountInHand
    prevBOC = openingBalanceOfCredit
  } else {
    const prior = sorted[startIndex - 1]
    prevAIH = prior.amountInHand
    prevBOC = prior.balanceOfCredit
  }

  for (let i = startIndex; i < sorted.length; i++) {
    const r = sorted[i]
    const calculated = computeRecord(
      {
        monthlyFee: r.monthlyFee,
        loanReturned: r.loanReturned,
        loanIssued: r.loanIssued,
      },
      prevAIH,
      prevBOC
    )
    r.amountInHand = calculated.amountInHand
    r.balanceOfCredit = calculated.balanceOfCredit
    prevAIH = r.amountInHand
    prevBOC = r.balanceOfCredit
  }

  return sorted
}
