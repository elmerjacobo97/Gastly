export type Budget = {
  id: string;
  amount: number;
  month: string;
  category: {
    id: string;
    name: string;
    color: string;
    icon: string;
  };
  spent: number;
};
