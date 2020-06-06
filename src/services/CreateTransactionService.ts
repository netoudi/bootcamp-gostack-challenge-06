import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';
import CategoriesRepository from '../repositories/CategoriesRepository';

interface RequestDTO {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  private categoriesRepository: CategoriesRepository;

  private transactionsRepository: TransactionsRepository;

  constructor() {
    this.categoriesRepository = getCustomRepository(CategoriesRepository);
    this.transactionsRepository = getCustomRepository(TransactionsRepository);
  }

  public async execute({
    title,
    value,
    type,
    category,
  }: RequestDTO): Promise<Transaction> {
    const balance = await this.transactionsRepository.getBalance();

    if (type === 'outcome' && value > balance.total) {
      throw new AppError("Ops! You don't have balance enough.");
    }

    const categorySelected = await this.categoriesRepository.findByTitle(
      category,
    );

    const transaction = this.transactionsRepository.create({
      title,
      value,
      type,
      category_id: categorySelected.id,
    });

    await this.transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
