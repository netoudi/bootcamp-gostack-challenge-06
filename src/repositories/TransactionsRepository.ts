import { EntityRepository, getRepository, Repository } from 'typeorm';

import Transaction from '../models/Transaction';

interface Balance {
  income: number;
  outcome: number;
  total: number;
}

@EntityRepository(Transaction)
class TransactionsRepository extends Repository<Transaction> {
  public all(): Promise<Transaction[]> {
    return this.find();
  }

  public async getBalance(): Promise<Balance> {
    const income = await this.find({ where: { type: 'income' } });
    const outcome = await this.find({ where: { type: 'outcome' } });

    const incomeTotal = income.reduce((acc, cur) => {
      return acc + Number(cur.value);
    }, 0);

    const outcomeTotal = outcome.reduce((acc, cur) => {
      return acc + Number(cur.value);
    }, 0);

    return {
      income: incomeTotal,
      outcome: outcomeTotal,
      total: incomeTotal - outcomeTotal,
    };
  }
}

export default TransactionsRepository;
