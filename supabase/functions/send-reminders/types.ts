export type DuePayment = {
  user_id: string;
  email: string;
  full_name: string | null;
  description: string;
  amount: number;
  currency: string;
  next_due_on: string;
  days_until: number;
};
