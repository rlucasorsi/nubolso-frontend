export type ImportBatchStatus = 'PENDING_REVIEW' | 'CONFIRMED' | 'CANCELED' | 'ROLLED_BACK';
export type ImportItemStatus = 'NEW' | 'DUPLICATE_EXACT' | 'POSSIBLE_DUPLICATE';
export type ImportItemDecision = 'IMPORT' | 'SKIP';

export interface ImportBatch {
  id: string;
  fileName: string;
  bankId: string | null;
  acctId: string | null;
  status: ImportBatchStatus;
  totalCount: number;
  newCount: number;
  duplicateExactCount: number;
  possibleDuplicateCount: number;
  importedCount: number;
  createdAt: string;
  confirmedAt: string | null;
}

export interface ImportBatchItem {
  id: string;
  batchId: string;
  fitId: string | null;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE' | 'SPENDING';
  date: string;
  status: ImportItemStatus;
  matchedTransactionId: string | null;
  similarityScore: number | null;
  decision: ImportItemDecision | null;
  matchedTransaction?: {
    id: string;
    description: string;
    amount: number;
    date: string;
  } | null;
}

export interface ImportBatchDetail extends ImportBatch {
  items: ImportBatchItem[];
}

export interface UploadOfxResponse extends ImportBatchDetail {
  parseErrors: string[];
}

export interface ConfirmImportDecision {
  itemId: string;
  action: ImportItemDecision;
}

export interface ConfirmImportRequest {
  decisions: ConfirmImportDecision[];
}
